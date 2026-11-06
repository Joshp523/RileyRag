// rr-notify: tells every Riley Rag member that a new issue is out.
// The app calls this right after an editor publishes. Only editors can trigger it.
// Uses the same VAPID keys as Word Games (VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE are project-wide secrets).
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
const URL_ = Deno.env.get("SUPABASE_URL")!;
const db = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT")!, Deno.env.get("VAPID_PUBLIC")!, Deno.env.get("VAPID_PRIVATE")!);
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  const { data: { user } } = await db.auth.getUser(jwt);
  if (!user) return new Response("Sign in first", { status: 401, headers: CORS });
  const { data: p } = await db.from("profiles").select("is_editor").eq("id", user.id).maybeSingle();
  if (!p?.is_editor) return new Response("Editors only", { status: 403, headers: CORS });

  const { data: is } = await db.from("issues").select("number,tagline").order("issue_date", { ascending: false }).order("number", { ascending: false }).limit(1).maybeSingle();
  if (!is) return new Response("No issue", { status: 404, headers: CORS });
  const body = is.tagline ? `Issue № ${is.number} is out: ${is.tagline}` : `Issue № ${is.number} is out. Come and read it!`;

  const { data: subs } = await db.from("rr_push_subs").select("*").neq("user_id", user.id);
  let sent = 0;
  for (const s of subs ?? []) {
    try { await webpush.sendNotification(s.sub, JSON.stringify({ title: "The Riley Rag", body, url: "./" })); sent++; }
    catch (e) { if (e.statusCode === 404 || e.statusCode === 410) await db.from("rr_push_subs").delete().eq("endpoint", s.endpoint); }
  }
  return new Response(JSON.stringify({ sent }), { headers: { ...CORS, "Content-Type": "application/json" } });
});
