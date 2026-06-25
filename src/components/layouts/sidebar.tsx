"use client";

import * as Icons from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { appConfig } from "@/config/app.config";
import { adminNav, mainNav } from "@/config/navigation";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types";

/** Resolve a Lucide icon by name with a safe fallback. */
function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp =
    (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ??
    Icons.Circle;
  return <Cmp className={className} aria-hidden />;
}

function NavSection({ label, items }: { label: string; items: NavItem[] }) {
  const pathname = usePathname();
  const { canAny } = usePermissions();

  // Filter items by the current user's permissions (RBAC-driven menu).
  const visible = items.filter(
    (item) => !item.permissions?.length || canAny(item.permissions),
  );

  if (visible.length === 0) return null;

  return (
    <div className="px-3 py-2">
      <p className="mb-1 px-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
        {label}
      </p>
      <nav className="space-y-1">
        {visible.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon name={item.icon} className="size-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/**
 * Application sidebar. Fixed on desktop, hidden on small screens (the Header's
 * mobile menu will toggle it in a later iteration). Reads navigation from
 * `config/navigation.ts` and gates items by permission.
 */
export function Sidebar({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar",
        className,
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Icons.Ticket className="size-6 text-primary" />
        <span className="font-semibold">{appConfig.shortName}</span>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <NavSection label="Operations" items={mainNav} />
        <NavSection label="Administration" items={adminNav} />
      </div>
    </aside>
  );
}
