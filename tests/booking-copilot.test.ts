import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { enforceHumanReviewRules } from "@/lib/ai/booking-copilot-service";
import { createMockBookingCopilotProvider } from "@/lib/ai/mock-booking-copilot";
import { validateBookingCopilotOutput } from "@/lib/ai/booking-copilot-types";
import type {
  BookingCopilotContext,
  BookingCopilotOutput
} from "@/lib/ai/booking-copilot-types";

describe("booking copilot", () => {
  it("validates structured output and normalizes optional fields", () => {
    const output = validateBookingCopilotOutput({
      intent: "booking",
      requestedDate: "2026-06-12",
      requestedTime: "19:00",
      partySize: 12,
      activityType: "both",
      foodInterest: "yes",
      eventType: "birthday",
      urgency: "medium",
      revenuePotential: "medium",
      riskLevel: "medium",
      requiresHumanReview: true,
      internalSummary: "Birthday group asking for billiards and food.",
      suggestedReply: "I can help check availability.",
      recommendedActions: ["Check availability"],
      humanReviewReasons: ["Group booking"]
    });

    assert.equal(output.activityType, "both");
    assert.equal(output.partySize, 12);
    assert.equal(output.recommendedActions.length, 1);
  });

  it("forces human review for high-value or unclear inquiries", () => {
    const output = enforceHumanReviewRules({
      inquiry: {
        rawMessage: "We want a private corporate event for 30 people. Can you confirm?"
      },
      output: baseOutput({
        requestedDate: null,
        requestedTime: null,
        partySize: 30,
        revenuePotential: "high",
        suggestedReply: "Your booking is confirmed."
      }),
      context: testContext
    });

    assert.equal(output.requiresHumanReview, true);
    assert.equal(output.riskLevel, "high");
    assert.match(output.suggestedReply, /check availability/i);
    assert.ok(
      output.humanReviewReasons.some((reason) =>
        reason.toLowerCase().includes("high-value")
      )
    );
  });

  it("mock provider extracts practical booking details", async () => {
    const provider = createMockBookingCopilotProvider();
    const output = await provider.analyze({
      inquiry: {
        customerName: "Sara",
        rawMessage:
          "Hej, kan vi boka biljard och mat för 14 personer 2026-06-12 kl 19:00? Det är en födelsedag."
      },
      context: testContext
    });

    assert.equal(output.intent, "booking");
    assert.equal(output.requestedDate, "2026-06-12");
    assert.equal(output.requestedTime, "19:00");
    assert.equal(output.partySize, 14);
    assert.equal(output.activityType, "both");
    assert.equal(output.foodInterest, "yes");
    assert.equal(output.eventType, "birthday");
    assert.equal(output.requiresHumanReview, true);
    assert.match(output.suggestedReply, /check availability/i);
  });
});

const testContext: BookingCopilotContext = {
  venueName: "Biljardpalatset Göteborg AB",
  venueCity: "Göteborg",
  openingHours: "Placeholder hours",
  bookingPolicy: "Staff confirms availability.",
  depositPolicy: "Deposits may apply.",
  groupBookingThreshold: 8,
  largeGroupEscalationThreshold: 20,
  availableActivities: ["billiards", "restaurant", "event"],
  toneOfVoice: "Friendly and clear.",
  humanReviewRules: "Review guest-facing drafts.",
  autoReplyAllowed: false,
  aiAutonomyLevel: "draft_only",
  packages: [
    {
      name: "Food and billiards event",
      description: "Food and billiards package.",
      minGuests: 8,
      maxGuests: 40,
      priceDescription: "Staff confirms pricing.",
      active: true
    }
  ]
};

function baseOutput(
  overrides: Partial<BookingCopilotOutput> = {}
): BookingCopilotOutput {
  return {
    intent: "booking",
    requestedDate: "2026-06-12",
    requestedTime: "19:00",
    partySize: 4,
    activityType: "billiards",
    foodInterest: "unknown",
    eventType: "unknown",
    urgency: "low",
    revenuePotential: "low",
    riskLevel: "low",
    requiresHumanReview: false,
    internalSummary: "Guest asks about billiards.",
    suggestedReply: "I can help check availability.",
    recommendedActions: ["Check availability"],
    humanReviewReasons: [],
    ...overrides
  };
}
