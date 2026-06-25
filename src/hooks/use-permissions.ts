"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";

import type { Permission } from "@/lib/constants/permissions";
import type { RoleKey } from "@/lib/constants/roles";
import {
  type AuthSubject,
  hasAllPermissions,
  hasAnyPermission,
  hasAnyRole,
  hasPermission,
} from "@/lib/permissions/check";

/**
 * Client-side access to the current user's RBAC data.
 *
 * Wraps `useSession()` and exposes the same pure predicates used on the server,
 * so client UI gating (hide a button, etc.) and server guards stay consistent.
 * Remember: client gating is UX only — the server guard is the real boundary.
 */
export function usePermissions() {
  const { data: session, status } = useSession();

  const subject: AuthSubject = useMemo(
    () => ({
      roles: (session?.user?.roles ?? []) as RoleKey[],
      permissions: (session?.user?.permissions ?? []) as Permission[],
    }),
    [session],
  );

  return {
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    roles: subject.roles,
    permissions: subject.permissions,
    can: (permission: Permission) => hasPermission(subject, permission),
    canAll: (permissions: Permission[]) =>
      hasAllPermissions(subject, permissions),
    canAny: (permissions: Permission[]) =>
      hasAnyPermission(subject, permissions),
    hasRole: (roles: RoleKey[]) => hasAnyRole(subject, roles),
  };
}
