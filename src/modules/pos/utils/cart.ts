/**
 * Pure cart operations for the click-to-add POS flow.
 *
 * The cart is a list of CartItem rows (never duplicated per product). Every
 * helper is pure — it returns a NEW array, never mutates — so React state
 * updates stay predictable and components can stay memoized. No calculations
 * live here; billing math is in utils/billing.
 */

import type { TicketProduct } from "@/modules/pos/types";

/** One selected product line in the cart. */
export interface CartItem {
  productId: string;
  name: string;
  /** Unit price in PAISE (kept integer; converted to rupees only for billing). */
  pricePaise: number;
  quantity: number;
}

/**
 * Add a product to the cart. If it already exists, increment its quantity;
 * otherwise append a new row with quantity 1. Never creates duplicate rows.
 */
export function addProduct(cart: CartItem[], product: TicketProduct): CartItem[] {
  const existing = cart.find((i) => i.productId === product.id);
  if (existing) {
    return cart.map((i) =>
      i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
    );
  }
  return [
    ...cart,
    {
      productId: product.id,
      name: product.name,
      pricePaise: product.pricePaise,
      quantity: 1,
    },
  ];
}

/** Increase a product's quantity by one. */
export function increaseQuantity(cart: CartItem[], productId: string): CartItem[] {
  return cart.map((i) =>
    i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i,
  );
}

/**
 * Decrease a product's quantity by one. When it reaches zero the row is removed
 * automatically (no empty rows ever remain).
 */
export function decreaseQuantity(cart: CartItem[], productId: string): CartItem[] {
  return cart
    .map((i) =>
      i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i,
    )
    .filter((i) => i.quantity > 0);
}

/** Remove a product from the cart entirely. */
export function deleteProduct(cart: CartItem[], productId: string): CartItem[] {
  return cart.filter((i) => i.productId !== productId);
}

/** Total number of tickets across the cart. */
export function totalQuantity(cart: CartItem[]): number {
  return cart.reduce((sum, i) => sum + i.quantity, 0);
}
