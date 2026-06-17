import type { IntegrationConnection } from "./types";

export interface CalendarEvent {
  id: string;
  summary: string;
  /** ISO datetime (timed event) or date (all-day), or null if unknown. */
  start: string | null;
}

interface GoogleApiEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
}

/**
 * Return the coach's next upcoming event on their primary calendar, or null if
 * there are none. Read-only (calendar.events.readonly).
 */
export async function getNextEvent(
  conn: IntegrationConnection
): Promise<CalendarEvent | null> {
  const res = await conn.nango.get<{ items?: GoogleApiEvent[] }>({
    endpoint: "/calendar/v3/calendars/primary/events",
    providerConfigKey: conn.providerConfigKey,
    connectionId: conn.connectionId,
    params: {
      timeMin: new Date().toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "1",
    },
    retries: 2,
  });

  const ev = res.data.items?.[0];
  if (!ev) return null;
  return {
    id: ev.id,
    summary: ev.summary ?? "(no title)",
    start: ev.start?.dateTime ?? ev.start?.date ?? null,
  };
}
