import { handleApiError, ok } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/roles — list roles with their permission counts.
 * Scaffold demonstrating the guard + envelope pattern. Pagination/filtering
 * are added in the roles milestone.
 */
export async function GET() {
  try {
    await requirePermission(PERMISSIONS.ROLES_VIEW);

    const roles = await prisma.role.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        isSystem: true,
        _count: { select: { rolePermissions: true, userRoles: true } },
      },
    });

    return ok(roles, "Roles fetched successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
