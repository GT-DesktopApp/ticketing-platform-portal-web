import { created, fail, handleApiError, HttpStatus, ok } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createTicketProductSchema } from "@/modules/pos/schemas/booking.schema";

/** The single system attraction every catalog product belongs to. */
const CATALOG_NAME = "Catalog";

/**
 * Find the catalog attraction, optionally with its active products filtered by a
 * name search. The booking screen is a flat product grid, so the products live
 * under this one attraction.
 */
async function findCatalog(search?: string) {
  return prisma.attraction.findFirst({
    where: { name: CATALOG_NAME, isActive: true },
    include: {
      categories: {
        where: {
          isActive: true,
          ...(search
            ? { name: { contains: search, mode: "insensitive" } }
            : {}),
        },
        orderBy: { sortOrder: "asc" },
        include: { categoryType: { select: { id: true, name: true } } },
      },
    },
  });
}

/** Shape the catalog row for the client (`categories` → `ticketProducts`). */
function toClient(
  catalog: NonNullable<Awaited<ReturnType<typeof findCatalog>>>,
) {
  const { categories, ...attraction } = catalog;
  return { ...attraction, ticketProducts: categories };
}

/**
 * GET /api/attractions
 *
 * Returns the flat product catalog: a single attraction whose `ticketProducts`
 * are the cards shown in the booking grid (name / category type / sales price /
 * barcode / image). A `?search=` query filters the products by name.
 *
 * The response is still a one-element attractions array so the existing
 * `useAttractions()` hook + cart store keep working unchanged.
 */
export async function GET(request: Request) {
  try {
    await requirePermission(PERMISSIONS.ATTRACTIONS_VIEW);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();

    const catalog = await findCatalog(search);
    const attractions = catalog ? [toClient(catalog)] : [];

    return ok(attractions, "Attractions loaded.");
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
