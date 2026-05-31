import {
  BarChart3,
  CalendarDays,
  CalendarRange,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="info">Data-backed dashboard</Badge>
          <h1 className="mt-3 text-2xl font-semibold text-ink">Manager dashboard</h1>
          <p className="mt-2 text-sm text-stone-600">
            Booking demand, guest flow and practical venue signals for{" "}
            {venue?.name ?? "the default venue"}.
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600 shadow-sm">
          <p className="font-medium text-ink">{venue?.city ?? "Venue setup"}</p>
          <p>{rangeLabel}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total guests current year"
          value={formatInteger(analytics.totals.guestsCurrentYear)}
          helper="From imported daily booking rows."
          icon={<UsersRound className="h-5 w-5" aria-hidden="true" />}
          tone="info"
        />
        <StatCard
          label="Total guests previous year"
          value={formatInteger(analytics.totals.guestsPreviousYear)}
          helper="Same imported periods last year."
          icon={<UsersRound className="h-5 w-5" aria-hidden="true" />}
        />
        <StatCard
          label="Guest growth"
          value={formatPercent(analytics.totals.guestGrowthPercent)}
          helper="Current year vs previous year."
          icon={growthIcon(analytics.totals.guestGrowthPercent)}
          tone={growthTone(analytics.totals.guestGrowthPercent)}
        />
        <StatCard
          label="Total bookings current year"
          value={formatInteger(analytics.totals.bookingsCurrentYear)}
          helper="Confirmed booking count in imported data."
          icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
          tone="info"
        />
        <StatCard
          label="Total bookings previous year"
          value={formatInteger(analytics.totals.bookingsPreviousYear)}
          helper="Previous-year comparison count."
          icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
        />
        <StatCard
          label="Booking growth"
          value={formatPercent(analytics.totals.bookingGrowthPercent)}
          helper="Current year vs previous year."
          icon={growthIcon(analytics.totals.bookingGrowthPercent)}
          tone={growthTone(analytics.totals.bookingGrowthPercent)}
        />
        <StatCard
          label="Avg guests / booking current"
          value={formatDecimal(analytics.totals.averageGuestsPerBookingCurrentYear)}
          helper="A quick read on party size."
          icon={<BarChart3 className="h-5 w-5" aria-hidden="true" />}
          tone="success"
        />
        <StatCard
          label="Avg guests / booking previous"
          value={formatDecimal(analytics.totals.averageGuestsPerBookingPreviousYear)}
          helper="Baseline for party-size movement."
          icon={<BarChart3 className="h-5 w-5" aria-hidden="true" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Guests by month"
          description="Current year compared with the same periods last year."
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

      <SectionCard
        title="Guests vs bookings over time"
        description="Daily demand shape from imported Caspeco date exports."
      >
        <TrendChart data={dailyMetrics} />
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Weekday performance"
          description="Which weekdays carry the most guest and booking demand."
        >
          <WeekdayPerformanceChart data={analytics.weekdayBuckets} />
        </SectionCard>

        <SectionCard
          title="Manager insights"
          description="Deterministic signals from imported booking history."
        >
          {analytics.hasDailyData || analytics.hasWeekdayData ? (
            <div className="space-y-3">
              {analytics.insights.map((insight) => (
                <div
                  key={`${insight.title}-${insight.value}`}
                  className="rounded-lg border border-stone-100 bg-stone-50 p-4"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
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
              title="No insights yet"
              description="Upload a daily or weekday Caspeco export to generate manager-ready demand signals."
              icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />}
            />
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Top 10 busiest days"
          description="Highest guest counts in the imported daily data."
        >
          <RankedDaysList
            days={analytics.topBusiestDays}
            emptyTitle="No busiest days yet"
            emptyDescription="Upload daily metrics to rank the highest-demand days."
          />
        </SectionCard>

        <SectionCard
          title="Top 10 quietest days"
          description="Lowest guest counts in the imported daily data."
        >
          <RankedDaysList
            days={analytics.topQuietestDays}
            emptyTitle="No quietest days yet"
            emptyDescription="Upload daily metrics to rank the lowest-demand days."
          />
        </SectionCard>
      </div>
    </div>
  );
}

function getRangeLabel(metrics: { date: Date }[]): string {
  if (metrics.length === 0) {
    return "No daily import yet";
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
