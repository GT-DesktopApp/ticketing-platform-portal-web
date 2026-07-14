import { created, handleApiError, ok } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { attractionInputSchema } from "@/modules/attractions/schemas";
import {
  attractionInclude,
  toManagedAttraction,
} from "@/modules/attractions/server/mapper";
import { createAttraction } from "@/modules/attractions/server/persist";

/**
 * GET /api/attractions/manage
 *
 * Lists ALL attractions (active and inactive) with their visitor categories for
 * the Attraction Management grid. Supports `?search=` to filter by name/type.
 */
export async function GET(request: Request) {
  try {
    await requirePermission(PERMISSIONS.ATTRACTIONS_VIEW);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();

    const rows = await prisma.attraction.findMany({
      // Only live attractions appear in the grid. Deleting an attraction
      // soft-deletes it (isActive=false) to keep booking history intact, so it
      // simply disappears from the list — the grid can go empty until a new one
      // is added.
      where: {
        isActive: true,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { type: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: attractionInclude,
    });

    return ok(rows.map(toManagedAttraction), "Attractions loaded.");
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/attractions/manage
 *
 * Creates a new attraction (CATEGORY mode) with its visitor categories.
 */
export async function POST(request: Request) {
  try {
    await requirePermission(PERMISSIONS.ATTRACTIONS_MANAGE);

    const body = await request.json();
    const input = attractionInputSchema.parse(body);

    const attraction = await createAttraction(input);
    return created(toManagedAttraction(attraction), "Attraction created.");
  } catch (error) {
    return handleApiError(error);
  }
}
