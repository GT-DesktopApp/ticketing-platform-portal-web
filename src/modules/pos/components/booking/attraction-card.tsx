"use client";

import { AttractionIcon } from "@/modules/pos/components/booking/attraction-icon";
import type { Attraction } from "@/modules/pos/types";
import { formatCurrency } from "@/modules/pos/utils/billing";

/**
 * An attraction row in the left list: 60×60 icon, name (18px), category (14px),
 * opening hours (13px), and the right-aligned price (18px / 700). Selected =
 * gold border + light-gold background; hover lifts slightly.
 */
export function AttractionCard({
  attraction,
  active,
  onSelect,
}: {
  attraction: Attraction;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex h-[90px] w-full items-center gap-4 rounded-[12px] border p-4 text-left transition-all duration-150 ${
        active
          ? "border-[var(--pos-amber)] bg-[var(--pos-amber-soft)] shadow-sm"
          : "border-[var(--login-border)] bg-white hover:-translate-y-0.5 hover:border-[var(--pos-amber)]/60 hover:shadow-sm"
      }`}
    >
      <div
        className={`flex size-[60px] shrink-0 items-center justify-center rounded-[10px] ${
          active ? "bg-white" : "bg-[var(--pos-blue-soft)]"
        }`}
      >
        <AttractionIcon
          type={attraction.type}
          className="size-8 text-[var(--pos-navy)]"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[18px] font-semibold leading-tight text-[var(--pos-navy)]">
          {attraction.name}
        </p>
        <p className="text-[14px] text-[var(--login-text-muted)]">
          {attraction.type}
        </p>
        {(attraction.openTime || attraction.closeTime) && (
          <p className="text-[13px] text-[var(--login-text-muted)]">
            Open: {attraction.openTime} – {attraction.closeTime}
          </p>
        )}
      </div>

      <span className="shrink-0 text-[18px] font-bold text-[var(--pos-navy)]">
        {formatCurrency(attraction.baseRatePaise / 100)}
      </span>
    </button>
  );
}
