import { z } from "zod";

/**
 * Login form / credentials schema.
 *
 * Lives in the `auth` feature module (feature-owned validation). The `email`
 * field accepts an **email OR a username** (the login screen reads
 * "Email/Username"); the credentials provider resolves it against either column.
 * Kept lenient here so a valid username isn't rejected before the DB lookup.
 */
export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email or username is required."),
  password: z.string().min(1, "Password is required."),
});

export type LoginInput = z.infer<typeof loginSchema>;
