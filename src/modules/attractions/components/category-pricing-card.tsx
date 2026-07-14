"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useId, useRef } from "react";

import type { CategoryDraft } from "@/modules/attractions/components/attraction-form";

/**
 * One visitor-category card in the "Visitor Categories & Pricing" grid
 * (Attraction_screen): a small circular image with an "Upload Image" action,
 * Base Price*, Future Price, Effective From date, and a Delete button. Errors
 * for the row's fields render inline.
 */
export function CategoryPricingCard({
  draft,
  errors,
  onChange,
  onDelete,
}: {
  draft: CategoryDraft;
  errors: Partial<Record<"name" | "basePrice" | "effectiveFrom", string>>;
  onChange: (patch: Partial<CategoryDraft>) => void;
  onDelete: () => void;
}) {
  const fileId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleImage(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 3 * 1024 * 1024) return; // 3 MB guard
    const reader = new FileReader();
    reader.onload = () => onChange({ image: reader.result as string });
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[var(--login-border)] bg-white p-3">
      {/* Name (editable) */}
      <input
        value={draft.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="Category name"
        className="w-full rounded-md border border-transparent bg-transparent text-center text-[15px] font-bold text-[var(--pos-navy)] outline-none focus:border-[var(--login-border)] focus:bg-white"
      />
      {errors.name && (
        <p className="text-center text-[11px] text-[#DC2626]">{errors.name}</p>
      )}

      {/* Circular image + upload */}
      <div className="flex flex-col items-center gap-1.5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex size-20 items-center justify-center overflow-hidden rounded-full border border-[var(--login-border)] bg-[var(--pos-blue-soft)]"
        >
          {draft.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={draft.image}
              alt={draft.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImagePlus className="size-6 text-[var(--pos-navy)]/50" />
          )}
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-[12px] font-medium text-[var(--pos-amber-600)] underline-offset-2 hover:underline"
        >
          Upload Image
        </button>
        <input
          ref={inputRef}
          id={fileId}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImage(e.target.files?.[0])}
        />
      </div>

      {/* Base Price */}
      <label className="text-[12px] font-medium text-[var(--pos-navy)]">
        Base Price (₹)*
      </label>
      <div className="flex items-center rounded-md border border-[var(--login-border)] px-2 focus-within:border-[var(--pos-amber)]">
        <span className="text-[13px] text-[var(--login-text-muted)]">₹</span>
        <input
          type="number"
          min={0}
          step="0.01"
          value={draft.basePrice}
          onChange={(e) => onChange({ basePrice: e.target.value })}
          placeholder="0.00"
          className="w-full bg-transparent px-1.5 py-1.5 text-[13px] outline-none"
        />
      </div>
      {errors.basePrice && (
        <p className="text-[11px] text-[#DC2626]">{errors.basePrice}</p>
      )}

      {/* Future Price */}
      <label className="text-[12px] font-medium text-[var(--pos-navy)]">
        Future Price (₹)
      </label>
      <div className="flex items-center rounded-md border border-[var(--login-border)] px-2 focus-within:border-[var(--pos-amber)]">
        <span className="text-[13px] text-[var(--login-text-muted)]">₹</span>
        <input
          type="number"
          min={0}
          step="0.01"
          value={draft.futurePrice}
          onChange={(e) => onChange({ futurePrice: e.target.value })}
          placeholder="0.00"
          className="w-full bg-transparent px-1.5 py-1.5 text-[13px] outline-none"
        />
      </div>

      {/* Effective From */}
      <label className="text-[12px] font-medium text-[var(--pos-navy)]">
        Effective From
      </label>
      <input
        type="date"
        value={draft.effectiveFrom}
        onChange={(e) => onChange({ effectiveFrom: e.target.value })}
        className="w-full rounded-md border border-[var(--login-border)] px-2 py-1.5 text-[13px] outline-none focus:border-[var(--pos-amber)]"
      />
      {errors.effectiveFrom && (
        <p className="text-[11px] text-[#DC2626]">{errors.effectiveFrom}</p>
      )}

      {/* Delete */}
      <button
        type="button"
        onClick={onDelete}
        className="mt-1 flex items-center justify-center gap-1.5 rounded-md border border-[#DC2626]/30 py-1.5 text-[12px] font-medium text-[#DC2626] transition-colors hover:bg-[#DC2626]/10"
      >
        <Trash2 className="size-3.5" /> Delete
      </button>
    </div>
  );
}
