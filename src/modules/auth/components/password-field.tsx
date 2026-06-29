"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import * as React from "react";

import { InputField } from "./input-field";

type PasswordFieldProps = Omit<
  React.ComponentProps<typeof InputField>,
  "icon" | "type" | "trailing"
>;

/**
 * Password input with a leading lock icon and a right-side visibility toggle.
 *
 * Owns its own `showPassword` state and flips the input `type` between
 * `password` and `text` (password → text → password). Forwards its ref so it
 * still binds to `react-hook-form`'s `register()`.
 */
export const PasswordField = React.forwardRef<
  HTMLInputElement,
  PasswordFieldProps
>(function PasswordField(props, ref) {
  const [showPassword, setShowPassword] = React.useState(false);

  const ToggleIcon = showPassword ? EyeOff : Eye;

  return (
    <InputField
      {...props}
      ref={ref}
      icon={Lock}
      type={showPassword ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          className="flex size-9 items-center justify-center rounded-lg text-[var(--login-text-muted)] transition-colors duration-200 outline-none hover:text-[var(--login-navy)] focus-visible:ring-2 focus-visible:ring-[rgba(251,191,36,0.5)]"
        >
          <ToggleIcon aria-hidden className="size-5" />
        </button>
      }
    />
  );
});
