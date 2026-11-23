import { deepStrictEqual as assertEquals } from "node:assert";
import { applyEvent, norm10, readEvent } from "./calls.ts";

const pats = [{ id: "p1", name: "Ramesh Yadav", phone: "+91 90000 00102" }];

Deno.test("phone numbers normalise", () => {
  assertEquals(norm10("09000000102"), "9000000102");
  assertEquals(norm10("+919000000102"), "9000000102");
  assertEquals(norm10("919000000102"), "9000000102");
});

Deno.test("start event: ringing call, patient recognised, no lead", () => {
  const q = { t: "x", event: "start", CallSid: "c1", CallFrom: "09000000102" };
  const r = applyEvent(null, readEvent(q), pats, [], q, 1000);
  assertEquals(r.call.status, "ringing");
  assertEquals(r.call.pid, "p1");
  assertEquals(r.lead, null);
  assertEquals(r.push.title, "Incoming: Ramesh Yadav");
});

Deno.test("answered call: logged with duration, asks for a label, no lead", () => {
  const q = { t: "x", event: "end", CallSid: "c2", CallFrom: "09811122233", CallType: "completed", DialCallDuration: "185" };
  const r = applyEvent(null, readEvent(q), pats, [], q);
  assertEquals(r.call.status, "answered");
  assertEquals(r.call.dur, 185);
  assertEquals(r.lead, null);
  assertEquals(r.push.url, "#call-c2");
  assertEquals("t" in (r.call.raw ?? {}), false); // token never stored
});

Deno.test("missed call: becomes a new lead", () => {
  const q = { t: "x", event: "end", CallSid: "c3", CallFrom: "09811122233", CallType: "incomplete", DialCallDuration: "0" };
  const r = applyEvent(null, readEvent(q), pats, [], q);
  assertEquals(r.call.status, "missed");
  assertEquals(r.lead?.phone, "9811122233");
  assertEquals(r.lead?.status, "new");
});

Deno.test("missed call from someone with an open lead: no duplicate", () => {
  const q = { t: "x", CallSid: "c4", From: "9811122233", DialCallStatus: "no-answer" };
  const leads = [{ id: "L1", phone: "98111 22233", name: "", src: "missed", at: 0, status: "callback", tries: 1, note: "" }];
  const r = applyEvent(null, readEvent(q), pats, leads, q);
  assertEquals(r.call.status, "missed");
  assertEquals(r.lead, null);
});

Deno.test("start then end updates the same call", () => {
  const s = { t: "x", event: "start", CallSid: "c5", CallFrom: "09000000102" };
  const first = applyEvent(null, readEvent(s), pats, [], s, 500).call;
  const e = { t: "x", event: "end", CallSid: "c5", CallType: "completed", DialCallDuration: "60", RecordingUrl: "https://rec/1.mp3" };
  const r = applyEvent(first, readEvent(e), pats, [], e);
  assertEquals(r.call.at, 500);
  assertEquals(r.call.status, "answered");
  assertEquals(r.call.rec, "https://rec/1.mp3");
  assertEquals(r.call.phone, "9000000102");
});

Deno.test("Edesy payload: answered and unanswered calls", () => {
  const ans = { t: "x", event: "end", call_sid: "CA_1", caller: "+919811122233", status: "completed", duration_sec: "154" };
  const a = applyEvent(null, readEvent(ans), pats, [], ans);
  assertEquals([a.call.status, a.call.dur, a.call.phone, a.lead], ["answered", 154, "9811122233", null]);
  const miss = { t: "x", event: "end", call_sid: "CA_2", caller: "+919811122244", status: "no-answer", duration_sec: "0" };
  const m = applyEvent(null, readEvent(miss), pats, [], miss);
  assertEquals([m.call.status, m.lead?.phone], ["missed", "9811122244"]);
  const busy = { t: "x", call_sid: "CA_3", caller: "+919811122255", status: "busy" };
  assertEquals(applyEvent(null, readEvent(busy), pats, [], busy).call.status, "missed");
});

Deno.test("Edesy call.completed sample (from / duration fields)", () => {
  const q = { t: "x", event: "end", call_sid: "CA1234567890abcdef", from: "+919876543210", to: "+911234567890", status: "completed", duration: "125" };
  const r = applyEvent(null, readEvent(q), pats, [], q);
  assertEquals([r.call.status, r.call.dur, r.call.phone], ["answered", 125, "9876543210"]);
});

Deno.test("a name typed earlier for a number is reused on its next call and lead", () => {
  const q = { t: "x", call_sid: "CA9", from: "+919811100000", status: "no-answer", duration: "0" };
  const past = [{ id: "c0", phone: "9811100000", at: 1, status: "answered" as const, dur: 60, outcome: "enquiry", name: "Sanjay Kumar" }];
  const r = applyEvent(null, readEvent(q), pats, [], q, 5, past);
  assertEquals([r.call.name, r.lead?.name, r.push.title], ["Sanjay Kumar", "Sanjay Kumar", "Missed call: Sanjay Kumar"]);
});
