// api/reserve.js — Fonction serverless (Vercel) : reçoit les réservations du site
// et les ENREGISTRE SUR LE SERVEUR (table Supabase "reservations"), reçu de paiement inclus.
// Elles s'affichent ensuite dans /admin (onglet Réservations), protégé par login.
//
// ⚙️  Variables d'environnement à définir sur Vercel (Settings → Environment Variables) :
//     SUPABASE_URL          = https://xxxx.supabase.co
//     SUPABASE_SERVICE_KEY  = clé "service_role" (SECRÈTE — jamais côté client)
//     ALLOW_ORIGIN          = (optionnel) ton domaine, ex "https://wijha.tn"  (défaut "*")
//
// 📖 Guide pas à pas (table SQL incluse) : ADMIN-SETUP.md

export default async function handler(req, res) {
  const origin = process.env.ALLOW_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method" });

  const URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!URL || !KEY) {
    const missing = [!URL && "SUPABASE_URL", !KEY && "SUPABASE_SERVICE_KEY"].filter(Boolean);
    return res.status(500).json({ ok: false, error: "not-configured", missing });
  }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  // honeypot : champ caché rempli = bot → on fait semblant d'accepter, sans enregistrer.
  if (body.company) return res.status(200).json({ ok: true });

  const clip = (v, n) => String(v == null ? "" : v).trim().slice(0, n);
  const nom = clip(body.nom, 120);
  const email = clip(body.email, 160);
  const tel = clip(body.tel, 60);
  const formation = clip(body.formation || "Formation WIJHA", 160);
  const amount = clip(body.amount, 12);
  const page = clip(body.page, 200);
  if (!nom || !email) return res.status(400).json({ ok: false, error: "missing-fields" });

  // reçu de paiement : data-URL image (déjà réduite côté client à ≤1280px JPEG)
  let recu = typeof body.recu === "string" ? body.recu : "";
  if (!/^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/.test(recu) || recu.length > 1_800_000) {
    recu = "";
  }

  try {
    const r = await fetch(URL.replace(/\/$/, "") + "/rest/v1/reservations", {
      method: "POST",
      headers: {
        apikey: KEY,
        Authorization: "Bearer " + KEY,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ formation, amount, nom, email, tel, page, recu }),
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
