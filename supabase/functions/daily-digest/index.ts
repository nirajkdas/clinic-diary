// Called every 15 minutes by pg_cron (see migrations/002_daily_digest.sql).
// Sends each clinic one evening notification about tomorrow, at the time set in the app (default 18:00 IST).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { buildDigest, istNow, isDue, type Rec } from "../_shared/digest.ts";
import { sendToClinic } from "../_shared/push.ts";
import { same } from "../_shared/webhook.ts";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

Deno.serve(async (req) => {
  const { data: key } = await sb.from("app_keys").select("value").eq("name", "cron_token").maybeSingle();
  const given = req.headers.get("x-cron-token") ?? "";
  if (!key?.value || !same(given, key.value)) return new Response("forbidden", { status: 403 });

  const { today } = istNow();
  const { data: clinics } = await sb.from("clinics").select("id,settings,last_digest");
  let sent = 0;
  for (const c of clinics ?? []) {
    const remindAt = (c.settings as { set?: { remindAt?: string } })?.set?.remindAt;
    if (!isDue(remindAt, c.last_digest, Date.now())) continue;
    // Mark first so a slow push never causes a second notification on the next run.
    await sb.from("clinics").update({ last_digest: today }).eq("id", c.id);
    const recs: Rec[] = [];
    for (let from = 0; ; from += 1000) {
      const { data } = await sb.from("records").select("kind,data").eq("clinic_id", c.id).in("kind", ["appts", "fus", "leads", "calls"]).range(from, from + 999);
      recs.push(...((data ?? []) as Rec[]));
      if (!data || data.length < 1000) break;
    }
    const d = buildDigest(recs);
    if (d) { await sendToClinic(sb, c.id, d); sent++; }
  }
  return Response.json({ ok: true, sent });
});
