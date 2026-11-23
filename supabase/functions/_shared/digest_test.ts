import { deepStrictEqual as assertEquals } from "node:assert";
import { buildDigest, isDue, istNow } from "./digest.ts";

// 23 Nov 2026, 18:05 IST = 12:35 UTC
const at1805 = Date.UTC(2026, 10, 23, 12, 35);
const at1700 = Date.UTC(2026, 10, 23, 11, 30);

Deno.test("India date and time from a UTC clock", () => {
  assertEquals(istNow(at1805), { today: "2026-11-23", tomorrow: "2026-11-24", minutes: 18 * 60 + 5 });
  // 23:50 IST on 30 Nov rolls tomorrow into December
  assertEquals(istNow(Date.UTC(2026, 10, 30, 18, 20)).tomorrow, "2026-12-01");
});

Deno.test("due once a day, after the chosen time", () => {
  assertEquals(isDue("18:00", null, at1805), true);
  assertEquals(isDue("18:00", "2026-11-23", at1805), false); // already sent today
  assertEquals(isDue("18:00", "2026-11-22", at1700), false); // too early
  assertEquals(isDue(undefined, null, at1805), true); // default 6 PM
  assertEquals(isDue("off", null, at1805), false);
});

Deno.test("digest counts tomorrow's unreminded patients and open work", () => {
  const recs = [
    { kind: "appts", data: { date: "2026-11-24", status: "booked" } },
    { kind: "appts", data: { date: "2026-11-24", status: "booked", rem: true } },
    { kind: "appts", data: { date: "2026-11-24", status: "booked" } },
    { kind: "appts", data: { date: "2026-11-25", status: "booked" } },
    { kind: "fus", data: { due: "2026-11-24", done: false } },
    { kind: "fus", data: { due: "2026-12-24", done: false } },
    { kind: "leads", data: { status: "new" } },
    { kind: "leads", data: { status: "booked" } },
    { kind: "calls", data: { status: "answered", outcome: null } },
  ];
  const d = buildDigest(recs, at1805)!;
  assertEquals(d.title, "Tomorrow: 2 patients to remind");
  assertEquals(d.body, "1 follow-up call · 1 lead waiting · 1 call to label. Tap to open your list.");
  assertEquals(d.url, "#list");
});

Deno.test("nothing to do: no notification", () => {
  assertEquals(buildDigest([{ kind: "appts", data: { date: "2026-11-24", status: "booked", rem: true } }], at1805), null);
});
