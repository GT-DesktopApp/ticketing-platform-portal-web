"use client";

import { Plus, Search } from "lucide-react";
import { memo, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { ProductCard } from "@/modules/pos/components/booking/product-card";
import type { TicketProduct } from "@/modules/pos/types";

/**
 * The product grid panel: a search box + the "+" (New Category) button + a
 * responsive grid of product cards (the flat booking catalog). Clicking a card
 * adds it to the cart; search filters by product name. Memoized so cart quantity
 * changes elsewhere don't needlessly re-render the whole grid.
 */
export const AttractionPanel = memo(function AttractionPanel({
  products,
  quantities,
  isLoading,
  error,
  onIncrease,
  onDecrease,
  onAddItem,
  fullWidth = false,
}: {
  products: TicketProduct[];
  /** Cart quantities: productId -> quantity. */
  quantities: Record<string, number>;
  isLoading: boolean;
  /** A fetch error, if the request failed. */
  error?: Error | null;
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
  onAddItem: () => void;
  /** Cart hidden → grid fills the screen, so pack in more columns. */
  fullWidth?: boolean;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? products.filter((p) => p.name.toLowerCase().includes(q))
      : products;
  }, [products, search]);

  return (
    <section className="flex flex-col rounded-[14px] border border-[var(--login-border)] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[16px] font-bold text-[var(--pos-navy)]">
          Attractions
        </h2>
        <button
          type="button"
          onClick={onAddItem}
          aria-label="Add item"
          className="flex size-8 items-center justify-center rounded-md bg-[var(--pos-amber)] text-white transition-all duration-150 hover:bg-[var(--pos-amber-600)]"
        >
          <Plus className="size-4" />
        </button>
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

      {isLoading && (
        <p className="py-8 text-center text-sm text-[var(--login-text-muted)]">
          Loading attractions…
        </p>
      )}
      {!isLoading && error && (
        <div className="rounded-lg border border-[#DC2626]/30 bg-[#DC2626]/5 px-3 py-4 text-center text-sm text-[#DC2626]">
          Couldn’t load attractions.
          <span className="mt-1 block text-xs opacity-80">{error.message}</span>
        </div>
      )}
      {!isLoading && !error && filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-[var(--login-text-muted)]">
          No attractions found.
        </p>
      )}

      {filtered.length > 0 && (
        <div
          className={`grid gap-3 overflow-y-auto pr-1 ${
            fullWidth
              ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
              : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
          }`}
        >
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              quantity={quantities[p.id] ?? 0}
              onIncrease={onIncrease}
              onDecrease={onDecrease}
            />
          ))}
        </div>
      )}
    </section>
  );
});
