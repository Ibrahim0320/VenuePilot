import { prisma } from "@/lib/db/prisma";
import {
  type BriefingProviderMode,
  type BriefingSourceSnapshot,
  type ManagerBriefingContent,
  type SavedManagerBriefing,
  parseManagerBriefingProviderMode
} from "@/lib/briefing/briefing-types";

type ManagerBriefingRecord = {
  id: string;
  providerMode: string;
  weekStartDate: Date;
  weekEndDate: Date;
  executiveSummary: string;
  expectedDemand: string;
  busiestUpcomingDays: string;
  quietestUpcomingDays: string;
  staffingRecommendations: string;
  promotionRecommendations: string;
  packageUpsellOpportunities: string;
  risksOrUnusualPatterns: string;
  suggestedManagerActions: string;
  sourceSnapshot: string;
  createdAt: Date;
};

export async function saveManagerBriefing({
  venueId,
  weekStartDate,
  weekEndDate,
  providerMode,
  content,
  sourceSnapshot
}: {
  venueId: string;
  weekStartDate: Date;
  weekEndDate: Date;
  providerMode: BriefingProviderMode;
  content: ManagerBriefingContent;
  sourceSnapshot: BriefingSourceSnapshot;
}): Promise<SavedManagerBriefing> {
  const briefing = await prisma.managerBriefing.create({
    data: {
      venueId,
      weekStartDate,
      weekEndDate,
      providerMode,
      executiveSummary: content.executiveSummary,
      expectedDemand: content.expectedDemand,
      busiestUpcomingDays: JSON.stringify(content.busiestUpcomingDays),
      quietestUpcomingDays: JSON.stringify(content.quietestUpcomingDays),
      staffingRecommendations: JSON.stringify(content.staffingRecommendations),
      promotionRecommendations: JSON.stringify(content.promotionRecommendations),
      packageUpsellOpportunities: JSON.stringify(content.packageUpsellOpportunities),
      risksOrUnusualPatterns: JSON.stringify(content.risksOrUnusualPatterns),
      suggestedManagerActions: JSON.stringify(content.suggestedManagerActions),
      sourceSnapshot: JSON.stringify(sourceSnapshot)
    }
  });

  return parseSavedManagerBriefing(briefing);
}

export function parseSavedManagerBriefing(
  briefing: ManagerBriefingRecord
): SavedManagerBriefing {
  return {
    id: briefing.id,
    providerMode: parseManagerBriefingProviderMode(briefing.providerMode),
    weekStartDate: briefing.weekStartDate,
    weekEndDate: briefing.weekEndDate,
    executiveSummary: briefing.executiveSummary,
    expectedDemand: briefing.expectedDemand,
    busiestUpcomingDays: parseStringArray(briefing.busiestUpcomingDays),
    quietestUpcomingDays: parseStringArray(briefing.quietestUpcomingDays),
    staffingRecommendations: parseStringArray(briefing.staffingRecommendations),
    promotionRecommendations: parseStringArray(briefing.promotionRecommendations),
    packageUpsellOpportunities: parseStringArray(briefing.packageUpsellOpportunities),
    risksOrUnusualPatterns: parseStringArray(briefing.risksOrUnusualPatterns),
    suggestedManagerActions: parseStringArray(briefing.suggestedManagerActions),
    sourceSnapshot: parseSourceSnapshot(briefing.sourceSnapshot),
    createdAt: briefing.createdAt
  };
}

function parseStringArray(value: string): string[] {
  try {
    const parsedValue = JSON.parse(value);

    if (Array.isArray(parsedValue)) {
      return parsedValue.filter((item): item is string => typeof item === "string");
    }
  } catch {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function parseSourceSnapshot(value: string): BriefingSourceSnapshot {
  try {
    return JSON.parse(value) as BriefingSourceSnapshot;
  } catch {
    return {
      venue: {
        name: "Unknown venue",
        city: "Unknown",
        venueType: "unknown"
      },
      period: {
        startDate: "",
        endDate: ""
      },
      dataCounts: {
        dailyMetricRows: 0,
        weekdayMetricRows: 0,
        forecastRows: 0,
        activePackages: 0
      },
      forecastTotals: {
        expectedGuests: 0,
        expectedBookings: 0,
        quietDays: 0,
        normalDays: 0,
        busyDays: 0,
        peakDays: 0
      },
      busiestUpcomingDays: [],
      quietestUpcomingDays: [],
      weekdayPerformance: [],
      venueRules: {
        openingHours: "",
        bookingPolicy: "",
        depositPolicy: "",
        groupBookingThreshold: 0,
        largeGroupEscalationThreshold: 0,
        humanReviewRules: "",
        autoReplyAllowed: false,
        aiAutonomyLevel: "draft_only"
      },
      packages: []
    };
  }
}
