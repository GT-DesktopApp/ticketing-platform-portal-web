import { handleApiError, ok } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/attractions/[id]/ticket-categories
 * The attraction's ticket categories (rows rendered in the booking panel). Used
 * by CATEGORY-mode attractions, but works for any attraction. Prices are in
 * paise (the app's money unit); the UI converts to rupees for display.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermission(PERMISSIONS.ATTRACTIONS_VIEW);
    const { id } = await params;

    const categories = await prisma.ticketCategory.findMany({
      where: { attractionId: id, isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { categoryType: { select: { id: true, name: true } } },
    });

    return ok(categories, "Ticket categories loaded.");
  } catch (error) {
    return handleApiError(error);
  }
}
