/**
 * CSV parsing + validation for the Attraction bulk-upload flow.
 *
 * The template has one row per (attraction, visitor category) pairing, so
 * multiple rows can describe the same attraction. Columns:
 *
 *   attraction_name, attraction_type, description, attraction_image,
 *   category_name, base_price, future_price, effective_from
 *
 * `validateBulkCsv` parses the text, checks headers, validates every row, and
 * groups rows into attractions. It returns a summary + per-row errors that map
 * exactly to the Validation Summary cards and the Error table in the design.
 */

import type { BulkRowError } from "./types";

/** The required header columns, in canonical order (used by the template). */
export const BULK_COLUMNS = [
  "attraction_name",
  "attraction_type",
  "description",
  "attraction_image",
  "category_name",
  "base_price",
  "future_price",
  "effective_from",
] as const;

export type BulkColumn = (typeof BULK_COLUMNS)[number];

/** A parsed + normalised category row belonging to an attraction. */
export interface ParsedCategory {
  name: string;
  basePrice: number;
  futurePrice: number | null;
  effectiveFrom: string | null;
  image: string | null;
}

/** A parsed attraction (one or more CSV rows grouped by name). */
export interface ParsedAttraction {
  name: string;
  type: string;
  description: string | null;
  imageUrl: string | null;
  categories: ParsedCategory[];
}

export interface BulkValidation {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  duplicateRecords: number;
  errors: BulkRowError[];
  /** Attractions that passed validation, ready to upsert. */
  attractions: ParsedAttraction[];
}

/**
 * Minimal but correct RFC-4180-ish CSV parser: handles quoted fields, escaped
 * quotes (""), commas and newlines inside quotes, and CRLF. Returns rows of
 * string cells. Good enough for the template we generate; avoids a dependency.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  // Strip a leading UTF-8 BOM if present.
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c === "\r") {
      // handled by the \n branch; ignore lone CR
    } else {
      field += c;
    }
  }
  // Flush the final field/row (files that don't end in a newline).
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const IMAGE_RE = /\.(png|jpe?g|webp)$/i;

/** Is `value` a real calendar date in YYYY-MM-DD form (not just the shape)? */
function isValidDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/**
 * Validate the parsed CSV against the template contract. Returns the summary
 * counts, a per-row error list, and the attractions ready to import (grouped).
 *
 * `existingNames` is the set of attraction names already in the DB (lower-cased)
 * so we can count how many records will be UPDATED rather than created.
 */
export function validateBulkCsv(
  text: string,
  existingNames: Set<string>,
): BulkValidation | { headerError: string } {
  const grid = parseCsv(text).filter(
    (r) => r.length > 1 || (r[0]?.trim() ?? "") !== "",
  );

  if (grid.length === 0) {
    return { headerError: "The file is empty." };
  }

  const header = grid[0].map((h) => h.trim().toLowerCase());
  const missing = BULK_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length > 0) {
    return {
      headerError: `Missing required column(s): ${missing.join(", ")}. The first row must contain the template headers.`,
    };
  }
  const idx = (col: BulkColumn) => header.indexOf(col);

  const dataRows = grid.slice(1);
  const errors: BulkRowError[] = [];
  // Group valid category rows by attraction name (case-insensitive key).
  const byName = new Map<string, ParsedAttraction>();
  // Track (attractionName + categoryName) to flag duplicate rows in-file.
  const seenPairs = new Set<string>();
  const updatedNames = new Set<string>();

  let invalidRecords = 0;
  let duplicateRecords = 0;

  dataRows.forEach((cells, i) => {
    // +2: 1 for the header row, 1 to make it 1-indexed like a spreadsheet.
    const rowNo = i + 2;
    const get = (col: BulkColumn) => (cells[idx(col)] ?? "").trim();

    const name = get("attraction_name");
    const categoryName = get("category_name");
    const basePriceRaw = get("base_price");
    const futurePriceRaw = get("future_price");
    const effectiveFrom = get("effective_from");
    const image = get("attraction_image");
    const type = get("attraction_type") || "Ride";
    const description = get("description");

    const rowErrors: BulkRowError[] = [];
    const addError = (columnName: string, issue: string, resolution: string) =>
      rowErrors.push({ row: rowNo, attractionName: name, columnName, issue, resolution });

    if (!name) {
      addError(
        "attraction_name",
        "Attraction name is missing",
        "Enter the attraction name",
      );
    }
    if (!categoryName) {
      addError(
        "category_name",
        "Category name is missing",
        "Enter a visitor category (e.g. Adult)",
      );
    }
    if (!image) {
      addError(
        "attraction_image",
        "Image file is missing or invalid",
        "Provide a valid image file (png/jpg)",
      );
    } else if (!IMAGE_RE.test(image) && !image.startsWith("http") && !image.startsWith("data:")) {
      addError(
        "attraction_image",
        "Image file is missing or invalid",
        "Provide a valid image file (png/jpg)",
      );
    }

    let basePrice = NaN;
    if (!basePriceRaw) {
      addError("base_price", "Base price is missing", "Enter a valid base price");
    } else {
      basePrice = Number(basePriceRaw);
      if (!Number.isFinite(basePrice) || basePrice < 0) {
        addError(
          "base_price",
          "Base price is invalid",
          "Enter a valid base price",
        );
      }
    }

    let futurePrice: number | null = null;
    if (futurePriceRaw) {
      const fp = Number(futurePriceRaw);
      if (!Number.isFinite(fp) || fp < 0) {
        addError(
          "future_price",
          "Future price is invalid",
          "Enter a valid future price or leave blank",
        );
      } else {
        futurePrice = fp;
      }
    }

    if (effectiveFrom && !isValidDate(effectiveFrom)) {
      addError(
        "effective_from",
        "Invalid date format",
        "Use format - YYYY-MM-DD",
      );
    }
    if (futurePrice != null && !effectiveFrom) {
      addError(
        "effective_from",
        "Effective date is required with a future price",
        "Use format - YYYY-MM-DD",
      );
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      invalidRecords++;
      return;
    }

    // Duplicate (same attraction + category) within the file.
    const pairKey = `${name.toLowerCase()}::${categoryName.toLowerCase()}`;
    if (seenPairs.has(pairKey)) {
      duplicateRecords++;
      return;
    }
    seenPairs.add(pairKey);

    if (existingNames.has(name.toLowerCase())) {
      updatedNames.add(name.toLowerCase());
    }

    const key = name.toLowerCase();
    const existing = byName.get(key);
    const parsedCat: ParsedCategory = {
      name: categoryName,
      basePrice,
      futurePrice,
      effectiveFrom: effectiveFrom || null,
      image: image || null,
    };
    if (existing) {
      existing.categories.push(parsedCat);
    } else {
      byName.set(key, {
        name,
        type,
        description: description || null,
        imageUrl: image || null,
        categories: [parsedCat],
      });
    }
  });

  const attractions = [...byName.values()];
  // "records" in the summary = data rows; valid = rows that produced a category.
  const totalRecords = dataRows.length;
  const validRecords = totalRecords - invalidRecords - duplicateRecords;

  return {
    totalRecords,
    validRecords,
    invalidRecords,
    duplicateRecords: duplicateRecords + updatedNames.size,
    errors,
    attractions,
  };
}

/** The downloadable sample template (headers + two example rows). */
export function buildTemplateCsv(): string {
  const rows = [
    BULK_COLUMNS.join(","),
    "Toy Train,Ride,A scenic heritage train ride,toy_train.jpg,Adult,100,120,2026-09-01",
    "Toy Train,Ride,A scenic heritage train ride,toy_train.jpg,Child,50,,",
  ];
  return rows.join("\n") + "\n";
}

/** Build a downloadable error report CSV from a validation's error list. */
export function buildErrorReportCsv(errors: BulkRowError[]): string {
  const header = "row,attraction_name,column_name,issue,resolution";
  const escape = (s: string) =>
    /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  const lines = errors.map((e) =>
    [e.row, escape(e.attractionName), escape(e.columnName), escape(e.issue), escape(e.resolution)].join(
      ",",
    ),
  );
  return [header, ...lines].join("\n") + "\n";
}
