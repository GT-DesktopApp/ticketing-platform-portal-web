"use client";

import {
  ArrowLeft,
  LayoutGrid,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/modules/attractions/components/confirm-dialog";
import { LayoutForm } from "@/modules/layouts/components/layout-form";
import {
  useDeleteLayout,
  useLayouts,
  useToggleLayoutStatus,
} from "@/modules/layouts/hooks/use-layouts";
import type { ManagedLayout } from "@/modules/layouts/types";
import { StatusSwitch } from "@/modules/users/components/status-switch";

type View = { kind: "list" } | { kind: "form"; layout: ManagedLayout | null };

const POSITION_LABEL: Record<string, string> = {
  LEFT: "Left",
  CENTRE: "Centre",
  RIGHT: "Right",
  DUAL: "Dual",
  NONE: "No aisle",
};

/**
 * Layout Management — the standalone module for reusable seat layouts. List
 * (search, status toggle, edit/delete) + full-page Add/Edit form. Custom grids
 * created here appear in the attraction Seat Allocation dropdown automatically.
 */
export function LayoutManagement() {
  const [view, setView] = useState<View>({ kind: "list" });
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ManagedLayout | null>(null);

  const { data: layouts = [], isLoading, error } = useLayouts();
  const toggleStatus = useToggleLayoutStatus();
  const deleteLayout = useDeleteLayout();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return layouts;
    return layouts.filter((l) => l.name.toLowerCase().includes(q));
  }, [layouts, search]);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      const res = await deleteLayout.mutateAsync(pendingDelete.id);
      showToast(
        res.softDeleted
          ? `“${pendingDelete.name}” is in use, so it was deactivated.`
          : `“${pendingDelete.name}” deleted.`,
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete layout.");
    } finally {
      setPendingDelete(null);
    }
  }

  function onToggle(l: ManagedLayout) {
    toggleStatus
      .mutateAsync({ id: l.id, isActive: !l.isActive })
      .catch((err) =>
        showToast(err instanceof Error ? err.message : "Failed to update."),
      );
  }

  // ── Form view ──────────────────────────────────────────────────────────────
  if (view.kind === "form") {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setView({ kind: "list" })}
          className="flex w-fit items-center gap-2 text-[16px] font-bold text-[var(--pos-navy)] transition-colors hover:text-[var(--pos-amber-600)]"
        >
          <ArrowLeft className="size-5" />{" "}
          {view.layout ? "Edit Layout" : "Add Layout"}
        </button>
        <LayoutForm
          layout={view.layout}
          onCancel={() => setView({ kind: "list" })}
          onSaved={(m) => {
            showToast(m);
            setView({ kind: "list" });
          }}
        />
        {toast && <Toast message={toast} />}
      </div>
    );
  }

  // Empty state.
  if (!isLoading && !error && layouts.length === 0) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[16px] border border-[var(--login-border)] bg-white p-8 text-center shadow-sm">
        <div className="flex size-24 items-center justify-center rounded-full bg-[var(--pos-blue-soft)]">
          <LayoutGrid className="size-12 text-[var(--pos-navy)]" strokeWidth={1.5} />
        </div>
        <h2 className="mt-5 text-[22px] font-bold text-[var(--pos-navy)]">
          No Layouts Created Yet
        </h2>
        <p className="mt-1 max-w-sm text-[14px] text-[var(--login-text-muted)]">
          Create reusable seat layouts to attach to seated attractions.
        </p>
        <button
          type="button"
          onClick={() => setView({ kind: "form", layout: null })}
          className="mt-6 flex items-center gap-2 rounded-md bg-[var(--pos-navy)] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[var(--pos-navy-700)]"
        >
          <Plus className="size-4" /> Add Layout
        </button>
        {toast && <Toast message={toast} />}
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <div className="rounded-[16px] border border-[var(--login-border)] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute top-2.5 left-3 size-4 text-[var(--login-text-muted)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search layout……"
            className="h-10 pl-9"
          />
        </div>
        <button
          type="button"
          onClick={() => setView({ kind: "form", layout: null })}
          className="flex items-center justify-center gap-2 rounded-md bg-[var(--pos-amber)] px-4 py-2.5 text-[14px] font-semibold text-[#1c1407] transition-colors hover:bg-[var(--pos-amber-600)]"
        >
          <Plus className="size-4" /> Add Layout
        </button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--login-border)]">
        <table className="w-full min-w-[760px] text-left text-[13px]">
          <thead className="bg-[var(--login-hover-bg)] text-[var(--login-text-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">S.No.</th>
              <th className="px-4 py-3 font-medium">Layout</th>
              <th className="px-4 py-3 font-medium">Grid</th>
              <th className="px-4 py-3 font-medium">Total Seats</th>
              <th className="px-4 py-3 font-medium">Aisle</th>
              <th className="px-4 py-3 font-medium">Used By</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[var(--login-text-muted)]">
                  Loading layouts…
                </td>
              </tr>
            )}
            {!isLoading && error && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[#DC2626]">
                  Couldn’t load layouts. {error.message}
                </td>
              </tr>
            )}
            {!isLoading && !error && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[var(--login-text-muted)]">
                  No layouts match your search.
                </td>
              </tr>
            )}
            {!isLoading &&
              !error &&
              filtered.map((l, i) => (
                <tr
                  key={l.id}
                  className="border-t border-[var(--login-border)] hover:bg-[var(--login-hover-bg)]/40"
                >
                  <td className="px-4 py-3 text-[var(--login-text-muted)]">
                    {i + 1}.
                  </td>
                  <td className="px-4 py-3 font-medium text-[var(--pos-navy)]">
                    {l.name}
                    {l.isCustom && (
                      <span className="ml-2 rounded-full bg-[var(--pos-amber-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--pos-amber-600)]">
                        Custom
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {l.rows} × {l.columnsLeft + l.columnsRight}
                  </td>
                  <td className="px-4 py-3">{l.totalSeats}</td>
                  <td className="px-4 py-3">
                    {POSITION_LABEL[l.aislePosition] ?? l.aislePosition}
                  </td>
                  <td className="px-4 py-3">{l.attractionsUsing}</td>
                  <td className="px-4 py-3">
                    <StatusSwitch
                      checked={l.isActive}
                      disabled={toggleStatus.isPending}
                      onChange={() => onToggle(l)}
                      label={`Toggle ${l.name}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        title="Edit"
                        aria-label="Edit"
                        onClick={() => setView({ kind: "form", layout: l })}
                        className="flex size-8 items-center justify-center rounded-md text-[var(--pos-navy)] transition-colors hover:bg-[var(--login-hover-bg)]"
                      >
                        <Pencil className="size-[18px]" />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        aria-label="Delete"
                        onClick={() => setPendingDelete(l)}
                        className="flex size-8 items-center justify-center rounded-md text-[#DC2626] transition-colors hover:bg-[#DC2626]/10"
                      >
                        <Trash2 className="size-[18px]" />
                      </button>
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
        title="Delete layout?"
        message={
          pendingDelete
            ? `“${pendingDelete.name}” will be removed. If any attraction uses it, it’ll be deactivated instead.`
            : ""
        }
        loading={deleteLayout.isPending}
        onConfirm={confirmDelete}
      />

      {toast && <Toast message={toast} />}
    </div>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed right-6 bottom-6 z-50 rounded-lg bg-[var(--pos-navy)] px-4 py-3 text-[13px] font-medium text-white shadow-lg">
      {message}
    </div>
  );
}
