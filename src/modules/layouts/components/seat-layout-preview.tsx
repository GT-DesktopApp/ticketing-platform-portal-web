"use client";

import { memo } from "react";

import {
  AISLE_PX,
  buildGeometry,
  type Cell,
  type LayoutConfig,
  padSeat,
} from "@/modules/layouts/geometry";

/**
 * A live seat-grid preview built from a layout config (the "Seat Layout
 * Preview" panel). Renders numbered seats in left/right blocks around an AISLE
 * spacer; VIP rows are highlighted amber. Purely presentational — pass the same
 * config used by the form and it stays in sync.
 */
export const SeatLayoutPreview = memo(function SeatLayoutPreview({
  config,
}: {
  config: LayoutConfig;
}) {
  const geo = buildGeometry(config);
  const aisleW = AISLE_PX[config.aisleWidth];

  if (geo.totalSeats === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[var(--login-border)] px-4 py-10 text-center text-sm text-[var(--login-text-muted)]">
        Add rows and columns to preview the seat layout.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 overflow-x-auto">
      {geo.rows.map((row, i) => (
        <div key={i} className="flex items-stretch gap-2">
          {/* Left block */}
          <div className="flex gap-2">
            {row.left.map((cell) => (
              <SeatBox key={cellKey(cell)} cell={cell} />
            ))}
          </div>

          {/* Aisle spacer (spans the whole column of rows visually) */}
          {geo.hasAisle && (
            <div
              className="flex items-center justify-center rounded bg-[var(--login-hover-bg)] text-[10px] font-medium tracking-wide text-[var(--login-text-muted)]"
              style={{ width: aisleW, minWidth: aisleW }}
            >
              {i === Math.floor(geo.rows.length / 2) ? "AISLE" : ""}
            </div>
          )}

          {/* Right block */}
          <div className="flex gap-2">
            {row.right.map((cell) => (
              <SeatBox key={cellKey(cell)} cell={cell} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

function cellKey(cell: Cell): string {
  return cell.kind === "seat" ? `s${cell.number}` : "aisle";
}

function SeatBox({ cell }: { cell: Cell }) {
  if (cell.kind !== "seat") return null;
  return (
    <div
      className={`flex h-9 w-12 items-center justify-center rounded border text-[12px] font-medium tabular-nums ${
        cell.vip
          ? "border-[var(--pos-amber)] bg-[var(--pos-amber)] text-[#1c1407]"
          : "border-[var(--login-border)] bg-white text-[var(--pos-navy)]"
      }`}
    >
      {padSeat(cell.number)}
    </div>
  );
}
