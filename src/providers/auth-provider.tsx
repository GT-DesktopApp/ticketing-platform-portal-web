"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Client-side session context. Wrapping the tree in `SessionProvider` lets
 * client components call `useSession()` for the current user's RBAC data.
 * Server components should prefer the server-side `auth()` helper instead.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
