import type { Prisma } from "@prisma/client";

import { permissionsToModules } from "@/modules/users/modules";
import type { ManagedRole, ManagedUser } from "@/modules/users/types";

/** Prisma select for a user row + its single (primary) role. */
export const userSelect = {
  id: true,
  name: true,
  email: true,
  username: true,
  mobile: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  userRoles: {
    take: 1,
    select: { role: { select: { id: true, key: true, name: true } } },
  },
} satisfies Prisma.UserSelect;

type UserRow = Prisma.UserGetPayload<{ select: typeof userSelect }>;

/** Prisma include for a role row + its permission keys and assigned-user count. */
export const roleInclude = {
  rolePermissions: { select: { permission: { select: { key: true } } } },
  _count: { select: { userRoles: true } },
} satisfies Prisma.RoleInclude;

type RoleRow = Prisma.RoleGetPayload<{ include: typeof roleInclude }>;

/** Map a persisted user to the client shape. */
export function toManagedUser(u: UserRow): ManagedUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    username: u.username,
    mobile: u.mobile,
    isActive: u.isActive,
    role: u.userRoles[0]?.role ?? null,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
  };
}

/** Map a persisted role (+ permissions) to the client shape, deriving modules. */
export function toManagedRole(r: RoleRow): ManagedRole {
  const permKeys = r.rolePermissions.map((rp) => rp.permission.key);
  return {
    id: r.id,
    key: r.key,
    name: r.name,
    description: r.description,
    isSystem: r.isSystem,
    isActive: r.isActive,
    assignedUsers: r._count.userRoles,
    modules: permissionsToModules(permKeys),
    createdAt: r.createdAt.toISOString(),
  };
}
