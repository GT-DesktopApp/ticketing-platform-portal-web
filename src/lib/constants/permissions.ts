/**
 * The platform's complete permission catalog.
 *
 * Convention: every permission is a string of the form `"<resource>.<action>"`.
 * This flat, string-based design is intentional:
 * - It maps cleanly to a database row (`Permission.key`).
 * - It is trivially serializable into the JWT/session.
 * - It is easy to check (`hasPermission(user, "users.create")`).
 * - New permissions are added by appending here and re-seeding — no schema change.
 *
 * Group the constants by resource so the catalog stays readable as it grows to
 * hundreds of entries across all the platform's modules.
 */
export const PERMISSIONS = {
  // ---- User management ----
  USERS_VIEW: "users.view",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",

  // ---- Role & permission management (RBAC administration) ----
  ROLES_VIEW: "roles.view",
  ROLES_CREATE: "roles.create",
  ROLES_UPDATE: "roles.update",
  ROLES_DELETE: "roles.delete",
  PERMISSIONS_VIEW: "permissions.view",
  PERMISSIONS_ASSIGN: "permissions.assign",

  // ---- Tickets ----
  TICKETS_VIEW: "tickets.view",
  TICKETS_CREATE: "tickets.create",
  TICKETS_UPDATE: "tickets.update",
  TICKETS_DELETE: "tickets.delete",
  TICKETS_PRINT: "tickets.print",
  TICKETS_VERIFY: "tickets.verify",
  TICKETS_BULK_UPLOAD: "tickets.bulk_upload",

  // ---- Customers ----
  CUSTOMERS_VIEW: "customers.view",
  CUSTOMERS_CREATE: "customers.create",
  CUSTOMERS_UPDATE: "customers.update",
  CUSTOMERS_DELETE: "customers.delete",

  // ---- POS: Attractions & Bookings ----
  ATTRACTIONS_VIEW: "attractions.view",
  ATTRACTIONS_MANAGE: "attractions.manage",
  BOOKINGS_VIEW: "bookings.view",
  BOOKINGS_CREATE: "bookings.create",

  // ---- Reports & analytics ----
  REPORTS_VIEW: "reports.view",
  REPORTS_EXPORT: "reports.export",

  // ---- Dashboard ----
  DASHBOARD_VIEW: "dashboard.view",

  // ---- Audit logs ----
  AUDIT_LOGS_VIEW: "audit_logs.view",

  // ---- Settings (branches, locations, platform configuration) ----
  SETTINGS_VIEW: "settings.view",
  SETTINGS_UPDATE: "settings.update",
  BRANCHES_MANAGE: "branches.manage",
  LOCATIONS_MANAGE: "locations.manage",
} as const;

/** Union of every valid permission string. Use this type everywhere a permission is expected. */
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Convenience array of all permissions — used by the seed script. */
export const ALL_PERMISSIONS = Object.values(PERMISSIONS) as Permission[];

/**
 * Permission groupings for rendering the permission picker UI (grouped by resource).
 * Purely presentational; the source of truth remains the flat `PERMISSIONS` map.
 */
export const PERMISSION_GROUPS: Record<string, Permission[]> = {
  Users: [
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DELETE,
  ],
  "Roles & Permissions": [
    PERMISSIONS.ROLES_VIEW,
    PERMISSIONS.ROLES_CREATE,
    PERMISSIONS.ROLES_UPDATE,
    PERMISSIONS.ROLES_DELETE,
    PERMISSIONS.PERMISSIONS_VIEW,
    PERMISSIONS.PERMISSIONS_ASSIGN,
  ],
  Tickets: [
    PERMISSIONS.TICKETS_VIEW,
    PERMISSIONS.TICKETS_CREATE,
    PERMISSIONS.TICKETS_UPDATE,
    PERMISSIONS.TICKETS_DELETE,
    PERMISSIONS.TICKETS_PRINT,
    PERMISSIONS.TICKETS_VERIFY,
    PERMISSIONS.TICKETS_BULK_UPLOAD,
  ],
  Customers: [
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.CUSTOMERS_UPDATE,
    PERMISSIONS.CUSTOMERS_DELETE,
  ],
  "POS & Bookings": [
    PERMISSIONS.ATTRACTIONS_VIEW,
    PERMISSIONS.ATTRACTIONS_MANAGE,
    PERMISSIONS.BOOKINGS_VIEW,
    PERMISSIONS.BOOKINGS_CREATE,
  ],
  Reports: [PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_EXPORT],
  Dashboard: [PERMISSIONS.DASHBOARD_VIEW],
  "Audit Logs": [PERMISSIONS.AUDIT_LOGS_VIEW],
  Settings: [
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.BRANCHES_MANAGE,
    PERMISSIONS.LOCATIONS_MANAGE,
  ],
};

/**
 * Default permission sets for the seeded system roles.
 *
 * `SUPER_ADMIN` intentionally has no entry here — it is treated as a wildcard
 * (`*`) in the permission-check helpers and always passes. Encoding that as a
 * special case (rather than listing every permission) means new permissions are
 * automatically granted to Super Admin without re-seeding.
 */
export const DEFAULT_ROLE_PERMISSIONS = {
  admin: ALL_PERMISSIONS.filter(
    (p) =>
      !(
        [
          PERMISSIONS.SETTINGS_UPDATE,
          PERMISSIONS.BRANCHES_MANAGE,
          PERMISSIONS.LOCATIONS_MANAGE,
        ] as Permission[]
      ).includes(p),
  ),
  manager: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.TICKETS_VIEW,
    PERMISSIONS.TICKETS_CREATE,
    PERMISSIONS.TICKETS_UPDATE,
    PERMISSIONS.TICKETS_PRINT,
    PERMISSIONS.TICKETS_VERIFY,
    PERMISSIONS.TICKETS_BULK_UPLOAD,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.CUSTOMERS_UPDATE,
    PERMISSIONS.ATTRACTIONS_VIEW,
    PERMISSIONS.ATTRACTIONS_MANAGE,
    PERMISSIONS.BOOKINGS_VIEW,
    PERMISSIONS.BOOKINGS_CREATE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
  ],
  operator: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.TICKETS_VIEW,
    PERMISSIONS.TICKETS_CREATE,
    PERMISSIONS.TICKETS_PRINT,
    PERMISSIONS.TICKETS_VERIFY,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.ATTRACTIONS_VIEW,
    PERMISSIONS.BOOKINGS_VIEW,
    PERMISSIONS.BOOKINGS_CREATE,
  ],
  viewer: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.TICKETS_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
} satisfies Record<string, Permission[]>;
