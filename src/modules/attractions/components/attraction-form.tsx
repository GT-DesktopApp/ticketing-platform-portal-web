"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { CategoryPricingCard } from "@/modules/attractions/components/category-pricing-card";
import {
  useCreateAttraction,
  useUpdateAttraction,
} from "@/modules/attractions/hooks/use-attractions-admin";
import {
  type AttractionInput,
  attractionInputSchema,
} from "@/modules/attractions/schemas";
import type { ManagedAttraction } from "@/modules/attractions/types";
import { ImageUpload } from "@/modules/pos/components/booking/image-upload";

/** Form-local draft of a category (all fields are strings while editing). */
export interface CategoryDraft {
  id: string | null;
  /** Stable key for React lists (rows have no id until saved). */
  key: string;
  name: string;
  basePrice: string;
  futurePrice: string;
  effectiveFrom: string;
  image: string | null;
}

/** The default four visitor categories shown when adding a new attraction. */
const DEFAULT_CATEGORY_NAMES = ["Adult", "Child", "Student", "Foreigner"];

let keySeq = 0;
function newKey(): string {
  keySeq += 1;
  return `cat-${keySeq}`;
}

function emptyDraft(name = ""): CategoryDraft {
  return {
    id: null,
    key: newKey(),
    name,
    basePrice: "",
    futurePrice: "",
    effectiveFrom: "",
    image: null,
  };
}

function toDraft(c: ManagedAttraction["categories"][number]): CategoryDraft {
  return {
    id: c.id,
    key: newKey(),
    name: c.name,
    basePrice: String(c.basePrice),
    futurePrice: c.futurePrice != null ? String(c.futurePrice) : "",
    effectiveFrom: c.effectiveFrom ?? "",
    image: c.image,
  };
}

type CategoryErrors = Partial<
  Record<"name" | "basePrice" | "effectiveFrom", string>
>;

/**
 * The Add / Edit Attraction form (Attraction_screen). Two-column top row —
 * Basic Information (name, description with 0/500 counter, drag-drop image) +
 * Status (Active / Inactive) — then the "Visitor Categories & Pricing" grid of
 * per-category cards with an "Add Visitor Category" tile, and a sticky footer
 * with Cancel / Save Attraction. Fully responsive: the top row stacks under
 * `lg`, and the category grid reflows from 4 columns down to 1.
 */
export function AttractionForm({
  attraction,
  onCancel,
  onSaved,
}: {
  /** When present, the form edits this attraction; otherwise it creates one. */
  attraction: ManagedAttraction | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!attraction;
  const createMut = useCreateAttraction();
  const updateMut = useUpdateAttraction();
  const saving = createMut.isPending || updateMut.isPending;

  const [name, setName] = useState(attraction?.name ?? "");
  const [description, setDescription] = useState(attraction?.description ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(
    attraction?.imageUrl ?? null,
  );
  const [isActive, setIsActive] = useState(attraction?.isActive ?? true);
  const [categories, setCategories] = useState<CategoryDraft[]>(
    attraction && attraction.categories.length
      ? attraction.categories.map(toDraft)
      : DEFAULT_CATEGORY_NAMES.map((n) => emptyDraft(n)),
  );

  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    imageUrl?: string;
    categories?: string;
    rows: Record<string, CategoryErrors>;
  }>({ rows: {} });
  const [serverError, setServerError] = useState<string | null>(null);

  const descCount = description.length;

  function patchCategory(key: string, patch: Partial<CategoryDraft>) {
    setCategories((prev) =>
      prev.map((c) => (c.key === key ? { ...c, ...patch } : c)),
    );
  }
  function addCategory() {
    setCategories((prev) => [...prev, emptyDraft()]);
  }
  function removeCategory(key: string) {
    setCategories((prev) => prev.filter((c) => c.key !== key));
  }

  /** Build the API input from the draft, or null if client validation fails. */
  const buildInput = (): AttractionInput | null => {
    const rows: Record<string, CategoryErrors> = {};
    const next: {
      name?: string;
      description?: string;
      imageUrl?: string;
      categories?: string;
      rows: Record<string, CategoryErrors>;
    } = { rows };

    if (!name.trim()) next.name = "Attraction name is required";
    if (!description.trim())
      next.description = "Description is required";
    else if (description.length > 500)
      next.description = "Description must be 500 characters or fewer";
    if (!imageUrl) next.imageUrl = "Attraction image is required";
    if (categories.length === 0)
      next.categories = "Add at least one visitor category";

    const apiCategories = categories.map((c) => {
      const rowErr: CategoryErrors = {};
      if (!c.name.trim()) rowErr.name = "Required";
      const base = Number(c.basePrice);
      if (c.basePrice === "" || !Number.isFinite(base) || base < 0)
        rowErr.basePrice = "Enter a valid price";
      const future =
        c.futurePrice.trim() === "" ? null : Number(c.futurePrice);
      if (future != null && !c.effectiveFrom)
        rowErr.effectiveFrom = "Required with a future price";
      if (Object.keys(rowErr).length) rows[c.key] = rowErr;

      return {
        id: c.id ?? undefined,
        name: c.name.trim(),
        basePrice: Number.isFinite(base) ? base : 0,
        futurePrice: future != null && Number.isFinite(future) ? future : null,
        effectiveFrom: c.effectiveFrom || null,
        image: c.image,
      };
    });

    setErrors(next);
    const hasTop =
      next.name || next.description || next.imageUrl || next.categories;
    const hasRows = Object.keys(rows).length > 0;
    if (hasTop || hasRows) return null;

    const candidate = {
      name: name.trim(),
      description: description.trim(),
      type: attraction?.type ?? "Ride",
      imageUrl: imageUrl as string,
      isActive,
      categories: apiCategories,
    };
    const parsed = attractionInputSchema.safeParse(candidate);
    return parsed.success ? parsed.data : null;
  };

  async function handleSave() {
    setServerError(null);
    const input = buildInput();
    if (!input) return;
    try {
      if (isEdit && attraction) {
        await updateMut.mutateAsync({ id: attraction.id, input });
      } else {
        await createMut.mutateAsync(input);
      }
      onSaved();
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Failed to save attraction.",
      );
    }
  }

  const gridCols = useMemo(
    () =>
      "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
    [],
  );

  return (
    <div className="flex flex-col gap-5 pb-24">
      {/* Top row: Basic Information + Status */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        {/* Basic Information */}
        <section className="rounded-[14px] border border-[var(--login-border)] bg-white p-5 shadow-sm">
          <h2 className="text-[17px] font-bold text-[var(--pos-navy)]">
            Basic Information
          </h2>

          <div className="mt-4 space-y-4">
            <div>
              <label className="text-[13px] font-medium text-[var(--pos-navy)]">
                Attraction Name*
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Toy Train"
                className="mt-1 h-10 w-full rounded-md border border-[var(--login-border)] px-3 text-[14px] outline-none focus:border-[var(--pos-amber)]"
              />
              {errors.name && (
                <p className="mt-1 text-[12px] text-[#DC2626]">{errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-[13px] font-medium text-[var(--pos-navy)]">
                  Description*
                </label>
                <div className="relative mt-1">
                  <textarea
                    value={description}
                    onChange={(e) =>
                      setDescription(e.target.value.slice(0, 500))
                    }
                    placeholder="Enter attraction description……"
                    rows={6}
                    className="w-full resize-none rounded-md border border-[var(--login-border)] p-3 text-[14px] outline-none focus:border-[var(--pos-amber)]"
                  />
                  <span className="absolute right-2 bottom-2 text-[11px] text-[var(--login-text-muted)]">
                    {descCount}/500
                  </span>
                </div>
                {errors.description && (
                  <p className="mt-1 text-[12px] text-[#DC2626]">
                    {errors.description}
                  </p>
                )}
              </div>

              <div>
                <label className="text-[13px] font-medium text-[var(--pos-navy)]">
                  Attraction image*
                </label>
                <div className="mt-1">
                  <ImageUpload
                    value={imageUrl}
                    onChange={setImageUrl}
                    label="Drag & Drop Image here"
                    hint="or"
                  />
                  <p className="mt-1 text-[11px] text-[var(--login-text-muted)]">
                    JPG, PNG or WEBP (Max. 5MB)
                  </p>
                </div>
                {errors.imageUrl && (
                  <p className="mt-1 text-[12px] text-[#DC2626]">
                    {errors.imageUrl}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Status */}
        <section className="rounded-[14px] border border-[var(--login-border)] bg-white p-5 shadow-sm">
          <h2 className="text-[17px] font-bold text-[var(--pos-navy)]">
            Status
          </h2>
          <p className="mt-4 text-[13px] font-medium text-[var(--pos-navy)]">
            Attraction Status*
          </p>
          <div className="mt-2 inline-flex rounded-lg border border-[var(--login-border)] p-1">
            <button
              type="button"
              onClick={() => setIsActive(true)}
              className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors ${
                isActive
                  ? "bg-[var(--pos-navy)] text-white"
                  : "text-[var(--login-text-muted)]"
              }`}
            >
              <span
                className={`size-2 rounded-full ${isActive ? "bg-[var(--pos-success)]" : "bg-current"}`}
              />
              Active
            </button>
            <button
              type="button"
              onClick={() => setIsActive(false)}
              className={`rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors ${
                !isActive
                  ? "bg-[var(--pos-navy)] text-white"
                  : "text-[var(--login-text-muted)]"
              }`}
            >
              Inactive
            </button>
          </div>
        </section>
      </div>

      {/* Visitor Categories & Pricing */}
      <section className="rounded-[14px] border border-[var(--login-border)] bg-white p-5 shadow-sm">
        <h2 className="text-[17px] font-bold text-[var(--pos-navy)]">
          Visitor Categories &amp; Pricing
        </h2>
        {errors.categories && (
          <p className="mt-1 text-[12px] text-[#DC2626]">{errors.categories}</p>
        )}

        <div className={`mt-4 ${gridCols}`}>
          {categories.map((c) => (
            <CategoryPricingCard
              key={c.key}
              draft={c}
              errors={errors.rows[c.key] ?? {}}
              onChange={(patch) => patchCategory(c.key, patch)}
              onDelete={() => removeCategory(c.key)}
            />
          ))}

          {/* Add Visitor Category tile */}
          <button
            type="button"
            onClick={addCategory}
            className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--pos-navy)]/30 text-[var(--pos-navy)] transition-colors hover:border-[var(--pos-amber)] hover:bg-[var(--pos-amber-soft)]"
          >
            <span className="flex size-10 items-center justify-center rounded-full border border-current">
              <Plus className="size-5" />
            </span>
            <span className="text-[13px] font-medium">Add Visitor Category</span>
          </button>
        </div>
      </section>

      {serverError && (
        <p className="rounded-md border border-[#DC2626]/30 bg-[#DC2626]/5 px-3 py-2 text-[13px] text-[#DC2626]">
          {serverError}
        </p>
      )}

      {/* Sticky footer actions */}
      <div className="sticky bottom-0 -mx-6 flex items-center justify-between border-t border-[var(--login-border)] bg-white/95 px-6 py-3 backdrop-blur">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-[var(--login-border)] px-6 py-2.5 text-[14px] font-medium text-[var(--pos-navy)] transition-colors hover:bg-[var(--login-hover-bg)]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-[var(--pos-amber)] px-6 py-2.5 text-[14px] font-semibold text-[#1c1407] transition-colors hover:bg-[var(--pos-amber-600)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Attraction"}
        </button>
      </div>
    </div>
  );
}
