import type { NextAuthConfig } from "next-auth";

import type { Permission } from "@/lib/constants/permissions";
import type { RoleKey } from "@/lib/constants/roles";
import {
  DEFAULT_LOGIN_REDIRECT,
  PUBLIC_ROUTES,
  ROUTES,
} from "@/lib/constants/routes";

/**
 * Edge-safe Auth.js configuration.
 *
 * Why a separate file from `auth.ts`?
 * Next.js middleware runs on the Edge runtime, which cannot use the Prisma
 * adapter or Node APIs (bcrypt, etc.). We therefore split the config:
 *   • `auth.config.ts` (this file) — pure, edge-compatible. Contains the
 *     callbacks the middleware needs (authorized) and provider *placeholders*.
 *   • `auth.ts` — the full Node config that spreads this in, adds the Prisma
 *     adapter and the Credentials provider's bcrypt logic.
 *
 * This is the officially recommended Auth.js v5 split for App Router.
 */
export const authConfig = {
  pages: {
    signIn: ROUTES.LOGIN,
  },
  session: {
    strategy: "jwt",
  },
  // Providers are added in `auth.ts` (they need Node APIs). Keep empty here.
  providers: [],
  callbacks: {
    /**
     * Route protection used by the middleware. Returning `false` for a
     * protected route triggers a redirect to the sign-in page; returning
     * `true` allows the request through.
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublicRoute = PUBLIC_ROUTES.includes(nextUrl.pathname);

      // Authenticated users hitting the login page are bounced to the dashboard.
      if (isPublicRoute) {
        if (isLoggedIn && nextUrl.pathname === ROUTES.LOGIN) {
          return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
        }
        return true;
      }

      // Everything else requires authentication.
      return isLoggedIn;
    },

    /**
     * Persist RBAC data onto the JWT. The actual roles/permissions are loaded
     * in `auth.ts`'s credential `authorize` step (Node side); here we just
     * carry them across requests on the token.
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? token.id;
        token.roles = (user.roles ?? []) as RoleKey[];
        token.permissions = (user.permissions ?? []) as Permission[];
      }
      return token;
    },

    /** Expose the JWT's RBAC fields on the session object read throughout the app. */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id ?? "") as string;
        session.user.roles = (token.roles ?? []) as RoleKey[];
        session.user.permissions = (token.permissions ?? []) as Permission[];
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
