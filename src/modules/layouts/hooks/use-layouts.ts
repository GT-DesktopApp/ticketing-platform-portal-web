"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/constants/routes";
import type { LayoutInput } from "@/modules/layouts/schemas";
import type { LayoutOption, ManagedLayout } from "@/modules/layouts/types";

/** Query keys for the Layout Management module. */
export const layoutKeys = {
  list: (search?: string) => ["seat-layouts", search ?? ""] as const,
  detail: (id: string) => ["seat-layout", id] as const,
  options: () => ["seat-layout-options"] as const,
};

/** All seat layouts for Layout Management. */
export function useLayouts(search?: string) {
  return useQuery({
    queryKey: layoutKeys.list(search),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const url = search
        ? `${API_ROUTES.LAYOUTS}?search=${encodeURIComponent(search)}`
        : API_ROUTES.LAYOUTS;
      const { data } = await apiClient.get<ManagedLayout[]>(url);
      return data;
    },
  });
}

/** One layout for the editor. */
export function useLayout(id: string | null) {
  return useQuery({
    queryKey: layoutKeys.detail(id ?? ""),
    enabled: !!id,
    queryFn: async () => {
      const { data } = await apiClient.get<ManagedLayout>(
        `${API_ROUTES.LAYOUTS}/${id}`,
      );
      return data;
    },
  });
}

/** Active saved layouts for the Grid Style dropdown. */
export function useLayoutOptions() {
  return useQuery({
    queryKey: layoutKeys.options(),
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data } = await apiClient.get<LayoutOption[]>(
        API_ROUTES.LAYOUT_OPTIONS,
      );
      return data;
    },
  });
}

function useInvalidateLayouts() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["seat-layouts"] });
    qc.invalidateQueries({ queryKey: ["seat-layout-options"] });
  };
}

export function useCreateLayout() {
  const invalidate = useInvalidateLayouts();
  return useMutation({
    mutationFn: async (input: LayoutInput) => {
      const { data } = await apiClient.post<ManagedLayout>(
        API_ROUTES.LAYOUTS,
        input,
      );
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateLayout() {
  const invalidate = useInvalidateLayouts();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: LayoutInput }) => {
      const { data } = await apiClient.put<ManagedLayout>(
        `${API_ROUTES.LAYOUTS}/${id}`,
        input,
      );
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useToggleLayoutStatus() {
  const invalidate = useInvalidateLayouts();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data } = await apiClient.patch<ManagedLayout>(
        `${API_ROUTES.LAYOUTS}/${id}/status`,
        { isActive },
      );
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteLayout() {
  const invalidate = useInvalidateLayouts();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.del<{ id: string; softDeleted: boolean }>(
        `${API_ROUTES.LAYOUTS}/${id}`,
      );
      return data;
    },
    onSuccess: invalidate,
  });
}
