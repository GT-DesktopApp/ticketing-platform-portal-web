/**
 * POS demo seed — sample attractions, visitor categories, bogies + seats.
 *
 * Idempotent: re-running upserts attractions by a stable name and only creates
 * bogies/seats when missing. Run with:  npx tsx prisma/seed-pos.ts
 *
 * Kept separate from the RBAC seed (seed.ts) so the two concerns stay decoupled.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface CategorySeed {
  name: string;
  pricePaise: number;
  category?: string;
  sacCode?: string;
  barcode?: string;
  note?: string;
  /** Category-type name (CATEGORY mode), resolved to an id at seed time. */
  categoryType?: string;
}

/** Category types for the New Category dialog dropdown (CATEGORY-mode tickets). */
const CATEGORY_TYPES = [
  "Toy Train (VIP)",
  "Toy Train (Regular)",
  "Boat",
  "Adventure",
];

interface AttractionSeed {
  name: string;
  type: string;
  bookingType: "STANDARD" | "CATEGORY";
  baseRatePaise: number;
  durationMin?: number;
  seatsPerTrip?: number;
  requiresSeats: boolean;
  openTime: string;
  closeTime: string;
  categories: CategorySeed[];
  /** Bogie labels to create for seated attractions, each with `seatsPerTrip` seats. */
  bogies?: string[];
}

const ATTRACTIONS: AttractionSeed[] = [
  {
    // CATEGORY mode: the attraction's own ticket categories (from the DB),
    // grouped by category type. Rendered as the SAME vertical rows as STANDARD.
    name: "Toy Train – Gulab Garh",
    type: "Ride",
    bookingType: "CATEGORY",
    baseRatePaise: 8000,
    durationMin: 20,
    seatsPerTrip: 24,
    requiresSeats: true,
    openTime: "10:00 AM",
    closeTime: "6:00 PM",
    bogies: ["A", "B", "C"],
    categories: [
      { name: "Indian Kids (2-way)", pricePaise: 3328, sacCode: "996411", barcode: "IND-KID", categoryType: "Toy Train (Regular)" },
      { name: "Indian Adult (2-way)", pricePaise: 6655, sacCode: "996411", barcode: "IND-ADT", categoryType: "Toy Train (Regular)" },
      { name: "Foreigner Adult", pricePaise: 6655, sacCode: "996411", barcode: "FRN-ADT", categoryType: "Toy Train (Regular)" },
      { name: "Foreigner Child", pricePaise: 13310, sacCode: "996411", barcode: "FRN-CHD", categoryType: "Toy Train (Regular)" },
      { name: "VIP Couple", pricePaise: 18150, sacCode: "996411", barcode: "VIP-CPL", categoryType: "Toy Train (VIP)" },
      { name: "VIP Family", pricePaise: 36300, sacCode: "996411", barcode: "VIP-FAM", categoryType: "Toy Train (VIP)" },
      { name: "Boat (2)", pricePaise: 6655, sacCode: "996411", barcode: "BOAT-2", categoryType: "Boat" },
      { name: "Boat (4)", pricePaise: 13310, sacCode: "996411", barcode: "BOAT-4", categoryType: "Boat" },
    ],
  },
  {
    // STANDARD mode: fixed visitor categories.
    name: "Amber Fort",
    type: "Fort",
    bookingType: "STANDARD",
    baseRatePaise: 25000,
    requiresSeats: false,
    openTime: "9:00 AM",
    closeTime: "6:00 PM",
    categories: [
      { name: "Adult", pricePaise: 25000, sacCode: "996412" },
      { name: "Child (5–12 yrs)", pricePaise: 12500, sacCode: "996412" },
      { name: "Senior Citizen (60+ yrs)", pricePaise: 20000, sacCode: "996412" },
      { name: "Student (ID Required)", pricePaise: 10000, sacCode: "996412", note: "ID Required" },
      { name: "Foreigner", pricePaise: 60000, sacCode: "996412" },
    ],
  },
  {
    name: "City Palace",
    type: "Palace",
    bookingType: "STANDARD",
    baseRatePaise: 20000,
    requiresSeats: false,
    openTime: "9:30 AM",
    closeTime: "5:30 PM",
    categories: [
      { name: "Adult", pricePaise: 20000, sacCode: "996412" },
      { name: "Child (5–12 yrs)", pricePaise: 10000, sacCode: "996412" },
      { name: "Foreigner", pricePaise: 50000, sacCode: "996412" },
    ],
  },
  {
    name: "Jaipur Zoo",
    type: "Zoo",
    bookingType: "STANDARD",
    baseRatePaise: 8000,
    requiresSeats: false,
    openTime: "8:00 AM",
    closeTime: "6:00 PM",
    categories: [
      { name: "Adult", pricePaise: 8000, sacCode: "996413" },
      { name: "Child (5–12 yrs)", pricePaise: 4000, sacCode: "996413" },
      { name: "Senior Citizen (60+ yrs)", pricePaise: 6000, sacCode: "996413" },
    ],
  },
];

async function seedAttraction(
  a: AttractionSeed,
  categoryTypeIds: Map<string, string>,
) {
  // Upsert the attraction by name (no natural unique key, so find-or-create).
  const existing = await prisma.attraction.findFirst({ where: { name: a.name } });

  const attraction = existing
    ? await prisma.attraction.update({
        where: { id: existing.id },
        data: {
          type: a.type,
          bookingType: a.bookingType,
          baseRatePaise: a.baseRatePaise,
          durationMin: a.durationMin ?? null,
          seatsPerTrip: a.seatsPerTrip ?? null,
          requiresSeats: a.requiresSeats,
          openTime: a.openTime,
          closeTime: a.closeTime,
          isActive: true,
        },
      })
    : await prisma.attraction.create({
        data: {
          name: a.name,
          type: a.type,
          bookingType: a.bookingType,
          baseRatePaise: a.baseRatePaise,
          durationMin: a.durationMin ?? null,
          seatsPerTrip: a.seatsPerTrip ?? null,
          requiresSeats: a.requiresSeats,
          openTime: a.openTime,
          closeTime: a.closeTime,
        },
      });

  // Ticket products: upsert by (attractionId, name) and prune stale rows so the
  // rename from visitor-categories to products takes effect cleanly.
  const keepNames = new Set(a.categories.map((c) => c.name));
  const existingForAttraction = await prisma.ticketCategory.findMany({
    where: { attractionId: attraction.id },
  });
  // Remove products no longer in the seed (only if not referenced by a booking).
  for (const old of existingForAttraction) {
    if (keepNames.has(old.name)) continue;
    const refs = await prisma.bookingItem.count({
      where: { ticketCategoryId: old.id },
    });
    if (refs === 0) {
      await prisma.ticketCategory.delete({ where: { id: old.id } });
    } else {
      // Referenced by history → deactivate instead of delete.
      await prisma.ticketCategory.update({
        where: { id: old.id },
        data: { isActive: false },
      });
    }
  }

  for (let i = 0; i < a.categories.length; i++) {
    const c = a.categories[i];
    const data = {
      pricePaise: c.pricePaise,
      category: c.category ?? null,
      sacCode: c.sacCode ?? null,
      barcode: c.barcode ?? null,
      categoryTypeId: c.categoryType
        ? (categoryTypeIds.get(c.categoryType) ?? null)
        : null,
      note: c.note ?? null,
      sortOrder: i,
      isActive: true,
    };
    const existingCat = await prisma.ticketCategory.findFirst({
      where: { attractionId: attraction.id, name: c.name },
    });
    if (existingCat) {
      await prisma.ticketCategory.update({
        where: { id: existingCat.id },
        data,
      });
    } else {
      await prisma.ticketCategory.create({
        data: { attractionId: attraction.id, name: c.name, ...data },
      });
    }
  }

  // Bogies + seats for seated attractions (created once, never duplicated).
  if (a.requiresSeats && a.bogies && a.seatsPerTrip) {
    for (let seq = 0; seq < a.bogies.length; seq++) {
      const label = a.bogies[seq];
      const existingBogie = await prisma.bogie.findUnique({
        where: { attractionId_label: { attractionId: attraction.id, label } },
      });
      if (existingBogie) continue;

      const bogie = await prisma.bogie.create({
        data: {
          attractionId: attraction.id,
          label,
          capacity: a.seatsPerTrip,
          sequence: seq,
          status: seq === 0 ? "ACTIVE" : "LOCKED",
        },
      });

      // Seats numbered 1..capacity; even=right, odd=left (matches the grid).
      const seatData = Array.from({ length: a.seatsPerTrip }, (_, n) => {
        const number = n + 1;
        return {
          bogieId: bogie.id,
          number,
          side: number % 2 === 0 ? "right" : "left",
        };
      });
      await prisma.seat.createMany({ data: seatData });
    }
  }

  return attraction;
}

async function main() {
  console.log("Seeding POS demo data…");

  // Category types (for CATEGORY-mode tickets + the dialog dropdown).
  const categoryTypeIds = new Map<string, string>();
  for (const name of CATEGORY_TYPES) {
    const existing = await prisma.categoryType.findUnique({ where: { name } });
    const row =
      existing ??
      (await prisma.categoryType.create({ data: { name } }));
    categoryTypeIds.set(name, row.id);
  }
  console.log(`  ✓ ${CATEGORY_TYPES.length} category types`);

  for (const a of ATTRACTIONS) {
    const at = await seedAttraction(a, categoryTypeIds);
    console.log(`  ✓ ${at.name} (${a.bookingType})`);
  }

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
