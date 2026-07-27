-- CreateTable
CREATE TABLE "Assistant" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Relay AI',
    "purposes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredModel" TEXT NOT NULL DEFAULT 'Auto (free fallback chain)',
    "responseStyle" TEXT NOT NULL DEFAULT 'Friendly',
    "language" TEXT NOT NULL DEFAULT 'English',
    "welcomeMessage" TEXT NOT NULL DEFAULT 'Hello! How can I help you today?',
    "systemPrompt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assistant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Assistant_organizationId_key" ON "Assistant"("organizationId");

-- AddForeignKey
ALTER TABLE "Assistant" ADD CONSTRAINT "Assistant_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
