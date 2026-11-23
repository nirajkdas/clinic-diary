// Edesy Call Forwarding has no webhooks, so the server polls its call-log API
// (GET https://voice-api.edesy.in/v1/forwarding/call-logs) and turns each finished call
// into the same shape the webhook path uses.

export type EdesyLog = {
  id: string | number; caller_number?: string; status?: string;
  duration_sec?: number; started_at?: string; answered_at?: string | null; ended_at?: string | null; created_at?: string;
};

const FINAL = /completed|no.?answer|busy|failed|cancel|invalid|rejected/i;

/** null while the call is still going (initiated / ringing / in-progress). */
export function logToEvent(l: EdesyLog): Record<string, string> | null {
  const status = String(l.status ?? "").toLowerCase();
  if (!FINAL.test(status)) return null;
  const dur = Number(l.duration_sec ?? 0) || 0;
  const answered = status === "completed" && (dur > 0 || !!l.answered_at);
  return {
    event: "end",
    call_sid: "E" + l.id,
    caller: String(l.caller_number ?? ""),
    status: answered ? "completed" : status === "completed" ? "no-answer" : status,
    duration_sec: String(answered ? Math.max(dur, 1) : 0),
  };
}

/** When the call started, in ms (falls back to created_at, then now). */
export const logTime = (l: EdesyLog) => Date.parse(l.started_at ?? l.created_at ?? "") || Date.now();

export async function fetchLogs(key: string, sinceIso: string, fetcher: typeof fetch = fetch): Promise<EdesyLog[]> {
  const out: EdesyLog[] = [];
  for (let page = 1; page <= 10; page++) {
    const u = new URL("https://voice-api.edesy.in/v1/forwarding/call-logs");
    u.searchParams.set("start_date", sinceIso);
    u.searchParams.set("per_page", "100");
    u.searchParams.set("page", String(page));
    const r = await fetcher(u, { headers: { authorization: "Bearer " + key } });
    if (!r.ok) throw new Error("edesy " + r.status + " " + (await r.text()).slice(0, 200));
    const j = await r.json();
    const rows: EdesyLog[] = Array.isArray(j) ? j : Array.isArray(j?.data) ? j.data : Array.isArray(j?.data?.items) ? j.data.items : [];
    out.push(...rows);
    if (rows.length < 100) break;
  }
  return out;
}
