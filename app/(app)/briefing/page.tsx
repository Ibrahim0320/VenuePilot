import Link from "next/link";
import type { ReactNode } from "react";
import {
  CalendarDays,
  ClipboardList,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UsersRound
} from "lucide-react";
import { generateWeeklyBriefingAction } from "@/app/(app)/briefing/actions";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SectionCard } from "@/components/SectionCard";
import { StatCard } from "@/components/StatCard";
import {
  formatBriefingDateRange,
  getBriefingWeekWindow
} from "@/lib/briefing/briefing-service";
import { parseSavedManagerBriefing } from "@/lib/briefing/briefing-persistence";
import type { SavedManagerBriefing } from "@/lib/briefing/briefing-types";
import { prisma } from "@/lib/db/prisma";
import { DEFAULT_VENUE_LOOKUP } from "@/lib/settings/venue-settings";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type BriefingPageProps = {
  searchParams?: Promise<{
    briefing?: string | string[];
    error?: string | string[];
    mode?: string | string[];
  }>;
};

const integerFormatter = new Intl.NumberFormat("en-US");
const savedAtFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Stockholm"
});

export default async function BriefingPage({ searchParams }: BriefingPageProps) {
  const params = searchParams ? await searchParams : {};
  const selectedBriefingId = firstParam(params.briefing);
  const error = firstParam(params.error);
  const mode = firstParam(params.mode);
  const isOpenAIConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());
  const { weekStartDate, weekEndDate } = getBriefingWeekWindow();
  const venue = await prisma.venue.findFirst({
    where: DEFAULT_VENUE_LOOKUP,
    select: {
      id: true,
      name: true,
      city: true,
      managerBriefings: {
        orderBy: { createdAt: "desc" },
        take: 6,
        select: briefingSelect
      }
    }
  });

  const selectedRecord =
    venue && selectedBriefingId
      ? await prisma.managerBriefing.findFirst({
          where: {
            id: selectedBriefingId,
            venueId: venue.id
          },
          select: briefingSelect
        })
      : null;
  const selectedBriefing = selectedRecord
    ? parseSavedManagerBriefing(selectedRecord)
    : venue?.managerBriefings[0]
      ? parseSavedManagerBriefing(venue.managerBriefings[0])
      : null;
  const briefingHistory = venue?.managerBriefings.map(parseSavedManagerBriefing) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="warning">Human-in-the-loop briefing</Badge>
          <h1 className="mt-3 text-2xl font-semibold text-ink">AI manager briefing</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            Generate a concise weekly operations note for managers using imported
            booking data, saved forecasts and venue rules. It supports staff decisions;
            it does not approve guest-facing actions by itself.
          </p>
        </div>
        <form action={generateWeeklyBriefingAction}>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Generate weekly briefing
          </button>
        </form>
      </div>

      {error ? <BriefingError error={error} /> : null}
      {mode === "openai" ? (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          AI-enhanced briefing saved. The model was given only VenuePilot metrics,
          forecasts, packages and venue rules as grounding.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Briefing window"
          value={formatBriefingDateRange(weekStartDate, weekEndDate)}
          helper="Upcoming 7-day manager view."
          icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
          tone="info"
        />
        <StatCard
          label="Generation mode"
          value={isOpenAIConfigured ? "AI-ready" : "Local"}
          helper={
            isOpenAIConfigured
              ? "Uses OpenAI with grounded facts when generated."
              : "Uses deterministic local business logic."
          }
          icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
        />
        <StatCard
          label="Forecast rows"
          value={formatInteger(
            selectedBriefing?.sourceSnapshot.dataCounts.forecastRows ?? 0
          )}
          helper="Saved forecast days included."
          icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />}
          tone="success"
        />
        <StatCard
          label="Human control"
          value="Required"
          helper="No emails, SMS or guest messages are sent from this page."
          icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
          tone="warning"
        />
      </div>

      {selectedBriefing ? (
        <BriefingWorkspace
          briefing={selectedBriefing}
          history={briefingHistory}
          venueName={venue?.name ?? "Venue"}
        />
      ) : (
        <SectionCard
          title="Briefing draft"
          description="Generate a weekly briefing from imported data and venue settings."
          action={<Badge variant="neutral">{venue?.city ?? "No venue"}</Badge>}
        >
          <EmptyState
            title="No saved briefing yet"
            description="Generate a briefing to create a staff-reviewable weekly note. VenuePilot will save it and show the facts used."
            icon={<ClipboardList className="h-5 w-5" aria-hidden="true" />}
          />
        </SectionCard>
      )}
    </div>
  );
}

const briefingSelect = {
  id: true,
  providerMode: true,
  weekStartDate: true,
  weekEndDate: true,
  executiveSummary: true,
  expectedDemand: true,
  busiestUpcomingDays: true,
  quietestUpcomingDays: true,
  staffingRecommendations: true,
  promotionRecommendations: true,
  packageUpsellOpportunities: true,
  risksOrUnusualPatterns: true,
  suggestedManagerActions: true,
  sourceSnapshot: true,
  createdAt: true
} as const;

function BriefingWorkspace({
  briefing,
  history,
  venueName
}: {
  briefing: SavedManagerBriefing;
  history: SavedManagerBriefing[];
  venueName: string;
}) {
  const snapshot = briefing.sourceSnapshot;
  const modeLabel =
    briefing.providerMode === "openai" ? "AI-enhanced" : "Deterministic";

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <SectionCard
          title="Saved weekly briefing"
          description={`${venueName} · ${formatBriefingDateRange(
            briefing.weekStartDate,
            briefing.weekEndDate
          )}`}
          action={<Badge variant="info">{modeLabel}</Badge>}
        >
          <div className="space-y-4">
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <h2 className="text-sm font-semibold text-ink">Executive summary</h2>
              <p className="mt-2 text-sm leading-6 text-stone-700">
                {briefing.executiveSummary}
              </p>
            </div>
            <div className="rounded-lg border border-stone-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-ink">
                This week&apos;s expected demand
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-700">
                {briefing.expectedDemand}
              </p>
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <ListSection
            title="Busiest upcoming days"
            icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
            items={briefing.busiestUpcomingDays}
            emptyText="No busy-day details available."
          />
          <ListSection
            title="Quietest upcoming days"
            icon={<TrendingDown className="h-4 w-4" aria-hidden="true" />}
            items={briefing.quietestUpcomingDays}
            emptyText="No quiet-day details available."
          />
          <ListSection
            title="Staffing recommendations"
            icon={<UsersRound className="h-4 w-4" aria-hidden="true" />}
            items={briefing.staffingRecommendations}
            emptyText="No staffing recommendations available."
          />
          <ListSection
            title="Promotion recommendations"
            icon={<Megaphone className="h-4 w-4" aria-hidden="true" />}
            items={briefing.promotionRecommendations}
            emptyText="No promotion recommendations available."
          />
          <ListSection
            title="Package and upsell opportunities"
            icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
            items={briefing.packageUpsellOpportunities}
            emptyText="No package opportunities available."
          />
          <ListSection
            title="Risks or unusual patterns"
            icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
            items={briefing.risksOrUnusualPatterns}
            emptyText="No unusual patterns found."
          />
        </div>

        <SectionCard title="Suggested manager actions">
          <ol className="space-y-3">
            {briefing.suggestedManagerActions.map((action) => (
              <li
                key={action}
                className="rounded-lg border border-stone-200 bg-white p-4 text-sm leading-6 text-stone-700"
              >
                {action}
              </li>
            ))}
          </ol>
        </SectionCard>
      </div>

      <aside className="space-y-6">
        <SectionCard
          title="Grounded facts"
          description="Stored with the briefing so managers can see what was used."
          action={
            <Badge variant="neutral">
              {savedAtFormatter.format(briefing.createdAt)}
            </Badge>
          }
        >
          <div className="space-y-4 text-sm">
            <FactRow label="Daily rows" value={snapshot.dataCounts.dailyMetricRows} />
            <FactRow
              label="Weekday rows"
              value={snapshot.dataCounts.weekdayMetricRows}
            />
            <FactRow label="Forecast rows" value={snapshot.dataCounts.forecastRows} />
            <FactRow
              label="Active packages"
              value={snapshot.dataCounts.activePackages}
            />
            <div className="rounded-lg bg-stone-50 p-3">
              <p className="font-medium text-ink">Forecast mix</p>
              <p className="mt-1 leading-6 text-stone-600">
                {formatInteger(snapshot.forecastTotals.quietDays)} quiet,{" "}
                {formatInteger(snapshot.forecastTotals.normalDays)} normal,{" "}
                {formatInteger(snapshot.forecastTotals.busyDays)} busy,{" "}
                {formatInteger(snapshot.forecastTotals.peakDays)} peak.
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 text-amber-900">
              <p className="font-medium">Human approval reminder</p>
              <p className="mt-1 leading-6">
                This briefing is internal planning support. Staff still confirm
                availability, deposits and guest-facing replies.
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Briefing history">
          {history.length > 0 ? (
            <div className="space-y-2">
              {history.map((item) => (
                <Link
                  key={item.id}
                  href={`/briefing?briefing=${item.id}`}
                  className={cn(
                    "block rounded-lg border p-3 text-sm transition hover:bg-stone-50",
                    item.id === briefing.id
                      ? "border-ink bg-stone-50"
                      : "border-stone-200 bg-white"
                  )}
                >
                  <span className="font-medium text-ink">
                    {formatBriefingDateRange(item.weekStartDate, item.weekEndDate)}
                  </span>
                  <span className="mt-1 block text-xs text-stone-500">
                    {savedAtFormatter.format(item.createdAt)} ·{" "}
                    {item.providerMode === "openai" ? "AI-enhanced" : "Deterministic"}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-500">No previous briefings saved.</p>
          )}
        </SectionCard>
      </aside>
    </div>
  );
}

function ListSection({
  title,
  icon,
  items,
  emptyText
}: {
  title: string;
  icon: ReactNode;
  items: string[];
  emptyText: string;
}) {
  return (
    <SectionCard title={title} action={<span className="text-stone-500">{icon}</span>}>
      {items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item}
              className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm leading-6 text-stone-700"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-stone-500">{emptyText}</p>
      )}
    </SectionCard>
  );
}

function FactRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-b border-stone-100 pb-2 last:border-b-0 last:pb-0">
      <span className="text-stone-500">{label}</span>
      <span className="font-semibold text-ink">{formatInteger(value)}</span>
    </div>
  );
}

function BriefingError({ error }: { error: string }) {
  const message =
    error === "missing-venue"
      ? "The default venue could not be found. Run the seed script before generating briefings."
      : "The briefing could not be generated. Check the imported data, venue settings and server logs.";

  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
      {message}
    </div>
  );
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatInteger(value: number): string {
  return integerFormatter.format(value);
}
