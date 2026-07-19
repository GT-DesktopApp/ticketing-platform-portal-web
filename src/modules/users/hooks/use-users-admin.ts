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
  CreateUserInput,
  ResetPasswordInput,
  RoleInput,
  UpdateUserInput,
} from "@/modules/users/schemas";
import type {
  ManagedRole,
  ManagedUser,
  RoleOption,
} from "@/modules/users/types";

/** Query keys for the User Management module. */
export const userKeys = {
  users: (search?: string, roleId?: string) =>
    ["um-users", search ?? "", roleId ?? ""] as const,
  user: (id: string) => ["um-user", id] as const,
  roles: (search?: string) => ["um-roles", search ?? ""] as const,
  role: (id: string) => ["um-role", id] as const,
  roleOptions: () => ["um-role-options"] as const,
};

// ── Users ────────────────────────────────────────────────────────────────────

export function useUsers(search?: string, roleId?: string) {
  return useQuery({
    queryKey: userKeys.users(search, roleId),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleId) params.set("roleId", roleId);
      const qs = params.toString();
      const { data } = await apiClient.get<ManagedUser[]>(
        qs ? `${API_ROUTES.USERS}?${qs}` : API_ROUTES.USERS,
      );
      return data;
    },
  });
}

export function useUser(id: string | null) {
  return useQuery({
    queryKey: userKeys.user(id ?? ""),
    enabled: !!id,
    queryFn: async () => {
      const { data } = await apiClient.get<ManagedUser>(
        `${API_ROUTES.USERS}/${id}`,
      );
      return data;
    },
  });
}

function useInvalidateUsers() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["um-users"] });
}

export function useCreateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      const { data } = await apiClient.post<ManagedUser>(
        API_ROUTES.USERS,
        input,
      );
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateUserInput }) => {
      const { data } = await apiClient.put<ManagedUser>(
        `${API_ROUTES.USERS}/${id}`,
        input,
      );
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useToggleUserStatus() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data } = await apiClient.patch<ManagedUser>(
        `${API_ROUTES.USERS}/${id}/status`,
        { isActive },
      );
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.del<{ id: string; softDeleted: boolean }>(
        `${API_ROUTES.USERS}/${id}`,
      );
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: ResetPasswordInput;
    }) => {
      const { data } = await apiClient.post<{ id: string }>(
        `${API_ROUTES.USERS}/${id}/reset-password`,
        input,
      );
      return data;
    },
  });
}

// ── Roles ────────────────────────────────────────────────────────────────────

export function useRoles(search?: string) {
  return useQuery({
    queryKey: userKeys.roles(search),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const url = search
        ? `${API_ROUTES.ROLES}?search=${encodeURIComponent(search)}`
        : API_ROUTES.ROLES;
      const { data } = await apiClient.get<ManagedRole[]>(url);
      return data;
    },
  });
}

export function useRole(id: string | null) {
  return useQuery({
    queryKey: userKeys.role(id ?? ""),
    enabled: !!id,
    queryFn: async () => {
      const { data } = await apiClient.get<ManagedRole>(
        `${API_ROUTES.ROLES}/${id}`,
      );
      return data;
    },
  });
}

/** Role options for the user form dropdown + Users list "All Roles" filter. */
export function useRoleOptions() {
  return useQuery({
    queryKey: userKeys.roleOptions(),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await apiClient.get<RoleOption[]>(
        API_ROUTES.ROLE_OPTIONS,
      );
      return data;
    },
  });
}

function useInvalidateRoles() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["um-roles"] });
    qc.invalidateQueries({ queryKey: ["um-role-options"] });
    // A role change can affect which role a user shows under.
    qc.invalidateQueries({ queryKey: ["um-users"] });
  };
}

export function useCreateRole() {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: async (input: RoleInput) => {
      const { data } = await apiClient.post<ManagedRole>(
        API_ROUTES.ROLES,
        input,
      );
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateRole() {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: RoleInput }) => {
      const { data } = await apiClient.put<ManagedRole>(
        `${API_ROUTES.ROLES}/${id}`,
        input,
      );
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useToggleRoleStatus() {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data } = await apiClient.patch<ManagedRole>(
        `${API_ROUTES.ROLES}/${id}/status`,
        { isActive },
      );
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteRole() {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.del<{ id: string; softDeleted: boolean }>(
        `${API_ROUTES.ROLES}/${id}`,
      );
      return data;
    },
    onSuccess: invalidate,
  });
}
