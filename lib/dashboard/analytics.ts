export type DashboardDailyMetric = {
  date: Date;
  guestsCurrentYear: number | null;
  guestsPreviousYear: number | null;
  bookingsCurrentYear: number | null;
  bookingsPreviousYear: number | null;
};

export type DashboardWeekdayMetric = {
  weekday: number;
  bookingsCurrentYear: number | null;
  bookingsPreviousYear: number | null;
  guestsCurrentYear: number | null;
  guestsPreviousYear: number | null;
};

export type MonthBucket = {
  key: string;
  label: string;
  rowCount: number;
  guestsCurrentYear: number;
  guestsPreviousYear: number;
  bookingsCurrentYear: number;
  bookingsPreviousYear: number;
};

export type WeekdayBucket = {
  weekday: number;
  label: string;
  rowCount: number;
  guestsCurrentYear: number;
  guestsPreviousYear: number;
  bookingsCurrentYear: number;
  bookingsPreviousYear: number;
};

export type RankedDay = {
  date: Date;
  label: string;
  guestsCurrentYear: number;
  bookingsCurrentYear: number;
  averageGuestsPerBooking: number;
};

export type DashboardInsight = {
  title: string;
  value: string;
  detail: string;
};

export type DashboardAnalytics = {
  hasDailyData: boolean;
  hasWeekdayData: boolean;
  totals: {
    guestsCurrentYear: number;
    guestsPreviousYear: number;
    guestGrowthPercent: number | null;
    bookingsCurrentYear: number;
    bookingsPreviousYear: number;
    bookingGrowthPercent: number | null;
    averageGuestsPerBookingCurrentYear: number;
    averageGuestsPerBookingPreviousYear: number;
  };
  monthBuckets: MonthBucket[];
  weekdayBuckets: WeekdayBucket[];
  topBusiestDays: RankedDay[];
  topQuietestDays: RankedDay[];
  insights: DashboardInsight[];
};

const monthLabelFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "numeric",
  timeZone: "UTC"
});

const dayLabelFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC"
});

const weekdayLabels: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday"
};

const orderedWeekdays = [1, 2, 3, 4, 5, 6, 0];

export function buildDashboardAnalytics(
  dailyMetrics: DashboardDailyMetric[],
  weekdayMetrics: DashboardWeekdayMetric[]
): DashboardAnalytics {
  const validDailyMetrics = dailyMetrics.filter((metric) => isValidDate(metric.date));

  const totals = validDailyMetrics.reduce(
    (currentTotals, metric) => ({
      guestsCurrentYear:
        currentTotals.guestsCurrentYear + toNumber(metric.guestsCurrentYear),
      guestsPreviousYear:
        currentTotals.guestsPreviousYear + toNumber(metric.guestsPreviousYear),
      bookingsCurrentYear:
        currentTotals.bookingsCurrentYear + toNumber(metric.bookingsCurrentYear),
      bookingsPreviousYear:
        currentTotals.bookingsPreviousYear + toNumber(metric.bookingsPreviousYear)
    }),
    {
      guestsCurrentYear: 0,
      guestsPreviousYear: 0,
      bookingsCurrentYear: 0,
      bookingsPreviousYear: 0
    }
  );

  const averageGuestsPerBookingCurrentYear = averageGuestsPerBooking(
    totals.guestsCurrentYear,
    totals.bookingsCurrentYear
  );
  const averageGuestsPerBookingPreviousYear = averageGuestsPerBooking(
    totals.guestsPreviousYear,
    totals.bookingsPreviousYear
  );

  const dashboardTotals = {
    ...totals,
    guestGrowthPercent: growthPercent(
      totals.guestsCurrentYear,
      totals.guestsPreviousYear
    ),
    bookingGrowthPercent: growthPercent(
      totals.bookingsCurrentYear,
      totals.bookingsPreviousYear
    ),
    averageGuestsPerBookingCurrentYear,
    averageGuestsPerBookingPreviousYear
  };

  const monthBuckets = buildMonthBuckets(validDailyMetrics);
  const weekdayBuckets = buildWeekdayBuckets(weekdayMetrics);
  const topBusiestDays = buildRankedDays(validDailyMetrics, "busiest");
  const topQuietestDays = buildRankedDays(validDailyMetrics, "quietest");

  return {
    hasDailyData: validDailyMetrics.length > 0,
    hasWeekdayData: weekdayMetrics.length > 0,
    totals: dashboardTotals,
    monthBuckets,
    weekdayBuckets,
    topBusiestDays,
    topQuietestDays,
    insights: buildInsights(dashboardTotals, monthBuckets, weekdayBuckets)
  };
}

function buildMonthBuckets(metrics: DashboardDailyMetric[]): MonthBucket[] {
  if (metrics.length === 0) {
    return [];
  }

  const sortedMetrics = [...metrics].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
  const firstKey = monthKey(sortedMetrics[0].date);
  const lastKey = monthKey(sortedMetrics[sortedMetrics.length - 1].date);
  const buckets = new Map<string, MonthBucket>();

  for (const key of monthsBetween(firstKey, lastKey)) {
    buckets.set(key, createMonthBucket(key));
  }

  for (const metric of sortedMetrics) {
    const key = monthKey(metric.date);
    const bucket = buckets.get(key) ?? createMonthBucket(key);
    bucket.rowCount += 1;
    bucket.guestsCurrentYear += toNumber(metric.guestsCurrentYear);
    bucket.guestsPreviousYear += toNumber(metric.guestsPreviousYear);
    bucket.bookingsCurrentYear += toNumber(metric.bookingsCurrentYear);
    bucket.bookingsPreviousYear += toNumber(metric.bookingsPreviousYear);
    buckets.set(key, bucket);
  }

  return [...buckets.values()];
}

function buildWeekdayBuckets(metrics: DashboardWeekdayMetric[]): WeekdayBucket[] {
  const buckets = new Map<number, WeekdayBucket>(
    orderedWeekdays.map((weekday) => [
      weekday,
      {
        weekday,
        label: weekdayLabels[weekday],
        rowCount: 0,
        guestsCurrentYear: 0,
        guestsPreviousYear: 0,
        bookingsCurrentYear: 0,
        bookingsPreviousYear: 0
      }
    ])
  );

  for (const metric of metrics) {
    const weekday = normaliseWeekday(metric.weekday);

    if (weekday === null) {
      continue;
    }

    const bucket =
      buckets.get(weekday) ??
      ({
        weekday,
        label: weekdayLabels[weekday] ?? `Weekday ${weekday}`,
        rowCount: 0,
        guestsCurrentYear: 0,
        guestsPreviousYear: 0,
        bookingsCurrentYear: 0,
        bookingsPreviousYear: 0
      } satisfies WeekdayBucket);

    bucket.rowCount += 1;
    bucket.guestsCurrentYear += toNumber(metric.guestsCurrentYear);
    bucket.guestsPreviousYear += toNumber(metric.guestsPreviousYear);
    bucket.bookingsCurrentYear += toNumber(metric.bookingsCurrentYear);
    bucket.bookingsPreviousYear += toNumber(metric.bookingsPreviousYear);
    buckets.set(weekday, bucket);
  }

  return orderedWeekdays.map((weekday) => buckets.get(weekday)!);
}

function buildRankedDays(
  metrics: DashboardDailyMetric[],
  direction: "busiest" | "quietest"
): RankedDay[] {
  return [...metrics]
    .sort((a, b) => {
      const guestDifference =
        toNumber(a.guestsCurrentYear) - toNumber(b.guestsCurrentYear);
      const bookingDifference =
        toNumber(a.bookingsCurrentYear) - toNumber(b.bookingsCurrentYear);
      const timeDifference = a.date.getTime() - b.date.getTime();
      const result = guestDifference || bookingDifference || timeDifference;

      return direction === "busiest" ? -result : result;
    })
    .slice(0, 10)
    .map((metric) => {
      const guestsCurrentYear = toNumber(metric.guestsCurrentYear);
      const bookingsCurrentYear = toNumber(metric.bookingsCurrentYear);

      return {
        date: metric.date,
        label: dayLabelFormatter.format(metric.date),
        guestsCurrentYear,
        bookingsCurrentYear,
        averageGuestsPerBooking: averageGuestsPerBooking(
          guestsCurrentYear,
          bookingsCurrentYear
        )
      };
    });
}

function buildInsights(
  totals: DashboardAnalytics["totals"],
  monthBuckets: MonthBucket[],
  weekdayBuckets: WeekdayBucket[]
): DashboardInsight[] {
  const activeMonthBuckets = monthBuckets.filter((bucket) => bucket.rowCount > 0);
  const activeWeekdayBuckets = weekdayBuckets.filter((bucket) => bucket.rowCount > 0);
  const strongestMonth = maxBy(
    activeMonthBuckets,
    (bucket) => bucket.guestsCurrentYear
  );
  const weakestMonth = minBy(activeMonthBuckets, (bucket) => bucket.guestsCurrentYear);
  const busiestWeekday = maxBy(
    activeWeekdayBuckets,
    (bucket) => bucket.guestsCurrentYear
  );
  const quietestWeekday = minBy(
    activeWeekdayBuckets,
    (bucket) => bucket.guestsCurrentYear
  );

  const insights: DashboardInsight[] = [];

  if (strongestMonth) {
    insights.push({
      title: "Strongest month",
      value: strongestMonth.label,
      detail: `${formatInteger(
        strongestMonth.guestsCurrentYear
      )} guests and ${formatInteger(
        strongestMonth.bookingsCurrentYear
      )} bookings in imported daily data.`
    });
  }

  if (weakestMonth) {
    insights.push({
      title: "Weakest month",
      value: weakestMonth.label,
      detail: `${formatInteger(
        weakestMonth.guestsCurrentYear
      )} guests and ${formatInteger(
        weakestMonth.bookingsCurrentYear
      )} bookings in imported daily data.`
    });
  }

  if (busiestWeekday) {
    insights.push({
      title: "Busiest weekday",
      value: busiestWeekday.label,
      detail: `${formatInteger(
        busiestWeekday.guestsCurrentYear
      )} guests across ${formatInteger(busiestWeekday.bookingsCurrentYear)} bookings.`
    });
  }

  if (quietestWeekday) {
    insights.push({
      title: "Quietest weekday",
      value: quietestWeekday.label,
      detail: `${formatInteger(
        quietestWeekday.guestsCurrentYear
      )} guests across ${formatInteger(quietestWeekday.bookingsCurrentYear)} bookings.`
    });
  }

  insights.push(buildGrowthPaceInsight(totals));
  insights.push(buildPartySizeInsight(totals));
  insights.push(buildCapacityInsight(totals));

  return insights;
}

function buildGrowthPaceInsight(
  totals: DashboardAnalytics["totals"]
): DashboardInsight {
  const guestGrowth = totals.guestGrowthPercent;
  const bookingGrowth = totals.bookingGrowthPercent;

  if (guestGrowth === null || bookingGrowth === null) {
    return {
      title: "Growth pace",
      value: "Needs comparison data",
      detail:
        "Previous-year guests and bookings are needed before growth pace can be compared reliably."
    };
  }

  if (Math.abs(bookingGrowth - guestGrowth) < 0.1) {
    return {
      title: "Growth pace",
      value: "Bookings and guests moved together",
      detail: `Bookings changed by ${formatPercent(
        bookingGrowth
      )} while guests changed by ${formatPercent(guestGrowth)}.`
    };
  }

  if (bookingGrowth > guestGrowth) {
    return {
      title: "Growth pace",
      value: "Bookings grew faster than guests",
      detail: `Bookings changed by ${formatPercent(
        bookingGrowth
      )}, ahead of guest growth at ${formatPercent(guestGrowth)}.`
    };
  }

  return {
    title: "Growth pace",
    value: "Guests grew faster than bookings",
    detail: `Guests changed by ${formatPercent(
      guestGrowth
    )}, ahead of booking growth at ${formatPercent(bookingGrowth)}.`
  };
}

function buildPartySizeInsight(totals: DashboardAnalytics["totals"]): DashboardInsight {
  const currentAverage = totals.averageGuestsPerBookingCurrentYear;
  const previousAverage = totals.averageGuestsPerBookingPreviousYear;
  const delta = currentAverage - previousAverage;

  if (currentAverage === 0 && previousAverage === 0) {
    return {
      title: "Average party size",
      value: "No bookings yet",
      detail:
        "Imported daily data with bookings is needed before party size can be measured."
    };
  }

  if (Math.abs(delta) < 0.05) {
    return {
      title: "Average party size",
      value: "Stable",
      detail: `Average party size stayed close to ${formatDecimal(
        currentAverage
      )} guests per booking.`
    };
  }

  if (delta > 0) {
    return {
      title: "Average party size",
      value: "Increased",
      detail: `Average party size rose from ${formatDecimal(
        previousAverage
      )} to ${formatDecimal(currentAverage)} guests per booking.`
    };
  }

  return {
    title: "Average party size",
    value: "Decreased",
    detail: `Average party size moved from ${formatDecimal(
      previousAverage
    )} to ${formatDecimal(currentAverage)} guests per booking.`
  };
}

function buildCapacityInsight(totals: DashboardAnalytics["totals"]): DashboardInsight {
  const guestGrowth = totals.guestGrowthPercent;
  const bookingGrowth = totals.bookingGrowthPercent;
  const averageDelta =
    totals.averageGuestsPerBookingCurrentYear -
    totals.averageGuestsPerBookingPreviousYear;

  if (totals.guestsCurrentYear === 0 && totals.bookingsCurrentYear === 0) {
    return {
      title: "Capacity implication",
      value: "Waiting for data",
      detail:
        "Once booking history is imported, VenuePilot can flag staffing, capacity and promotion implications."
    };
  }

  if (guestGrowth !== null && guestGrowth < 0 && bookingGrowth !== null) {
    return {
      title: "Capacity implication",
      value: "Revenue recovery focus",
      detail:
        "Guest volume is below last year in the imported data, so quiet-period promotions and package follow-ups may matter more than adding capacity."
    };
  }

  if (averageDelta > 0.2) {
    return {
      title: "Capacity implication",
      value: "Larger groups need protected slots",
      detail:
        "Higher guests per booking can lift revenue per reservation, but peak periods may need deposit checks, package guidance and clearer table allocation."
    };
  }

  if (guestGrowth !== null && bookingGrowth !== null && bookingGrowth > guestGrowth) {
    return {
      title: "Capacity implication",
      value: "More booking handling per guest",
      detail:
        "Bookings are rising faster than guests, which can increase admin load and make efficient confirmation workflows more valuable."
    };
  }

  return {
    title: "Capacity implication",
    value: "Demand supports revenue planning",
    detail:
      "Current demand signals can be used to tune staffing, group packages and quiet-day offers before adding AI recommendations."
  };
}

function growthPercent(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }

  return ((current - previous) / previous) * 100;
}

function averageGuestsPerBooking(guests: number, bookings: number): number {
  if (bookings <= 0) {
    return 0;
  }

  return guests / bookings;
}

function monthsBetween(firstKey: string, lastKey: string): string[] {
  const [firstYear, firstMonth] = firstKey.split("-").map(Number);
  const [lastYear, lastMonth] = lastKey.split("-").map(Number);
  const keys: string[] = [];
  let year = firstYear;
  let month = firstMonth;

  while (year < lastYear || (year === lastYear && month <= lastMonth)) {
    keys.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;

    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return keys;
}

function createMonthBucket(key: string): MonthBucket {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));

  return {
    key,
    label: monthLabelFormatter.format(date),
    rowCount: 0,
    guestsCurrentYear: 0,
    guestsPreviousYear: 0,
    bookingsCurrentYear: 0,
    bookingsPreviousYear: 0
  };
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function normaliseWeekday(weekday: number): number | null {
  if (!Number.isFinite(weekday)) {
    return null;
  }

  const normalised = Math.trunc(weekday);
  return normalised >= 0 && normalised <= 6 ? normalised : null;
}

function maxBy<T>(items: T[], getValue: (item: T) => number): T | undefined {
  return items.reduce<T | undefined>((bestItem, item) => {
    if (!bestItem || getValue(item) > getValue(bestItem)) {
      return item;
    }

    return bestItem;
  }, undefined);
}

function minBy<T>(items: T[], getValue: (item: T) => number): T | undefined {
  return items.reduce<T | undefined>((bestItem, item) => {
    if (!bestItem || getValue(item) < getValue(bestItem)) {
      return item;
    }

    return bestItem;
  }, undefined);
}

function isValidDate(date: Date): boolean {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function toNumber(value: number | null | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0;
}

function formatInteger(value: number): string {
  return value.toLocaleString("en-US");
}

function formatDecimal(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
}

function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";

  return `${sign}${formatDecimal(value)}%`;
}
