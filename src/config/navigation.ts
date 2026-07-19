import { PERMISSIONS } from "@/lib/constants/permissions";
import { ROUTES } from "@/lib/constants/routes";
import type { NavItem } from "@/types";

/**
 * Sidebar navigation, defined as data (not JSX).
 *
 * This is the exact 13-item list from the SIDE PANEL design, in order. Each item
 * carries the permission(s) needed to see it; the sidebar filters the list
 * against the current user's permissions so the menu reflects RBAC
 * automatically. `icon` is a Lucide icon name resolved at render time.
 *
 * Only "Ticket Booking" is a built feature today; the rest route to a
 * "Coming soon" placeholder page so the design is complete without dead links.
 */
export const mainNav: NavItem[] = [
  {
    title: "Ticket Booking",
    href: ROUTES.POS,
    icon: "Ticket",
    permissions: [PERMISSIONS.BOOKINGS_CREATE],
  },
  {
    title: "Bookings",
    href: ROUTES.BOOKINGS,
    icon: "BookOpen",
    permissions: [PERMISSIONS.BOOKINGS_VIEW],
  },
  {
    title: "Transactions",
    href: ROUTES.TRANSACTIONS,
    icon: "Receipt",
    permissions: [PERMISSIONS.TRANSACTIONS_VIEW],
  },
  {
    title: "Invoices",
    href: ROUTES.INVOICES,
    icon: "FileText",
    permissions: [PERMISSIONS.INVOICES_VIEW],
  },
  {
    title: "Inventory / Capacity",
    href: ROUTES.INVENTORY,
    icon: "Boxes",
    permissions: [PERMISSIONS.INVENTORY_VIEW],
  },
  {
    title: "CCTV Monitoring",
    href: ROUTES.CCTV,
    icon: "Cctv",
    permissions: [PERMISSIONS.CCTV_VIEW],
  },
  {
    title: "Attraction Management",
    href: ROUTES.ATTRACTIONS,
    icon: "Landmark",
    permissions: [PERMISSIONS.ATTRACTIONS_VIEW],
  },
  {
    title: "Layout Management",
    href: ROUTES.LAYOUTS,
    icon: "LayoutGrid",
    permissions: [PERMISSIONS.ATTRACTIONS_VIEW],
  },
  {
    title: "Customer Management",
    href: ROUTES.CUSTOMERS,
    icon: "Users",
    permissions: [PERMISSIONS.CUSTOMERS_VIEW],
  },
  {
    title: "Complimentary Passes",
    href: ROUTES.COMPLIMENTARY_PASSES,
    icon: "TicketPercent",
    permissions: [PERMISSIONS.COMPLIMENTARY_PASSES_VIEW],
  },
  {
    title: "Reports",
    href: ROUTES.REPORTS,
    icon: "BarChart3",
    permissions: [PERMISSIONS.REPORTS_VIEW],
  },
  {
    title: "User Management",
    href: ROUTES.USERS,
    icon: "UserCog",
    permissions: [PERMISSIONS.USERS_VIEW],
  },
  {
    title: "Settings",
    href: ROUTES.SETTINGS,
    icon: "Settings",
    permissions: [PERMISSIONS.SETTINGS_VIEW],
  },
  {
    title: "Backup",
    href: ROUTES.BACKUP,
    icon: "DatabaseBackup",
    permissions: [PERMISSIONS.BACKUP_VIEW],
  },
];

/**
 * The design shows a single flat navigation list, so the Administration section
 * is intentionally empty (its items live in `mainNav` above). Kept exported so
 * the sidebar's two-section render stays unchanged.
 */
export const adminNav: NavItem[] = [];
