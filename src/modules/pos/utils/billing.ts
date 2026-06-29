/**
 * POS billing engine — the single source of truth for invoice math.
 *
 * RULES (per spec):
 *   • GST is a flat 18% of the subtotal.
 *   • The final payable amount is ALWAYS a whole rupee (invoices never store
 *     fractional money).
 *   • Round-off direction depends on the effective total:
 *       – effective total  < ₹50  → round DOWN  (Math.floor)
 *       – effective total ≥ ₹50  → round UP    (Math.ceil)
 *   • Every intermediate adjustment (subtotal, GST, round-off) is surfaced so
 *     the cashier can see exactly how the final number is derived.
 *
 * All functions are PURE and framework-agnostic. Components must call these and
 * never inline billing math (keeps the rules in one auditable place).
 */

/** GST rate applied to the subtotal. */
export const GST_RATE = 0.18;

/** Threshold (in rupees) that flips the round-off direction. */
export const ROUND_OFF_THRESHOLD = 50;

/** A single billable line: unit price (in rupees) × quantity. */
export interface BillingLineInput {
  /** Unit price in RUPEES (full precision; may be fractional). */
  price: number;
  quantity: number;
}

/** The fully-derived invoice, with every intermediate value exposed. */
export interface Invoice {
  /** Raw subtotal, full precision (Σ price × qty). */
  subtotalRaw: number;
  /** Subtotal rounded to 2 dp for display ("Sub-Total"). */
  subtotalRounded: number;
  /** Sub-total's proportional share of the Round Off (signed). */
  subtotalAdjustment: number;

  /** Raw GST, full precision (subtotal × 18%). */
  gstRaw: number;
  /** GST rounded to 2 dp (the "GST (18%)" display value). */
  gstRounded: number;
  /** GST's proportional share of the Round Off (signed). */
  gstAdjustment: number;

  /** Effective GST shown to the cashier (gstRounded + gstAdjustment). */
  effectiveGST: number;

  /** Effective total before whole-rupee rounding (subtotalRounded + gstRounded). */
  effectiveTotal: number;

  /** finalAmount − effectiveTotal (negative when rounded down, positive when up). */
  roundOff: number;

  /** The whole-rupee amount the customer pays. */
  finalAmount: number;
}

/** Σ (price × quantity), full precision. */
export function calculateSubtotal(lines: BillingLineInput[]): number {
  return lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
}

/** GST on a subtotal, full precision (subtotal × 18%). */
export function calculateGST(subtotal: number): number {
  return subtotal * GST_RATE;
}

/**
 * Whole-rupee round-off for an effective total:
 *   < ₹50  → floor, ≥ ₹50 → ceil.
 * Returns [finalAmount, roundOffDelta] where delta = final − effective.
 */
export function calculateRoundOff(effectiveTotal: number): [number, number] {
  const finalAmount =
    effectiveTotal < ROUND_OFF_THRESHOLD
      ? Math.floor(effectiveTotal)
      : Math.ceil(effectiveTotal);
  const roundOff = to2(finalAmount - effectiveTotal);
  return [finalAmount, roundOff];
}

/**
 * Derive the complete invoice from a raw subtotal (in rupees).
 *
 * Matches the 50less.png / 50More.png reference exactly:
 *   1. Sub-Total and GST(18%) are each rounded to 2 dp for display.
 *   2. effectiveTotal = subTotalRounded + gstRounded; the final payable is a
 *      whole rupee (< ₹50 floor, ≥ ₹50 ceil).
 *   3. The whole "Round Off" delta (final − effective) is SPLIT proportionally
 *      between the sub-total and the GST by their share of the effective total:
 *         subtotalAdjustment = roundOff × (subTotal / effectiveTotal)
 *         gstAdjustment      = roundOff − subtotalAdjustment   (remainder, exact)
 *      so the two adjustments always sum back to the Round Off.
 *   4. Effective GST = gstRounded + gstAdjustment.
 *
 * 2-dp rounding uses `Number(x.toFixed(2))`, so JS float representation governs
 * ties exactly as the reference numbers expect (e.g. 33.275 → 33.27).
 */
export function calculateInvoice(subtotal: number): Invoice {
  const gstRaw = subtotal * GST_RATE;

  const subtotalRounded = to2(subtotal);
  const gstRounded = to2(gstRaw);

  const effective = to2(subtotalRounded + gstRounded);

  const [finalAmount, roundOff] = calculateRoundOff(effective);

  // Split the round-off proportionally; GST takes the remainder so the parts
  // always sum back to roundOff exactly (no penny lost to double-rounding).
  const subtotalAdjustment =
    effective === 0 ? 0 : to2(roundOff * (subtotalRounded / effective));
  const gstAdjustment = to2(roundOff - subtotalAdjustment);
  const effectiveGST = to2(gstRounded + gstAdjustment);

  return {
    subtotalRaw: subtotal,
    subtotalRounded,
    subtotalAdjustment,

    gstRaw,
    gstRounded,
    gstAdjustment,

    effectiveGST,
    effectiveTotal: effective,

    roundOff,
    finalAmount,
  };
}

/** Convenience: build the invoice straight from billing lines. */
export function calculateInvoiceFromLines(lines: BillingLineInput[]): Invoice {
  return calculateInvoice(calculateSubtotal(lines));
}

/**
 * Build an invoice directly from the cart shape used across the booking flow:
 * an attraction (prices in paise) + a {categoryId: quantity} map. Complimentary
 * bookings have a zero invoice (payment waived). Centralising this means the
 * booking page, the summary band, and the payment step all show the SAME total.
 */
export function invoiceFromCart(
  attraction: { ticketProducts: { id: string; pricePaise: number }[] } | null,
  tickets: Record<string, number>,
  isComplimentary = false,
): Invoice {
  if (!attraction || isComplimentary) return calculateInvoice(0);
  const lines = attraction.ticketProducts
    .filter((p) => (tickets[p.id] ?? 0) > 0)
    .map((p) => ({ price: p.pricePaise / 100, quantity: tickets[p.id] ?? 0 }));
  return calculateInvoiceFromLines(lines);
}

/**
 * 2-decimal rounding via `Number(x.toFixed(2))` — matches the spec's reference
 * function exactly (including JS half-even float-representation behavior).
 */
function to2(value: number): number {
  return Number(value.toFixed(2));
}

/**
 * Format a rupee amount as Indian currency, e.g. 39 → "₹39.00".
 * Always two decimals for invoice values; the engine keeps precision, the UI
 * only ever shows toFixed(2).
 */
export function formatCurrency(rupees: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/** Sign-aware color class for an adjustment value (green +, red −, gray 0). */
export type AdjustmentTone = "positive" | "negative" | "neutral";
export function adjustmentTone(value: number): AdjustmentTone {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

/** Format an adjustment with an explicit sign, e.g. +0.47 / −0.26 / 0.00. */
export function formatAdjustment(value: number): string {
  const fixed = Math.abs(value).toFixed(2);
  if (value > 0) return `+₹${fixed}`;
  if (value < 0) return `−₹${fixed}`;
  return `₹${fixed}`;
}
