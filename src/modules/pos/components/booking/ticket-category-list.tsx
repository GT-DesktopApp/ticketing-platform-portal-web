"use client";

import { memo } from "react";

import { TicketCategoryRow } from "@/modules/pos/components/booking/ticket-category-row";
import type { TicketProduct } from "@/modules/pos/types";

/**
 * Vertical list of ticket-category rows for the selected attraction. Dynamic —
 * the rows come from the attraction (visitor categories in STANDARD mode, ticket
 * categories in CATEGORY mode), never hardcoded. Same layout for both modes.
 */
export const TicketCategoryList = memo(function TicketCategoryList({
  categories,
  quantities,
  onIncrease,
  onDecrease,
}: {
  categories: TicketProduct[];
  /** category id -> quantity in cart */
  quantities: Record<string, number>;
  onIncrease: (categoryId: string) => void;
  onDecrease: (categoryId: string) => void;
}) {
  if (categories.length === 0) {
    return (
      <p className="text-[13px] text-[var(--login-text-muted)]">
        This attraction has no ticket categories configured.
      </p>
    );
  }

  return (
    <div className="divide-y divide-[var(--login-border)]">
      {categories.map((category) => (
        <TicketCategoryRow
          key={category.id}
          category={category}
          quantity={quantities[category.id] ?? 0}
          onIncrease={() => onIncrease(category.id)}
          onDecrease={() => onDecrease(category.id)}
        />
      ))}
    </div>
  );
});
