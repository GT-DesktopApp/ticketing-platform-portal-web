import { handleApiError, ok } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/attractions
 * Lists active attractions with their purchasable ticket products — the data
 * the booking screen's product grid + cart need. The DB relation is still named
 * `categories`; we surface it to the client as `ticketProducts`.
 */
export async function GET(request: Request) {
  try {
    await requirePermission(PERMISSIONS.ATTRACTIONS_VIEW);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();

    const rows = await prisma.attraction.findMany({
      where: {
        isActive: true,
        ...(search
          ? { name: { contains: search, mode: "insensitive" } }
          : {}),
      },
      orderBy: { name: "asc" },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: { categoryType: { select: { id: true, name: true } } },
        },
      },
    });

    // Expose the relation as `ticketProducts` (drop the internal `categories`).
    // `bookingType` stays on the attraction so the UI picks the right flow.
    const attractions = rows.map(({ categories, ...attraction }) => ({
      ...attraction,
      ticketProducts: categories,
    }));

    return ok(attractions, "Attractions loaded.");
  } catch (error) {
    return handleApiError(error);
  }
}
