// api/login.js — Connexion admin. Vérifie email + code contre les variables
// d'environnement Vercel et renvoie un jeton signé (HMAC) valable 7 jours.
//
// ⚙️  Variables d'environnement à définir sur Vercel (Settings → Environment Variables) :
//     ADMIN_EMAIL = l'email autorisé à se connecter
//     ADMIN_CODE  = le code secret (sert aussi de clé de signature des jetons)
//
// Aucune de ces valeurs n'apparaît dans le code ni dans la page — sécurité côté serveur.

import crypto from "crypto";

const sha = (s) => crypto.createHash("sha256").update(String(s)).digest();
const safeEq = (a, b) => crypto.timingSafeEqual(sha(a), sha(b)); // longueur-indépendant

export function makeToken(secret, days = 7) {
  const exp = Date.now() + days * 864e5;
  const sig = crypto.createHmac("sha256", String(secret)).update(String(exp)).digest("hex");
  return exp + "." + sig;
}

export function verifyToken(token, secret) {
  if (!secret || typeof token !== "string") return false;
  const i = token.indexOf(".");
  if (i < 1) return false;
  const exp = token.slice(0, i), sig = token.slice(i + 1);
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  const want = crypto.createHmac("sha256", String(secret)).update(exp).digest("hex");
  return safeEq(sig, want);
}

export default async function handler(req, res) {
  const origin = process.env.ALLOW_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method" });

  const EMAIL = process.env.ADMIN_EMAIL;
  const CODE = process.env.ADMIN_CODE;
  if (!EMAIL || !CODE) return res.status(500).json({ ok: false, error: "not-configured" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const email = String(body.email || "").trim().toLowerCase();
  const code = String(body.code || "");
  const ok = safeEq(email, EMAIL.trim().toLowerCase()) && safeEq(code, CODE);

  if (!ok) {
    await new Promise((r) => setTimeout(r, 400)); // ralentit la force brute
    return res.status(401).json({ ok: false, error: "invalid" });
  }
  return res.status(200).json({ ok: true, token: makeToken(CODE) });
}
