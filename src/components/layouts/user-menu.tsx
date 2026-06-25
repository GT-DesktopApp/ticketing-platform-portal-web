"use client";

import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import { getInitials } from "@/lib/utils";

/**
 * Header user menu.
 *
 * Foundation version: shows the signed-in user's avatar/initials, name, and a
 * sign-out action. A full dropdown (profile, theme toggle, etc.) can be added
 * with the Shadcn `dropdown-menu` component later — the data wiring is already
 * here via `useSession`.
 */
export function UserMenu() {
  const { data: session } = useSession();
  const user = session?.user;

  const displayName = user?.name ?? user?.email ?? "User";

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm leading-none font-medium">{displayName}</p>
        {user?.email && (
          <p className="text-xs text-muted-foreground">{user.email}</p>
        )}
      </div>
      <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
        {getInitials(displayName)}
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Sign out"
        onClick={() => signOut({ callbackUrl: ROUTES.LOGIN })}
      >
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}
