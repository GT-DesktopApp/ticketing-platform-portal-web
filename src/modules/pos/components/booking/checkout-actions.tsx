"use client";

import { ShoppingCart } from "lucide-react";

/**
 * The two footer actions from the reference: a bordered "Add To Cart" and the
 * gold "Process To Checkout". Both are 48px tall with a 150ms transition.
 */
export function CheckoutActions({
  disabled,
  onAddToCart,
  onCheckout,
}: {
  disabled: boolean;
  onAddToCart: () => void;
  onCheckout: () => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        disabled={disabled}
        onClick={onAddToCart}
        className="flex h-12 items-center justify-center gap-2 rounded-[10px] border border-[var(--login-border)] text-[15px] font-semibold text-[var(--pos-navy)] transition-all duration-150 hover:bg-[var(--login-hover-bg)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ShoppingCart className="size-4" />
        Add To Cart
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={onCheckout}
        className="flex h-12 items-center justify-center gap-2 rounded-[10px] bg-[var(--pos-amber)] text-[15px] font-semibold text-[#1c1407] transition-all duration-150 hover:bg-[var(--pos-amber-600)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Process To Checkout
      </button>
    </div>
  );
}
