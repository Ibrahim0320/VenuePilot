export const bookingIntentValues = [
  "booking",
  "availability",
  "change",
  "cancellation",
  "complaint",
  "question",
  "unknown"
] as const;

export const activityTypeValues = [
  "billiards",
  "restaurant",
  "both",
  "event",
  "unknown"
] as const;

export const foodInterestValues = ["yes", "no", "maybe", "unknown"] as const;

export const eventTypeValues = [
  "birthday",
  "corporate",
  "bachelor_bachelorette",
  "student",
  "casual",
  "unknown"
] as const;

export const levelValues = ["low", "medium", "high"] as const;

export type BookingIntent = (typeof bookingIntentValues)[number];
export type ActivityType = (typeof activityTypeValues)[number];
export type FoodInterest = (typeof foodInterestValues)[number];
export type EventType = (typeof eventTypeValues)[number];
export type Level = (typeof levelValues)[number];

export type BookingCopilotInput = {
  rawMessage: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
};

export type BookingCopilotOutput = {
  intent: BookingIntent;
  requestedDate: string | null;
  requestedTime: string | null;
  partySize: number | null;
  activityType: ActivityType;
  foodInterest: FoodInterest;
  eventType: EventType;
  urgency: Level;
  revenuePotential: Level;
  riskLevel: Level;
  requiresHumanReview: boolean;
  internalSummary: string;
  suggestedReply: string;
  recommendedActions: string[];
  humanReviewReasons: string[];
};

export type BookingCopilotContext = {
  venueName: string;
  venueCity: string;
  openingHours: string;
  bookingPolicy: string;
  depositPolicy: string;
  groupBookingThreshold: number;
  largeGroupEscalationThreshold: number;
  availableActivities: string[];
  toneOfVoice: string;
  humanReviewRules: string;
  autoReplyAllowed: boolean;
  aiAutonomyLevel: string;
  packages: Array<{
    name: string;
    description: string;
    minGuests: number | null;
    maxGuests: number | null;
    priceDescription: string;
    active: boolean;
  }>;
};

export type BookingCopilotProvider = {
  mode: "mock" | "openai";
  analyze(input: {
    inquiry: BookingCopilotInput;
    context: BookingCopilotContext;
  }): Promise<BookingCopilotOutput>;
};

export const bookingCopilotJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    intent: { type: "string", enum: bookingIntentValues },
    requestedDate: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description: "Requested date as YYYY-MM-DD when clear, otherwise null."
    },
    requestedTime: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description: "Requested time when clear, otherwise null."
    },
    partySize: {
      anyOf: [{ type: "integer" }, { type: "null" }],
      description: "Number of guests when clear, otherwise null."
    },
    activityType: { type: "string", enum: activityTypeValues },
    foodInterest: { type: "string", enum: foodInterestValues },
    eventType: { type: "string", enum: eventTypeValues },
    urgency: { type: "string", enum: levelValues },
    revenuePotential: { type: "string", enum: levelValues },
    riskLevel: { type: "string", enum: levelValues },
    requiresHumanReview: { type: "boolean" },
    internalSummary: { type: "string" },
    suggestedReply: { type: "string" },
    recommendedActions: {
      type: "array",
      items: { type: "string" }
    },
    humanReviewReasons: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: [
    "intent",
    "requestedDate",
    "requestedTime",
    "partySize",
    "activityType",
    "foodInterest",
    "eventType",
    "urgency",
    "revenuePotential",
    "riskLevel",
    "requiresHumanReview",
    "internalSummary",
    "suggestedReply",
    "recommendedActions",
    "humanReviewReasons"
  ]
} as const;

export function validateBookingCopilotOutput(value: unknown): BookingCopilotOutput {
  if (!isRecord(value)) {
    throw new Error("AI output was not a JSON object.");
  }

  return {
    intent: readEnum(value.intent, bookingIntentValues, "unknown"),
    requestedDate: readNullableDate(value.requestedDate),
    requestedTime: readNullableString(value.requestedTime),
    partySize: readNullableInteger(value.partySize),
    activityType: readEnum(value.activityType, activityTypeValues, "unknown"),
    foodInterest: readEnum(value.foodInterest, foodInterestValues, "unknown"),
    eventType: readEnum(value.eventType, eventTypeValues, "unknown"),
    urgency: readEnum(value.urgency, levelValues, "low"),
    revenuePotential: readEnum(value.revenuePotential, levelValues, "low"),
    riskLevel: readEnum(value.riskLevel, levelValues, "low"),
    requiresHumanReview: value.requiresHumanReview === true,
    internalSummary: readRequiredString(value.internalSummary, "internalSummary"),
    suggestedReply: readRequiredString(value.suggestedReply, "suggestedReply"),
    recommendedActions: readStringArray(value.recommendedActions),
    humanReviewReasons: readStringArray(value.humanReviewReasons)
  };
}

function readEnum<T extends readonly string[]>(
  value: unknown,
  options: T,
  fallback: T[number]
): T[number] {
  return typeof value === "string" && options.includes(value) ? value : fallback;
}

function readNullableDate(value: unknown): string | null {
  const stringValue = readNullableString(value);

  if (!stringValue) {
    return null;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(stringValue) ? stringValue : null;
}

function readNullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

function readNullableInteger(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return null;
  }

  return value;
}

function readRequiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`AI output field "${field}" was missing or empty.`);
  }

  return value.trim();
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
