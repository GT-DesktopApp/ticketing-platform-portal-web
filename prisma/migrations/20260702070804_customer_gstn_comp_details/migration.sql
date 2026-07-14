-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "comp_adult_count" INTEGER,
ADD COLUMN     "comp_child_count" INTEGER,
ADD COLUMN     "discount_percent" INTEGER,
ADD COLUMN     "guest_department" TEXT,
ADD COLUMN     "guest_designation" TEXT,
ADD COLUMN     "guest_mobile" TEXT,
ADD COLUMN     "guest_name" TEXT,
ADD COLUMN     "pass_date" TEXT,
ADD COLUMN     "pass_no" TEXT,
ADD COLUMN     "reference_department" TEXT,
ADD COLUMN     "reference_designation" TEXT,
ADD COLUMN     "reference_mobile" TEXT,
ADD COLUMN     "reference_name" TEXT;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "gstn" TEXT;
