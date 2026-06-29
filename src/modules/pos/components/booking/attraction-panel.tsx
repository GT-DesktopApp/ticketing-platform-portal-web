"use client";

import { Plus, Search } from "lucide-react";
import { memo, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { AttractionCard } from "@/modules/pos/components/booking/attraction-card";
import type { Attraction } from "@/modules/pos/types";

/**
 * The Attractions list panel: a search box + a scrollable list of attraction
 * cards. It is layout-agnostic — the parent decides whether it sits full-width
 * (no selection) or as the left column (selection active). Memoized so quantity
 * changes in the booking panel don't re-render the whole list.
 */
export const AttractionPanel = memo(function AttractionPanel({
  attractions,
  isLoading,
  error,
  selectedId,
  onSelect,
  onAddItem,
  fullWidth,
}: {
  attractions: Attraction[];
  isLoading: boolean;
  /** A fetch error, if the attractions request failed. */
  error?: Error | null;
  selectedId: string | null;
  onSelect: (attraction: Attraction) => void;
  onAddItem: () => void;
  /** When true the card grid uses multiple columns (full-width, no selection). */
  fullWidth: boolean;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? attractions.filter((a) => a.name.toLowerCase().includes(q))
      : attractions;
  }, [attractions, search]);

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

      <div
        className={
          fullWidth
            ? "grid grid-cols-1 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3"
            : "flex max-h-[calc(100vh-260px)] flex-col gap-2.5 overflow-y-auto pr-1"
        }
      >
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
        {!isLoading && !error && filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-[var(--login-text-muted)]">
            No attractions found.
          </p>
        )}
        {filtered.map((a) => (
          <AttractionCard
            key={a.id}
            attraction={a}
            active={selectedId === a.id}
            onSelect={() => onSelect(a)}
          />
        ))}
      </div>
    </section>
  );
});
