import { deepStrictEqual as assertEquals } from "node:assert";
import { parseInbound, sendMissedCall } from "./whatsapp.ts";

Deno.test("Meta Cloud API inbound text gives phone, profile name and text", () => {
  const body = { object: "whatsapp_business_account", entry: [{ changes: [{ field: "messages", value: {
    messaging_product: "whatsapp",
    contacts: [{ profile: { name: "Sanjay Kumar" }, wa_id: "918400025459" }],
    messages: [{ from: "918400025459", id: "wamid.1", type: "text", text: { body: "Kal aa jaunga" } }],
  } }] }] };
  assertEquals(parseInbound(body), [{ phone: "8400025459", name: "Sanjay Kumar", text: "Kal aa jaunga" }]);
});

Deno.test("flat provider payload with userName and phone_number", () => {
  const body = { topic: "message.sender.user", data: { message: { phone_number: "+918400025459", userName: "Pinki", text: "hello" } } };
  assertEquals(parseInbound(body), [{ phone: "8400025459", name: "Pinki", text: "hello" }]);
});

Deno.test("status-only webhooks give nothing", () => {
  const body = { entry: [{ changes: [{ value: { statuses: [{ id: "wamid.1", status: "delivered", recipient_id: "918400025459" }] } }] }] };
  assertEquals(parseInbound(body), []);
});

Deno.test("send uses the API campaign with +91 number and clinic name", async () => {
  let sent: Record<string, unknown> = {};
  const fake = (async (_u: string, init: RequestInit) => { sent = JSON.parse(String(init.body)); return new Response('{"success":true}'); }) as unknown as typeof fetch;
  await sendMissedCall("k", "missed_call_busy", "08400025459", "Gupta Dental Care & Hospital", fake);
  assertEquals([sent.apiKey, sent.campaignName, sent.destination, sent.templateParams], ["k", "missed_call_busy", "+918400025459", ["Gupta Dental Care & Hospital"]]);
});
