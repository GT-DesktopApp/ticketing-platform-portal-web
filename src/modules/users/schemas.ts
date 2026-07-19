import { z } from "zod";

import type { ModuleKey } from "@/modules/users/modules";

/**
 * Validation schemas for the User Management module (users + roles). The API
 * route handlers parse requests with these, and the forms reuse the inferred
 * types so client and server validate identically.
 */

const nameField = z.string().trim().min(1, "Full name is required");
const emailField = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email")
  .transform((v) => v.toLowerCase());
const usernameField = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username is too long")
  .regex(/^[a-zA-Z0-9._-]+$/, "Use letters, numbers, . _ - only");
const mobileField = z
  .string()
  .trim()
  .min(7, "Enter a valid mobile number")
  .max(20, "Mobile number is too long");
const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long");

/** Create-user payload (Add User form). */
export const createUserSchema = z
  .object({
    name: nameField,
    email: emailField,
    username: usernameField,
    mobile: mobileField,
    password: passwordField,
    confirmPassword: z.string(),
    roleId: z.string().uuid("Select a role"),
    isActive: z.boolean().default(true),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * Update-user payload (Edit User form). Password is optional on edit — omit it
 * to keep the current one; provide it (with a match) to change it.
 */
export const updateUserSchema = z
  .object({
    name: nameField,
    email: emailField,
    username: usernameField,
    mobile: mobileField,
    password: passwordField.optional().or(z.literal("")),
    confirmPassword: z.string().optional(),
    roleId: z.string().uuid("Select a role"),
    isActive: z.boolean(),
  })
  .refine(
    (d) => !d.password || d.password === d.confirmPassword,
    { message: "Passwords do not match", path: ["confirmPassword"] },
  );
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/** Toggle a user's active status. */
export const toggleUserStatusSchema = z.object({ isActive: z.boolean() });

/** Admin password reset for a user. */
export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** All 12 module keys — used to validate the role form's module selection. */
const moduleKeyEnum = z.enum([
  "ticket_booking",
  "bookings",
  "transactions",
  "invoices",
  "inventory",
  "cctv",
  "attractions",
  "customers",
  "reports",
  "user_management",
  "settings",
  "backup",
]) satisfies z.ZodType<ModuleKey>;

/** Create / update payload for a role (Add/Edit Role form). */
export const roleInputSchema = z.object({
  name: z.string().trim().min(1, "Role name is required").max(60),
  description: z.string().trim().max(300).optional().nullable(),
  modules: z.array(moduleKeyEnum).default([]),
  isActive: z.boolean().default(true),
});
export type RoleInput = z.infer<typeof roleInputSchema>;

/** Toggle a role's active status. */
export const toggleRoleStatusSchema = z.object({ isActive: z.boolean() });
