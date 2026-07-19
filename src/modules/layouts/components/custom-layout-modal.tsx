"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";

import { SeatLayoutPreview } from "@/modules/layouts/components/seat-layout-preview";
import type {
  AislePosition,
  AisleWidth,
  LayoutConfig,
} from "@/modules/layouts/geometry";

const AISLE_POSITIONS: { value: AislePosition; label: string }[] = [
  { value: "LEFT", label: "Left" },
  { value: "CENTRE", label: "Centre" },
  { value: "RIGHT", label: "Right" },
  { value: "DUAL", label: "Dual Aisles" },
  { value: "NONE", label: "No Aisle" },
];

const AISLE_WIDTHS: { value: AisleWidth; label: string }[] = [
  { value: "NARROW", label: "Narrow" },
  { value: "MEDIUM", label: "Medium" },
  { value: "WIDE", label: "Wide" },
];

/**
 * Custom Layout modal (Custom.png). Rows / Columns (Left) / Columns (Right)
 * steppers plus Aisle Position and Aisle Width selects, with a live seat
 * preview. "Apply" returns the resulting config to the parent, which saves it as
 * a reusable custom layout.
 */
export function CustomLayoutModal({
  open,
  initial,
  onOpenChange,
  onApply,
}: {
  open: boolean;
  /** Starting config when editing an existing custom layout. */
  initial?: LayoutConfig;
  onOpenChange: (open: boolean) => void;
  onApply: (config: LayoutConfig) => void;
}) {
  const [rows, setRows] = useState(initial?.rows ?? 8);
  const [colsLeft, setColsLeft] = useState(initial?.columnsLeft ?? 2);
  const [colsRight, setColsRight] = useState(initial?.columnsRight ?? 1);
  const [aislePosition, setAislePosition] = useState<AislePosition>(
    initial?.aislePosition ?? "CENTRE",
  );
  const [aisleWidth, setAisleWidth] = useState<AisleWidth>(
    initial?.aisleWidth ?? "MEDIUM",
  );

  const config: LayoutConfig = {
    rows,
    columnsLeft: colsLeft,
    columnsRight: colsRight,
    aislePosition,
    aisleWidth,
    vipRows: initial?.vipRows ?? [],
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 z-50 flex max-h-[90vh] w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:zoom-in-95"
          aria-describedby={undefined}
        >
          <div className="border-b border-[var(--login-border)] px-6 py-4">
            <Dialog.Title className="text-[18px] font-bold text-[var(--pos-navy)]">
              Custom Layout
            </Dialog.Title>
            <p className="text-[13px] text-[var(--login-text-muted)]">
              Design your own seat layout
            </p>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto p-6 lg:grid-cols-[280px_1fr]">
            {/* Controls */}
            <div className="space-y-5">
              <Stepper
                label="Rows"
                hint="Minimum 1 row, Maximum 20 rows"
                value={rows}
                min={1}
                max={20}
                onChange={setRows}
              />
              <Stepper
                label="Columns (Left Side)"
                hint="Minimum 1 columns, Maximum 8 columns"
                value={colsLeft}
                min={0}
                max={8}
                onChange={setColsLeft}
              />
              <Stepper
                label="Columns (Right Side)"
                hint="Minimum 1 columns, Maximum 8 columns"
                value={colsRight}
                min={0}
                max={8}
                onChange={setColsRight}
              />
              <SelectField
                label="Aisle Position"
                value={aislePosition}
                options={AISLE_POSITIONS}
                onChange={(v) => setAislePosition(v as AislePosition)}
              />
              <SelectField
                label="Aisle Width"
                value={aisleWidth}
                options={AISLE_WIDTHS}
                onChange={(v) => setAisleWidth(v as AisleWidth)}
              />
            </div>

            {/* Preview */}
            <div>
              <p className="mb-3 text-[14px] font-semibold text-[var(--pos-navy)]">
                Seat Layout Preview
              </p>
              <SeatLayoutPreview config={config} />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-[var(--login-border)] px-6 py-4">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-md border border-[var(--login-border)] px-6 py-2.5 text-[14px] font-medium text-[var(--pos-navy)] transition-colors hover:bg-[var(--login-hover-bg)]"
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={() => onApply(config)}
              className="rounded-md bg-[var(--pos-amber)] px-6 py-2.5 text-[14px] font-semibold text-[#1c1407] transition-colors hover:bg-[var(--pos-amber-600)]"
            >
              Apply
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Stepper({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-[13px] font-medium text-[var(--pos-navy)]">
        {label}
      </p>
      <div className="flex items-stretch overflow-hidden rounded-md border border-[var(--login-border)]">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex w-12 items-center justify-center border-r border-[var(--login-border)] text-[var(--pos-navy)] transition-colors hover:bg-[var(--login-hover-bg)] disabled:opacity-40"
          aria-label={`Decrease ${label}`}
        >
          <Minus className="size-4" />
        </button>
        <div className="flex flex-1 items-center justify-center py-2 text-[15px] font-bold tabular-nums text-[var(--pos-navy)]">
          {value}
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex w-12 items-center justify-center border-l border-[var(--login-border)] text-[var(--pos-navy)] transition-colors hover:bg-[var(--login-hover-bg)] disabled:opacity-40"
          aria-label={`Increase ${label}`}
        >
          <Plus className="size-4" />
        </button>
      </div>
      <p className="mt-1 text-[11px] text-[var(--login-text-muted)]">{hint}</p>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-[13px] font-medium text-[var(--pos-navy)]">
        {label}
      </p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-md border border-[var(--login-border)] bg-white px-3 text-[14px] text-[var(--pos-navy)] outline-none focus:border-[var(--pos-amber)]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
