import { z } from "zod";

import {
  GSTIN_REGEX,
  isValidPhone,
  normalizeName,
} from "@/modules/pos/utils/validation";

/**
 * Validation schemas for the POS booking flow. These are the single source of
 * truth for request shapes — the API route handlers parse with them, and the
 * frontend forms reuse the inferred types.
 */

/**
 * Create-product payload (the "New Category" dialog on the booking screen).
 *
 * A product is a `TicketCategory` row under the single catalog attraction. The
 * five fields match the form: name, category type, sales price, barcode, image.
 * `salesPrice` is entered in RUPEES; the API converts it to paise.
 */
export const createTicketProductSchema = z.object({
  name: z.string().trim().min(1, "Category name is required"),
  categoryTypeId: z.string().uuid().optional().nullable(),
  /** Sales price in rupees (form value); converted to paise server-side. */
  salesPrice: z.number().positive("Enter a valid sales price"),
  barcode: z.string().trim().optional().nullable(),
  image: z.string().trim().optional().nullable(),
});
export type CreateTicketProductInput = z.infer<
  typeof createTicketProductSchema
>;

/** Create-customer payload (Add New Customer in the Customer step). */
export const createCustomerSchema = z.object({
  // Collapse whitespace and require at least one real character — a name that is
  // only spaces (or starts with spaces) normalises to "" and fails min(1).
  name: z
    .string()
    .transform(normalizeName)
    .pipe(z.string().min(1, "Name is required")),
  // The PhoneInput stores E.164 (e.g. "+919812345678"); validate it as a real
  // phone number rather than a loose length check.
  mobile: z
    .string()
    .trim()
    .refine(isValidPhone, "Enter a valid mobile number"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .optional()
    .or(z.literal("")),
  // Optional, but when present must be a valid 15-char GSTIN.
  gstn: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .refine((v) => v === "" || GSTIN_REGEX.test(v), "Enter a valid GST number")
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().optional(),
});
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

/**
 * Complimentary-pass details captured when "Issue Complimentary Ticket?" is on
 * (Pass details / Guest details / Visitor count / Reference). All optional at
 * the field level; the booking schema requires the essentials for comp bookings.
 */
export const complimentaryDetailsSchema = z.object({
  passNo: z.string().trim().optional(),
  passDate: z.string().trim().optional(),
  discountPercent: z.number().int().min(0).max(100).optional().nullable(),
  guestName: z.string().trim().optional(),
  guestMobile: z.string().trim().optional(),
  guestDepartment: z.string().trim().optional(),
  guestDesignation: z.string().trim().optional(),
  adultCount: z.number().int().min(0).optional().nullable(),
  childCount: z.number().int().min(0).optional().nullable(),
  referenceName: z.string().trim().optional(),
  referenceMobile: z.string().trim().optional(),
  referenceDepartment: z.string().trim().optional(),
  referenceDesignation: z.string().trim().optional(),
});
export type ComplimentaryDetailsInput = z.infer<
  typeof complimentaryDetailsSchema
>;

/** One cart line: a ticket category and how many were chosen. */
export const bookingItemSchema = z.object({
  ticketCategoryId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

/** One seat assignment: which seat goes to which passenger label. */
export const seatAssignmentSchema = z.object({
  seatId: z.string().uuid(),
  passengerRef: z.string().min(1), // "Adult 1", "Child 1", …
});

/** Payment captured at checkout. Amounts in paise. */
export const paymentSchema = z.object({
  method: z.enum(["CASH", "CARD", "UPI"]),
  amountPaidPaise: z.number().int().min(0),
});

/**
 * The atomic create-booking request. The server recomputes all money from
 * authoritative DB prices — the client's amounts are never trusted — then
 * writes booking + items + seat assignments + payment in ONE transaction.
 */
export const createBookingSchema = z
  .object({
    attractionId: z.string().uuid(),
    customerId: z.string().uuid().optional().nullable(),
    isComplimentary: z.boolean().default(false),
    passReference: z.string().trim().optional(),
    complimentary: complimentaryDetailsSchema.optional(),
    items: z.array(bookingItemSchema).min(1, "Add at least one ticket"),
    seatAssignments: z.array(seatAssignmentSchema).default([]),
    payment: paymentSchema.optional(),
  })
  .refine((data) => data.isComplimentary || data.payment !== undefined, {
    message: "Payment is required for non-complimentary bookings",
    path: ["payment"],
  })
  .refine(
    (data) => !data.isComplimentary || (data.passReference?.length ?? 0) > 0,
    {
      message: "Pass reference is required for complimentary bookings",
      path: ["passReference"],
    },
  );
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
