import { fail, handleApiError, HttpStatus, ok } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { toggleUserStatusSchema } from "@/modules/users/schemas";
import { toManagedUser, userSelect } from "@/modules/users/server/mapper";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/users/[id]/status — toggle a user's active status (the row switch).
 * A user cannot deactivate their own account.
 */
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const subject = await requirePermission(PERMISSIONS.USERS_UPDATE);
    const { id } = await params;

    const body = await request.json();
    const { isActive } = toggleUserStatusSchema.parse(body);

    if (id === subject.userId && !isActive) {
      return fail("You cannot deactivate your own account.", {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const exists = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      return fail("User not found.", { status: HttpStatus.NOT_FOUND });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: userSelect,
    });
    return ok(toManagedUser(user), isActive ? "User activated." : "User deactivated.");
  } catch (error) {
    return handleApiError(error);
  }
}
