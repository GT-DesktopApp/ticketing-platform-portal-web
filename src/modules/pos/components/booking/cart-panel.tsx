"use client";

import { ArrowRight } from "lucide-react";
import { memo, useMemo } from "react";

import { type CartLine } from "@/modules/pos/components/booking/billing-table";
import { CartSection } from "@/modules/pos/components/booking/cart-section";
import type { TicketProduct } from "@/modules/pos/types";
import { calculateInvoiceFromLines } from "@/modules/pos/utils/billing";

/**
 * The right-hand Cart & Billing panel for the flat booking screen.
 *
 * Always visible (there is no "select an attraction" step). It derives the cart
 * lines + invoice from the catalog products and the cart quantity map, renders
 * the Cart & Billing section, and the full-width "Process To Checkout" action
 * (enabled only when the cart has items). Items are added by clicking product
 * cards in the grid — this panel only shows/edits what's already in the cart.
 */
export const CartPanel = memo(function CartPanel({
  products,
  cart,
  onRemoveFromCart,
  onClear,
  onCheckout,
}: {
  products: TicketProduct[];
  /** Cart quantities: productId -> quantity. */
  cart: Record<string, number>;
  onRemoveFromCart: (productId: string) => void;
  onClear: () => void;
  onCheckout: () => void;
}) {
  // Cart lines = only products with quantity > 0.
  const cartLines: CartLine[] = useMemo(
    () =>
      products
        .filter((p) => (cart[p.id] ?? 0) > 0)
        .map((p) => ({
          categoryId: p.id,
          name: p.name,
          quantity: cart[p.id] ?? 0,
          priceRupees: p.pricePaise / 100,
        })),
    [products, cart],
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
      <CartSection
        lines={cartLines}
        invoice={invoice}
        onRemove={onRemoveFromCart}
        onClear={onClear}
      />

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
