import { handleApiError, ok } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { RoleOption } from "@/modules/users/types";

/**
 * GET /api/roles/options — lightweight role list for the "Select Role" dropdown
 * on the user form and the "All Roles" filter on the Users list. Excludes
 * super_admin from assignment (it's the bootstrap role) but includes every other
 * role with its active flag so the form can disable inactive ones.
 */
export async function GET() {
  try {
    await requirePermission(PERMISSIONS.USERS_VIEW);

    const roles = await prisma.role.findMany({
      where: { key: { not: "super_admin" } },
      orderBy: { name: "asc" },
      select: { id: true, key: true, name: true, isActive: true },
    });

    return ok(roles as RoleOption[], "Role options loaded.");
  } catch (error) {
    return handleApiError(error);
  }
}
