# Roadmap

This roadmap is organized to produce a usable MVP for Biljardpalatset Göteborg AB first, then expand toward repeatable venue onboarding and integrations.

## Phase 0: Repo Foundation

Status: in progress.

Deliverables:
- Initial documentation.
- Product spec.
- Architecture plan.
- Agent instructions.
- MVP roadmap.

Exit criteria:
- Another developer can scaffold and implement the app from the docs.

## Phase 1: Application Scaffold

Deliverables:
- Next.js App Router project.
- TypeScript strict mode.
- Tailwind CSS.
- shadcn/ui or local reusable component primitives.
- Prisma configured with SQLite.
- Basic app shell with navigation.
- Routes for dashboard, imports, bookings, analytics, forecast, briefing, inquiries, approvals, and settings.
- Environment validation.
- Mock AI provider.

Recommended tasks:
- Add `npm run lint`, `npm run typecheck`, and `npm test`.
- Add Prisma schema with core entities.
- Add seed data for Biljardpalatset Göteborg AB.
- Add a local demo mode that works without secrets.

Exit criteria:
- App starts locally.
- Empty pages render with realistic layout and empty states.
- Database migrations run locally.
- Mock AI can return deterministic manager briefing and inquiry reply output.

## Phase 2: Import and Data Foundation

Deliverables:
- Excel and CSV upload.
- Column mapping UI.
- Import preview.
- Row validation.
- Normalized booking and guest persistence.
- Import history and error reporting.

Recommended tasks:
- Implement import parsing in `lib/imports`.
- Store raw rows in `ImportRow`.
- Use row hashes to reduce duplicate imports.
- Add tests for date, time, status, phone, email, party size, and deposit parsing.

Exit criteria:
- Staff can import a real booking export.
- Invalid rows are shown with reasons.
- Dashboard and analytics can read imported data.

## Phase 3: Analytics Dashboard

Deliverables:
- Dashboard metrics.
- Bookings list and detail view.
- Guest analytics.
- Time-series charts.
- Source, package, status, and weekday breakdowns.

Recommended tasks:
- Keep metric functions deterministic in `lib/analytics`.
- Add reusable chart components in `components/charts`.
- Add filters for date range, status, source, package, and area.

Exit criteria:
- Manager can identify busy and quiet days from imported data.
- Staff can inspect booking records behind top-level metrics.
- Analytics do not require AI to be useful.

## Phase 4: Forecasting

Deliverables:
- Demand forecasting service.
- Forecast snapshots.
- Busy and quiet labels.
- Draft staffing and promotion recommendations.

Recommended tasks:
- Start with transparent heuristics.
- Include opening hours and closed days.
- Compare actuals to previous forecast snapshots when data becomes available.
- Add tests for weekday averages, trailing averages, and confidence labels.

Exit criteria:
- Manager can review expected demand for the next 7, 14, and 30 days.
- Forecasts explain the source data used.
- Recommendations are drafts requiring human review.

## Phase 5: AI Manager Briefing

Deliverables:
- AI provider abstraction.
- OpenAI provider.
- Mock provider.
- Manager briefing generation.
- AI interaction logging.
- Approval task creation for generated briefings.

Recommended tasks:
- Define `AIProvider` interface before adding provider-specific code.
- Keep prompts in versioned modules.
- Pass structured data to AI, not raw database dumps.
- Add snapshot tests for mock mode.

Exit criteria:
- With no API key, the app still produces deterministic demo briefings.
- With an API key, the app can generate real briefings through the abstraction.
- Briefings are reviewable and auditable.

## Phase 6: Booking Inquiry Copilot

Deliverables:
- Inquiry creation and manual paste flow.
- Extracted inquiry fields.
- Draft guest reply.
- Internal booking summary.
- Approval workflow for draft replies.

Recommended tasks:
- Add rule-aware context from venue settings.
- Store assumptions and missing fields.
- Keep approved reply text separate from draft output.
- Add edit, approve, reject, and request revision actions.

Exit criteria:
- Staff can paste an inquiry and receive an editable draft reply.
- The system flags missing date, time, party size, or contact details.
- No reply is automatically sent.

## Phase 7: Venue Settings and Rules

Deliverables:
- Editable venue profile.
- Opening hours.
- Booking rules.
- Package rules.
- Deposit rules.
- Cancellation and policy settings.
- AI tone and response preferences.

Recommended tasks:
- Store rules in structured tables where possible.
- Add validation to prevent impossible opening hour or booking duration states.
- Include rules in forecast and inquiry contexts.

Exit criteria:
- Staff can update rules without code changes.
- AI drafts reflect current settings.
- Forecasting respects closed days and opening hours.

## Phase 8: Production Hardening

Deliverables:
- Authentication and roles.
- Better error handling.
- Audit logs for approvals and AI output.
- Database backup guidance.
- Accessibility pass.
- Basic deployment plan.

Recommended tasks:
- Add role checks for admin settings and approvals.
- Add observability for imports and AI failures.
- Add rate limits around AI endpoints.
- Prepare Prisma schema for Postgres.

Exit criteria:
- MVP is safe for a pilot with real staff and booking exports.
- Known limitations are documented.

## Phase 9: Integrations

Deliverables:
- Booking system connector abstraction.
- Email integration.
- SMS integration.
- Instagram DM intake.
- Website inquiry widget.

Integration notes:
- Start with inbound sync and draft output.
- Keep external sends behind approval.
- Store external provider IDs on normalized records.
- Use webhooks where available, scheduled sync where not.
- Keep provider-specific code outside core analytics and AI layers.

Exit criteria:
- At least one external inquiry source can create an `Inquiry`.
- At least one approved reply can be handed to an external channel in a controlled flow.
