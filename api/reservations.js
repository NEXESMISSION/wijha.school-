// api/reservations.js — Liste les réservations pour la page /admin.
// PROTÉGÉ : exige un jeton de connexion valide (obtenu via /api/login).
//
// ⚙️  Variables d'environnement : SUPABASE_URL, SUPABASE_SERVICE_KEY, ADMIN_CODE

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
  const KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!URL || !KEY) return res.status(500).json({ ok: false, error: "not-configured" });

  try {
    const q = URL.replace(/\/$/, "") + "/rest/v1/reservations?select=*&order=ts.desc&limit=500";
    const r = await fetch(q, { headers: { apikey: KEY, Authorization: "Bearer " + KEY } });
    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ ok: false, error: "supabase", detail: detail.slice(0, 300) });
    }
    const rows = await r.json();
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ ok: true, reservations: rows });
  } catch (e) {
    return res.status(502).json({ ok: false, error: "network" });
  }
}
