-- AlterTable: Make password optional (needed for Google OAuth users who have no password)
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

-- AddColumn: provider (defaults to 'local' for all existing users)
ALTER TABLE "users" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'local';

-- AddColumn: providerId (nullable, used for Google OAuth user ID)
ALTER TABLE "users" ADD COLUMN "providerId" TEXT;
