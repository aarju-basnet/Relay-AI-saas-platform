-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('PAGE_VIEW', 'CHAT_OPENED', 'CHAT_CLOSED', 'MESSAGE_SENT', 'MESSAGE_RECEIVED', 'HELPFUL_CLICKED', 'PURCHASE', 'LEAD_GENERATED', 'BUTTON_CLICKED', 'FILE_UPLOADED', 'KNOWLEDGE_FAILED', 'HUMAN_HANDOFF');

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "event" "AnalyticsEventType" NOT NULL,
    "page" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
