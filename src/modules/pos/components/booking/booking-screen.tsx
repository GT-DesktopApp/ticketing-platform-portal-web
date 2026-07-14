"use client";

import { Search, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { ROUTES } from "@/lib/constants/routes";
import { AttractionDetailPanel } from "@/modules/pos/components/booking/attraction-detail-panel";
import { AttractionListCard } from "@/modules/pos/components/booking/attraction-list-card";
import { useAttractions } from "@/modules/pos/hooks/use-pos";
import { useCartStore } from "@/modules/pos/store/cart-store";

/**
 * Ticket Booking (POS) screen — attraction-first flow (homepage2).
 *
 * Two columns: the ATTRACTIONS list on the left, and an inline DETAIL panel on
 * the right for the selected attraction. The detail panel lists the attraction's
 * visitor categories with −/qty/+ steppers (updating the cart live), the Cart &
 * Billing breakdown, and a single "Process To Checkout" action. Clicking a
 * different attraction swaps the panel.
 */
export function BookingScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { data: attractions = [], isLoading, error } = useAttractions();

  const tickets = useCartStore((s) => s.tickets);
  const syncCatalog = useCartStore((s) => s.syncCatalog);
  const updateTicketQuantity = useCartStore((s) => s.updateTicketQuantity);
  const setTicketQuantity = useCartStore((s) => s.setTicketQuantity);
  const clearCart = useCartStore((s) => s.clearCart);

  // Client-side name filter — keeps the list responsive without refetching.
  const visibleAttractions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return attractions;
    return attractions.filter((a) => a.name.toLowerCase().includes(q));
  }, [attractions, search]);

  // The attraction the operator explicitly clicked. `null` means "not chosen
  // yet" — the list then shows full-width, unless an in-progress cart pins a
  // selection (see below). `""` is the sentinel for an explicit close.
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // The attraction whose tickets are already in the cart, if any. Returning to
  // /pos mid-checkout (e.g. via the breadcrumb) should re-open that booking
  // instead of the collapsed list, so we fall back to it when nothing is
  // explicitly selected.
  const cartOwner = useMemo(() => {
    const cartIds = Object.keys(tickets);
    if (cartIds.length === 0) return null;
    return (
      attractions.find((a) =>
        a.ticketProducts.some((p) => cartIds.includes(p.id)),
      ) ?? null
    );
  }, [attractions, tickets]);

  const selectedAttraction = useMemo(() => {
    if (selectedId === "") return null; // explicitly closed
    if (selectedId) return attractions.find((a) => a.id === selectedId) ?? null;
    return cartOwner; // no explicit choice → follow the in-progress cart
  }, [attractions, selectedId, cartOwner]);

  // Keep selectedAttraction + prices synced for the downstream customer/payment
  // steps; syncCatalog preserves the in-progress cart for the same attraction.
  useEffect(() => {
    if (selectedAttraction) syncCatalog(selectedAttraction);
  }, [selectedAttraction, syncCatalog]);

  const handleIncrease = useCallback(
    (categoryId: string) => updateTicketQuantity(categoryId, 1),
    [updateTicketQuantity],
  );
  const handleDecrease = useCallback(
    (categoryId: string) => updateTicketQuantity(categoryId, -1),
    [updateTicketQuantity],
  );
  const handleRemoveFromCart = useCallback(
    (categoryId: string) => setTicketQuantity(categoryId, 0),
    [setTicketQuantity],
  );
  const handleCheckout = useCallback(
    () => router.push(`${ROUTES.POS}/customer`),
    [router],
  );

  // How many tickets from a given attraction are in the cart (card badge).
  const cartCountFor = useCallback(
    (a: (typeof attractions)[number]) =>
      a.ticketProducts.reduce((sum, p) => sum + (tickets[p.id] ?? 0), 0),
    [tickets],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex items-center gap-2.5">
        <Ticket className="size-6 text-[var(--pos-navy)]" />
        <h1 className="text-[20px] font-bold text-[var(--pos-navy)]">
          Ticket Booking
        </h1>
      </header>

      <div
        className={`grid grid-cols-1 gap-6 transition-all duration-300 ${
          selectedAttraction
            ? "lg:grid-cols-[minmax(320px,420px)_1fr]"
            : "lg:grid-cols-1"
        }`}
      >
        {/* Attractions list (left) */}
        <section className="rounded-[14px] border border-[var(--login-border)] bg-white p-4 shadow-sm lg:self-start">
          <div className="mb-3">
            <h2 className="text-[16px] font-bold text-[var(--pos-navy)]">
              Attractions
            </h2>
          </div>

          <div className="relative mb-3">
            <Search className="absolute top-2.5 left-3 size-4 text-[var(--login-text-muted)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Attraction…"
              className="h-10 pl-9"
            />
          </div>

          <div className="space-y-2.5">
            {isLoading && (
              <p className="py-8 text-center text-sm text-[var(--login-text-muted)]">
                Loading attractions…
              </p>
            )}
            {!isLoading && error && (
              <div className="rounded-lg border border-[#DC2626]/30 bg-[#DC2626]/5 px-3 py-4 text-center text-sm text-[#DC2626]">
                Couldn’t load attractions.
                <span className="mt-1 block text-xs opacity-80">
                  {error.message}
                </span>
              </div>
            )}
            {!isLoading && !error && visibleAttractions.length === 0 && (
              <p className="py-8 text-center text-sm text-[var(--login-text-muted)]">
                No attractions found.
              </p>
            )}
            {!isLoading &&
              !error &&
              visibleAttractions.map((a) => (
                <AttractionListCard
                  key={a.id}
                  attraction={a}
                  count={cartCountFor(a)}
                  selected={a.id === selectedAttraction?.id}
                  onSelect={() => setSelectedId(a.id)}
                />
              ))}
          </div>
        </section>

        {/* Detail panel (right) — appears only after an attraction is clicked. */}
        {selectedAttraction && (
          <div className="booking-panel-enter min-w-0">
            <AttractionDetailPanel
              attraction={selectedAttraction}
              quantities={tickets}
              onClose={() => setSelectedId("")}
              onIncrease={handleIncrease}
              onDecrease={handleDecrease}
              onRemoveFromCart={handleRemoveFromCart}
              onClear={clearCart}
              onCheckout={handleCheckout}
            />
          </div>
        )}
      </div>
    </div>
  );
}
