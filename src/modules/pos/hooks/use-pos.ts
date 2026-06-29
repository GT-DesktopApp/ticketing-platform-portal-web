"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/constants/routes";
import type { CreateBookingInput, CreateCustomerInput } from "@/modules/pos/schemas/booking.schema";
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
      const { data } = await apiClient.get<CategoryType[]>("/api/category-types");
      return data;
    },
  });
}

/** All active attractions + their priced categories (booking screen). */
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
