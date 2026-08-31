-- DropIndex
DROP INDEX "ApiKey_organizationId_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "invitePending" BOOLEAN NOT NULL DEFAULT false;
