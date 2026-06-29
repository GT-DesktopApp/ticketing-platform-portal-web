"use client";

import { Trash2 } from "lucide-react";

import { formatCurrency } from "@/modules/pos/utils/billing";

/** A cart line shown in the billing table. */
export interface CartLine {
  categoryId: string;
  name: string;
  quantity: number;
  /** Unit price in RUPEES. */
  priceRupees: number;
}

/**
 * The Cart & Billing line-item table: Item Name · Qty · Price · Amount · Delete.
 * Scrolls vertically when the list grows; the header stays put.
 */
export function BillingTable({
  lines,
  onRemove,
}: {
  lines: CartLine[];
  onRemove: (categoryId: string) => void;
}) {
  if (lines.length === 0) {
    return (
      <p className="rounded-[10px] bg-[var(--login-hover-bg)] px-4 py-6 text-center text-[13px] text-[var(--login-text-muted)]">
        No items in the cart yet — adjust quantities above.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-[10px] border border-[var(--login-border)]">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="bg-[var(--login-hover-bg)] text-left text-[12px] text-[var(--login-text-muted)]">
            <th className="px-3 py-2 font-medium">Item Name</th>
            <th className="px-2 py-2 text-center font-medium">Qty</th>
            <th className="px-2 py-2 text-right font-medium">Price</th>
            <th className="px-2 py-2 text-right font-medium">Amount</th>
            <th className="px-2 py-2 text-center font-medium">Delete</th>
          </tr>
        </thead>
        <tbody className="max-h-40">
          {lines.map((line) => (
            <tr
              key={line.categoryId}
              className="border-t border-[var(--login-border)]"
            >
              <td className="px-3 py-2 font-medium text-[var(--pos-navy)]">
                {line.name}
              </td>
              <td className="px-2 py-2 text-center tabular-nums">
                {line.quantity}
              </td>
              <td className="px-2 py-2 text-right tabular-nums">
                {formatCurrency(line.priceRupees)}
              </td>
              <td className="px-2 py-2 text-right font-semibold tabular-nums text-[var(--pos-navy)]">
                {formatCurrency(line.priceRupees * line.quantity)}
              </td>
              <td className="px-2 py-2">
                <div className="flex justify-center">
                  <button
                    type="button"
                    aria-label={`Remove ${line.name}`}
                    onClick={() => onRemove(line.categoryId)}
                    className="flex size-8 items-center justify-center rounded-md text-[#DC2626] transition-colors hover:bg-[#DC2626]/10"
                  >
                    <Trash2 className="size-[18px]" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
