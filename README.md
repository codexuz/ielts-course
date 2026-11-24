# IELTS Max — Next.js + Supabase + shadcn/ui Platform

A full-parity English & IELTS preparation web application featuring a 24-day (and 48-day split pace) structured curriculum, Computer-Delivered IELTS Mock Exams, a 43-article Leveled Reading Room (A2–C2), an SRS Word Bank, Cohort Rankings, and a complete Teacher/Admin Panel.

## 1. Supabase Database Setup (Clean Curriculum + Admin Only)

1. Open your Supabase Dashboard → **SQL Editor**, paste and run [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql).
   - Creates all 15+ tables (`days`, `tests`, `answer_keys`, `profiles`, `groups`, `submissions`, `test_results`, `vocab`, `writing_feedback`, `recordings`, `homework_time`, `reading_*`, `telegram_links`), Row-Level Security (RLS) policies, Storage buckets, and RPC functions.
   - Automatically backfills pre-created `auth.users` into `public.profiles` with their assigned role.
2. Copy `.env.example` to `.env.local` (or `.env`) and set:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-publishable-or-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-or-secret-key>
   ```
3. Seed the **clean curriculum** (all 24 days, grammar2 sets, 9 IELTS/Placement exams with verified audio links, and answer keys — **without** old users, progress, or groups) and promote the Admin account:
   ```bash
   npm run seed
   ```

## 2. Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Sign in with your Admin account at `/login` to access the Admin Panel (`/admin`) where you can create groups, enroll students (`Add User`), unlock days/articles, and edit course days or IELTS exams.

## 3. Deploy to Vercel

1. Import `https://github.com/codexuz/ielts-max` in [Vercel](https://vercel.com/new).
2. Vercel auto-detects **Next.js** via `vercel.json`.
3. Add these **Environment Variables** in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` *(server-only — enables Admin Panel `Add User` via `/api/admin/users`)*
4. Click **Deploy**.
