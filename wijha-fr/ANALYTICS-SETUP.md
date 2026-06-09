# 📊 WIJHA Analytics — mise en place

Système d'analytics **first-party** (tes propres données, pas Google) :
qui vient, **d'où**, depuis **quel lien/site**, sur quel **appareil**, **combien de temps**
chaque visiteur reste, + un **sondage** « comment nous as-tu trouvés ? ».

Tout est déjà branché dans le site. Le tableau de bord est sur **`/admin-me`**.

---

## ✅ Ça marche DÉJÀ, sans rien installer (mode démo)

- `analytics.js` est chargé sur `index.html`, `static-web-apps.html`, `web-apps.html`.
- Chaque visite est enregistrée **dans le navigateur** (localStorage) **et** envoyée à `/api/track`.
- Ouvre **`admin-me.html`** : tu vois tout de suite tes propres visites (utile pour tester).

> ⚠️ Le mode démo ne montre que **ton** appareil. Pour voir **tous** les visiteurs
> (et la géoloc par pays), il faut Supabase + le déploiement Vercel ci-dessous.

---

## 🌍 Mode production — voir TOUS les visiteurs (Supabase + Vercel)

### 1) Crée une base Supabase (gratuit)
1. Va sur https://supabase.com → **New project**.
2. Quand le projet est prêt : menu **SQL Editor** → **New query** → colle ceci → **Run** :

```sql
create table if not exists events (
  id          bigint generated always as identity primary key,
  type        text,
  vid         text,
  sid         text,
  is_new      boolean,
  page        text,
  referrer    text,
  source      text,
  utm_source  text,
  utm_medium  text,
  utm_campaign text,
  device      text,
  os          text,
  browser     text,
  screen      text,
  viewport    text,
  lang        text,
  tz          text,
  active      integer,
  survey      jsonb,
  country     text,
  city        text,
  region      text,
  ts          timestamptz default now()
);

create index if not exists events_ts_idx  on events (ts desc);
create index if not exists events_sid_idx on events (sid);
create index if not exists events_vid_idx on events (vid);

-- RLS activé : SEULE la clé service_role (côté serveur) peut écrire/lire.
alter table events enable row level security;
```

### 2) Récupère tes clés Supabase
**Project Settings → API** :
- **Project URL** → `SUPABASE_URL`
- **service_role** (section *Project API keys*, clé **secrète**) → `SUPABASE_SERVICE_KEY`

> 🔒 La clé `service_role` ne doit JAMAIS apparaître dans le site ni sur GitHub.
> Elle vit uniquement dans les variables d'environnement Vercel.

### 3) Variables d'environnement Vercel
**Vercel → ton projet → Settings → Environment Variables** — ajoute :

| Nom | Valeur |
|-----|--------|
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | la clé **service_role** |
| `ADMIN_KEY` | un mot de passe long que **tu choisis** (ex : `wijha-9f3a-...`) |
| `ALLOW_ORIGIN` | *(optionnel)* ton domaine, ex `https://wijha.tn` |

Puis **redeploy**.

### 4) Consulter le tableau de bord
1. Ouvre **`/admin-me`** sur ton site déployé.
2. Tape ta **clé admin** (`ADMIN_KEY`) dans le champ → **Charger serveur**.
3. Tu vois **tous** les visiteurs, par pays, appareil, source, temps passé, sondage.

---

## 📈 Ce qui est suivi

| Donnée | Comment |
|--------|---------|
| Pages vues, visiteurs uniques, sessions | `vid` (localStorage), `sid` (par visite) |
| Nouveau vs récurrent | `is_new` |
| Source / d'où ils viennent | référent + `utm_source` (Instagram, Facebook, TikTok, Google, ami…) |
| Lien / campagne précise | `utm_source` · `utm_medium` · `utm_campaign` (voir liens UTM ci-dessous) |
| Appareil · OS · navigateur | parsé du User-Agent |
| Écran · fenêtre · langue · fuseau | côté client |
| **Pays · ville** | en-têtes géo Vercel (serveur) |
| **Temps passé (actif) par visiteur** | heartbeat 15s + pause quand l'onglet est caché + `sendBeacon` à la sortie |
| Sondage | « comment nous as-tu trouvés », intérêts, profil |

### Liens UTM (pour savoir exactement quel post amène du monde)
Ajoute `?utm_source=...&utm_campaign=...` à tes liens :
```
https://wijha.tn/?utm_source=instagram&utm_medium=bio&utm_campaign=lancement
https://wijha.tn/?utm_source=tiktok&utm_medium=video&utm_campaign=site-web
```
La source affichée dans `/admin-me` utilisera ce `utm_source` en priorité.

---

## 🔐 Confidentialité
- Pas de cookies tiers, pas de Google. Données **anonymes** (pas de nom/email ici — ça reste côté formulaire Telegram).
- `vid` est un identifiant aléatoire local, effaçable par le visiteur (vider le navigateur).
- Le sondage est anonyme et ne s'affiche qu'**une seule fois** par visiteur.

## 🧹 Bon à savoir
- `/admin-me` a `noindex` (pas référencé par Google). Garde l'URL + `ADMIN_KEY` privés.
- Bouton **Export** : télécharge les données en JSON.
- Sélecteur de période : Tout / Aujourd'hui / 7 j / 30 j.
