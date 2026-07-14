import { fail, handleApiError, HttpStatus, ok } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  type ParsedAttraction,
  validateBulkCsv,
} from "@/modules/attractions/bulk-csv";
import { bulkImportSchema } from "@/modules/attractions/schemas";
import { toDate, toPaise } from "@/modules/attractions/server/mapper";
import type { BulkImportResult } from "@/modules/attractions/types";

/** Lowest category base price (paise) = the attraction's display base rate. */
function baseRatePaise(a: ParsedAttraction): number {
  const prices = a.categories.map((c) => toPaise(c.basePrice));
  return prices.length ? Math.min(...prices) : 0;
}

/**
 * Upsert one parsed attraction: create it, or (if the name already exists)
 * update it and replace its active categories. Runs in a transaction per
 * attraction so a failure on one row-group doesn't leave a half-written record.
 */
async function upsertAttraction(
  a: ParsedAttraction,
): Promise<"created" | "updated"> {
  const existing = await prisma.attraction.findFirst({
    where: { name: { equals: a.name, mode: "insensitive" }, isActive: true },
    select: { id: true },
  });

  const categoryData = a.categories.map((c, i) => ({
    name: c.name,
    pricePaise: toPaise(c.basePrice),
    futurePricePaise: c.futurePrice != null ? toPaise(c.futurePrice) : null,
    effectiveFrom: toDate(c.effectiveFrom),
    image: c.image,
    sortOrder: i,
    isActive: true,
  }));

  if (existing) {
    await prisma.$transaction([
      prisma.attraction.update({
        where: { id: existing.id },
        data: {
          type: a.type,
          description: a.description,
          imageUrl: a.imageUrl,
          baseRatePaise: baseRatePaise(a),
        },
      }),
      // Replace the category set (soft-delete the old, insert the new).
      prisma.ticketCategory.updateMany({
        where: { attractionId: existing.id },
        data: { isActive: false },
      }),
      prisma.ticketCategory.createMany({
        data: categoryData.map((c) => ({ ...c, attractionId: existing.id })),
      }),
    ]);
    return "updated";
  }

  await prisma.attraction.create({
    data: {
      name: a.name,
      type: a.type,
      bookingType: "CATEGORY",
      description: a.description,
      imageUrl: a.imageUrl,
      isActive: true,
      baseRatePaise: baseRatePaise(a),
      categories: { create: categoryData },
    },
  });
  return "created";
}

/**
 * POST /api/attractions/bulk-upload/import
 *
 * Re-validates the file (never trust the client) and imports every VALID
 * attraction — creating new ones and updating existing ones by name match.
 * Invalid rows are skipped; the response reports created/updated/skipped counts.
 */
export async function POST(request: Request) {
  try {
    await requirePermission(PERMISSIONS.ATTRACTIONS_MANAGE);

    const body = await request.json();
    const { content } = bulkImportSchema.parse(body);

    const existing = await prisma.attraction.findMany({
      where: { isActive: true },
      select: { name: true },
    });
    const existingNames = new Set(existing.map((e) => e.name.toLowerCase()));

    const result = validateBulkCsv(content, existingNames);
    if ("headerError" in result) {
      return fail(result.headerError, { status: HttpStatus.UNPROCESSABLE_ENTITY });
    }

    let createdCount = 0;
    let updatedCount = 0;
    for (const attraction of result.attractions) {
      const outcome = await upsertAttraction(attraction);
      if (outcome === "created") createdCount++;
      else updatedCount++;
    }

    const payload: BulkImportResult = {
      created: createdCount,
      updated: updatedCount,
      skipped: result.invalidRecords + result.duplicateRecords,
    };
    return ok(payload, "Attractions imported.");
  } catch (error) {
    return handleApiError(error);
  }
}
