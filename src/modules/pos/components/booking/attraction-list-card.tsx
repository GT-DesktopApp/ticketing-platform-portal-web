"use client";

import { Castle, Landmark, PawPrint, TrainFront, Trees } from "lucide-react";
import { memo } from "react";

import type { Attraction } from "@/modules/pos/types";
import { formatPriceTag } from "@/modules/pos/utils/billing";

/** Pick a representative icon for an attraction type. */
const TYPE_ICON: Record<string, typeof TrainFront> = {
  Ride: TrainFront,
  Fort: Castle,
  Palace: Landmark,
  Zoo: PawPrint,
  Museum: Landmark,
  Heritage: Landmark,
  Garden: Trees,
};

/**
 * A row in the Attractions list (homepage2 style): icon, name, type, opening
 * hours on the left and the base price on the right. Clicking it opens the
 * attraction's category drawer. `count` shows how many tickets from this
 * attraction are currently in the cart (a small badge), if any.
 */
export const AttractionListCard = memo(function AttractionListCard({
  attraction,
  count,
  selected = false,
  onSelect,
}: {
  attraction: Attraction;
  count: number;
  /** Highlights the card when it is the one shown in the detail panel. */
  selected?: boolean;
  onSelect: () => void;
}) {
  const Icon = TYPE_ICON[attraction.type] ?? Landmark;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex w-full items-center gap-4 rounded-[12px] border bg-white p-3 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-[var(--pos-amber)] hover:shadow-md ${
        selected
          ? "border-[var(--pos-amber)] ring-1 ring-[var(--pos-amber)]"
          : "border-[var(--login-border)]"
      }`}
    >
      <div className="flex size-14 shrink-0 items-center justify-center rounded-[10px] bg-[var(--pos-blue-soft)]">
        <Icon className="size-7 text-[var(--pos-navy)]" strokeWidth={1.5} aria-hidden />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold text-[var(--pos-navy)]">
          {attraction.name}
        </p>
        <p className="text-[13px] text-[var(--login-text-muted)]">
          {attraction.type}
        </p>
        {(attraction.openTime || attraction.closeTime) && (
          <p className="text-[12px] text-[var(--login-text-muted)]">
            Open: {attraction.openTime} – {attraction.closeTime}
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1">
        <span className="text-[15px] font-bold text-[var(--pos-navy)] tabular-nums">
          {formatPriceTag(attraction.baseRatePaise / 100)}
        </span>
        {count > 0 && (
          <span className="rounded-full bg-[var(--pos-amber)] px-2 py-0.5 text-[11px] font-bold text-[#1c1407]">
            {count} in cart
          </span>
        )}
      </div>
    </button>
  );
});
