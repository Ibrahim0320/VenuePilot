import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CalendarRange,
  ClipboardCheck,
  FileSpreadsheet,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UsersRound
} from "lucide-react";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import {
  MonthlyComparisonChart,
  RankedDaysList,
  TrendChart,
  WeekdayPerformanceChart
} from "@/components/dashboard/DashboardCharts";
import { SectionCard } from "@/components/SectionCard";
import { StatCard } from "@/components/StatCard";
import { buildDashboardAnalytics } from "@/lib/dashboard/analytics";
import type { DashboardAnalytics } from "@/lib/dashboard/analytics";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const integerFormatter = new Intl.NumberFormat("en-US");
const decimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC"
});

export default async function DashboardPage() {
  const venue = await prisma.venue.findFirst({
    where: { name: "Biljardpalatset Göteborg AB", city: "Göteborg" },
    select: {
      name: true,
      city: true,
      dailyMetrics: {
        orderBy: { date: "asc" },
        select: {
          date: true,
          guestsCurrentYear: true,
          guestsPreviousYear: true,
          bookingsCurrentYear: true,
          bookingsPreviousYear: true
        }
      },
      weekdayMetrics: {
        orderBy: { weekday: "asc" },
        select: {
          weekday: true,
          bookingsCurrentYear: true,
          bookingsPreviousYear: true,
          guestsCurrentYear: true,
          guestsPreviousYear: true
        }
      }
    }
  });

  const dailyMetrics = venue?.dailyMetrics ?? [];
  const weekdayMetrics = venue?.weekdayMetrics ?? [];
  const analytics = buildDashboardAnalytics(dailyMetrics, weekdayMetrics);
  const rangeLabel = getRangeLabel(dailyMetrics);
  const managerFocus =
    analytics.insights.find((insight) => insight.title === "Capacity implication") ??
    analytics.insights[0];

  return (
    <div className="space-y-6">
      <DashboardHero
        venueName={venue?.name ?? "Venue"}
        venueCity={venue?.city ?? "Venue setup"}
        rangeLabel={rangeLabel}
        analytics={analytics}
        managerFocus={managerFocus}
      />

      {!analytics.hasDailyData && !analytics.hasWeekdayData ? (
        <EmptyState
          title="Upload booking data to activate the dashboard"
          description="Start with a Caspeco daily or weekday export. VenuePilot will turn it into guest trends, demand signals and manager-ready recommendations."
          icon={<FileSpreadsheet className="h-5 w-5" aria-hidden="true" />}
          action={
            <Link
              href="/data"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800"
            >
              Upload data
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Guests this year"
          value={formatInteger(analytics.totals.guestsCurrentYear)}
          helper="Total guests from imported daily rows."
          icon={<UsersRound className="h-5 w-5" aria-hidden="true" />}
          tone="info"
        />
        <StatCard
          label="Guests last year"
          value={formatInteger(analytics.totals.guestsPreviousYear)}
          helper="Previous-year comparison for the imported dates."
          icon={<UsersRound className="h-5 w-5" aria-hidden="true" />}
        />
        <StatCard
          label="Guest growth"
          value={formatPercent(analytics.totals.guestGrowthPercent)}
          helper="Current year compared with previous year."
          icon={growthIcon(analytics.totals.guestGrowthPercent)}
          tone={growthTone(analytics.totals.guestGrowthPercent)}
        />
        <StatCard
          label="Bookings this year"
          value={formatInteger(analytics.totals.bookingsCurrentYear)}
          helper="Confirmed booking count in imported data."
          icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
          tone="info"
        />
        <StatCard
          label="Bookings last year"
          value={formatInteger(analytics.totals.bookingsPreviousYear)}
          helper="Previous-year booking baseline."
          icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
        />
        <StatCard
          label="Booking growth"
          value={formatPercent(analytics.totals.bookingGrowthPercent)}
          helper="A signal for demand and admin workload."
          icon={growthIcon(analytics.totals.bookingGrowthPercent)}
          tone={growthTone(analytics.totals.bookingGrowthPercent)}
        />
        <StatCard
          label="Avg guests per booking"
          value={formatDecimal(analytics.totals.averageGuestsPerBookingCurrentYear)}
          helper="Current average party size."
          icon={<BarChart3 className="h-5 w-5" aria-hidden="true" />}
          tone="success"
        />
        <StatCard
          label="Last year's party size"
          value={formatDecimal(analytics.totals.averageGuestsPerBookingPreviousYear)}
          helper="Baseline for group-size movement."
          icon={<BarChart3 className="h-5 w-5" aria-hidden="true" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <SectionCard
          title="Guests vs bookings over time"
          description="A manager-friendly view of how demand moves across imported dates."
          action={<Badge variant="info">{dailyMetrics.length} daily rows</Badge>}
        >
          <TrendChart data={dailyMetrics} />
        </SectionCard>

        <SectionCard
          title="Manager insights"
          description="Deterministic signals from booking history."
          action={<Badge variant="success">No AI required</Badge>}
        >
          {analytics.hasDailyData || analytics.hasWeekdayData ? (
            <div className="space-y-3">
              {analytics.insights.map((insight) => (
                <div
                  key={`${insight.title}-${insight.value}`}
                  className="rounded-lg border border-stone-200 bg-stone-50 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                    {insight.title}
                  </p>
                  <p className="mt-1 font-semibold text-ink">{insight.value}</p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {insight.detail}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Insights will appear after import"
              description="Upload booking data to see strongest months, weekday demand, party-size movement and capacity implications."
              icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />}
            />
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Guests by month"
          description="Current-year guest demand compared with the same imported periods last year."
        >
          <MonthlyComparisonChart data={analytics.monthBuckets} metric="guests" />
        </SectionCard>

        <SectionCard
          title="Bookings by month"
          description="Booking volume by imported calendar month."
        >
          <MonthlyComparisonChart data={analytics.monthBuckets} metric="bookings" />
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          title="Weekday performance"
          description="See which weekdays carry the most guest and booking demand."
        >
          <WeekdayPerformanceChart data={analytics.weekdayBuckets} />
        </SectionCard>

        <SectionCard
          title="Next manager moves"
          description="Where the imported data should lead the team next."
          action={<Badge variant="warning">Human decision</Badge>}
        >
          <div className="space-y-3">
            <ManagerMove
              icon={<LineIcon />}
              title="Forecast the next service window"
              description="Use deterministic demand logic to identify quiet, busy and peak days."
              href="/forecast"
            />
            <ManagerMove
              icon={<MessageSquareText className="h-4 w-4" aria-hidden="true" />}
              title="Prepare booking replies faster"
              description="Paste a customer inquiry and generate a staff-reviewable draft."
              href="/copilot"
            />
            <ManagerMove
              icon={<ClipboardCheck className="h-4 w-4" aria-hidden="true" />}
              title="Approve AI-prepared drafts"
              description="Review, edit and approve internally before anything is sent."
              href="/approvals"
            />
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Top 10 busiest days"
          description="Highest guest counts in the imported daily data."
        >
          <RankedDaysList
            days={analytics.topBusiestDays}
            emptyTitle="Busiest days will appear after import"
            emptyDescription="Upload daily metrics to rank the highest-demand days and protect peak capacity."
          />
        </SectionCard>

        <SectionCard
          title="Top 10 quietest days"
          description="Lowest guest counts in the imported daily data."
        >
          <RankedDaysList
            days={analytics.topQuietestDays}
            emptyTitle="Quietest days will appear after import"
            emptyDescription="Upload daily metrics to identify off-peak windows for promotions and outreach."
          />
        </SectionCard>
      </div>
    </div>
  );
}

function DashboardHero({
  venueName,
  venueCity,
  rangeLabel,
  analytics,
  managerFocus
}: {
  venueName: string;
  venueCity: string;
  rangeLabel: string;
  analytics: DashboardAnalytics;
  managerFocus?: DashboardAnalytics["insights"][number];
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-stone-800 bg-ink text-white shadow-soft">
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <Badge
            variant="success"
            className="border-emerald-300 bg-emerald-300/15 text-emerald-100"
          >
            Manager dashboard
          </Badge>
          <h1 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
            Demand, staffing and booking decisions for {venueName}.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300">
            A non-technical workspace for understanding booking trends, spotting quiet
            days, protecting peak capacity and preparing AI-assisted actions for human
            approval.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/data"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-emerald-200"
            >
              Import booking data
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/briefing"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Generate briefing
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-white/15 bg-white/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-300">
            Venue snapshot
          </p>
          <div className="mt-4 space-y-4">
            <HeroMetric label="Venue" value={venueCity} helper={rangeLabel} />
            <HeroMetric
              label="Current guests"
              value={formatInteger(analytics.totals.guestsCurrentYear)}
              helper={`${formatInteger(
                analytics.totals.bookingsCurrentYear
              )} bookings imported`}
            />
            <div className="rounded-lg bg-white p-4 text-ink">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-sage" aria-hidden="true" />
                <p className="text-sm font-semibold">Manager focus</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                {managerFocus?.detail ??
                  "Import booking history to unlock staffing and promotion guidance."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroMetric({
  label,
  value,
  helper
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-300">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs leading-5 text-stone-300">{helper}</p>
    </div>
  );
}

function ManagerMove({
  icon,
  title,
  description,
  href
}: {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4 transition hover:bg-white hover:shadow-sm"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-sage shadow-sm">
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-stone-600">
          {description}
        </span>
      </span>
    </Link>
  );
}

function LineIcon() {
  return <TrendingUp className="h-4 w-4" aria-hidden="true" />;
}

function getRangeLabel(metrics: { date: Date }[]): string {
  if (metrics.length === 0) {
    return "Waiting for daily import";
  }

  const sortedMetrics = [...metrics].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
  const start = sortedMetrics[0].date;
  const end = sortedMetrics[sortedMetrics.length - 1].date;

  if (start.getTime() === end.getTime()) {
    return `Imported date: ${dateFormatter.format(start)}`;
  }

  return `Imported range: ${dateFormatter.format(start)} - ${dateFormatter.format(
    end
  )}`;
}

function growthIcon(value: number | null) {
  if (value !== null && value < 0) {
    return <TrendingDown className="h-5 w-5" aria-hidden="true" />;
  }

  if (value === null) {
    return <CalendarRange className="h-5 w-5" aria-hidden="true" />;
  }

  return <TrendingUp className="h-5 w-5" aria-hidden="true" />;
}

function growthTone(value: number | null): "default" | "success" | "warning" | "info" {
  if (value === null) {
    return "default";
  }

  return value >= 0 ? "success" : "warning";
}

function formatInteger(value: number): string {
  return integerFormatter.format(value);
}

function formatDecimal(value: number): string {
  return decimalFormatter.format(value);
}

function formatPercent(value: number | null): string {
  if (value === null) {
    return "N/A";
  }

  const sign = value > 0 ? "+" : "";

  return `${sign}${decimalFormatter.format(value)}%`;
}
