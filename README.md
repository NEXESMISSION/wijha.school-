# Wijha Academy - Landing Page & Analytics Dashboard

## Project Structure

```
wijha-form/
├── index.html              # Landing page (RTL Arabic)
├── css/
│   └── landing.css         # Landing page styles
├── js/
│   ├── config.js           # Supabase credentials (EDIT THIS)
│   ├── tracking.js         # Smart analytics tracking library
│   └── form.js             # Form validation & submission
├── dashboard/
│   ├── index.html          # Analytics dashboard
│   ├── dashboard.css       # Dashboard styles
│   └── dashboard.js        # Dashboard logic (EDIT CREDENTIALS)
├── sql/
│   └── schema.sql          # Supabase database schema
└── README.md
```

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **anon public key** from Settings > API

### 2. Run Database Schema

1. Go to your Supabase project > SQL Editor
2. Copy the contents of `sql/schema.sql`
3. Run the SQL query to create all tables, views, indexes, and RLS policies

### 3. Create Dashboard Admin User

1. In Supabase, go to Authentication > Users
2. Click "Add User" and create an account (email + password)
3. This will be used to login to the dashboard

### 4. Configure Credentials

**Edit `js/config.js`:**
```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

**Edit `dashboard/dashboard.js` (top of file):**
```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

### 5. Enable Realtime (for live dashboard)

1. In Supabase, go to Database > Replication
2. Enable realtime for tables: `events`, `registrations`, `sessions`

### 6. Deploy

Deploy to any static hosting: Netlify, Vercel, Cloudflare Pages, GitHub Pages, or any web server.

- Landing page: `index.html`
- Dashboard: `dashboard/index.html`

## What's Tracked (Analytics)

| Event | Description |
|-------|-------------|
| `page_view` | Page loaded |
| `scroll_25/50/75/100` | Scroll depth milestones |
| `section_visible` | Section enters viewport |
| `form_impression` | Form section becomes visible |
| `form_start` | First form interaction |
| `field_focus` | Field focused |
| `field_complete` | Field filled |
| `form_submit_attempt` | Submit clicked |
| `form_validation_error` | Validation failed |
| `form_submit_success` | Registration complete |
| `cta_click` | CTA button clicked |
| `time_on_page` | Heartbeat every 30s |
| `page_hidden/visible` | Tab visibility changes |
| `page_leave` | User leaving (with summary) |
| `rage_click` | Frustrated rapid clicking |
| `element_click` | General click tracking |
| `outbound_click` | External link clicked |

## Session Data Collected

- Device type (mobile/desktop/tablet)
- Browser & OS
- Screen resolution
- Language & timezone
- Country (estimated)
- Referrer URL
- UTM parameters (source, medium, campaign, term, content)
- Returning visitor detection

## Dashboard Features

- **KPI Overview**: Visitors, registrations, conversion rate, avg time, bounce rate
- **Timeline Chart**: Visitors and registrations over time
- **Source Analysis**: Traffic sources breakdown
- **Device Analysis**: Mobile vs desktop vs tablet
- **Scroll Depth**: How far users scroll
- **Hourly Traffic**: Peak traffic hours
- **Geographic**: Country distribution
- **Conversion Funnel**: Full visitor journey visualization
- **Field Interactions**: Which form fields get most attention
- **Rage Clicks**: Frustration detection
- **UTM Performance**: Campaign tracking with conversion rates
- **Referrer Analysis**: Top referring sites
- **Browser/OS Breakdown**: Technical distribution
- **Real-time Feed**: Live event stream
- **Active Visitors**: Currently active users
- **CSV Export**: Download all registrations
- **Date Range Filter**: 7/14/30/90 days or all time

## UTM Tracking

Add UTM parameters to your landing page URL for campaign tracking:

```
https://yoursite.com/?utm_source=facebook&utm_medium=paid&utm_campaign=workshop_april
```

## Form Fields

| Field | Required | Purpose |
|-------|----------|---------|
| Full Name | Yes | Contact |
| Phone | Yes | Primary contact |
| Email | No | Follow-up |
| City | No | Geographic analytics |
| Experience Level | No | Audience segmentation |
| Referral Source | No | Marketing attribution |
