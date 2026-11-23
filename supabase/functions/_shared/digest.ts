// Evening digest: what the doctor should do for tomorrow. Pure logic, tested in digest_test.ts.

export type Rec = { kind: string; data: Record<string, unknown> };

const pad = (n: number) => String(n).padStart(2, "0");

/** Date and minutes-of-day in India (UTC+05:30), whatever the server's own clock zone is. */
export function istNow(nowMs = Date.now()) {
  const d = new Date(nowMs + 330 * 60_000);
  const today = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1));
  const tomorrow = `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
  return { today, tomorrow, minutes: d.getUTCHours() * 60 + d.getUTCMinutes() };
}

const toMin = (hhmm: string) => {
  const [h, m] = String(hhmm || "18:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** Is it time to send today's digest for this clinic? */
export function isDue(remindAt: string | undefined, lastSent: string | null, nowMs = Date.now()) {
  const { today, minutes } = istNow(nowMs);
  if (remindAt === "off") return false;
  return lastSent !== today && minutes >= toMin(remindAt ?? "18:00");
}

export function buildDigest(records: Rec[], nowMs = Date.now()) {
  const { tomorrow } = istNow(nowMs);
  const by = (k: string) => records.filter((r) => r.kind === k).map((r) => r.data);
  const toRemind = by("appts").filter((a) => a.date === tomorrow && a.status === "booked" && !a.rem).length;
  const followUps = by("fus").filter((f) => !f.done && String(f.due) <= tomorrow).length;
  const leads = by("leads").filter((l) => l.status === "new" || l.status === "callback").length;
  const unlabelled = by("calls").filter((c) => c.status === "answered" && !c.outcome).length;
  const total = toRemind + followUps + leads + unlabelled;
  if (!total) return null;
  const parts: string[] = [];
  if (followUps) parts.push(`${followUps} follow-up ${followUps === 1 ? "call" : "calls"}`);
  if (leads) parts.push(`${leads} ${leads === 1 ? "lead" : "leads"} waiting`);
  if (unlabelled) parts.push(`${unlabelled} ${unlabelled === 1 ? "call" : "calls"} to label`);
  const title = toRemind
    ? `Tomorrow: ${toRemind} ${toRemind === 1 ? "patient" : "patients"} to remind`
    : "To-do for tomorrow";
  return { title, body: (parts.length ? parts.join(" · ") + ". " : "") + "Tap to open your list.", url: "#list", tag: "digest" };
}
