import type { ApiResponse, PaginationMeta } from "./api-response";

/**
 * Browser-side fetch helper that speaks the project's API envelope.
 *
 * Every route handler returns `{ success, message, data, ... }`. This unwraps
 * that: on success it returns `data` (and optional pagination meta); on failure
 * it throws an `ApiClientError` carrying the message + field errors, which the
 * UI surfaces via toast / inline messages.
 */

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export interface ApiResult<T> {
  data: T;
  pagination?: PaginationMeta;
}

async function request<T>(
  url: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  let body: ApiResponse<T>;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError(
      `Request failed (${res.status})`,
      res.status,
    );
  }

  if (!body.success) {
    throw new ApiClientError(body.message, res.status, body.errors);
  }
  return { data: body.data, pagination: body.meta?.pagination };
}

export const apiClient = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, payload?: unknown) =>
    request<T>(url, { method: "POST", body: JSON.stringify(payload ?? {}) }),
  put: <T>(url: string, payload?: unknown) =>
    request<T>(url, { method: "PUT", body: JSON.stringify(payload ?? {}) }),
  del: <T>(url: string) => request<T>(url, { method: "DELETE" }),
};
