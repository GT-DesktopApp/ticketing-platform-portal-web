"use client";

import { ImageIcon, Minus, Plus } from "lucide-react";
import { memo } from "react";

import type { TicketProduct } from "@/modules/pos/types";
import { formatPriceTag } from "@/modules/pos/utils/billing";

/**
 * A product card in the flat booking grid (matches the `image.png` reference):
 * full-bleed image with a dark gradient, the price near the top and the category
 * name at the bottom. When no image is set it falls back to a neutral tile with a
 * placeholder icon (the gray cards in the reference).
 *
 * Interaction:
 *   • Not in the cart → the whole card is a button; clicking it adds qty 1.
 *   • In the cart → a −/+ stepper overlay (top-right) lets the user increase or
 *     decrease the quantity. Decreasing to 0 removes it from the cart. The
 *     stepper stops click propagation so tapping it never re-triggers the card's
 *     add handler.
 */
export const ProductCard = memo(function ProductCard({
  product,
  quantity,
  onIncrease,
  onDecrease,
}: {
  product: TicketProduct;
  /** Current quantity of this product in the cart (0 if not added). */
  quantity: number;
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
}) {
  const inCart = quantity > 0;
  const priceTag = formatPriceTag(product.pricePaise / 100);

  return (
    <div
      // When not yet in the cart the whole tile adds it; once in the cart the
      // stepper takes over (so a stray card click can't keep incrementing).
      role={inCart ? undefined : "button"}
      tabIndex={inCart ? undefined : 0}
      onClick={inCart ? undefined : () => onIncrease(product.id)}
      onKeyDown={
        inCart
          ? undefined
          : (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onIncrease(product.id);
              }
            }
      }
      aria-label={
        inCart ? undefined : `Add ${product.name} (${priceTag}) to cart`
      }
      className={`group relative aspect-[4/3] w-full overflow-hidden rounded-[12px] text-left shadow-sm transition-all duration-150 outline-none focus-visible:ring-4 focus-visible:ring-[rgba(251,191,36,0.45)] ${
        inCart
          ? "ring-2 ring-[var(--pos-amber)]"
          : "cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
      }`}
    >
      {/* Image (or placeholder tile). */}
      {product.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- user-uploaded/runtime URLs, not build-time assets
        <img
          src={product.image}
          alt={product.name}
          className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--pos-blue-soft)]">
          <ImageIcon
            className="size-10 text-[var(--login-text-muted)]"
            aria-hidden
          />
        </div>
      )}

      {/* Bottom-up dark gradient so white text stays legible over any image. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

      {/* Quantity stepper (only once in the cart). */}
      {inCart && (
        <div
          className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/35 p-0.5 backdrop-blur-sm"
          // Don't let stepper clicks bubble to the card.
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label={`Decrease ${product.name} quantity`}
            onClick={() => onDecrease(product.id)}
            className="flex size-7 items-center justify-center rounded-full bg-white text-[var(--pos-navy)] shadow transition-colors hover:bg-[var(--login-hover-bg)] focus-visible:ring-2 focus-visible:ring-[var(--pos-amber)] focus-visible:outline-none"
          >
            <Minus className="size-4" />
          </button>
          <span className="min-w-6 text-center text-[14px] font-bold text-white tabular-nums">
            {quantity}
          </span>
          <button
            type="button"
            aria-label={`Increase ${product.name} quantity`}
            onClick={() => onIncrease(product.id)}
            className="flex size-7 items-center justify-center rounded-full bg-[var(--pos-amber)] text-[#1c1407] shadow transition-colors hover:bg-[var(--pos-amber-600)] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <Plus className="size-4" />
          </button>
        </div>
      )}

      {/* Price + name overlay. */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-3">
        <span className="text-[17px] font-bold text-white drop-shadow">
          {priceTag}
        </span>
        <span className="truncate text-[14px] font-medium text-white/90 drop-shadow">
          {product.name}
        </span>
      </div>
    </div>
  );
});
