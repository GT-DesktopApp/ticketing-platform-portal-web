import { z } from "zod";

/**
 * Centralized, type-safe environment configuration.
 *
 * Why this exists:
 * - Fails fast at startup if a required variable is missing or malformed,
 *   instead of surfacing a confusing `undefined` deep inside the app at runtime.
 * - Gives the whole codebase a single, fully-typed `env` object to import,
 *   so we never read `process.env.SOMETHING` (untyped, error-prone) directly.
 *
 * Server variables are validated eagerly. Client-exposed variables MUST be
 * prefixed with `NEXT_PUBLIC_` (Next.js requirement) and live in `clientSchema`.
 */

const serverSchema = z.object({
  /** Neon PostgreSQL connection string (pooled connection recommended for serverless). */
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL must be a valid PostgreSQL connection string"),

  /** Canonical URL of the deployment, used by Auth.js for callbacks. */
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),

  /**
   * Secret used to sign/encrypt Auth.js JWTs and cookies.
   * Generate with: `openssl rand -base64 32`
   */
  NEXTAUTH_SECRET: z
    .string()
    .min(32, "NEXTAUTH_SECRET must be at least 32 characters"),

  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

const clientSchema = z.object({
  /** Public app URL, safe to expose to the browser. Optional; defaults to NEXTAUTH_URL usage. */
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

/**
 * We validate the two schemas separately because client variables are inlined
 * into the browser bundle at build time and must be referenced explicitly.
 */
const parsedServer = serverSchema.safeParse(process.env);
const parsedClient = clientSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

if (!parsedServer.success) {
  console.error(
    "❌ Invalid server environment variables:",
    z.treeifyError(parsedServer.error),
  );
  throw new Error("Invalid server environment variables. See logs above.");
}

if (!parsedClient.success) {
  console.error(
    "❌ Invalid client environment variables:",
    z.treeifyError(parsedClient.error),
  );
  throw new Error("Invalid client environment variables. See logs above.");
}

/** Fully-typed, validated environment. Import this everywhere instead of `process.env`. */
export const env = {
  ...parsedServer.data,
  ...parsedClient.data,
} as const;

export type Env = typeof env;
