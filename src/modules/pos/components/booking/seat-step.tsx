"use client";

import { ArrowLeft, ArrowRight, Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import { BookingSummary } from "@/modules/pos/components/booking/booking-summary";
import { useAttractionSeats } from "@/modules/pos/hooks/use-pos";
import { useCartStore } from "@/modules/pos/store/cart-store";
import type { BogieView, Seat } from "@/modules/pos/types";

/**
 * Seat Allocation step (Boogie.png).
 *
 * Sequential locking: the server marks exactly one bogie ACTIVE; only its
 * AVAILABLE seats are clickable. LOCKED/FULL bogies are visibly disabled. Each
 * tapped seat is assigned to the next unseated passenger (Adult 1, Adult 2,
 * Child 1, …) derived from the cart's ticket quantities.
 */
export function SeatStep() {
  const router = useRouter();
  const attraction = useCartStore((s) => s.selectedAttraction);
  const tickets = useCartStore((s) => s.tickets);
  const seats = useCartStore((s) => s.seats);
  const assignSeat = useCartStore((s) => s.assignSeat);

  const { data: bogies = [], isLoading, refetch, isFetching } =
    useAttractionSeats(attraction?.id ?? null);

  useEffect(() => {
    if (!attraction) router.replace(ROUTES.POS);
  }, [attraction, router]);

  // Ordered passenger labels from the cart, one per ticket (e.g.
  // ["Indian Adult 1", "Indian Adult 2", "Paddle Boat 2 1"]).
  const passengers = useMemo(() => {
    if (!attraction) return [];
    const list: string[] = [];
    for (const p of attraction.ticketProducts ?? []) {
      const qty = tickets[p.id] ?? 0;
      const label = p.name.split("(")[0].trim();
      for (let i = 1; i <= qty; i++) list.push(`${label} ${i}`);
    }
    return list;
  }, [attraction, tickets]);

  const activeBogie = bogies.find((b) => b.status === "ACTIVE");
  const selectedSeatIds = new Set(Object.values(seats).map((s) => s.seatId));
  const assignedCount = Object.keys(seats).length;
  const allAssigned = assignedCount >= passengers.length && passengers.length > 0;

  function nextUnseatedPassenger(): string | null {
    return passengers.find((p) => !seats[p]) ?? null;
  }

  function toggleSeat(bogie: BogieView, seat: Seat) {
    if (bogie.status !== "ACTIVE" || seat.status === "OCCUPIED") return;

    // If this seat is already chosen, unassign its passenger.
    const existing = Object.entries(seats).find(([, s]) => s.seatId === seat.id);
    if (existing) {
      assignSeat(existing[0], null);
      return;
    }
    if (assignedCount >= passengers.length) return; // all passengers seated

    const passenger = nextUnseatedPassenger();
    if (!passenger) return;
    assignSeat(passenger, {
      seatId: seat.id,
      seatLabel: `${bogie.label}-${String(seat.number).padStart(2, "0")}`,
      passengerRef: passenger,
    });
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--pos-navy)" }}>
        Seat Allocation
      </h1>
      <BookingSummary showIcon />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
        {/* Bogie progress */}
        <aside className="space-y-3">
          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 font-semibold">Bogie Progress</h2>
            <div className="space-y-2">
              {bogies.map((b) => (
                <BogieCard key={b.id} bogie={b} />
              ))}
            </div>
          </div>
          <p className="rounded-lg bg-[var(--pos-amber-soft)] p-3 text-xs text-muted-foreground">
            Seats are allocated sequentially by bogie. A new bogie opens only
            after the current bogie is full.
          </p>
        </aside>

        {/* Seat grid */}
        <section className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">
              Select Seats {activeBogie ? `– Bogie ${activeBogie.label}` : ""}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                <Plus className="size-4" /> Make New Trip
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw className="size-4" /> Refresh Seats
              </Button>
            </div>
          </div>

          {passengers.length > 0 && (
            <div className="mb-3 rounded-md bg-[var(--pos-blue-soft)] px-3 py-2 text-xs text-muted-foreground">
              Please select {passengers.length} seats. You can only select seats
              from the active bogie.
            </div>
          )}

          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Loading seats…
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_240px]">
              {activeBogie ? (
                <SeatGrid
                  bogie={activeBogie}
                  selectedSeatIds={selectedSeatIds}
                  onToggle={(seat) => toggleSeat(activeBogie, seat)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No active bogie available.
                </p>
              )}

              {/* Selected seats panel */}
              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-medium">Selected Seats</span>
                  <span className="text-xs" style={{ color: "var(--pos-amber-600)" }}>
                    {assignedCount}/{passengers.length} Selected
                  </span>
                </div>
                <div className="space-y-2">
                  {passengers.map((p) => (
                    <div key={p} className="flex items-center justify-between text-sm">
                      <span>{p}</span>
                      {seats[p] ? (
                        <span className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-[var(--pos-amber)] text-[var(--pos-amber-600)]"
                          >
                            {seats[p].seatLabel}
                          </Badge>
                          <button
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => assignSeat(p, null)}
                            aria-label={`Unassign ${p}`}
                          >
                            ×
                          </button>
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <Legend />
        </section>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        <Button
          className="pos-btn-amber font-semibold"
          disabled={!allAssigned}
          onClick={() => router.push(`${ROUTES.POS}/payment`)}
        >
          Continue <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function BogieCard({ bogie }: { bogie: BogieView }) {
  const tone =
    bogie.status === "ACTIVE"
      ? "border-[var(--pos-navy)]"
      : "opacity-70";
  return (
    <div className={`rounded-lg border p-3 ${tone}`}>
      <div className="flex items-center justify-between">
        <span className="font-medium">Bogie {bogie.label}</span>
        <Badge
          variant={bogie.status === "ACTIVE" ? "default" : "secondary"}
          className={
            bogie.status === "ACTIVE"
              ? "bg-[var(--pos-amber)] text-[#1c1407]"
              : ""
          }
        >
          {bogie.status === "ACTIVE"
            ? "Active"
            : bogie.status === "FULL"
              ? "Full"
              : "Locked"}
        </Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Seats: {bogie.capacity}
        {bogie.status === "ACTIVE" && ` · Available: ${bogie.available}`}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {bogie.status === "ACTIVE"
          ? "Currently allocating seats"
          : bogie.status === "FULL"
            ? "Full"
            : "Opens after the active bogie is full"}
      </p>
    </div>
  );
}

function SeatGrid({
  bogie,
  selectedSeatIds,
  onToggle,
}: {
  bogie: BogieView;
  selectedSeatIds: Set<string>;
  onToggle: (seat: Seat) => void;
}) {
  const left = bogie.seats.filter((s) => s.side === "left");
  const right = bogie.seats.filter((s) => s.side === "right");
  const rows = Math.max(left.length, right.length);

  function cell(seat: Seat | undefined) {
    if (!seat) return <div />;
    const isSelected = selectedSeatIds.has(seat.id);
    const isOccupied = seat.status === "OCCUPIED";
    const base =
      "flex h-9 items-center justify-center rounded-md border text-sm tabular-nums transition-colors";
    const cls = isOccupied
      ? "cursor-not-allowed bg-muted text-muted-foreground"
      : isSelected
        ? "cursor-pointer border-[var(--pos-amber)] bg-[var(--pos-amber)] text-[#1c1407]"
        : "cursor-pointer hover:border-[var(--pos-amber)]";
    return (
      <button
        type="button"
        className={`${base} ${cls}`}
        disabled={isOccupied}
        onClick={() => onToggle(seat)}
      >
        {String(seat.number).padStart(2, "0")}
      </button>
    );
  }

  return (
    <div>
      <div className="mb-2 flex justify-between text-xs text-muted-foreground">
        <span>Left Side</span>
        <span>Right Side</span>
      </div>
      <div className="grid grid-cols-[1fr_1fr_24px_1fr_1fr] gap-2">
        {Array.from({ length: rows }).map((_, r) => (
          <SeatRow key={r} left={left} right={right} index={r} cell={cell} />
        ))}
      </div>
    </div>
  );
}

function SeatRow({
  left,
  right,
  index,
  cell,
}: {
  left: Seat[];
  right: Seat[];
  index: number;
  cell: (seat: Seat | undefined) => React.ReactNode;
}) {
  // Two seats per side per row.
  const l1 = left[index * 2];
  const l2 = left[index * 2 + 1];
  const r1 = right[index * 2];
  const r2 = right[index * 2 + 1];
  if (!l1 && !l2 && !r1 && !r2) return null;
  return (
    <>
      {cell(l1)}
      {cell(l2)}
      <div /> {/* aisle */}
      {cell(r1)}
      {cell(r2)}
    </>
  );
}

function Legend() {
  return (
    <div className="mt-4 flex gap-5 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-3 rounded-sm border" /> Available
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-3 rounded-sm bg-[var(--pos-amber)]" />{" "}
        Selected
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-3 rounded-sm bg-muted" /> Occupied
      </span>
    </div>
  );
}
