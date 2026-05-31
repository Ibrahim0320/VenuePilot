import type {
  ActivityType,
  BookingCopilotOutput,
  BookingCopilotProvider,
  EventType,
  FoodInterest,
  Level
} from "@/lib/ai/booking-copilot-types";

const swedishMonthMap: Record<string, number> = {
  januari: 0,
  februari: 1,
  mars: 2,
  april: 3,
  maj: 4,
  juni: 5,
  juli: 6,
  augusti: 7,
  september: 8,
  oktober: 9,
  november: 10,
  december: 11
};

export function createMockBookingCopilotProvider(): BookingCopilotProvider {
  return {
    mode: "mock",
    async analyze({ inquiry, context }) {
      const message = inquiry.rawMessage;
      const normalizedMessage = normalize(message);
      const partySize = detectPartySize(normalizedMessage);
      const activityType = detectActivityType(normalizedMessage);
      const foodInterest = detectFoodInterest(normalizedMessage);
      const eventType = detectEventType(normalizedMessage);
      const intent = detectIntent(normalizedMessage);
      const requestedDate = detectDate(message);
      const requestedTime = detectTime(message);
      const urgency = detectUrgency(normalizedMessage);
      const revenuePotential = detectRevenuePotential(
        partySize,
        activityType,
        eventType,
        foodInterest,
        context.groupBookingThreshold
      );
      const riskLevel = detectRiskLevel({
        intent,
        partySize,
        requestedDate,
        requestedTime,
        revenuePotential,
        eventType,
        message: normalizedMessage,
        escalationThreshold: context.largeGroupEscalationThreshold
      });
      const reviewReasons = buildHumanReviewReasons({
        intent,
        partySize,
        requestedDate,
        requestedTime,
        revenuePotential,
        eventType,
        message: normalizedMessage,
        escalationThreshold: context.largeGroupEscalationThreshold,
        groupThreshold: context.groupBookingThreshold
      });
      const requiresHumanReview = reviewReasons.length > 0;
      const packageNames = context.packages
        .filter((venuePackage) => venuePackage.active)
        .map((venuePackage) => venuePackage.name)
        .slice(0, 2);

      return {
        intent,
        requestedDate,
        requestedTime,
        partySize,
        activityType,
        foodInterest,
        eventType,
        urgency,
        revenuePotential,
        riskLevel,
        requiresHumanReview,
        internalSummary: buildInternalSummary({
          inquiryName: inquiry.customerName,
          partySize,
          requestedDate,
          requestedTime,
          activityType,
          foodInterest,
          eventType,
          requiresHumanReview
        }),
        suggestedReply: buildSuggestedReply({
          customerName: inquiry.customerName,
          requestedDate,
          requestedTime,
          partySize,
          activityType,
          foodInterest,
          venueName: context.venueName
        }),
        recommendedActions: buildRecommendedActions({
          partySize,
          requestedDate,
          requestedTime,
          foodInterest,
          eventType,
          requiresHumanReview,
          packageNames
        }),
        humanReviewReasons: reviewReasons
      } satisfies BookingCopilotOutput;
    }
  };
}

function detectIntent(message: string): BookingCopilotOutput["intent"] {
  if (/\b(complain|complaint|angry|bad|besviken|klaga|missnöjd)\b/i.test(message)) {
    return "complaint";
  }

  if (/\b(cancel|avboka|cancellation)\b/i.test(message)) {
    return "cancellation";
  }

  if (/\b(change|move|ändra|flytta|reschedule)\b/i.test(message)) {
    return "change";
  }

  if (/\b(available|availability|ledig|tillgänglig|plats)\b/i.test(message)) {
    return "availability";
  }

  if (/\b(book|boka|reservation|reserve|bord)\b/i.test(message)) {
    return "booking";
  }

  return "question";
}

function detectPartySize(message: string): number | null {
  const explicitMatch =
    message.match(/\b(?:for|för|around|ca|cirka)\s+(\d{1,3})\b/i) ??
    message.match(/\b(\d{1,3})\s*(?:people|persons|guests|gäster|personer|pers)\b/i);

  if (!explicitMatch) {
    return null;
  }

  const parsedValue = Number.parseInt(explicitMatch[1], 10);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function detectActivityType(message: string): ActivityType {
  const hasBilliards = /\b(billiard|biljard|pool)\b/i.test(message);
  const hasRestaurant = /\b(food|dinner|lunch|eat|mat|middag|restaurang)\b/i.test(
    message
  );
  const hasEvent = /\b(event|private|privat|party|fest|corporate|företag)\b/i.test(
    message
  );

  if (hasEvent) {
    return "event";
  }

  if (hasBilliards && hasRestaurant) {
    return "both";
  }

  if (hasBilliards) {
    return "billiards";
  }

  if (hasRestaurant) {
    return "restaurant";
  }

  return "unknown";
}

function detectFoodInterest(message: string): FoodInterest {
  if (/\b(no food|without food|ingen mat|bara biljard)\b/i.test(message)) {
    return "no";
  }

  if (/\b(food|dinner|lunch|eat|mat|middag|buffe|buffé|drink)\b/i.test(message)) {
    return "yes";
  }

  if (/\b(maybe food|kanske mat|possibly eat)\b/i.test(message)) {
    return "maybe";
  }

  return "unknown";
}

function detectEventType(message: string): EventType {
  if (/\b(birthday|födelsedag|kalas)\b/i.test(message)) {
    return "birthday";
  }

  if (/\b(corporate|company|företag|team|kickoff|work|kollegor)\b/i.test(message)) {
    return "corporate";
  }

  if (/\b(bachelor|bachelorette|svensexa|möhippa)\b/i.test(message)) {
    return "bachelor_bachelorette";
  }

  if (/\b(student|students|studentfest)\b/i.test(message)) {
    return "student";
  }

  if (/\b(casual|friends|vänner|kompisar)\b/i.test(message)) {
    return "casual";
  }

  return "unknown";
}

function detectDate(message: string): string | null {
  const isoMatch = message.match(/\b(20\d{2}-\d{2}-\d{2})\b/);

  if (isoMatch) {
    return isoMatch[1];
  }

  const dayMonthMatch = normalize(message).match(
    /\b(\d{1,2})\s+(januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december)\b/
  );

  if (!dayMonthMatch) {
    return null;
  }

  const day = Number.parseInt(dayMonthMatch[1], 10);
  const month = swedishMonthMap[dayMonthMatch[2]];
  const currentYear = new Date().getFullYear();
  const date = new Date(Date.UTC(currentYear, month, day));

  if (date.getUTCMonth() !== month || date.getUTCDate() !== day) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function detectTime(message: string): string | null {
  const timeMatch = message.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/);

  if (timeMatch) {
    return `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
  }

  const hourMatch = message.match(/\b(?:at|kl|klockan)\s*([01]?\d|2[0-3])\b/i);

  if (!hourMatch) {
    return null;
  }

  return `${hourMatch[1].padStart(2, "0")}:00`;
}

function detectUrgency(message: string): Level {
  if (/\b(today|tonight|asap|urgent|idag|ikväll|snarast)\b/i.test(message)) {
    return "high";
  }

  if (/\b(tomorrow|imorgon|this week|denna vecka)\b/i.test(message)) {
    return "medium";
  }

  return "low";
}

function detectRevenuePotential(
  partySize: number | null,
  activityType: ActivityType,
  eventType: EventType,
  foodInterest: FoodInterest,
  groupThreshold: number
): Level {
  if (
    (partySize !== null && partySize >= groupThreshold * 2) ||
    eventType === "corporate" ||
    activityType === "event"
  ) {
    return "high";
  }

  if ((partySize !== null && partySize >= groupThreshold) || foodInterest === "yes") {
    return "medium";
  }

  return "low";
}

function detectRiskLevel({
  intent,
  partySize,
  requestedDate,
  requestedTime,
  revenuePotential,
  eventType,
  message,
  escalationThreshold
}: {
  intent: BookingCopilotOutput["intent"];
  partySize: number | null;
  requestedDate: string | null;
  requestedTime: string | null;
  revenuePotential: Level;
  eventType: EventType;
  message: string;
  escalationThreshold: number;
}): Level {
  if (
    intent === "complaint" ||
    (partySize !== null && partySize >= escalationThreshold) ||
    /vip|private|exclusive|privat/i.test(message)
  ) {
    return "high";
  }

  if (
    !requestedDate ||
    !requestedTime ||
    revenuePotential === "high" ||
    eventType === "corporate"
  ) {
    return "medium";
  }

  return "low";
}

function buildHumanReviewReasons({
  intent,
  partySize,
  requestedDate,
  requestedTime,
  revenuePotential,
  eventType,
  message,
  escalationThreshold,
  groupThreshold
}: {
  intent: BookingCopilotOutput["intent"];
  partySize: number | null;
  requestedDate: string | null;
  requestedTime: string | null;
  revenuePotential: Level;
  eventType: EventType;
  message: string;
  escalationThreshold: number;
  groupThreshold: number;
}): string[] {
  const reasons: string[] = [];

  if (intent === "complaint") {
    reasons.push("Complaint or negative guest sentiment requires staff handling.");
  }

  if (!requestedDate || !requestedTime) {
    reasons.push("Requested date or time is unclear.");
  }

  if (partySize !== null && partySize >= groupThreshold) {
    reasons.push("Group size meets or exceeds the group booking threshold.");
  }

  if (partySize !== null && partySize >= escalationThreshold) {
    reasons.push("Large group escalation threshold is reached.");
  }

  if (revenuePotential === "high") {
    reasons.push("High-value inquiry should be reviewed before replying.");
  }

  if (eventType === "corporate" || /vip|private|exclusive|privat/i.test(message)) {
    reasons.push("VIP, corporate or private-event language needs human review.");
  }

  return reasons;
}

function buildInternalSummary({
  inquiryName,
  partySize,
  requestedDate,
  requestedTime,
  activityType,
  foodInterest,
  eventType,
  requiresHumanReview
}: {
  inquiryName?: string;
  partySize: number | null;
  requestedDate: string | null;
  requestedTime: string | null;
  activityType: ActivityType;
  foodInterest: FoodInterest;
  eventType: EventType;
  requiresHumanReview: boolean;
}): string {
  const guest = inquiryName || "Guest";

  return `${guest} is asking about ${activityType} for ${
    partySize ?? "an unknown number of"
  } guests${requestedDate ? ` on ${requestedDate}` : ""}${
    requestedTime ? ` at ${requestedTime}` : ""
  }. Food interest is ${foodInterest}; event type is ${eventType}. ${
    requiresHumanReview
      ? "Staff review is required before a guest-facing reply is used."
      : "Draft still remains available for staff approval."
  }`;
}

function buildSuggestedReply({
  customerName,
  requestedDate,
  requestedTime,
  partySize,
  activityType,
  foodInterest,
  venueName
}: {
  customerName?: string;
  requestedDate: string | null;
  requestedTime: string | null;
  partySize: number | null;
  activityType: ActivityType;
  foodInterest: FoodInterest;
  venueName: string;
}): string {
  const greeting = customerName ? `Hi ${customerName},` : "Hi,";
  const activityText =
    activityType === "unknown" ? "your request" : `your ${activityType} request`;
  const timingText =
    requestedDate && requestedTime
      ? ` for ${requestedDate} at ${requestedTime}`
      : " for your preferred date and time";
  const groupText = partySize ? ` for ${partySize} guests` : "";
  const foodText =
    foodInterest === "yes"
      ? " I can also include food and drink options in the request."
      : "";

  return `${greeting}\n\nThanks for contacting ${venueName}. I can help check availability for ${activityText}${timingText}${groupText} and prepare the details for our team to review.${foodText}\n\nCould you please confirm any flexibility on time and whether you have special requests? Once our staff has checked availability, we can get back to you with the next step.\n\nBest regards,\n${venueName}`;
}

function buildRecommendedActions({
  partySize,
  requestedDate,
  requestedTime,
  foodInterest,
  eventType,
  requiresHumanReview,
  packageNames
}: {
  partySize: number | null;
  requestedDate: string | null;
  requestedTime: string | null;
  foodInterest: FoodInterest;
  eventType: EventType;
  requiresHumanReview: boolean;
  packageNames: string[];
}): string[] {
  const actions = [
    "Check live availability before confirming anything to the customer.",
    "Keep the reply as a draft for staff review."
  ];

  if (!requestedDate || !requestedTime) {
    actions.push("Ask the customer to confirm the date and time.");
  }

  if (partySize !== null && partySize >= 8) {
    actions.push("Review group booking rules and deposit policy.");
  }

  if (foodInterest === "yes") {
    actions.push("Offer suitable food and drink package options.");
  }

  if (eventType !== "unknown") {
    actions.push("Capture event details and check whether a package applies.");
  }

  if (packageNames.length > 0) {
    actions.push(`Consider package fit: ${packageNames.join(", ")}.`);
  }

  if (requiresHumanReview) {
    actions.push("Route this draft to the approval queue before using it.");
  }

  return actions;
}

function normalize(value: string): string {
  return value.toLowerCase();
}
