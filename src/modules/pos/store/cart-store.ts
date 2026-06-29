import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Attraction, Customer, SeatSelection } from "@/modules/pos/types";

/**
 * Global booking cart — the cross-step source of truth for one in-progress sale.
 *
 * Server data (the attraction list, seat matrix) is fetched with TanStack Query;
 * this store holds only the user's *choices* as they move through the wizard
 * (attraction → categories/qty → customer → seats → payment). It's persisted to
 * sessionStorage so a refresh mid-booking doesn't lose the cart, but it clears
 * when the sale completes.
 */
export interface CartState {
  selectedAttraction: Attraction | null;
  /** category id -> quantity */
  tickets: Record<string, number>;
  customer: Customer | null;
  isComplimentary: boolean;
  passReference: string;
  /** seat selections keyed by passengerRef ("Adult 1" -> selection) */
  seats: Record<string, SeatSelection>;

  setAttraction: (attraction: Attraction | null) => void;
  updateTicketQuantity: (categoryId: string, amount: number) => void;
  setTicketQuantity: (categoryId: string, quantity: number) => void;
  setCustomer: (customer: Customer | null) => void;
  setComplimentary: (value: boolean) => void;
  setPassReference: (ref: string) => void;
  assignSeat: (passengerRef: string, selection: SeatSelection | null) => void;
  clearSeats: () => void;
  clearCart: () => void;

  // Derived helpers (selectors) live outside; these are small conveniences.
  totalTickets: () => number;
}

/** SSR fallback so persist() has a Storage-shaped object on the server. */
const noopStorage: Storage = {
  length: 0,
  clear: () => {},
  getItem: () => null,
  key: () => null,
  removeItem: () => {},
  setItem: () => {},
};

const initialState = {
  selectedAttraction: null as Attraction | null,
  tickets: {} as Record<string, number>,
  customer: null as Customer | null,
  isComplimentary: false,
  passReference: "",
  seats: {} as Record<string, SeatSelection>,
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setAttraction: (attraction) =>
        // Switching attraction invalidates ticket/seat choices.
        set({
          selectedAttraction: attraction,
          tickets: {},
          seats: {},
        }),

      updateTicketQuantity: (categoryId, amount) =>
        set((state) => {
          const next = Math.max(0, (state.tickets[categoryId] ?? 0) + amount);
          const tickets = { ...state.tickets };
          if (next === 0) {
            delete tickets[categoryId];
          } else {
            tickets[categoryId] = next;
          }
          // Changing quantities invalidates any seat allocation.
          return { tickets, seats: {} };
        }),

      setTicketQuantity: (categoryId, quantity) =>
        set((state) => {
          const tickets = { ...state.tickets };
          if (quantity <= 0) {
            delete tickets[categoryId];
          } else {
            tickets[categoryId] = quantity;
          }
          return { tickets, seats: {} };
        }),

      setCustomer: (customer) => set({ customer }),
      setComplimentary: (value) => set({ isComplimentary: value }),
      setPassReference: (passReference) => set({ passReference }),

      assignSeat: (passengerRef, selection) =>
        set((state) => {
          const seats = { ...state.seats };
          if (selection === null) {
            delete seats[passengerRef];
          } else {
            seats[passengerRef] = selection;
          }
          return { seats };
        }),

      clearSeats: () => set({ seats: {} }),
      clearCart: () => set({ ...initialState }),

      totalTickets: () =>
        Object.values(get().tickets).reduce((sum, n) => sum + n, 0),
    }),
    {
      name: "pos-cart",
      // Bump when the persisted shape changes. v2: attraction.categories was
      // renamed to attraction.ticketProducts — any older cached cart is dropped
      // on load so we never read an attraction with an undefined products array.
      version: 2,
      migrate: () => ({}) as Partial<CartState>,
      // sessionStorage: survives refresh, gone when the tab closes. SSR-safe —
      // createJSONStorage lazily reads sessionStorage only in the browser.
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : noopStorage,
      ),
      // Persist only the data members, not the action functions. Drop any
      // persisted selectedAttraction missing the new `ticketProducts` field.
      partialize: (state) =>
        ({
          selectedAttraction:
            state.selectedAttraction &&
            Array.isArray(state.selectedAttraction.ticketProducts)
              ? state.selectedAttraction
              : null,
          tickets: state.tickets,
          customer: state.customer,
          isComplimentary: state.isComplimentary,
          passReference: state.passReference,
          seats: state.seats,
        }) as CartState,
    },
  ),
);
