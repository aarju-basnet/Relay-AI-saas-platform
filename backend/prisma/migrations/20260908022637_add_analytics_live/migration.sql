-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "analyticsLive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "analyticsLiveSeen" BOOLEAN NOT NULL DEFAULT false;
