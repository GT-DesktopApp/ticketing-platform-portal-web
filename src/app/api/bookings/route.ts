import { Prisma } from "@prisma/client";

import { created, fail, handleApiError, HttpStatus } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createBookingSchema } from "@/modules/pos/schemas/booking.schema";

/** GST rate applied to non-complimentary bookings (18%). */
const GST_RATE = 0.18;

/**
 * Thrown inside the booking transaction when a requested seat is already taken,
 * so the whole booking rolls back and we can return a clean 409 (rather than
 * leaking the raw unique-constraint error).
 */
class SeatTakenError extends Error {
  constructor(public readonly seatNumbers: number[]) {
    super(`Seats already taken: ${seatNumbers.join(", ")}`);
    this.name = "SeatTakenError";
  }
}

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
        return fail(
          "One or more ticket categories are invalid for this attraction.",
          {
            status: HttpStatus.UNPROCESSABLE_ENTITY,
          },
        );
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
    // Keep ONLY the mutations that must succeed-or-fail together inside the
    // transaction; the receipt re-fetch (read-only) runs after commit. This
    // shortens the transaction's critical path so it comfortably clears the
    // interactive-transaction timeout on a remote (Neon) database. The timeout
    // is also raised to absorb network latency across the pooled connection.
    const bookingId = await prisma.$transaction(
      async (tx) => {
        const booking = await tx.booking.create({
          data: {
            bookingNo,
            attractionId: input.attractionId,
            customerId: input.customerId ?? null,
            status: "CONFIRMED",
            isComplimentary: input.isComplimentary,
            passReference: input.passReference ?? null,
            // Complimentary pass details (null for standard bookings).
            passNo: input.complimentary?.passNo ?? null,
            passDate: input.complimentary?.passDate ?? null,
            discountPercent: input.complimentary?.discountPercent ?? null,
            guestName: input.complimentary?.guestName ?? null,
            guestMobile: input.complimentary?.guestMobile ?? null,
            guestDepartment: input.complimentary?.guestDepartment ?? null,
            guestDesignation: input.complimentary?.guestDesignation ?? null,
            compAdultCount: input.complimentary?.adultCount ?? null,
            compChildCount: input.complimentary?.childCount ?? null,
            referenceName: input.complimentary?.referenceName ?? null,
            referenceMobile: input.complimentary?.referenceMobile ?? null,
            referenceDepartment:
              input.complimentary?.referenceDepartment ?? null,
            referenceDesignation:
              input.complimentary?.referenceDesignation ?? null,
            subtotalPaise: subtotal,
            taxPaise: tax,
            roundOffPaise: roundOff,
            totalPaise: total,
            createdById: subject.userId,
            items: { create: itemRows },
          },
          select: { id: true },
        });

        // Seat assignments (layout-derived seats). Occupancy is the set of seat
        // numbers already assigned for this attraction; the DB unique constraint
        // `[attractionId, seatNumber]` is the ultimate no-double-booking guard,
        // but we also re-check here (inside the tx) to fail fast with a clear
        // message before hitting the constraint.
        if (input.seatAssignments.length > 0) {
          const requested = input.seatAssignments.map((s) => s.seatNumber);
          const taken = await tx.seatAssignment.findMany({
            where: {
              attractionId: input.attractionId,
              seatNumber: { in: requested },
            },
            select: { seatNumber: true },
          });
          if (taken.length > 0) {
            // Abort the whole transaction — surfaced as a 409 below.
            throw new SeatTakenError(taken.map((t) => t.seatNumber));
          }

          await tx.seatAssignment.createMany({
            data: input.seatAssignments.map((s) => ({
              bookingId: booking.id,
              attractionId: input.attractionId,
              seatNumber: s.seatNumber,
              seatLabel: s.seatLabel,
              passengerRef: s.passengerRef,
            })),
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

        return booking.id;
      },
      // Remote DB round-trips can exceed Prisma's 5s default; give the whole
      // transaction more headroom (and longer to acquire a pooled connection).
      { timeout: 20_000, maxWait: 10_000 },
    );

    // Read-only fetch for the receipt/confirmation screen — outside the
    // transaction so it never counts against the transaction timeout.
    const result = await prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: {
        items: true,
        seatAssignments: true,
        payment: true,
        customer: true,
      },
    });

    return created(result, "Booking confirmed.");
  } catch (error) {
    // A seat was already taken — either caught by our pre-check
    // (SeatTakenError) or by the DB unique constraint on a concurrent race
    // (P2002). Both surface as a 409 so the client can refresh + retry.
    if (
      error instanceof SeatTakenError ||
      (error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002")
    ) {
      return fail(
        "One or more selected seats were just taken. Please refresh seats and try again.",
        { status: HttpStatus.CONFLICT },
      );
    }
    return handleApiError(error);
  }
}
