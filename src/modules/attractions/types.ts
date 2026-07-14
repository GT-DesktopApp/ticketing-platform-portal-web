/**
 * Types for the Attraction Management module (list, add/edit form, bulk upload).
 *
 * These are the browser-facing shapes returned by the management API. Prices are
 * in RUPEES here (the API converts to/from paise) so the form binds directly.
 */

/** A visitor category / pricing row within an attraction (management view). */
export interface AttractionCategory {
  id: string;
  name: string;
  /** Base price in rupees. */
  basePrice: number;
  /** Scheduled next price in rupees, or null if none. */
  futurePrice: number | null;
  /** Date (YYYY-MM-DD) the future price applies from, or null. */
  effectiveFrom: string | null;
  /** Category image (data URL / URL), or null. */
  image: string | null;
  sortOrder: number;
}

/** An attraction as shown/edited in the management module. */
export interface ManagedAttraction {
  id: string;
  name: string;
  type: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  openTime: string | null;
  closeTime: string | null;
  durationMin: number | null;
  categories: AttractionCategory[];
}

/** A single validation error from the bulk-upload validation pass. */
export interface BulkRowError {
  row: number;
  attractionName: string;
  columnName: string;
  issue: string;
  resolution: string;
}

/** The result of validating an uploaded bulk file (before import). */
export interface BulkValidationResult {
  fileName: string;
  fileSizeLabel: string;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  duplicateRecords: number;
  errors: BulkRowError[];
  /** Opaque token echoed back to /import so the server re-parses the same rows. */
  token: string;
}

/** The result of importing a validated bulk file. */
export interface BulkImportResult {
  created: number;
  updated: number;
  skipped: number;
}
