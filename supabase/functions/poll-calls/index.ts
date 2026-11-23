// Runs every minute (pg_cron, see migrations/003_poll_calls.sql). For each clinic that saved an
// Edesy API key, pulls new forwarded calls, saves them as calls/leads, and sends notifications.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { applyEvent, readEvent, type Call, type Lead, type Patient } from "../_shared/calls.ts";
import { fetchLogs, logTime, logToEvent } from "../_shared/edesy.ts";
import { sendToClinic } from "../_shared/push.ts";
import { sendMissedCall } from "../_shared/whatsapp.ts";
import { same } from "../_shared/webhook.ts";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

Deno.serve(async (req) => {
  const { data: key } = await sb.from("app_keys").select("value").eq("name", "cron_token").maybeSingle();
  if (!key?.value || !same(req.headers.get("x-cron-token") ?? "", key.value)) return new Response("forbidden", { status: 403 });

  const { data: secrets } = await sb.from("clinic_secrets").select("clinic_id,edesy_key,edesy_since,aisensy_key,aisensy_campaign").not("edesy_key", "is", null);
  const report: Record<string, unknown>[] = [];
  for (const s of secrets ?? []) {
    try {
      // Overlap by 15 minutes so calls that were still ringing last time are picked up when they finish.
      const since = new Date(Math.max(Date.parse(s.edesy_since ?? "") || 0, Date.now() - 86_400_000) - 15 * 60_000);
      const logs = (await fetchLogs(s.edesy_key, since.toISOString())).sort((a, b) => logTime(a) - logTime(b));
      if (!logs.length) { report.push({ clinic: s.clinic_id, calls: 0 }); continue; }

      const ids = logs.map((l) => "E" + l.id);
      const [{ data: have }, { data: pats }, { data: lds }, { data: named }] = await Promise.all([
        sb.from("records").select("id,data").eq("clinic_id", s.clinic_id).eq("kind", "calls").in("id", ids),
        sb.from("records").select("data").eq("clinic_id", s.clinic_id).eq("kind", "patients"),
        sb.from("records").select("data").eq("clinic_id", s.clinic_id).eq("kind", "leads"),
        sb.from("records").select("data").eq("clinic_id", s.clinic_id).eq("kind", "calls").not("data->>name", "is", null).limit(500),
      ]);
      const done = new Map((have ?? []).map((r) => [r.id, r.data as Call]));
      const patients = (pats ?? []).map((r) => r.data as Patient);
      const leads = (lds ?? []).map((r) => r.data as Lead);
      const pastCalls = (named ?? []).map((r) => r.data as Call);

      const { data: cl } = await sb.from("clinics").select("name,settings").eq("id", s.clinic_id).maybeSingle();
      const clinicName = (cl?.settings as { set?: { clinic?: string } })?.set?.clinic || cl?.name || "our clinic";
      let added = 0;
      for (const l of logs) {
        const q = logToEvent(l);
        if (!q || done.has(q.call_sid)) continue;
        const at = logTime(l);
        const { call, lead, push } = applyEvent(null, readEvent(q), patients, leads, q, at, pastCalls);
        call.at = at;
        // Missed call from a new lead: send the "busy, we will call you back" WhatsApp right away.
        if (lead && s.aisensy_key && s.aisensy_campaign && Date.now() - at < 30 * 60_000) {
          try {
            await sendMissedCall(s.aisensy_key, s.aisensy_campaign, lead.phone, clinicName);
            (lead as Lead & { waSent?: number }).waSent = Date.now();
            push.body = "WhatsApp sent: we will call you back. Tap to call.";
          } catch (e) {
            await sb.from("clinic_secrets").update({ aisensy_error: (e as Error).message.slice(0, 300) }).eq("clinic_id", s.clinic_id);
          }
        }
        const rows: { clinic_id: string; kind: string; id: string; data: unknown }[] = [{ clinic_id: s.clinic_id, kind: "calls", id: call.id, data: call }];
        if (lead) { rows.push({ clinic_id: s.clinic_id, kind: "leads", id: lead.id, data: lead }); leads.push(lead); }
        const { error } = await sb.from("records").upsert(rows, { onConflict: "clinic_id,kind,id" });
        if (error) throw new Error(error.message);
        added++;
        if (Date.now() - at < 30 * 60_000) await sendToClinic(sb, s.clinic_id, push); // don't notify about old calls
      }
      const newest = new Date(Math.max(...logs.map(logTime))).toISOString();
      await sb.from("clinic_secrets").update({ edesy_since: newest, edesy_error: null }).eq("clinic_id", s.clinic_id);
      report.push({ clinic: s.clinic_id, calls: logs.length, added });
    } catch (e) {
      const msg = (e as Error).message.slice(0, 300);
      await sb.from("clinic_secrets").update({ edesy_error: msg }).eq("clinic_id", s.clinic_id);
      report.push({ clinic: s.clinic_id, error: msg });
    }
  }
  return Response.json({ ok: true, report });
});
