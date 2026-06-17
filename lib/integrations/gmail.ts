import type { IntegrationConnection } from "./types";

/** Base64url-encode a UTF-8 string (Gmail expects the RFC 2822 message this way). */
function toBase64Url(raw: string): string {
  return Buffer.from(raw, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** RFC 2047 encode a header value as a UTF-8 base64 "encoded-word" if it has non-ASCII. */
function encodeHeaderWord(value: string): string {
  let isAscii = true;
  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) > 0x7f) {
      isAscii = false;
      break;
    }
  }
  if (isAscii) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf-8").toString("base64")}?=`;
}

/** Wrap a base64 string at 76 chars per line (RFC 2045, for the message body). */
function wrap76(b64: string): string {
  return (b64.match(/.{1,76}/g) ?? []).join("\r\n");
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
  // Headers must be ASCII — non-ASCII subjects use RFC 2047 encoded-words. The body
  // is sent base64 with charset=utf-8 so every character renders cleanly everywhere.
  const headers = [
    ...(to ? [`To: ${to}`] : []),
    `Subject: ${encodeHeaderWord(subject)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: base64",
  ];
  const encodedBody = wrap76(Buffer.from(body, "utf-8").toString("base64"));
  const mime = `${headers.join("\r\n")}\r\n\r\n${encodedBody}`;

  const res = await conn.nango.post<{ id: string }>({
    endpoint: "/gmail/v1/users/me/drafts",
    providerConfigKey: conn.providerConfigKey,
    connectionId: conn.connectionId,
    data: { message: { raw: toBase64Url(mime) } },
    retries: 2,
  });

  return { id: res.data.id };
}
