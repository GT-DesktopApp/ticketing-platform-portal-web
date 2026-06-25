import type { Permission } from "@/lib/constants/permissions";
import type { RoleKey } from "@/lib/constants/roles";

/**
 * Cross-cutting application types.
 * Feature-specific types live in `modules/<feature>/types`.
 */

/** The authenticated user shape carried in the session/JWT. */
export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  roles: RoleKey[];
  permissions: Permission[];
}

/** A generic option for selects, filters, etc. */
export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

/** Standard sort descriptor used by tables and list services. */
export interface SortDescriptor {
  field: string;
  order: "asc" | "desc";
}

/** A single navigation item rendered in the sidebar. */
export interface NavItem {
  title: string;
  href: string;
  /** Lucide icon name resolved at render time. */
  icon: string;
  /** Permission(s) required to see this item; empty = always visible when authed. */
  permissions?: Permission[];
}
