import { BarChart3, CalendarX2 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import type {
  DashboardDailyMetric,
  MonthBucket,
  RankedDay,
  WeekdayBucket
} from "@/lib/dashboard/analytics";
import { cn } from "@/lib/utils";

type MonthlyComparisonChartProps = {
  data: MonthBucket[];
  metric: "guests" | "bookings";
};

type TrendChartProps = {
  data: DashboardDailyMetric[];
};

type WeekdayPerformanceChartProps = {
  data: WeekdayBucket[];
};

type RankedDaysListProps = {
  days: RankedDay[];
  emptyTitle: string;
  emptyDescription: string;
};

const numberFormatter = new Intl.NumberFormat("en-US");

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1
});

const shortDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC"
});

export function MonthlyComparisonChart({ data, metric }: MonthlyComparisonChartProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        title="No daily data yet"
        description="Upload a Caspeco daily booking export to see monthly demand patterns."
        icon={<BarChart3 className="h-5 w-5" aria-hidden="true" />}
      />
    );
  }

  const maxValue = Math.max(
    1,
    ...data.flatMap((bucket) =>
      metric === "guests"
        ? [bucket.guestsCurrentYear, bucket.guestsPreviousYear]
        : [bucket.bookingsCurrentYear, bucket.bookingsPreviousYear]
    )
  );

  return (
    <div className="space-y-4">
      <ChartLegend currentLabel="Current year" previousLabel="Previous year" />
      <div className="space-y-3">
        {data.map((bucket) => {
          const currentValue =
            metric === "guests" ? bucket.guestsCurrentYear : bucket.bookingsCurrentYear;
          const previousValue =
            metric === "guests"
              ? bucket.guestsPreviousYear
              : bucket.bookingsPreviousYear;

          return (
            <div
              key={bucket.key}
              className="grid gap-2 rounded-lg border border-stone-100 bg-stone-50 px-3 py-3 sm:grid-cols-[5.5rem_1fr_6rem]"
            >
              <div>
                <p className="text-sm font-medium text-ink">{bucket.label}</p>
                <p className="text-xs text-stone-500">
                  {bucket.rowCount} day{bucket.rowCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="space-y-1.5 self-center">
                <MetricBar
                  value={currentValue}
                  maxValue={maxValue}
                  className="bg-emerald-600"
                />
                <MetricBar
                  value={previousValue}
                  maxValue={maxValue}
                  className="bg-copper"
                />
              </div>
              <div className="flex items-center justify-between gap-3 text-xs text-stone-600 sm:block sm:text-right">
                <p>{formatInteger(currentValue)}</p>
                <p>{formatInteger(previousValue)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TrendChart({ data }: TrendChartProps) {
  const points = data
    .filter(
      (point) => point.date instanceof Date && !Number.isNaN(point.date.getTime())
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (points.length === 0) {
    return (
      <EmptyState
        title="No daily trend yet"
        description="Upload a daily export to compare guests and bookings over time."
        icon={<BarChart3 className="h-5 w-5" aria-hidden="true" />}
      />
    );
  }

  const guestsValues = points.map((point) => point.guestsCurrentYear ?? 0);
  const bookingsValues = points.map((point) => point.bookingsCurrentYear ?? 0);
  const guestsPolyline = buildPolyline(guestsValues);
  const bookingsPolyline = buildPolyline(bookingsValues);
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-stone-600">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
          Guests
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-copper" />
          Bookings
        </span>
        <span className="text-stone-500">Lines are scaled to show trend shape.</span>
      </div>
      <div className="rounded-lg border border-stone-100 bg-stone-50 p-3">
        <svg
          role="img"
          aria-label="Guests and bookings over time"
          viewBox="0 0 640 240"
          className="h-60 w-full"
        >
          <line x1="44" y1="196" x2="612" y2="196" stroke="#d6d3d1" strokeWidth="1" />
          <line x1="44" y1="44" x2="44" y2="196" stroke="#d6d3d1" strokeWidth="1" />
          <polyline
            points={guestsPolyline}
            fill="none"
            stroke="#059669"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          <polyline
            points={bookingsPolyline}
            fill="none"
            stroke="#b8683b"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          {points.length === 1 ? (
            <>
              <circle cx="328" cy="120" r="5" fill="#059669" />
              <circle cx="328" cy="120" r="5" fill="#b8683b" opacity="0.75" />
            </>
          ) : null}
          <text x="44" y="224" fill="#78716c" fontSize="13">
            {shortDateFormatter.format(firstPoint.date)}
          </text>
          <text x="612" y="224" fill="#78716c" fontSize="13" textAnchor="end">
            {shortDateFormatter.format(lastPoint.date)}
          </text>
        </svg>
      </div>
    </div>
  );
}

export function WeekdayPerformanceChart({ data }: WeekdayPerformanceChartProps) {
  const activeRows = data.filter((row) => row.rowCount > 0);

  if (activeRows.length === 0) {
    return (
      <EmptyState
        title="No weekday data yet"
        description="Upload a Caspeco weekday export to compare demand by day of week."
        icon={<CalendarX2 className="h-5 w-5" aria-hidden="true" />}
      />
    );
  }

  const maxValue = Math.max(
    1,
    ...data.flatMap((row) => [row.guestsCurrentYear, row.bookingsCurrentYear])
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
          Guests
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-copper" />
          Bookings
        </span>
      </div>
      <div className="space-y-3">
        {data.map((row) => (
          <div
            key={row.weekday}
            className={cn(
              "grid gap-2 rounded-lg border border-stone-100 px-3 py-3 sm:grid-cols-[6rem_1fr_7rem]",
              row.rowCount > 0 ? "bg-stone-50" : "bg-white text-stone-400"
            )}
          >
            <p className="text-sm font-medium text-ink">{row.label}</p>
            <div className="space-y-1.5 self-center">
              <MetricBar
                value={row.guestsCurrentYear}
                maxValue={maxValue}
                className="bg-emerald-600"
              />
              <MetricBar
                value={row.bookingsCurrentYear}
                maxValue={maxValue}
                className="bg-copper"
              />
            </div>
            <div className="flex items-center justify-between gap-3 text-xs text-stone-600 sm:block sm:text-right">
              <p>{formatInteger(row.guestsCurrentYear)} guests</p>
              <p>{formatInteger(row.bookingsCurrentYear)} bookings</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RankedDaysList({
  days,
  emptyTitle,
  emptyDescription
}: RankedDaysListProps) {
  if (days.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={<CalendarX2 className="h-5 w-5" aria-hidden="true" />}
      />
    );
  }

  const maxGuests = Math.max(1, ...days.map((day) => day.guestsCurrentYear));

  return (
    <div className="divide-y divide-stone-100">
      {days.map((day, index) => (
        <div
          key={`${day.label}-${index}`}
          className="grid gap-3 py-3 sm:grid-cols-[2.5rem_1fr_7rem]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-stone-100 text-sm font-semibold text-stone-600">
            {index + 1}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="font-medium text-ink">{day.label}</p>
              <p className="text-xs text-stone-500">
                {formatDecimal(day.averageGuestsPerBooking)} guests / booking
              </p>
            </div>
            <div className="mt-2 h-2 rounded-full bg-stone-100">
              <div
                className="h-2 rounded-full bg-emerald-600"
                style={{ width: `${barPercent(day.guestsCurrentYear, maxGuests)}%` }}
              />
            </div>
          </div>
          <div className="text-sm text-stone-600 sm:text-right">
            <p className="font-medium text-ink">
              {formatInteger(day.guestsCurrentYear)} guests
            </p>
            <p>{formatInteger(day.bookingsCurrentYear)} bookings</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartLegend({
  currentLabel,
  previousLabel
}: {
  currentLabel: string;
  previousLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600">
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
        {currentLabel}
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-copper" />
        {previousLabel}
      </span>
    </div>
  );
}

function MetricBar({
  value,
  maxValue,
  className
}: {
  value: number;
  maxValue: number;
  className: string;
}) {
  return (
    <div className="h-2.5 rounded-full bg-stone-200">
      <div
        className={cn("h-2.5 rounded-full", className)}
        style={{ width: `${barPercent(value, maxValue)}%` }}
      />
    </div>
  );
}

function buildPolyline(values: number[]): string {
  const chart = {
    left: 44,
    right: 612,
    top: 44,
    bottom: 196
  };
  const width = chart.right - chart.left;
  const height = chart.bottom - chart.top;
  const maxValue = Math.max(1, ...values);

  return values
    .map((value, index) => {
      const x =
        values.length === 1
          ? chart.left + width / 2
          : chart.left + (index / (values.length - 1)) * width;
      const y = chart.bottom - (value / maxValue) * height;

      return `${roundCoordinate(x)},${roundCoordinate(y)}`;
    })
    .join(" ");
}

function barPercent(value: number, maxValue: number): number {
  if (value <= 0 || maxValue <= 0) {
    return 0;
  }

  return Math.max(4, Math.round((value / maxValue) * 100));
}

function roundCoordinate(value: number): number {
  return Math.round(value * 10) / 10;
}

function formatInteger(value: number): string {
  return numberFormatter.format(value);
}

function formatDecimal(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
}

export function formatCompact(value: number): string {
  return compactFormatter.format(value);
}
