import { handleApiError, ok } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/permissions — list the full permission catalog (grouped on the
 * client for the permission picker). Read-only; the catalog is managed via the
 * seed, not the API.
 */
export async function GET() {
  try {
    await requirePermission(PERMISSIONS.PERMISSIONS_VIEW);

    const permissions = await prisma.permission.findMany({
      orderBy: [{ group: "asc" }, { key: "asc" }],
      select: { id: true, key: true, description: true, group: true },
    });

    return ok(permissions, "Permissions fetched successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
