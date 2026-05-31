import { prisma } from "@/lib/db/prisma";

export const DEFAULT_VENUE_LOOKUP = {
  name: "Biljardpalatset Göteborg AB",
  city: "Göteborg"
};

export const ACTIVITY_OPTIONS = [
  { value: "billiards", label: "Billiards" },
  { value: "restaurant", label: "Restaurant" },
  { value: "event", label: "Event" },
  { value: "private_booking", label: "Private booking" }
] as const;

export const AI_AUTONOMY_OPTIONS = [
  {
    value: "internal_only",
    label: "Internal only",
    description: "AI may summarize and analyze, but does not draft guest replies."
  },
  {
    value: "draft_only",
    label: "Draft only",
    description: "AI may prepare editable replies for staff approval."
  },
  {
    value: "low_risk_auto",
    label: "Low-risk auto",
    description:
      "Reserved for low-risk future workflows. MVP still keeps staff in the loop."
  },
  {
    value: "full_auto_disabled_for_now",
    label: "Full auto disabled for now",
    description: "Full automation is intentionally unavailable in the MVP."
  }
] as const;

export type ActivityValue = (typeof ACTIVITY_OPTIONS)[number]["value"];
export type AIAutonomyLevel = (typeof AI_AUTONOMY_OPTIONS)[number]["value"];

export type VenueRuleInput = {
  key: string;
  value: string;
  category: string;
};

export type VenueSettings = {
  openingHours: string;
  bookingPolicy: string;
  depositPolicy: string;
  groupBookingThreshold: number;
  largeGroupEscalationThreshold: number;
  availableActivities: ActivityValue[];
  toneOfVoice: string;
  humanReviewRules: string;
  autoReplyAllowed: boolean;
  aiAutonomyLevel: AIAutonomyLevel;
};

export type VenueSettingsContext = VenueSettings & {
  venue: {
    id: string;
    name: string;
    city: string;
    venueType: string;
  };
  packages: Array<{
    name: string;
    description: string;
    minGuests: number | null;
    maxGuests: number | null;
    priceDescription: string;
    active: boolean;
  }>;
  humanInLoopSummary: string;
};

export const DEFAULT_VENUE_RULES = [
  {
    key: "opening_hours",
    value:
      "Opening hours placeholder: confirm weekday, weekend and holiday hours with venue staff before live use.",
    category: "opening_hours"
  },
  {
    key: "booking_policy",
    value:
      "Bookings should be prepared as staff-reviewable summaries. Confirm availability, table allocation and special requests before replying to guests.",
    category: "booking_rules"
  },
  {
    key: "deposit_policy",
    value:
      "Deposit policy placeholder: larger groups and private events may require a deposit, but staff must confirm the amount and terms.",
    category: "payments"
  },
  {
    key: "group_booking_threshold",
    value: "8",
    category: "booking_rules"
  },
  {
    key: "large_group_escalation_threshold",
    value: "20",
    category: "human_review"
  },
  {
    key: "available_activities",
    value: JSON.stringify(["billiards", "restaurant", "event", "private_booking"]),
    category: "activities"
  },
  {
    key: "tone_of_voice",
    value:
      "Friendly, clear and professional. Be helpful without overpromising. Never imply that AI has confirmed a booking without staff approval.",
    category: "ai_tone"
  },
  {
    key: "human_review_rules",
    value:
      "Staff must review all guest-facing drafts, large group requests, deposit questions, unusual opening-hour requests and booking changes before anything is sent.",
    category: "human_review"
  },
  {
    key: "auto_reply_allowed",
    value: "false",
    category: "ai_safety"
  },
  {
    key: "ai_autonomy_level",
    value: "draft_only",
    category: "ai_safety"
  }
] satisfies VenueRuleInput[];

const defaultRuleMap = new Map(DEFAULT_VENUE_RULES.map((rule) => [rule.key, rule]));

export function buildVenueSettingsFromRules(
  rules: Array<{ key: string; value: string }>
): VenueSettings {
  const ruleValues = new Map(rules.map((rule) => [rule.key, rule.value]));

  return {
    openingHours: getRuleValue(ruleValues, "opening_hours"),
    bookingPolicy: getRuleValue(ruleValues, "booking_policy"),
    depositPolicy: getRuleValue(ruleValues, "deposit_policy"),
    groupBookingThreshold: parsePositiveInteger(
      getRuleValue(ruleValues, "group_booking_threshold"),
      8
    ),
    largeGroupEscalationThreshold: parsePositiveInteger(
      getRuleValue(ruleValues, "large_group_escalation_threshold"),
      20
    ),
    availableActivities: parseActivities(
      getRuleValue(ruleValues, "available_activities")
    ),
    toneOfVoice: getRuleValue(ruleValues, "tone_of_voice"),
    humanReviewRules: getRuleValue(ruleValues, "human_review_rules"),
    autoReplyAllowed: getRuleValue(ruleValues, "auto_reply_allowed") === "true",
    aiAutonomyLevel: parseAutonomyLevel(getRuleValue(ruleValues, "ai_autonomy_level"))
  };
}

export function createRuleInputsFromSettings(
  settings: VenueSettings
): VenueRuleInput[] {
  return [
    ruleInput("opening_hours", settings.openingHours),
    ruleInput("booking_policy", settings.bookingPolicy),
    ruleInput("deposit_policy", settings.depositPolicy),
    ruleInput("group_booking_threshold", String(settings.groupBookingThreshold)),
    ruleInput(
      "large_group_escalation_threshold",
      String(settings.largeGroupEscalationThreshold)
    ),
    ruleInput("available_activities", JSON.stringify(settings.availableActivities)),
    ruleInput("tone_of_voice", settings.toneOfVoice),
    ruleInput("human_review_rules", settings.humanReviewRules),
    ruleInput("auto_reply_allowed", String(settings.autoReplyAllowed)),
    ruleInput("ai_autonomy_level", settings.aiAutonomyLevel)
  ];
}

export async function getVenueSettingsContext(
  venueId: string
): Promise<VenueSettingsContext | null> {
  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: {
      id: true,
      name: true,
      city: true,
      venueType: true,
      venueRules: {
        select: {
          key: true,
          value: true
        }
      },
      packages: {
        orderBy: [{ active: "desc" }, { name: "asc" }],
        select: {
          name: true,
          description: true,
          minGuests: true,
          maxGuests: true,
          priceDescription: true,
          active: true
        }
      }
    }
  });

  if (!venue) {
    return null;
  }

  return {
    venue: {
      id: venue.id,
      name: venue.name,
      city: venue.city,
      venueType: venue.venueType
    },
    ...buildVenueSettingsFromRules(venue.venueRules),
    packages: venue.packages,
    humanInLoopSummary:
      "VenuePilot assists staff by preparing summaries and drafts. Human review remains required before guest-facing booking decisions or replies."
  };
}

export function parseAutonomyLevel(value: string): AIAutonomyLevel {
  return AI_AUTONOMY_OPTIONS.some((option) => option.value === value)
    ? (value as AIAutonomyLevel)
    : "draft_only";
}

export function parseActivities(value: string): ActivityValue[] {
  try {
    const parsedValue = JSON.parse(value);

    if (Array.isArray(parsedValue)) {
      return parsedValue.filter(isActivityValue);
    }
  } catch {
    return value
      .split(",")
      .map((activity) => activity.trim())
      .filter(isActivityValue);
  }

  return [];
}

function ruleInput(key: string, value: string): VenueRuleInput {
  return {
    key,
    value,
    category: defaultRuleMap.get(key)?.category ?? "general"
  };
}

function getRuleValue(ruleValues: Map<string, string>, key: string): string {
  return ruleValues.get(key) ?? defaultRuleMap.get(key)?.value ?? "";
}

function parsePositiveInteger(value: string, fallback: number): number {
  const parsedValue = Number.parseInt(value, 10);

  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : fallback;
}

function isActivityValue(value: unknown): value is ActivityValue {
  return (
    typeof value === "string" &&
    ACTIVITY_OPTIONS.some((option) => option.value === value)
  );
}
