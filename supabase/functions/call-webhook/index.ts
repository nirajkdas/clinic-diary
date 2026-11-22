// Call webhook for the clinic line. Works with:
//  - Edesy: one signed JSON POST after every call (answered or not). Subscribe this URL with the clinic's
//    webhook token as the signing secret.
//  - Exotel: Passthru applets with ?event=start (while ringing) and ?event=end (after the call).
// URL: https://<project>.supabase.co/functions/v1/call-webhook?t=<clinic webhook token>
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { applyEvent, readEvent, type Call, type Lead, type Patient } from "../_shared/calls.ts";
import { sendToClinic } from "../_shared/push.ts";
import { flatten, hmacHex, same } from "../_shared/webhook.ts";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

const later = (p: Promise<unknown>) => {
  const rt = (globalThis as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } }).EdgeRuntime;
  if (rt) rt.waitUntil(p); else p.catch(console.error);
};

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const raw = req.method === "POST" ? await req.text() : "";
  const q = flatten(url.searchParams, raw, req.headers.get("content-type") ?? "");
  if (!q.t) return new Response("missing token", { status: 401 });
  const { data: clinic } = await sb.from("clinics").select("id,connect_to,webhook_token").eq("webhook_token", q.t).maybeSingle();
  if (!clinic) return new Response("unknown clinic", { status: 401 });

  // Edesy signs the body when a secret is set; if a signature is present it must match.
  const sigHeader = req.headers.get("x-edesy-signature");
  if (sigHeader) {
    const expected = "sha256=" + await hmacHex(clinic.webhook_token, raw);
    if (!same(sigHeader.trim(), expected)) return new Response("bad signature", { status: 401 });
  }
  // Ignore Edesy events that are not about a finished call (e.g. test pings, recording notices).
  if (q.event && /\./.test(q.event) && !/completed|ended/.test(q.event)) return new Response("ignored", { status: 200 });
  if (q.event && /\./.test(q.event)) q.event = "end";

  const ev = readEvent(q);
  const [{ data: prevRow }, { data: pats }, { data: lds }] = await Promise.all([
    sb.from("records").select("data").eq("clinic_id", clinic.id).eq("kind", "calls").eq("id", ev.sid).maybeSingle(),
    sb.from("records").select("data").eq("clinic_id", clinic.id).eq("kind", "patients"),
    sb.from("records").select("data").eq("clinic_id", clinic.id).eq("kind", "leads"),
  ]);
  const prev = (prevRow?.data as Call) ?? null;
  if (prev && prev.status !== "ringing" && ev.event !== "start") return new Response("duplicate", { status: 200 }); // retried delivery
  const { call, lead, push } = applyEvent(
    prev, ev, (pats ?? []).map((r) => r.data as Patient), (lds ?? []).map((r) => r.data as Lead), q,
  );

  const rows: { clinic_id: string; kind: string; id: string; data: unknown }[] = [{ clinic_id: clinic.id, kind: "calls", id: call.id, data: call }];
  if (lead) rows.push({ clinic_id: clinic.id, kind: "leads", id: lead.id, data: lead });
  const { error } = await sb.from("records").upsert(rows, { onConflict: "clinic_id,kind,id" });
  if (error) {
    console.error("save failed", error.message);
    return new Response("save failed", { status: 500 }); // provider will retry
  }
  later(sendToClinic(sb, clinic.id, push));

  // For an Exotel Connect "dial whom" URL this body is the number to ring; everyone else ignores it.
  return new Response(clinic.connect_to ?? "ok", { status: 200, headers: { "content-type": "text/plain" } });
});
