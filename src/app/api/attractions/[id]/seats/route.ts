import { handleApiError, ok } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/attractions/[id]/seats
 * Returns the bogie/seat availability matrix for the Seat Allocation step.
 *
 * Sequential locking: the FIRST bogie that still has availability is the ACTIVE
 * one (selectable); every later bogie is reported LOCKED ("Opens after … is
 * full"); fully-occupied bogies are FULL. This is computed server-side from
 * live seat occupancy so the client can't bypass the rule.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermission(PERMISSIONS.BOOKINGS_CREATE);
    const { id } = await params;

    const bogies = await prisma.bogie.findMany({
      where: { attractionId: id },
      orderBy: { sequence: "asc" },
      include: {
        seats: { orderBy: { number: "asc" } },
      },
    });

    // Derive each bogie's effective status from live occupancy + sequence.
    let activeAssigned = false;
    const result = bogies.map((bogie) => {
      const available = bogie.seats.filter((s) => s.status === "AVAILABLE").length;
      const isFull = available === 0;

      let status: "ACTIVE" | "LOCKED" | "FULL";
      if (isFull) {
        status = "FULL";
      } else if (!activeAssigned) {
        status = "ACTIVE"; // first non-full bogie becomes the active one
        activeAssigned = true;
      } else {
        status = "LOCKED"; // a later bogie waits its turn
      }

      return {
        id: bogie.id,
        label: bogie.label,
        capacity: bogie.capacity,
        sequence: bogie.sequence,
        available,
        status,
        seats: bogie.seats.map((s) => ({
          id: s.id,
          number: s.number,
          side: s.side,
          status: s.status, // AVAILABLE | OCCUPIED | BLOCKED
        })),
      };
    });

    return ok(result, "Seat matrix loaded.");
  } catch (error) {
    return handleApiError(error);
  }
}
