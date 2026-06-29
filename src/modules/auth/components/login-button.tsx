"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

interface LoginButtonProps extends React.ComponentProps<"button"> {
  /** Shows a spinner and the loading label while a sign-in request is in flight. */
  loading?: boolean;
}

/**
 * Full-width amber primary action for the login form.
 *
 * Kept as a thin, purpose-built component (rather than reusing the generic
 * shadcn Button) so the login screen owns its exact amber spec — 56px height,
 * 22px/700 text, smooth hover — without leaking those overrides app-wide.
 */
export function LoginButton({
  loading,
  disabled,
  children,
  className,
  type = "submit",
  ...props
}: LoginButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled ?? loading}
      aria-busy={loading}
      className={cn(
        "flex h-[56px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--login-amber)] text-[22px] font-bold text-[#1c1407] transition-all duration-200 ease-in-out outline-none",
        "hover:bg-[var(--login-amber-hover)] focus-visible:ring-4 focus-visible:ring-[rgba(251,191,36,0.45)]",
        "disabled:cursor-not-allowed disabled:opacity-70",
        className,
      )}
      {...props}
    >
      {loading && <Loader2 aria-hidden className="size-5 animate-spin" />}
      {children}
    </button>
  );
}
