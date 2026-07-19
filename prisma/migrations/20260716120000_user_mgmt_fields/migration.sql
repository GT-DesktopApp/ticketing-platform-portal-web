-- AlterTable: add username + mobile to users
ALTER TABLE "users" ADD COLUMN "username" TEXT,
ADD COLUMN "mobile" TEXT;

-- AlterTable: add is_active to roles (default true)
ALTER TABLE "roles" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex: unique username (NULLs allowed, multiple NULLs permitted in Postgres)
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
