# 🔐 WIJHA Admin — mise en place

Tout l'espace admin est sur **`/admin`** : réservations (avec reçus de paiement),
réponses au sondage et analytics — protégé par un **login** (email + code) vérifié
**côté serveur** via les variables d'environnement Vercel. Rien n'est dans le code.

> L'ancien système Telegram est supprimé : les réservations sont maintenant
> **enregistrées sur le serveur** (table Supabase) et s'affichent dans /admin.

---

## 1) Variables d'environnement Vercel

**Vercel → ton projet → Settings → Environment Variables** — ajoute :

| Nom | Valeur | Rôle |
|-----|--------|------|
| `ADMIN_EMAIL` | ton email admin | login de la page /admin |
| `ADMIN_CODE` | ton code secret | login + signature des jetons de session |
| `SUPABASE_URL` | `https://xxxx.supabase.co` | base de données |
| `SUPABASE_SERVICE_KEY` | clé **service_role** (secrète) | écrire/lire les tables |
| `ALLOW_ORIGIN` | *(optionnel)* ton domaine | CORS |

> ⚠️ Ne mets JAMAIS ces valeurs dans le code ou sur GitHub.
> `ADMIN_KEY` (l'ancienne clé du dashboard) n'est plus utilisée — tu peux la supprimer.

Après l'ajout : **Redeploy**.

## 2) Tables Supabase

**Supabase → SQL Editor → New query** — colle et exécute :

```sql
-- Réservations (formulaires + reçu de paiement en data-URL)
create table if not exists reservations (
  id        bigint generated always as identity primary key,
  formation text,
  amount    text,
  nom       text,
  email     text,
  tel       text,
  page      text,
  recu      text,
  ts        timestamptz default now()
);
create index if not exists reservations_ts_idx on reservations (ts desc);
-- RLS activé : SEULE la clé service_role (côté serveur) peut lire/écrire.
alter table reservations enable row level security;
```

(La table `events` des analytics est décrite dans `ANALYTICS-SETUP.md` — exécute
son SQL aussi si ce n'est pas déjà fait.)

## 3) Se connecter

1. Ouvre **`/admin`** sur ton site déployé.
2. Entre l'email et le code définis dans `ADMIN_EMAIL` / `ADMIN_CODE`.
3. La session reste ouverte 7 jours sur l'appareil (jeton signé, vérifié à chaque requête).

## 🔒 Comment c'est sécurisé

- Le login est vérifié **côté serveur** (comparaison à temps constant + délai anti-force-brute).
- Les données (réservations, reçus, sondage, analytics) ne sortent QUE via des
  fonctions serverless qui exigent un **jeton signé** (HMAC, expiration 7 jours).
- Les tables Supabase ont **RLS activé** sans policy publique : seule la clé
  `service_role` (jamais exposée au navigateur) peut y accéder.
- `/admin` est `noindex` (en-tête + meta) et bloqué dans `robots.txt`.
- Si tu penses que le code a fuité : change `ADMIN_CODE` sur Vercel → tous les
  jetons existants deviennent invalides immédiatement.
