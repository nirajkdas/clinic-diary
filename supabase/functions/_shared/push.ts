// Web push to every device that turned on notifications for a clinic.
// VAPID keys are generated once and kept in public.app_keys (server-only table).
import webpush from "npm:web-push@3.6.7";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";

let cached: { publicKey: string; privateKey: string } | null = null;

export async function vapid(sb: SupabaseClient) {
  if (cached) return cached;
  const read = async () => {
    const { data } = await sb.from("app_keys").select("name,value").in("name", ["vapid_public", "vapid_private"]);
    const m = Object.fromEntries((data ?? []).map((r: { name: string; value: string }) => [r.name, r.value]));
    return m.vapid_public && m.vapid_private ? { publicKey: m.vapid_public, privateKey: m.vapid_private } : null;
  };
  let k = await read();
  if (!k) {
    const g = webpush.generateVAPIDKeys();
    // ignoreDuplicates: if two requests race, the first pair wins and both re-read it
    await sb.from("app_keys").upsert(
      [{ name: "vapid_public", value: g.publicKey }, { name: "vapid_private", value: g.privateKey }],
      { onConflict: "name", ignoreDuplicates: true },
    );
    k = await read();
  }
  if (!k) throw new Error("could not create VAPID keys");
  cached = k;
  return k;
}

export type PushPayload = { title: string; body: string; url?: string; tag?: string };

export async function sendToClinic(sb: SupabaseClient, clinicId: string, payload: PushPayload) {
  const k = await vapid(sb);
  webpush.setVapidDetails("https://nirajkdas.github.io/clinic-diary/", k.publicKey, k.privateKey);
  const { data: subs } = await sb.from("push_subs").select("endpoint,sub").eq("clinic_id", clinicId);
  await Promise.all((subs ?? []).map(async (s: { endpoint: string; sub: webpush.PushSubscription }) => {
    try {
      await webpush.sendNotification(s.sub, JSON.stringify(payload), { TTL: 3600, urgency: "high" });
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await sb.from("push_subs").delete().eq("endpoint", s.endpoint);
      else console.error("push failed", code, (e as Error).message);
    }
  }));
}
