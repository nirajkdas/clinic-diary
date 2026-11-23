// Pure logic for turning an Exotel webhook into call / lead records. No I/O here, so it is easy to test.

export const norm10 = (p: unknown) => {
  let d = String(p ?? "").replace(/\D/g, "");
  if (d.length === 11 && d[0] === "0") d = d.slice(1);
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  return d.slice(-10);
};

export type Call = {
  id: string; phone: string; at: number; status: "ringing" | "answered" | "missed";
  dur: number; outcome: string | null; pid?: string; name?: string; rec?: string; raw?: Record<string, string>;
};
export type Lead = { id: string; phone: string; name: string; src: string; at: number; status: string; tries: number; note: string };
export type Patient = { id: string; name: string; phone: string };

const pick = (q: Record<string, string>, ...keys: string[]) => {
  for (const k of keys) for (const [kk, v] of Object.entries(q)) if (kk.toLowerCase() === k.toLowerCase() && v) return v;
  return "";
};

/** Providers name fields differently (Exotel: CallFrom/DialCallStatus, Edesy: caller/status/duration_sec); accept all. */
export function readEvent(q: Record<string, string>) {
  const sid = pick(q, "CallSid", "call_sid", "callsid") || crypto.randomUUID();
  const from = norm10(pick(q, "CallFrom", "From", "caller", "caller_number", "from_number", "SourceNumber"));
  const event = (pick(q, "event") || "end").toLowerCase();
  const status = pick(q, "DialCallStatus", "Status", "CallStatus", "CallType").toLowerCase();
  const dur = Number(pick(q, "DialCallDuration", "ConversationDuration", "duration_sec", "Duration") || 0) || 0;
  const rec = pick(q, "RecordingUrl", "recording_url");
  const netName = pick(q, "caller_name", "cnap_name", "calling_name", "CallerName", "cnam").trim();
  const missedWords = /no-answer|busy|failed|incomplete|client-hangup|canceled|cancelled|missed/;
  const answered = status === "answered" || (dur > 0 && !missedWords.test(status)) || (status === "completed" && dur > 0);
  return { sid, from, event, status, dur, rec, answered, netName };
}

export function applyEvent(
  prev: Call | null, ev: ReturnType<typeof readEvent>, patients: Patient[], leads: Lead[], raw: Record<string, string>, now = Date.now(),
  pastCalls: Call[] = [],
) {
  const call: Call = prev ?? { id: ev.sid, phone: ev.from, at: now, status: "ringing", dur: 0, outcome: null };
  if (!call.phone && ev.from) call.phone = ev.from;
  const pat = patients.find((p) => norm10(p.phone) === call.phone);
  if (pat) call.pid = pat.id;
  // A name the doctor typed earlier for this number (on a lead or a call) is reused when it isn't a patient yet.
  const typed = [...leads, ...pastCalls]
    .filter((x) => x.name && norm10(x.phone) === call.phone)
    .sort((a, b) => (b.at ?? 0) - (a.at ?? 0))[0]?.name;
  const known = pat?.name || typed || ev.netName || "";
  if (known && !pat) call.name = known;
  let lead: Lead | null = null;
  if (ev.event !== "start") {
    call.status = ev.answered ? "answered" : "missed";
    call.dur = ev.dur;
    if (ev.rec) call.rec = ev.rec;
    const { t: _t, ...rest } = raw;
    call.raw = rest;
    if (!ev.answered) {
      const open = leads.find((l) => norm10(l.phone) === call.phone && (l.status === "new" || l.status === "callback"));
      if (!open) {
        lead = { id: "L" + call.id, phone: call.phone, name: known, src: "missed", at: now, status: "new", tries: 0, note: pat ? "Existing patient" : "" };
      }
    }
  }
  const num = call.phone ? call.phone.slice(0, 5) + " " + call.phone.slice(5) : "";
  const who = known ? known + (num ? " (" + num + ")" : "") : num || "Unknown number";
  const mins = Math.max(1, Math.round(call.dur / 60));
  const push = ev.event === "start"
    ? { title: "Incoming: " + who, body: pat ? "Existing patient" : "New number", url: "#calls", tag: "call-" + call.id }
    : ev.answered
    ? { title: "Talked to " + who + " (" + mins + " min)", body: "What happened? Tap to label this call.", url: "#call-" + call.id, tag: "call-" + call.id }
    : { title: "Missed call: " + who, body: "Tap to send free slots on WhatsApp.", url: "#calls", tag: "call-" + call.id };
  return { call, lead, push };
}
