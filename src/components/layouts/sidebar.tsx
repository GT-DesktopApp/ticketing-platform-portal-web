"use client";

import * as Icons from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import { adminNav, mainNav } from "@/config/navigation";
import { usePermissions } from "@/hooks/use-permissions";
import { ROUTES } from "@/lib/constants/routes";
import { useUiStore } from "@/lib/stores/ui-store";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types";

/** Resolve a Lucide icon by name with a safe fallback. */
function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp =
    (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ??
    Icons.Circle;
  return <Cmp className={className} aria-hidden />;
}

function NavSection({
  items,
  collapsed,
}: {
  items: NavItem[];
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const { canAny } = usePermissions();

  // Filter by the current user's permissions (RBAC-driven menu).
  const visible = items.filter(
    (item) => !item.permissions?.length || canAny(item.permissions),
  );
  if (visible.length === 0) return null;

  return (
    <nav className={cn("space-y-1", collapsed ? "px-2" : "px-3")}>
      {visible.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            // In collapsed mode the label is hidden; the native title acts as a
            // tooltip so icons stay identifiable.
            title={collapsed ? item.title : undefined}
            aria-label={item.title}
            className={cn(
              "flex items-center rounded-lg text-[14px] font-medium transition-colors duration-150",
              collapsed
                ? "justify-center p-2.5"
                : "gap-3 px-3 py-2.5",
              active
                ? "bg-[var(--pos-amber)] text-[#1c1407] shadow-sm"
                : "text-white/75 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon name={item.icon} className="size-[18px] shrink-0" />
            {!collapsed && <span className="truncate">{item.title}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Application sidebar — navy POS shell. Two states driven by the persisted UI
 * store (SIDE PANEL E / Close designs):
 *   • expanded  (~250px): brand + labelled nav, toggle top-right.
 *   • collapsed (~72px):  icon-only rail with tooltips, toggle centered.
 * The width animates between the two; Logout stays pinned to the bottom.
 */
export function Sidebar({ className }: { className?: string }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "flex h-full flex-col text-white transition-[width] duration-200 ease-in-out",
        collapsed ? "w-[72px]" : "w-[250px]",
        className,
      )}
      style={{ background: "var(--pos-navy)" }}
    >
      {/* Header: brand (expanded) + collapse toggle. */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-white/10",
          collapsed ? "justify-center px-2" : "justify-between px-4",
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <Icons.TicketCheck className="size-6 text-[var(--pos-amber)]" />
            <span className="text-[15px] font-semibold">Ticket Booking</span>
          </div>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className="flex size-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--pos-amber)] focus-visible:outline-none"
        >
          <Icons.ListCollapse className="size-5" />
        </button>
      </div>

      {/* Navigation (single flat list per the design). */}
      <div className="flex-1 space-y-4 overflow-y-auto py-4">
        <NavSection items={mainNav} collapsed={collapsed} />
        {adminNav.length > 0 && (
          <>
            <div
              className={cn(
                "border-t border-white/10",
                collapsed ? "mx-2" : "mx-4",
              )}
            />
            <NavSection items={adminNav} collapsed={collapsed} />
          </>
        )}
      </div>

      {/* Logout pinned to the bottom */}
      <div className={cn("border-t border-white/10", collapsed ? "p-2" : "p-3")}>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: ROUTES.LOGIN })}
          title={collapsed ? "Logout" : undefined}
          aria-label="Logout"
          className={cn(
            "flex w-full items-center rounded-lg text-[14px] font-medium text-white/75 transition-colors duration-150 hover:bg-white/10 hover:text-white",
            collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
          )}
        >
          <Icons.LogOut className="size-[18px] shrink-0" />
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
}
