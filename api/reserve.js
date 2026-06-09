// api/reserve.js — Fonction serverless (Vercel) : reçoit les réservations et notifie Telegram.
// Le TOKEN reste SECRET (variables d'environnement) — il n'apparaît jamais dans la page.
//
// ⚙️  Variables d'environnement à définir sur Vercel (Settings → Environment Variables) :
//     TELEGRAM_BOT_TOKEN = le token donné par @BotFather
//     TELEGRAM_CHAT_ID   = l'id de ton chat (via @userinfobot) — ou l'id d'un groupe
//     ALLOW_ORIGIN       = (optionnel) ton domaine, ex "https://wijha.tn"  (défaut "*")
//
// 📖 Guide pas à pas : TELEGRAM-SETUP.md

export default async function handler(req, res) {
  const origin = process.env.ALLOW_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method" });

  const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT = process.env.TELEGRAM_CHAT_ID;
  if (!TOKEN || !CHAT) return res.status(500).json({ ok: false, error: "not-configured" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  // honeypot : champ caché rempli = bot → on fait semblant d'accepter, sans notifier.
  if (body.company) return res.status(200).json({ ok: true });

  const clip = (v, n) => String(v == null ? "" : v).trim().slice(0, n);
  const nom = clip(body.nom, 120);
  const email = clip(body.email, 160);
  const tel = clip(body.tel, 60);
  const formation = clip(body.formation || "Formation WIJHA", 120);
  const page = clip(body.page, 200);
  if (!nom || !email) return res.status(400).json({ ok: false, error: "missing-fields" });

  const esc = (s) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
  const when = new Date().toLocaleString("fr-FR", { timeZone: "Africa/Tunis" });
  const text =
    "🎓 <b>Nouvelle réservation WIJHA</b>\n\n" +
    "📚 <b>" + esc(formation) + "</b>\n\n" +
    "👤 " + esc(nom) + "\n" +
    "✉️ " + esc(email) + "\n" +
    "📱 " + esc(tel) + "\n\n" +
    "🔗 " + esc(page) + "\n" +
    "🕒 " + esc(when);

  // reçu de paiement (image envoyée en base64 par le formulaire) → envoyé en PHOTO Telegram
  const recu = typeof body.recu === "string" ? body.recu : "";
  const recuMatch = recu.match(/^data:(image\/(?:png|jpe?g|webp));base64,([A-Za-z0-9+/=]+)$/);

  try {
    let tg;
    if (recuMatch) {
      const buf = Buffer.from(recuMatch[2], "base64");
      const fd = new FormData();
      fd.append("chat_id", CHAT);
      fd.append("caption", text.slice(0, 1000) + "\n\n🧾 Reçu de paiement ci-joint");
      fd.append("parse_mode", "HTML");
      fd.append("photo", new Blob([buf], { type: recuMatch[1] }), "recu.jpg");
      tg = await fetch("https://api.telegram.org/bot" + TOKEN + "/sendPhoto", { method: "POST", body: fd });
    } else {
      tg = await fetch("https://api.telegram.org/bot" + TOKEN + "/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT, text, parse_mode: "HTML", disable_web_page_preview: true }),
      });
    }
    if (!tg.ok) {
      const detail = await tg.text();
      return res.status(502).json({ ok: false, error: "telegram", detail });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ ok: false, error: "network" });
  }
}
