"use client";

import { ArrowRight, Minus, Plus, X } from "lucide-react";
import { memo, useMemo } from "react";

import { type CartLine } from "@/modules/pos/components/booking/billing-table";
import { CartSection } from "@/modules/pos/components/booking/cart-section";
import type { Attraction } from "@/modules/pos/types";
import {
  calculateInvoiceFromLines,
  formatCurrency,
} from "@/modules/pos/utils/billing";

/**
 * The inline detail panel for the selected attraction (homepage2 layout). It
 * sits beside the attraction list — NOT a slide-over — and contains:
 *   • a header (name, type, base rate, seats/trip, duration, trips today),
 *   • "Visitor Categories & Quantity" with a −/qty/+ stepper per category that
 *     updates the cart live,
 *   • the "Cart & Billing" section (line items + Subtotal / GST / Round-Off /
 *     Total — the existing billing engine, unchanged),
 *   • a single "Process To Checkout" button (no separate Add To Cart).
 */
export const AttractionDetailPanel = memo(function AttractionDetailPanel({
  attraction,
  quantities,
  onClose,
  onIncrease,
  onDecrease,
  onRemoveFromCart,
  onClear,
  onCheckout,
}: {
  attraction: Attraction;
  /** categoryId -> quantity in cart */
  quantities: Record<string, number>;
  /** Dismiss the panel and return to the full-width attraction list. */
  onClose: () => void;
  onIncrease: (categoryId: string) => void;
  onDecrease: (categoryId: string) => void;
  onRemoveFromCart: (categoryId: string) => void;
  onClear: () => void;
  onCheckout: () => void;
}) {
  const categories = attraction.ticketProducts;

  // Cart lines = only this attraction's categories with quantity > 0.
  const cartLines: CartLine[] = useMemo(
    () =>
      categories
        .filter((c) => (quantities[c.id] ?? 0) > 0)
        .map((c) => ({
          categoryId: c.id,
          name: c.name,
          quantity: quantities[c.id] ?? 0,
          priceRupees: c.pricePaise / 100,
        })),
    [categories, quantities],
  );

  const invoice = useMemo(
    () =>
      calculateInvoiceFromLines(
        cartLines.map((l) => ({ price: l.priceRupees, quantity: l.quantity })),
      ),
    [cartLines],
  );

  const hasItems = cartLines.length > 0;

  return (
    <section className="flex flex-col gap-5 rounded-[14px] border border-[var(--login-border)] bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="rounded-[12px] bg-[var(--pos-blue-soft)]/60 p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[18px] font-bold text-[var(--pos-navy)]">
            {attraction.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--login-text-muted)] transition-colors hover:bg-white hover:text-[var(--pos-navy)]"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-[var(--login-text-muted)]">
          <span className="rounded-full bg-white px-2 py-0.5 font-medium text-[var(--pos-navy)]">
            {attraction.type}
          </span>
          <span>
            Base Rate:{" "}
            <strong className="text-[var(--pos-navy)]">
              {formatCurrency(attraction.baseRatePaise / 100)}
            </strong>{" "}
            / person
          </span>
          {attraction.seatsPerTrip != null && (
            <span>
              Seats per trip:{" "}
              <strong className="text-[var(--pos-navy)]">
                {attraction.seatsPerTrip}
              </strong>
            </span>
          )}
          {attraction.durationMin != null && (
            <span>
              Duration:{" "}
              <strong className="text-[var(--pos-navy)]">
                {attraction.durationMin} min
              </strong>{" "}
              / trip
            </span>
          )}
          {(attraction.openTime || attraction.closeTime) && (
            <span>
              Open:{" "}
              <strong className="text-[var(--pos-navy)]">
                {attraction.openTime} – {attraction.closeTime}
              </strong>
            </span>
          )}
        </div>
      </div>

      {/* Visitor Categories & Quantity */}
      <div>
        <h3 className="mb-2 text-[16px] font-bold text-[var(--pos-navy)]">
          Visitor Categories &amp; Quantity
        </h3>
        {categories.length === 0 ? (
          <p className="rounded-[10px] border border-dashed border-[var(--login-border)] px-4 py-6 text-center text-[13px] text-[var(--login-text-muted)]">
            No ticket categories configured for this attraction.
          </p>
        ) : (
          <div className="divide-y divide-[var(--login-border)]">
            {categories.map((c) => {
              const qty = quantities[c.id] ?? 0;
              const price = c.pricePaise / 100;
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-[var(--pos-navy)]">
                      {c.name}
                    </p>
                    <p className="text-[12px] text-[var(--login-text-muted)]">
                      {formatCurrency(price)} / person
                      {c.note ? ` · ${c.note}` : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Decrease ${c.name}`}
                        disabled={qty === 0}
                        onClick={() => onDecrease(c.id)}
                        className="flex size-8 items-center justify-center rounded-md border border-[var(--login-border)] text-[var(--pos-navy)] transition-colors hover:bg-[var(--login-hover-bg)] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="w-6 text-center text-[15px] font-bold tabular-nums text-[var(--pos-navy)]">
                        {qty}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase ${c.name}`}
                        onClick={() => onIncrease(c.id)}
                        className="flex size-8 items-center justify-center rounded-md bg-[var(--pos-amber)] text-[#1c1407] transition-colors hover:bg-[var(--pos-amber-600)]"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                    <span className="w-20 text-right text-[14px] font-bold tabular-nums text-[var(--pos-navy)]">
                      {formatCurrency(price * qty)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart & Billing (existing engine: Subtotal / GST / Round-Off / Total) */}
      <CartSection
        lines={cartLines}
        invoice={invoice}
        onRemove={onRemoveFromCart}
        onClear={onClear}
      />

      {/* Single action — Process To Checkout (no Add To Cart). */}
      <button
        type="button"
        onClick={onCheckout}
        disabled={!hasItems}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[var(--pos-amber)] text-[15px] font-semibold text-[#1c1407] transition-all duration-150 hover:bg-[var(--pos-amber-600)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Process To Checkout <ArrowRight className="size-4" />
      </button>
    </section>
  );
});
