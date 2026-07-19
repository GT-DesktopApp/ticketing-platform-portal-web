import type { ModuleKey } from "@/modules/users/modules";

/** A user row as shown in the Users table / edit form. */
export interface ManagedUser {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  mobile: string | null;
  isActive: boolean;
  /** The user's primary role (this module assigns exactly one). */
  role: { id: string; key: string; name: string } | null;
  lastLoginAt: string | null;
  createdAt: string;
}

/** A role row as shown in the Roles table / edit form. */
export interface ManagedRole {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  assignedUsers: number;
  /** Enabled module toggles derived from the role's stored permissions. */
  modules: ModuleKey[];
  createdAt: string;
}

/** A lightweight role option for the "Select Role" dropdowns / filters. */
export interface RoleOption {
  id: string;
  key: string;
  name: string;
  isActive: boolean;
}
