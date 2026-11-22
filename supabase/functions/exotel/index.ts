// Exotel webhook for the clinic line.
// Flow in Exotel:  Greeting -> Passthru (?event=start) -> Connect (her phone) -> Passthru (?event=end)
// Both Passthru URLs: https://<project>.supabase.co/functions/v1/exotel?t=<clinic webhook token>&event=start|end
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { applyEvent, readEvent, type Call, type Lead, type Patient } from "../_shared/calls.ts";
import { sendToClinic } from "../_shared/push.ts";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

async function params(req: Request) {
  const q: Record<string, string> = Object.fromEntries(new URL(req.url).searchParams);
  if (req.method === "POST") {
    const ct = req.headers.get("content-type") ?? "";
    try {
      if (ct.includes("json")) Object.assign(q, await req.json());
      else Object.assign(q, Object.fromEntries(await req.formData()));
    } catch { /* empty body is fine */ }
  }
  for (const k of Object.keys(q)) q[k] = String(q[k]);
  return q;
}

const later = (p: Promise<unknown>) => {
  const rt = (globalThis as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } }).EdgeRuntime;
  if (rt) rt.waitUntil(p); else p.catch(console.error);
};

Deno.serve(async (req) => {
  const q = await params(req);
  if (!q.t) return new Response("missing token", { status: 401 });
  const { data: clinic } = await sb.from("clinics").select("id,connect_to").eq("webhook_token", q.t).maybeSingle();
  if (!clinic) return new Response("unknown clinic", { status: 401 });

  const ev = readEvent(q);
  const [{ data: prevRow }, { data: pats }, { data: lds }] = await Promise.all([
    sb.from("records").select("data").eq("clinic_id", clinic.id).eq("kind", "calls").eq("id", ev.sid).maybeSingle(),
    sb.from("records").select("data").eq("clinic_id", clinic.id).eq("kind", "patients"),
    sb.from("records").select("data").eq("clinic_id", clinic.id).eq("kind", "leads"),
  ]);
  const { call, lead, push } = applyEvent(
    (prevRow?.data as Call) ?? null, ev,
    (pats ?? []).map((r) => r.data as Patient), (lds ?? []).map((r) => r.data as Lead), q,
  );

  const rows = [{ clinic_id: clinic.id, kind: "calls", id: call.id, data: call }];
  if (lead) rows.push({ clinic_id: clinic.id, kind: "leads", id: lead.id, data: lead as unknown as Call });
  const { error } = await sb.from("records").upsert(rows, { onConflict: "clinic_id,kind,id" });
  if (error) console.error("save failed", error.message);

  later(sendToClinic(sb, clinic.id, push));

  // For a Connect applet "dial whom" URL this body is the number to ring; Passthru ignores it.
  return new Response(clinic.connect_to ?? "ok", { status: 200, headers: { "content-type": "text/plain" } });
});
