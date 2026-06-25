import { PERMISSIONS } from "@/lib/constants/permissions";
import { ROUTES } from "@/lib/constants/routes";
import type { NavItem } from "@/types";

/**
 * Sidebar navigation, defined as data (not JSX).
 *
 * Each item carries the permission(s) needed to see it; the sidebar filters
 * the list against the current user's permissions so the menu reflects RBAC
 * automatically. `icon` is a Lucide icon name resolved at render time.
 */
export const mainNav: NavItem[] = [
  {
    title: "Dashboard",
    href: ROUTES.DASHBOARD,
    icon: "LayoutDashboard",
    permissions: [PERMISSIONS.DASHBOARD_VIEW],
  },
  {
    title: "Tickets",
    href: ROUTES.TICKETS,
    icon: "Ticket",
    permissions: [PERMISSIONS.TICKETS_VIEW],
  },
  {
    title: "QR Verify",
    href: ROUTES.QR_VERIFY,
    icon: "QrCode",
    permissions: [PERMISSIONS.TICKETS_VERIFY],
  },
  {
    title: "Customers",
    href: ROUTES.CUSTOMERS,
    icon: "Users",
    permissions: [PERMISSIONS.CUSTOMERS_VIEW],
  },
  {
    title: "Reports",
    href: ROUTES.REPORTS,
    icon: "BarChart3",
    permissions: [PERMISSIONS.REPORTS_VIEW],
  },
];

/** Administration section — RBAC and platform settings. */
export const adminNav: NavItem[] = [
  {
    title: "Users",
    href: ROUTES.USERS,
    icon: "UserCog",
    permissions: [PERMISSIONS.USERS_VIEW],
  },
  {
    title: "Roles",
    href: ROUTES.ROLES,
    icon: "ShieldCheck",
    permissions: [PERMISSIONS.ROLES_VIEW],
  },
  {
    title: "Permissions",
    href: ROUTES.PERMISSIONS,
    icon: "KeyRound",
    permissions: [PERMISSIONS.PERMISSIONS_VIEW],
  },
  {
    title: "Audit Logs",
    href: ROUTES.AUDIT_LOGS,
    icon: "ScrollText",
    permissions: [PERMISSIONS.AUDIT_LOGS_VIEW],
  },
  {
    title: "Settings",
    href: ROUTES.SETTINGS,
    icon: "Settings",
    permissions: [PERMISSIONS.SETTINGS_VIEW],
  },
];
