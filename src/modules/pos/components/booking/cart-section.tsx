"use client";

import { Trash2 } from "lucide-react";
import { memo } from "react";

import { BillingSummary } from "@/modules/pos/components/booking/billing-summary";
import {
  BillingTable,
  type CartLine,
} from "@/modules/pos/components/booking/billing-table";
import type { Invoice } from "@/modules/pos/utils/billing";

/**
 * Cart & Billing section. Renders ONLY the empty-state message when the cart is
 * empty; once at least one ticket exists it shows the line-item table and the
 * full billing summary. The billing summary therefore disappears automatically
 * when the cart becomes empty (spec requirement).
 */
export const CartSection = memo(function CartSection({
  lines,
  invoice,
  onRemove,
  onClear,
}: {
  lines: CartLine[];
  invoice: Invoice;
  onRemove: (categoryId: string) => void;
  onClear: () => void;
}) {
  const hasItems = lines.length > 0;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[16px] font-bold text-[var(--pos-navy)]">
          Cart &amp; Billing
        </h3>
        {hasItems && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear cart"
            className="text-[var(--login-text-muted)] transition-colors hover:text-[#DC2626]"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      {hasItems ? (
        <div className="space-y-4 rounded-[10px] bg-[var(--login-hover-bg)]/60 p-4">
          <BillingTable lines={lines} onRemove={onRemove} />
          <BillingSummary invoice={invoice} />
        </div>
      ) : (
        <div className="rounded-[10px] border border-dashed border-[var(--login-border)] bg-[var(--login-hover-bg)]/40 px-4 py-8 text-center">
          <p className="text-[14px] font-medium text-[var(--pos-navy)]">
            No tickets added yet.
          </p>
          <p className="mt-1 text-[13px] text-[var(--login-text-muted)]">
            Click an item to add it to the cart.
          </p>
        </div>
      )}
    </div>
  );
});
