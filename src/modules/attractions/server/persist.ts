import { prisma } from "@/lib/prisma";

import type { AttractionInput } from "../schemas";
import { attractionInclude, toDate, toPaise } from "./mapper";

/**
 * The attraction's display base rate = the lowest category base price (matches
 * the "starts from" convention used on the booking cards).
 */
function baseRatePaise(categories: AttractionInput["categories"]): number {
  const prices = categories.map((c) => toPaise(c.basePrice));
  return prices.length ? Math.min(...prices) : 0;
}

/**
 * Create a new attraction with its visitor categories, in one transaction.
 * Attractions created here use CATEGORY booking mode (their own priced rows).
 */
export async function createAttraction(input: AttractionInput) {
  return prisma.attraction.create({
    data: {
      name: input.name,
      type: input.type,
      bookingType: "CATEGORY",
      description: input.description ?? null,
      imageUrl: input.imageUrl,
      isActive: input.isActive,
      openTime: input.openTime ?? null,
      closeTime: input.closeTime ?? null,
      durationMin: input.durationMin ?? null,
      requiresSeats: input.requiresSeats,
      seatLayoutId: input.requiresSeats ? (input.seatLayoutId ?? null) : null,
      baseRatePaise: baseRatePaise(input.categories),
      categories: {
        create: input.categories.map((c, i) => ({
          name: c.name,
          pricePaise: toPaise(c.basePrice),
          futurePricePaise: c.futurePrice != null ? toPaise(c.futurePrice) : null,
          effectiveFrom: toDate(c.effectiveFrom),
          image: c.image ?? null,
          sortOrder: i,
          isActive: true,
        })),
      },
    },
    include: attractionInclude,
  });
}

/**
 * Update an attraction and reconcile its categories:
 *   • rows with an `id` that still exist → updated in place
 *   • rows without an `id` → created
 *   • existing rows no longer present → soft-deleted (isActive=false)
 * All within a single transaction so the card never shows a half-saved state.
 */
export async function updateAttraction(id: string, input: AttractionInput) {
  const keepIds = input.categories
    .map((c) => c.id)
    .filter((v): v is string => !!v);

  return prisma.$transaction(async (tx) => {
    await tx.attraction.update({
      where: { id },
      data: {
        name: input.name,
        type: input.type,
        description: input.description ?? null,
        imageUrl: input.imageUrl,
        isActive: input.isActive,
        openTime: input.openTime ?? null,
        closeTime: input.closeTime ?? null,
        durationMin: input.durationMin ?? null,
        requiresSeats: input.requiresSeats,
        seatLayoutId: input.requiresSeats ? (input.seatLayoutId ?? null) : null,
        baseRatePaise: baseRatePaise(input.categories),
      },
    });

    // Soft-delete categories dropped in the form (preserves booking history FKs).
    await tx.ticketCategory.updateMany({
      where: {
        attractionId: id,
        isActive: true,
        ...(keepIds.length ? { id: { notIn: keepIds } } : {}),
      },
      data: { isActive: false },
    });

    for (let i = 0; i < input.categories.length; i++) {
      const c = input.categories[i];
      const data = {
        name: c.name,
        pricePaise: toPaise(c.basePrice),
        futurePricePaise: c.futurePrice != null ? toPaise(c.futurePrice) : null,
        effectiveFrom: toDate(c.effectiveFrom),
        image: c.image ?? null,
        sortOrder: i,
        isActive: true,
      };
      if (c.id) {
        await tx.ticketCategory.update({ where: { id: c.id }, data });
      } else {
        await tx.ticketCategory.create({
          data: { ...data, attractionId: id },
        });
      }
    }

    return tx.attraction.findUniqueOrThrow({
      where: { id },
      include: attractionInclude,
    });
  });
}
