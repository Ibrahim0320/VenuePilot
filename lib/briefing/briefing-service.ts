import type {
  BriefingForecast,
  BriefingSourceSnapshot,
  ManagerBriefingContent,
  ManagerBriefingContext
} from "@/lib/briefing/briefing-types";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "2-digit",
  month: "short",
  timeZone: "UTC"
});

const shortDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC"
});

const weekdayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

export function buildDeterministicManagerBriefing(
  context: ManagerBriefingContext
): ManagerBriefingContent {
  const snapshot = buildBriefingSourceSnapshot(context);
  const busiestDays = getBusiestForecasts(context.forecasts, 3);
  const quietestDays = getQuietestForecasts(context.forecasts, 3);
  const busyOrPeakDays = context.forecasts.filter(
    (forecast) => forecast.demandLevel === "busy" || forecast.demandLevel === "peak"
  );
  const quietDays = context.forecasts.filter(
    (forecast) => forecast.demandLevel === "quiet"
  );
  const lowConfidenceDays = context.forecasts.filter(
    (forecast) => forecast.confidence === "low"
  );
  const activePackages = context.packages.filter((item) => item.active);
  const strongestWeekday = getStrongestWeekday(context.weekdayMetrics);
  const weakestWeekday = getWeakestWeekday(context.weekdayMetrics);

  return {
    executiveSummary: buildExecutiveSummary({
      venueName: context.venue.name,
      snapshot,
      busiestDay: busiestDays[0],
      quietestDay: quietestDays[0]
    }),
    expectedDemand: buildExpectedDemandSummary(snapshot),
    busiestUpcomingDays: busiestDays.map(
      (forecast) =>
        `${formatForecastDate(forecast.date)} is forecast at ${formatInteger(
          forecast.expectedGuests
        )} guests across ${formatInteger(
          forecast.expectedBookings
        )} bookings. Demand is ${forecast.demandLevel}; ${forecast.recommendedActions}`
    ),
    quietestUpcomingDays: quietestDays.map(
      (forecast) =>
        `${formatForecastDate(forecast.date)} is the softest visible day at ${formatInteger(
          forecast.expectedGuests
        )} guests and ${formatInteger(
          forecast.expectedBookings
        )} bookings. Use it for controlled off-peak activity only if a manager approves the offer.`
    ),
    staffingRecommendations: buildStaffingRecommendations({
      busyOrPeakDays,
      quietDays,
      lowConfidenceDays
    }),
    promotionRecommendations: buildPromotionRecommendations({
      quietDays,
      busyOrPeakDays
    }),
    packageUpsellOpportunities: buildUpsellOpportunities({
      activePackages,
      busyOrPeakDays,
      quietDays
    }),
    risksOrUnusualPatterns: buildRiskNotes({
      context,
      lowConfidenceDays,
      strongestWeekday,
      weakestWeekday
    }),
    suggestedManagerActions: buildSuggestedManagerActions({
      context,
      busiestDays,
      quietestDays,
      lowConfidenceDays
    })
  };
}

export function buildBriefingSourceSnapshot(
  context: ManagerBriefingContext
): BriefingSourceSnapshot {
  const forecastTotals = summarizeForecasts(context.forecasts);
  const activePackages = context.packages.filter((item) => item.active);

  return {
    venue: {
      name: context.venue.name,
      city: context.venue.city,
      venueType: context.venue.venueType
    },
    period: {
      startDate: toDateKey(context.weekStartDate),
      endDate: toDateKey(context.weekEndDate)
    },
    dataCounts: {
      dailyMetricRows: context.dailyMetrics.length,
      weekdayMetricRows: context.weekdayMetrics.length,
      forecastRows: context.forecasts.length,
      activePackages: activePackages.length
    },
    forecastTotals,
    busiestUpcomingDays: getBusiestForecasts(context.forecasts, 3).map(
      serializeForecast
    ),
    quietestUpcomingDays: getQuietestForecasts(context.forecasts, 3).map(
      serializeForecast
    ),
    weekdayPerformance: [...context.weekdayMetrics]
      .sort((a, b) => b.guestsCurrentYear - a.guestsCurrentYear)
      .map((metric) => ({
        weekday: weekdayNames[metric.weekday] ?? `Day ${metric.weekday}`,
        guestsCurrentYear: metric.guestsCurrentYear,
        guestsPreviousYear: metric.guestsPreviousYear,
        bookingsCurrentYear: metric.bookingsCurrentYear,
        bookingsPreviousYear: metric.bookingsPreviousYear
      })),
    venueRules: {
      openingHours: context.settings.openingHours,
      bookingPolicy: context.settings.bookingPolicy,
      depositPolicy: context.settings.depositPolicy,
      groupBookingThreshold: context.settings.groupBookingThreshold,
      largeGroupEscalationThreshold: context.settings.largeGroupEscalationThreshold,
      humanReviewRules: context.settings.humanReviewRules,
      autoReplyAllowed: context.settings.autoReplyAllowed,
      aiAutonomyLevel: context.settings.aiAutonomyLevel
    },
    packages: activePackages.map((item) => ({
      name: item.name,
      description: item.description,
      minGuests: item.minGuests,
      maxGuests: item.maxGuests,
      priceDescription: item.priceDescription
    }))
  };
}

export function getBriefingWeekWindow(now = new Date()): {
  weekStartDate: Date;
  weekEndDate: Date;
} {
  const weekStartDate = addUtcDays(startOfUtcDay(now), 1);

  return {
    weekStartDate,
    weekEndDate: addUtcDays(weekStartDate, 6)
  };
}

function buildExecutiveSummary({
  venueName,
  snapshot,
  busiestDay,
  quietestDay
}: {
  venueName: string;
  snapshot: BriefingSourceSnapshot;
  busiestDay?: BriefingForecast;
  quietestDay?: BriefingForecast;
}): string {
  if (snapshot.dataCounts.forecastRows === 0) {
    return `${venueName} does not have saved forecast rows for the upcoming week yet. Import daily booking data and generate forecasts before making staffing or promotion decisions.`;
  }

  const demandMix = [
    snapshot.forecastTotals.peakDays > 0
      ? `${snapshot.forecastTotals.peakDays} peak`
      : "",
    snapshot.forecastTotals.busyDays > 0
      ? `${snapshot.forecastTotals.busyDays} busy`
      : "",
    snapshot.forecastTotals.quietDays > 0
      ? `${snapshot.forecastTotals.quietDays} quiet`
      : ""
  ]
    .filter(Boolean)
    .join(", ");

  return `${venueName} is forecast to welcome ${formatInteger(
    snapshot.forecastTotals.expectedGuests
  )} guests across ${formatInteger(
    snapshot.forecastTotals.expectedBookings
  )} bookings in the next 7 days. ${
    demandMix
      ? `The visible demand mix includes ${demandMix} day${
          demandMix.includes(",") ? "s" : ""
        }.`
      : "Demand looks mostly normal across the week."
  } ${
    busiestDay
      ? `${formatForecastDate(
          busiestDay.date
        )} is the strongest day, so protect the best slots and plan staffing early.`
      : ""
  } ${
    quietestDay
      ? `${formatForecastDate(
          quietestDay.date
        )} is the softest day and is the best candidate for controlled promotion.`
      : ""
  }`.trim();
}

function buildExpectedDemandSummary(snapshot: BriefingSourceSnapshot): string {
  if (snapshot.dataCounts.forecastRows === 0) {
    return "No weekly forecast rows are available yet. The briefing is intentionally conservative until forecast data exists.";
  }

  return `For ${snapshot.period.startDate} to ${
    snapshot.period.endDate
  }, the saved forecast expects ${formatInteger(
    snapshot.forecastTotals.expectedGuests
  )} guests and ${formatInteger(
    snapshot.forecastTotals.expectedBookings
  )} bookings. The week contains ${formatInteger(
    snapshot.forecastTotals.quietDays
  )} quiet, ${formatInteger(
    snapshot.forecastTotals.normalDays
  )} normal, ${formatInteger(
    snapshot.forecastTotals.busyDays
  )} busy and ${formatInteger(snapshot.forecastTotals.peakDays)} peak days.`;
}

function buildStaffingRecommendations({
  busyOrPeakDays,
  quietDays,
  lowConfidenceDays
}: {
  busyOrPeakDays: BriefingForecast[];
  quietDays: BriefingForecast[];
  lowConfidenceDays: BriefingForecast[];
}): string[] {
  const recommendations: string[] = [];

  if (busyOrPeakDays.length > 0) {
    recommendations.push(
      `Review staffing for ${formatForecastList(
        busyOrPeakDays
      )}. These are the days most likely to need stronger floor, bar and billiards coverage.`
    );
  } else {
    recommendations.push(
      "Keep base staffing flexible. No upcoming day is currently marked busy or peak."
    );
  }

  if (quietDays.length > 0) {
    recommendations.push(
      `Use lighter rosters or flexible shift starts on ${formatForecastList(
        quietDays
      )}, while keeping enough coverage for walk-ins and service quality.`
    );
  }

  if (lowConfidenceDays.length > 0) {
    recommendations.push(
      `Check booking pace manually on ${formatForecastList(
        lowConfidenceDays
      )}; forecast confidence is low because the historical signal is limited.`
    );
  }

  return recommendations;
}

function buildPromotionRecommendations({
  quietDays,
  busyOrPeakDays
}: {
  quietDays: BriefingForecast[];
  busyOrPeakDays: BriefingForecast[];
}): string[] {
  const recommendations: string[] = [];

  if (quietDays.length > 0) {
    recommendations.push(
      `Prioritize off-peak campaigns on ${formatForecastList(
        quietDays
      )}: student offer, family billiards package, small event hook or corporate outreach.`
    );
  } else {
    recommendations.push(
      "No clear quiet-day promotion window is visible in the current forecast. Avoid creating discounts without a manager-approved reason."
    );
  }

  if (busyOrPeakDays.length > 0) {
    recommendations.push(
      `Avoid discounting ${formatForecastList(
        busyOrPeakDays
      )}. Use those slots for full-price bookings, dinner + activity combinations and larger groups.`
    );
  }

  return recommendations;
}

function buildUpsellOpportunities({
  activePackages,
  busyOrPeakDays,
  quietDays
}: {
  activePackages: Array<{
    name: string;
    minGuests: number | null;
    maxGuests: number | null;
  }>;
  busyOrPeakDays: BriefingForecast[];
  quietDays: BriefingForecast[];
}): string[] {
  const recommendations: string[] = [];

  if (activePackages.length > 0) {
    const packageNames = activePackages
      .slice(0, 3)
      .map((item) => item.name)
      .join(", ");

    recommendations.push(
      `Use active packages such as ${packageNames} when staff reply to suitable group inquiries. Keep final availability and terms under human approval.`
    );
  } else {
    recommendations.push(
      "No active packages are configured. Add package details in Settings before staff rely on package suggestions."
    );
  }

  if (busyOrPeakDays.length > 0) {
    recommendations.push(
      `For ${formatForecastList(
        busyOrPeakDays
      )}, protect prime evening capacity for larger groups, food interest and higher-value billiards combinations.`
    );
  }

  if (quietDays.length > 0) {
    recommendations.push(
      `For ${formatForecastList(
        quietDays
      )}, use smaller bundles or early/late slot offers to lift demand without training guests to expect peak discounts.`
    );
  }

  return recommendations;
}

function buildRiskNotes({
  context,
  lowConfidenceDays,
  strongestWeekday,
  weakestWeekday
}: {
  context: ManagerBriefingContext;
  lowConfidenceDays: BriefingForecast[];
  strongestWeekday?: { weekday: string; guests: number; bookings: number };
  weakestWeekday?: { weekday: string; guests: number; bookings: number };
}): string[] {
  const notes: string[] = [];

  if (context.dailyMetrics.length === 0) {
    notes.push(
      "No imported daily metrics are available. Treat this briefing as a placeholder until Caspeco daily data is imported."
    );
  }

  if (context.weekdayMetrics.length === 0) {
    notes.push(
      "No weekday metric file has been imported yet, so weekday performance signals are missing."
    );
  }

  if (lowConfidenceDays.length > 0) {
    notes.push(
      `Low-confidence forecasts appear on ${formatForecastList(
        lowConfidenceDays
      )}. Managers should compare these days with the live booking book before changing staffing.`
    );
  }

  if (
    strongestWeekday &&
    weakestWeekday &&
    strongestWeekday.weekday !== weakestWeekday.weekday
  ) {
    notes.push(
      `${strongestWeekday.weekday} is the strongest imported weekday (${formatInteger(
        strongestWeekday.guests
      )} guests), while ${weakestWeekday.weekday} is weakest (${formatInteger(
        weakestWeekday.guests
      )} guests). Use that pattern when choosing promotion timing.`
    );
  }

  if (context.settings.autoReplyAllowed) {
    notes.push(
      "Auto-reply is enabled in settings, but the MVP should still keep manager approval in place before guest-facing messages are sent."
    );
  }

  return notes.length > 0
    ? notes
    : ["No unusual patterns stand out from the currently imported metrics."];
}

function buildSuggestedManagerActions({
  context,
  busiestDays,
  quietestDays,
  lowConfidenceDays
}: {
  context: ManagerBriefingContext;
  busiestDays: BriefingForecast[];
  quietestDays: BriefingForecast[];
  lowConfidenceDays: BriefingForecast[];
}): string[] {
  const actions = [
    "Review this briefing against the live booking book before changing staffing, deposits or promotions.",
    "Ask staff to keep AI-prepared guest replies in the approval queue until a human confirms availability."
  ];

  if (busiestDays[0]) {
    actions.push(
      `Check staffing and table allocation for ${formatForecastDate(
        busiestDays[0].date
      )}, the strongest upcoming day.`
    );
  }

  if (quietestDays[0]) {
    actions.push(
      `Choose whether ${formatForecastDate(
        quietestDays[0].date
      )} should receive a promotion, outreach push or no action.`
    );
  }

  if (lowConfidenceDays.length > 0) {
    actions.push(
      "Use live booking pace to validate low-confidence forecast days before committing operational changes."
    );
  }

  if (context.settings.aiAutonomyLevel === "full_auto_disabled_for_now") {
    actions.push(
      "Keep full automation disabled; use the briefing as decision support for managers and shift leads."
    );
  }

  return actions;
}

function summarizeForecasts(forecasts: BriefingForecast[]) {
  return forecasts.reduce(
    (summary, forecast) => ({
      expectedGuests: summary.expectedGuests + forecast.expectedGuests,
      expectedBookings: summary.expectedBookings + forecast.expectedBookings,
      quietDays: summary.quietDays + (forecast.demandLevel === "quiet" ? 1 : 0),
      normalDays: summary.normalDays + (forecast.demandLevel === "normal" ? 1 : 0),
      busyDays: summary.busyDays + (forecast.demandLevel === "busy" ? 1 : 0),
      peakDays: summary.peakDays + (forecast.demandLevel === "peak" ? 1 : 0)
    }),
    {
      expectedGuests: 0,
      expectedBookings: 0,
      quietDays: 0,
      normalDays: 0,
      busyDays: 0,
      peakDays: 0
    }
  );
}

function getBusiestForecasts(
  forecasts: BriefingForecast[],
  limit: number
): BriefingForecast[] {
  return [...forecasts]
    .sort((a, b) => b.expectedGuests - a.expectedGuests)
    .slice(0, limit);
}

function getQuietestForecasts(
  forecasts: BriefingForecast[],
  limit: number
): BriefingForecast[] {
  return [...forecasts]
    .sort((a, b) => a.expectedGuests - b.expectedGuests)
    .slice(0, limit);
}

function getStrongestWeekday(weekdayMetrics: ManagerBriefingContext["weekdayMetrics"]) {
  const [metric] = [...weekdayMetrics].sort(
    (a, b) => b.guestsCurrentYear - a.guestsCurrentYear
  );

  return metric
    ? {
        weekday: weekdayNames[metric.weekday] ?? `Day ${metric.weekday}`,
        guests: metric.guestsCurrentYear,
        bookings: metric.bookingsCurrentYear
      }
    : undefined;
}

function getWeakestWeekday(weekdayMetrics: ManagerBriefingContext["weekdayMetrics"]) {
  const [metric] = [...weekdayMetrics].sort(
    (a, b) => a.guestsCurrentYear - b.guestsCurrentYear
  );

  return metric
    ? {
        weekday: weekdayNames[metric.weekday] ?? `Day ${metric.weekday}`,
        guests: metric.guestsCurrentYear,
        bookings: metric.bookingsCurrentYear
      }
    : undefined;
}

function serializeForecast(forecast: BriefingForecast) {
  return {
    date: toDateKey(forecast.date),
    expectedGuests: forecast.expectedGuests,
    expectedBookings: forecast.expectedBookings,
    demandLevel: forecast.demandLevel,
    confidence: forecast.confidence
  };
}

function formatForecastList(forecasts: BriefingForecast[]): string {
  return forecasts.map((forecast) => formatForecastDate(forecast.date)).join(", ");
}

function formatForecastDate(date: Date): string {
  return dateFormatter.format(date);
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

function addUtcDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);

  return nextDate;
}

function formatInteger(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatBriefingDateRange(startDate: Date, endDate: Date): string {
  return `${shortDateFormatter.format(startDate)} - ${shortDateFormatter.format(
    endDate
  )}`;
}
