import { handleApiError, ok } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/category-types
 * Active category types for the "Category Type" dropdown in the New Category
 * dialog (e.g. "Toy Train (VIP)", "Boat"). Loaded dynamically — never hardcoded.
 */
export async function GET() {
  try {
    await requirePermission(PERMISSIONS.ATTRACTIONS_VIEW);

    const types = await prisma.categoryType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });

    return ok(types, "Category types loaded.");
  } catch (error) {
    return handleApiError(error);
  }
}
