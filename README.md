# VenuePilot

VenuePilot is a production-quality MVP for an AI Booking and Operations Assistant for hospitality and activity-based venues: billiard restaurants, bowling venues, karaoke bars, nightclubs, restaurants, and event spaces.

The first customer is **Biljardpalatset Göteborg AB**, a restaurant and billiards venue.

VenuePilot is not positioned as a replacement for staff. It is a human-in-the-loop assistant that helps venue teams understand booking demand, prepare better decisions, and draft operational work for human review.

## MVP Scope

The initial product should include:

- Dashboard for bookings, guests, demand, and operating signals.
- Excel upload/import for historic bookings and guest data.
- Booking and guest analytics.
- Demand forecasting by date, weekday, time block, package, and venue area.
- AI manager briefing with highlights, risks, and recommended actions.
- Booking inquiry copilot that drafts replies and summaries for staff approval.
- Venue settings for opening hours, booking rules, packages, deposits, and policies.
- Human approval workflow for AI-generated replies, summaries, recommendations, and rule-sensitive actions.

## Product Principles

- Assist staff and managers. Do not claim to replace them.
- Keep humans in control of guest communication and operational decisions.
- Make AI output traceable, editable, and approvable.
- Prefer clear operational recommendations over generic chat.
- Build for one real venue first, with a path to multiple venues later.
- Treat venue rules as source-of-truth configuration, not prompt-only instructions.

## Tech Stack

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- shadcn/ui or clean reusable components.
- Prisma ORM.
- SQLite for the local MVP.
- Postgres-compatible schema for later Supabase migration.
- OpenAI API behind an internal AI provider abstraction.
- Local mock AI mode when no API key is present.

## Documentation

- [PRODUCT_SPEC.md](./PRODUCT_SPEC.md): product behavior, personas, workflows, acceptance criteria, and first data model.
- [ROADMAP.md](./ROADMAP.md): phased MVP plan from scaffold to integrations.
- [ARCHITECTURE.md](./ARCHITECTURE.md): application layers, folder structure, database design, AI abstraction, and integration notes.
- [AGENTS.md](./AGENTS.md): instructions for Codex and other coding agents working in this repo.

## Planned Folder Structure

```txt
VenuePilot/
  app/
    (app)/
      dashboard/
      imports/
      bookings/
      analytics/
      forecast/
      briefing/
      inquiries/
      approvals/
      settings/
    api/
      imports/
      ai/
      approvals/
      forecast/
  components/
    ui/
    app/
    charts/
    forms/
  lib/
    ai/
    analytics/
    auth/
    db/
    forecast/
    imports/
    rules/
    validation/
  prisma/
    schema.prisma
    seed.ts
  tests/
    unit/
    integration/
    e2e/
  docs/
```

## Local Development

Local development uses:

```bash
npm install
npm run prisma:push
npm run prisma:seed
npm run dev
```

Quality checks should use:

```bash
npm run lint
npm run typecheck
npm test
```

The current scaffold includes these routes:

- `/`: landing page.
- `/dashboard`: manager dashboard.
- `/data`: upload and imported data placeholder.
- `/forecast`: demand forecast placeholder.
- `/briefing`: AI manager briefing placeholder.
- `/copilot`: booking inquiry copilot placeholder.
- `/settings`: venue rules and settings placeholder.
- `/approvals`: human approval queue placeholder.

## AI Modes

VenuePilot should support two AI modes:

- `mock`: deterministic local responses for development, tests, demos, and environments without an API key.
- `openai`: production provider using the OpenAI API through `lib/ai`.

The app should select mock mode automatically when no API key is present, unless explicitly configured otherwise.

Expected environment variables:

```bash
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY=""
AI_MODE="mock"
```

## Future Integrations

The MVP should be designed so the core booking, rule, approval, and AI systems can later connect to:

- Booking systems through scheduled imports, webhooks, or provider APIs.
- Email inboxes for booking inquiries and outgoing approved replies.
- SMS providers for reminders and guest follow-up.
- Instagram direct messages for inquiry triage and drafted responses.
- Website widgets for embedded booking inquiries, package questions, and availability requests.
