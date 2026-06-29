"use client";

import { Info } from "lucide-react";
import { useMemo } from "react";

import { useCartStore } from "@/modules/pos/store/cart-store";
import { formatCurrency, invoiceFromCart } from "@/modules/pos/utils/billing";

/**
 * The blue "Booking Summary" band shown atop the Customer and Seat steps:
 * attraction, passenger breakdown, and total — all read from the cart.
 */
export function BookingSummary({ showIcon = false }: { showIcon?: boolean }) {
  const attraction = useCartStore((s) => s.selectedAttraction);
  const tickets = useCartStore((s) => s.tickets);
  const isComplimentary = useCartStore((s) => s.isComplimentary);

  const passengers = useMemo(() => {
    if (!attraction) return "";
    return (attraction.ticketProducts ?? [])
      .filter((p) => (tickets[p.id] ?? 0) > 0)
      .map((p) => `${shortLabel(p.name)} × ${tickets[p.id]}`)
      .join(", ");
  }, [attraction, tickets]);

  const invoice = useMemo(
    () => invoiceFromCart(attraction, tickets, isComplimentary),
    [attraction, tickets, isComplimentary],
  );

  if (!attraction) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl bg-[var(--pos-blue-soft)] p-4">
      {showIcon && (
        <Info className="mt-0.5 size-5 shrink-0" style={{ color: "var(--pos-navy)" }} />
      )}
      <div className="flex-1">
        <p className="mb-2 font-semibold" style={{ color: "var(--pos-navy)" }}>
          Booking Summary
        </p>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <Cell label="Attraction" value={attraction.name} />
          <Cell label="Passengers" value={passengers || "—"} />
          <Cell label="Total Amount" value={formatCurrency(invoice.finalAmount)} />
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium" style={{ color: "var(--pos-navy)" }}>
        {value}
      </p>
    </div>
  );
}

/** "Child (5–12 yrs)" -> "Child", "Senior Citizen (60+ yrs)" -> "Senior". */
function shortLabel(name: string): string {
  return name.split("(")[0].trim().split(" ")[0];
}
