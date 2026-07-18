# refjou

Reflect daily. Grow visibly.

A public daily-reflection journal inspired by *Atomic Habits* — write a short reflection
each day, keep a streak, share what you're currently reading, and let others like and
comment on your entries.

## What's built

- **Auth** — Firebase Authentication (email/password), with a server-verified httpOnly
  session cookie for page/API access (`src/lib/auth.ts`, `/api/auth/session`)
- **Daily reflection** — one structured entry per day: what happened, what you're proud
  of, what to improve, meditation check-in, mood (`src/app/new`)
- **Streaks with freeze tokens** — miss a day and it's covered by a freeze token instead
  of resetting to zero; one new token granted per week, capped at 3
  (`src/lib/streak.ts` — pure logic, storage-agnostic)
- **Public feed** — reflections are public by default with a per-entry private toggle
  (`src/app/page.tsx`, `src/lib/feed.ts`)
- **Likes & comments** on each reflection (denormalized counters on the reflection doc)
- **Currently reading** widget on every profile
- **Follow** other users

## Stack

Next.js (App Router) + TypeScript + Tailwind v4, with **Firebase** as the backend:
- **Firebase Authentication** for sign-up/login
- **Firestore** for all app data
- **Firebase Admin SDK** used server-side in API routes/server components (this is what
  actually reads/writes Firestore — the client SDK is only used for auth)

This solves the "SQLite doesn't persist on Vercel's serverless functions" problem from
the earlier version of this project — Firestore is a proper hosted database.

## One-time Firebase setup

1. Go to the [Firebase console](https://console.firebase.google.com), create a project.
2. **Enable Authentication** → Sign-in method → enable "Email/Password".
3. **Create a Firestore database** → Build → Firestore Database → Create database
   (start in production mode; the security rules in `firestore.rules` deny all direct
   client access anyway, since this app reads/writes Firestore only through the server).
4. **Get the client config**: Project settings → General → scroll to "Your apps" →
   add a Web app → copy the config values into `NEXT_PUBLIC_FIREBASE_*` below.
5. **Get an Admin service account**: Project settings → Service accounts → "Generate
   new private key" → downloads a JSON file. Copy `project_id`, `client_email`, and
   `private_key` from it into the server-side env vars below.
6. Deploy the security rules (optional but recommended):
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules --project <your-project-id>
   ```

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values from the steps above:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

`FIREBASE_PRIVATE_KEY` needs to keep its `\n` sequences. When you paste it into Vercel's
environment variable UI, paste it exactly as it appears in the downloaded JSON
(including the `\n`s) — Vercel stores it as a literal string and the app unescapes it
at runtime (`src/lib/firebaseAdmin.ts`).

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### Firestore composite indexes

The first time you load the public feed or a profile page, Firestore may return an
error with a direct link to create a required composite index (this app queries with
combined `where` + `orderBy` clauses, e.g. `isPrivate == false` ordered by `date` then
`createdAt`). Just click the link in the error/terminal output — it creates the index
in a couple of minutes and then the query works.

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add all the environment variables above in the Vercel project settings.
3. Deploy — no other config needed, Vercel auto-detects Next.js.

## Where things live

```
src/
  app/
    page.tsx              # public feed (home)
    new/                   # create today's reflection
    login/, register/      # auth pages (Firebase client SDK)
    profile/[username]/    # profile: streak, reading, reflections
    reflection/[id]/       # single reflection + comments
    api/                   # backend routes (use Firebase Admin SDK)
  components/               # ReflectionCard, Navbar, FollowButton, ReadingWidget, CommentSection
  lib/
    firebaseAdmin.ts        # server-only Firestore/Auth access (lazy-initialized)
    firebaseClient.ts       # browser-only Firebase Auth (lazy-initialized)
    auth.ts                 # session cookie creation/verification
    feed.ts                 # Firestore query + enrichment for reflection lists
    streak.ts               # pure streak-calculation logic (storage-agnostic)
firestore.rules             # denies all direct client access (server-only access model)
```

## Firestore data model

- `users/{uid}` — profile: username, name, bio, avatarEmoji, currentStreak,
  longestStreak, freezeTokens, lastFreezeGrantWeek, lastReflectionDate
- `usernames/{username}` — `{ uid }`, used to enforce username uniqueness and look up
  a profile by username
- `reflections/{id}` — userId, date, content, proudOf, improveTomorrow, meditated,
  mood, isPrivate, usedFreeze, createdAt, likeCount, commentCount
  - `reflections/{id}/likes/{uid}` — presence = liked
  - `reflections/{id}/comments/{commentId}` — userId, content, createdAt
- `currentlyReading/{uid}` — title, author, progressPercent
- `follows/{followerUid}_{followingUid}` — followerId, followingId, createdAt

## Ideas for what's next (see product roadmap discussed in chat)

- Habit stack: track 2-3 recurring habits as checkboxes per entry
- Weekly identity recap ("You reflected 6/7 days this week")
- Daily reminder notifications
- Friend-only leaderboards
- Book-club threads for people reading the same book
- Real-time likes/comments via Firestore client listeners instead of manual refresh
