import { Prisma } from "@prisma/client";

import { created, fail, handleApiError, HttpStatus } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createBookingSchema } from "@/modules/pos/schemas/booking.schema";

/** GST rate applied to non-complimentary bookings (18%). */
const GST_RATE = 0.18;

/** Round a paise amount to the nearest rupee; return [rounded, roundOffDelta]. */
function roundToRupee(paise: number): [number, number] {
  const rounded = Math.round(paise / 100) * 100;
  return [rounded, rounded - paise];
}

/** Generate a human-friendly booking number, e.g. BK-20260625-AB12CD. */
function makeBookingNo(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BK-${ymd}-${rand}`;
}

/**
 * POST /api/bookings — finalize a sale.
 *
 * Atomicity & correctness guarantees:
 *  1. ALL money is recomputed here from authoritative DB prices. The client's
 *     numbers are never trusted (prevents tampering).
 *  2. booking + items + seat assignments + payment are written in ONE
 *     interactive transaction. Any failure rolls the whole thing back.
 *  3. Seat double-booking is prevented by the DB unique constraint on
 *     seat_assignments.seat_id — a concurrent sale grabbing the same seat hits
 *     a P2002 inside the transaction and the whole booking aborts cleanly.
 */
export async function POST(request: Request) {
  try {
    const subject = await requirePermission(PERMISSIONS.BOOKINGS_CREATE);
    const body = await request.json();
    const input = createBookingSchema.parse(body);

    // Load the attraction's categories so we can price from the DB.
    const categories = await prisma.ticketCategory.findMany({
      where: {
        attractionId: input.attractionId,
        id: { in: input.items.map((i) => i.ticketCategoryId) },
      },
    });
    const categoryById = new Map(categories.map((c) => [c.id, c]));

    // Validate every line maps to a real category of this attraction.
    for (const item of input.items) {
      if (!categoryById.has(item.ticketCategoryId)) {
        return fail("One or more ticket categories are invalid for this attraction.", {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }
    }

    // --- Authoritative money computation (paise) ---
    let subtotal = 0;
    const itemRows = input.items.map((item) => {
      const cat = categoryById.get(item.ticketCategoryId)!;
      const lineTotal = cat.pricePaise * item.quantity;
      subtotal += lineTotal;
      return {
        ticketCategoryId: cat.id,
        categoryName: cat.name,
        quantity: item.quantity,
        unitPricePaise: cat.pricePaise,
        lineTotalPaise: lineTotal,
      };
    });

    // Complimentary bookings waive tax + payment entirely.
    const tax = input.isComplimentary ? 0 : Math.round(subtotal * GST_RATE);
    const grossTotal = subtotal + tax;
    const [total, roundOff] = input.isComplimentary
      ? [0, 0]
      : roundToRupee(grossTotal);

    const bookingNo = makeBookingNo();

    // --- Atomic write ---
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          bookingNo,
          attractionId: input.attractionId,
          customerId: input.customerId ?? null,
          status: "CONFIRMED",
          isComplimentary: input.isComplimentary,
          passReference: input.passReference ?? null,
          subtotalPaise: subtotal,
          taxPaise: tax,
          roundOffPaise: roundOff,
          totalPaise: total,
          createdById: subject.userId,
          items: { create: itemRows },
        },
      });

      // Seat assignments + mark seats occupied (if any).
      if (input.seatAssignments.length > 0) {
        await tx.seatAssignment.createMany({
          data: input.seatAssignments.map((s) => ({
            bookingId: booking.id,
            seatId: s.seatId,
            passengerRef: s.passengerRef,
          })),
        });
        await tx.seat.updateMany({
          where: { id: { in: input.seatAssignments.map((s) => s.seatId) } },
          data: { status: "OCCUPIED" },
        });
      }

      // Payment row (skipped for complimentary).
      if (!input.isComplimentary && input.payment) {
        const change = Math.max(0, input.payment.amountPaidPaise - total);
        await tx.payment.create({
          data: {
            bookingId: booking.id,
            method: input.payment.method,
            amountDuePaise: total,
            amountPaidPaise: input.payment.amountPaidPaise,
            changePaise: change,
            status: "COMPLETED",
          },
        });
      }

      // Return the fully-populated booking for the receipt/confirmation screen.
      return tx.booking.findUniqueOrThrow({
        where: { id: booking.id },
        include: { items: true, seatAssignments: true, payment: true, customer: true },
      });
    });

    return created(result, "Booking confirmed.");
  } catch (error) {
    // A seat grabbed concurrently violates the unique seat constraint.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return fail(
        "One or more selected seats were just taken. Please refresh seats and try again.",
        { status: HttpStatus.CONFLICT },
      );
    }
    return handleApiError(error);
  }
}
