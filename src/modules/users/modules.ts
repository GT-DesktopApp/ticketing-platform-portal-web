import { type Permission,PERMISSIONS } from "@/lib/constants/permissions";

/**
 * The 12 "Module Permissions" shown as checkboxes on the Role form
 * (ATTRACTION_ROlescreation), in the exact order of the sidebar.
 *
 * A role is stored as a flat set of action-level permissions (`x.view`,
 * `x.create`, …). Each module toggle expands to that module's FULL permission
 * bundle here, so checking "Customer Management" grants
 * customers.view/create/update/delete. `toModulePermissions` / `fromPermissions`
 * convert between the UI's module keys and the stored permission set.
 */

export type ModuleKey =
  | "ticket_booking"
  | "bookings"
  | "transactions"
  | "invoices"
  | "inventory"
  | "cctv"
  | "attractions"
  | "customers"
  | "reports"
  | "user_management"
  | "settings"
  | "backup";

export interface ModuleMeta {
  key: ModuleKey;
  /** Label shown on the checkbox (matches the sidebar wording). */
  label: string;
  /** Lucide icon name resolved at render time. */
  icon: string;
  /** Full permission bundle granted when this module is enabled. */
  permissions: Permission[];
}

/** The module catalog, in sidebar order. */
export const MODULES: ModuleMeta[] = [
  {
    key: "ticket_booking",
    label: "Ticket Booking",
    icon: "Ticket",
    permissions: [
      PERMISSIONS.BOOKINGS_VIEW,
      PERMISSIONS.BOOKINGS_CREATE,
      PERMISSIONS.TICKETS_VIEW,
      PERMISSIONS.TICKETS_CREATE,
      PERMISSIONS.TICKETS_PRINT,
      PERMISSIONS.TICKETS_VERIFY,
    ],
  },
  {
    key: "bookings",
    label: "Bookings",
    icon: "BookOpen",
    permissions: [PERMISSIONS.BOOKINGS_VIEW],
  },
  {
    key: "transactions",
    label: "Transactions",
    icon: "Receipt",
    permissions: [PERMISSIONS.TRANSACTIONS_VIEW],
  },
  {
    key: "invoices",
    label: "Invoices",
    icon: "FileText",
    permissions: [PERMISSIONS.INVOICES_VIEW],
  },
  {
    key: "inventory",
    label: "Inventory/capacity",
    icon: "Boxes",
    permissions: [PERMISSIONS.INVENTORY_VIEW],
  },
  {
    key: "cctv",
    label: "CCTV Monitoring",
    icon: "Cctv",
    permissions: [PERMISSIONS.CCTV_VIEW],
  },
  {
    key: "attractions",
    label: "Attraction Management",
    icon: "Landmark",
    permissions: [PERMISSIONS.ATTRACTIONS_VIEW, PERMISSIONS.ATTRACTIONS_MANAGE],
  },
  {
    key: "customers",
    label: "Customer Management",
    icon: "UserCog",
    permissions: [
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.CUSTOMERS_CREATE,
      PERMISSIONS.CUSTOMERS_UPDATE,
      PERMISSIONS.CUSTOMERS_DELETE,
    ],
  },
  {
    key: "reports",
    label: "Reports",
    icon: "BarChart3",
    permissions: [PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_EXPORT],
  },
  {
    key: "user_management",
    label: "User Management",
    icon: "Users",
    permissions: [
      PERMISSIONS.USERS_VIEW,
      PERMISSIONS.USERS_CREATE,
      PERMISSIONS.USERS_UPDATE,
      PERMISSIONS.USERS_DELETE,
      PERMISSIONS.ROLES_VIEW,
      PERMISSIONS.ROLES_CREATE,
      PERMISSIONS.ROLES_UPDATE,
      PERMISSIONS.ROLES_DELETE,
      PERMISSIONS.PERMISSIONS_VIEW,
      PERMISSIONS.PERMISSIONS_ASSIGN,
    ],
  },
  {
    key: "settings",
    label: "Settings",
    icon: "Settings",
    permissions: [PERMISSIONS.SETTINGS_VIEW],
  },
  {
    key: "backup",
    label: "Backup",
    icon: "DatabaseBackup",
    permissions: [PERMISSIONS.BACKUP_VIEW],
  },
];

const MODULE_BY_KEY = new Map(MODULES.map((m) => [m.key, m]));

/** Expand a set of enabled module keys into the flat permission list to store. */
export function modulesToPermissions(moduleKeys: ModuleKey[]): Permission[] {
  const set = new Set<Permission>();
  for (const key of moduleKeys) {
    const mod = MODULE_BY_KEY.get(key);
    if (mod) mod.permissions.forEach((p) => set.add(p));
  }
  return [...set];
}

/**
 * Derive which module toggles are "on" from a stored permission set.
 *
 * A module is a candidate when ALL of its bundle permissions are present. Some
 * bundles overlap (e.g. "Bookings" = [bookings.view] is a strict subset of
 * "Ticket Booking"), which would light up BOTH toggles for a role that only has
 * the larger module. To keep the display faithful to what was actually chosen,
 * a candidate is dropped when another candidate is a strict SUPERSET of it — the
 * larger module already implies the smaller one, so only the larger lights up.
 */
export function permissionsToModules(perms: string[]): ModuleKey[] {
  const owned = new Set(perms);
  const candidates = MODULES.filter(
    (m) => m.permissions.length > 0 && m.permissions.every((p) => owned.has(p)),
  );

  return candidates
    .filter((m) => {
      const mine = new Set(m.permissions);
      // Drop `m` if some OTHER candidate strictly contains all of m's perms.
      return !candidates.some(
        (other) =>
          other.key !== m.key &&
          other.permissions.length > m.permissions.length &&
          m.permissions.every((p) => new Set(other.permissions).has(p)) &&
          // guard: identical-but-larger only (m is a proper subset of other)
          mine.size < other.permissions.length,
      );
    })
    .map((m) => m.key);
}
