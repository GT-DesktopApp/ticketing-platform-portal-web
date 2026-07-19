"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/constants/routes";
import type { AttractionInput } from "@/modules/attractions/schemas";
import type {
  BulkImportResult,
  BulkValidationResult,
  ManagedAttraction,
} from "@/modules/attractions/types";

/** Query keys for the Attraction Management module. */
export const attractionAdminKeys = {
  all: ["managed-attractions"] as const,
  list: (search?: string) =>
    ["managed-attractions", "list", search ?? ""] as const,
  detail: (id: string) => ["managed-attractions", "detail", id] as const,
};

/**
 * The management list. Kept fresh for a few minutes so navigating away and back
 * doesn't re-flash the loading state; mutations invalidate it explicitly, and
 * `keepPreviousData` keeps the grid visible during a search refetch.
 */
export function useManagedAttractions(search?: string) {
  return useQuery({
    queryKey: attractionAdminKeys.list(search),
    queryFn: async () => {
      const url = search
        ? `${API_ROUTES.MANAGE_ATTRACTIONS}?search=${encodeURIComponent(search)}`
        : API_ROUTES.MANAGE_ATTRACTIONS;
      const { data } = await apiClient.get<ManagedAttraction[]>(url);
      return data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

/** Load a single attraction for the edit form. */
export function useManagedAttraction(id: string | null) {
  return useQuery({
    queryKey: attractionAdminKeys.detail(id ?? ""),
    enabled: !!id,
    queryFn: async () => {
      const { data } = await apiClient.get<ManagedAttraction>(
        `${API_ROUTES.MANAGE_ATTRACTIONS}/${id}`,
      );
      return data;
    },
  });
}

/**
 * Invalidate every management + booking query after a write.
 *
 * `refetchType: "all"` forces a refetch even for INACTIVE queries — the booking
 * screen's `["attractions"]` query is usually unmounted while the operator is in
 * Attraction Management, so a plain invalidate would only mark it stale and
 * leave the old image/price/deleted card showing until a manual reload. Refetch
 * of the deleted attraction thus propagates immediately to the booking screen.
 */
function useInvalidateAttractions() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({
      queryKey: attractionAdminKeys.all,
      refetchType: "all",
    });
    // The booking screen reads a separate cache (["attractions"]); refresh it too.
    qc.invalidateQueries({ queryKey: ["attractions"], refetchType: "all" });
  };
}

/** Create a new attraction. */
export function useCreateAttraction() {
  const invalidate = useInvalidateAttractions();
  return useMutation({
    mutationFn: async (input: AttractionInput) => {
      const { data } = await apiClient.post<ManagedAttraction>(
        API_ROUTES.MANAGE_ATTRACTIONS,
        input,
      );
      return data;
    },
    onSuccess: invalidate,
  });
}

/** Update an existing attraction. */
export function useUpdateAttraction() {
  const invalidate = useInvalidateAttractions();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: AttractionInput;
    }) => {
      const { data } = await apiClient.put<ManagedAttraction>(
        `${API_ROUTES.MANAGE_ATTRACTIONS}/${id}`,
        input,
      );
      return data;
    },
    onSuccess: invalidate,
  });
}

/** Soft-delete an attraction. */
export function useDeleteAttraction() {
  const invalidate = useInvalidateAttractions();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.del<{ id: string }>(
        `${API_ROUTES.MANAGE_ATTRACTIONS}/${id}`,
      );
      return data;
    },
    onSuccess: invalidate,
  });
}

/** Validate an uploaded bulk file (no writes). */
export function useValidateBulkUpload() {
  return useMutation({
    mutationFn: async (payload: { fileName: string; content: string }) => {
      const { data } = await apiClient.post<BulkValidationResult>(
        API_ROUTES.BULK_UPLOAD_VALIDATE,
        payload,
      );
      return data;
    },
  });
}

/** Import a validated bulk file (creates/updates attractions). */
export function useImportBulkUpload() {
  const invalidate = useInvalidateAttractions();
  return useMutation({
    mutationFn: async (payload: { fileName: string; content: string }) => {
      const { data } = await apiClient.post<BulkImportResult>(
        API_ROUTES.BULK_UPLOAD_IMPORT,
        payload,
      );
      return data;
    },
    onSuccess: invalidate,
  });
}
