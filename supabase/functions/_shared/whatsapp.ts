// WhatsApp via AiSensy or Interakt (Meta partner, keeps the clinic's WhatsApp Business app working through coexistence).
// - sendMissedCall: one approved template, "busy, we will call you back", via an AiSensy API campaign.
// - parseInbound: pulls {phone, name, text} out of an inbound-message webhook. Accepts Meta's Cloud API
//   shape (entry[].changes[].value.contacts/messages) and AiSensy's own shapes by walking the JSON.

import { norm10 } from "./calls.ts";

export type WaProvider = "aisensy" | "interakt";

/** Sends the approved "busy, we will call you back" template. `campaign` is the AiSensy API campaign
 *  name, or the Interakt template name (optionally "name:lang", default language hi). */
export async function sendMissedCall(
  key: string, campaign: string, phone10: string, clinicName: string, fetcher: typeof fetch = fetch,
  provider: WaProvider = "aisensy",
) {
  if (provider === "interakt") {
    const [name, lang] = campaign.split(":");
    const r = await fetcher("https://api.interakt.ai/v1/public/message/", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Basic " + key.replace(/^Basic\s+/i, "") },
      body: JSON.stringify({
        countryCode: "+91",
        phoneNumber: norm10(phone10),
        callbackData: "missed-call",
        type: "Template",
        template: { name: name.trim(), languageCode: (lang || "hi").trim(), bodyValues: [clinicName] },
      }),
    });
    const text = await r.text();
    if (!r.ok || /"result"\s*:\s*false/.test(text)) throw new Error("interakt " + r.status + " " + text.slice(0, 200));
    return text;
  }
  const r = await fetcher("https://backend.aisensy.com/campaign/t1/api/v2", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      apiKey: key,
      campaignName: campaign,
      destination: "+91" + norm10(phone10),
      userName: "Patient",
      source: "missed-call",
      templateParams: [clinicName],
    }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error("aisensy " + r.status + " " + text.slice(0, 200));
  return text;
}

export type Inbound = { phone: string; name: string; text: string };

/** Finds every inbound WhatsApp user in a webhook body, whatever the wrapper looks like. */
export function parseInbound(body: unknown): Inbound[] {
  const out = new Map<string, Inbound>();
  const add = (phone: unknown, name: unknown, text: unknown) => {
    const p = norm10(phone);
    if (p.length !== 10) return;
    const prev = out.get(p);
    const n = String(name ?? "").trim();
    const t = String(text ?? "").trim();
    out.set(p, { phone: p, name: n || prev?.name || "", text: t || prev?.text || "" });
  };
  const walk = (v: unknown, depth = 0): void => {
    if (!v || typeof v !== "object" || depth > 12) return;
    if (Array.isArray(v)) { v.forEach((x) => walk(x, depth + 1)); return; }
    const o = v as Record<string, unknown>;
    // Meta Cloud API: value.contacts[{profile:{name}, wa_id}] + value.messages[{from, text:{body}}]
    if (Array.isArray(o.contacts) && Array.isArray(o.messages)) {
      const msgs = o.messages as Record<string, unknown>[];
      for (const c of o.contacts as Record<string, unknown>[]) {
        const id = c.wa_id ?? c.user_id;
        const m = msgs.find((x) => x.from === id) ?? msgs[0];
        const body = (m?.text as Record<string, unknown>)?.body ?? (m?.button as Record<string, unknown>)?.text ?? "";
        add(id, (c.profile as Record<string, unknown>)?.name, body);
      }
    }
    // Interakt: data.customer{channel_phone_number|phone_number, traits.name} + data.message{message}
    if (o.customer && typeof o.customer === "object") {
      const c = o.customer as Record<string, unknown>;
      const ph = c.channel_phone_number ?? c.phone_number;
      const nm = (c.traits as Record<string, unknown>)?.name ?? c.name;
      const m = o.message as Record<string, unknown> | undefined;
      if (ph && nm && typeof nm === "string") add(ph, nm, m?.message ?? m?.text ?? "");
    }
    // Other providers: a flat object carrying a phone and a profile/user name.
    const phone = o.wa_id ?? o.waId ?? o.phone_number ?? o.phoneNumber ?? o.mobile ?? o.from;
    const name = (o.profile as Record<string, unknown>)?.name ?? o.userName ?? o.profileName ?? o.profile_name ?? o.senderName;
    if (phone && name && typeof name === "string") add(phone, name, (o.text as Record<string, unknown>)?.body ?? o.text ?? o.message);
    for (const k of Object.keys(o)) walk(o[k], depth + 1);
  };
  walk(body);
  return [...out.values()];
}
