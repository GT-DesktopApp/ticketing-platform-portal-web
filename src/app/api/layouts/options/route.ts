import { handleApiError, ok } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { LayoutOption } from "@/modules/layouts/types";

/**
 * GET /api/layouts/options — active saved layouts for the Grid Style dropdown
 * in the attraction Seat Allocation step. User-created custom grids appear here
 * automatically alongside the frontend's built-in presets.
 */
export async function GET() {
  try {
    await requirePermission(PERMISSIONS.ATTRACTIONS_VIEW);

    const layouts = await prisma.seatLayout.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, totalSeats: true, isActive: true },
    });

    return ok(layouts as LayoutOption[], "Layout options loaded.");
  } catch (error) {
    return handleApiError(error);
  }
}
