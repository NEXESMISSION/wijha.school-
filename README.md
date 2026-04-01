# Wijha Academy - Landing Page & Analytics Dashboard

## Project Structure

```
wijha.school/
├── index.html                   # Fallback redirect → /free-registration (Vercel also 308 / → /free-registration)
├── free-registration/index.html # Primary public marketing + registration (canonical homepage)
├── css/
│   ├── main.css                 # Legacy styles (unused while root redirects)
│   └── landing.css              # Registration landing styles
├── js/
│   ├── config.js                # Supabase credentials (shared)
│   ├── tracking.js              # Smart analytics tracking library
│   └── form.js                  # Form validation & submission
├── dashboard/
│   ├── index.html               # Analytics dashboard (login required)
│   ├── dashboard.css            # Dashboard styles
│   └── dashboard.js             # Dashboard logic
├── sql/
│   ├── schema.sql               # Full database schema (run first)
│   ├── fix-rls-security.sql     # Fix RLS if anon SELECT policies exist
│   └── security-hardening.sql   # Add CHECK constraints to existing DB
├── vercel.json                  # Deployment config + security headers
├── robots.txt                   # Search engine directives
├── sitemap.xml                  # Sitemap for SEO
└── .gitignore                   # Excludes .env and sensitive files
```

## Setup

### 1. Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Run `sql/schema.sql` in SQL Editor
3. Create dashboard user: Authentication → Users → Add User

### 2. Configure

Edit `js/config.js` with your Supabase URL and anon key.
The dashboard uses the same shared config file.

### 3. Environment Variables

Create `.env` (never commit this):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Deploy to Vercel

```bash
npx vercel
```

Add environment variables in Vercel Dashboard → Settings → Environment Variables.

## Security

- **RLS**: Anon can only INSERT (tracking/registration). Only authenticated users can SELECT (dashboard)
- **DB constraints**: All fields have length limits, enum validation, and format checks
- **CSP**: Strict Content-Security-Policy with frame-src, upgrade-insecure-requests
- **Headers**: HSTS, X-Frame-Options DENY, nosniff, XSS protection, COOP, CORP
- **Input**: Client-side sanitization + server-side CHECK constraints
- **Rate limiting**: Client-side form submission limit (3 per session)
- **Routes**: .env, .git/, sql/, README blocked via Vercel rewrites
- **Dashboard**: Supabase Auth required, noindex/nofollow, no-cache headers
- **Secrets**: .env excluded from git, service_role key never in frontend
