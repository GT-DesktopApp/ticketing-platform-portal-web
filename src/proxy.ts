import NextAuth from "next-auth";

import { authConfig } from "@/lib/auth/auth.config";

/**
 * Edge request proxy (formerly "middleware") that enforces authentication on
 * protected routes.
 *
 * It uses the EDGE-SAFE `authConfig` (no Prisma adapter, no Node APIs) so it can
 * run on the Edge runtime. The `authorized` callback in `auth.config.ts` decides
 * which requests are allowed through vs. redirected to the login page.
 *
 * NOTE: Next.js 16 renamed the `middleware.ts` convention to `proxy.ts`. It must
 * be a single file at `src/proxy.ts` (not a folder). That is why the brief's
 * `middleware/` directory is realized here as a file — a hard framework
 * requirement. The default export and `config.matcher` shape are unchanged.
 */
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  /**
   * Run on everything except Next internals and static assets. Matching here
   * (rather than per-page) keeps protection centralized and fail-closed.
   */
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
