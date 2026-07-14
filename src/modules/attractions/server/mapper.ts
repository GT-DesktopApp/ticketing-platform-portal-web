import type { Prisma } from "@prisma/client";

import type { AttractionCategory, ManagedAttraction } from "../types";

/** The Prisma include used everywhere the management API loads an attraction. */
export const attractionInclude = {
  categories: {
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  },
} satisfies Prisma.AttractionInclude;

type AttractionWithCategories = Prisma.AttractionGetPayload<{
  include: typeof attractionInclude;
}>;

/** Format a Prisma Date column as a YYYY-MM-DD string (or null). */
function toDateString(d: Date | null): string | null {
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

/** Map a persisted attraction (paise) to the management client shape (rupees). */
export function toManagedAttraction(
  a: AttractionWithCategories,
): ManagedAttraction {
  const categories: AttractionCategory[] = a.categories.map((c) => ({
    id: c.id,
    name: c.name,
    basePrice: c.pricePaise / 100,
    futurePrice: c.futurePricePaise != null ? c.futurePricePaise / 100 : null,
    effectiveFrom: toDateString(c.effectiveFrom),
    image: c.image,
    sortOrder: c.sortOrder,
  }));

  return {
    id: a.id,
    name: a.name,
    type: a.type,
    description: a.description,
    imageUrl: a.imageUrl,
    isActive: a.isActive,
    openTime: a.openTime,
    closeTime: a.closeTime,
    durationMin: a.durationMin,
    categories,
  };
}

/** Rupees → paise (integer), guarding against float artifacts. */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Parse a YYYY-MM-DD string into a UTC Date, or null. */
export function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
