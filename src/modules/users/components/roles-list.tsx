"use client";

import { Pencil, Plus, Search, ShieldPlus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/modules/attractions/components/confirm-dialog";
import { StatusSwitch } from "@/modules/users/components/status-switch";
import {
  useDeleteRole,
  useRoles,
  useToggleRoleStatus,
} from "@/modules/users/hooks/use-users-admin";
import type { ManagedRole } from "@/modules/users/types";

/**
 * The Roles tab — a searchable table of roles with Description, Assigned Users,
 * a Status toggle, and Actions (edit, delete). System roles cannot be deleted.
 * Shows the empty state when no roles exist at all.
 */
export function RolesList({
  onAdd,
  onEdit,
  onToast,
}: {
  onAdd: () => void;
  onEdit: (role: ManagedRole) => void;
  onToast: (message: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<ManagedRole | null>(null);

  const { data: roles = [], isLoading, error } = useRoles();
  const toggleStatus = useToggleRoleStatus();
  const deleteRole = useDeleteRole();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q),
    );
  }, [roles, search]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      const res = await deleteRole.mutateAsync(pendingDelete.id);
      onToast(
        res.softDeleted
          ? `“${pendingDelete.name}” is assigned to users, so it was deactivated.`
          : `“${pendingDelete.name}” deleted.`,
      );
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Failed to delete role.");
    } finally {
      setPendingDelete(null);
    }
  }

  function onToggle(r: ManagedRole) {
    toggleStatus
      .mutateAsync({ id: r.id, isActive: !r.isActive })
      .catch((err) =>
        onToast(err instanceof Error ? err.message : "Failed to update status."),
      );
  }

  if (!isLoading && !error && roles.length === 0) {
    return <EmptyState onAdd={onAdd} />;
  }

  return (
    <div className="rounded-[16px] border border-[var(--login-border)] bg-white p-5 shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute top-2.5 left-3 size-4 text-[var(--login-text-muted)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search role……"
            className="h-10 pl-9"
          />
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center justify-center gap-2 rounded-md bg-[var(--pos-amber)] px-4 py-2.5 text-[14px] font-semibold text-[#1c1407] transition-colors hover:bg-[var(--pos-amber-600)]"
        >
          <Plus className="size-4" /> Add Role
        </button>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--login-border)]">
        <table className="w-full min-w-[820px] text-left text-[13px]">
          <thead className="bg-[var(--login-hover-bg)] text-[var(--login-text-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">S.No.</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Assigned Users</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--login-text-muted)]">
                  Loading roles…
                </td>
              </tr>
            )}
            {!isLoading && error && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[#DC2626]">
                  Couldn’t load roles. {error.message}
                </td>
              </tr>
            )}
            {!isLoading && !error && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--login-text-muted)]">
                  No roles match your search.
                </td>
              </tr>
            )}
            {!isLoading &&
              !error &&
              filtered.map((r, i) => (
                <tr
                  key={r.id}
                  className="border-t border-[var(--login-border)] align-top hover:bg-[var(--login-hover-bg)]/40"
                >
                  <td className="px-4 py-3 text-[var(--login-text-muted)]">
                    {i + 1}.
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-[var(--pos-navy)]">
                      {r.name}
                    </span>
                    {r.isSystem && (
                      <span className="ml-2 rounded-full bg-[var(--pos-blue-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--pos-navy)]">
                        System
                      </span>
                    )}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-[var(--login-text-muted)]">
                    {r.description ?? "—"}
                  </td>
                  <td className="px-4 py-3">{r.assignedUsers}</td>
                  <td className="px-4 py-3">
                    <StatusSwitch
                      checked={r.isActive}
                      disabled={toggleStatus.isPending}
                      onChange={() => onToggle(r)}
                      label={`Toggle ${r.name}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <IconBtn title="Edit" onClick={() => onEdit(r)}>
                        <Pencil className="size-[18px]" />
                      </IconBtn>
                      <IconBtn
                        title={
                          r.isSystem
                            ? "System roles can't be deleted"
                            : "Delete"
                        }
                        danger
                        disabled={r.isSystem}
                        onClick={() => setPendingDelete(r)}
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
        title="Delete role?"
        message={
          pendingDelete
            ? `“${pendingDelete.name}” will be removed. If it’s assigned to any users, it’ll be deactivated instead.`
            : ""
        }
        loading={deleteRole.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function IconBtn({
  children,
  title,
  danger = false,
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex size-8 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
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
      <div className="flex size-24 items-center justify-center rounded-full bg-[var(--pos-blue-soft)]">
        <ShieldPlus className="size-12 text-[var(--pos-navy)]" strokeWidth={1.5} />
      </div>
      <h2 className="mt-5 text-[22px] font-bold text-[var(--pos-navy)]">
        No Roles Created Yet
      </h2>
      <p className="mt-1 max-w-sm text-[14px] text-[var(--login-text-muted)]">
        Create custom roles to define different access levels and permissions for
        your team members.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-6 flex items-center gap-2 rounded-md bg-[var(--pos-navy)] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[var(--pos-navy-700)]"
      >
        <Plus className="size-4" /> Add Role
      </button>
    </div>
  );
}
