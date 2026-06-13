// api/health.js — diagnostic : indique QUELLES variables d'environnement sont
// présentes dans le déploiement (vrai/faux uniquement, jamais les valeurs).
// Ouvre /api/health dans le navigateur après un redeploy.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOW_ORIGIN || "*");
  return res.status(200).json({
    ok: true,
    env: {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: !!(process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
      ADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
      ADMIN_CODE: !!process.env.ADMIN_CODE,
    },
    node: process.version,
  });
}
