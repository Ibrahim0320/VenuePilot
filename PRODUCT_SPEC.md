# Product Specification

## Summary

VenuePilot is an AI Booking and Operations Assistant for hospitality and activity-based venues. It helps staff and managers analyze booking patterns, forecast demand, prepare manager briefings, draft inquiry replies, and manage venue-specific rules.

The first customer is Biljardpalatset Göteborg AB. The first release should solve practical booking and operations problems for this venue while remaining general enough for similar venues later.

VenuePilot must always be framed as an assistant. AI-generated work is drafted for staff review, not automatically sent to guests or used to replace staff decisions.

## Primary Users

- Manager: reviews trends, staffing signals, quiet periods, promotions, and daily briefings.
- Booking coordinator: imports data, checks booking summaries, drafts replies, and approves guest-facing messages.
- Floor or shift lead: reviews busy periods, event notes, staffing recommendations, and day-of-risk alerts.
- Admin: maintains venue settings, packages, opening hours, booking rules, and integrations.

## Goals

- Turn raw booking data into useful operational insight.
- Help staff understand busy and quiet days earlier.
- Draft high-quality replies to booking inquiries for human approval.
- Keep venue rules consistent across analytics, forecasts, and AI drafting.
- Provide a simple local MVP that can run with SQLite and mock AI.
- Keep the schema and architecture compatible with Supabase/Postgres later.

## Non-Goals

- Do not automate sending guest replies in the MVP.
- Do not replace human booking staff or managers.
- Do not make staffing decisions without human approval.
- Do not depend on one booking provider in the core data model.
- Do not build a general CRM before the booking workflow is useful.

## Core Product Areas

### 1. Dashboard

Route: `/dashboard`

Purpose:
- Show the venue's current booking health at a glance.
- Highlight upcoming busy and quiet periods.
- Surface pending approvals and manager briefing items.

Initial widgets:
- Today and next 7 days booking count.
- Covers or guest count by day.
- Estimated utilization by venue area, table type, room, or package.
- Revenue proxy if imported data includes price, deposit, or package value.
- Quiet day opportunities.
- Busy day staffing warning.
- Pending approvals.
- Latest import status.
- AI manager briefing summary.

Acceptance criteria:
- Dashboard can render from imported bookings without requiring AI.
- Empty states explain what data is needed next.
- All AI-generated recommendations are visually labeled as drafts or suggestions.

### 2. Excel Upload and Import

Route: `/imports`

Purpose:
- Allow staff to upload historic booking exports from Excel.
- Preview, map, validate, and import rows into normalized booking records.

Supported local MVP formats:
- `.xlsx`
- `.csv`

Import workflow:
1. Upload file.
2. Parse workbook or CSV.
3. Detect likely columns.
4. Ask user to confirm mappings.
5. Preview validation errors and warnings.
6. Import valid rows into an `ImportBatch`.
7. Show import summary.

Important fields to support:
- Booking date.
- Start time.
- End time or duration.
- Guest name.
- Guest email.
- Guest phone.
- Party size.
- Booking type, package, area, table, room, or activity.
- Status.
- Deposit paid.
- Notes.
- Source system.
- Created date.

Acceptance criteria:
- Invalid rows do not crash the import.
- Staff can see skipped rows and reasons.
- Imports are idempotent where possible through source row hashes.
- The importer stores raw row data for troubleshooting.

### 3. Booking and Guest Analytics

Routes:
- `/bookings`
- `/analytics`

Purpose:
- Help staff understand booking trends, guest behavior, venue utilization, and source performance.

Initial analytics:
- Bookings by day, week, and month.
- Guest count by weekday and time block.
- Average party size.
- Status breakdown: confirmed, cancelled, no-show, completed, inquiry.
- Lead time from booking creation to visit date.
- Source breakdown if available.
- Package or activity mix.
- Repeat guest detection by email or phone.
- Cancellation and no-show patterns if imported data supports it.

Acceptance criteria:
- Analytics use deterministic calculations first.
- Calculations are testable in `lib/analytics`.
- The UI distinguishes observed data from AI interpretation.

### 4. Demand Forecasting

Route: `/forecast`

Purpose:
- Estimate expected booking demand and identify likely busy or quiet periods.

MVP forecasting approach:
- Start with transparent heuristics:
  - weekday averages
  - recent trailing averages
  - seasonal or monthly adjustment if enough history exists
  - existing future bookings
  - venue opening hours
  - known closed days or events
- Later add statistical or ML models only after reliable data exists.

Forecast output:
- Expected bookings.
- Expected guests.
- Confidence level: low, medium, high.
- Busy/quiet label.
- Staffing recommendation draft.
- Promotion recommendation draft for quiet periods.
- Rationale based on source data.

Acceptance criteria:
- Forecast can run without AI.
- AI may explain or summarize forecast results, but not invent numeric inputs.
- Forecast stores generated snapshots for review and comparison.

### 5. AI Manager Briefing

Route: `/briefing`

Purpose:
- Produce a short operational briefing for managers and shift leads.

Briefing sections:
- Yesterday or last completed period summary.
- Today and next 7 days outlook.
- Busy periods and staffing watchouts.
- Quiet periods and promotion ideas.
- Booking anomalies.
- Pending inquiries or approvals.
- Rule-sensitive reminders, such as deposits or package policies.

Acceptance criteria:
- Briefings cite the data window used.
- Every recommendation includes a reason.
- Briefings are drafts until accepted or dismissed by staff.
- Mock AI mode returns deterministic sample briefings.

### 6. Booking Inquiry Copilot

Route: `/inquiries`

Purpose:
- Help staff respond to booking inquiries quickly and consistently.

Inquiry sources in MVP:
- Manual paste.
- Website form placeholder.
- Future email, SMS, Instagram, and widget integrations.

Copilot workflow:
1. Staff enters or imports an inquiry.
2. System extracts date, time, party size, contact details, package interest, and special requests.
3. System checks venue rules and known availability context.
4. AI drafts a reply and internal summary.
5. Staff edits and approves, requests revision, or rejects.
6. Approved copy is stored for manual send in the MVP.

Acceptance criteria:
- AI never sends a message directly in the MVP.
- Reply drafts clearly show assumptions and missing information.
- Drafts must respect venue rules from settings.
- Staff can edit before approval.

### 7. Venue Settings and Rules

Route: `/settings`

Purpose:
- Store operational rules in structured data so the app and AI use the same source of truth.

Settings to support:
- Venue name and contact details.
- Opening hours.
- Closed days and exceptions.
- Booking duration rules.
- Minimum and maximum party size.
- Area, table, room, or activity inventory.
- Packages.
- Deposit rules.
- Cancellation rules.
- Age, ID, dress code, or event policies if applicable.
- Response tone preferences.
- Promotion constraints.

Acceptance criteria:
- Rules are editable by staff with admin permissions.
- Rule changes affect inquiry drafting and manager briefings.
- Rule values are included as structured context for AI providers.

### 8. Human Approval Workflow

Route: `/approvals`

Purpose:
- Centralize human review of AI-generated or rule-sensitive outputs.

Approval task types:
- Draft inquiry reply.
- Booking summary.
- Manager briefing.
- Staffing recommendation.
- Promotion recommendation.
- Rule conflict warning.

Approval states:
- `pending`
- `approved`
- `rejected`
- `needs_revision`
- `expired`

Acceptance criteria:
- No guest-facing AI text is treated as final until approved.
- Approval records include creator, reviewer, timestamp, source data, and AI provider metadata.
- Rejected or revised AI outputs remain auditable.

## Data Model Draft

Core entities:

- `Venue`: the customer account or venue location.
- `User`: staff member with role and venue access.
- `VenueRule`: structured rules and policies.
- `OpeningHour`: weekday and time ranges.
- `Booking`: normalized booking record.
- `Guest`: deduplicated guest contact record.
- `BookingGuest`: join table for guests linked to bookings.
- `ImportBatch`: uploaded file and import summary.
- `ImportRow`: raw row data, validation status, and row hash.
- `AnalyticsSnapshot`: saved metric output for a data window.
- `ForecastSnapshot`: saved demand forecast.
- `Inquiry`: incoming booking request or manual paste.
- `DraftReply`: AI or mock-generated response draft.
- `ApprovalTask`: human review record.
- `AIInteractionLog`: prompt metadata, provider, model, mode, and output references.
- `StaffingRecommendation`: draft recommendation for manager review.
- `PromotionRecommendation`: draft promotion idea for quiet periods.

## AI Behavior Requirements

AI should:
- Use venue rules as structured context.
- Ask for missing information when needed.
- Produce concise operational recommendations.
- Avoid claiming certainty when data is incomplete.
- Separate facts from suggestions.
- Keep guest-facing drafts polite, clear, and editable.

AI must not:
- Send messages directly to guests in the MVP.
- Invent availability, prices, deposits, or policies.
- Override venue rules.
- Claim to replace staff.
- Make legal, HR, or safety decisions.
- Hide uncertainty or missing data.

## Success Metrics

MVP success should be measured by:

- Imported booking rows processed successfully.
- Time saved drafting inquiry replies.
- Percentage of AI drafts approved with minor edits.
- Number of manager briefings reviewed.
- Accuracy of busy/quiet day predictions compared with actuals.
- Staff confidence that rules and policies are represented correctly.

## Future Integrations

Design integration boundaries now, but keep the first MVP local and simple.

- Booking systems: import API, scheduled sync, webhooks, external IDs, conflict handling.
- Email: inbound inquiry parsing, draft replies, approved send workflow.
- SMS: approved reminders, deposit follow-up, short inquiry replies.
- Instagram: DM ingestion, inquiry extraction, approved response drafts.
- Website widgets: embedded inquiry form, package questions, availability request capture.
