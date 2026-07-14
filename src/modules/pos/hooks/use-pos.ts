"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/constants/routes";
import type {
  CreateBookingInput,
  CreateCustomerInput,
} from "@/modules/pos/schemas/booking.schema";
import type {
  Attraction,
  BogieView,
  CategoryType,
  Customer,
} from "@/modules/pos/types";

/** Query keys, centralised so invalidation stays consistent. */
export const posKeys = {
  attractions: (search?: string) => ["attractions", search ?? ""] as const,
  seats: (attractionId: string) => ["attraction-seats", attractionId] as const,
  customers: (search: string) => ["customers", search] as const,
  categoryTypes: () => ["category-types"] as const,
};

/** Category types for the New Category dialog dropdown. */
export function useCategoryTypes() {
  return useQuery({
    queryKey: posKeys.categoryTypes(),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await apiClient.get<CategoryType[]>(
        "/api/category-types",
      );
      return data;
    },
  });
}

/**
 * All active attractions + their priced categories (booking screen).
 *
 * Caching: the attraction catalog rarely changes during a booking session, so
 * we fetch it ONCE and keep it fresh for a long window. This prevents the list
 * from flashing "Loading…" repeatedly:
 *   • staleTime 30m  — no background refetch on remount/navigation within the session.
 *   • gcTime 1h      — the cached data survives even if the screen unmounts briefly.
 *   • refetchOnMount / refetchOnReconnect false — never re-load on re-entry.
 *   • placeholderData keepPreviousData — if a refetch does happen (e.g. after an
 *     edit invalidates the key), the old list stays visible instead of blanking.
 * Mutations that change attractions explicitly invalidate ["attractions"].
 */
export function useAttractions(search?: string) {
  return useQuery({
    queryKey: posKeys.attractions(search),
    queryFn: async () => {
      const url = search
        ? `${API_ROUTES.ATTRACTIONS}?search=${encodeURIComponent(search)}`
        : API_ROUTES.ATTRACTIONS;
      const { data } = await apiClient.get<Attraction[]>(url);
      return data;
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnReconnect: false,
    placeholderData: keepPreviousData,
  });
}

/** Bogie/seat matrix with server-computed sequential locking. */
export function useAttractionSeats(attractionId: string | null) {
  return useQuery({
    queryKey: posKeys.seats(attractionId ?? ""),
    enabled: !!attractionId,
    // Seats change as others book; keep this fresh.
    staleTime: 5_000,
    queryFn: async () => {
      const { data } = await apiClient.get<BogieView[]>(
        `${API_ROUTES.ATTRACTIONS}/${attractionId}/seats`,
      );
      return data;
    },
  });
}

/** Debounced customer lookup (the caller debounces the `search` value). */
export function useCustomerSearch(search: string) {
  return useQuery({
    queryKey: posKeys.customers(search),
    queryFn: async () => {
      const { data } = await apiClient.get<Customer[]>(
        `${API_ROUTES.CUSTOMERS}?search=${encodeURIComponent(search)}`,
      );
      return data;
    },
  });
}

/** Create a new customer (Add New Customer). */
export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCustomerInput) => {
      const { data } = await apiClient.post<Customer>(
        API_ROUTES.CUSTOMERS,
        input,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

/** Finalize a booking (atomic checkout). */
export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      const { data } = await apiClient.post<unknown>(
        API_ROUTES.BOOKINGS,
        input,
      );
      return data;
    },
    onSuccess: () => {
      // Seats may now be occupied — refresh any seat matrices.
      qc.invalidateQueries({ queryKey: ["attraction-seats"] });
    },
  });
}
