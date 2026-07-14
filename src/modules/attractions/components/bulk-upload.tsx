"use client";

import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
  UploadCloud,
} from "lucide-react";
import { useRef, useState } from "react";

import { API_ROUTES } from "@/lib/constants/routes";
import { buildErrorReportCsv } from "@/modules/attractions/bulk-csv";
import {
  useImportBulkUpload,
  useValidateBulkUpload,
} from "@/modules/attractions/hooks/use-attractions-admin";
import type { BulkValidationResult } from "@/modules/attractions/types";

const ACCEPT = ".csv,.xls,.xlsx";

/** Trigger a client-side file download of `text`. */
function downloadText(text: string, filename: string, mime = "text/csv") {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * The Bulk Upload flow (three design screens in one component):
 *   1. Upload File — drag-drop / browse, Download Template, rules panel.
 *   2. Validation result — File Details + 4 summary cards + error table (or a
 *      "no errors" banner), with Replace File / Download Error Report / Import.
 * State is driven by whether we have a `result` yet.
 */
export function BulkUpload({
  onCancel,
  onImported,
}: {
  onCancel: () => void;
  onImported: (summary: { created: number; updated: number }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<{ name: string; content: string } | null>(
    null,
  );
  const [result, setResult] = useState<BulkValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateMut = useValidateBulkUpload();
  const importMut = useImportBulkUpload();

  async function readAndValidate(f: File) {
    setError(null);
    const name = f.name.toLowerCase();
    if (!/\.(csv|xls|xlsx)$/.test(name)) {
      setError("Only .csv, .xls, .xlsx files are allowed.");
      return;
    }
    const content = await f.text();
    setFile({ name: f.name, content });
    try {
      const res = await validateMut.mutateAsync({ fileName: f.name, content });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation failed.");
      setResult(null);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void readAndValidate(f);
  }

  function replaceFile() {
    setResult(null);
    setFile(null);
    setError(null);
    inputRef.current?.click();
  }

  async function handleImport() {
    if (!file) return;
    try {
      const summary = await importMut.mutateAsync({
        fileName: file.name,
        content: file.content,
      });
      onImported({ created: summary.created, updated: summary.updated });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    }
  }

  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPT}
      className="hidden"
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) void readAndValidate(f);
        e.target.value = "";
      }}
    />
  );

  // ── Screen 2: validation result ──────────────────────────────────────────
  if (result) {
    const hasErrors = result.errors.length > 0;
    return (
      <div className="rounded-[16px] border border-[var(--login-border)] bg-white p-6 shadow-sm">
        {hiddenInput}
        <h1 className="text-[20px] font-bold text-[var(--pos-navy)]">
          Bulk Upload Attractions
        </h1>
        <p className="mt-0.5 text-[13px] text-[var(--login-text-muted)]">
          Review the uploaded file and resolve any issues before importing.
        </p>

        {/* Banner */}
        {hasErrors ? (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#DC2626]/30 bg-[#DC2626]/5 p-4">
            <span className="mt-0.5 text-[#DC2626]">⚠</span>
            <div>
              <p className="text-[15px] font-semibold text-[#DC2626]">
                Validation Completed with Errors
              </p>
              <p className="text-[13px] text-[var(--login-text-muted)]">
                Some records have issues that need to be resolved. Please review
                the details below.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-[var(--pos-success)]/30 bg-[var(--pos-success)]/5 p-4">
            <CheckCircle2 className="mt-0.5 size-5 text-[var(--pos-success)]" />
            <div>
              <p className="text-[15px] font-semibold text-[var(--pos-navy)]">
                File uploaded successfully
              </p>
              <p className="text-[13px] text-[var(--login-text-muted)]">
                We have validated your file. Please review the summary below.
              </p>
            </div>
          </div>
        )}

        {/* File details */}
        <h2 className="mt-6 text-[15px] font-bold text-[var(--pos-navy)]">
          File Details
        </h2>
        <div className="mt-2 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-lg bg-[var(--pos-success)]/10 text-[var(--pos-success)]">
            <FileSpreadsheet className="size-6" />
          </span>
          <div>
            <p className="text-[14px] font-semibold text-[var(--pos-navy)]">
              {result.fileName}
            </p>
            <p className="text-[12px] text-[var(--login-text-muted)]">
              {result.fileSizeLabel}
            </p>
          </div>
        </div>

        {/* Validation summary */}
        <h2 className="mt-6 text-[15px] font-bold text-[var(--pos-navy)]">
          Validation Summary
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            value={result.totalRecords}
            label="Total Records"
            sub="Found in file"
            tone="navy"
          />
          <SummaryCard
            value={result.validRecords}
            label="Valid Records"
            sub="Ready to import"
            tone="success"
          />
          <SummaryCard
            value={result.invalidRecords}
            label="Invalid Records"
            sub="Need attention"
            tone="danger"
          />
          <SummaryCard
            value={result.duplicateRecords}
            label="Duplicate Records"
            sub="Will be updated"
            tone="amber"
          />
        </div>

        {/* Error table or success note */}
        {hasErrors ? (
          <>
            <h2 className="mt-6 text-[15px] font-bold text-[var(--pos-navy)]">
              Error Found ({result.errors.length})
            </h2>
            <div className="mt-3 overflow-x-auto rounded-xl border border-[var(--login-border)]">
              <table className="w-full min-w-[720px] text-left text-[13px]">
                <thead className="bg-[var(--login-hover-bg)] text-[var(--login-text-muted)]">
                  <tr>
                    <th className="px-4 py-2 font-medium">Row no.</th>
                    <th className="px-4 py-2 font-medium">Attraction Name</th>
                    <th className="px-4 py-2 font-medium">Column Name</th>
                    <th className="px-4 py-2 font-medium">Issue</th>
                    <th className="px-4 py-2 font-medium">Resolution</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((e, i) => (
                    <tr
                      key={`${e.row}-${e.columnName}-${i}`}
                      className="border-t border-[var(--login-border)]"
                    >
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="flex size-4 items-center justify-center rounded-full bg-[#DC2626] text-[10px] text-white">
                            ✕
                          </span>
                          {e.row}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-[var(--pos-navy)]">
                        {e.attractionName || "—"}
                      </td>
                      <td className="px-4 py-2">{e.columnName}</td>
                      <td className="px-4 py-2 text-[#DC2626]">{e.issue}</td>
                      <td className="px-4 py-2 text-[var(--login-text-muted)]">
                        {e.resolution}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="mt-5 flex items-start gap-3 rounded-xl border-2 border-[var(--pos-success)] bg-[var(--pos-success)]/5 p-4">
            <CheckCircle2 className="mt-0.5 size-5 text-[var(--pos-success)]" />
            <div>
              <p className="text-[15px] font-semibold text-[var(--pos-navy)]">
                Great! No validation errors found.
              </p>
              <p className="text-[13px] text-[var(--login-text-muted)]">
                All records are valid and ready to be imported.
              </p>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-md border border-[#DC2626]/30 bg-[#DC2626]/5 px-3 py-2 text-[13px] text-[#DC2626]">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={replaceFile}
              className="flex items-center gap-1.5 rounded-md border border-[var(--login-border)] px-4 py-2 text-[13px] font-medium text-[var(--pos-navy)] transition-colors hover:bg-[var(--login-hover-bg)]"
            >
              <Upload className="size-4" /> Replace File
            </button>
            <button
              type="button"
              disabled={!hasErrors}
              onClick={() =>
                downloadText(
                  buildErrorReportCsv(result.errors),
                  "attraction_error_report.csv",
                )
              }
              className="flex items-center gap-1.5 rounded-md border border-[var(--login-border)] px-4 py-2 text-[13px] font-medium text-[var(--pos-navy)] transition-colors hover:bg-[var(--login-hover-bg)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="size-4" /> Download Error Report
            </button>
          </div>
          <button
            type="button"
            onClick={handleImport}
            disabled={importMut.isPending || result.validRecords === 0}
            className="flex items-center justify-center gap-2 rounded-md bg-[var(--pos-amber)] px-6 py-2.5 text-[14px] font-semibold text-[#1c1407] transition-colors hover:bg-[var(--pos-amber-600)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {importMut.isPending ? "Importing…" : "Import Attractions"}
            <ArrowRight className="size-4" />
          </button>
        </div>

        {!hasErrors && (
          <p className="mt-4 rounded-md bg-[var(--pos-blue-soft)] px-3 py-2 text-[12px] text-[var(--pos-navy)]">
            Tip: You can still download the error report if you want to review
            the data before importing.
          </p>
        )}
      </div>
    );
  }

  // ── Screen 1: upload file ─────────────────────────────────────────────────
  return (
    <div className="rounded-[16px] border border-[var(--login-border)] bg-white p-6 shadow-sm">
      {hiddenInput}
      <h1 className="text-[20px] font-bold text-[var(--pos-navy)]">
        Bulk Upload
      </h1>
      <p className="mt-0.5 text-[13px] text-[var(--login-text-muted)]">
        Upload a file to add or update multiple attractions at once.
      </p>

      <div className="mt-5 rounded-xl border border-[var(--login-border)] p-5">
        <p className="text-[14px] font-semibold text-[var(--pos-navy)]">
          1. Upload File
        </p>

        {/* Drop zone */}
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`mt-3 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-12 text-center transition-colors ${
            dragging
              ? "border-[var(--pos-amber)] bg-[var(--pos-amber-soft)]"
              : "border-[var(--login-border)] bg-[var(--login-hover-bg)]/40 hover:border-[var(--pos-amber)]/60"
          }`}
        >
          <UploadCloud className="size-9 text-[var(--pos-navy)]/60" />
          <p className="text-[14px] text-[var(--pos-navy)]">
            Drag &amp; Drop your File here
          </p>
          <span className="text-[12px] text-[var(--login-text-muted)]">or</span>
          <span className="flex items-center gap-1.5 rounded-md bg-[var(--pos-amber)] px-4 py-2 text-[13px] font-semibold text-[#1c1407]">
            <Upload className="size-4" />{" "}
            {validateMut.isPending ? "Validating…" : "Browse File"}
          </span>
          <span className="text-[12px] text-[var(--login-text-muted)]">
            Only .csv, .xls, .xlsx files are allowed
          </span>
        </label>

        {error && (
          <p className="mt-3 rounded-md border border-[#DC2626]/30 bg-[#DC2626]/5 px-3 py-2 text-[13px] text-[#DC2626]">
            {error}
          </p>
        )}
      </div>

      {/* Template + rules */}
      <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <p className="text-[14px] font-semibold text-[var(--pos-navy)]">
            2. Download Template
          </p>
          <div className="mt-3 flex items-start gap-3">
            <span className="flex size-11 items-center justify-center rounded-lg bg-[var(--pos-success)]/10 text-[var(--pos-success)]">
              <FileSpreadsheet className="size-6" />
            </span>
            <p className="text-[13px] text-[var(--login-text-muted)]">
              Download our sample template to see the correct format and required
              columns
            </p>
          </div>
          <a
            href={API_ROUTES.BULK_UPLOAD_TEMPLATE}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-[var(--login-border)] px-4 py-2 text-[13px] font-medium text-[var(--pos-navy)] transition-colors hover:bg-[var(--login-hover-bg)]"
          >
            <Download className="size-4" /> Download Template
          </a>
        </div>

        <div className="md:border-l md:border-[var(--login-border)] md:pl-6">
          <p className="text-[14px] font-semibold text-[var(--pos-navy)]">
            Upload Rules
          </p>
          <ul className="mt-3 space-y-2 text-[13px] text-[var(--login-text-muted)]">
            <li className="flex gap-2">
              <span className="text-[var(--pos-amber-600)]">•</span> Only CSV,
              XLS, XLSX files are supported.
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--pos-amber-600)]">•</span> Maximum 500
              records can be uploaded at a time.
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--pos-amber-600)]">•</span> First row
              must contain column headers.
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--pos-amber-600)]">•</span> Existing
              attractions will be updated if the attraction name matches.
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--pos-amber-600)]">•</span> Ensure all
              required fields are filled in the file.
            </li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-[var(--login-border)] px-6 py-2.5 text-[14px] font-medium text-[var(--pos-navy)] transition-colors hover:bg-[var(--login-hover-bg)]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={validateMut.isPending}
          className="flex items-center gap-1.5 rounded-md bg-[var(--pos-amber)] px-6 py-2.5 text-[14px] font-semibold text-[#1c1407] transition-colors hover:bg-[var(--pos-amber-600)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Upload className="size-4" /> Upload File
        </button>
      </div>
    </div>
  );
}

/** One Validation Summary card (colored value + label + sub-label). */
function SummaryCard({
  value,
  label,
  sub,
  tone,
}: {
  value: number;
  label: string;
  sub: string;
  tone: "navy" | "success" | "danger" | "amber";
}) {
  const color = {
    navy: "text-[var(--pos-navy)]",
    success: "text-[var(--pos-success)]",
    danger: "text-[#DC2626]",
    amber: "text-[var(--pos-amber-600)]",
  }[tone];
  return (
    <div className="rounded-xl border border-[var(--login-border)] p-4">
      <p className={`text-[24px] font-bold ${color}`}>{value}</p>
      <p className="text-[13px] font-semibold text-[var(--pos-navy)]">
        {label}
      </p>
      <p className="text-[11px] text-[var(--login-text-muted)]">{sub}</p>
    </div>
  );
}
