// Request parsing and signature checks shared by call webhooks.
/** Flattens query string, form body or JSON body (including Edesy's {event, data:{...}}) into one map. */
export function flatten(query: URLSearchParams, raw: string, contentType: string) {
  const q: Record<string, string> = Object.fromEntries(query);
  if (!raw) return q;
  let body: Record<string, unknown> = {};
  try {
    body = contentType.includes("json") || raw.trim().startsWith("{") ? JSON.parse(raw) : Object.fromEntries(new URLSearchParams(raw));
  } catch { return q; }
  const add = (o: Record<string, unknown>) => {
    for (const [k, v] of Object.entries(o)) if (v !== null && typeof v !== "object") q[k] = String(v);
  };
  add(body);
  if (body.data && typeof body.data === "object") add(body.data as Record<string, unknown>);
  return q;
}

export async function hmacHex(secret: string, raw: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export const same = (a: string, b: string) => a.length === b.length && [...a].reduce((d, c, i) => d | (c.charCodeAt(0) ^ b.charCodeAt(i)), 0) === 0;

