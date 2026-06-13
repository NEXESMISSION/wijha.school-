// api/analytics.js — Fonction serverless (Vercel) : renvoie les événements analytics
// pour la page /admin. PROTÉGÉ : exige le jeton de connexion (obtenu via /api/login).
//
// ⚙️  Variables d'environnement (Vercel) :
//     SUPABASE_URL          = https://xxxx.supabase.co
//     SUPABASE_SERVICE_KEY  = clé "service_role" (SECRÈTE)
//     ADMIN_CODE            = le code de connexion admin (sert à vérifier les jetons)
//
// Renvoie un tableau d'événements (max 5000, les plus récents).

import { verifyToken } from "./login.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOW_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Headers", "Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "method" });

  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!verifyToken(token, process.env.ADMIN_CODE)) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
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
