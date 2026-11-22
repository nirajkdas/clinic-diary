// Returns the public VAPID key the app needs to subscribe to notifications (creates the key pair on first call).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { vapid } from "../_shared/push.ts";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const k = await vapid(sb);
  return Response.json({ publicKey: k.publicKey }, { headers: cors });
});
