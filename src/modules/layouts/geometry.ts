/**
 * Seat-layout geometry — the shared source of truth for turning a layout's
 * config (rows, left/right columns, aisle) into the numbered grid the previews
 * render. Used by the Custom Layout modal, the inline Seat Allocation step, and
 * the Layout Management editor so every preview matches exactly.
 */

export type AislePosition = "LEFT" | "CENTRE" | "RIGHT" | "DUAL" | "NONE";
export type AisleWidth = "NARROW" | "MEDIUM" | "WIDE";

/** The raw geometry inputs a layout is built from. */
export interface LayoutConfig {
  rows: number;
  columnsLeft: number;
  columnsRight: number;
  aislePosition: AislePosition;
  aisleWidth: AisleWidth;
  /** 1-indexed VIP row numbers. */
  vipRows?: number[];
}

/** One cell in the rendered grid: a numbered seat or the aisle spacer. */
export type Cell =
  | { kind: "seat"; number: number; row: number; col: number; vip: boolean }
  | { kind: "aisle" };

/** A rendered row = a left block, the aisle, and a right block. */
export interface GridRow {
  left: Cell[];
  right: Cell[];
  /** Whether this row is entirely VIP. */
  vip: boolean;
}

export interface LayoutGeometry {
  rows: GridRow[];
  totalSeats: number;
  hasAisle: boolean;
}

/** Aisle pixel width for the preview, by setting. */
export const AISLE_PX: Record<AisleWidth, number> = {
  NARROW: 24,
  MEDIUM: 40,
  WIDE: 64,
};

/**
 * Total seats a config produces = rows × (left + right) columns. (The aisle is
 * a visual gap, not a seat.) This is the authoritative seat count for a layout.
 */
export function seatsForConfig(config: LayoutConfig): number {
  return config.rows * (config.columnsLeft + config.columnsRight);
}

/**
 * Build the numbered grid. Seats number left→right, top→bottom (matching the
 * design's "01, 02 | 03" ordering across the aisle). `NONE` collapses the aisle
 * and merges both column blocks; `LEFT`/`RIGHT` push all columns to one side.
 */
export function buildGeometry(config: LayoutConfig): LayoutGeometry {
  const vip = new Set(config.vipRows ?? []);
  const hasAisle = config.aislePosition !== "NONE";

  // Effective per-side column counts after honoring the aisle position.
  let leftCols = config.columnsLeft;
  let rightCols = config.columnsRight;
  if (config.aislePosition === "NONE") {
    leftCols = config.columnsLeft + config.columnsRight;
    rightCols = 0;
  } else if (config.aislePosition === "LEFT") {
    // Aisle on the far left → all seats sit to the right of it.
    leftCols = 0;
    rightCols = config.columnsLeft + config.columnsRight;
  } else if (config.aislePosition === "RIGHT") {
    // Aisle on the far right → all seats to the left of it.
    leftCols = config.columnsLeft + config.columnsRight;
    rightCols = 0;
  }
  // CENTRE and DUAL keep the left/right split as configured.

  const perRow = leftCols + rightCols;
  const rows: GridRow[] = [];
  let n = 0;

  for (let r = 1; r <= config.rows; r++) {
    const rowVip = vip.has(r);
    const left: Cell[] = [];
    const right: Cell[] = [];
    for (let c = 1; c <= perRow; c++) {
      n += 1;
      const cell: Cell = {
        kind: "seat",
        number: n,
        row: r,
        col: c,
        vip: rowVip,
      };
      if (c <= leftCols) left.push(cell);
      else right.push(cell);
    }
    rows.push({ left, right, vip: rowVip });
  }

  return { rows, totalSeats: config.rows * perRow, hasAisle };
}

/** Zero-pad a seat number to 2 digits for the preview ("1" → "01"). */
export function padSeat(n: number): string {
  return String(n).padStart(2, "0");
}
