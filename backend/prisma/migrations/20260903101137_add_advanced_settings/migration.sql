-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "apiAccess" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "customPrompt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "debugLogs" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "developerMode" BOOLEAN NOT NULL DEFAULT false;
