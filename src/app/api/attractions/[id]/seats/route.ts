import { handleApiError, ok } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  seatLayoutSelect,
  toSeatLayoutConfig,
} from "@/modules/pos/server/seat-layout";

/**
 * GET /api/attractions/[id]/seats
 *
 * Layout-derived seat availability for the inline Seat Allocation grid. Seats
 * are NOT stored per-row: the grid is rendered from the attraction's
 * `SeatLayout` geometry, and a seat is "occupied" when its number already exists
 * in `SeatAssignment` for this attraction.
 *
 * Returns `{ layout, occupied }`:
 *   • `layout`   — the seat-layout config (null when the attraction has none), and
 *   • `occupied` — the seat numbers already assigned to a booking.
 * Computed server-side so the client can't bypass occupancy.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermission(PERMISSIONS.BOOKINGS_CREATE);
    const { id } = await params;

    const attraction = await prisma.attraction.findUnique({
      where: { id },
      select: { id: true, seatLayout: { select: seatLayoutSelect } },
    });

    const layout = toSeatLayoutConfig(attraction?.seatLayout ?? null);

    // No attraction or no layout → nothing to allocate.
    if (!attraction || !layout) {
      return ok({ layout: null, occupied: [] }, "Seat availability loaded.");
    }

    const assignments = await prisma.seatAssignment.findMany({
      where: { attractionId: id },
      select: { seatNumber: true },
    });
    const occupied = assignments.map((a) => a.seatNumber);

    return ok({ layout, occupied }, "Seat availability loaded.");
  } catch (error) {
    return handleApiError(error);
  }
}
