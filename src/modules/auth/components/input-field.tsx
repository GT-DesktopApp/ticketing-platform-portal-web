"use client";

import type { LucideIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

interface InputFieldProps extends React.ComponentProps<"input"> {
  /** Visible field label (always rendered for accessibility). */
  label: string;
  /** Leading icon shown inside the input (left side). */
  icon: LucideIcon;
  /** Validation / error message shown below the field. */
  error?: string;
  /** Optional element rendered on the right (e.g. the password eye toggle). */
  trailing?: React.ReactNode;
}

/**
 * Premium labeled input with a leading icon and an optional trailing slot.
 *
 * Single source of truth for login input styling (height, radius, focus ring,
 * icon padding) so every field — email, password — stays consistent. Forwards
 * its ref so it composes cleanly with `react-hook-form`'s `register()`.
 */
export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  function InputField(
    { id, label, icon: Icon, error, trailing, className, ...props },
    ref,
  ) {
    const errorId = error ? `${id}-error` : undefined;

    return (
      <div className="space-y-2">
        <label
          htmlFor={id}
          className="block text-[20px] font-semibold text-[var(--login-navy)]"
        >
          {label}
        </label>

        <div className="relative">
          <Icon
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[var(--login-text-muted)]"
          />

          <input
            id={id}
            ref={ref}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            className={cn(
              "h-[56px] w-full rounded-xl border border-[var(--login-border)] bg-white py-4 pl-12 text-[18px] text-[var(--login-navy)] transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-[17px] placeholder:text-[var(--login-text-muted)]",
              "focus:border-[var(--login-amber)] focus:ring-4 focus:ring-[rgba(251,191,36,0.2)]",
              trailing ? "pr-12" : "pr-4",
              error && "border-destructive",
              className,
            )}
            {...props}
          />

          {trailing && (
            <div className="absolute top-1/2 right-3 -translate-y-1/2">
              {trailing}
            </div>
          )}
        </div>

        {error && (
          <p id={errorId} className="text-[15px] text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  },
);
