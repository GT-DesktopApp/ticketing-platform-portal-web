"use client";

import { Plus, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { ROUTES } from "@/lib/constants/routes";
import { AddItemModal } from "@/modules/pos/components/booking/add-item-modal";
import { AttractionPanel } from "@/modules/pos/components/booking/attraction-panel";
import { BookingPanel } from "@/modules/pos/components/booking/booking-panel";
import { useAttractions } from "@/modules/pos/hooks/use-pos";
import { useCartStore } from "@/modules/pos/store/cart-store";
import type { Attraction } from "@/modules/pos/types";

/**
 * Ticket Booking (POS) page — state-driven progressive disclosure.
 *
 * Workflow:
 *   • No attraction selected → render ONLY the AttractionPanel, full width.
 *   • An attraction selected → reveal the two-column layout (attractions list +
 *     BookingPanel) with a smooth 250ms transition.
 *   • Removing the selection ("Change Attraction") resets the booking state and
 *     expands the list back to full width — no stale booking data remains.
 *
 * Centralised state lives in the Zustand cart store (selectedAttraction +
 * per-category quantities), shared with the later wizard steps. Business logic
 * (billing) lives in utils/billing — this component only orchestrates layout.
 */
export function BookingScreen() {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const { data: attractions = [], isLoading, error } = useAttractions();

  const selected = useCartStore((s) => s.selectedAttraction);
  const tickets = useCartStore((s) => s.tickets);
  const setAttraction = useCartStore((s) => s.setAttraction);
  const updateTicketQuantity = useCartStore((s) => s.updateTicketQuantity);
  const setTicketQuantity = useCartStore((s) => s.setTicketQuantity);
  const clearCart = useCartStore((s) => s.clearCart);

  const hasSelection = selected !== null;

  // Stable callbacks so memoized children don't re-render on every parent tick.
  const handleSelect = useCallback(
    (attraction: Attraction) => setAttraction(attraction),
    [setAttraction],
  );
  const handleChangeAttraction = useCallback(
    () => setAttraction(null), // store resets tickets + seats on deselect
    [setAttraction],
  );
  // +/− on a category row → update the cart instantly (no Add button).
  const handleIncrease = useCallback(
    (categoryId: string) => updateTicketQuantity(categoryId, 1),
    [updateTicketQuantity],
  );
  const handleDecrease = useCallback(
    (categoryId: string) => updateTicketQuantity(categoryId, -1),
    [updateTicketQuantity],
  );
  // Remove a category from the cart entirely (cart delete).
  const handleRemoveFromCart = useCallback(
    (categoryId: string) => setTicketQuantity(categoryId, 0),
    [setTicketQuantity],
  );
  const handleCheckout = useCallback(
    () => router.push(`${ROUTES.POS}/customer`),
    [router],
  );
  const handleNewCategory = useCallback(() => setAddOpen(true), []);

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
          disabled={!hasSelection}
          className="flex h-12 items-center gap-2 rounded-[10px] bg-[var(--pos-amber)] px-5 text-[15px] font-semibold text-[#1c1407] transition-all duration-150 hover:bg-[var(--pos-amber-600)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="size-4" /> New Booking
        </button>
      </header>

      {/* Layout: single column (no selection) → two columns (selection). */}
      <div
        className={`grid gap-6 transition-all duration-[250ms] ${
          hasSelection ? "grid-cols-1 xl:grid-cols-[35%_65%]" : "grid-cols-1"
        }`}
      >
        <AttractionPanel
          attractions={attractions}
          isLoading={isLoading}
          error={error}
          selectedId={selected?.id ?? null}
          onSelect={handleSelect}
          onAddItem={() => setAddOpen(true)}
          fullWidth={!hasSelection}
        />

        {/* Booking panel mounts ONLY when an attraction is selected. */}
        {hasSelection && selected && (
          <div className="booking-panel-enter">
            <BookingPanel
              attraction={selected}
              cart={tickets}
              onIncrease={handleIncrease}
              onDecrease={handleDecrease}
              onRemoveFromCart={handleRemoveFromCart}
              onClear={clearCart}
              onChangeAttraction={handleChangeAttraction}
              onCheckout={handleCheckout}
              onNewCategory={handleNewCategory}
            />
          </div>
        )}
      </div>

      <AddItemModal open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
