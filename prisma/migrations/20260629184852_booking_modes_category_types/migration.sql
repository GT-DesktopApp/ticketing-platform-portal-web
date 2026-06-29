-- CreateEnum
CREATE TYPE "booking_type" AS ENUM ('STANDARD', 'CATEGORY');

-- AlterTable
ALTER TABLE "attractions" ADD COLUMN     "booking_type" "booking_type" NOT NULL DEFAULT 'STANDARD';

-- AlterTable
ALTER TABLE "ticket_categories" ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "category_type_id" UUID;

-- CreateTable
CREATE TABLE "category_types" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_types_name_key" ON "category_types"("name");

-- CreateIndex
CREATE INDEX "ticket_categories_category_type_id_idx" ON "ticket_categories"("category_type_id");

-- AddForeignKey
ALTER TABLE "ticket_categories" ADD CONSTRAINT "ticket_categories_category_type_id_fkey" FOREIGN KEY ("category_type_id") REFERENCES "category_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
