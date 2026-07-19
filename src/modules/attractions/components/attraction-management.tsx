"use client";

import { ArrowLeft, Plus, Search, Upload } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { AttractionCard } from "@/modules/attractions/components/attraction-card";
import { AttractionForm } from "@/modules/attractions/components/attraction-form";
import { BulkUpload } from "@/modules/attractions/components/bulk-upload";
import { ConfirmDialog } from "@/modules/attractions/components/confirm-dialog";
import {
  useDeleteAttraction,
  useManagedAttractions,
} from "@/modules/attractions/hooks/use-attractions-admin";
import type { ManagedAttraction } from "@/modules/attractions/types";
import { LayoutForm } from "@/modules/layouts/components/layout-form";
import { useLayout } from "@/modules/layouts/hooks/use-layouts";

type View =
  | { kind: "list" }
  | { kind: "form"; attraction: ManagedAttraction | null }
  | { kind: "seating"; attraction: ManagedAttraction }
  | { kind: "bulk" };

/**
 * Attraction Management — the top-level screen. It owns a small view state
 * machine: the list grid, the add/edit form, and the bulk-upload flow. The list
 * data is cached (see the hook), so returning from the form/bulk views does not
 * re-flash a loading state. Fully responsive across all breakpoints.
 */
export function AttractionManagement() {
  const [view, setView] = useState<View>({ kind: "list" });
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ManagedAttraction | null>(
    null,
  );

  const { data: attractions = [], isLoading, error } = useManagedAttractions();
  const deleteMut = useDeleteAttraction();

  // Client-side filter keeps the grid responsive without refetching on keypress.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return attractions;
    return attractions.filter(
      (a) =>
        a.name.toLowerCase().includes(q) || a.type.toLowerCase().includes(q),
    );
  }, [attractions, search]);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteMut.mutateAsync(pendingDelete.id);
      showToast(`“${pendingDelete.name}” deleted.`);
    } finally {
      setPendingDelete(null);
    }
  }

  // ── Form view (add / edit) ────────────────────────────────────────────────
  if (view.kind === "form") {
    return (
      <div className="flex flex-col gap-4">
        <BackHeader
          title={view.attraction ? "Edit Attraction" : "Add Attraction"}
          onBack={() => setView({ kind: "list" })}
        />
        <AttractionForm
          attraction={view.attraction}
          onCancel={() => setView({ kind: "list" })}
          onSaved={() => {
            showToast(
              view.attraction ? "Attraction updated." : "Attraction created.",
            );
            setView({ kind: "list" });
          }}
        />
        {toast && <Toast message={toast} />}
      </div>
    );
  }

  // ── Seating (edit layout) view ────────────────────────────────────────────
  if (view.kind === "seating") {
    return (
      <div className="flex flex-col gap-4">
        <BackHeader
          title={`Edit Layout — ${view.attraction.name}`}
          onBack={() => setView({ kind: "list" })}
        />
        <SeatingEditor
          attraction={view.attraction}
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

  // ── Bulk upload view ──────────────────────────────────────────────────────
  if (view.kind === "bulk") {
    return (
      <div className="flex flex-col gap-4">
        <BackHeader
          title="Bulk Upload"
          onBack={() => setView({ kind: "list" })}
        />
        <BulkUpload
          onCancel={() => setView({ kind: "list" })}
          onImported={({ created, updated }) => {
            showToast(
              `Imported successfully — ${created} created, ${updated} updated.`,
            );
            setView({ kind: "list" });
          }}
        />
        {toast && <Toast message={toast} />}
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <div className="rounded-[16px] border border-[var(--login-border)] bg-white p-5 shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute top-2.5 left-3 size-4 text-[var(--login-text-muted)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Attraction………"
            className="h-10 pl-9"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView({ kind: "form", attraction: null })}
            className="flex items-center gap-2 rounded-md bg-[var(--pos-navy)] px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[var(--pos-navy-700)]"
          >
            <Plus className="size-4" /> Add Attraction
          </button>
          <button
            type="button"
            onClick={() => setView({ kind: "bulk" })}
            className="flex items-center gap-2 rounded-md border border-[var(--login-border)] px-4 py-2.5 text-[14px] font-semibold text-[var(--pos-navy)] transition-colors hover:bg-[var(--login-hover-bg)]"
          >
            <Upload className="size-4" /> Bulk Upload
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="mt-5">
        {isLoading ? (
          <p className="py-16 text-center text-sm text-[var(--login-text-muted)]">
            Loading attractions…
          </p>
        ) : error ? (
          <div className="rounded-lg border border-[#DC2626]/30 bg-[#DC2626]/5 px-3 py-6 text-center text-sm text-[#DC2626]">
            Couldn’t load attractions.
            <span className="mt-1 block text-xs opacity-80">
              {error.message}
            </span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-[var(--login-text-muted)]">
              {search
                ? "No attractions match your search."
                : "No attractions yet. Add one to get started."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((a) => (
              <AttractionCard
                key={a.id}
                attraction={a}
                onEdit={() => setView({ kind: "form", attraction: a })}
                onSeating={() => setView({ kind: "seating", attraction: a })}
                onDelete={() => setPendingDelete(a)}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Delete attraction?"
        message={
          pendingDelete
            ? `“${pendingDelete.name}” and its pricing will be removed from booking. This can be recreated later.`
            : ""
        }
        loading={deleteMut.isPending}
        onConfirm={confirmDelete}
      />

      {toast && <Toast message={toast} />}
    </div>
  );
}

/** A back-arrow sub-header used above the form / bulk views. */
function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="flex w-fit items-center gap-2 text-[14px] font-medium text-[var(--pos-navy)] transition-colors hover:text-[var(--pos-amber-600)]"
    >
      <ArrowLeft className="size-4" /> {title}
    </button>
  );
}

/** A transient bottom-right toast. */
function Toast({ message }: { message: string }) {
  return (
    <div className="fixed right-6 bottom-6 z-50 rounded-lg bg-[var(--pos-navy)] px-4 py-3 text-[13px] font-medium text-white shadow-lg">
      {message}
    </div>
  );
}

/**
 * Loads the attraction's linked seat layout and renders the layout editor. The
 * "Seating" button jumps straight here to edit an existing seated attraction's
 * layout.
 */
function SeatingEditor({
  attraction,
  onCancel,
  onSaved,
}: {
  attraction: ManagedAttraction;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const { data: layout, isLoading } = useLayout(attraction.seatLayoutId);

  if (isLoading) {
    return (
      <p className="rounded-[16px] border border-[var(--login-border)] bg-white p-10 text-center text-sm text-[var(--login-text-muted)] shadow-sm">
        Loading seat layout…
      </p>
    );
  }

  return (
    <LayoutForm layout={layout ?? null} onCancel={onCancel} onSaved={onSaved} />
  );
}
