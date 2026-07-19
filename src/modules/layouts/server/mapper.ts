import type { Prisma } from "@prisma/client";

import type { AislePosition, AisleWidth } from "../geometry";
import type { ManagedLayout } from "../types";

/** Prisma include for a layout row + its attraction usage count. */
export const layoutInclude = {
  _count: { select: { attractions: true } },
} satisfies Prisma.SeatLayoutInclude;

type LayoutRow = Prisma.SeatLayoutGetPayload<{ include: typeof layoutInclude }>;

/** Parse the JSON `vipRows` column into a clean number[]. */
function toVipRows(value: Prisma.JsonValue | null): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is number => typeof v === "number");
}

/** Map a persisted seat layout to the client shape. */
export function toManagedLayout(l: LayoutRow): ManagedLayout {
  return {
    id: l.id,
    name: l.name,
    totalSeats: l.totalSeats,
    rows: l.rows,
    columnsLeft: l.columnsLeft,
    columnsRight: l.columnsRight,
    aislePosition: l.aislePosition as AislePosition,
    aisleWidth: l.aisleWidth as AisleWidth,
    vipRows: toVipRows(l.vipRows),
    isCustom: l.isCustom,
    isActive: l.isActive,
    attractionsUsing: l._count.attractions,
    createdAt: l.createdAt.toISOString(),
  };
}
