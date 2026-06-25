import { auth } from "@/lib/auth";
import type { Permission } from "@/lib/constants/permissions";
import type { RoleKey } from "@/lib/constants/roles";

import {
  type AuthSubject,
  hasAllPermissions,
  hasAnyPermission,
  hasAnyRole,
} from "./check";

/**
 * Server-side authorization guards for use inside Route Handlers, Server
 * Actions, and Server Components.
 *
 * They read the current Auth.js session, build an `AuthSubject`, and throw a
 * typed `AuthorizationError` when access is denied. Callers (e.g. the API
 * response helper) translate that error into a 401/403 response.
 *
 * NOTE: The actual `auth()` session wiring is completed in the auth foundation
 * step. These guards are written against the final session shape so no rework
 * is needed once credentials login is implemented.
 */

export class AuthorizationError extends Error {
  constructor(
    public readonly code: "UNAUTHENTICATED" | "FORBIDDEN",
    message: string,
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

/** Resolve the current session into an `AuthSubject`, or throw if unauthenticated. */
export async function requireAuth(): Promise<AuthSubject & { userId: string }> {
  const session = await auth();

  if (!session?.user) {
    throw new AuthorizationError("UNAUTHENTICATED", "Authentication required.");
  }

  return {
    userId: session.user.id,
    roles: (session.user.roles ?? []) as RoleKey[],
    permissions: (session.user.permissions ?? []) as Permission[],
  };
}

/** Require that the current user holds every listed permission, else throw 403. */
export async function requirePermission(...permissions: Permission[]) {
  const subject = await requireAuth();
  if (!hasAllPermissions(subject, permissions)) {
    throw new AuthorizationError(
      "FORBIDDEN",
      `Missing required permission(s): ${permissions.join(", ")}`,
    );
  }
  return subject;
}

/** Require that the current user holds at least one of the listed permissions. */
export async function requireAnyPermission(...permissions: Permission[]) {
  const subject = await requireAuth();
  if (!hasAnyPermission(subject, permissions)) {
    throw new AuthorizationError(
      "FORBIDDEN",
      `Requires one of: ${permissions.join(", ")}`,
    );
  }
  return subject;
}

/** Require that the current user holds at least one of the listed roles. */
export async function requireRole(...roles: RoleKey[]) {
  const subject = await requireAuth();
  if (!hasAnyRole(subject, roles)) {
    throw new AuthorizationError(
      "FORBIDDEN",
      `Requires role: ${roles.join(" or ")}`,
    );
  }
  return subject;
}
