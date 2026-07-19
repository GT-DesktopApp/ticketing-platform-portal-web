import { fail, handleApiError, HttpStatus, ok } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { toggleRoleStatusSchema } from "@/modules/users/schemas";
import { roleInclude, toManagedRole } from "@/modules/users/server/mapper";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/roles/[id]/status — toggle a role's active status (row switch). */
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requirePermission(PERMISSIONS.ROLES_UPDATE);
    const { id } = await params;

    const body = await request.json();
    const { isActive } = toggleRoleStatusSchema.parse(body);

    const exists = await prisma.role.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      return fail("Role not found.", { status: HttpStatus.NOT_FOUND });
    }

    const role = await prisma.role.update({
      where: { id },
      data: { isActive },
      include: roleInclude,
    });
    return ok(toManagedRole(role), isActive ? "Role activated." : "Role deactivated.");
  } catch (error) {
    return handleApiError(error);
  }
}
