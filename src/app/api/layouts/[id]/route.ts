import { fail, handleApiError, HttpStatus, ok } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { seatsForConfig } from "@/modules/layouts/geometry";
import { layoutInputSchema } from "@/modules/layouts/schemas";
import { layoutInclude, toManagedLayout } from "@/modules/layouts/server/mapper";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/layouts/[id] — one seat layout. */
export async function GET(_request: Request, { params }: Ctx) {
  try {
    await requirePermission(PERMISSIONS.ATTRACTIONS_VIEW);
    const { id } = await params;

    const layout = await prisma.seatLayout.findUnique({
      where: { id },
      include: layoutInclude,
    });
    if (!layout) {
      return fail("Layout not found.", { status: HttpStatus.NOT_FOUND });
    }
    return ok(toManagedLayout(layout), "Layout loaded.");
  } catch (error) {
    return handleApiError(error);
  }
}

/** PUT /api/layouts/[id] — update a seat layout. */
export async function PUT(request: Request, { params }: Ctx) {
  try {
    await requirePermission(PERMISSIONS.ATTRACTIONS_MANAGE);
    const { id } = await params;

    const existing = await prisma.seatLayout.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return fail("Layout not found.", { status: HttpStatus.NOT_FOUND });
    }

    const body = await request.json();
    const input = layoutInputSchema.parse(body);

    const layout = await prisma.seatLayout.update({
      where: { id },
      data: {
        name: input.name,
        totalSeats: seatsForConfig(input),
        rows: input.rows,
        columnsLeft: input.columnsLeft,
        columnsRight: input.columnsRight,
        aislePosition: input.aislePosition,
        aisleWidth: input.aisleWidth,
        vipRows: input.vipRows,
        isCustom: input.isCustom,
        isActive: input.isActive,
      },
      include: layoutInclude,
    });

    return ok(toManagedLayout(layout), "Layout updated.");
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/layouts/[id]
 *
 * A layout in use by attractions is deactivated (isActive=false) rather than
 * removed — the FK is SetNull, but deactivating keeps its shape available for
 * reference and avoids silently detaching attractions. An unused layout is
 * hard-deleted.
 */
export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    await requirePermission(PERMISSIONS.ATTRACTIONS_MANAGE);
    const { id } = await params;

    const layout = await prisma.seatLayout.findUnique({
      where: { id },
      select: { id: true, _count: { select: { attractions: true } } },
    });
    if (!layout) {
      return fail("Layout not found.", { status: HttpStatus.NOT_FOUND });
    }

    if (layout._count.attractions > 0) {
      await prisma.seatLayout.update({
        where: { id },
        data: { isActive: false },
      });
      return ok(
        { id, softDeleted: true },
        "Layout is in use, so it was deactivated instead of deleted.",
      );
    }

    await prisma.seatLayout.delete({ where: { id } });
    return ok({ id, softDeleted: false }, "Layout deleted.");
  } catch (error) {
    return handleApiError(error);
  }
}
