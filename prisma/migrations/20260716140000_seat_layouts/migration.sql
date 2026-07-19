-- CreateEnum
CREATE TYPE "aisle_position" AS ENUM ('LEFT', 'CENTRE', 'RIGHT', 'DUAL', 'NONE');
CREATE TYPE "aisle_width" AS ENUM ('NARROW', 'MEDIUM', 'WIDE');

-- CreateTable
CREATE TABLE "seat_layouts" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "total_seats" INTEGER NOT NULL,
    "rows" INTEGER NOT NULL,
    "columns_left" INTEGER NOT NULL,
    "columns_right" INTEGER NOT NULL,
    "aisle_position" "aisle_position" NOT NULL DEFAULT 'CENTRE',
    "aisle_width" "aisle_width" NOT NULL DEFAULT 'MEDIUM',
    "vip_rows" JSONB,
    "is_custom" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seat_layouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seat_layouts_is_active_idx" ON "seat_layouts"("is_active");

-- AlterTable: link attraction -> seat layout
ALTER TABLE "attractions" ADD COLUMN "seat_layout_id" UUID;

-- AddForeignKey
ALTER TABLE "attractions" ADD CONSTRAINT "attractions_seat_layout_id_fkey" FOREIGN KEY ("seat_layout_id") REFERENCES "seat_layouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
