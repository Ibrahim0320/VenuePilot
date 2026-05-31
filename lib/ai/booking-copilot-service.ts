import {
  type BookingCopilotContext,
  type BookingCopilotInput,
  type BookingCopilotOutput,
  type BookingCopilotProvider
} from "@/lib/ai/booking-copilot-types";
import { createMockBookingCopilotProvider } from "@/lib/ai/mock-booking-copilot";
import { createOpenAIBookingCopilotProvider } from "@/lib/ai/openai-booking-copilot";

export type BookingCopilotAnalysis = BookingCopilotOutput & {
  providerMode: BookingCopilotProvider["mode"];
};

export function getBookingCopilotMode(): BookingCopilotProvider["mode"] {
  return process.env.OPENAI_API_KEY ? "openai" : "mock";
}

export function createBookingCopilotProvider(): BookingCopilotProvider {
  return getBookingCopilotMode() === "openai"
    ? createOpenAIBookingCopilotProvider()
    : createMockBookingCopilotProvider();
}

export async function analyzeBookingInquiry({
  inquiry,
  context
}: {
  inquiry: BookingCopilotInput;
  context: BookingCopilotContext;
}): Promise<BookingCopilotAnalysis> {
  const provider = createBookingCopilotProvider();
  const output = await provider.analyze({ inquiry, context });
  const safeOutput = enforceHumanReviewRules({
    inquiry,
    output,
    context
  });

  return {
    ...safeOutput,
    providerMode: provider.mode
  };
}

export function enforceHumanReviewRules({
  inquiry,
  output,
  context
}: {
  inquiry: BookingCopilotInput;
  output: BookingCopilotOutput;
  context: BookingCopilotContext;
}): BookingCopilotOutput {
  const reasons = new Set(output.humanReviewReasons);
  const normalizedMessage = inquiry.rawMessage.toLowerCase();
  const partySize = output.partySize;

  if (output.revenuePotential === "high") {
    reasons.add("High-value inquiry requires human review.");
  }

  if (output.intent === "complaint") {
    reasons.add("Complaint requires human review.");
  }

  if (!output.requestedDate || !output.requestedTime) {
    reasons.add("Requested date or time is unclear.");
  }

  if (partySize !== null && partySize >= context.largeGroupEscalationThreshold) {
    reasons.add("Large group escalation threshold is reached.");
  } else if (partySize !== null && partySize >= context.groupBookingThreshold) {
    reasons.add("Group booking threshold is reached.");
  }

  if (
    /\b(vip|private|exclusive|privat|abonnera|abonnering)\b/i.test(normalizedMessage)
  ) {
    reasons.add("VIP or private-event language requires human review.");
  }

  const requiresHumanReview = reasons.size > 0 || output.requiresHumanReview;
  const riskLevel =
    output.riskLevel === "high" || reasons.size >= 2
      ? "high"
      : requiresHumanReview
        ? maxLevel(output.riskLevel, "medium")
        : output.riskLevel;
  const suggestedReply = sanitizeSuggestedReply(output.suggestedReply, context);

  return {
    ...output,
    riskLevel,
    requiresHumanReview,
    suggestedReply,
    recommendedActions: normalizeActions({
      actions: output.recommendedActions,
      requiresHumanReview
    }),
    humanReviewReasons: [...reasons]
  };
}

function sanitizeSuggestedReply(
  suggestedReply: string,
  context: BookingCopilotContext
): string {
  const unsafeConfirmationPattern =
    /\b(confirmed|bekräftad|booked in|reserved for you|reservation is set|your booking is confirmed)\b/i;

  if (!unsafeConfirmationPattern.test(suggestedReply)) {
    return suggestedReply;
  }

  return `Hi,\n\nThanks for contacting ${context.venueName}. I can help check availability and prepare your request for our staff to review. Once the team has confirmed availability, they can get back to you with the next step.\n\nBest regards,\n${context.venueName}`;
}

function normalizeActions({
  actions,
  requiresHumanReview
}: {
  actions: string[];
  requiresHumanReview: boolean;
}): string[] {
  const normalizedActions = new Set(actions.filter(Boolean));
  normalizedActions.add(
    "Check live availability before confirming anything to the customer."
  );

  if (requiresHumanReview) {
    normalizedActions.add("Route the draft to the approval queue for staff review.");
  }

  return [...normalizedActions];
}

function maxLevel(left: "low" | "medium" | "high", right: "low" | "medium" | "high") {
  const order = {
    low: 0,
    medium: 1,
    high: 2
  };

  return order[left] >= order[right] ? left : right;
}
