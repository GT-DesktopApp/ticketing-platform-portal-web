import type { Metadata } from "next";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sign in",
};

/**
 * Login page (foundation).
 *
 * Renders the credentials form shell. The interactive form (React Hook Form +
 * Zod `loginSchema` + `signIn("credentials", …)`) is implemented in the auth
 * milestone; this static version establishes the layout and route.
 */
export default function LoginPage() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Sign in</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Enter your credentials to access the admin console.
      </p>

      <form className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            disabled
            placeholder="you@company.com"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-60"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            disabled
            placeholder="••••••••"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-60"
          />
        </div>
        <Button type="button" className="w-full" disabled>
          Sign in (enabled in the auth milestone)
        </Button>
      </form>
    </div>
  );
}
