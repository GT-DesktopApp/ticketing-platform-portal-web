import { fail, handleApiError, HttpStatus, ok } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { toggleLayoutStatusSchema } from "@/modules/layouts/schemas";
import { layoutInclude, toManagedLayout } from "@/modules/layouts/server/mapper";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/layouts/[id]/status — toggle a layout's active status. */
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requirePermission(PERMISSIONS.ATTRACTIONS_MANAGE);
    const { id } = await params;

    const body = await request.json();
    const { isActive } = toggleLayoutStatusSchema.parse(body);

    const exists = await prisma.seatLayout.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      return fail("Layout not found.", { status: HttpStatus.NOT_FOUND });
    }

    const layout = await prisma.seatLayout.update({
      where: { id },
      data: { isActive },
      include: layoutInclude,
    });
    return ok(
      toManagedLayout(layout),
      isActive ? "Layout activated." : "Layout deactivated.",
    );
  } catch (error) {
    return handleApiError(error);
  }
}
