// api/surveys.js — liste les réponses de l'enquête clients pour /admin.
// PROTÉGÉ : exige le jeton de connexion (obtenu via /api/login).

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
    const q = URL.replace(/\/$/, "") + "/rest/v1/surveys?select=*&order=ts.desc&limit=1000";
    const r = await fetch(q, { headers: { apikey: KEY, Authorization: "Bearer " + KEY } });
    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ ok: false, error: "supabase", detail: detail.slice(0, 300) });
    }
    const rows = await r.json();
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ ok: true, surveys: rows });
  } catch (e) {
    return res.status(502).json({ ok: false, error: "network" });
  }
}
