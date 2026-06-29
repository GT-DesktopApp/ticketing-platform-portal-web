import { created, fail, handleApiError, HttpStatus, ok } from "@/lib/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createCustomerSchema } from "@/modules/pos/schemas/booking.schema";

/**
 * GET /api/customers?search=...
 * Debounced customer lookup for the Customer step — matches name OR mobile.
 * Returns a small capped list (autocomplete, not a full table).
 */
export async function GET(request: Request) {
  try {
    await requirePermission(PERMISSIONS.CUSTOMERS_VIEW);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() ?? "";

    const customers = await prisma.customer.findMany({
      where: {
        isActive: true,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { mobile: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
      take: 10,
    });

    return ok(customers, "Customers loaded.");
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/customers — Add New Customer.
 */
export async function POST(request: Request) {
  try {
    await requirePermission(PERMISSIONS.CUSTOMERS_CREATE);
    const body = await request.json();
    const input = createCustomerSchema.parse(body);

    // Friendly conflict if the mobile already exists (unique constraint).
    const existing = await prisma.customer.findUnique({
      where: { mobile: input.mobile },
    });
    if (existing) {
      return fail("A customer with this mobile number already exists.", {
        status: HttpStatus.CONFLICT,
      });
    }

    const customer = await prisma.customer.create({
      data: {
        name: input.name,
        mobile: input.mobile,
        email: input.email || null,
        notes: input.notes || null,
      },
    });

    return created(customer, "Customer created.");
  } catch (error) {
    return handleApiError(error);
  }
}
