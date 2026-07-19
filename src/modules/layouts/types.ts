import type { AislePosition, AisleWidth } from "./geometry";

/** A seat layout as returned by the API (Layout Management + dropdown). */
export interface ManagedLayout {
  id: string;
  name: string;
  totalSeats: number;
  rows: number;
  columnsLeft: number;
  columnsRight: number;
  aislePosition: AislePosition;
  aisleWidth: AisleWidth;
  vipRows: number[];
  isCustom: boolean;
  isActive: boolean;
  /** How many attractions currently use this layout. */
  attractionsUsing: number;
  createdAt: string;
}

/** A lightweight option for the Grid Style dropdown (saved custom layouts). */
export interface LayoutOption {
  id: string;
  name: string;
  totalSeats: number;
  isActive: boolean;
}
