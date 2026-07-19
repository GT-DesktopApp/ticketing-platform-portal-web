import type { NextRequest } from "next/server";

import { created, handleApiError, ok } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { seatsForConfig } from "@/modules/layouts/geometry";
import { layoutInputSchema } from "@/modules/layouts/schemas";
import { layoutInclude, toManagedLayout } from "@/modules/layouts/server/mapper";

/**
 * GET /api/layouts — list reusable seat layouts for Layout Management.
 * `?search=` filters by name.
 */
export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.ATTRACTIONS_VIEW);

    const search = request.nextUrl.searchParams.get("search")?.trim();

    const layouts = await prisma.seatLayout.findMany({
      where: search
        ? { name: { contains: search, mode: "insensitive" } }
        : undefined,
      orderBy: { createdAt: "desc" },
      include: layoutInclude,
    });

    return ok(layouts.map(toManagedLayout), "Layouts fetched successfully.");
  } catch (error) {
    return handleApiError(error);
  }
}

/** POST /api/layouts — create a reusable seat layout. */
export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.ATTRACTIONS_MANAGE);

    const body = await request.json();
    const input = layoutInputSchema.parse(body);

    const layout = await prisma.seatLayout.create({
      data: {
        name: input.name,
        // Total seats are derived from the geometry so they always agree.
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

    return created(toManagedLayout(layout), "Layout created.");
  } catch (error) {
    return handleApiError(error);
  }
}
