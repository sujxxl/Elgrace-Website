# Elgrace Talents

Comprehensive talent platform with profile management, Supabase-backed data, and glassmorphism UI.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS
- Framer Motion
- Supabase (Auth, Database, Storage)
- country-state-city (cascading location selects)
- Lucide React icons

## Getting Started

1. Install deps:
   ```bash
   npm install
   ```
2. Run dev server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```
4. Preview production build:
   ```bash
   npm run preview
   ```

## Environment

Create `.env` (or `.env.local`) with your Supabase project details:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_UPLOAD_API_URL=https://api.elgrace.in
VITE_MEDIA_BASE_URL=https://api.elgrace.in/media
```

## Supabase Schema

Use the schema in `supabase_schema.sql`.

- Profiles are stored in `public.model_profiles`.
- Media is sourced from `public.model_media` via the backend `GET /media?model_id=...` endpoint (single source of truth).

## Key Features

- Auth (email/password + magic link) with roles (model/client)
- Profile dashboard and edit flow
- Country → State → City cascading selects
- Multi-language and skills chip input
- Measurements and media upload (VPS Upload & Media API)
- Success toast on profile save

## Notes

- Ensure the backend upload API is configured and reachable at `VITE_UPLOAD_API_URL`.
- Supported upload roles: `profile`, `portfolio`, `intro_video`, `portfolio_video`.
- The app assumes Syne font for headings and #dfcda5 as the accent color.
