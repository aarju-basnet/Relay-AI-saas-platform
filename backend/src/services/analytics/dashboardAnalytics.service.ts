import { prisma } from "@/config/postgres";

export interface DashboardAnalytics {
  business: string;
  date: string;

  visitors: number;
  sessions: number;
  pageViews: number;
  clicks: number;
  chats: number;
  messages: number;
  leads: number;
  purchases: number;
}

export async function getDashboardAnalytics(
  organizationId: string,
  startDate: Date
): Promise<DashboardAnalytics> {
  const organization =
    await prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
      select: {
        name: true,
      },
    });

  if (!organization) {
    throw new Error(
      "Organization not found."
    );
  }

  const events =
    await prisma.analyticsEvent.findMany({
      where: {
        organizationId,

        createdAt: {
          gte: startDate,
        },
      },

      select: {
        visitorId: true,
        sessionId: true,
        event: true,
      },
    });

  const visitors = new Set(
    events.map(
      (event) => event.visitorId
    )
  ).size;

  const sessions = new Set(
    events.map(
      (event) => event.sessionId
    )
  ).size;

  const pageViews =
    events.filter(
      (event) =>
        event.event === "PAGE_VIEW"
    ).length;

  const clicks =
    events.filter(
      (event) =>
        event.event ===
        "BUTTON_CLICKED"
    ).length;

  const chats =
    events.filter(
      (event) =>
        event.event ===
        "CHAT_OPENED"
    ).length;

  const messages =
    events.filter(
      (event) =>
        event.event ===
        "MESSAGE_SENT"
    ).length;

  const leads =
    events.filter(
      (event) =>
        event.event ===
        "LEAD_GENERATED"
    ).length;

  const purchases =
    events.filter(
      (event) =>
        event.event ===
        "PURCHASE"
    ).length;

  return {
    business: organization.name,

    date: startDate.toISOString(),

    visitors,
    sessions,
    pageViews,
    clicks,
    chats,
    messages,
    leads,
    purchases,
  };
}