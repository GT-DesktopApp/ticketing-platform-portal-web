import { handleApiError, ok } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";

/**
 * Tickets API — scaffold only.
 *
 * The tickets feature (creation, QR generation, printing, verification) is a
 * later milestone. This handler shows the guarded pattern that the future
 * implementation will fill in. Listing/creation logic intentionally omitted.
 */
export async function GET() {
  try {
    await requirePermission(PERMISSIONS.TICKETS_VIEW);
    return ok([], "Tickets endpoint scaffolded (not yet implemented).");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST() {
  try {
    await requirePermission(PERMISSIONS.TICKETS_CREATE);
    return ok(null, "Ticket creation scaffolded (not yet implemented).");
  } catch (error) {
    return handleApiError(error);
  }
}
