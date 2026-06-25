import type { Permission } from "@/lib/constants/permissions";
import { type RoleKey, ROLES } from "@/lib/constants/roles";

/**
 * Pure, framework-agnostic RBAC predicates.
 *
 * These functions know nothing about Next.js, the session, or the database.
 * They operate on a plain "subject" — the minimal shape we keep in the session
 * token: the user's roles and their flattened, deduplicated permission set.
 *
 * Keeping the logic pure makes it trivially unit-testable and reusable on both
 * the server (route guards) and the client (conditional UI).
 */

/** The minimal authorization context derived from a user's roles. */
export interface AuthSubject {
  roles: RoleKey[];
  permissions: Permission[];
}

/** Super Admin bypasses all permission checks (wildcard authority). */
export function isSuperAdmin(subject: Pick<AuthSubject, "roles">): boolean {
  return subject.roles.includes(ROLES.SUPER_ADMIN);
}

/** Does the subject hold a single specific permission? */
export function hasPermission(
  subject: AuthSubject,
  permission: Permission,
): boolean {
  if (isSuperAdmin(subject)) return true;
  return subject.permissions.includes(permission);
}

/** Does the subject hold *every* permission in the list? (AND semantics) */
export function hasAllPermissions(
  subject: AuthSubject,
  permissions: Permission[],
): boolean {
  if (isSuperAdmin(subject)) return true;
  return permissions.every((p) => subject.permissions.includes(p));
}

/** Does the subject hold *at least one* of the permissions? (OR semantics) */
export function hasAnyPermission(
  subject: AuthSubject,
  permissions: Permission[],
): boolean {
  if (isSuperAdmin(subject)) return true;
  return permissions.some((p) => subject.permissions.includes(p));
}

/** Does the subject hold a specific role? */
export function hasRole(
  subject: Pick<AuthSubject, "roles">,
  role: RoleKey,
): boolean {
  return subject.roles.includes(role);
}

/** Does the subject hold any of the given roles? */
export function hasAnyRole(
  subject: Pick<AuthSubject, "roles">,
  roles: RoleKey[],
): boolean {
  return roles.some((r) => subject.roles.includes(r));
}
