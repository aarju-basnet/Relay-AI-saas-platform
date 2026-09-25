export interface AnalyticsSummaryData {
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

export function generateRuleBasedSummary(data: AnalyticsSummaryData): string {
  const {
    business,
    visitors,
    sessions,
    pageViews,
    clicks,
    chats,
    messages,
    leads,
    purchases,
  } = data;

  // No traffic at all yet
  if (visitors === 0) {
    return `${business} hasn't had any visitors recorded yet today. Once your widget starts receiving traffic, this summary will update automatically.`;
  }

  const parts: string[] = [];

  // Opening line: visitor + page view summary
  const visitorWord = visitors === 1 ? "visitor" : "visitors";
  const pageWord = pageViews === 1 ? "page view" : "page views";
  parts.push(`${business} had ${visitors} ${visitorWord} and ${pageViews} ${pageWord} today`);

  // Engagement breakdown
  const engagementBits: string[] = [];
  if (clicks > 0) engagementBits.push(`${clicks} button click${clicks === 1 ? "" : "s"}`);
  if (chats > 0) engagementBits.push(`${chats} chat open${chats === 1 ? "" : "s"}`);
  if (messages > 0) engagementBits.push(`${messages} message${messages === 1 ? "" : "s"}`);
  if (leads > 0) engagementBits.push(`${leads} lead${leads === 1 ? "" : "s"}`);
  if (purchases > 0) engagementBits.push(`${purchases} purchase${purchases === 1 ? "" : "s"}`);

  if (engagementBits.length === 0) {
    parts.push(`, with no button clicks, chat opens, messages, leads, or purchases yet`);
  } else {
    parts.push(`, including ${engagementBits.join(", ")}`);
  }

  let summary = parts.join("") + ".";

  // A light observation, only when genuinely worth mentioning
  const pagesPerVisitor = visitors > 0 ? pageViews / visitors : 0;

  if (visitors >= 1 && chats === 0 && messages === 0 && pageViews > 0) {
    summary += ` No one has opened the chat widget yet — worth checking it's visible and working as expected.`;
  } else if (leads > 0 || purchases > 0) {
    summary += ` Visitors are converting into real leads or purchases — worth watching which pages are driving that.`;
  } else if (pagesPerVisitor >= 3) {
    summary += ` Visitors are browsing multiple pages per session, which is a good engagement signal.`;
  } else if (sessions > 0 && visitors > sessions) {
    summary += ` Some sessions may be splitting across visits — normal for early or low-traffic days.`;
  }

  return summary;
}