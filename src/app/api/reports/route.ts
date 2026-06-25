import { handleApiError, ok } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";

/**
 * Reports API — scaffold only. Aggregation queries and export generation are a
 * later milestone. Demonstrates the guarded + enveloped pattern.
 */
export async function GET() {
  try {
    await requirePermission(PERMISSIONS.REPORTS_VIEW);
    return ok([], "Reports endpoint scaffolded (not yet implemented).");
  } catch (error) {
    return handleApiError(error);
  }
}
