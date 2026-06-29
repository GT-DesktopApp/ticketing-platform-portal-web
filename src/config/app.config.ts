/**
 * Application-level configuration constants.
 *
 * These are non-secret, compile-time values that describe the product itself.
 * Secrets and environment-specific values belong in `config/env.ts`.
 */
export const appConfig = {
  name: "Ticketing Platform Admin",
  shortName: "TPA",
  description:
    "Internal admin console for ticketing, POS, and attraction management.",
  /** Default locale and currency for formatting. Adjust per deployment region. */
  locale: "en-US",
  currency: "INR",
  /** Where unauthenticated users are told to request access (login footer CTA). */
  supportEmail: "admin@ticketingplatform.com",
  /** Support multi-branch / multi-location from day one (data is scoped, UI later). */
  multiTenancy: {
    branchesEnabled: true,
    locationsEnabled: true,
  },
} as const;

/**
 * Pagination defaults used across all list endpoints and tables.
 * Centralized so the API and the UI agree on the same numbers.
 */
export const paginationConfig = {
  defaultPage: 1,
  defaultPageSize: 20,
  maxPageSize: 100,
  pageSizeOptions: [10, 20, 50, 100] as const,
} as const;

export type AppConfig = typeof appConfig;
