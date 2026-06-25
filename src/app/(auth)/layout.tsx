import type { ReactNode } from "react";

import { appConfig } from "@/config/app.config";

/**
 * Auth layout — wraps unauthenticated screens (login, etc.).
 *
 * A centered, minimal shell with the product name. Route group `(auth)` keeps
 * these pages out of the dashboard chrome (no sidebar/header) without affecting
 * the URL (the `(auth)` segment is not part of the path).
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">{appConfig.name}</h1>
          <p className="text-sm text-muted-foreground">
            {appConfig.description}
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
