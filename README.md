# pulse

<div align="center">

![pulse-logo](./public/logo.svg)

**Workouts, nutrition and daily care — in one private place.**

</div>

A personal tracker built for one phone (an iPhone) and one person. No ads, no
feed, no social layer. Sign in with Google and everything you log is yours.

## What it does

**Workouts you build.** A library of movements — each with an optional YouTube
demo, image, GIF and your own cues — that you assemble into named workouts and
assign to weekdays. Tap a set to log it; the last weight you used carries
forward, so a normal working set is one tap. A pencil icon opens per-set weight
and reps when you want the detail.

**Calories that add up.** Save the foods you actually eat with their calories
per serving, then tap to log them and scale the servings. For the one-off street
samosa there's a custom entry: a name and a calorie estimate, with an option to
promote it into your library. Every day rolls into a running deficit so the
whole cut is visible as one number.

**Routines that stick.** Morning and night care steps with per-step frequency —
every day, alternate days, or specific weekdays (the 3×-a-week retinol case).
Products and notes live on the step.

**Charts that mean something.** Daily calories against target, the cumulative
deficit, macros, weight, training volume, where the calories came from, and a
consistency grid across food, training and care. Every chart has a table view,
so no value is reachable only by hovering.

Dark mode follows the system by default and can be pinned from Profile.

## Stack

- Next.js 16 (App Router) + React 19, Tailwind v4
- NextAuth (Google, JWT sessions)
- Prisma 7 + Postgres (Neon)
- Recharts

## Running it

```bash
npm install
npx prisma migrate deploy   # or: npx prisma migrate dev
npm run dev
```

`.env.local` needs:

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
DATABASE_URL=
```

`npm run build` applies pending migrations before building, so a deploy brings
the schema with it.

## How it's laid out

```
src/
  app/api/           REST handlers — one folder per resource
  server/            Server-only: auth guard, request helpers, first-login seed
  lib/               Date keys, care scheduling, client data layer, shared types
  components/
    common/          Bottom sheet, rings, date strip, form primitives
    charts/          Chart frame (legend + table view) and the insight charts
    navigation_tabs/ One folder per tab
    pages/           Login and the app shell
prisma/              Schema and migrations
```

Two things worth knowing before changing anything:

- **Dates are `YYYY-MM-DD` strings, never `Date`s.** Build them with the helpers
  in `src/lib/dates.ts` — `toISOString()` silently shifts the day outside UTC.
- **Deleting a saved food, exercise or care step archives it.** History keeps
  pointing at the row, so past days never change shape underneath you.

A new account seeds itself once with a starter plan, a food list and a care
routine (`src/server/defaults.ts`). All of it is editable or deletable.
