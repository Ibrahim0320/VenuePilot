# VenuePilot Deployment Guide

This guide prepares VenuePilot for an online manager trial on Vercel with a
persistent PostgreSQL database.

VenuePilot must remain human-in-the-loop in production: AI can draft, summarize
and recommend, but it must not automatically send guest replies or confirm
bookings.

## Deployment Shape

- Vercel hosts the Next.js App Router application.
- PostgreSQL stores production data through Prisma.
- SQLite remains available for local development through
  `prisma/sqlite/schema.prisma`.
- `prisma/schema.prisma` is the production PostgreSQL schema.
- `AI_MODE=mock` allows production demos without an OpenAI key.

## Required Environment Variables

Set these in Vercel under Project Settings > Environment Variables.

| Name                    | Required           | Example            | Notes                                                                                                                                      |
| ----------------------- | ------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`          | Yes                | `postgresql://...` | Runtime Postgres connection. Use a pooled URL when your provider recommends pooling for serverless apps.                                   |
| `DIRECT_URL`            | Yes for migrations | `postgresql://...` | Direct Postgres connection for Prisma migrations. If your provider has no separate direct URL, set it to the same value as `DATABASE_URL`. |
| `OPENAI_API_KEY`        | No                 | `sk-...`           | Server-side only. Leave empty when running mock mode.                                                                                      |
| `AI_MODE`               | Yes                | `mock`             | Use `mock` for the first trial. Use `openai` only when an API key is configured. `auto` uses OpenAI when a key exists.                     |
| `NEXT_PUBLIC_APP_NAME`  | Yes                | `VenuePilot`       | Public app display name. Safe for the browser.                                                                                             |
| `TRIAL_ACCESS_PASSWORD` | Recommended        | `shared-password`  | Enables the lightweight password gate for manager routes and API endpoints. Leave empty only for local development or public demos.        |

Never prefix secrets such as `OPENAI_API_KEY`, `DATABASE_URL`, or `DIRECT_URL`
with `NEXT_PUBLIC_`.

## 1. Create A Postgres Database

Use one of:

- Vercel Postgres / Neon
- Supabase Postgres
- Any managed PostgreSQL database reachable from Vercel

For Supabase, prefer:

- `DATABASE_URL`: pooler connection string
- `DIRECT_URL`: direct connection string

For Neon/Vercel Postgres, use the provider's recommended pooled URL for
runtime and direct URL for migrations when both are available.

## 2. Configure Vercel

1. Import the Git repository into Vercel.
2. Keep the framework preset as Next.js.
3. Build command: `npm run build`
4. Install command: Vercel default (`npm install`) is fine.
5. Start command: leave empty for Vercel serverless deployment.
6. Add all environment variables listed above.

During install, `postinstall` runs `node scripts/prisma-generate.mjs`. On Vercel
it selects `prisma/schema.prisma`, so the generated Prisma Client targets
PostgreSQL.

## 3. Run Production Migrations

Run migrations from a trusted local terminal or CI job with the production
database environment available:

```bash
export DATABASE_URL="postgresql://..."
export DIRECT_URL="postgresql://..."
export PRISMA_SCHEMA="prisma/schema.prisma"

npm run prisma:generate
npm run db:migrate
npm run db:seed
```

`npm run db:migrate` uses `prisma migrate deploy` when the selected schema is
PostgreSQL. It uses `prisma migrate dev` only for the local SQLite schema.

Do not use SQLite for production persistence.

## 4. Deploy

Trigger a Vercel deployment after migrations and seed have succeeded.

After deployment, open:

```txt
https://your-vercel-project.vercel.app
```

If `TRIAL_ACCESS_PASSWORD` is set, manager routes such as `/dashboard`,
`/data`, `/forecast`, `/briefing`, `/copilot`, `/approvals`, and `/settings`
redirect to `/trial-login` until the shared password is entered.

## 5. Verify The Online Trial

Open these routes after login:

- `/`
- `/dashboard`
- `/data`
- `/forecast?horizon=14`
- `/briefing`
- `/copilot`
- `/approvals`
- `/settings`

Recommended smoke test:

1. Upload a small Caspeco daily export on `/data`.
2. Save the preview and confirm the import summary.
3. Check `/dashboard` for KPI and chart updates.
4. Generate a 14-day forecast on `/forecast`.
5. Generate a manager briefing on `/briefing`.
6. Paste a booking inquiry into `/copilot` with `AI_MODE=mock`.
7. Open the created draft on `/approvals`, edit it, and mark it approved.
8. Confirm no message is sent externally.

## AI Mode Notes

For the first manager trial, use:

```bash
AI_MODE="mock"
OPENAI_API_KEY=""
```

This keeps the demo deterministic and avoids API dependency or cost. When ready
to test real AI output:

```bash
AI_MODE="openai"
OPENAI_API_KEY="sk-..."
```

If `AI_MODE=openai` is set without an API key, VenuePilot falls back to mock
mode instead of crashing.

## Data Persistence Notes

The upload flow parses Excel files in memory for preview, then saves accepted
rows through Prisma:

- Daily files upsert `DailyMetric` rows by `venueId + date`.
- Weekday files upsert `WeekdayMetric` rows by `venueId + weekday`.

No imported booking metrics rely on local files or browser memory after saving.

## Production Deployment Checklist

- [ ] Vercel project connected to the correct repository and branch.
- [ ] PostgreSQL database provisioned.
- [ ] `DATABASE_URL` set to a Postgres URL.
- [ ] `DIRECT_URL` set for Prisma migrations.
- [ ] `AI_MODE=mock` for the first trial unless OpenAI testing is intentional.
- [ ] `OPENAI_API_KEY` set only when using OpenAI mode.
- [ ] `NEXT_PUBLIC_APP_NAME=VenuePilot`.
- [ ] `TRIAL_ACCESS_PASSWORD` set for manager trial access.
- [ ] `npm run lint` passes locally.
- [ ] `npm run typecheck` passes locally.
- [ ] `npm test` passes locally.
- [ ] `npm run build` passes locally.
- [ ] `npm run db:migrate` has been run against production Postgres.
- [ ] `npm run db:seed` has seeded Biljardpalatset Göteborg AB.
- [ ] Import smoke test confirms rows persist after page refresh.
- [ ] Copilot smoke test creates a pending approval draft.
- [ ] Approval smoke test updates status without sending any real message.
- [ ] Settings page shows venue rules and package defaults.
- [ ] Human-in-the-loop copy is visible on copilot, approvals and briefing pages.

## Before Showing It To A Real Venue

- Load a realistic sample export from the venue.
- Confirm venue opening hours, deposit policy, package descriptions and group
  thresholds.
- Use `AI_MODE=mock` unless OpenAI responses have been reviewed with the venue's
  actual rules.
- Prepare a short walkthrough: import, dashboard, forecast, briefing, copilot,
  approvals.

## Before Charging Customers

- Add real authentication and roles.
- Add audit logs for imports, AI drafts, approvals and settings changes.
- Add tenant isolation for multiple venues.
- Add backup and retention policy for guest data.
- Add monitoring for import failures, Prisma errors and AI provider errors.
- Add explicit consent/privacy review for guest messages.
- Add outbound email/SMS/Instagram/booking-system integrations only after the
  approval workflow is fully audited.
