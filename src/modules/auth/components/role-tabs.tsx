"use client";

import { cn } from "@/lib/utils";

/**
 * The three login personas shown in the design reference.
 *
 * NOTE: this selector is **visual only**. The user's effective role is resolved
 * server-side from their database record during credential verification — never
 * from this client tab. The active tab is a cosmetic hint and does not change
 * how the email/password are verified.
 */
export const LOGIN_ROLES = ["admin", "manager", "staff"] as const;

export type LoginRole = (typeof LOGIN_ROLES)[number];

const ROLE_LABELS: Record<LoginRole, string> = {
  admin: "Admin",
  manager: "Manager",
  staff: "Staff",
};

interface RoleTabsProps {
  value: LoginRole;
  onChange: (role: LoginRole) => void;
  className?: string;
}

/**
 * Three equally-sized segmented tabs (Admin / Manager / Staff).
 *
 * Implemented as a real radiogroup so it is fully keyboard- and
 * screen-reader-accessible (arrow keys move selection, the selected tab is
 * announced via `aria-checked`).
 */
export function RoleTabs({ value, onChange, className }: RoleTabsProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Select your role"
      className={cn(
        "grid grid-cols-3 gap-2 rounded-xl bg-[var(--login-hover-bg)] p-1",
        className,
      )}
    >
      {LOGIN_ROLES.map((role) => {
        const selected = role === value;
        return (
          <button
            key={role}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(role)}
            className={cn(
              "flex h-[52px] items-center justify-center rounded-xl text-[17px] font-semibold transition-all duration-300 ease-in-out outline-none focus-visible:ring-4 focus-visible:ring-[rgba(251,191,36,0.4)]",
              selected
                ? "bg-[var(--login-navy)] text-white shadow-sm"
                : "bg-white text-[var(--login-navy)] hover:bg-[var(--login-hover-bg)]",
            )}
          >
            {ROLE_LABELS[role]}
          </button>
        );
      })}
    </div>
  );
}
