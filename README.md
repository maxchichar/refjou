# refjou

Reflect daily. Grow visibly.

A public daily-reflection journal inspired by *Atomic Habits* — write a short reflection
each day, keep a streak, share what you're currently reading, and let others like and
comment on your entries.

## What's built

- **Auth** — email/password, sessions via httpOnly JWT cookie (`src/lib/auth.ts`)
- **Daily reflection** — one structured entry per day: what happened, what you're proud
  of, what to improve, meditation check-in, mood (`src/app/new`)
- **Streaks with freeze tokens** — miss a day and it's covered by a freeze token instead
  of resetting to zero; one new token granted per week, capped at 3
  (`src/lib/streak.ts`)
- **Public feed** — reflections are public by default with a per-entry private toggle
  (`src/app/page.tsx`, `src/lib/feed.ts`)
- **Likes & comments** on each reflection
- **Currently reading** widget on every profile
- **Follow** other users

## Stack

Next.js (App Router) + TypeScript + Tailwind v4, with Drizzle ORM on top of SQLite
for local development (`refjou.db`, created automatically on first run).

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. The SQLite file `refjou.db` is created automatically the
first time the app runs — no separate migration step needed for local dev.

Copy `.env.example` to `.env.local` and set a real `JWT_SECRET` before doing anything
beyond local testing.

## Deploying to Vercel

**Important:** Vercel's serverless functions do not have a persistent filesystem, so
the SQLite setup here (`refjou.db` written to disk) will not persist data between
deployments or even between function invocations in production. Before deploying:

1. Provision a Postgres database — Neon (neon.tech) or Vercel Postgres both have free
   tiers and work well with Drizzle.
2. Swap the driver in `src/db/index.ts` from `drizzle-orm/better-sqlite3` to
   `drizzle-orm/neon-http` (or `drizzle-orm/vercel-postgres`), and update
   `src/db/schema.ts` to use `drizzle-orm/pg-core` table types instead of
   `sqlite-core` (column types map almost 1:1 — `text`, `integer`, `boolean`).
3. Set `JWT_SECRET` and your database connection string as environment variables in
   the Vercel project settings.
4. Push to GitHub and import the repo in Vercel — it will auto-detect Next.js.

## Where things live

```
src/
  app/
    page.tsx              # public feed (home)
    new/                   # create today's reflection
    login/, register/      # auth pages
    profile/[username]/    # profile: streak, reading, reflections
    reflection/[id]/       # single reflection + comments
    api/                   # all backend routes
  components/               # ReflectionCard, Navbar, FollowButton, ReadingWidget, CommentSection
  db/                        # Drizzle schema + connection
  lib/                       # auth, streak logic, feed query helper
```

## Ideas for what's next (see product roadmap discussed in chat)

- Habit stack: track 2-3 recurring habits as checkboxes per entry
- Weekly identity recap ("You reflected 6/7 days this week")
- Daily reminder notifications
- Friend-only leaderboards
- Book-club threads for people reading the same book
