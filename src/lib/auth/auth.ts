import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import type { Permission } from "@/lib/constants/permissions";
import type { RoleKey } from "@/lib/constants/roles";
import { prisma } from "@/lib/prisma";

import { authConfig } from "./auth.config";

/**
 * Full (Node-runtime) Auth.js instance.
 *
 * This is the FOUNDATION only — wiring is in place but the credential check is
 * intentionally left as a clearly-marked stub (see `authorize`) per the project
 * brief ("create the foundation, do not implement full authentication yet").
 *
 * What IS wired and ready:
 *   • Prisma adapter (for future OAuth/email link flows).
 *   • JWT session strategy with RBAC claims (roles + permissions) on the token.
 *   • A Credentials provider skeleton that, once enabled, verifies a bcrypt
 *     hash and loads the user's flattened permission set.
 */

/**
 * Load a user's roles and flattened, de-duplicated permission keys from the DB.
 * Used to populate the JWT at sign-in time so every request has RBAC data
 * without an extra query.
 */
async function loadUserAuthorization(userId: string): Promise<{
  roles: RoleKey[];
  permissions: Permission[];
}> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          rolePermissions: { include: { permission: true } },
        },
      },
    },
  });

  const roles = userRoles.map((ur) => ur.role.key as RoleKey);
  const permissions = Array.from(
    new Set(
      userRoles.flatMap((ur) =>
        ur.role.rolePermissions.map((rp) => rp.permission.key as Permission),
      ),
    ),
  );

  return { roles, permissions };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      /**
       * FOUNDATION STUB — full credentials login is implemented in a later
       * milestone. The structure below shows exactly how it will work:
       *
       *   1. Validate the input with the auth module's Zod login schema.
       *   2. Look up the user by email; reject if missing/inactive.
       *   3. Compare the password against `passwordHash` with bcrypt.
       *   4. Load roles + permissions and return them on the user object so the
       *      `jwt` callback can persist them.
       *
       * Returning `null` here keeps login disabled until we deliberately enable
       * it, which is the intended "foundation only" behavior.
       */
      async authorize() {
        // TODO(auth-milestone): implement credential verification.
        // const parsed = loginSchema.safeParse(credentials);
        // if (!parsed.success) return null;
        // const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        // if (!user || !user.isActive || !user.passwordHash) return null;
        // const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        // if (!valid) return null;
        // const { roles, permissions } = await loadUserAuthorization(user.id);
        // return { id: user.id, email: user.email, name: user.name, image: user.image, roles, permissions };
        return null;
      },
    }),
  ],
});

// Exported for the eventual credential implementation and for tests.
export { loadUserAuthorization };
