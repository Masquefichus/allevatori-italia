# AllevatoriItalia

Directory platform for professional dog breeders in the Italian market.

## Tech Stack

- **Framework**: Next.js (App Router) + React
- **Database & Auth**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Styling**: Tailwind CSS v4 with custom CSS variables
- **Language**: TypeScript
- **Payments**: Stripe (planned)

## Getting Started

```bash
npm install
cp .env.local.example .env.local  # Fill in Supabase credentials
npm run dev                        # Runs on http://localhost:3000
```

The app works without Supabase configured (null guards throughout) — auth pages show "Supabase non configurato" and public pages render with demo data.

## Database Setup

1. Create a Supabase project at https://supabase.com
2. Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor
3. Copy the project URL and anon key to `.env.local`

## Project Structure

```
src/
├── app/
│   ├── (admin)/        # Admin panel (route group)
│   ├── (auth)/         # Login, register, password reset
│   ├── (dashboard)/    # Breeder dashboard
│   ├── (public)/       # Public pages (allevatori, razze, regioni)
│   ├── api/            # API routes
│   └── page.tsx        # Homepage
├── components/
│   ├── auth/           # AuthProvider context
│   ├── layout/         # Header, Footer
│   └── ui/             # Button, Card, Input, Select, Badge, Rating, Pagination
├── data/
│   ├── razze.ts        # 50 dog breeds (13 Italian + 37 international)
│   └── regioni.ts      # 20 Italian regions with 107 provinces
├── lib/
│   ├── constants.ts    # Site config, nav links, subscription plans
│   ├── utils.ts        # cn(), slugify(), formatPrice(), formatDate()
│   └── supabase/       # Client (browser), server, admin Supabase clients
└── types/
    └── database.ts     # Full TypeScript types for all tables
```

## Key Conventions

- **Italian localization**: All UI text is in Italian. URLs use Italian slugs (e.g., `/allevatori`, `/razze`, `/accedi`).
- **Supabase null guards**: `createClient()` returns `null` when Supabase is not configured. Always check for `null` before calling `.auth` or querying.
- **Server components by default**: Pages are server components. Use `'use client'` only when needed (forms, interactive UI).
- **Route groups**: `(auth)`, `(public)`, `(dashboard)`, `(admin)` — each with its own layout.
- **RLS policies**: All database tables use Row Level Security. See the migration file for policy definitions.
- **ENCI certification**: Italian Kennel Club (ENCI) is the primary breeder certification.
- **FCI breed groups**: Breeds are classified by FCI (Federation Cynologique Internationale) groups 1-10.

## Commands

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```
