"use client";

import { ArrowRight, Plus } from "lucide-react";
import { memo, useMemo } from "react";

import { type CartLine } from "@/modules/pos/components/booking/billing-table";
import { CartSection } from "@/modules/pos/components/booking/cart-section";
import { SelectedAttractionCard } from "@/modules/pos/components/booking/selected-attraction-card";
import { TicketCategoryList } from "@/modules/pos/components/booking/ticket-category-list";
import type { Attraction } from "@/modules/pos/types";
import { calculateInvoiceFromLines } from "@/modules/pos/utils/billing";

/**
 * The right-hand booking panel, shown ONLY when an attraction is selected.
 *
 * Both booking modes render the SAME vertical category list (name / price /
 * −qty+ / amount):
 *   • STANDARD → fixed visitor categories (Adult/Child/…)
 *   • CATEGORY → the attraction's ticket categories (Indian Adult (2-way)/…)
 * Only the data source (and the section heading) differs — no product cards.
 *
 * Clicking +/− updates the cart + billing instantly (no Add To Cart button).
 * "Process To Checkout" fills the whole action area, enabled when the cart has
 * items.
 */
export const BookingPanel = memo(function BookingPanel({
  attraction,
  cart,
  onIncrease,
  onDecrease,
  onRemoveFromCart,
  onClear,
  onChangeAttraction,
  onCheckout,
  onNewCategory,
}: {
  attraction: Attraction;
  /** Committed cart: categoryId -> quantity. */
  cart: Record<string, number>;
  onIncrease: (categoryId: string) => void;
  onDecrease: (categoryId: string) => void;
  onRemoveFromCart: (categoryId: string) => void;
  onClear: () => void;
  onChangeAttraction: () => void;
  onCheckout: () => void;
  onNewCategory: () => void;
}) {
  const isCategoryMode = attraction.bookingType === "CATEGORY";
  const sectionTitle = isCategoryMode
    ? "Ticket Categories"
    : "Visitor Categories & Quantity";

  // Cart lines = only categories with quantity > 0.
  const cartLines: CartLine[] = useMemo(
    () =>
      (attraction.ticketProducts ?? [])
        .filter((p) => (cart[p.id] ?? 0) > 0)
        .map((p) => ({
          categoryId: p.id,
          name: p.name,
          quantity: cart[p.id] ?? 0,
          priceRupees: p.pricePaise / 100,
        })),
    [attraction.ticketProducts, cart],
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
    <section className="flex flex-col gap-6 rounded-[14px] border border-[var(--login-border)] bg-white p-6 shadow-sm">
      <SelectedAttractionCard
        attraction={attraction}
        onChange={onChangeAttraction}
      />

      {/* Category rows (same layout for both modes; data differs by bookingType). */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-[var(--pos-navy)]">
            {sectionTitle}
          </h3>
          {isCategoryMode && (
            <button
              type="button"
              onClick={onNewCategory}
              className="flex items-center gap-1.5 rounded-md border border-[var(--pos-amber)] px-3 py-1.5 text-[13px] font-semibold text-[var(--pos-amber-600)] transition-all duration-150 hover:bg-[var(--pos-amber-soft)]"
            >
              <Plus className="size-4" /> New Category
            </button>
          )}
        </div>
        <TicketCategoryList
          categories={attraction.ticketProducts ?? []}
          quantities={cart}
          onIncrease={onIncrease}
          onDecrease={onDecrease}
        />
      </div>

      <CartSection
        lines={cartLines}
        invoice={invoice}
        onRemove={onRemoveFromCart}
        onClear={onClear}
      />

      {/* Full-width checkout (the Add To Cart button has been removed). */}
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
