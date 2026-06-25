import { z } from "zod";

import { emailSchema } from "@/lib/validations/common";

/**
 * Login form / credentials schema.
 *
 * Lives in the `auth` feature module (feature-owned validation), composed from
 * the shared `emailSchema` primitive. The credentials provider and the login
 * form both import this so client and server validate identically.
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

export type LoginInput = z.infer<typeof loginSchema>;
