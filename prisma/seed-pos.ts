/**
 * POS demo seed — flat product catalog.
 *
 * The Ticket Booking screen is a single flat grid of purchasable products (the
 * `image.png` reference): each card has Category Name, Category Type, Sales
 * Price, Barcode and Image, and clicking it adds it straight to the cart.
 *
 * To keep the proven checkout / billing / booking-item machinery intact (those
 * price off `TicketCategory` rows scoped to one `attractionId`), every product
 * lives under ONE system attraction, "Catalog". Its `TicketCategory` rows ARE
 * the cards — so the two-level DB relations stay, but the UI is flat.
 *
 * Idempotent: re-running wipes the old attractions (only when no booking history
 * references them) and recreates the catalog + products. Run with:
 *   npx tsx prisma/seed-pos.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** The single system attraction every product belongs to. */
const CATALOG_NAME = "Catalog";

/** Category types shown in the New Category dialog dropdown + on each card. */
const CATEGORY_TYPES = [
  "Toy Train (Regular)",
  "Toy Train (VIP)",
  "Paddle Boat",
];

interface ProductSeed {
  name: string;
  /** Sales price in PAISE (e.g. ₹33.275 → 3328). */
  pricePaise: number;
  /** Category-type name, resolved to an id at seed time. */
  categoryType: string;
  barcode?: string;
  /** Image URL/path; null renders the placeholder tile (matches the reference). */
  image?: string | null;
  sacCode?: string;
}

/**
 * The products from the `image.png` reference. Prices are the rupee values shown
 * on the cards, converted to paise (₹33.275 → 3328, ₹66.55 → 6655, …).
 */
const PRODUCTS: ProductSeed[] = [
  {
    name: "Indian kids (2way)",
    pricePaise: 3328,
    categoryType: "Toy Train (Regular)",
    barcode: "IND-KID",
    sacCode: "996411",
  },
  {
    name: "Indian (2way)",
    pricePaise: 6655,
    categoryType: "Toy Train (Regular)",
    barcode: "IND-ADT",
    sacCode: "996411",
  },
  {
    name: "FOREIGNER S. (2way)",
    pricePaise: 6655,
    categoryType: "Toy Train (Regular)",
    barcode: "FRN-STD",
    sacCode: "996411",
  },
  {
    name: "FOREIGER B. (2way)",
    pricePaise: 13310,
    categoryType: "Toy Train (Regular)",
    barcode: "FRN-BIG",
    sacCode: "996411",
  },
  {
    name: "VIP COUPLE IND (2way)",
    pricePaise: 18150,
    categoryType: "Toy Train (VIP)",
    barcode: "VIP-CPL",
    sacCode: "996411",
  },
  {
    name: "Paddle Boat 2",
    pricePaise: 6655,
    categoryType: "Paddle Boat",
    barcode: "BOAT-2",
    sacCode: "996411",
  },
  {
    name: "Paddle Boat 4",
    pricePaise: 13310,
    categoryType: "Paddle Boat",
    barcode: "BOAT-4",
    sacCode: "996411",
  },
];

/**
 * Remove every existing attraction (cascades to its ticket categories / bogies /
 * seats). Guarded: if any booking history references a ticket category we must
 * NOT delete it — deactivate those attractions instead so FKs stay valid.
 */
async function wipeAttractions() {
  const referenced = await prisma.bookingItem.count();
  if (referenced > 0) {
    await prisma.attraction.updateMany({ data: { isActive: false } });
    console.log(
      `  ! ${referenced} booking item(s) exist — deactivated old attractions instead of deleting.`,
    );
    return;
  }
  const { count } = await prisma.attraction.deleteMany({});
  console.log(`  ✓ wiped ${count} existing attraction(s) (cascade)`);
}

async function main() {
  console.log("Seeding POS flat catalog…");

  await wipeAttractions();

  // Category types (for the New Category dialog + the card's "type" line).
  const categoryTypeIds = new Map<string, string>();
  for (const name of CATEGORY_TYPES) {
    const existing = await prisma.categoryType.findUnique({ where: { name } });
    const row =
      existing ?? (await prisma.categoryType.create({ data: { name } }));
    categoryTypeIds.set(name, row.id);
  }
  console.log(`  ✓ ${CATEGORY_TYPES.length} category types`);

  // The single catalog attraction that holds every product.
  const catalog =
    (await prisma.attraction.findFirst({ where: { name: CATALOG_NAME } })) ??
    (await prisma.attraction.create({
      data: {
        name: CATALOG_NAME,
        type: "Catalog",
        bookingType: "CATEGORY",
        baseRatePaise: 0,
        requiresSeats: false,
        isActive: true,
      },
    }));

  // Products (TicketCategory rows under the catalog). Upsert by name so re-runs
  // don't duplicate; sortOrder preserves the reference ordering.
  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];
    const data = {
      pricePaise: p.pricePaise,
      categoryTypeId: categoryTypeIds.get(p.categoryType) ?? null,
      barcode: p.barcode ?? null,
      image: p.image ?? null,
      sacCode: p.sacCode ?? null,
      sortOrder: i,
      isActive: true,
    };
    const existing = await prisma.ticketCategory.findFirst({
      where: { attractionId: catalog.id, name: p.name },
    });
    if (existing) {
      await prisma.ticketCategory.update({ where: { id: existing.id }, data });
    } else {
      await prisma.ticketCategory.create({
        data: { attractionId: catalog.id, name: p.name, ...data },
      });
    }
  }
  console.log(`  ✓ ${PRODUCTS.length} catalog products`);

  // One sample customer so the lookup has a hit.
  await prisma.customer.upsert({
    where: { mobile: "9999999999" },
    update: {},
    create: { name: "Walk-in Guest", mobile: "9999999999" },
  });

  console.log("POS seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
