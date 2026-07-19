"use client";

import { Armchair, Clock, IndianRupee, Pencil, Timer, Trash2 } from "lucide-react";
import { memo } from "react";

import type { ManagedAttraction } from "@/modules/attractions/types";

/** Format a rupee amount as "₹100" (no decimals when whole). */
function money(v: number): string {
  return `₹${Number.isInteger(v) ? v : v.toFixed(2)}`;
}

/**
 * A single attraction card for the management grid (Attraction_screen2): cover
 * image, name + type, timings, duration, and a compact per-category pricing
 * summary, with Edit / Delete actions. Fully responsive — the card fills its
 * grid cell and its content wraps on narrow widths.
 */
export const AttractionCard = memo(function AttractionCard({
  attraction,
  onEdit,
  onSeating,
  onDelete,
}: {
  attraction: ManagedAttraction;
  onEdit: () => void;
  /** Opens the seat layout editor. Only shown when the attraction is seated. */
  onSeating: () => void;
  onDelete: () => void;
}) {
  const { name, type, imageUrl, openTime, closeTime, durationMin, categories } =
    attraction;

  return (
    <div className="flex flex-col overflow-hidden rounded-[14px] border border-[var(--login-border)] bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Cover image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--pos-blue-soft)]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[13px] text-[var(--login-text-muted)]">
            No image
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <h3 className="text-[15px] font-bold text-[var(--pos-navy)]">
            {name}
          </h3>
          <p className="text-[12px] font-medium text-[var(--pos-amber-600)]">
            {type}
          </p>
        </div>

        <div className="space-y-1 text-[12px] text-[var(--login-text-muted)]">
          {(openTime || closeTime) && (
            <p className="flex items-center gap-1.5">
              <Clock className="size-3.5 shrink-0" />
              {openTime} – {closeTime}
            </p>
          )}
          {durationMin != null && (
            <p className="flex items-center gap-1.5">
              <Timer className="size-3.5 shrink-0" />
              Duration: {durationMin} mins
            </p>
          )}
          <div className="flex items-start gap-1.5">
            <IndianRupee className="mt-0.5 size-3.5 shrink-0" />
            <p className="flex flex-wrap gap-x-3 gap-y-0.5">
              {categories.slice(0, 6).map((c) => (
                <span key={c.id}>
                  {c.name}: {money(c.basePrice)}
                </span>
              ))}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-3">
          <button
            type="button"
            onClick={onEdit}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-[var(--pos-navy)]/25 py-2 text-[13px] font-medium text-[var(--pos-navy)] transition-colors hover:bg-[var(--login-hover-bg)]"
          >
            <Pencil className="size-3.5" /> Edit
          </button>
          {attraction.requiresSeats && (
            <button
              type="button"
              onClick={onSeating}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-[var(--pos-success)]/40 py-2 text-[13px] font-medium text-[var(--pos-success)] transition-colors hover:bg-[var(--pos-success)]/10"
            >
              <Armchair className="size-3.5" /> Seating
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-[#DC2626]/30 py-2 text-[13px] font-medium text-[#DC2626] transition-colors hover:bg-[#DC2626]/10"
          >
            <Trash2 className="size-3.5" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
});
