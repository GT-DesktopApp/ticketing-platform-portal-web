import { z } from "zod";

import { paginationConfig } from "@/config/app.config";

import type { PaginationMeta } from "./api-response";

/**
 * Reusable pagination utilities shared by every list endpoint.
 *
 * - `paginationQuerySchema` parses & clamps `?page=&pageSize=` query params.
 * - `getPrismaSkipTake` converts page/pageSize into Prisma's `skip`/`take`.
 * - `buildPaginationMeta` produces the `meta.pagination` block for responses.
 */

export const paginationQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .catch(paginationConfig.defaultPage)
    .default(paginationConfig.defaultPage),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(paginationConfig.maxPageSize)
    .catch(paginationConfig.defaultPageSize)
    .default(paginationConfig.defaultPageSize),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** Parse pagination params from a URL's search params (with safe fallbacks). */
export function parsePagination(
  searchParams: URLSearchParams,
): PaginationQuery {
  return paginationQuerySchema.parse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });
}

/** Translate page/pageSize into Prisma offset pagination arguments. */
export function getPrismaSkipTake({ page, pageSize }: PaginationQuery) {
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

/** Build the pagination metadata block returned alongside a paginated list. */
export function buildPaginationMeta(
  { page, pageSize }: PaginationQuery,
  total: number,
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
