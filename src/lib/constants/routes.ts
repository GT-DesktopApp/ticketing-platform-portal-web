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
  TICKETS: "/tickets",
  CUSTOMERS: "/customers",
  USERS: "/users",
  ROLES: "/roles",
  PERMISSIONS: "/permissions",
  REPORTS: "/reports",
  QR_VERIFY: "/qr",
  AUDIT_LOGS: "/audit-logs",
  SETTINGS: "/settings",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

/** API endpoints, kept in sync with the `app/api/*` route handlers. */
export const API_ROUTES = {
  AUTH: "/api/auth",
  USERS: "/api/users",
  ROLES: "/api/roles",
  PERMISSIONS: "/api/permissions",
  TICKETS: "/api/tickets",
  REPORTS: "/api/reports",
  HEALTH: "/api/health",
} as const;

/**
 * Routes reachable without authentication. The middleware uses this to decide
 * whether to redirect an unauthenticated request to the login page.
 */
export const PUBLIC_ROUTES: string[] = [ROUTES.LOGIN];

/** Where to send users after a successful login. */
export const DEFAULT_LOGIN_REDIRECT: string = ROUTES.DASHBOARD;
