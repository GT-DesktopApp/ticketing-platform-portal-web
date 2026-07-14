import { fail, handleApiError, HttpStatus, ok } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { attractionInputSchema } from "@/modules/attractions/schemas";
import {
  attractionInclude,
  toManagedAttraction,
} from "@/modules/attractions/server/mapper";
import { updateAttraction } from "@/modules/attractions/server/persist";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/attractions/manage/[id] — one attraction with its categories. */
export async function GET(_request: Request, { params }: Ctx) {
  try {
    await requirePermission(PERMISSIONS.ATTRACTIONS_VIEW);
    const { id } = await params;

    const attraction = await prisma.attraction.findUnique({
      where: { id },
      include: attractionInclude,
    });
    if (!attraction) {
      return fail("Attraction not found.", { status: HttpStatus.NOT_FOUND });
    }

    return ok(toManagedAttraction(attraction), "Attraction loaded.");
  } catch (error) {
    return handleApiError(error);
  }
}

/** PUT /api/attractions/manage/[id] — update attraction + reconcile categories. */
export async function PUT(request: Request, { params }: Ctx) {
  try {
    await requirePermission(PERMISSIONS.ATTRACTIONS_MANAGE);
    const { id } = await params;

    const exists = await prisma.attraction.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      return fail("Attraction not found.", { status: HttpStatus.NOT_FOUND });
    }

    const body = await request.json();
    const input = attractionInputSchema.parse(body);

    const attraction = await updateAttraction(id, input);
    return ok(toManagedAttraction(attraction), "Attraction updated.");
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/attractions/manage/[id]
 *
 * Soft-deletes the attraction (isActive=false) so existing bookings keep their
 * FK references. It disappears from the booking screen (which filters on
 * isActive) but the management grid can still surface it if needed.
 */
export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    await requirePermission(PERMISSIONS.ATTRACTIONS_MANAGE);
    const { id } = await params;

    const exists = await prisma.attraction.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      return fail("Attraction not found.", { status: HttpStatus.NOT_FOUND });
    }

    await prisma.$transaction([
      prisma.ticketCategory.updateMany({
        where: { attractionId: id },
        data: { isActive: false },
      }),
      prisma.attraction.update({
        where: { id },
        data: { isActive: false },
      }),
    ]);

    return ok({ id }, "Attraction deleted.");
  } catch (error) {
    return handleApiError(error);
  }
}
