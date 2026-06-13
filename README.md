# VenuePilot

VenuePilot is a production-quality MVP for an AI Booking and Operations Assistant for hospitality and activity-based venues such as billiard restaurants, bowling venues, karaoke bars, nightclubs, restaurants, and event spaces.

The first venue is **Biljardpalatset Göteborg AB**, a restaurant and billiards venue in Göteborg.

VenuePilot is intentionally human-in-the-loop. It assists staff and managers with booking analysis, demand forecasting, briefing preparation, customer-reply drafts, venue rules, and approval workflows. It does not replace staff, confirm bookings automatically, or send guest messages without human control.

## What Works Now

- Premium landing page with a venue-owner pitch and demo walkthrough.
- Manager dashboard with KPI cards, deterministic insights, charts, busiest/quietest days, and next manager actions.
- Caspeco Excel import for daily and weekday booking exports.
- Prisma persistence for venues, metrics, forecasts, inquiries, AI drafts, rules, packages, and manager briefings.
- Deterministic demand forecasting for 7, 14, and 30 day horizons.
- Weekly manager briefing generation using imported metrics, forecasts, and venue settings.
- Booking inquiry copilot with local mock mode when no `OPENAI_API_KEY` is present.
- Optional OpenAI mode behind an internal provider abstraction.
- Human approval queue for AI-prepared booking drafts.
- Venue settings and package management.
- Unit tests for parser, analytics, forecast, settings, copilot, approvals, and briefing logic.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Clean reusable components
- Prisma ORM
- SQLite for local development
- PostgreSQL for Vercel production deployments
- OpenAI API integration behind an abstraction layer
- Local mock AI mode when no API key is present

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env`:

```bash
DATABASE_URL="file:../dev.db"
OPENAI_API_KEY=""
AI_MODE="mock"
NEXT_PUBLIC_APP_NAME="VenuePilot"
TRIAL_ACCESS_PASSWORD=""
```

Because local SQLite uses `prisma/sqlite/schema.prisma`, the checked-in
`.env.example` points SQLite at `file:../dev.db`, which resolves to
`prisma/dev.db`.

3. Run migrations and seed the default venue:

```bash
npm run db:migrate
npm run db:seed
```

4. Start the app:

```bash
npm run dev
```

5. Open:

```txt
http://localhost:3000
```

## Useful Scripts

```bash
npm run dev          # local development server
npm run build        # production build
npm run lint         # ESLint
npm run typecheck    # TypeScript check
npm test             # Node test suite
npm run db:migrate   # Prisma migrate: SQLite dev locally, deploy for Postgres
npm run db:push      # push selected Prisma schema without creating a migration
npm run db:seed      # seed Biljardpalatset and default rules/packages
npm run db:studio    # Prisma Studio
```

The Prisma scripts choose a schema automatically:

- Local SQLite: `prisma/sqlite/schema.prisma`
- Vercel/Postgres: `prisma/schema.prisma`

Set `PRISMA_SCHEMA=prisma/schema.prisma` when you need to force the production
Postgres schema from a local shell.

## Routes

- `/` - pitch-ready landing page and demo walkthrough.
- `/dashboard` - manager dashboard with KPIs, charts, insights, and manager actions.
- `/data` - Caspeco Excel upload, preview, and save workflow.
- `/forecast` - deterministic demand forecast with confidence, demand levels, and recommendations.
- `/briefing` - weekly manager briefing generation and saved briefing history.
- `/copilot` - booking inquiry analysis and reply draft creation.
- `/approvals` - staff review, edit, approve, reject, follow-up, or manual handling for AI drafts.
- `/settings` - venue rules, AI safety settings, activity settings, and package management.

## Data Import

The MVP supports two Caspeco booking export shapes:

- Daily booking exports grouped by date.
- Weekday booking exports grouped by Swedish weekday.

The parser detects file type automatically, supports Swedish labels, handles null rows, skips total rows for metric imports, and upserts rows by venue/date or venue/weekday. Saved imports are persisted through Prisma into `DailyMetric` or `WeekdayMetric`; they are not stored only in browser memory or local files.

## AI Modes

VenuePilot resolves AI mode through `AI_MODE` and `OPENAI_API_KEY`:

- `AI_MODE=mock`: always use local mock mode, even in production.
- `AI_MODE=openai`: use OpenAI only when `OPENAI_API_KEY` is present.
- `AI_MODE=auto` or unset: use OpenAI when a key exists, otherwise mock mode.

Guest-facing booking decisions remain human-controlled in both modes.

`OPENAI_API_KEY` is read only on the server and is never exposed through
`NEXT_PUBLIC_*` variables.

## Trial Access Protection

The landing page at `/` stays public so a manager can understand the product.
Workspace routes are protected when `TRIAL_ACCESS_PASSWORD` is set:

- `/dashboard`
- `/data`
- `/forecast`
- `/briefing`
- `/copilot`
- `/approvals`
- `/settings`

In production, these routes require the shared trial password before access.
The password is checked on the server and stored only as a secure HTTP-only
cookie token. Staff can clear access with the `Log out` button in the workspace
topbar.

For local development, leaving `TRIAL_ACCESS_PASSWORD` empty allows access and
shows a warning banner inside the workspace. Do not share a Vercel trial URL
until `TRIAL_ACCESS_PASSWORD` is configured.

## Production Setup

Use Vercel with a persistent PostgreSQL database. SQLite is only for local
development and should not be used for an online manager trial.

Required Vercel environment variables:

```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
AI_MODE="mock"
OPENAI_API_KEY=""
NEXT_PUBLIC_APP_NAME="VenuePilot"
TRIAL_ACCESS_PASSWORD="choose-a-shared-trial-password"
```

For pooled providers such as Supabase, use the pooled connection string for
`DATABASE_URL` and the direct/non-pooler connection string for `DIRECT_URL`.
If your provider only gives one connection string, set both values to the same
Postgres URL.

Run production migrations before the manager trial with the production
`DATABASE_URL` and `DIRECT_URL` available in your shell:

```bash
export DATABASE_URL="postgresql://..."
export DIRECT_URL="postgresql://..."
PRISMA_SCHEMA=prisma/schema.prisma npm run db:migrate
PRISMA_SCHEMA=prisma/schema.prisma npm run db:seed
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full Vercel checklist.

## Folder Structure

```txt
VenuePilot/
  app/
    (app)/
      approvals/
      briefing/
      copilot/
      dashboard/
      data/
      forecast/
      settings/
    api/
      imports/
    page.tsx
  components/
    dashboard/
    AppShell.tsx
    Sidebar.tsx
    Topbar.tsx
    StatCard.tsx
    SectionCard.tsx
  lib/
    ai/
    approvals/
    briefing/
    dashboard/
    db/
    forecast/
    imports/
    settings/
  prisma/
    migrations/
    sqlite/
    schema.prisma
    seed.ts
  tests/
```

## Documentation

- [PRODUCT_SPEC.md](./PRODUCT_SPEC.md)
- [ROADMAP.md](./ROADMAP.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [AGENTS.md](./AGENTS.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [FINAL_REVIEW.md](./FINAL_REVIEW.md)

## Future Integrations

The MVP is structured so core booking, rule, approval, and AI systems can later connect to:

- Booking systems through scheduled imports, webhooks, or provider APIs.
- Email inboxes for booking inquiries and outgoing approved replies.
- SMS providers for reminders and guest follow-up.
- Instagram direct messages for inquiry triage and drafted responses.
- Website widgets for booking inquiries, package questions, and availability requests.
