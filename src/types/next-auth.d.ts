import type { DefaultSession } from "next-auth";

import type { Permission } from "@/lib/constants/permissions";
import type { RoleKey } from "@/lib/constants/roles";

/**
 * Module augmentation for Auth.js (NextAuth v5).
 *
 * We enrich the default `Session.user` and the JWT with the RBAC fields the
 * whole app relies on (`id`, `roles`, `permissions`). Without this, those
 * fields would be `any`/missing and the permission guards would not type-check.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: RoleKey[];
      permissions: Permission[];
    } & DefaultSession["user"];
  }

  interface User {
    roles?: RoleKey[];
    permissions?: Permission[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roles: RoleKey[];
    permissions: Permission[];
  }
}
