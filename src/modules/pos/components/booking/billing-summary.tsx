"use client";

import {
  adjustmentTone,
  formatAdjustment,
  formatCurrency,
  type Invoice,
} from "@/modules/pos/utils/billing";

/** Green for positive, red for negative, gray for zero — per the spec. */
const TONE_CLASS = {
  positive: "text-[#16A34A]",
  negative: "text-[#DC2626]",
  neutral: "text-[var(--login-text-muted)]",
} as const;

/**
 * The billing breakdown, in the EXACT order the spec mandates:
 *   Subtotal, Round-off Subtotal Adjustment, Discount, GST (18%),
 *   Round-off GST Adjustment, Effective GST, Round Off, Total Amount.
 * Adjustments are colour-coded so the cashier sees how the total is derived.
 */
export function BillingSummary({
  invoice,
  discount = 0,
}: {
  invoice: Invoice;
  /** Optional discount in rupees (reserved; 0 today). */
  discount?: number;
}) {
  return (
    <dl className="space-y-1.5 text-[13px]">
      <Line label="Sub-Total:" value={formatCurrency(invoice.subtotalRounded)} bold />

      <Adjustment
        label="Round-off Sub-Total Adj:"
        value={invoice.subtotalAdjustment}
        muted
      />

      <Line label="Discount:" value={formatCurrency(discount)} />

      <Line label="Gst(18%):" value={formatCurrency(invoice.gstRounded)} />

      <Adjustment
        label="Round-off GST Adj:"
        value={invoice.gstAdjustment}
        muted
      />

      <Line label="Effective GST:" value={formatCurrency(invoice.effectiveGST)} bold />

      <Adjustment label="Round Off:" value={invoice.roundOff} />

      <div className="mt-2 flex items-center justify-between border-t pt-2">
        <dt className="text-[16px] font-bold text-[var(--pos-navy)]">
          Total Amount:
        </dt>
        <dd className="text-[18px] font-bold text-[var(--pos-navy)] tabular-nums">
          {formatCurrency(invoice.finalAmount)}
        </dd>
      </div>
    </dl>
  );
}

function Line({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt
        className={
          bold
            ? "font-semibold text-[var(--pos-navy)]"
            : "text-[var(--login-text-muted)]"
        }
      >
        {label}
      </dt>
      <dd
        className={`tabular-nums text-[var(--pos-navy)] ${bold ? "font-semibold" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * A signed, colour-coded adjustment row. Green for positive (invoice rounds up,
 * ≥ ₹50), red for negative (rounds down, < ₹50), gray for zero. `muted` renders
 * the label smaller/lighter (sub-adjustment rows in the reference).
 */
function Adjustment({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  const tone = adjustmentTone(value);
  return (
    <div className="flex items-center justify-between">
      <dt
        className={
          muted
            ? "text-[12px] text-[var(--login-text-muted)]"
            : "text-[var(--login-text-muted)]"
        }
      >
        {label}
      </dt>
      <dd className={`tabular-nums ${muted ? "text-[12px]" : ""} ${TONE_CLASS[tone]}`}>
        {formatAdjustment(value)}
      </dd>
    </div>
  );
}
