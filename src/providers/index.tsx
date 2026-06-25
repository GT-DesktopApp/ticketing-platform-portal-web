"use client";

import { Toaster } from "sonner";

import { AuthProvider } from "./auth-provider";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

/**
 * Single composition of every client-side provider, mounted once in the root
 * layout. Order matters: Theme (outermost, sets `class`), then Auth session,
 * then Query. Sonner's `<Toaster />` is rendered here so notifications are
 * available app-wide.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryProvider>
          {children}
          <Toaster richColors position="top-right" />
        </QueryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
