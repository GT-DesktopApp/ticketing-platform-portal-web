import { z } from "zod";

/**
 * Reusable Zod primitives shared across feature modules.
 *
 * Each feature owns its own schemas (in `modules/<feature>/schemas`), but they
 * compose these shared building blocks so that, e.g., "what counts as a valid
 * email/password/UUID" is defined exactly once.
 */

export const idSchema = z.string().uuid("Invalid identifier.");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Please enter a valid email address.");

/**
 * Password policy for the whole platform. Tighten/loosen here and every form
 * and API that imports it stays consistent.
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be at most 72 characters.") // bcrypt input limit
  .regex(/[a-z]/, "Include at least one lowercase letter.")
  .regex(/[A-Z]/, "Include at least one uppercase letter.")
  .regex(/[0-9]/, "Include at least one number.");

export const nonEmptyString = z
  .string()
  .trim()
  .min(1, "This field is required.");

/** Sorting direction accepted by list endpoints. */
export const sortOrderSchema = z.enum(["asc", "desc"]).default("asc");

/** Generic free-text search query. */
export const searchSchema = z.string().trim().max(200).optional();
