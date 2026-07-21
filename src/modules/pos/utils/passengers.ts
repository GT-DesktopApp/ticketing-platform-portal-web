import type { Attraction } from "@/modules/pos/types";

/**
 * Ordered passenger labels for a booking — one entry per ticket in the cart.
 *
 * Derived from the cart's ticket quantities: each ticket product contributes
 * `qty` passengers, labelled "<short name> <n>" (e.g. "Indian Adult 1",
 * "Paddle Boat 2 1"). The count is the total number of tickets, which is also
 * the number of seats to allocate for seated attractions.
 *
 * Single source of truth so the seat allocator, booking summary, and any other
 * consumer agree on the passenger list and its order.
 */
export function passengerLabels(
  attraction: Attraction | null,
  tickets: Record<string, number>,
): string[] {
  if (!attraction) return [];
  const list: string[] = [];
  for (const p of attraction.ticketProducts ?? []) {
    const qty = tickets[p.id] ?? 0;
    // Drop any "(2-way)"-style suffix for a compact passenger label.
    const label = p.name.split("(")[0].trim();
    for (let i = 1; i <= qty; i++) list.push(`${label} ${i}`);
  }
  return list;
}

/** Total number of passengers (= tickets) in the cart. */
export function passengerCount(tickets: Record<string, number>): number {
  return Object.values(tickets).reduce((sum, n) => sum + n, 0);
}
