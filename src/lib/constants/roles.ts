/**
 * Canonical system role keys.
 *
 * These are the *seeded* baseline roles every deployment ships with. Custom
 * roles can be created at runtime and stored in the database, but these five
 * are guaranteed to exist and are referenced by code (e.g. the seed script and
 * the "is this a protected system role?" check).
 */
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MANAGER: "manager",
  OPERATOR: "operator",
  VIEWER: "viewer",
} as const;

export type RoleKey = (typeof ROLES)[keyof typeof ROLES];

/** Human-friendly labels for display in the UI. */
export const ROLE_LABELS: Record<RoleKey, string> = {
  [ROLES.SUPER_ADMIN]: "Super Admin",
  [ROLES.ADMIN]: "Admin",
  [ROLES.MANAGER]: "Manager",
  [ROLES.OPERATOR]: "Operator",
  [ROLES.VIEWER]: "Viewer",
};

/** Short descriptions used in role-management screens and seed data. */
export const ROLE_DESCRIPTIONS: Record<RoleKey, string> = {
  [ROLES.SUPER_ADMIN]:
    "Unrestricted access. Can manage everything including roles and permissions.",
  [ROLES.ADMIN]:
    "Full operational access across branches; cannot alter platform-level settings.",
  [ROLES.MANAGER]:
    "Manages tickets, customers, and reports within assigned branches.",
  [ROLES.OPERATOR]:
    "Front-desk counter operations: creates and prints tickets, verifies QR codes.",
  [ROLES.VIEWER]: "Read-only access to dashboards and reports.",
};

/**
 * System roles cannot be deleted or renamed through the UI. The seed marks them
 * with `isSystem = true`; this list is the source of truth for that guard.
 */
export const SYSTEM_ROLES: RoleKey[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.OPERATOR,
  ROLES.VIEWER,
];
