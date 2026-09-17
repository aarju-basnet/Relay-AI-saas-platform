-- CreateEnum
CREATE TYPE "ApiKeyType" AS ENUM ('ANALYTICS', 'ASSISTANT');

-- AlterTable
ALTER TABLE "AnalyticsEvent" ADD COLUMN     "keySource" "ApiKeyType" NOT NULL DEFAULT 'ANALYTICS';

-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN     "type" "ApiKeyType" NOT NULL DEFAULT 'ANALYTICS';
