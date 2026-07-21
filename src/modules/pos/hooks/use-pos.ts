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
  CategoryType,
  Customer,
  SeatAvailability,
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
 * Caching strategy — load once, but ALWAYS reflect Attraction-Management edits:
 *   • staleTime 5m — within a normal session the list is served from cache and
 *     the "Loading…" state doesn't reflash on navigation.
 *   • refetchOnMount defaults to `true` — a query only refetches on mount when
 *     it is STALE. Attraction-Management mutations call
 *     `invalidateQueries(["attractions"])`, which marks this query stale, so
 *     returning to the booking screen after an add/edit/delete triggers exactly
 *     one refetch and the panel shows the latest image/price/availability.
 *   • placeholderData keepPreviousData — during that refetch the old list stays
 *     visible instead of blanking.
 * The key is `["attractions", ""]`, and management invalidates `["attractions"]`
 * (a prefix match), so a deleted attraction disappears here too on next mount.
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
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnReconnect: false,
    placeholderData: keepPreviousData,
  });
}

/**
 * Layout-derived seat availability for the inline Seat Allocation grid: the
 * attraction's seat-layout geometry plus the seat numbers already booked. Kept
 * fresh (staleTime 5s) so occupancy reflects concurrent bookings.
 */
export function useAttractionSeats(attractionId: string | null) {
  return useQuery({
    queryKey: posKeys.seats(attractionId ?? ""),
    enabled: !!attractionId,
    staleTime: 5_000,
    queryFn: async () => {
      const { data } = await apiClient.get<SeatAvailability>(
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
