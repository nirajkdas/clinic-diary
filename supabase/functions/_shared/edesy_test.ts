import { deepStrictEqual as assertEquals } from "node:assert";
import { fetchLogs, logTime, logToEvent } from "./edesy.ts";
import { applyEvent, readEvent } from "./calls.ts";

Deno.test("answered forwarded call becomes an answered call", () => {
  const q = logToEvent({ id: 41, caller_number: "8400025459", status: "completed", duration_sec: 50, answered_at: "2026-11-23T10:29:10Z" })!;
  const r = applyEvent(null, readEvent(q), [], [], q);
  assertEquals([r.call.id, r.call.status, r.call.dur, r.call.phone, r.lead], ["E41", "answered", 50, "8400025459", null]);
});

Deno.test("unanswered / busy / cancelled / invalid become missed calls with a lead", () => {
  for (const status of ["no-answer", "busy", "canceled", "failed", "Invalid number"]) {
    const q = logToEvent({ id: 7, caller_number: "+918400025459", status, duration_sec: 0 })!;
    const r = applyEvent(null, readEvent(q), [], [], q);
    assertEquals([status, r.call.status, r.lead?.phone], [status, "missed", "8400025459"]);
  }
});

Deno.test("completed with zero talk time counts as missed", () => {
  const q = logToEvent({ id: 8, caller_number: "8400025459", status: "completed", duration_sec: 0, answered_at: null })!;
  assertEquals(applyEvent(null, readEvent(q), [], [], q).call.status, "missed");
});

Deno.test("calls still in progress are skipped until they finish", () => {
  for (const status of ["initiated", "ringing", "in-progress"]) assertEquals(logToEvent({ id: 1, status }), null);
});

Deno.test("start time comes from started_at", () => {
  assertEquals(logTime({ id: 1, started_at: "2026-11-23T10:29:00Z" }), Date.parse("2026-11-23T10:29:00Z"));
});

Deno.test("fetchLogs reads {data:[...]} pages with the API key", async () => {
  const seen: string[] = [];
  const fake = (async (u: URL, init: RequestInit) => {
    seen.push(String(u) + " " + (init.headers as Record<string, string>).authorization);
    return new Response(JSON.stringify({ data: [{ id: 1, caller_number: "1", status: "completed" }], meta: {} }));
  }) as unknown as typeof fetch;
  const rows = await fetchLogs("sk_test", "2026-11-23T00:00:00Z", fake);
  assertEquals(rows.length, 1);
  assertEquals(seen[0].includes("start_date=2026-11-23T00%3A00%3A00Z") && seen[0].endsWith("Bearer sk_test"), true);
});

Deno.test("a network caller name in the log is shown when the number is unknown", () => {
  const q = logToEvent({ id: 9, caller_number: "8400025459", status: "no-answer", caller_name: "SANJAY KUMAR" })!;
  const r = applyEvent(null, readEvent(q), [], [], q);
  assertEquals([r.call.name, r.lead?.name, r.push.title], ["SANJAY KUMAR", "SANJAY KUMAR", "Missed call: SANJAY KUMAR (84000 25459)"]);
});
