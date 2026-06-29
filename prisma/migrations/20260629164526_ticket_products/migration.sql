-- AlterTable
ALTER TABLE "ticket_categories" ADD COLUMN     "category" TEXT,
ADD COLUMN     "gst_rate" INTEGER NOT NULL DEFAULT 18,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "sac_code" TEXT;
