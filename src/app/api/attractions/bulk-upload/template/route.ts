import { handleApiError } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { buildTemplateCsv } from "@/modules/attractions/bulk-csv";

/**
 * GET /api/attractions/bulk-upload/template
 *
 * Streams the sample CSV template (headers + two example rows) as a file
 * download so operators can fill it in and re-upload it.
 */
export async function GET() {
  try {
    await requirePermission(PERMISSIONS.ATTRACTIONS_MANAGE);

    const csv = buildTemplateCsv();
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="attraction_bulk_upload_template.csv"',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
