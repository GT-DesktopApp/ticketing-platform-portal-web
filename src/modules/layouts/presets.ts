import type { AislePosition, AisleWidth, LayoutConfig } from "./geometry";
import { seatsForConfig } from "./geometry";

/**
 * Built-in Grid Style presets for the Seat Layout dropdown.
 *
 * Each preset is a named "columns × total-seats" bundle: `columns` seats sit
 * across each row (split left/right around a centre aisle) and `rows` are chosen
 * so `columns × rows` = the advertised total. Selecting a preset prefills the
 * layout config; the user can then switch to Custom Layout for full control.
 *
 * The default selection is "3 × 36" (3 across, 36 total → 12 rows).
 */
export interface GridPreset {
  /** Stable key used as the dropdown value. */
  key: string;
  /** Label shown in the dropdown, e.g. "3 × 36". */
  label: string;
  config: LayoutConfig;
}

/** Split `columns` across a centre aisle: extra column goes to the left block. */
function splitColumns(columns: number): { left: number; right: number } {
  const left = Math.ceil(columns / 2);
  return { left, right: columns - left };
}

/** Build a preset from a "columns × total" spec (rows derived from the total). */
function preset(
  columns: number,
  total: number,
  opts?: { aislePosition?: AislePosition; aisleWidth?: AisleWidth },
): GridPreset {
  const rows = Math.max(1, Math.round(total / columns));
  const { left, right } = splitColumns(columns);
  const config: LayoutConfig = {
    rows,
    columnsLeft: left,
    columnsRight: right,
    aislePosition: right === 0 ? "NONE" : (opts?.aislePosition ?? "CENTRE"),
    aisleWidth: opts?.aisleWidth ?? "MEDIUM",
    vipRows: [],
  };
  return { key: `${columns}x${total}`, label: `${columns} × ${total}`, config };
}

/** The built-in presets, in dropdown order. */
export const GRID_PRESETS: GridPreset[] = [
  preset(1, 1),
  preset(2, 2, { aislePosition: "LEFT" }),
  preset(2, 2, { aislePosition: "RIGHT" }),
  preset(2, 4),
  preset(2, 6),
  preset(3, 6),
  preset(3, 9),
  preset(4, 8),
  preset(4, 12),
  preset(4, 16),
  preset(3, 36), // ← default
];

/** The dropdown value pre-selected by default. */
export const DEFAULT_PRESET_KEY = "3x36";

/** Look up a preset by key. */
export function findPreset(key: string): GridPreset | undefined {
  return GRID_PRESETS.find((p) => p.key === key);
}

/** The default layout config (used when a fresh layout form opens). */
export function defaultLayoutConfig(): LayoutConfig {
  return (
    findPreset(DEFAULT_PRESET_KEY)?.config ?? {
      rows: 12,
      columnsLeft: 2,
      columnsRight: 1,
      aislePosition: "CENTRE",
      aisleWidth: "MEDIUM",
      vipRows: [],
    }
  );
}

/** Sanity: presets' derived totals match their advertised label numbers. */
export function presetSeats(p: GridPreset): number {
  return seatsForConfig(p.config);
}
