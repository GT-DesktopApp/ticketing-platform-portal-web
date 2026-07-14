import { z } from "zod";

/**
 * Validation schemas for the Attraction Management module. The API route
 * handlers parse requests with these, and the forms reuse the inferred types.
 * Prices are in RUPEES on the wire; the API converts to paise for storage.
 */

/** A YYYY-MM-DD date string, or empty/null when not scheduled. */
const dateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use format YYYY-MM-DD")
  .optional()
  .nullable();

/** A single visitor category / pricing row in the add/edit form. */
export const attractionCategorySchema = z
  .object({
    /** Present when editing an existing row; absent for a new row. */
    id: z.string().uuid().optional().nullable(),
    name: z.string().trim().min(1, "Category name is required"),
    basePrice: z
      .number({ message: "Enter a valid base price" })
      .nonnegative("Base price cannot be negative"),
    futurePrice: z
      .number()
      .nonnegative("Future price cannot be negative")
      .optional()
      .nullable(),
    effectiveFrom: dateString,
    image: z.string().trim().optional().nullable(),
  })
  .refine((c) => c.futurePrice == null || c.effectiveFrom != null, {
    message: "Effective From is required when a future price is set",
    path: ["effectiveFrom"],
  });

/** Create / update payload for an attraction (add/edit form). */
export const attractionInputSchema = z.object({
  name: z.string().trim().min(1, "Attraction name is required"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or fewer")
    .optional()
    .nullable(),
  type: z.string().trim().min(1).default("Ride"),
  imageUrl: z.string().trim().min(1, "Attraction image is required"),
  isActive: z.boolean().default(true),
  openTime: z.string().trim().optional().nullable(),
  closeTime: z.string().trim().optional().nullable(),
  durationMin: z.number().int().positive().optional().nullable(),
  categories: z
    .array(attractionCategorySchema)
    .min(1, "Add at least one visitor category"),
});

export type AttractionInput = z.infer<typeof attractionInputSchema>;
export type AttractionCategoryInput = z.infer<typeof attractionCategorySchema>;

/** Body for POST /api/attractions/bulk-upload/import — echoes the parsed rows. */
export const bulkImportSchema = z.object({
  fileName: z.string(),
  /** Base64/CSV content re-sent so the server re-parses the same file. */
  content: z.string().min(1, "File content is required"),
});
export type BulkImportInput = z.infer<typeof bulkImportSchema>;
