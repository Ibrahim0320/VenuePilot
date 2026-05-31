import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildBriefingSourceSnapshot,
  buildDeterministicManagerBriefing,
  getBriefingWeekWindow
} from "@/lib/briefing/briefing-service";
import {
  type ManagerBriefingContext,
  validateManagerBriefingContent
} from "@/lib/briefing/briefing-types";

describe("manager briefing service", () => {
  it("builds a practical deterministic briefing from forecasts and venue rules", () => {
    const briefing = buildDeterministicManagerBriefing(makeContext());

    assert.match(briefing.executiveSummary, /Biljardpalatset/i);
    assert.match(briefing.expectedDemand, /100 guests/i);
    assert.match(briefing.busiestUpcomingDays[0], /Friday/i);
    assert.match(briefing.busiestUpcomingDays[0], /Protect prime slots/i);
    assert.match(briefing.quietestUpcomingDays[0], /Monday/i);
    assert.ok(briefing.staffingRecommendations.some((item) => /staffing/i.test(item)));
    assert.ok(
      briefing.packageUpsellOpportunities.some((item) =>
        /Dinner \+ billiards/i.test(item)
      )
    );
    assert.ok(briefing.suggestedManagerActions.some((item) => /human/i.test(item)));
  });

  it("creates a source snapshot that exposes only grounded facts", () => {
    const snapshot = buildBriefingSourceSnapshot(makeContext());

    assert.equal(snapshot.forecastTotals.expectedGuests, 100);
    assert.equal(snapshot.forecastTotals.peakDays, 1);
    assert.equal(snapshot.busiestUpcomingDays[0].date, "2026-06-05");
    assert.equal(snapshot.weekdayPerformance[0].weekday, "Friday");
    assert.equal(snapshot.venueRules.aiAutonomyLevel, "draft_only");
  });

  it("validates AI briefing output into the same structure", () => {
    const content = validateManagerBriefingContent({
      executiveSummary: "Friday is the key day.",
      expectedDemand: "Demand is healthy.",
      busiestUpcomingDays: ["Friday"],
      quietestUpcomingDays: ["Monday"],
      staffingRecommendations: ["Staff Friday carefully."],
      promotionRecommendations: ["Use Monday only."],
      packageUpsellOpportunities: ["Offer groups a package."],
      risksOrUnusualPatterns: ["Low confidence Monday."],
      suggestedManagerActions: ["Review before sending guest replies."]
    });

    assert.equal(content.executiveSummary, "Friday is the key day.");
    assert.deepEqual(content.busiestUpcomingDays, ["Friday"]);
  });

  it("uses the next seven days as the weekly briefing window", () => {
    const { weekStartDate, weekEndDate } = getBriefingWeekWindow(
      new Date("2026-05-31T10:00:00.000Z")
    );

    assert.equal(weekStartDate.toISOString(), "2026-06-01T00:00:00.000Z");
    assert.equal(weekEndDate.toISOString(), "2026-06-07T00:00:00.000Z");
  });
});

function makeContext(): ManagerBriefingContext {
  return {
    venue: {
      id: "venue_1",
      name: "Biljardpalatset Göteborg AB",
      city: "Göteborg",
      venueType: "billiards_restaurant"
    },
    weekStartDate: new Date("2026-06-01T00:00:00.000Z"),
    weekEndDate: new Date("2026-06-07T00:00:00.000Z"),
    dailyMetrics: [
      {
        date: new Date("2026-05-29T00:00:00.000Z"),
        guestsCurrentYear: 44,
        guestsPreviousYear: 38,
        bookingsCurrentYear: 14,
        bookingsPreviousYear: 12
      }
    ],
    weekdayMetrics: [
      {
        weekday: 1,
        bookingsCurrentYear: 4,
        bookingsPreviousYear: 5,
        guestsCurrentYear: 10,
        guestsPreviousYear: 12
      },
      {
        weekday: 5,
        bookingsCurrentYear: 18,
        bookingsPreviousYear: 14,
        guestsCurrentYear: 54,
        guestsPreviousYear: 42
      }
    ],
    forecasts: [
      {
        date: new Date("2026-06-01T00:00:00.000Z"),
        expectedGuests: 10,
        expectedBookings: 4,
        confidence: "low",
        demandLevel: "quiet",
        explanation: "Low imported signal.",
        recommendedActions:
          "Treat this as a quiet-day opportunity with manager-approved promotion."
      },
      {
        date: new Date("2026-06-05T00:00:00.000Z"),
        expectedGuests: 70,
        expectedBookings: 24,
        confidence: "medium",
        demandLevel: "peak",
        explanation: "Friday is strong.",
        recommendedActions:
          "Protect prime slots, avoid discounts and review staffing before confirming new requests."
      },
      {
        date: new Date("2026-06-06T00:00:00.000Z"),
        expectedGuests: 20,
        expectedBookings: 8,
        confidence: "medium",
        demandLevel: "normal",
        explanation: "Saturday is normal.",
        recommendedActions: "Monitor booking pace."
      }
    ],
    settings: {
      openingHours: "Opening hours placeholder.",
      bookingPolicy: "Confirm availability before replying.",
      depositPolicy: "Deposits may apply for larger groups.",
      groupBookingThreshold: 8,
      largeGroupEscalationThreshold: 20,
      availableActivities: ["billiards", "restaurant"],
      toneOfVoice: "Friendly and clear.",
      humanReviewRules: "Staff review all guest-facing drafts.",
      autoReplyAllowed: false,
      aiAutonomyLevel: "draft_only"
    },
    packages: [
      {
        name: "Dinner + billiards",
        description: "Food and billiards package.",
        minGuests: 6,
        maxGuests: 20,
        priceDescription: "Per person",
        active: true
      }
    ]
  };
}
