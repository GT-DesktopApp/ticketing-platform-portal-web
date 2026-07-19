import { z } from "zod";

/**
 * Validation schemas for the Layout Management module (seat layouts). The API
 * route handlers parse requests with these; the forms reuse the inferred types.
 */

const aislePositionEnum = z.enum(["LEFT", "CENTRE", "RIGHT", "DUAL", "NONE"]);
const aisleWidthEnum = z.enum(["NARROW", "MEDIUM", "WIDE"]);

/** Create / update payload for a seat layout. */
export const layoutInputSchema = z.object({
  name: z.string().trim().min(1, "Layout name is required").max(80),
  rows: z.number().int().min(1, "At least 1 row").max(20, "Max 20 rows"),
  columnsLeft: z
    .number()
    .int()
    .min(0, "Columns can't be negative")
    .max(8, "Max 8 columns"),
  columnsRight: z
    .number()
    .int()
    .min(0, "Columns can't be negative")
    .max(8, "Max 8 columns"),
  aislePosition: aislePositionEnum.default("CENTRE"),
  aisleWidth: aisleWidthEnum.default("MEDIUM"),
  /** 1-indexed VIP row numbers. */
  vipRows: z.array(z.number().int().min(1)).default([]),
  /** User-created (Custom Layout) vs a saved preset. */
  isCustom: z.boolean().default(true),
  isActive: z.boolean().default(true),
})
  .refine((c) => c.columnsLeft + c.columnsRight >= 1, {
    message: "Add at least one seat column",
    path: ["columnsLeft"],
  })
  .refine((c) => c.vipRows.every((r) => r <= c.rows), {
    message: "A VIP row number exceeds the row count",
    path: ["vipRows"],
  });

export type LayoutInput = z.infer<typeof layoutInputSchema>;

/** Toggle a layout's active status. */
export const toggleLayoutStatusSchema = z.object({ isActive: z.boolean() });
