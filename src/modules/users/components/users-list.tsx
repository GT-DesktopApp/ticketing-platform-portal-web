"use client";

import { KeyRound, Pencil, Plus, Search, Trash2, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/modules/attractions/components/confirm-dialog";
import { StatusSwitch } from "@/modules/users/components/status-switch";
import {
  useDeleteUser,
  useRoleOptions,
  useToggleUserStatus,
  useUsers,
} from "@/modules/users/hooks/use-users-admin";
import type { ManagedUser } from "@/modules/users/types";

/**
 * The Users tab — a searchable, role-filterable table of users with a per-row
 * Status toggle and Actions (reset password, edit, delete). Shows the empty
 * state (illustration + "Add User") when there are no users at all.
 */
export function UsersList({
  onAdd,
  onEdit,
  onResetPassword,
  onToast,
}: {
  onAdd: () => void;
  onEdit: (user: ManagedUser) => void;
  onResetPassword: (user: ManagedUser) => void;
  onToast: (message: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [roleId, setRoleId] = useState("");
  const [pendingDelete, setPendingDelete] = useState<ManagedUser | null>(null);

  const { data: users = [], isLoading, error } = useUsers();
  const { data: roleOptions = [] } = useRoleOptions();
  const toggleStatus = useToggleUserStatus();
  const deleteUser = useDeleteUser();

  // Client-side filter (search + role) so typing stays instant.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesText =
        !q ||
        (u.name ?? "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.mobile ?? "").toLowerCase().includes(q) ||
        (u.username ?? "").toLowerCase().includes(q);
      const matchesRole = !roleId || u.role?.id === roleId;
      return matchesText && matchesRole;
    });
  }, [users, search, roleId]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      const res = await deleteUser.mutateAsync(pendingDelete.id);
      onToast(
        res.softDeleted
          ? `“${pendingDelete.name ?? pendingDelete.email}” was deactivated (has history).`
          : `“${pendingDelete.name ?? pendingDelete.email}” deleted.`,
      );
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Failed to delete user.");
    } finally {
      setPendingDelete(null);
    }
  }

  function onToggle(u: ManagedUser) {
    toggleStatus
      .mutateAsync({ id: u.id, isActive: !u.isActive })
      .catch((err) =>
        onToast(err instanceof Error ? err.message : "Failed to update status."),
      );
  }

  const hasAnyUsers = users.length > 0;

  // Empty state (no users at all).
  if (!isLoading && !error && !hasAnyUsers) {
    return (
      <EmptyState onAdd={onAdd} />
    );
  }

  return (
    <div className="rounded-[16px] border border-[var(--login-border)] bg-white p-5 shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute top-2.5 left-3 size-4 text-[var(--login-text-muted)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Name, Email or Mobile……"
              className="h-10 pl-9"
            />
          </div>
          <select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="h-10 rounded-md border border-[var(--login-border)] bg-white px-3 text-[14px] text-[var(--pos-navy)] outline-none focus:border-[var(--pos-amber)] sm:w-44"
          >
            <option value="">All Roles</option>
            {roleOptions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center justify-center gap-2 rounded-md bg-[var(--pos-amber)] px-4 py-2.5 text-[14px] font-semibold text-[#1c1407] transition-colors hover:bg-[var(--pos-amber-600)]"
        >
          <Plus className="size-4" /> Add User
        </button>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--login-border)]">
        <table className="w-full min-w-[820px] text-left text-[13px]">
          <thead className="bg-[var(--login-hover-bg)] text-[var(--login-text-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">S.No.</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Mobile Number</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[var(--login-text-muted)]">
                  Loading users…
                </td>
              </tr>
            )}
            {!isLoading && error && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[#DC2626]">
                  Couldn’t load users. {error.message}
                </td>
              </tr>
            )}
            {!isLoading && !error && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[var(--login-text-muted)]">
                  No users match your search.
                </td>
              </tr>
            )}
            {!isLoading &&
              !error &&
              filtered.map((u, i) => (
                <tr
                  key={u.id}
                  className="border-t border-[var(--login-border)] hover:bg-[var(--login-hover-bg)]/40"
                >
                  <td className="px-4 py-3 text-[var(--login-text-muted)]">
                    {i + 1}.
                  </td>
                  <td className="px-4 py-3 font-medium text-[var(--pos-navy)]">
                    {u.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.mobile ?? "—"}</td>
                  <td className="px-4 py-3">{u.role?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusSwitch
                      checked={u.isActive}
                      disabled={toggleStatus.isPending}
                      onChange={() => onToggle(u)}
                      label={`Toggle ${u.name ?? u.email}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <IconBtn
                        title="Reset password"
                        onClick={() => onResetPassword(u)}
                      >
                        <KeyRound className="size-[18px]" />
                      </IconBtn>
                      <IconBtn title="Edit" onClick={() => onEdit(u)}>
                        <Pencil className="size-[18px]" />
                      </IconBtn>
                      <IconBtn
                        title="Delete"
                        danger
                        onClick={() => setPendingDelete(u)}
                      >
                        <Trash2 className="size-[18px]" />
                      </IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Delete user?"
        message={
          pendingDelete
            ? `“${pendingDelete.name ?? pendingDelete.email}” will lose access. If they have booking or audit history, they’ll be deactivated instead.`
            : ""
        }
        loading={deleteUser.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function IconBtn({
  children,
  title,
  danger = false,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`flex size-8 items-center justify-center rounded-md transition-colors ${
        danger
          ? "text-[#DC2626] hover:bg-[#DC2626]/10"
          : "text-[var(--pos-navy)] hover:bg-[var(--login-hover-bg)]"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[16px] border border-[var(--login-border)] bg-white p-8 text-center shadow-sm">
      <div className="flex size-24 items-center justify-center rounded-full bg-[var(--pos-amber-soft)]">
        <UserPlus className="size-12 text-[var(--pos-navy)]" strokeWidth={1.5} />
      </div>
      <h2 className="mt-5 text-[22px] font-bold text-[var(--pos-navy)]">
        No Users Found
      </h2>
      <p className="mt-1 max-w-sm text-[14px] text-[var(--login-text-muted)]">
        You haven’t added any users yet. Click the button below to add your first
        user
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-6 flex items-center gap-2 rounded-md bg-[var(--pos-navy)] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[var(--pos-navy-700)]"
      >
        <Plus className="size-4" /> Add User
      </button>
    </div>
  );
}
