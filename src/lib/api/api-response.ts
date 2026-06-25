import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AuthorizationError } from "@/lib/permissions/guard";

/**
 * Standardized API response envelope used by EVERY route handler.
 *
 * Shape (matches the project contract):
 *   {
 *     success: boolean,
 *     message: string,
 *     data: <payload> | null,
 *     errors?: <field errors>,   // present on validation failures
 *     meta?: { pagination },     // present on paginated list responses
 *   }
 *
 * Standardizing this means the frontend's service/query layer can rely on a
 * single contract regardless of which endpoint it calls.
 */

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: { pagination: PaginationMeta };
}

export interface ApiError {
  success: false;
  message: string;
  data: null;
  errors?: Record<string, string[]>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/** HTTP status codes we use, named for readability at call sites. */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/** Build a successful JSON response with the standard envelope. */
export function ok<T>(
  data: T,
  message = "Success",
  init?: { status?: number; pagination?: PaginationMeta },
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      ...(init?.pagination ? { meta: { pagination: init.pagination } } : {}),
    },
    { status: init?.status ?? HttpStatus.OK },
  );
}

/** Build a `201 Created` response. */
export function created<T>(data: T, message = "Created successfully") {
  return ok(data, message, { status: HttpStatus.CREATED });
}

/** Build an error JSON response with the standard envelope. */
export function fail(
  message: string,
  init?: { status?: number; errors?: Record<string, string[]> },
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      success: false,
      message,
      data: null,
      ...(init?.errors ? { errors: init.errors } : {}),
    },
    { status: init?.status ?? HttpStatus.BAD_REQUEST },
  );
}

/**
 * Centralized error translator for route handlers.
 *
 * Wrap a handler body in `try/catch` and return `handleApiError(error)` in the
 * catch block. It maps known error types (Zod validation, authorization) to the
 * correct status code and a clean envelope, and hides internal details for
 * unexpected errors.
 */
export function handleApiError(error: unknown): NextResponse<ApiError> {
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join(".") || "_";
      (fieldErrors[path] ??= []).push(issue.message);
    }
    return fail("Validation failed.", {
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      errors: fieldErrors,
    });
  }

  if (error instanceof AuthorizationError) {
    return fail(error.message, {
      status:
        error.code === "UNAUTHENTICATED"
          ? HttpStatus.UNAUTHORIZED
          : HttpStatus.FORBIDDEN,
    });
  }

  // Unknown / unexpected error: log server-side, return a safe generic message.
  console.error("[API] Unhandled error:", error);
  return fail("An unexpected error occurred.", {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  });
}
