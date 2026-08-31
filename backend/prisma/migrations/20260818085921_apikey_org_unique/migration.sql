/*
  Warnings:

  - A unique constraint covering the columns `[organizationId]` on the table `ApiKey` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_organizationId_key" ON "ApiKey"("organizationId");
