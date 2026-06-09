// api/analytics.js — Fonction serverless (Vercel) : renvoie les événements analytics
// pour le tableau de bord /admin-me. PROTÉGÉ par une clé admin.
//
// ⚙️  Variables d'environnement (Vercel) :
//     SUPABASE_URL          = https://xxxx.supabase.co
//     SUPABASE_SERVICE_KEY  = clé "service_role" (SECRÈTE)
//     ADMIN_KEY             = un mot de passe que TU choisis (ex : long aléatoire)
//
// Usage : GET /api/analytics?key=TON_ADMIN_KEY   (la page /admin-me l'envoie pour toi)
// Renvoie un tableau d'événements (max 5000, les plus récents) au format attendu par /admin-me.

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOW_ORIGIN || "*");
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "method" });

  const ADMIN = process.env.ADMIN_KEY;
  // clé passée dans un en-tête (pas dans l'URL → ne fuite pas via l'historique / les logs / le referer)
  const given = req.headers["x-admin-key"] || "";
  if (!ADMIN || given !== ADMIN) return res.status(401).json({ ok: false, error: "unauthorized" });

  const URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!URL || !KEY) return res.status(500).json({ ok: false, error: "not-configured" });

  try {
    const q = URL.replace(/\/$/, "") + "/rest/v1/events?select=*&order=ts.desc&limit=5000";
    const r = await fetch(q, { headers: { apikey: KEY, Authorization: "Bearer " + KEY } });
    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ ok: false, error: "supabase", detail });
    }
    const rows = await r.json();
    // remappe vers les noms attendus par /admin-me (camelCase / ref)
    const events = rows.map((e) => ({
      type: e.type, vid: e.vid, sid: e.sid, isNew: e.is_new, page: e.page,
      ref: e.referrer, source: e.source,
      utm_source: e.utm_source, utm_medium: e.utm_medium, utm_campaign: e.utm_campaign,
      device: e.device, os: e.os, browser: e.browser, screen: e.screen, viewport: e.viewport,
      lang: e.lang, tz: e.tz, active: e.active, survey: e.survey,
      country: e.country, city: e.city, region: e.region, ts: e.ts,
    }));
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ ok: true, events });
  } catch (e) {
    return res.status(502).json({ ok: false, error: "network" });
  }
}
