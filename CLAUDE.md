# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# AllevatoriItalia

Directory platform for professional dog breeders in the Italian market.

## Tech Stack

- **Framework**: Next.js (App Router) + React 19
- **Database & Auth**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Styling**: Tailwind CSS v4 with custom CSS variables
- **Language**: TypeScript
- **Payments**: Stripe
- **Validation**: Zod
- **Icons**: lucide-react

## Getting Started

```bash
npm install
cp .env.local.example .env.local  # Fill in Supabase credentials
npm run dev                        # Runs on http://localhost:3000
```

The app works without Supabase configured (null guards throughout) — auth pages show "Supabase non configurato" and public pages render with demo data.

## Commands

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

There are no automated tests in this project.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL         # Defaults to http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY    # Admin operations only
STRIPE_SECRET_KEY
STRIPE_PREMIUM_PRICE_ID
STRIPE_ELITE_PRICE_ID
```

## Database Setup

1. Create a Supabase project at https://supabase.com
2. Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor
3. Copy the project URL and anon key to `.env.local`

To reset: run `supabase/migrations/000_drop_all.sql` first.

## Architecture

### Route Groups

Each group has its own `layout.tsx`:

| Group | URL prefix | Purpose |
|---|---|---|
| `(public)` | `/allevatori`, `/razze`, `/regioni` | Public-facing directory |
| `(auth)` | `/accedi`, `/registrati`, `/recupera-password` | Auth flows |
| `(dashboard)` | `/dashboard` | Breeder-only management |
| `(admin)` | `/admin` | Admin panel |

Route protection is client-side — middleware (`middleware.ts`) is a passthrough. Dashboard and admin pages redirect unauthenticated users in their layouts.

### Supabase Clients

Three distinct clients in `src/lib/supabase/`:

- **`client.ts`** — Browser client. Returns `null` when env vars are missing. Always null-check before use.
- **`server.ts`** — Server Component / API Route client. Uses cookies for session.
- **`admin.ts`** — Service role client. Only use in API routes that need elevated access (bypasses RLS).

### Auth Session (Non-Standard Pattern)

Login bypasses the Supabase JS SDK to avoid `navigator.locks` conflicts:

1. `/accedi` page POSTs directly to `{SUPABASE_URL}/auth/v1/token?grant_type=password`
2. The session is stored in localStorage under the key `sb-{project-ref}-auth-token`
3. `AuthProvider` reads from localStorage on mount instead of using `onAuthStateChange`
4. Logout: `localStorage.removeItem(key)` + redirect

This means server components cannot see the session via cookies on initial load — auth state is client-only unless the user has a valid cookie from a server-side refresh.

### API Routes

All live under `src/app/api/`:

- `/api/breeders` — search (GET) + create (POST); `[id]` — GET/PATCH/DELETE
- `/api/breeds` — list all breeds
- `/api/litters` — CRUD for cucciolate (litters), with nested puppies; `[id]` — GET/PATCH/DELETE
- `/api/puppies` — CRUD for individual puppies within a litter; `[id]` — GET/PATCH/DELETE
- `/api/messages` — conversations + messages
- `/api/reviews` — CRUD with moderation
- `/api/upload` — Supabase Storage upload (jpg/png/webp/gif, max 5MB)
- `/api/subscriptions` — Stripe Checkout session creation
- `/api/webhooks/stripe` — handles `customer.subscription.*` events
- `/api/admin/breeders`, `/api/admin/reviews` — admin-only moderation endpoints
- `/api/auth/callback` — Supabase OAuth exchange

### Database Schema (Key Points)

- **`profiles`**: extends `auth.users` via trigger (auto-created on signup). Role: `'user' | 'breeder' | 'admin'`.
- **`breeder_profiles`**: linked to `profiles`. Contains kennel info, `breed_ids[]` (array), `gallery_urls[]`, geo coordinates, ENCI/FCI flags, `is_approved`, `is_premium`. Slug is unique.
- **`breeds`**: static seed data — 50 breeds. Has `is_italian_breed`, FCI group, size category.
- **`litters`**: cucciolate linked to `breeding_dogs` via `mother_id`/`father_id`. Supports external fathers (`is_external_father` + `external_father_*` fields). Status: `'attivo' | 'venduto' | 'scaduto' | 'bozza'`.
- **`puppies`**: individual puppies within a litter. Fields: name, sex, color, status (`'disponibile' | 'prenotato' | 'venduto'`), photo, price, microchip.
- **`reviews`**: rating 1–5, UNIQUE on `(breeder_id, author_id)`. DB trigger auto-updates `breeder_profiles.average_rating` and `review_count`.
- **`conversations` + `messages`**: simple two-participant messaging.
- **`subscriptions`**: tracks Stripe subscription state per user.
- **`favorites`**: user saves breeder, UNIQUE on `(user_id, breeder_id)`.

All tables have RLS enabled. See `supabase/migrations/001_initial_schema.sql` for full policies.

### Subscription Plans

Defined in `src/lib/constants.ts`:

| Plan | Price | Limits |
|---|---|---|
| Base | €0 | 3 photos, 1 listing, basic messaging |
| Premium | €19.90/mo | 20 photos, 5 listings, badge, priority placement, stats |
| Elite | €39.90/mo | Unlimited photos/listings, top placement, support |

## Key Conventions

- **Italian localization**: All UI text is in Italian. URLs use Italian slugs (`/allevatori`, `/razze`, `/accedi`).
- **Supabase null guards**: `createClient()` returns `null` when Supabase is not configured. Always check `if (!supabase)` before calling `.auth` or querying.
- **Server components by default**: Use `'use client'` only for forms and interactive UI.
- **`cn()` utility**: Use `cn()` from `src/lib/utils.ts` (wraps `clsx` + `tailwind-merge`) for all className composition.
- **`slugify()`**: All user-facing slugs go through `slugify()` from `src/lib/utils.ts`.
- **ENCI**: Italian Kennel Club certification. `enci_number` + `enci_verified` on breeder profiles.
- **FCI breed groups**: Breeds classified in groups 1–10 (e.g., Cani da pastore, Molossoidi).
- **Static data**: Breeds and regions are static TypeScript files in `src/data/` — not fetched from DB for public pages.
