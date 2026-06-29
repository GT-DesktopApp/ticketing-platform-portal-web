"use client";

import { ImagePlus, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { useId, useRef, useState } from "react";

/**
 * Modern image upload for the New Category dialog.
 *
 * Empty state: a large dashed drop zone — drag & drop OR click to browse.
 * Filled state: an image preview with Replace / Remove actions. The value is a
 * data URL (base64) held by the parent; wiring it to real storage is a later
 * step. Accepts images only, with a size guard.
 */
const MAX_BYTES = 3 * 1024 * 1024; // 3 MB

export function ImageUpload({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be under 3 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  // Filled state — preview + actions.
  if (value) {
    return (
      <div className="space-y-2">
        <div className="relative overflow-hidden rounded-xl border border-[var(--login-border)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Category preview"
            className="h-44 w-full object-cover"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-[var(--login-border)] py-2 text-[13px] font-medium text-[var(--pos-navy)] transition-colors hover:bg-[var(--login-hover-bg)]"
          >
            <RefreshCw className="size-4" /> Replace
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-[#DC2626]/30 py-2 text-[13px] font-medium text-[#DC2626] transition-colors hover:bg-[#DC2626]/10"
          >
            <Trash2 className="size-4" /> Remove
          </button>
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    );
  }

  // Empty state — drop zone.
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center transition-colors ${
          dragging
            ? "border-[var(--pos-amber)] bg-[var(--pos-amber-soft)]"
            : "border-[var(--login-border)] hover:border-[var(--pos-amber)]/60 hover:bg-[var(--login-hover-bg)]"
        }`}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-[var(--pos-blue-soft)] text-[var(--pos-navy)]">
          {dragging ? (
            <ImagePlus className="size-6" />
          ) : (
            <UploadCloud className="size-6" />
          )}
        </span>
        <span className="text-[14px] font-semibold text-[var(--pos-navy)]">
          Upload Category Image
        </span>
        <span className="text-[12px] text-[var(--login-text-muted)]">
          Drag &amp; drop image here, or{" "}
          <span className="font-medium text-[var(--pos-amber-600)]">
            browse files
          </span>
        </span>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </label>
      {error && <p className="text-[12px] text-[#DC2626]">{error}</p>}
    </div>
  );
}
