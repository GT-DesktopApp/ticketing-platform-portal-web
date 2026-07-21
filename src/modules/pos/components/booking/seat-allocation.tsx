"use client";

import { ChevronUp, Info, Plus, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildGeometry, type Cell, padSeat } from "@/modules/layouts/geometry";
import { useAttractionSeats } from "@/modules/pos/hooks/use-pos";
import { useCartStore } from "@/modules/pos/store/cart-store";
import type { Attraction } from "@/modules/pos/types";
import { passengerLabels } from "@/modules/pos/utils/passengers";

/** Single coach prefix used in seat labels (the design shows "A-05"). */
const COACH = "A";
const seatLabel = (n: number) => `${COACH}-${padSeat(n)}`;

/**
 * Inline Seat Allocation (CUSTOMER INFO DEFAULT.png) — rendered on the Customer
 * Information page for seated attractions.
 *
 * Seats are derived from the attraction's `SeatLayout` geometry (no per-seat
 * rows); a seat is "occupied" when its number is already booked for this
 * attraction (server-computed). Behaviour:
 *   • Auto-selects the first N available seats for the N passengers on load and
 *     whenever the passenger count / occupancy changes (never overwriting a
 *     manual pick, never picking an occupied seat).
 *   • Click a free seat → assign it to the next unseated passenger; click a
 *     selected seat → free it; occupied seats are disabled.
 *   • The right column mirrors the reference: a per-passenger Selected Seats
 *     list and an allocation summary.
 *
 * The parent gates "Continue" on `seatsAssigned === passengers.length`.
 */
export function SeatAllocation({ attraction }: { attraction: Attraction }) {
  const tickets = useCartStore((s) => s.tickets);
  const seats = useCartStore((s) => s.seats);
  const assignSeat = useCartStore((s) => s.assignSeat);

  // Expanded by default so seats are visible without an extra click.
  const [open, setOpen] = useState(true);

  const { data, isLoading, refetch, isFetching } = useAttractionSeats(
    attraction.id,
  );

  const layout = data?.layout ?? null;
  const occupied = useMemo(
    () => new Set(data?.occupied ?? []),
    [data?.occupied],
  );

  const passengers = useMemo(
    () => passengerLabels(attraction, tickets),
    [attraction, tickets],
  );

  // Seat numbers currently picked (from the store), and the reverse map.
  const selectedByNumber = useMemo(() => {
    const m = new Map<number, string>(); // seatNumber -> passengerRef
    for (const [ref, sel] of Object.entries(seats)) m.set(sel.seatNumber, ref);
    return m;
  }, [seats]);

  // Total seats the layout offers, and how many are free (not occupied).
  const totalSeats = layout?.totalSeats ?? 0;
  const freeCount = Math.max(0, totalSeats - occupied.size);

  // Stable primitive keys for the auto-allocation effect's dependency array
  // (depending on the array/set identities would re-run every render).
  const passengersKey = passengers.join("|");
  const occupiedKey = Array.from(occupied).join(",");

  /**
   * Auto-allocation + reconciliation. Runs whenever passengers, occupancy, or
   * the current selection changes:
   *   • drops any assignment whose passenger no longer exists (count shrank) or
   *     whose seat became occupied (someone else booked it), and
   *   • fills unseated passengers with the lowest-numbered free seats.
   * Manual picks are preserved (we only add/remove to keep it valid + full).
   */
  useEffect(() => {
    if (!layout) return;

    const passengerSet = new Set(passengers);
    const usedNumbers = new Set<number>();

    // 1) Prune invalid assignments (stale passenger or now-occupied seat).
    for (const [ref, sel] of Object.entries(seats)) {
      if (!passengerSet.has(ref) || occupied.has(sel.seatNumber)) {
        assignSeat(ref, null);
      } else {
        usedNumbers.add(sel.seatNumber);
      }
    }

    // 2) Fill unseated passengers with the lowest free seats.
    let next = 1;
    for (const ref of passengers) {
      if (seats[ref] && !occupied.has(seats[ref].seatNumber)) continue; // already seated
      // Find the next available seat number.
      while (
        next <= totalSeats &&
        (occupied.has(next) || usedNumbers.has(next))
      ) {
        next += 1;
      }
      if (next > totalSeats) break; // ran out of free seats
      usedNumbers.add(next);
      assignSeat(ref, {
        seatNumber: next,
        seatLabel: seatLabel(next),
        passengerRef: ref,
      });
    }
    // We intentionally depend on the derived primitives, not `seats` identity,
    // to avoid a self-triggering loop; assignSeat updates are idempotent here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, passengersKey, occupiedKey, totalSeats]);

  function onSeatClick(number: number) {
    if (occupied.has(number)) return; // can't touch a booked seat

    const owner = selectedByNumber.get(number);
    if (owner) {
      // Already selected → free it.
      assignSeat(owner, null);
      return;
    }

    // Prefer the first passenger who still needs a seat…
    const unseated = passengers.find(
      (p) => !seats[p] || occupied.has(seats[p].seatNumber),
    );
    // …otherwise everyone is seated, so MOVE a passenger to the clicked seat
    // (reassign the last passenger — the natural "change my seat" action). This
    // is what lets you pick seat 14 when a seat was already auto-assigned.
    const target = unseated ?? passengers[passengers.length - 1];
    if (!target) return; // no passengers at all

    assignSeat(target, {
      seatNumber: number,
      seatLabel: seatLabel(number),
      passengerRef: target,
    });
  }

  const assignedCount = passengers.filter(
    (p) => seats[p] && !occupied.has(seats[p].seatNumber),
  ).length;

  const seatNumbers =
    passengers
      .map((p) => seats[p]?.seatLabel)
      .filter(Boolean)
      .join(", ") || "—";

  // ---- Render (matches CUSTOMER INFO DEFAULT.png) ----
  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div>
          <p className="font-semibold" style={{ color: "var(--pos-navy)" }}>
            Seat Allocation
          </p>
          <p className="text-sm text-muted-foreground">
            Choose seats for this booking
          </p>
        </div>
        <ChevronUp
          className={`size-5 text-muted-foreground transition-transform ${open ? "" : "rotate-180"}`}
        />
      </button>

      {open && (
        <div className="border-t p-4">
          {/* No layout configured → can't allocate. */}
          {!isLoading && !layout && (
            <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
              No seat layout is configured for this attraction. Assign a layout
              in Attraction Management to enable seat allocation.
            </div>
          )}

          {isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading seats…
            </p>
          )}

          {layout && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[190px_1fr]">
              {/* Bogie Progress rail (the flat layout is presented as a single
                  active coach "A"; B/C shown locked to match the design). */}
              <BogieProgress totalSeats={totalSeats} available={freeCount} />

              {/* Seat panel */}
              <div className="rounded-xl border p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3
                    className="font-semibold"
                    style={{ color: "var(--pos-navy)" }}
                  >
                    Select Seats – Bogie {COACH}
                  </h3>
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
                  <div className="mb-4 flex items-start gap-2 rounded-md bg-[var(--pos-blue-soft)] px-3 py-2 text-xs text-muted-foreground">
                    <Info className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                      {freeCount < passengers.length
                        ? `Only ${freeCount} seat(s) available — not enough for ${passengers.length} passengers.`
                        : `Please select ${passengers.length} seat(s). You can only select seats from the active bogie.`}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_240px]">
                  <div>
                    <SeatGrid
                      layout={layout}
                      occupied={occupied}
                      selectedByNumber={selectedByNumber}
                      onSeatClick={onSeatClick}
                    />
                    <Legend />
                  </div>

                  {/* Selected Seats + summary (right column) */}
                  <div className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="font-medium">Selected Seats</span>
                        <span
                          className="text-xs"
                          style={{ color: "var(--pos-amber-600)" }}
                        >
                          {assignedCount}/{passengers.length} Selected
                        </span>
                      </div>
                      <div className="space-y-2">
                        {passengers.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            Add passengers on the booking screen first.
                          </p>
                        )}
                        {passengers.map((p) => {
                          const sel = seats[p];
                          const valid = sel && !occupied.has(sel.seatNumber);
                          return (
                            <div
                              key={p}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="truncate pr-2">{p}</span>
                              {valid ? (
                                <span className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="border-[var(--pos-amber)] bg-[var(--pos-amber-soft)] text-[var(--pos-amber-600)]"
                                  >
                                    {sel.seatLabel}
                                  </Badge>
                                  <button
                                    type="button"
                                    className="text-muted-foreground hover:text-destructive"
                                    onClick={() => assignSeat(p, null)}
                                    aria-label={`Unassign ${p}`}
                                  >
                                    ×
                                  </button>
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  —
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dark allocation summary (matches the reference). */}
                    <dl
                      className="space-y-2 rounded-lg p-4 text-sm text-white"
                      style={{ background: "var(--pos-navy)" }}
                    >
                      <SummaryRow
                        label="Passengers to Assign"
                        value={String(passengers.length)}
                      />
                      <SummaryRow
                        label="Seats Assigned"
                        value={`${assignedCount}/${passengers.length}`}
                        amber
                      />
                      <SummaryRow label="Current Bogie" value={COACH} />
                      <SummaryRow label="Seat Numbers" value={seatNumbers} />
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * Bogie Progress rail. The layout is a single flat grid, so we present it as the
 * active coach "A" (the design's sequential-bogie visual) with two locked
 * placeholder coaches, matching CUSTOMER INFO DEFAULT.png.
 */
function BogieProgress({
  totalSeats,
  available,
}: {
  totalSeats: number;
  available: number;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border p-3">
        <h3
          className="mb-3 text-sm font-semibold"
          style={{ color: "var(--pos-navy)" }}
        >
          Bogie Progress
        </h3>
        <div className="space-y-2">
          {/* Active coach A */}
          <div className="rounded-lg border-2 border-[var(--pos-navy)] p-3">
            <div className="flex items-center justify-between">
              <span
                className="font-semibold"
                style={{ color: "var(--pos-navy)" }}
              >
                Bogie {COACH}
              </span>
              <Badge className="bg-[var(--pos-amber)] text-[#1c1407] hover:bg-[var(--pos-amber)]">
                Active
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Seats: {totalSeats} · Available: {available}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Currently allocating seats
            </p>
          </div>

          {/* Locked placeholder coaches B & C */}
          {["B", "C"].map((label) => (
            <div key={label} className="rounded-lg border p-3 opacity-70">
              <div className="flex items-center justify-between">
                <span className="font-medium">Bogie {label}</span>
                <Badge variant="secondary">Locked</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Seats: {totalSeats}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Opens after Bogie {COACH} is full
              </p>
            </div>
          ))}
        </div>
      </div>
      <p className="rounded-lg bg-[var(--pos-amber-soft)] p-3 text-xs text-muted-foreground">
        Seats are allocated sequentially by bogie. A new bogie opens only after
        the current bogie is full.
      </p>
    </div>
  );
}

/** A row in the dark allocation-summary box (white label, white/amber value). */
function SummaryRow({
  label,
  value,
  amber,
}: {
  label: string;
  value: string;
  amber?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-white/60">{label}</dt>
      <dd
        className="text-right font-medium break-all"
        style={{ color: amber ? "var(--pos-amber)" : "#fff" }}
      >
        {value}
      </dd>
    </div>
  );
}

function SeatGrid({
  layout,
  occupied,
  selectedByNumber,
  onSeatClick,
}: {
  layout: NonNullable<ReturnType<typeof useAttractionSeats>["data"]>["layout"];
  occupied: Set<number>;
  selectedByNumber: Map<number, string>;
  onSeatClick: (n: number) => void;
}) {
  const geo = useMemo(() => (layout ? buildGeometry(layout) : null), [layout]);
  if (!geo) return null;

  function SeatCell({ cell }: { cell: Cell }) {
    if (cell.kind !== "seat") return <div className="h-9 w-12" />;
    const n = cell.number;
    const isOccupied = occupied.has(n);
    const isSelected = selectedByNumber.has(n);
    const base =
      "flex h-9 w-12 items-center justify-center rounded border text-[12px] font-medium tabular-nums transition-colors";
    const cls = isOccupied
      ? "cursor-not-allowed border-transparent bg-muted text-muted-foreground"
      : isSelected
        ? "cursor-pointer border-[var(--pos-amber)] bg-[var(--pos-amber)] text-[#1c1407]"
        : cell.vip
          ? "cursor-pointer border-[var(--pos-amber)]/60 bg-[var(--pos-amber-soft)] text-[var(--pos-navy)] hover:border-[var(--pos-amber)]"
          : "cursor-pointer border-[var(--login-border)] bg-white text-[var(--pos-navy)] hover:border-[var(--pos-amber)]";
    return (
      <button
        type="button"
        className={`${base} ${cls}`}
        disabled={isOccupied}
        aria-pressed={isSelected}
        aria-label={`Seat ${seatLabel(n)}${isOccupied ? " (occupied)" : ""}`}
        onClick={() => onSeatClick(n)}
      >
        {padSeat(n)}
      </button>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="mb-2 flex justify-between text-xs text-muted-foreground">
        <span>Left Side</span>
        <span>Right Side</span>
      </div>
      <div className="flex flex-col gap-2">
        {geo.rows.map((row, i) => (
          <div key={i} className="flex items-stretch gap-2">
            <div className="flex gap-2">
              {row.left.map((cell) => (
                <SeatCell key={cellKey(cell)} cell={cell} />
              ))}
            </div>
            {geo.hasAisle && (
              <div className="flex w-10 items-center justify-center rounded bg-[var(--login-hover-bg)] text-[10px] font-medium tracking-wide text-muted-foreground">
                {i === Math.floor(geo.rows.length / 2) ? "AISLE" : ""}
              </div>
            )}
            <div className="flex gap-2">
              {row.right.map((cell) => (
                <SeatCell key={cellKey(cell)} cell={cell} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function cellKey(cell: Cell): string {
  return cell.kind === "seat" ? `s${cell.number}` : "aisle";
}

function Legend() {
  return (
    <div className="mt-4 flex flex-wrap gap-5 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-3 rounded-sm border bg-white" />{" "}
        Available
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
