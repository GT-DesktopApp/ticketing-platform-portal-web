"use client";

import type { ReactNode } from "react";

import { usePermissions } from "@/hooks/use-permissions";
import type { Permission } from "@/lib/constants/permissions";

/**
 * Declarative permission gate for client UI.
 *
 *   <Can permission={PERMISSIONS.USERS_CREATE}>
 *     <Button>New user</Button>
 *   </Can>
 *
 * Pass `any` (OR) or `all` (AND) for multiple permissions. Renders `fallback`
 * (default: nothing) when the user lacks access. This is presentation-only;
 * the server route guard remains the enforcement boundary.
 */
interface CanProps {
  permission?: Permission;
  any?: Permission[];
  all?: Permission[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function Can({
  permission,
  any,
  all,
  fallback = null,
  children,
}: CanProps) {
  const { can, canAny, canAll } = usePermissions();

  let allowed = true;
  if (permission) allowed = allowed && can(permission);
  if (any) allowed = allowed && canAny(any);
  if (all) allowed = allowed && canAll(all);

  return <>{allowed ? children : fallback}</>;
}
