import type { Prisma } from "@prisma/client";

import type { SeatLayoutConfig } from "@/modules/pos/types";

/**
 * The `SeatLayout` columns the booking flow needs to render the seat grid. Kept
 * in one place so the attractions list route and the seat-availability route
 * project the layout identically.
 */
export const seatLayoutSelect = {
  id: true,
  name: true,
  totalSeats: true,
  rows: true,
  columnsLeft: true,
  columnsRight: true,
  aislePosition: true,
  aisleWidth: true,
  vipRows: true,
} satisfies Prisma.SeatLayoutSelect;

type SeatLayoutRow = Prisma.SeatLayoutGetPayload<{
  select: typeof seatLayoutSelect;
}>;

/** Coerce the stored `vipRows` JSON into a clean `number[]`. */
function toVipRows(value: Prisma.JsonValue | null): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is number => typeof v === "number");
}

/**
 * Map a persisted seat layout to the client `SeatLayoutConfig` (or null when the
 * attraction has no layout assigned).
 */
export function toSeatLayoutConfig(
  layout: SeatLayoutRow | null,
): SeatLayoutConfig | null {
  if (!layout) return null;
  return {
    id: layout.id,
    name: layout.name,
    totalSeats: layout.totalSeats,
    rows: layout.rows,
    columnsLeft: layout.columnsLeft,
    columnsRight: layout.columnsRight,
    aislePosition: layout.aislePosition,
    aisleWidth: layout.aisleWidth,
    vipRows: toVipRows(layout.vipRows),
  };
}
