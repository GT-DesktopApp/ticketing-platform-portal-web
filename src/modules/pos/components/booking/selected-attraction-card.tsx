"use client";

import { X } from "lucide-react";
import { memo } from "react";

import { AttractionIcon } from "@/modules/pos/components/booking/attraction-icon";
import type { Attraction } from "@/modules/pos/types";
import { formatCurrency } from "@/modules/pos/utils/billing";

/**
 * The header card of the booking panel: the selected attraction's name, type,
 * base rate, duration and seats — plus a "Change Attraction" control that
 * deselects and returns the page to the full-width attraction list.
 */
export const SelectedAttractionCard = memo(function SelectedAttractionCard({
  attraction,
  onChange,
}: {
  attraction: Attraction;
  onChange: () => void;
}) {
  return (
    <div className="flex min-h-[120px] items-start justify-between rounded-[12px] bg-[var(--pos-blue-soft)] p-6">
      <div>
        <h2 className="text-[20px] font-bold text-[var(--pos-navy)]">
          {attraction.name}
        </h2>
        <span className="mt-1 inline-block rounded bg-white px-2 py-0.5 text-[12px] font-medium text-[var(--login-text-muted)]">
          {attraction.type}
        </span>
        <div className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-[13px] text-[var(--login-text-muted)]">
          <span>
            Base Rate:{" "}
            <strong className="text-[var(--pos-navy)]">
              {formatCurrency(attraction.baseRatePaise / 100)} / person
            </strong>
          </span>
          {attraction.durationMin != null && (
            <span>
              Duration:{" "}
              <strong className="text-[var(--pos-navy)]">
                {attraction.durationMin} min / trip
              </strong>
            </span>
          )}
          {attraction.seatsPerTrip != null && (
            <span>
              Seats per trip:{" "}
              <strong className="text-[var(--pos-navy)]">
                {attraction.seatsPerTrip}
              </strong>
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-3">
        <button
          type="button"
          onClick={onChange}
          className="flex items-center gap-1 text-[13px] font-medium text-[var(--login-text-muted)] transition-colors hover:text-[var(--pos-navy)]"
        >
          <X className="size-4" /> Change Attraction
        </button>
        <AttractionIcon
          type={attraction.type}
          className="size-14 text-[var(--pos-navy)]/30"
        />
      </div>
    </div>
  );
});
