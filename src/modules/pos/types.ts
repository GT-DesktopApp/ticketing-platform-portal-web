/**
 * Shared POS types used by the cart store, API client, and UI. These mirror the
 * Prisma models but are the lightweight shapes the browser works with.
 */

/**
 * A purchasable ticket PRODUCT of an attraction — the card the operator clicks
 * to add to the cart (e.g. "Indian Adult (2-way)", "Paddle Boat 2").
 */
export interface CategoryType {
  id: string;
  name: string;
}

/**
 * A priced ticket row of an attraction. In STANDARD mode these are visitor
 * categories (Adult/Child/…); in CATEGORY mode they are the attraction's own
 * ticket categories (Indian Adult (2-way), Boat (4), …). Both render in the
 * same vertical row list.
 */
export interface TicketProduct {
  id: string;
  attractionId: string;
  name: string;
  pricePaise: number;
  /** Optional image URL (CATEGORY tickets). */
  image: string | null;
  /** Legacy free-text grouping label. */
  category: string | null;
  /** HSN/SAC code for the receipt. */
  sacCode: string | null;
  /** Barcode for scanning. */
  barcode: string | null;
  /** Category type (CATEGORY mode), e.g. "Toy Train (VIP)". */
  categoryType: CategoryType | null;
  categoryTypeId: string | null;
  /** GST rate (%) stored per product; billing applies 18% flat. */
  gstRate: number;
  note: string | null;
  sortOrder: number;
  isActive: boolean;
}

/** @deprecated Use TicketProduct. Kept as an alias during the rename. */
export type TicketCategory = TicketProduct;

export type BookingType = "STANDARD" | "CATEGORY";

export interface Attraction {
  id: string;
  name: string;
  type: string;
  /** STANDARD → fixed visitor categories; CATEGORY → DB ticket categories. */
  bookingType: BookingType;
  description: string | null;
  imageUrl: string | null;
  baseRatePaise: number;
  durationMin: number | null;
  seatsPerTrip: number | null;
  requiresSeats: boolean;
  openTime: string | null;
  closeTime: string | null;
  isActive: boolean;
  /** The attraction's ticket rows (visitor or ticket categories per mode). */
  ticketProducts: TicketProduct[];
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  notes: string | null;
}

export type BogieStatus = "ACTIVE" | "LOCKED" | "FULL";
export type SeatStatus = "AVAILABLE" | "OCCUPIED" | "BLOCKED";

export interface Seat {
  id: string;
  number: number;
  side: string; // "left" | "right"
  status: SeatStatus;
}

export interface BogieView {
  id: string;
  label: string;
  capacity: number;
  sequence: number;
  available: number;
  status: BogieStatus;
  seats: Seat[];
}

/** A seat chosen for a passenger during allocation. */
export interface SeatSelection {
  seatId: string;
  seatLabel: string; // e.g. "A-05"
  passengerRef: string; // "Adult 1"
}

export type PaymentMethod = "CASH" | "CARD" | "UPI";
