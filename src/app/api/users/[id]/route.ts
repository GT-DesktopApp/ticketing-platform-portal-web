import bcrypt from "bcryptjs";

import { fail, handleApiError, HttpStatus, ok } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { updateUserSchema } from "@/modules/users/schemas";
import { toManagedUser, userSelect } from "@/modules/users/server/mapper";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/users/[id] — one user with its role. */
export async function GET(_request: Request, { params }: Ctx) {
  try {
    await requirePermission(PERMISSIONS.USERS_VIEW);
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!user) {
      return fail("User not found.", { status: HttpStatus.NOT_FOUND });
    }
    return ok(toManagedUser(user), "User loaded.");
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/users/[id] — update a user, reconcile its single role, and optionally
 * change the password (only when a new one is provided).
 */
export async function PUT(request: Request, { params }: Ctx) {
  try {
    const subject = await requirePermission(PERMISSIONS.USERS_UPDATE);
    const { id } = await params;

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return fail("User not found.", { status: HttpStatus.NOT_FOUND });
    }

    const body = await request.json();
    const input = updateUserSchema.parse(body);

    // Uniqueness against OTHER users.
    const clash = await prisma.user.findFirst({
      where: {
        id: { not: id },
        OR: [{ email: input.email }, { username: input.username }],
      },
      select: { email: true },
    });
    if (clash) {
      const field = clash.email === input.email ? "email" : "username";
      return fail(`Another user already uses this ${field}.`, {
        status: HttpStatus.CONFLICT,
        errors: { [field]: [`This ${field} is already taken.`] },
      });
    }

    const role = await prisma.role.findUnique({
      where: { id: input.roleId },
      select: { id: true },
    });
    if (!role) {
      return fail("Selected role does not exist.", {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }

    const passwordHash =
      input.password && input.password.length > 0
        ? await bcrypt.hash(input.password, 10)
        : undefined;

    const user = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          name: input.name,
          email: input.email,
          username: input.username,
          mobile: input.mobile,
          isActive: input.isActive,
          ...(passwordHash ? { passwordHash } : {}),
        },
      });
      // Replace the role set with the single selected role.
      await tx.userRole.deleteMany({ where: { userId: id } });
      await tx.userRole.create({
        data: { userId: id, roleId: input.roleId, assignedById: subject.userId },
      });
      return tx.user.findUniqueOrThrow({ where: { id }, select: userSelect });
    });

    return ok(toManagedUser(user), "User updated.");
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/users/[id]
 *
 * Deactivate-if-referenced, hard-delete if unused. A user with booking/audit
 * history is soft-deactivated (isActive=false) to preserve those references;
 * a user with no history is removed outright. A user may not delete themselves.
 */
export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const subject = await requirePermission(PERMISSIONS.USERS_DELETE);
    const { id } = await params;

    if (id === subject.userId) {
      return fail("You cannot delete your own account.", {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, _count: { select: { auditLogs: true } } },
    });
    if (!user) {
      return fail("User not found.", { status: HttpStatus.NOT_FOUND });
    }

    // Does the user have references that must be preserved?
    const bookings = await prisma.booking.count({ where: { createdById: id } });
    const referenced = bookings > 0 || user._count.auditLogs > 0;

    if (referenced) {
      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });
      return ok({ id, softDeleted: true }, "User deactivated.");
    }

    await prisma.user.delete({ where: { id } });
    return ok({ id, softDeleted: false }, "User deleted.");
  } catch (error) {
    return handleApiError(error);
  }
}
