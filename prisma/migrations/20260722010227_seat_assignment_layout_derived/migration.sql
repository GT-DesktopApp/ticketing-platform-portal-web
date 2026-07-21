-- DropForeignKey
ALTER TABLE "seat_assignments" DROP CONSTRAINT "seat_assignments_seat_id_fkey";

-- DropIndex
DROP INDEX "seat_assignments_seat_id_key";

-- AlterTable
ALTER TABLE "seat_assignments" DROP COLUMN "seat_id",
ADD COLUMN     "attraction_id" UUID NOT NULL,
ADD COLUMN     "seat_label" TEXT NOT NULL,
ADD COLUMN     "seat_number" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "seat_assignments_attraction_id_idx" ON "seat_assignments"("attraction_id");

-- CreateIndex
CREATE UNIQUE INDEX "seat_assignments_attraction_id_seat_number_key" ON "seat_assignments"("attraction_id", "seat_number");

-- AddForeignKey
ALTER TABLE "seat_assignments" ADD CONSTRAINT "seat_assignments_attraction_id_fkey" FOREIGN KEY ("attraction_id") REFERENCES "attractions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

