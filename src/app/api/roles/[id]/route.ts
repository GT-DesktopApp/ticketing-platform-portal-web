import { fail, handleApiError, HttpStatus, ok } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { roleInputSchema } from "@/modules/users/schemas";
import { roleInclude, toManagedRole } from "@/modules/users/server/mapper";
import { updateRole } from "@/modules/users/server/role-persist";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/roles/[id] — one role with its modules + counts. */
export async function GET(_request: Request, { params }: Ctx) {
  try {
    await requirePermission(PERMISSIONS.ROLES_VIEW);
    const { id } = await params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: roleInclude,
    });
    if (!role) {
      return fail("Role not found.", { status: HttpStatus.NOT_FOUND });
    }
    return ok(toManagedRole(role), "Role loaded.");
  } catch (error) {
    return handleApiError(error);
  }
}

/** PUT /api/roles/[id] — update a role and reconcile its module permissions. */
export async function PUT(request: Request, { params }: Ctx) {
  try {
    const subject = await requirePermission(PERMISSIONS.ROLES_UPDATE);
    const { id } = await params;

    const existing = await prisma.role.findUnique({
      where: { id },
      select: { id: true, isSystem: true },
    });
    if (!existing) {
      return fail("Role not found.", { status: HttpStatus.NOT_FOUND });
    }

    const body = await request.json();
    const input = roleInputSchema.parse(body);

    const role = await updateRole(id, input, subject.userId, existing.isSystem);
    return ok(toManagedRole(role), "Role updated.");
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/roles/[id]
 *
 * System roles can never be deleted. A custom role assigned to users cannot be
 * hard-deleted (it would orphan those users); it is deactivated instead. An
 * unused custom role is removed outright.
 */
export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    await requirePermission(PERMISSIONS.ROLES_DELETE);
    const { id } = await params;

    const role = await prisma.role.findUnique({
      where: { id },
      select: { id: true, isSystem: true, _count: { select: { userRoles: true } } },
    });
    if (!role) {
      return fail("Role not found.", { status: HttpStatus.NOT_FOUND });
    }
    if (role.isSystem) {
      return fail("System roles cannot be deleted.", {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    if (role._count.userRoles > 0) {
      await prisma.role.update({ where: { id }, data: { isActive: false } });
      return ok(
        { id, softDeleted: true },
        "Role is assigned to users, so it was deactivated instead of deleted.",
      );
    }

    await prisma.role.delete({ where: { id } });
    return ok({ id, softDeleted: false }, "Role deleted.");
  } catch (error) {
    return handleApiError(error);
  }
}
