// rr-activity: tells the Riley Rag editors (and only them) what readers are up to,
// and tells a reader when Peter has answered their letter.
// Readers' phones call it when they read an issue, react, comment, play Riled Up, open a link or write to Peter.
// Uses the same VAPID secrets as rr-notify. Keep "Enforce JWT verification" ON (only signed-in members can call it).
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT")!, Deno.env.get("VAPID_PUBLIC")!, Deno.env.get("VAPID_PRIVATE")!);
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const out = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const cut = (s: unknown, n: number) => { const t = String(s ?? "").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1) + "…" : t; };
// quiet repeats: the same reader reading the same issue, or opening the same link, only pings once in a while
const QUIET: Record<string, number> = { read: 12 * 3600, link: 3600 };

async function push(userIds: string[], msg: Record<string, string>) {
  if (!userIds.length) return 0;
  const { data: subs } = await db.from("rr_push_subs").select("*").in("user_id", userIds);
  let sent = 0;
  for (const s of subs ?? []) {
    try { await webpush.sendNotification(s.sub, JSON.stringify(msg)); sent++; }
    catch (e) { if (e.statusCode === 404 || e.statusCode === 410) await db.from("rr_push_subs").delete().eq("endpoint", s.endpoint); }
  }
  return sent;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  const { data: { user } } = await db.auth.getUser(jwt);
  if (!user) return out({ error: "Sign in first" }, 401);
  const { data: me } = await db.from("profiles").select("name,is_editor").eq("id", user.id).maybeSingle();
  if (!me) return out({ error: "Not a member" }, 403);
  let kind = "", d: Record<string, unknown> = {};
  try { const b = await req.json(); kind = String(b.kind ?? ""); d = b.d ?? {}; } catch { /* empty */ }

  // Peter answered: only the person who wrote in hears about it
  if (kind === "peter_answer") {
    if (!me.is_editor) return out({ error: "Editors only" }, 403);
    const { data: q } = await db.from("advice").select("*").eq("id", d.id).maybeSingle();
    const asker = q?.user_id ?? q?.author_id ?? q?.author ?? q?.asker;
    if (!asker) return out({ sent: 0 });
    return out({ sent: await push([asker], { title: "The Riley Rag", body: q?.answered_issue ? `Peter answered your letter in issue № ${q.answered_issue}!` : "Peter has answered your letter!", url: "./", tag: "rr-peter" }) });
  }

  if (me.is_editor) return out({ skipped: "editor" });   // editors' own clicks don't ping anyone
  const what: Record<string, string> = {
    read: `is reading Issue № ${cut(d.n, 6)}`,
    react: `reacted “${cut(d.label, 30)}” to Issue № ${cut(d.n, 6)}`,
    comment: `commented on Issue № ${cut(d.n, 6)}: “${cut(d.text, 90)}”`,
    game: cut(d.text, 90),
    link: `opened ${cut(d.label, 60)}`,
    peter: `wrote to Ask Peter: “${cut(d.text, 90)}”`,
  };
  if (!what[kind]) return out({ error: "Unknown activity" }, 400);

  if (QUIET[kind]) {
    const key = `${kind}:${cut(d.key, 200)}`;
    const { data: last } = await db.from("rr_activity").select("at").eq("user_id", user.id).eq("key", key).maybeSingle();
    if (last && Date.now() - new Date(last.at).getTime() < QUIET[kind] * 1000) return out({ quiet: true });
    await db.from("rr_activity").upsert({ user_id: user.id, key, at: new Date().toISOString() });
  }

  const { data: eds } = await db.from("profiles").select("id").eq("is_editor", true);
  const ids = (eds ?? []).map((x) => x.id).filter((id) => id !== user.id);
  const url = kind === "peter" ? "./#peter" : kind === "game" ? "./#games" : "./";
  const sent = await push(ids, { title: `Riley Rag · ${cut(me.name, 40)}`, body: what[kind], url, tag: `rr-${kind}-${user.id}` });
  return out({ sent });
});
