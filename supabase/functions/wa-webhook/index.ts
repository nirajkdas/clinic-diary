// Inbound WhatsApp messages (AiSensy webhook). URL: /functions/v1/wa-webhook?t=<clinic webhook token>
// When a caller replies, their WhatsApp profile name fills the name in the app (if nobody typed one),
// the open lead is marked "Replied on WhatsApp", and the doctor gets a notification.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { norm10 } from "../_shared/calls.ts";
import { parseInbound } from "../_shared/whatsapp.ts";
import { sendToClinic } from "../_shared/push.ts";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

Deno.serve(async (req) => {
  const url = new URL(req.url);
  // Meta-style verification handshake, if the provider asks for it.
  if (req.method === "GET" && url.searchParams.get("hub.challenge")) return new Response(url.searchParams.get("hub.challenge"));
  const t = url.searchParams.get("t");
  if (!t) return new Response("missing token", { status: 401 });
  const { data: clinic } = await sb.from("clinics").select("id").eq("webhook_token", t).maybeSingle();
  if (!clinic) return new Response("unknown clinic", { status: 401 });

  let body: unknown = null;
  try { body = await req.json(); } catch { return new Response("ok"); }
  const people = parseInbound(body);
  for (const p of people) {
    const [{ data: pats }, { data: rows }] = await Promise.all([
      sb.from("records").select("data").eq("clinic_id", clinic.id).eq("kind", "patients"),
      sb.from("records").select("kind,id,data").eq("clinic_id", clinic.id).in("kind", ["leads", "calls"]).eq("data->>phone", p.phone),
    ]);
    const patient = (pats ?? []).map((r) => r.data as { name?: string; phone?: string }).find((x) => norm10(x.phone) === p.phone);
    const typed = (rows ?? []).some((r) => (r.data as { name?: string; nameSrc?: string }).name && (r.data as { nameSrc?: string }).nameSrc !== "whatsapp");
    const useName = !patient && !typed && p.name ? p.name : "";
    const updates: { clinic_id: string; kind: string; id: string; data: unknown }[] = [];
    let openLead = false;
    for (const r of rows ?? []) {
      const d = { ...(r.data as Record<string, unknown>) } as { name?: string; nameSrc?: string; status?: string; replied?: number };
      let changed = false;
      if (useName && d.name !== useName) { d.name = useName; d.nameSrc = "whatsapp"; changed = true; }
      if (r.kind === "leads" && (d.status === "new" || d.status === "callback")) { d.replied = Date.now(); changed = true; openLead = true; }
      if (changed) updates.push({ clinic_id: clinic.id, kind: r.kind, id: r.id, data: d });
    }
    if (!rows?.length) {
      // A brand-new WhatsApp enquiry (no call yet): make it a lead so it isn't missed.
      updates.push({ clinic_id: clinic.id, kind: "leads", id: "W" + p.phone + "-" + Date.now(), data: {
        id: "W" + p.phone + "-" + Date.now(), phone: p.phone, name: patient?.name || p.name, nameSrc: patient ? undefined : "whatsapp",
        src: "whatsapp", at: Date.now(), status: "new", tries: 0, note: p.text.slice(0, 140), replied: Date.now(),
      } });
      openLead = true;
    }
    if (updates.length) await sb.from("records").upsert(updates, { onConflict: "clinic_id,kind,id" });
    if (openLead) {
      const who = (patient?.name || useName || p.name || "") ;
      const num = p.phone.slice(0, 5) + " " + p.phone.slice(5);
      await sendToClinic(sb, clinic.id, {
        title: "WhatsApp reply: " + (who ? who + " (" + num + ")" : num),
        body: p.text ? p.text.slice(0, 120) : "Open WhatsApp to read it.",
        url: "#calls", tag: "wa-" + p.phone,
      });
    }
  }
  return new Response("ok");
});
