import { created, fail, handleApiError, HttpStatus, ok } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createTicketProductSchema } from "@/modules/pos/schemas/booking.schema";
import {
  seatLayoutSelect,
  toSeatLayoutConfig,
} from "@/modules/pos/server/seat-layout";

/** The seed attraction still used as a fallback for the "New Category" POST. */
const CATALOG_NAME = "Catalog";

/**
 * Load all bookable (active) attractions with their active ticket categories,
 * optionally filtered by attraction name. Attractions are managed under the
 * Attraction Management module, so the booking screen and that module share the
 * same source of truth — an attraction deleted there disappears here too.
 *
 * Seated attractions also load their `seatLayout` geometry so the booking flow
 * can render the seat-allocation grid inline (there are no per-seat rows).
 */
async function findBookableAttractions(search?: string) {
  return prisma.attraction.findMany({
    where: {
      isActive: true,
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "asc" },
    include: {
      categories: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { categoryType: { select: { id: true, name: true } } },
      },
      seatLayout: { select: seatLayoutSelect },
    },
  });
}

type BookableAttraction = Awaited<
  ReturnType<typeof findBookableAttractions>
>[number];

/** Shape an attraction for the client (`categories` → `ticketProducts`). */
function toClient(attraction: BookableAttraction) {
  const { categories, seatLayout, ...rest } = attraction;
  return {
    ...rest,
    ticketProducts: categories,
    seatLayout: toSeatLayoutConfig(seatLayout),
  };
}

/**
 * GET /api/attractions
 *
 * Returns every active attraction, each with its `ticketProducts` (the priced
 * visitor/ticket categories). A `?search=` query filters by attraction name.
 * The booking screen picks an attraction and opens its category drawer.
 */
export async function GET(request: Request) {
  try {
    await requirePermission(PERMISSIONS.ATTRACTIONS_VIEW);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();

    const attractions = await findBookableAttractions(search);

    return ok(attractions.map(toClient), "Attractions loaded.");
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/attractions
 *
 * Creates a new catalog product (a `TicketCategory` under the catalog
 * attraction) from the "New Category" dialog. `salesPrice` is in rupees and is
 * stored as paise. The new product appears in the grid as soon as the client
 * refetches.
 */
export async function POST(request: Request) {
  try {
    await requirePermission(PERMISSIONS.ATTRACTIONS_MANAGE);

    const body = await request.json();
    const input = createTicketProductSchema.parse(body);

    const catalog = await prisma.attraction.findFirst({
      where: { name: CATALOG_NAME },
    });
    if (!catalog) {
      return fail("Catalog is not initialised. Run the POS seed first.", {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }

    // Append to the end of the grid (highest sortOrder + 1).
    const last = await prisma.ticketCategory.findFirst({
      where: { attractionId: catalog.id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const product = await prisma.ticketCategory.create({
      data: {
        attractionId: catalog.id,
        name: input.name,
        pricePaise: Math.round(input.salesPrice * 100),
        categoryTypeId: input.categoryTypeId ?? null,
        barcode: input.barcode ?? null,
        image: input.image ?? null,
        sortOrder: (last?.sortOrder ?? -1) + 1,
        isActive: true,
      },
      include: { categoryType: { select: { id: true, name: true } } },
    });

    return created(product, "Product created.");
  } catch (error) {
    return handleApiError(error);
  }
}
