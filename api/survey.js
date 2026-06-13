// api/survey.js — reçoit les réponses de l'enquête clients (page /survey) et les
// enregistre dans la table Supabase "surveys". Visible dans /admin → Enquête clients.
//
// ⚙️  Variables : SUPABASE_URL, SUPABASE_SERVICE_KEY (ou SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  const origin = process.env.ALLOW_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method" });

  const URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL || !KEY) return res.status(500).json({ ok: false, error: "not-configured" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  // honeypot anti-spam : champ caché rempli = bot → on fait semblant d'accepter.
  if (body.company) return res.status(200).json({ ok: true });

  const clip = (v, n) => String(v == null ? "" : v).trim().slice(0, n);
  const row = {
    tel: clip(body.tel, 60),
    nom: clip(body.nom, 120),
    formation_cible: clip(body.formation_cible, 120),
    intention: clip(body.intention, 120),
    objectif: clip(body.objectif, 160),
    objectif_autre: clip(body.objectif_autre, 200),
    budget: clip(body.budget, 80),
    blocage: clip(body.blocage, 160),
    equipement: clip(body.equipement, 120),
    dispo: clip(body.dispo, 120),
    source: clip(body.source, 80),
    source_autre: clip(body.source_autre, 200),
    gouvernorat: clip(body.gouvernorat, 80),
    page: clip(body.page, 120),
  };
  if (!row.tel) return res.status(400).json({ ok: false, error: "missing-tel" });

  try {
    const r = await fetch(URL.replace(/\/$/, "") + "/rest/v1/surveys", {
      method: "POST",
      headers: {
        apikey: KEY,
        Authorization: "Bearer " + KEY,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });
    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ ok: false, error: "supabase", detail: detail.slice(0, 300) });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ ok: false, error: "network" });
  }
}
