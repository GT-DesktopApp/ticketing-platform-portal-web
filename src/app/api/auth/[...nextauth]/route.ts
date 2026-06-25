/**
 * Auth.js (NextAuth v5) catch-all route handler.
 *
 * Auth.js generates the GET/POST handlers for every auth endpoint
 * (/api/auth/signin, /callback, /session, /csrf, …). We simply re-export the
 * `handlers` produced by our central `auth.ts` configuration.
 */
import { handlers } from "@/lib/auth/auth";

export const { GET, POST } = handlers;
