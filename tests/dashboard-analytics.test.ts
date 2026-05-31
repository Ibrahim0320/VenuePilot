import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildDashboardAnalytics } from "@/lib/dashboard/analytics";

describe("dashboard analytics", () => {
  it("returns safe zero values with no imported data", () => {
    const analytics = buildDashboardAnalytics([], []);

    assert.equal(analytics.hasDailyData, false);
    assert.equal(analytics.hasWeekdayData, false);
    assert.equal(analytics.totals.guestsCurrentYear, 0);
    assert.equal(analytics.totals.bookingsCurrentYear, 0);
    assert.equal(analytics.totals.guestGrowthPercent, 0);
    assert.equal(analytics.totals.bookingGrowthPercent, 0);
    assert.deepEqual(analytics.monthBuckets, []);
    assert.deepEqual(analytics.topBusiestDays, []);
  });

  it("calculates totals, growth and average party size from daily metrics", () => {
    const analytics = buildDashboardAnalytics(
      [
        {
          date: new Date("2026-01-02T00:00:00.000Z"),
          guestsCurrentYear: 10,
          guestsPreviousYear: 8,
          bookingsCurrentYear: 4,
          bookingsPreviousYear: 4
        },
        {
          date: new Date("2026-01-03T00:00:00.000Z"),
          guestsCurrentYear: 20,
          guestsPreviousYear: 10,
          bookingsCurrentYear: 5,
          bookingsPreviousYear: 4
        },
        {
          date: new Date("2026-03-01T00:00:00.000Z"),
          guestsCurrentYear: null,
          guestsPreviousYear: null,
          bookingsCurrentYear: null,
          bookingsPreviousYear: null
        }
      ],
      []
    );

    assert.equal(analytics.totals.guestsCurrentYear, 30);
    assert.equal(analytics.totals.guestsPreviousYear, 18);
    assert.equal(analytics.totals.bookingsCurrentYear, 9);
    assert.equal(analytics.totals.bookingsPreviousYear, 8);
    assert.equal(Math.round(analytics.totals.guestGrowthPercent ?? 0), 67);
    assert.equal(Math.round(analytics.totals.bookingGrowthPercent ?? 0), 13);
    assert.equal(
      Math.round(analytics.totals.averageGuestsPerBookingCurrentYear * 10) / 10,
      3.3
    );
  });

  it("fills missing months while keeping weakest month based on imported rows", () => {
    const analytics = buildDashboardAnalytics(
      [
        {
          date: new Date("2026-01-02T00:00:00.000Z"),
          guestsCurrentYear: 30,
          guestsPreviousYear: 20,
          bookingsCurrentYear: 10,
          bookingsPreviousYear: 8
        },
        {
          date: new Date("2026-03-01T00:00:00.000Z"),
          guestsCurrentYear: 4,
          guestsPreviousYear: 5,
          bookingsCurrentYear: 2,
          bookingsPreviousYear: 3
        }
      ],
      []
    );

    assert.deepEqual(
      analytics.monthBuckets.map((bucket) => ({
        key: bucket.key,
        rowCount: bucket.rowCount,
        guests: bucket.guestsCurrentYear
      })),
      [
        { key: "2026-01", rowCount: 1, guests: 30 },
        { key: "2026-02", rowCount: 0, guests: 0 },
        { key: "2026-03", rowCount: 1, guests: 4 }
      ]
    );
    assert.equal(
      analytics.insights.find((insight) => insight.title === "Weakest month")?.value,
      "Mar 2026"
    );
  });

  it("ranks weekday performance with Monday-first ordering", () => {
    const analytics = buildDashboardAnalytics(
      [],
      [
        {
          weekday: 5,
          guestsCurrentYear: 30,
          guestsPreviousYear: 20,
          bookingsCurrentYear: 10,
          bookingsPreviousYear: 7
        },
        {
          weekday: 1,
          guestsCurrentYear: 8,
          guestsPreviousYear: 9,
          bookingsCurrentYear: 4,
          bookingsPreviousYear: 5
        },
        {
          weekday: 0,
          guestsCurrentYear: null,
          guestsPreviousYear: null,
          bookingsCurrentYear: null,
          bookingsPreviousYear: null
        }
      ]
    );

    assert.deepEqual(
      analytics.weekdayBuckets.map((bucket) => bucket.label),
      ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    );
    assert.equal(
      analytics.insights.find((insight) => insight.title === "Busiest weekday")?.value,
      "Friday"
    );
    assert.equal(
      analytics.insights.find((insight) => insight.title === "Quietest weekday")?.value,
      "Sunday"
    );
  });
});
