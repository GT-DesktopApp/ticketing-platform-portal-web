import type { NextRequest } from "next/server";

import {
  buildPaginationMeta,
  getPrismaSkipTake,
  handleApiError,
  ok,
  parsePagination,
} from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/users — paginated list of users.
 *
 * This route is the CANONICAL TEMPLATE every future list endpoint copies:
 *   1. `requirePermission(...)` enforces RBAC (throws → 401/403).
 *   2. `parsePagination(...)` reads & clamps page/pageSize from the query.
 *   3. Query the data + total in parallel.
 *   4. Return via `ok(...)` with a `pagination` meta block.
 *   5. `handleApiError(...)` converts any thrown error into the standard
 *      error envelope with the right status code.
 */
export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.USERS_VIEW);

    const pagination = parsePagination(request.nextUrl.searchParams);
    const { skip, take } = getPrismaSkipTake(pagination);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      prisma.user.count(),
    ]);

    return ok(users, "Users fetched successfully", {
      pagination: buildPaginationMeta(pagination, total),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/users — create a user.
 *
 * Scaffold only: the body validation (Zod schema in `modules/users/schemas`)
 * and the create logic land in the users milestone. The guard + envelope +
 * error handling wiring is already in place.
 */
export async function POST() {
  try {
    await requirePermission(PERMISSIONS.USERS_CREATE);
    // TODO(users-milestone): validate body with createUserSchema, hash password,
    // create user, assign roles, write an audit log entry, return `created(...)`.
    return ok(null, "User creation endpoint scaffolded (not yet implemented).");
  } catch (error) {
    return handleApiError(error);
  }
}
