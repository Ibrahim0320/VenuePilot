import Link from "next/link";
import {
  CalendarRange,
  Clock3,
  TrendingDown,
  TrendingUp,
  UsersRound
} from "lucide-react";
import { Badge } from "@/components/Badge";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { EmptyState } from "@/components/EmptyState";
import { SectionCard } from "@/components/SectionCard";
import { StatCard } from "@/components/StatCard";
import { saveVenueForecasts } from "@/lib/forecast/forecast-persistence";
import {
  FORECAST_HORIZONS,
  type DemandForecast,
  type DemandLevel,
  generateDemandForecasts,
  getDefaultForecastStartDate,
  normaliseForecastHorizon
} from "@/lib/forecast/forecast-service";
import { prisma } from "@/lib/db/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ForecastPageProps = {
  searchParams?: Promise<{
    horizon?: string | string[];
  }>;
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  timeZone: "UTC"
});

const integerFormatter = new Intl.NumberFormat("en-US");

export default async function ForecastPage({ searchParams }: ForecastPageProps) {
  const params = searchParams ? await searchParams : {};
  const horizonDays = normaliseForecastHorizon(params.horizon);
  const forecastStartDate = getDefaultForecastStartDate();
  const venue = await prisma.venue.findFirst({
    where: { name: "Biljardpalatset Göteborg AB", city: "Göteborg" },
    select: {
      id: true,
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
      }
    }
  });

  const forecasts = venue
    ? generateDemandForecasts({
        dailyMetrics: venue.dailyMetrics,
        startDate: forecastStartDate,
        horizonDays
      })
    : [];

  if (venue) {
    await saveVenueForecasts({
      venueId: venue.id,
      forecasts
    });
  }

  const summary = summarizeForecasts(forecasts);
  const isMissingDailyData = (venue?.dailyMetrics.length ?? 0) === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="info">Deterministic demand forecast</Badge>
          <h1 className="mt-3 text-2xl font-semibold text-ink">Forecast</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            Explainable demand planning for {venue?.name ?? "the venue"} using imported
            Caspeco daily metrics. No AI or external API is used for this first
            forecasting version.
          </p>
        </div>
        <RangeSelector selectedHorizon={horizonDays} />
      </div>

      {isMissingDailyData ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Missing-data fallback is active. Import a daily Caspeco export to produce
          stronger forecasts and higher confidence levels.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Forecast horizon"
          value={`${horizonDays} days`}
          helper={`Starting ${dateFormatter.format(forecastStartDate)}.`}
          icon={<CalendarRange className="h-5 w-5" aria-hidden="true" />}
          tone="info"
        />
        <StatCard
          label="Quiet days"
          value={formatInteger(summary.quietDays)}
          helper="Candidates for promotion or outreach."
          icon={<TrendingDown className="h-5 w-5" aria-hidden="true" />}
          tone="warning"
        />
        <StatCard
          label="Busy days"
          value={formatInteger(summary.busyDays)}
          helper="Prepare staffing and package upsells."
          icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />}
          tone="success"
        />
        <StatCard
          label="Peak days"
          value={formatInteger(summary.peakDays)}
          helper="Protect prime slots and review deposits."
          icon={<UsersRound className="h-5 w-5" aria-hidden="true" />}
        />
      </div>

      <SectionCard
        title="Forecast table"
        description="Generated forecasts are saved to the Forecast table by venue and date."
        action={<Badge variant="neutral">{venue?.city ?? "No venue"}</Badge>}
      >
        {venue ? (
          <ForecastTable forecasts={forecasts} />
        ) : (
          <EmptyState
            title="No venue found"
            description="Seed the default VenuePilot venue before generating demand forecasts."
            icon={<Clock3 className="h-5 w-5" aria-hidden="true" />}
          />
        )}
      </SectionCard>
    </div>
  );
}

function RangeSelector({
  selectedHorizon
}: {
  selectedHorizon: (typeof FORECAST_HORIZONS)[number];
}) {
  return (
    <div className="inline-flex rounded-lg border border-stone-200 bg-white p-1 shadow-sm">
      {FORECAST_HORIZONS.map((horizon) => (
        <Link
          key={horizon}
          href={`/forecast?horizon=${horizon}`}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium transition",
            horizon === selectedHorizon
              ? "bg-ink text-white"
              : "text-stone-600 hover:bg-stone-100 hover:text-ink"
          )}
        >
          Next {horizon} days
        </Link>
      ))}
    </div>
  );
}

function ForecastTable({ forecasts }: { forecasts: DemandForecast[] }) {
  if (forecasts.length === 0) {
    return (
      <EmptyState
        title="No forecasts generated"
        description="Forecast rows appear here once the venue exists and the forecast engine runs."
        icon={<CalendarRange className="h-5 w-5" aria-hidden="true" />}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-stone-500">
            <th className="whitespace-nowrap px-3 py-3 font-medium">Date</th>
            <th className="whitespace-nowrap px-3 py-3 font-medium">Guests</th>
            <th className="whitespace-nowrap px-3 py-3 font-medium">Bookings</th>
            <th className="whitespace-nowrap px-3 py-3 font-medium">Demand</th>
            <th className="whitespace-nowrap px-3 py-3 font-medium">Confidence</th>
            <th className="min-w-72 px-3 py-3 font-medium">Recommended action</th>
            <th className="min-w-96 px-3 py-3 font-medium">Explanation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {forecasts.map((forecast) => (
            <tr key={forecast.date.toISOString()} className="align-top">
              <td className="whitespace-nowrap px-3 py-4 font-medium text-ink">
                {dateFormatter.format(forecast.date)}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-stone-700">
                {formatInteger(forecast.expectedGuests)}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-stone-700">
                {formatInteger(forecast.expectedBookings)}
              </td>
              <td className="whitespace-nowrap px-3 py-4">
                <DemandLevelBadge demandLevel={forecast.demandLevel} />
              </td>
              <td className="whitespace-nowrap px-3 py-4">
                <ConfidenceBadge confidence={forecast.confidence} />
              </td>
              <td className="px-3 py-4 leading-6 text-stone-700">
                {forecast.recommendedActions}
              </td>
              <td className="px-3 py-4 leading-6 text-stone-600">
                {forecast.explanation}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DemandLevelBadge({ demandLevel }: { demandLevel: DemandLevel }) {
  const variantByDemandLevel: Record<
    DemandLevel,
    "neutral" | "success" | "warning" | "danger" | "info"
  > = {
    quiet: "warning",
    normal: "info",
    busy: "success",
    peak: "danger"
  };

  return (
    <Badge variant={variantByDemandLevel[demandLevel]}>
      {demandLevel.charAt(0).toUpperCase() + demandLevel.slice(1)}
    </Badge>
  );
}

function summarizeForecasts(forecasts: DemandForecast[]) {
  return forecasts.reduce(
    (summary, forecast) => ({
      quietDays: summary.quietDays + (forecast.demandLevel === "quiet" ? 1 : 0),
      busyDays: summary.busyDays + (forecast.demandLevel === "busy" ? 1 : 0),
      peakDays: summary.peakDays + (forecast.demandLevel === "peak" ? 1 : 0)
    }),
    {
      quietDays: 0,
      busyDays: 0,
      peakDays: 0
    }
  );
}

function formatInteger(value: number): string {
  return integerFormatter.format(value);
}
