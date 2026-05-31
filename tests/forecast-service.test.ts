import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateDemandForecasts,
  normaliseForecastHorizon
} from "@/lib/forecast/forecast-service";

describe("forecast service", () => {
  it("returns low-confidence fallback forecasts when no daily data exists", () => {
    const forecasts = generateDemandForecasts({
      dailyMetrics: [],
      startDate: new Date("2026-06-01T00:00:00.000Z"),
      horizonDays: 7
    });

    assert.equal(forecasts.length, 7);
    assert.equal(forecasts[0].expectedGuests, 0);
    assert.equal(forecasts[0].expectedBookings, 0);
    assert.equal(forecasts[0].confidence, "low");
    assert.equal(forecasts[0].demandLevel, "quiet");
    assert.match(forecasts[0].explanation, /missing-data fallback/i);
  });

  it("combines weekday, recent, monthly, previous-year and venue averages", () => {
    const forecasts = generateDemandForecasts({
      dailyMetrics: [
        metric("2026-05-04", 18, 15, 6, 5),
        metric("2026-05-11", 20, 16, 7, 5),
        metric("2026-05-18", 22, 17, 8, 6),
        metric("2026-05-25", 24, 18, 9, 7),
        metric("2026-06-01", 30, 28, 10, 9),
        metric("2026-06-02", 12, 11, 5, 4),
        metric("2026-06-03", 14, 12, 6, 5),
        metric("2026-06-04", 16, 14, 6, 5),
        metric("2026-06-05", 18, 15, 7, 5),
        metric("2026-06-06", 20, 16, 8, 6)
      ],
      startDate: new Date("2026-06-01T00:00:00.000Z"),
      horizonDays: 7
    });

    assert.equal(forecasts.length, 7);
    assert.ok(forecasts[0].expectedGuests > 0);
    assert.ok(forecasts[0].expectedBookings > 0);
    assert.equal(forecasts[0].confidence, "medium");
    assert.match(forecasts[0].explanation, /same-weekday historical average/i);
    assert.match(forecasts[0].explanation, /monthly seasonal average/i);
    assert.match(forecasts[0].explanation, /previous-year same-date result/i);
    assert.match(forecasts[7 - 1].recommendedActions, /discounting|staffing|slots/i);
  });

  it("marks unusually high demand as peak with peak-day actions", () => {
    const dailyMetrics = Array.from({ length: 28 }, (_, index) =>
      metric(`2026-05-${String(index + 1).padStart(2, "0")}`, 10, 9, 4, 4)
    );
    dailyMetrics.push(metric("2026-06-01", 80, 70, 24, 20));

    const [forecast] = generateDemandForecasts({
      dailyMetrics,
      startDate: new Date("2026-06-01T00:00:00.000Z"),
      horizonDays: 7
    });

    assert.equal(forecast.demandLevel, "peak");
    assert.match(forecast.recommendedActions, /Protect prime slots/i);
    assert.match(forecast.recommendedActions, /deposits/i);
  });

  it("normalises invalid horizons to 7 days", () => {
    assert.equal(normaliseForecastHorizon("14"), 14);
    assert.equal(normaliseForecastHorizon("not-a-range"), 7);
    assert.equal(normaliseForecastHorizon(undefined), 7);
  });
});

function metric(
  date: string,
  guestsCurrentYear: number,
  guestsPreviousYear: number,
  bookingsCurrentYear: number,
  bookingsPreviousYear: number
) {
  return {
    date: new Date(`${date}T00:00:00.000Z`),
    guestsCurrentYear,
    guestsPreviousYear,
    bookingsCurrentYear,
    bookingsPreviousYear
  };
}
