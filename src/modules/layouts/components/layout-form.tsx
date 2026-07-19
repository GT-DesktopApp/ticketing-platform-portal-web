"use client";

import { useState } from "react";

import {
  draftToInput,
  initialDraft,
  type LayoutDraft,
  LayoutEditor,
} from "@/modules/layouts/components/layout-editor";
import {
  useCreateLayout,
  useUpdateLayout,
} from "@/modules/layouts/hooks/use-layouts";
import { layoutInputSchema } from "@/modules/layouts/schemas";
import type { ManagedLayout } from "@/modules/layouts/types";

/**
 * Standalone Add / Edit Layout form (Layout Management + the attraction Seating
 * action). Wraps the shared LayoutEditor with a Cancel / Save footer and handles
 * the create/update mutation.
 */
export function LayoutForm({
  layout,
  onCancel,
  onSaved,
}: {
  layout: ManagedLayout | null;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const isEdit = !!layout;
  const createMut = useCreateLayout();
  const updateMut = useUpdateLayout();
  const saving = createMut.isPending || updateMut.isPending;

  const [draft, setDraft] = useState<LayoutDraft>(() => initialDraft(layout));
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSave() {
    setServerError(null);
    setErrors({});
    const parsed = layoutInputSchema.safeParse(draftToInput(draft));
    if (!parsed.success) {
      const nameIssue = parsed.error.issues.find((i) => i.path[0] === "name");
      setErrors({ name: nameIssue?.message ?? "Please check the layout." });
      return;
    }
    try {
      if (isEdit && layout) {
        await updateMut.mutateAsync({ id: layout.id, input: parsed.data });
        onSaved("Layout updated.");
      } else {
        await createMut.mutateAsync(parsed.data);
        onSaved("Layout created.");
      }
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Failed to save layout.",
      );
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-24">
      <LayoutEditor draft={draft} errors={errors} onChange={setDraft} />

      {serverError && (
        <p className="rounded-md border border-[#DC2626]/30 bg-[#DC2626]/5 px-3 py-2 text-[13px] text-[#DC2626]">
          {serverError}
        </p>
      )}

      <div className="sticky bottom-0 -mx-6 flex items-center justify-between border-t border-[var(--login-border)] bg-white/95 px-6 py-3 backdrop-blur">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-[var(--login-border)] px-6 py-2.5 text-[14px] font-medium text-[var(--pos-navy)] transition-colors hover:bg-[var(--login-hover-bg)]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-[var(--pos-amber)] px-6 py-2.5 text-[14px] font-semibold text-[#1c1407] transition-colors hover:bg-[var(--pos-amber-600)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Attraction"}
        </button>
      </div>
    </div>
  );
}
