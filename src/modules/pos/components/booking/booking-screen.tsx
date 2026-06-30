"use client";

import { Plus, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ROUTES } from "@/lib/constants/routes";
import { AddItemModal } from "@/modules/pos/components/booking/add-item-modal";
import { AttractionPanel } from "@/modules/pos/components/booking/attraction-panel";
import { CartPanel } from "@/modules/pos/components/booking/cart-panel";
import { useAttractions } from "@/modules/pos/hooks/use-pos";
import { useCartStore } from "@/modules/pos/store/cart-store";

/**
 * Ticket Booking (POS) screen — a flat product catalog.
 *
 * The grid shows every catalog product (name / category type / sales price /
 * barcode / image). Clicking a card adds it to the cart; once in the cart a −/+
 * stepper on the card adjusts the quantity. There is no "Visitor Categories &
 * Quantity" step and no per-attraction selection.
 *
 * The Cart & Billing panel is revealed only when the cart has at least one item:
 * while empty, the product grid fills the full width; adding the first item
 * smoothly splits the layout, and emptying the cart collapses it back.
 *
 * The single "Catalog" attraction (the API returns it as the only attractions
 * entry) is synced into the cart store so the downstream customer/payment steps
 * still have `selectedAttraction` + `tickets` to price the sale.
 */
export function BookingScreen() {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const { data: attractions = [], isLoading, error } = useAttractions();

  const catalog = attractions[0] ?? null;
  const products = useMemo(() => catalog?.ticketProducts ?? [], [catalog]);

  const tickets = useCartStore((s) => s.tickets);
  const syncCatalog = useCartStore((s) => s.syncCatalog);
  const updateTicketQuantity = useCartStore((s) => s.updateTicketQuantity);
  const setTicketQuantity = useCartStore((s) => s.setTicketQuantity);
  const clearCart = useCartStore((s) => s.clearCart);

  // Auto-select the catalog whenever it (re)loads. syncCatalog preserves the
  // cart when it's the same catalog, so refetches don't wipe in-progress items.
  useEffect(() => {
    if (catalog) syncCatalog(catalog);
  }, [catalog, syncCatalog]);

  // +1 / −1 on a card's stepper (−1 to 0 removes it from the cart).
  const handleIncrease = useCallback(
    (productId: string) => updateTicketQuantity(productId, 1),
    [updateTicketQuantity],
  );
  const handleDecrease = useCallback(
    (productId: string) => updateTicketQuantity(productId, -1),
    [updateTicketQuantity],
  );
  // Remove a product from the cart entirely (cart delete button).
  const handleRemoveFromCart = useCallback(
    (productId: string) => setTicketQuantity(productId, 0),
    [setTicketQuantity],
  );
  const handleCheckout = useCallback(
    () => router.push(`${ROUTES.POS}/customer`),
    [router],
  );

  const hasItems = Object.keys(tickets).length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Ticket className="size-6 text-[var(--pos-navy)]" />
          <h1 className="text-[20px] font-bold text-[var(--pos-navy)]">
            Ticket Booking
          </h1>
        </div>
        <button
          type="button"
          onClick={handleCheckout}
          disabled={!hasItems}
          className="flex h-12 items-center gap-2 rounded-[10px] bg-[var(--pos-amber)] px-5 text-[15px] font-semibold text-[#1c1407] transition-all duration-150 hover:bg-[var(--pos-amber-600)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="size-4" /> New Booking
        </button>
      </header>

      {/*
        Flat catalog grid (left). The Cart & Billing panel (right) appears only
        once the cart has items: the grid is full-width while empty and smoothly
        splits to 65/35 when the first item is added.
      */}
      <div
        className={`grid grid-cols-1 gap-6 transition-all duration-300 ${
          hasItems ? "xl:grid-cols-[65%_35%]" : "xl:grid-cols-1"
        }`}
      >
        <AttractionPanel
          products={products}
          quantities={tickets}
          isLoading={isLoading}
          error={error}
          onIncrease={handleIncrease}
          onDecrease={handleDecrease}
          onAddItem={() => setAddOpen(true)}
          fullWidth={!hasItems}
        />

        {hasItems && (
          <div className="booking-panel-enter">
            <CartPanel
              products={products}
              cart={tickets}
              onRemoveFromCart={handleRemoveFromCart}
              onClear={clearCart}
              onCheckout={handleCheckout}
            />
          </div>
        )}
      </div>

      <AddItemModal open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
