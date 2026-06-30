import { z } from "zod";

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
  name: z.string().trim().min(1, "Name is required"),
  mobile: z
    .string()
    .trim()
    .min(7, "Enter a valid mobile number")
    .max(20, "Mobile number is too long"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().optional(),
});
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

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
