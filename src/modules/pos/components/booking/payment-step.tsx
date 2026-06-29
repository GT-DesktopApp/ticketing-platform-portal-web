"use client";

import { Banknote, CreditCard, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/lib/constants/routes";
import { useCreateBooking } from "@/modules/pos/hooks/use-pos";
import { useCartStore } from "@/modules/pos/store/cart-store";
import type { PaymentMethod } from "@/modules/pos/types";
import { formatCurrency, invoiceFromCart } from "@/modules/pos/utils/billing";

/**
 * Process Payment step (payment_page.png). Reads everything from the cart,
 * shows the amount due, captures cash received + change, and submits the
 * booking via the atomic /api/bookings endpoint. On success the cart clears and
 * we return to the booking screen.
 */
export function PaymentStep() {
  const router = useRouter();
  const attraction = useCartStore((s) => s.selectedAttraction);
  const tickets = useCartStore((s) => s.tickets);
  const customer = useCartStore((s) => s.customer);
  const seats = useCartStore((s) => s.seats);
  const isComplimentary = useCartStore((s) => s.isComplimentary);
  const passReference = useCartStore((s) => s.passReference);
  const clearCart = useCartStore((s) => s.clearCart);

  const createBooking = useCreateBooking();
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [received, setReceived] = useState("");

  useEffect(() => {
    if (!attraction) router.replace(ROUTES.POS);
  }, [attraction, router]);

  const invoice = useMemo(
    () => invoiceFromCart(attraction, tickets, isComplimentary),
    [attraction, tickets, isComplimentary],
  );

  // The payable amount is a whole rupee (the billing engine guarantees this).
  const dueRupees = invoice.finalAmount;
  const receivedRupees = parseFloat(received) || 0;
  const changeRupees = Math.max(0, receivedRupees - dueRupees);
  const receivedPaise = Math.round(receivedRupees * 100);

  async function confirm() {
    if (!attraction) return;

    const items = Object.entries(tickets).map(([ticketCategoryId, quantity]) => ({
      ticketCategoryId,
      quantity,
    }));
    const seatAssignments = Object.values(seats).map((s) => ({
      seatId: s.seatId,
      passengerRef: s.passengerRef,
    }));

    try {
      await createBooking.mutateAsync({
        attractionId: attraction.id,
        customerId: customer?.id ?? null,
        isComplimentary,
        passReference: isComplimentary ? passReference : undefined,
        items,
        seatAssignments,
        payment: isComplimentary
          ? undefined
          : { method, amountPaidPaise: receivedPaise },
      });
      toast.success("Booking confirmed.");
      clearCart();
      router.push(ROUTES.POS);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed.");
    }
  }

  // For non-complimentary cash payments, require enough money received.
  const canConfirm = isComplimentary
    ? true
    : method !== "CASH" || receivedRupees >= dueRupees;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--pos-navy)" }}>
          Process Payment
        </h1>
        <p className="text-sm text-muted-foreground">{attraction?.name}</p>
      </div>

      {/* Amount due band */}
      <div
        className="rounded-xl p-6 text-center text-white"
        style={{ background: "var(--pos-navy)" }}
      >
        <p className="text-sm font-semibold tracking-wide text-white/70 uppercase">
          {isComplimentary ? "Complimentary" : "Amount Due"}
        </p>
        <p className="mt-1 text-4xl font-bold">{formatCurrency(dueRupees)}</p>
      </div>

      {!isComplimentary && (
        <>
          {/* Payment method */}
          <div>
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Payment Method
            </p>
            <div className="grid grid-cols-3 gap-3">
              <MethodCard
                label="Cash"
                icon={<Banknote className="size-5" />}
                active={method === "CASH"}
                onClick={() => setMethod("CASH")}
              />
              <MethodCard
                label="Card"
                icon={<CreditCard className="size-5" />}
                active={method === "CARD"}
                onClick={() => setMethod("CARD")}
              />
              <MethodCard
                label="UPI"
                icon={<Smartphone className="size-5" />}
                active={method === "UPI"}
                onClick={() => setMethod("UPI")}
              />
            </div>
          </div>

          {method === "CASH" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Amount Received (₹)</Label>
                <Input
                  type="number"
                  value={received}
                  onChange={(e) => setReceived(e.target.value)}
                  placeholder={dueRupees.toFixed(2)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Change Return</Label>
                <Input value={formatCurrency(changeRupees)} readOnly className="bg-muted/40" />
              </div>
            </div>
          )}
        </>
      )}

      <Button
        className="pos-btn-amber h-12 text-base font-semibold"
        disabled={!canConfirm || createBooking.isPending}
        onClick={confirm}
      >
        {createBooking.isPending
          ? "Processing…"
          : isComplimentary
            ? "Confirm Complimentary Booking"
            : `Confirm Payment – ${formatCurrency(dueRupees)}`}
      </Button>
    </div>
  );
}

function MethodCard({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors ${
        active
          ? "border-[var(--pos-navy)] bg-[var(--pos-blue-soft)]"
          : "text-muted-foreground hover:bg-muted/50"
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
