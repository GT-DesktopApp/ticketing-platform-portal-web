-- CreateEnum
CREATE TYPE "bogie_status" AS ENUM ('ACTIVE', 'LOCKED', 'FULL');

-- CreateEnum
CREATE TYPE "seat_status" AS ENUM ('AVAILABLE', 'OCCUPIED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "booking_status" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('CASH', 'CARD', 'UPI');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "attractions" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "base_rate_paise" INTEGER NOT NULL,
    "duration_min" INTEGER,
    "seats_per_trip" INTEGER,
    "requires_seats" BOOLEAN NOT NULL DEFAULT false,
    "open_time" TEXT,
    "close_time" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attractions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_categories" (
    "id" UUID NOT NULL,
    "attraction_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "price_paise" INTEGER NOT NULL,
    "note" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bogies" (
    "id" UUID NOT NULL,
    "attraction_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "status" "bogie_status" NOT NULL DEFAULT 'LOCKED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bogies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seats" (
    "id" UUID NOT NULL,
    "bogie_id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "status" "seat_status" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "booking_no" TEXT NOT NULL,
    "attraction_id" UUID NOT NULL,
    "customer_id" UUID,
    "status" "booking_status" NOT NULL DEFAULT 'PENDING',
    "is_complimentary" BOOLEAN NOT NULL DEFAULT false,
    "pass_reference" TEXT,
    "subtotal_paise" INTEGER NOT NULL,
    "tax_paise" INTEGER NOT NULL DEFAULT 0,
    "round_off_paise" INTEGER NOT NULL DEFAULT 0,
    "total_paise" INTEGER NOT NULL,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_items" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "ticket_category_id" UUID NOT NULL,
    "category_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_paise" INTEGER NOT NULL,
    "line_total_paise" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seat_assignments" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "seat_id" UUID NOT NULL,
    "passenger_ref" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seat_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "method" "payment_method" NOT NULL,
    "amount_due_paise" INTEGER NOT NULL,
    "amount_paid_paise" INTEGER NOT NULL,
    "change_paise" INTEGER NOT NULL DEFAULT 0,
    "status" "payment_status" NOT NULL DEFAULT 'COMPLETED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attractions_type_idx" ON "attractions"("type");

-- CreateIndex
CREATE INDEX "attractions_is_active_idx" ON "attractions"("is_active");

-- CreateIndex
CREATE INDEX "ticket_categories_attraction_id_idx" ON "ticket_categories"("attraction_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_mobile_key" ON "customers"("mobile");

-- CreateIndex
CREATE INDEX "customers_name_idx" ON "customers"("name");

-- CreateIndex
CREATE INDEX "bogies_attraction_id_sequence_idx" ON "bogies"("attraction_id", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "bogies_attraction_id_label_key" ON "bogies"("attraction_id", "label");

-- CreateIndex
CREATE INDEX "seats_status_idx" ON "seats"("status");

-- CreateIndex
CREATE UNIQUE INDEX "seats_bogie_id_number_key" ON "seats"("bogie_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_booking_no_key" ON "bookings"("booking_no");

-- CreateIndex
CREATE INDEX "bookings_attraction_id_idx" ON "bookings"("attraction_id");

-- CreateIndex
CREATE INDEX "bookings_customer_id_idx" ON "bookings"("customer_id");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "booking_items_booking_id_idx" ON "booking_items"("booking_id");

-- CreateIndex
CREATE INDEX "seat_assignments_booking_id_idx" ON "seat_assignments"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "seat_assignments_seat_id_key" ON "seat_assignments"("seat_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_booking_id_key" ON "payments"("booking_id");

-- AddForeignKey
ALTER TABLE "ticket_categories" ADD CONSTRAINT "ticket_categories_attraction_id_fkey" FOREIGN KEY ("attraction_id") REFERENCES "attractions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bogies" ADD CONSTRAINT "bogies_attraction_id_fkey" FOREIGN KEY ("attraction_id") REFERENCES "attractions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seats" ADD CONSTRAINT "seats_bogie_id_fkey" FOREIGN KEY ("bogie_id") REFERENCES "bogies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_attraction_id_fkey" FOREIGN KEY ("attraction_id") REFERENCES "attractions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_ticket_category_id_fkey" FOREIGN KEY ("ticket_category_id") REFERENCES "ticket_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seat_assignments" ADD CONSTRAINT "seat_assignments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seat_assignments" ADD CONSTRAINT "seat_assignments_seat_id_fkey" FOREIGN KEY ("seat_id") REFERENCES "seats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

