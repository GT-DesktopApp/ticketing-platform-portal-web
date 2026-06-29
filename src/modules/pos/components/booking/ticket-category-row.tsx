"use client";

import { Minus, Plus } from "lucide-react";
import { memo } from "react";

import type { TicketProduct } from "@/modules/pos/types";
import { formatCurrency } from "@/modules/pos/utils/billing";

/**
 * One ticket-category row — the shared layout for BOTH booking modes:
 *   Name (+ price/person)        [−] qty [+]      line amount
 *
 * Used for STANDARD visitor categories (Adult/Child/…) and CATEGORY tickets
 * (Indian Adult (2-way)/Boat (4)/…) identically — only the data differs.
 * Clicking +/− updates the cart + billing instantly (no Add button).
 */
export const TicketCategoryRow = memo(function TicketCategoryRow({
  category,
  quantity,
  onIncrease,
  onDecrease,
}: {
  category: TicketProduct;
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
}) {
  const priceRupees = category.pricePaise / 100;

  return (
    <div className="flex h-[60px] items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold text-[var(--pos-navy)]">
          {category.name}
        </p>
        <p className="text-[13px] text-[var(--login-text-muted)]">
          {formatCurrency(priceRupees)} / person
          {category.note ? ` · ${category.note}` : ""}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={`Decrease ${category.name}`}
            disabled={quantity <= 0}
            onClick={onDecrease}
            className="flex size-9 items-center justify-center rounded-md border border-[var(--login-border)] text-[var(--pos-navy)] transition-all duration-150 hover:border-[var(--pos-navy)] hover:bg-[var(--pos-blue-soft)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>

          <span className="w-8 text-center text-base font-semibold tabular-nums text-[var(--pos-navy)]">
            {quantity}
          </span>

          <button
            type="button"
            aria-label={`Increase ${category.name}`}
            onClick={onIncrease}
            className="flex size-9 items-center justify-center rounded-md border border-[var(--login-border)] text-[var(--pos-navy)] transition-all duration-150 hover:border-[var(--pos-navy)] hover:bg-[var(--pos-blue-soft)]"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <span className="w-20 text-right text-[15px] font-bold tabular-nums text-[var(--pos-navy)]">
          {formatCurrency(priceRupees * quantity)}
        </span>
      </div>
    </div>
  );
});
