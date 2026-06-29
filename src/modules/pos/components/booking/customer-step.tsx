"use client";

import { ArrowLeft, ArrowRight, Plus, Search, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useDebounce } from "@/hooks/use-debounce";
import { ROUTES } from "@/lib/constants/routes";
import { BookingSummary } from "@/modules/pos/components/booking/booking-summary";
import {
  useCreateCustomer,
  useCustomerSearch,
} from "@/modules/pos/hooks/use-pos";
import { useCartStore } from "@/modules/pos/store/cart-store";

/**
 * Customer Information step (CUSTOMER_DEFAULT.png): debounced existing-customer
 * lookup, an inline "Add New Customer" form, and a conditional Complimentary
 * pass section that reveals Pass Details only when toggled on.
 */
export function CustomerStep() {
  const router = useRouter();
  const attraction = useCartStore((s) => s.selectedAttraction);
  const customer = useCartStore((s) => s.customer);
  const setCustomer = useCartStore((s) => s.setCustomer);
  const isComplimentary = useCartStore((s) => s.isComplimentary);
  const setComplimentary = useCartStore((s) => s.setComplimentary);
  const passReference = useCartStore((s) => s.passReference);
  const setPassReference = useCartStore((s) => s.setPassReference);

  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 350);
  const { data: results = [], isFetching } = useCustomerSearch(debounced);
  const [showAdd, setShowAdd] = useState(false);

  // Guard: if there's no attraction/tickets in the cart, send back to booking.
  useEffect(() => {
    if (!attraction) router.replace(ROUTES.POS);
  }, [attraction, router]);

  function handleContinue() {
    if (!customer && !isComplimentary) return;
    // If the attraction needs seats, go to seat allocation; else straight to pay.
    const next = attraction?.requiresSeats
      ? `${ROUTES.POS}/seats`
      : `${ROUTES.POS}/payment`;
    router.push(next);
  }

  const canContinue = isComplimentary
    ? passReference.trim().length > 0
    : customer !== null;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--pos-navy)" }}>
        Customer Information
      </h1>

      <BookingSummary />

      <section className="rounded-xl border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <UserRound className="size-5" style={{ color: "var(--pos-navy)" }} />
          <h2 className="text-lg font-semibold">Select Existing Customer</h2>
        </div>

        <Label className="mb-1.5 block">
          Customer<span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or mobile number"
              className="pl-8"
            />
            {debounced && (results.length > 0 || isFetching) && (
              <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
                {isFetching && (
                  <p className="px-3 py-2 text-sm text-muted-foreground">
                    Searching…
                  </p>
                )}
                {results.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setCustomer(c);
                      setSearch(c.name);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span>{c.name}</span>
                    <span className="text-muted-foreground">{c.mobile}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="outline"
            className="border-[var(--pos-navy)] text-[var(--pos-navy)]"
            onClick={() => setShowAdd((v) => !v)}
          >
            <Plus className="size-4" /> Add New Customer
          </Button>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Select a registered customer from the list.
        </p>

        {showAdd && <AddCustomerInline onCreated={(c) => {
          setCustomer(c);
          setSearch(c.name);
          setShowAdd(false);
        }} />}

        {/* Selected / empty state */}
        <div className="mt-4 flex items-center gap-3 rounded-lg bg-muted/40 p-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <UserRound className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium" style={{ color: "var(--pos-navy)" }}>
              {customer ? customer.name : "No customer selected"}
            </p>
            <p className="text-sm text-muted-foreground">
              {customer
                ? customer.mobile
                : "Please select a customer from the list or add a new customer."}
            </p>
          </div>
        </div>

        {/* Complimentary toggle + conditional pass details */}
        <div className="mt-6 flex items-center gap-3 border-t pt-4">
          <Switch
            checked={isComplimentary}
            onCheckedChange={setComplimentary}
            id="complimentary"
          />
          <Label htmlFor="complimentary">Complimentary Pass</Label>
        </div>
        {isComplimentary && (
          <div className="mt-3 space-y-1.5">
            <Label htmlFor="pass-ref">Pass Reference *</Label>
            <Input
              id="pass-ref"
              value={passReference}
              onChange={(e) => setPassReference(e.target.value)}
              placeholder="Pass / authorization reference"
            />
            <p className="text-xs text-muted-foreground">
              Payment is waived for complimentary passes; a reference is required.
            </p>
          </div>
        )}
      </section>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push(ROUTES.POS)}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        <Button
          className="pos-btn-amber font-semibold"
          disabled={!canContinue}
          onClick={handleContinue}
        >
          Continue <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function AddCustomerInline({
  onCreated,
}: {
  onCreated: (c: { id: string; name: string; mobile: string; email: string | null; notes: string | null }) => void;
}) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createCustomer = useCreateCustomer();

  async function submit() {
    setError(null);
    try {
      const c = await createCustomer.mutateAsync({ name, mobile, email: "", notes: "" });
      onCreated(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create customer.");
    }
  }

  return (
    <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>Name *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" />
      </div>
      <div className="space-y-1.5">
        <Label>Mobile *</Label>
        <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Mobile number" />
      </div>
      {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <Button
          className="pos-btn-navy"
          onClick={submit}
          disabled={createCustomer.isPending || !name.trim() || !mobile.trim()}
        >
          {createCustomer.isPending ? "Saving…" : "Save Customer"}
        </Button>
      </div>
    </div>
  );
}
