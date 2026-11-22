import { deepStrictEqual as assertEquals } from "node:assert";
import { flatten, hmacHex, same } from "./webhook.ts";

Deno.test("Edesy nested JSON is flattened, token kept from query", () => {
  const raw = JSON.stringify({ event: "call_tracking.call.completed", data: { call_sid: "CA_1", caller: "+919811122233", status: "completed", duration_sec: 154, attribution: { utm_source: "google" } } });
  const q = flatten(new URLSearchParams("t=tok"), raw, "application/json");
  assertEquals([q.t, q.event, q.call_sid, q.caller, q.duration_sec, "attribution" in q], ["tok", "call_tracking.call.completed", "CA_1", "+919811122233", "154", false]);
});
Deno.test("Exotel form body and query both read", () => {
  const q = flatten(new URLSearchParams("t=tok&event=end"), "CallSid=c1&CallFrom=09811122233&DialCallDuration=60", "application/x-www-form-urlencoded");
  assertEquals([q.event, q.CallSid, q.CallFrom, q.DialCallDuration], ["end", "c1", "09811122233", "60"]);
});
Deno.test("signature matches Node's HMAC-SHA256 and comparison is exact", async () => {
  const { createHmac } = await import("node:crypto");
  const raw = '{"a":1}';
  assertEquals(await hmacHex("secret", raw), createHmac("sha256", "secret").update(raw).digest("hex"));
  assertEquals(same("sha256=ab", "sha256=ab"), true);
  assertEquals(same("sha256=ab", "sha256=ac"), false);
  assertEquals(same("sha256=ab", "sha256=abc"), false);
});
