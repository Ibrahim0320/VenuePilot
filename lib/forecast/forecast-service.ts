export const FORECAST_HORIZONS = [7, 14, 30] as const;

export type ForecastHorizon = (typeof FORECAST_HORIZONS)[number];
export type ForecastConfidence = "low" | "medium" | "high";
export type DemandLevel = "quiet" | "normal" | "busy" | "peak";

export type ForecastDailyMetric = {
  date: Date;
  guestsCurrentYear: number | null;
  guestsPreviousYear: number | null;
  bookingsCurrentYear: number | null;
  bookingsPreviousYear: number | null;
};

export type DemandForecast = {
  date: Date;
  expectedGuests: number;
  expectedBookings: number;
  confidence: ForecastConfidence;
  demandLevel: DemandLevel;
  explanation: string;
  recommendedActions: string;
};

type NormalizedDailyMetric = {
  date: Date;
  guestsCurrentYear: number;
  guestsPreviousYear: number;
  bookingsCurrentYear: number;
  bookingsPreviousYear: number;
};

type ForecastSource = {
  label: string;
  guests: number;
  bookings: number;
  weight: number;
  rowCount: number;
};

type DemandProfile = {
  overallGuestsAverage: number;
  overallBookingsAverage: number;
  quietGuestsMax: number;
  busyGuestsMin: number;
  peakGuestsMin: number;
};

const dayMs = 24 * 60 * 60 * 1000;

export function getDefaultForecastStartDate(now = new Date()): Date {
  const today = startOfUtcDay(now);

  return addUtcDays(today, 1);
}

export function normaliseForecastHorizon(
  value: string | string[] | undefined
): ForecastHorizon {
  const parsedValue = Array.isArray(value) ? value[0] : value;
  const parsedNumber = Number(parsedValue);

  return FORECAST_HORIZONS.includes(parsedNumber as ForecastHorizon)
    ? (parsedNumber as ForecastHorizon)
    : 7;
}

export function generateDemandForecasts({
  dailyMetrics,
  startDate = getDefaultForecastStartDate(),
  horizonDays = 7
}: {
  dailyMetrics: ForecastDailyMetric[];
  startDate?: Date;
  horizonDays?: ForecastHorizon;
}): DemandForecast[] {
  const metrics = normaliseDailyMetrics(dailyMetrics);
  const profile = buildDemandProfile(metrics);

  return Array.from({ length: horizonDays }, (_, index) => {
    const date = addUtcDays(startOfUtcDay(startDate), index);

    return generateDateForecast(date, metrics, profile);
  });
}

function generateDateForecast(
  date: Date,
  metrics: NormalizedDailyMetric[],
  profile: DemandProfile
): DemandForecast {
  const sources = buildForecastSources(date, metrics, profile);

  if (sources.length === 0) {
    return {
      date,
      expectedGuests: 0,
      expectedBookings: 0,
      confidence: "low",
      demandLevel: "quiet",
      explanation:
        "No imported daily booking history is available yet, so this forecast uses a missing-data fallback. Import Caspeco daily exports before making staffing or discount decisions.",
      recommendedActions: recommendationForDemandLevel("quiet")
    };
  }

  const expectedGuests = weightedRoundedAverage(
    sources.map((source) => ({
      value: source.guests,
      weight: source.weight
    }))
  );
  const expectedBookings = weightedRoundedAverage(
    sources.map((source) => ({
      value: source.bookings,
      weight: source.weight
    }))
  );
  const demandLevel = classifyDemandLevel(expectedGuests, profile);
  const confidence = classifyConfidence(sources, metrics.length);

  return {
    date,
    expectedGuests,
    expectedBookings,
    confidence,
    demandLevel,
    explanation: buildExplanation({
      expectedGuests,
      expectedBookings,
      confidence,
      sources,
      metricCount: metrics.length
    }),
    recommendedActions: recommendationForDemandLevel(demandLevel)
  };
}

function buildForecastSources(
  date: Date,
  metrics: NormalizedDailyMetric[],
  profile: DemandProfile
): ForecastSource[] {
  if (metrics.length === 0) {
    return [];
  }

  const weekday = date.getUTCDay();
  const sameWeekdayMetrics = metrics.filter(
    (metric) => metric.date.getUTCDay() === weekday
  );
  const recentSameWeekdayMetrics = sameWeekdayMetrics.filter((metric) => {
    const daysBeforeForecast = differenceInUtcDays(date, metric.date);

    return daysBeforeForecast > 0 && daysBeforeForecast <= 28;
  });
  const monthMetrics = metrics.filter(
    (metric) => metric.date.getUTCMonth() === date.getUTCMonth()
  );
  const previousYearSameDateMetrics = metrics.filter(
    (metric) =>
      metric.date.getUTCMonth() === date.getUTCMonth() &&
      metric.date.getUTCDate() === date.getUTCDate() &&
      (metric.guestsPreviousYear > 0 || metric.bookingsPreviousYear > 0)
  );

  const sources: ForecastSource[] = [];

  if (sameWeekdayMetrics.length > 0) {
    sources.push({
      label: "same-weekday historical average",
      ...averageMetricValues(sameWeekdayMetrics, "current"),
      weight: 0.3,
      rowCount: sameWeekdayMetrics.length
    });
  }

  if (recentSameWeekdayMetrics.length > 0) {
    sources.push({
      label: "recent 4-week same-weekday average",
      ...averageMetricValues(recentSameWeekdayMetrics, "current"),
      weight: 0.35,
      rowCount: recentSameWeekdayMetrics.length
    });
  }

  if (monthMetrics.length > 0) {
    sources.push({
      label: "monthly seasonal average",
      ...averageMetricValues(monthMetrics, "current"),
      weight: 0.25,
      rowCount: monthMetrics.length
    });
  }

  if (previousYearSameDateMetrics.length > 0) {
    sources.push({
      label: "previous-year same-date result",
      ...averageMetricValues(previousYearSameDateMetrics, "previous"),
      weight: 0.25,
      rowCount: previousYearSameDateMetrics.length
    });
  }

  if (profile.overallGuestsAverage > 0 || profile.overallBookingsAverage > 0) {
    sources.push({
      label: "overall venue average",
      guests: profile.overallGuestsAverage,
      bookings: profile.overallBookingsAverage,
      weight: 0.15,
      rowCount: metrics.length
    });
  }

  return sources;
}

function buildDemandProfile(metrics: NormalizedDailyMetric[]): DemandProfile {
  if (metrics.length === 0) {
    return {
      overallGuestsAverage: 0,
      overallBookingsAverage: 0,
      quietGuestsMax: 0,
      busyGuestsMin: 0,
      peakGuestsMin: 0
    };
  }

  const guestValues = metrics.map((metric) => metric.guestsCurrentYear);
  const bookingValues = metrics.map((metric) => metric.bookingsCurrentYear);
  const overallGuestsAverage = average(guestValues);
  const overallBookingsAverage = average(bookingValues);

  if (metrics.length < 4) {
    return {
      overallGuestsAverage,
      overallBookingsAverage,
      quietGuestsMax: overallGuestsAverage * 0.65,
      busyGuestsMin: overallGuestsAverage * 1.25,
      peakGuestsMin: overallGuestsAverage * 1.6
    };
  }

  return {
    overallGuestsAverage,
    overallBookingsAverage,
    quietGuestsMax: Math.min(
      percentile(guestValues, 0.25),
      overallGuestsAverage * 0.75
    ),
    busyGuestsMin: Math.max(percentile(guestValues, 0.7), overallGuestsAverage * 1.1),
    peakGuestsMin: Math.max(percentile(guestValues, 0.9), overallGuestsAverage * 1.35)
  };
}

function classifyDemandLevel(
  expectedGuests: number,
  profile: DemandProfile
): DemandLevel {
  if (profile.overallGuestsAverage <= 0 || expectedGuests <= 0) {
    return "quiet";
  }

  if (expectedGuests >= profile.peakGuestsMin) {
    return "peak";
  }

  if (expectedGuests >= profile.busyGuestsMin) {
    return "busy";
  }

  if (expectedGuests <= profile.quietGuestsMax) {
    return "quiet";
  }

  return "normal";
}

function classifyConfidence(
  sources: ForecastSource[],
  metricCount: number
): ForecastConfidence {
  const hasRecentSource = sources.some((source) =>
    source.label.startsWith("recent 4-week")
  );
  const hasPreviousYearSource = sources.some((source) =>
    source.label.startsWith("previous-year")
  );

  if (
    metricCount >= 28 &&
    sources.length >= 4 &&
    hasRecentSource &&
    hasPreviousYearSource
  ) {
    return "high";
  }

  if (metricCount >= 10 && sources.length >= 3) {
    return "medium";
  }

  if (metricCount >= 4 && sources.length >= 2) {
    return "medium";
  }

  return "low";
}

function buildExplanation({
  expectedGuests,
  expectedBookings,
  confidence,
  sources,
  metricCount
}: {
  expectedGuests: number;
  expectedBookings: number;
  confidence: ForecastConfidence;
  sources: ForecastSource[];
  metricCount: number;
}): string {
  const sourceSummary = sources
    .slice(0, 5)
    .map(
      (source) =>
        `${source.label} (${formatInteger(
          Math.round(source.guests)
        )} guests, ${formatInteger(Math.round(source.bookings))} bookings)`
    )
    .join("; ");

  return `Expected ${formatInteger(expectedGuests)} guests and ${formatInteger(
    expectedBookings
  )} bookings. This blends ${sourceSummary}. Confidence is ${confidence} because ${formatInteger(
    metricCount
  )} imported daily row${metricCount === 1 ? "" : "s"} and ${formatInteger(
    sources.length
  )} comparison signal${sources.length === 1 ? "" : "s"} were available.`;
}

function recommendationForDemandLevel(level: DemandLevel): string {
  switch (level) {
    case "quiet":
      return "Treat this as a quiet-day opportunity: test an off-peak campaign such as a student offer, family package, small event, or corporate outreach, then have a manager approve any discount.";
    case "busy":
      return "Prepare staffing coverage early, check room and table allocation, and ask the team to upsell food, drinks and group packages.";
    case "peak":
      return "Protect prime slots, avoid discounts, consider deposits for larger groups, and review staffing and table allocation before confirming new requests.";
    case "normal":
    default:
      return "Monitor booking pace and keep capacity flexible. Avoid unnecessary discounting and use standard packages unless demand changes.";
  }
}

function normaliseDailyMetrics(
  dailyMetrics: ForecastDailyMetric[]
): NormalizedDailyMetric[] {
  return dailyMetrics
    .filter((metric) => isValidDate(metric.date))
    .map((metric) => ({
      date: startOfUtcDay(metric.date),
      guestsCurrentYear: toNonNegativeNumber(metric.guestsCurrentYear),
      guestsPreviousYear: toNonNegativeNumber(metric.guestsPreviousYear),
      bookingsCurrentYear: toNonNegativeNumber(metric.bookingsCurrentYear),
      bookingsPreviousYear: toNonNegativeNumber(metric.bookingsPreviousYear)
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

function averageMetricValues(
  metrics: NormalizedDailyMetric[],
  year: "current" | "previous"
): Pick<ForecastSource, "guests" | "bookings"> {
  return year === "current"
    ? {
        guests: average(metrics.map((metric) => metric.guestsCurrentYear)),
        bookings: average(metrics.map((metric) => metric.bookingsCurrentYear))
      }
    : {
        guests: average(metrics.map((metric) => metric.guestsPreviousYear)),
        bookings: average(metrics.map((metric) => metric.bookingsPreviousYear))
      };
}

function weightedRoundedAverage(
  values: Array<{ value: number; weight: number }>
): number {
  const weightTotal = values.reduce((total, item) => total + item.weight, 0);

  if (weightTotal <= 0) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(
      values.reduce((total, item) => total + item.value * item.weight, 0) / weightTotal
    )
  );
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function percentile(values: number[], fraction: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sortedValues = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil(fraction * sortedValues.length) - 1)
  );

  return sortedValues[index];
}

function differenceInUtcDays(laterDate: Date, earlierDate: Date): number {
  return Math.round(
    (startOfUtcDay(laterDate).getTime() - startOfUtcDay(earlierDate).getTime()) / dayMs
  );
}

function addUtcDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);

  return nextDate;
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

function isValidDate(date: Date): boolean {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function toNonNegativeNumber(value: number | null | undefined): number {
  return Math.max(0, Number.isFinite(value) ? Number(value) : 0);
}

function formatInteger(value: number): string {
  return value.toLocaleString("en-US");
}
