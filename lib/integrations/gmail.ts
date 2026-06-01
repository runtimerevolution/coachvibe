import type { IntegrationConnection } from "./types";

/** Base64url-encode a UTF-8 string (Gmail expects the RFC 2822 message this way). */
function toBase64Url(raw: string): string {
  return Buffer.from(raw, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export interface GmailDraft {
  id: string;
}

/**
 * Create a Gmail draft. This does NOT send anything — it only saves a draft,
 * which is why Gmail is surfaced as "Draft only" in the UI.
 *
 * If `to` is omitted the draft has no recipient and simply lands in the coach's
 * own Drafts folder (the safe default used by the pre-session-brief workflow).
 */
export async function createDraft(
  conn: IntegrationConnection,
  { to, subject, body }: { to?: string; subject: string; body: string }
): Promise<GmailDraft> {
  const headers: string[] = [];
  if (to) headers.push(`To: ${to}`);
  headers.push(`Subject: ${subject}`);
  headers.push("Content-Type: text/plain; charset=utf-8");
  const mime = [...headers, "", body].join("\r\n");

  const res = await conn.nango.post<{ id: string }>({
    endpoint: "/gmail/v1/users/me/drafts",
    providerConfigKey: conn.providerConfigKey,
    connectionId: conn.connectionId,
    data: { message: { raw: toBase64Url(mime) } },
    retries: 2,
  });

  return { id: res.data.id };
}
