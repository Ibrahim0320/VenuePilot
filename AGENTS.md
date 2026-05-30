# Agent Instructions

These instructions apply to Codex and other coding agents working in this repository.

## Product Framing

VenuePilot is a human-in-the-loop AI Booking and Operations Assistant for hospitality and activity-based venues.

Always preserve this framing:
- The product assists staff and managers.
- The product does not replace human staff.
- AI output is draft, suggestive, reviewable, and auditable.
- Guest-facing messages and operationally sensitive recommendations require human approval.

## Engineering Standards

- Write clean, idiomatic TypeScript.
- Prefer explicit types at module boundaries.
- Keep domain logic in `lib`, not inside React components.
- Keep UI components small, reusable, and accessible.
- Avoid unnecessary dependencies.
- Use existing project patterns before introducing new abstractions.
- Do not add broad refactors while solving a narrow task.
- Keep files focused and names descriptive.

## Stack Expectations

Use:
- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- shadcn/ui or clean reusable components.
- Prisma ORM.
- SQLite for the local MVP.
- Postgres-compatible Prisma patterns for future Supabase migration.
- OpenAI API only through `lib/ai`.
- Mock AI mode when no API key is present.

## AI Safety and Human Approval

Agents must enforce these rules in code and copy:
- Do not automatically send AI-generated guest replies.
- Do not present AI recommendations as final decisions.
- Do not invent venue policies, prices, deposits, availability, or opening hours.
- Use venue settings and rules as structured source-of-truth context.
- Store AI interaction metadata where practical.
- Create approval tasks for guest-facing drafts and sensitive recommendations.
- Make it obvious in the UI when text is AI-generated.

## Code Organization

Follow the planned structure in `ARCHITECTURE.md`.

Important boundaries:
- `lib/imports`: file parsing, mapping, validation, normalization.
- `lib/analytics`: deterministic metrics.
- `lib/forecast`: deterministic demand forecasting.
- `lib/rules`: venue rule checks and AI context.
- `lib/ai`: provider abstraction, mock provider, OpenAI provider, prompt modules.
- `components/ui`: generic UI primitives.
- `components/*`: domain-specific UI.
- `app/api`: thin handlers that call services.

Do not import provider SDKs directly into pages or components.

## Dependencies

Before adding a dependency, check whether:
- The platform, TypeScript, Prisma, or existing project dependencies already solve the problem.
- The dependency is maintained and appropriate for production.
- The dependency adds meaningful value for the MVP.

Good candidates:
- Excel parsing library.
- Date utility if needed.
- Charting library if the project does not already have one.

Avoid:
- Heavy state management before it is needed.
- Multiple UI libraries.
- AI provider code scattered across the app.
- One-off parsing hacks when structured parsing is available.

## Tests and Checks

After meaningful code changes, run:

```bash
npm run lint
npm run typecheck
npm test
```

Also run Prisma checks when schema changes:

```bash
npx prisma validate
npx prisma migrate dev
```

If a command is not available yet, report that clearly and add the missing script when it fits the task.

## Database Guidance

- Use Prisma migrations.
- Keep schema names clear and domain-oriented.
- Prefer relations over unstructured blobs for core business data.
- JSON fields are acceptable for raw import rows, provider metadata, and AI context snapshots.
- Preserve raw imported data enough to debug mapping and validation issues.
- Keep external provider IDs separate from internal IDs.

## UI Guidance

- Build the actual operational app, not a marketing landing page.
- Use dense, scannable layouts suitable for managers and booking staff.
- Keep text practical and concise.
- Show empty states with next actions.
- Label draft AI content clearly.
- Provide edit, approve, reject, and request revision controls where AI output appears.
- Keep accessibility basics intact: labels, keyboard access, color contrast, and semantic buttons.

## Copy and Tone

Use product copy that says:
- "Draft reply"
- "Suggested staffing plan"
- "Manager briefing draft"
- "Needs review"
- "Approve"
- "Request revision"

Avoid copy that says or implies:
- "Replace staff"
- "Autopilot guest communication"
- "Fully automated booking manager"
- "AI decides"

## Security and Privacy

- Treat guest names, emails, phone numbers, and notes as sensitive data.
- Do not log secrets.
- Do not expose API keys to the client.
- Keep AI prompts and logs free from unnecessary personal data.
- Use server-side code for database and AI provider calls.
- Add role checks before admin settings, imports, and approvals when auth exists.

## Documentation

When implementing meaningful features, update relevant docs:
- `README.md` for setup and high-level usage.
- `PRODUCT_SPEC.md` for behavior changes.
- `ARCHITECTURE.md` for structural changes.
- `ROADMAP.md` for phase progress.
- `AGENTS.md` if coding-agent expectations change.

## Pull Request Expectations

Every substantial change should include:
- Brief summary.
- Tests or verification performed.
- Notes about AI safety or approval workflow impact, when relevant.
- Screenshots for UI changes when possible.

## Definition of Done

A task is done when:
- The requested behavior works.
- TypeScript is clean.
- Lint and tests pass, or unavailable checks are reported.
- Human-in-the-loop safety is preserved.
- Documentation is updated if the task changes product behavior or architecture.
