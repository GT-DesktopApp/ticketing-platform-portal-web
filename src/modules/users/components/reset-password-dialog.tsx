"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";

import { useResetPassword } from "@/modules/users/hooks/use-users-admin";
import { resetPasswordSchema } from "@/modules/users/schemas";
import type { ManagedUser } from "@/modules/users/types";

/**
 * Admin password-reset modal (the key icon in the Users table). Sets a new
 * password for the target user; validates length + match client-side.
 */
export function ResetPasswordDialog({
  user,
  onOpenChange,
  onDone,
}: {
  /** The user to reset, or null when closed. */
  user: ManagedUser | null;
  onOpenChange: (open: boolean) => void;
  onDone: (message: string) => void;
}) {
  const reset = useResetPassword();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const parsed = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input.");
      return;
    }
    if (!user) return;
    try {
      await reset.mutateAsync({ id: user.id, input: parsed.data });
      setPassword("");
      setConfirmPassword("");
      onDone(`Password reset for ${user.name ?? user.email}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    }
  }

  return (
    <Dialog.Root open={!!user} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:zoom-in-95"
          aria-describedby={undefined}
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-[var(--pos-amber-soft)] text-[var(--pos-navy)]">
              <KeyRound className="size-5" />
            </span>
            <div>
              <Dialog.Title className="text-[16px] font-bold text-[var(--pos-navy)]">
                Reset Password
              </Dialog.Title>
              <p className="text-[13px] text-[var(--login-text-muted)]">
                {user?.name ?? user?.email}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <PwRow
              label="New Password"
              value={password}
              onChange={setPassword}
              show={show}
              onToggle={() => setShow((v) => !v)}
            />
            <PwRow
              label="Confirm Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={show}
              onToggle={() => setShow((v) => !v)}
            />
            {error && <p className="text-[12px] text-[#DC2626]">{error}</p>}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-md border border-[var(--login-border)] px-4 py-2 text-[13px] font-medium text-[var(--pos-navy)] transition-colors hover:bg-[var(--login-hover-bg)]"
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={submit}
              disabled={reset.isPending}
              className="rounded-md bg-[var(--pos-amber)] px-4 py-2 text-[13px] font-semibold text-[#1c1407] transition-colors hover:bg-[var(--pos-amber-600)] disabled:opacity-60"
            >
              {reset.isPending ? "Saving…" : "Reset Password"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PwRow({
  label,
  value,
  onChange,
  show,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="text-[13px] font-medium text-[var(--pos-navy)]">
        {label}
      </label>
      <div className="mt-1 flex h-10 items-center rounded-md border border-[var(--login-border)] px-3 focus-within:border-[var(--pos-amber)]">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className="w-full bg-transparent text-[14px] outline-none"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Hide" : "Show"}
          className="text-[var(--login-text-muted)] hover:text-[var(--pos-navy)]"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}
