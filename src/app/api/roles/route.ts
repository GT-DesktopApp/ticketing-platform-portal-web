import type { NextRequest } from "next/server";

import { created, handleApiError, ok } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { roleInputSchema } from "@/modules/users/schemas";
import { roleInclude, toManagedRole } from "@/modules/users/server/mapper";
import { createRole } from "@/modules/users/server/role-persist";

/**
 * GET /api/roles — list roles for the Roles table.
 *
 * Each row carries its description, assigned-user count, active status, system
 * flag, and the module toggles derived from its permissions. `?search=` filters
 * by name or description.
 */
export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.ROLES_VIEW);

    const search = request.nextUrl.searchParams.get("search")?.trim();

    const roles = await prisma.role.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "asc" },
      include: roleInclude,
    });

    return ok(roles.map(toManagedRole), "Roles fetched successfully.");
  } catch (error) {
    return handleApiError(error);
  }
}

/** POST /api/roles — create a custom role from the module selection. */
export async function POST(request: NextRequest) {
  try {
    const subject = await requirePermission(PERMISSIONS.ROLES_CREATE);

    const body = await request.json();
    const input = roleInputSchema.parse(body);

    const role = await createRole(input, subject.userId);
    return created(toManagedRole(role), "Role created.");
  } catch (error) {
    return handleApiError(error);
  }
}
