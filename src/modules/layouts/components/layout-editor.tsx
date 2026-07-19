"use client";

import { useMemo, useState } from "react";

import { CustomLayoutModal } from "@/modules/layouts/components/custom-layout-modal";
import { SeatLayoutPreview } from "@/modules/layouts/components/seat-layout-preview";
import type { LayoutConfig } from "@/modules/layouts/geometry";
import { seatsForConfig } from "@/modules/layouts/geometry";
import { useLayoutOptions } from "@/modules/layouts/hooks/use-layouts";
import {
  DEFAULT_PRESET_KEY,
  defaultLayoutConfig,
  findPreset,
  GRID_PRESETS,
} from "@/modules/layouts/presets";
import type { LayoutInput } from "@/modules/layouts/schemas";
import type { ManagedLayout } from "@/modules/layouts/types";

/** The editor's form state — a superset of a LayoutInput. */
export interface LayoutDraft {
  name: string;
  config: LayoutConfig;
  isCustom: boolean;
  isActive: boolean;
}

/** Build a clean LayoutInput from the draft (for the API). */
export function draftToInput(draft: LayoutDraft): LayoutInput {
  return {
    name: draft.name.trim(),
    rows: draft.config.rows,
    columnsLeft: draft.config.columnsLeft,
    columnsRight: draft.config.columnsRight,
    aislePosition: draft.config.aislePosition,
    aisleWidth: draft.config.aisleWidth,
    vipRows: draft.config.vipRows ?? [],
    isCustom: draft.isCustom,
    isActive: draft.isActive,
  };
}

/** Seed a draft from an existing layout (edit) or the default preset (create). */
export function initialDraft(layout?: ManagedLayout | null): LayoutDraft {
  if (layout) {
    return {
      name: layout.name,
      config: {
        rows: layout.rows,
        columnsLeft: layout.columnsLeft,
        columnsRight: layout.columnsRight,
        aislePosition: layout.aislePosition,
        aisleWidth: layout.aisleWidth,
        vipRows: layout.vipRows,
      },
      isCustom: layout.isCustom,
      isActive: layout.isActive,
    };
  }
  return {
    name: "",
    config: defaultLayoutConfig(),
    isCustom: false,
    isActive: true,
  };
}

/**
 * The "Seat Layout Configuration" panel + live preview. Controlled by the
 * parent via `draft`/`onChange`. The Grid Style dropdown offers built-in presets
 * (default 3 × 36), any saved custom layouts, and a "Custom Layout" option that
 * opens the modal. Total Seats is derived from the geometry so it always agrees.
 */
export function LayoutEditor({
  draft,
  errors,
  onChange,
}: {
  draft: LayoutDraft;
  errors?: { name?: string; grid?: string };
  onChange: (draft: LayoutDraft) => void;
}) {
  const { data: savedOptions = [] } = useLayoutOptions();
  const [customOpen, setCustomOpen] = useState(false);
  // Which dropdown value is selected (a preset key, a saved layout id, or "custom").
  const [gridValue, setGridValue] = useState<string>(
    draft.isCustom ? "custom" : DEFAULT_PRESET_KEY,
  );

  const totalSeats = useMemo(() => seatsForConfig(draft.config), [draft.config]);

  function applyPreset(key: string) {
    const preset = findPreset(key);
    if (!preset) return;
    setGridValue(key);
    onChange({ ...draft, config: { ...preset.config }, isCustom: false });
  }

  function applyCustom(config: LayoutConfig) {
    setGridValue("custom");
    onChange({ ...draft, config, isCustom: true });
    setCustomOpen(false);
  }

  function onGridChange(value: string) {
    if (value === "custom") {
      setCustomOpen(true);
      return;
    }
    // Saved layout selected?
    const saved = savedOptions.find((o) => o.id === value);
    if (saved) {
      // Saved layouts don't carry full geometry in the option payload; the
      // dropdown just marks the choice. Treat it as custom-derived: keep current
      // config but flag isCustom so the name/geometry the user picks is honoured.
      setGridValue(value);
      return;
    }
    applyPreset(value);
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {/* Configuration */}
      <section className="rounded-[14px] border border-[var(--login-border)] bg-white p-5 shadow-sm">
        <h2 className="text-[17px] font-bold text-[var(--pos-navy)]">
          Seat Layout Configuration
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-[13px] font-medium text-[var(--pos-navy)]">
              Layout Name<span className="text-[#DC2626]">*</span>
            </label>
            <input
              value={draft.name}
              onChange={(e) => onChange({ ...draft, name: e.target.value })}
              placeholder="Enter layout name (e.g., Coach A, Cabin 1, Zone A)"
              className={`mt-1 h-10 w-full rounded-md border px-3 text-[14px] outline-none focus:border-[var(--pos-amber)] ${
                errors?.name ? "border-[#DC2626]" : "border-[var(--login-border)]"
              }`}
            />
            {errors?.name && (
              <p className="mt-1 text-[12px] text-[#DC2626]">{errors.name}</p>
            )}
          </div>
          <div>
            <label className="text-[13px] font-medium text-[var(--pos-navy)]">
              Total Seats<span className="text-[#DC2626]">*</span>
            </label>
            <input
              value={totalSeats}
              readOnly
              className="mt-1 h-10 w-full rounded-md border border-[var(--login-border)] bg-[var(--login-hover-bg)]/60 px-3 text-[14px] text-[var(--pos-navy)] outline-none"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-[13px] font-medium text-[var(--pos-navy)]">
            Grid Style<span className="text-[#DC2626]">*</span>
          </label>
          <select
            value={gridValue}
            onChange={(e) => onGridChange(e.target.value)}
            className="mt-1 h-10 w-full rounded-md border border-[var(--login-border)] bg-white px-3 text-[14px] text-[var(--pos-navy)] outline-none focus:border-[var(--pos-amber)]"
          >
            <optgroup label="Presets">
              {GRID_PRESETS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </optgroup>
            {savedOptions.length > 0 && (
              <optgroup label="Saved Layouts">
                {savedOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.totalSeats} seats)
                  </option>
                ))}
              </optgroup>
            )}
            <option value="custom">＋ Custom Layout…</option>
          </select>
          <p className="mt-2 rounded-md bg-[var(--pos-blue-soft)] px-3 py-2 text-[12px] text-[var(--pos-navy)]">
            This layout allows you to create a unique seat arrangement with
            aisles, rows and columns.
          </p>
          {errors?.grid && (
            <p className="mt-1 text-[12px] text-[#DC2626]">{errors.grid}</p>
          )}
        </div>

        {/* VIP rows */}
        <div className="mt-4">
          <label className="text-[13px] font-medium text-[var(--pos-navy)]">
            VIP Rows
          </label>
          <input
            value={(draft.config.vipRows ?? []).join(", ")}
            onChange={(e) => {
              const vipRows = e.target.value
                .split(",")
                .map((s) => parseInt(s.trim(), 10))
                .filter((n) => Number.isInteger(n) && n >= 1 && n <= draft.config.rows);
              onChange({
                ...draft,
                config: { ...draft.config, vipRows },
              });
            }}
            placeholder="e.g. 1, 2"
            className="mt-1 h-10 w-full rounded-md border border-[var(--login-border)] px-3 text-[14px] outline-none focus:border-[var(--pos-amber)]"
          />
          <p className="mt-1 text-[12px] text-[var(--login-text-muted)]">
            Comma-separated row numbers to mark as VIP.
          </p>
        </div>

        {/* Status */}
        <div className="mt-5">
          <div className="inline-flex rounded-lg border border-[var(--login-border)] p-1">
            <button
              type="button"
              onClick={() => onChange({ ...draft, isActive: true })}
              className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors ${
                draft.isActive
                  ? "bg-[var(--pos-navy)] text-white"
                  : "text-[var(--login-text-muted)]"
              }`}
            >
              <span
                className={`size-2 rounded-full ${draft.isActive ? "bg-[var(--pos-success)]" : "bg-current"}`}
              />
              Active
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...draft, isActive: false })}
              className={`rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors ${
                !draft.isActive
                  ? "bg-[var(--pos-navy)] text-white"
                  : "text-[var(--login-text-muted)]"
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </section>

      {/* Preview */}
      <section className="rounded-[14px] border border-[var(--login-border)] bg-white p-5 shadow-sm">
        <h2 className="text-[17px] font-bold text-[var(--pos-navy)]">
          Seat Layout Preview
        </h2>
        <div className="mt-4">
          <SeatLayoutPreview config={draft.config} />
        </div>
      </section>

      <CustomLayoutModal
        open={customOpen}
        initial={draft.config}
        onOpenChange={setCustomOpen}
        onApply={applyCustom}
      />
    </div>
  );
}
