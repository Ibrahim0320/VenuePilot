export const briefingProviderModes = ["deterministic", "openai"] as const;

export type BriefingProviderMode = (typeof briefingProviderModes)[number];

export type ManagerBriefingContent = {
  executiveSummary: string;
  expectedDemand: string;
  busiestUpcomingDays: string[];
  quietestUpcomingDays: string[];
  staffingRecommendations: string[];
  promotionRecommendations: string[];
  packageUpsellOpportunities: string[];
  risksOrUnusualPatterns: string[];
  suggestedManagerActions: string[];
};

export type SavedManagerBriefing = ManagerBriefingContent & {
  id: string;
  providerMode: BriefingProviderMode;
  weekStartDate: Date;
  weekEndDate: Date;
  sourceSnapshot: BriefingSourceSnapshot;
  createdAt: Date;
};

export type BriefingForecast = {
  date: Date;
  expectedGuests: number;
  expectedBookings: number;
  confidence: "low" | "medium" | "high";
  demandLevel: "quiet" | "normal" | "busy" | "peak";
  explanation: string;
  recommendedActions: string;
};

export type BriefingDailyMetric = {
  date: Date;
  guestsCurrentYear: number;
  guestsPreviousYear: number;
  bookingsCurrentYear: number;
  bookingsPreviousYear: number;
};

export type BriefingWeekdayMetric = {
  weekday: number;
  bookingsCurrentYear: number;
  bookingsPreviousYear: number;
  guestsCurrentYear: number;
  guestsPreviousYear: number;
};

export type BriefingPackage = {
  name: string;
  description: string;
  minGuests: number | null;
  maxGuests: number | null;
  priceDescription: string;
  active: boolean;
};

export type BriefingVenueSettings = {
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
};

export type ManagerBriefingContext = {
  venue: {
    id: string;
    name: string;
    city: string;
    venueType: string;
  };
  weekStartDate: Date;
  weekEndDate: Date;
  dailyMetrics: BriefingDailyMetric[];
  weekdayMetrics: BriefingWeekdayMetric[];
  forecasts: BriefingForecast[];
  settings: BriefingVenueSettings;
  packages: BriefingPackage[];
};

export type BriefingSourceSnapshot = {
  venue: {
    name: string;
    city: string;
    venueType: string;
  };
  period: {
    startDate: string;
    endDate: string;
  };
  dataCounts: {
    dailyMetricRows: number;
    weekdayMetricRows: number;
    forecastRows: number;
    activePackages: number;
  };
  forecastTotals: {
    expectedGuests: number;
    expectedBookings: number;
    quietDays: number;
    normalDays: number;
    busyDays: number;
    peakDays: number;
  };
  busiestUpcomingDays: Array<{
    date: string;
    expectedGuests: number;
    expectedBookings: number;
    demandLevel: BriefingForecast["demandLevel"];
    confidence: BriefingForecast["confidence"];
  }>;
  quietestUpcomingDays: Array<{
    date: string;
    expectedGuests: number;
    expectedBookings: number;
    demandLevel: BriefingForecast["demandLevel"];
    confidence: BriefingForecast["confidence"];
  }>;
  weekdayPerformance: Array<{
    weekday: string;
    guestsCurrentYear: number;
    guestsPreviousYear: number;
    bookingsCurrentYear: number;
    bookingsPreviousYear: number;
  }>;
  venueRules: {
    openingHours: string;
    bookingPolicy: string;
    depositPolicy: string;
    groupBookingThreshold: number;
    largeGroupEscalationThreshold: number;
    humanReviewRules: string;
    autoReplyAllowed: boolean;
    aiAutonomyLevel: string;
  };
  packages: Array<{
    name: string;
    description: string;
    minGuests: number | null;
    maxGuests: number | null;
    priceDescription: string;
  }>;
};

export const managerBriefingJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    executiveSummary: { type: "string" },
    expectedDemand: { type: "string" },
    busiestUpcomingDays: {
      type: "array",
      items: { type: "string" }
    },
    quietestUpcomingDays: {
      type: "array",
      items: { type: "string" }
    },
    staffingRecommendations: {
      type: "array",
      items: { type: "string" }
    },
    promotionRecommendations: {
      type: "array",
      items: { type: "string" }
    },
    packageUpsellOpportunities: {
      type: "array",
      items: { type: "string" }
    },
    risksOrUnusualPatterns: {
      type: "array",
      items: { type: "string" }
    },
    suggestedManagerActions: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: [
    "executiveSummary",
    "expectedDemand",
    "busiestUpcomingDays",
    "quietestUpcomingDays",
    "staffingRecommendations",
    "promotionRecommendations",
    "packageUpsellOpportunities",
    "risksOrUnusualPatterns",
    "suggestedManagerActions"
  ]
} as const;

export function validateManagerBriefingContent(value: unknown): ManagerBriefingContent {
  if (!isRecord(value)) {
    throw new Error("Briefing output was not a JSON object.");
  }

  return {
    executiveSummary: readRequiredString(value.executiveSummary, "executiveSummary"),
    expectedDemand: readRequiredString(value.expectedDemand, "expectedDemand"),
    busiestUpcomingDays: readStringArray(value.busiestUpcomingDays),
    quietestUpcomingDays: readStringArray(value.quietestUpcomingDays),
    staffingRecommendations: readStringArray(value.staffingRecommendations),
    promotionRecommendations: readStringArray(value.promotionRecommendations),
    packageUpsellOpportunities: readStringArray(value.packageUpsellOpportunities),
    risksOrUnusualPatterns: readStringArray(value.risksOrUnusualPatterns),
    suggestedManagerActions: readStringArray(value.suggestedManagerActions)
  };
}

export function parseManagerBriefingProviderMode(value: string): BriefingProviderMode {
  return briefingProviderModes.includes(value as BriefingProviderMode)
    ? (value as BriefingProviderMode)
    : "deterministic";
}

function readRequiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Briefing output field "${field}" was missing or empty.`);
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
