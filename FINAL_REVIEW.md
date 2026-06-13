# VenuePilot Final Review

Review date: 2026-06-02

## Summary

VenuePilot is demoable as a local MVP for Biljardpalatset Göteborg AB. The app runs locally, migrations and seed work, core routes load, Caspeco import works, forecasting works, mock-mode copilot works, approvals persist, settings persist, briefings generate, and the validation suite passes.

The MVP is positioned correctly as a human-in-the-loop assistant. It helps staff understand demand, reduce admin, draft replies, and prepare manager actions without claiming to replace staff or automatically confirm bookings.

## What Was Built

- Pitch-ready landing page with a five-step demo walkthrough.
- Manager dashboard with booking/guest KPIs, monthly charts, daily trend chart, weekday performance, busiest/quietest days, deterministic insights, and next manager actions.
- Caspeco Excel import for daily and weekday booking exports.
- Prisma SQLite schema and migrations for:
  - Venue
  - DailyMetric
  - WeekdayMetric
  - Forecast
  - BookingInquiry
  - AIDraft
  - VenueRule
  - Package
  - ManagerBriefing
- Seed data for Biljardpalatset Göteborg AB, venue rules, AI safety settings, and packages.
- Deterministic demand forecasting with confidence, demand levels, explanations, and recommended actions.
- Weekly manager briefing generation from imported metrics, forecasts, venue rules, and packages.
- Booking inquiry copilot with local mock mode and optional OpenAI mode.
- Human approval queue for AI-prepared booking drafts.
- Venue settings and package management.
- Unit tests for parser, analytics, forecast, settings, copilot, approvals, and briefing logic.

## How To Run It

Install dependencies:

```bash
npm install
```

Create `.env`:

```bash
DATABASE_URL="file:../dev.db"
OPENAI_API_KEY=""
AI_MODE="mock"
NEXT_PUBLIC_APP_NAME="VenuePilot"
TRIAL_ACCESS_PASSWORD=""
```

Run migrations and seed:

```bash
npm run db:migrate
npm run db:seed
```

Start local dev server:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## What Works

- App runs locally on `localhost:3000`.
- Database migration workflow is in sync.
- Seed creates/updates the default venue, rules, and packages.
- All core routes return HTTP 200:
  - `/`
  - `/dashboard`
  - `/data`
  - `/forecast`
  - `/briefing`
  - `/copilot`
  - `/approvals`
  - `/settings`
- Daily Caspeco Excel import previews and saves `DailyMetric` rows.
- Weekday Caspeco Excel import previews and saves `WeekdayMetric` rows.
- Import rows upsert rather than duplicate.
- Forecast generation saves rows to `Forecast`.
- Copilot works in mock mode when `OPENAI_API_KEY` is empty.
- Copilot saves `BookingInquiry` and `AIDraft`.
- Approval edits and status updates persist.
- Settings and packages persist.
- Briefings generate and save in deterministic mode.
- Lint passes.
- Typecheck passes.
- Tests pass.
- Production build passes.

## Verification Performed

Commands run:

```bash
npx prisma migrate status
npx prisma validate
npx prisma migrate dev --skip-seed
npm run db:seed
npm run typecheck
npm test
npm run lint
npm run build
```

Workflow checks performed:

- Generated and uploaded daily and weekday Excel files through the import API.
- Verified saved daily and weekday metric counts.
- Generated and saved 14 deterministic forecasts.
- Ran mock copilot analysis for a large corporate billiards/dinner inquiry.
- Saved the copilot result to inquiry and draft tables.
- Approved an AI draft and verified status/reply persistence.
- Saved venue settings through the settings action and verified rule persistence.
- Created and removed a package through the package action.
- Generated and saved a weekly manager briefing.
- Browser-smoked homepage and dashboard after polishing.

## Known Limitations

- No authentication or user roles yet.
- SQLite is suitable for local development only; production should use Postgres through `prisma/schema.prisma`.
- Vercel/Postgres deployment configuration now exists, but it has not been exercised against a live hosted database in this local review.
- No real outbound email, SMS, Instagram, or booking-system sending.
- Approval means internal approval only; it does not transmit messages.
- Forecasting is deterministic and explainable but still simple.
- Imported data currently supports Caspeco daily and weekday exports only.
- No row-level imported data browser beyond preview/import summary.
- No real availability lookup or booking confirmation integration.
- OpenAI mode is implemented but not fully load-tested with production prompts, monitoring, or cost controls.
- No audit log for settings changes, approvals, or AI outputs.
- No multi-venue tenant isolation beyond schema support.

## Recommended Next Steps

- Add a real imported rows view on `/data` with filters, source labels, and delete/reimport controls.
- Add richer sample/demo data so dashboard and forecast demos show a full week/month pattern.
- Add smoke tests for route rendering and server actions.
- Add Playwright E2E tests for upload, copilot, approvals, settings, and briefing.
- Add explicit loading and success states for server actions.
- Add better empty states for sparse datasets and first-run onboarding.
- Add structured audit events for AI drafts, approvals, and settings changes.
- Add exportable manager briefing PDF/email draft.

## Before Showing It To A Real Venue

- Import a realistic sample dataset from the venue, not only smoke-test rows.
- Confirm venue-specific opening hours, booking policy, deposit policy, package names, and escalation thresholds.
- Prepare a guided demo script:
  1. Upload booking data.
  2. Show trends on dashboard.
  3. Generate forecast.
  4. Generate manager briefing.
  5. Paste booking inquiry.
  6. Review and approve draft internally.
- Add a short disclaimer in the demo that no real guest messages are sent yet.
- Validate Swedish language handling for real customer inquiries.
- Check mobile/tablet layout on the actual device used for the demo.

## Before Charging Customers

- Add authentication, user roles, and venue/team permissions.
- Move from SQLite to Supabase/Postgres.
- Add production deployment, backups, environment management, and monitoring.
- Add secure file upload limits, validation, and retention rules.
- Add full audit logging for settings, AI output, approvals, and message sends.
- Add real booking-system integration or a reliable availability source.
- Add email/SMS/Instagram sending only after approval controls are complete.
- Add human-review policies per customer and contract.
- Add data privacy review for guest messages and contact details.
- Add billing, onboarding, support workflow, and customer-specific configuration.
- Add observability for AI cost, latency, provider failures, and fallback behavior.
- Add regression E2E tests for every paid workflow.

## Demo Readiness

Status: ready for local testing and MVP demo with controlled data.

The app should not be presented as fully production-ready for live customer operations until authentication, audit logs, production database, deployment, real availability checks, and controlled outbound integrations are implemented.
