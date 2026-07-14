"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle } from "lucide-react";

/**
 * A small confirmation modal (used for deleting an attraction). Radix Dialog
 * gives us focus-trap / Esc / backdrop-close for free.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  confirmLabel = "Delete",
  loading = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:zoom-in-95"
          aria-describedby={undefined}
        >
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#DC2626]/10 text-[#DC2626]">
              <AlertTriangle className="size-5" />
            </span>
            <div className="min-w-0">
              <Dialog.Title className="text-[16px] font-bold text-[var(--pos-navy)]">
                {title}
              </Dialog.Title>
              <p className="mt-1 text-[13px] text-[var(--login-text-muted)]">
                {message}
              </p>
            </div>
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
              onClick={onConfirm}
              disabled={loading}
              className="rounded-md bg-[#DC2626] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Deleting…" : confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
