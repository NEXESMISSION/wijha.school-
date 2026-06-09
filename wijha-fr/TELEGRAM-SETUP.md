# 📲 Réservations → notifications Telegram (WIJHA)

Quand quelqu'un remplit le formulaire « Réserver ma place », tu reçois un message
Telegram instantané avec son nom, son email et son WhatsApp. Voici comment l'activer.

Il y a **2 étapes obligatoires** (créer le bot + récupérer ton chat id), puis tu choisis
**comment l'envoyer** : test rapide en local, ou propre en production.

---

## Étape 1 — Créer le bot (2 min)

1. Sur Telegram, ouvre **@BotFather**.
2. Envoie `/newbot`.
3. Donne un nom (ex. `WIJHA Réservations`) puis un identifiant qui finit par `bot`
   (ex. `wijha_reservations_bot`).
4. BotFather te donne un **token** du style :
   `8123456789:AAE...xYz`  ← **garde-le secret**, c'est la clé du bot.

## Étape 2 — Récupérer ton « chat id » (1 min)

Le chat id, c'est *où* le message arrive (ton compte, ou un groupe d'équipe).

- **Vers ton compte perso :** ouvre **@userinfobot**, envoie `/start`, il te répond
  ton `Id` (un nombre, ex. `512345678`).
- **Vers un groupe (recommandé si vous êtes plusieurs) :**
  1. Crée un groupe, ajoute **ton bot** dedans.
  2. Écris un message dans le groupe.
  3. Ouvre dans un navigateur :
     `https://api.telegram.org/bot<TON_TOKEN>/getUpdates`
  4. Cherche `"chat":{"id":-100xxxxxxxxxx ...}` → ce nombre (souvent négatif) est le chat id du groupe.

---

## Option A — 🧪 Voir ça marcher tout de suite (test local)

Pour vérifier en 2 minutes, **sans rien déployer** :

1. Ouvre `reserve.js` et remplis **uniquement pour le test** :
   ```js
   testBotToken: "8123456789:AAE...xYz",   // ton token
   testChatId:   "512345678",              // ton chat id
   ```
2. Lance le site en local et ouvre une page formation
   (`static-web-apps.html` ou `web-apps.html`).
3. Remplis le formulaire → **Réserver ma place**.
4. ✅ Le message arrive dans ton Telegram.

> ⚠️ **Important :** ce mode ne marche que sur `localhost` et **ne doit jamais être
> mis en ligne**. Avant de déployer, **vide** `testBotToken` et `testChatId`
> (remets `""`). En production, on passe par l'Option B (token secret).

## Option B — 🚀 En production (propre & sécurisé) — recommandé

Ici le token reste **secret côté serveur** : impossible de le voler dans la page.
Le formulaire envoie les infos à la fonction `api/reserve.js` (déjà prête).

### Sur Vercel
1. Déploie le dossier `wijha-fr/` sur Vercel (il détecte `api/` automatiquement).
2. Dans **Settings → Environment Variables**, ajoute :
   | Nom | Valeur |
   |-----|--------|
   | `TELEGRAM_BOT_TOKEN` | ton token @BotFather |
   | `TELEGRAM_CHAT_ID`   | ton chat id |
   | `ALLOW_ORIGIN` *(optionnel)* | ton domaine, ex. `https://wijha.tn` |
3. Redéploie. Dans `reserve.js`, laisse `endpoint: "/api/reserve"`.
4. Teste le formulaire en ligne → le message arrive. 🎉

### Alternative : Cloudflare Worker
Si tu n'es pas sur Vercel, crée un Worker avec ce code, mets le token dans les
*Secrets* du Worker, puis dans `reserve.js` mets
`endpoint: "https://ton-worker.workers.dev"`.

```js
export default {
  async fetch(req, env) {
    if (req.method !== "POST") return new Response("ok");
    const b = await req.json().catch(() => ({}));
    if (b.company) return Response.json({ ok: true }); // honeypot
    const text =
      "🎓 Nouvelle réservation WIJHA\n\n" +
      "📚 " + (b.formation || "") + "\n👤 " + (b.nom || "") +
      "\n✉️ " + (b.email || "") + "\n📱 " + (b.tel || "") +
      "\n🔗 " + (b.page || "");
    await fetch("https://api.telegram.org/bot" + env.TELEGRAM_BOT_TOKEN + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text }),
    });
    return Response.json({ ok: true });
  },
};
```

---

## Si l'envoi échoue
Le formulaire propose automatiquement un repli **WhatsApp** (si tu as mis ton numéro
dans `reserve.js` → `whatsapp`) ou **email**. Aucune réservation n'est perdue.

## Sécurité — à retenir
- Ne mets **jamais** le vrai token dans `reserve.js` pour la production (uniquement
  les champs `test*` en local, puis vide-les).
- Si un token fuite : @BotFather → `/revoke` → tu en récupères un nouveau.
- Le champ caché « honeypot » bloque déjà la plupart des bots spammeurs.

## Ce que tu dois encore remplir (placeholders)
- `reserve.js` → `whatsapp` (numéro de repli) — *optionnel mais conseillé*
- Variables d'env Vercel : `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
