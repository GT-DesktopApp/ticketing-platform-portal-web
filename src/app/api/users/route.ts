import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";

import { created, fail, handleApiError, HttpStatus, ok } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createUserSchema } from "@/modules/users/schemas";
import { toManagedUser, userSelect } from "@/modules/users/server/mapper";

/**
 * GET /api/users — list users for the Users table.
 *
 * Supports `?search=` (name / email / mobile / username) and `?roleId=` (the
 * "All Roles" filter). Returns every match with its primary role, active status,
 * and contact fields.
 */
export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.USERS_VIEW);

    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search")?.trim();
    const roleId = searchParams.get("roleId")?.trim();

    const users = await prisma.user.findMany({
      where: {
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { username: { contains: search, mode: "insensitive" } },
                { mobile: { contains: search } },
              ],
            }
          : {}),
        ...(roleId ? { userRoles: { some: { roleId } } } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: userSelect,
    });

    return ok(users.map(toManagedUser), "Users fetched successfully.");
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/users — create a user, hash the password, assign the chosen role.
 */
export async function POST(request: NextRequest) {
  try {
    const subject = await requirePermission(PERMISSIONS.USERS_CREATE);

    const body = await request.json();
    const input = createUserSchema.parse(body);

    // Friendly conflicts before the unique constraint would throw.
    const clash = await prisma.user.findFirst({
      where: { OR: [{ email: input.email }, { username: input.username }] },
      select: { email: true, username: true },
    });
    if (clash) {
      const field = clash.email === input.email ? "email" : "username";
      return fail(`A user with this ${field} already exists.`, {
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

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        username: input.username,
        mobile: input.mobile,
        passwordHash,
        isActive: input.isActive,
        userRoles: {
          create: { roleId: input.roleId, assignedById: subject.userId },
        },
      },
      select: userSelect,
    });

    return created(toManagedUser(user), "User created.");
  } catch (error) {
    return handleApiError(error);
  }
}
