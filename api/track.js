// api/track.js — Fonction serverless (Vercel) : reçoit chaque événement analytics
// (pageview, ping, duration, survey) et l'enregistre dans Supabase.
// La géoloc (pays / ville) est lue côté serveur depuis les en-têtes Vercel — impossible côté client.
//
// ⚙️  Variables d'environnement (Vercel → Settings → Environment Variables) :
//     SUPABASE_URL          = https://xxxx.supabase.co
//     SUPABASE_SERVICE_KEY  = la clé "service_role" (SECRÈTE — jamais côté client)
//     ALLOW_ORIGIN          = (optionnel) ton domaine, défaut "*"
//
// 📖 Mise en place (table SQL incluse) : ANALYTICS-SETUP.md
//
// ⚠️  Si Supabase n'est pas configuré, l'endpoint répond 200 sans rien casser :
//     le site continue de fonctionner (le tableau /admin-me garde son mode démo local).

export default async function handler(req, res) {
  const origin = process.env.ALLOW_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method" });

  const URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Non configuré → on accepte silencieusement (mode démo local côté client).
  if (!URL || !KEY) return res.status(200).json({ ok: true, stored: false });

  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = {}; } }
  b = b || {};

  const clip = (v, n) => (v == null ? null : String(v).slice(0, n));
  const h = (name) => req.headers[name] || null;

  // géoloc serveur (en-têtes Vercel) — indisponible en local, normal.
  const country = h("x-vercel-ip-country");
  const city = h("x-vercel-ip-city");
  const region = h("x-vercel-ip-country-region");

  const row = {
    type: clip(b.type, 24) || "pageview",
    vid: clip(b.vid, 40),
    sid: clip(b.sid, 40),
    is_new: !!b.isNew,
    page: clip(b.page, 120),
    referrer: clip(b.ref, 400),
    source: clip(b.source, 80),
    utm_source: clip(b.utm_source, 80),
    utm_medium: clip(b.utm_medium, 80),
    utm_campaign: clip(b.utm_campaign, 120),
    device: clip(b.device, 24),
    os: clip(b.os, 24),
    browser: clip(b.browser, 24),
    screen: clip(b.screen, 24),
    viewport: clip(b.viewport, 24),
    lang: clip(b.lang, 24),
    tz: clip(b.tz, 60),
    active: typeof b.active === "number" ? Math.round(b.active) : null,
    survey: b.survey && typeof b.survey === "object" ? b.survey : null,
    country: country ? decodeURIComponent(country) : null,
    city: city ? decodeURIComponent(city) : null,
    region: region ? decodeURIComponent(region) : null,
    ts: new Date().toISOString(),
  };

  try {
    const r = await fetch(URL.replace(/\/$/, "") + "/rest/v1/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: KEY,
        Authorization: "Bearer " + KEY,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });
    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ ok: false, error: "supabase", detail });
    }
    return res.status(200).json({ ok: true, stored: true });
  } catch (e) {
    return res.status(502).json({ ok: false, error: "network" });
  }
}
