import bcrypt from "bcryptjs";

import { fail, handleApiError, HttpStatus, ok } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/modules/users/schemas";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/users/[id]/reset-password — admin-only password reset (the key icon
 * in the Users table Actions column). Sets a new bcrypt hash for the user.
 */
export async function POST(request: Request, { params }: Ctx) {
  try {
    await requirePermission(PERMISSIONS.USERS_UPDATE);
    const { id } = await params;

    const exists = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      return fail("User not found.", { status: HttpStatus.NOT_FOUND });
    }

    const body = await request.json();
    const input = resetPasswordSchema.parse(body);

    const passwordHash = await bcrypt.hash(input.password, 10);
    await prisma.user.update({ where: { id }, data: { passwordHash } });

    return ok({ id }, "Password reset.");
  } catch (error) {
    return handleApiError(error);
  }
}
