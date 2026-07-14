import { fail, handleApiError, HttpStatus, ok } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { validateBulkCsv } from "@/modules/attractions/bulk-csv";
import { bulkImportSchema } from "@/modules/attractions/schemas";
import type { BulkValidationResult } from "@/modules/attractions/types";

/** Human-readable file size from a byte count. */
function sizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * POST /api/attractions/bulk-upload/validate
 *
 * Parses the uploaded CSV text, validates every row against the template
 * contract, and returns the Validation Summary counts + a per-row error list —
 * exactly the data the design's summary cards and error table render. No writes
 * happen here; import is a separate confirmed step.
 */
export async function POST(request: Request) {
  try {
    await requirePermission(PERMISSIONS.ATTRACTIONS_MANAGE);

    const body = await request.json();
    const { fileName, content } = bulkImportSchema.parse(body);

    const existing = await prisma.attraction.findMany({
      where: { isActive: true },
      select: { name: true },
    });
    const existingNames = new Set(existing.map((e) => e.name.toLowerCase()));

    const result = validateBulkCsv(content, existingNames);
    if ("headerError" in result) {
      return fail(result.headerError, { status: HttpStatus.UNPROCESSABLE_ENTITY });
    }

    const payload: BulkValidationResult = {
      fileName,
      fileSizeLabel: sizeLabel(new TextEncoder().encode(content).length),
      totalRecords: result.totalRecords,
      validRecords: result.validRecords,
      invalidRecords: result.invalidRecords,
      duplicateRecords: result.duplicateRecords,
      errors: result.errors,
      // The client re-sends `content` on import, so no server-side token store
      // is needed; we echo the filename as an opaque handle.
      token: fileName,
    };

    return ok(payload, "File validated.");
  } catch (error) {
    return handleApiError(error);
  }
}
