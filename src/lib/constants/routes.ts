/**
 * Centralized route registry.
 *
 * Every internal navigation target lives here so that:
 * - There are no magic strings scattered across components.
 * - Renaming a route is a single-line change.
 * - Middleware, breadcrumbs, and the sidebar all read from one source.
 *
 * `API` routes are grouped separately and consumed by the service layer.
 */
export const ROUTES = {
  // ---- Public / auth ----
  HOME: "/",
  LOGIN: "/login",

  // ---- Dashboard (protected) ----
  DASHBOARD: "/dashboard",
  POS: "/pos",
  BOOKINGS: "/bookings",
  TRANSACTIONS: "/transactions",
  INVOICES: "/invoices",
  INVENTORY: "/inventory",
  CCTV: "/cctv",
  ATTRACTIONS: "/attractions",
  LAYOUTS: "/layouts",
  TICKETS: "/tickets",
  CUSTOMERS: "/customers",
  COMPLIMENTARY_PASSES: "/complimentary-passes",
  USERS: "/users",
  ROLES: "/roles",
  PERMISSIONS: "/permissions",
  REPORTS: "/reports",
  QR_VERIFY: "/qr",
  AUDIT_LOGS: "/audit-logs",
  SETTINGS: "/settings",
  BACKUP: "/backup",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

/** API endpoints, kept in sync with the `app/api/*` route handlers. */
export const API_ROUTES = {
  AUTH: "/api/auth",
  USERS: "/api/users",
  ROLES: "/api/roles",
  ROLE_OPTIONS: "/api/roles/options",
  PERMISSIONS: "/api/permissions",
  TICKETS: "/api/tickets",
  REPORTS: "/api/reports",
  HEALTH: "/api/health",
  // POS
  ATTRACTIONS: "/api/attractions",
  CUSTOMERS: "/api/customers",
  BOOKINGS: "/api/bookings",
  // Attraction Management (multi-attraction CRUD + bulk upload)
  MANAGE_ATTRACTIONS: "/api/attractions/manage",
  BULK_UPLOAD_VALIDATE: "/api/attractions/bulk-upload/validate",
  BULK_UPLOAD_IMPORT: "/api/attractions/bulk-upload/import",
  BULK_UPLOAD_TEMPLATE: "/api/attractions/bulk-upload/template",
  // Layout Management (reusable seat layouts)
  LAYOUTS: "/api/layouts",
  LAYOUT_OPTIONS: "/api/layouts/options",
} as const;

/**
 * Routes reachable without authentication. The middleware uses this to decide
 * whether to redirect an unauthenticated request to the login page.
 */
export const PUBLIC_ROUTES: string[] = [ROUTES.LOGIN];

/** Where to send users after a successful login. Ticket Booking (POS) is the
 *  primary landing page; the Dashboard is currently disabled. */
export const DEFAULT_LOGIN_REDIRECT: string = ROUTES.POS;
