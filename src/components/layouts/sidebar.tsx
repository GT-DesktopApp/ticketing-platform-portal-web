"use client";

import * as Icons from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import { adminNav, mainNav } from "@/config/navigation";
import { usePermissions } from "@/hooks/use-permissions";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types";

/** Resolve a Lucide icon by name with a safe fallback. */
function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp =
    (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ??
    Icons.Circle;
  return <Cmp className={className} aria-hidden />;
}

function NavSection({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const { canAny } = usePermissions();

  // Filter by the current user's permissions (RBAC-driven menu).
  const visible = items.filter(
    (item) => !item.permissions?.length || canAny(item.permissions),
  );
  if (visible.length === 0) return null;

  return (
    <nav className="space-y-1 px-3">
      {visible.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors duration-150",
              active
                ? "bg-[var(--pos-amber)] text-[#1c1407] shadow-sm"
                : "text-white/75 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon name={item.icon} className="size-[18px] shrink-0" />
            <span className="truncate">{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Application sidebar — navy POS shell (homepage2). Fixed ~250px column with a
 * branded header, RBAC-gated navigation (gold active highlight), and a Logout
 * pinned to the bottom. Hidden below `lg` (a mobile drawer toggle comes later).
 */
export function Sidebar({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "flex h-full w-[250px] flex-col text-white",
        className,
      )}
      style={{ background: "var(--pos-navy)" }}
    >
      {/* Brand header */}
      <div className="flex h-16 items-center gap-2.5 px-6">
        <Icons.TicketCheck className="size-6 text-[var(--pos-amber)]" />
        <span className="text-[15px] font-semibold">Ticket Booking</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 space-y-4 overflow-y-auto py-4">
        <NavSection items={mainNav} />
        <div className="mx-6 border-t border-white/10" />
        <NavSection items={adminNav} />
      </div>

      {/* Logout pinned to the bottom */}
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: ROUTES.LOGIN })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium text-white/75 transition-colors duration-150 hover:bg-white/10 hover:text-white"
        >
          <Icons.LogOut className="size-[18px]" />
          Logout
        </button>
      </div>
    </aside>
  );
}
