import { prisma } from "@/lib/db/prisma";
import {
  buildBriefingSourceSnapshot,
  buildDeterministicManagerBriefing,
  getBriefingWeekWindow
} from "@/lib/briefing/briefing-service";
import type {
  BriefingProviderMode,
  ManagerBriefingContext,
  SavedManagerBriefing
} from "@/lib/briefing/briefing-types";
import { generateOpenAIManagerBriefing } from "@/lib/briefing/openai-manager-briefing";
import { saveManagerBriefing } from "@/lib/briefing/briefing-persistence";
import { generateDemandForecasts } from "@/lib/forecast/forecast-service";
import { saveVenueForecasts } from "@/lib/forecast/forecast-persistence";
import { getVenueSettingsContext } from "@/lib/settings/venue-settings";
import { getAIMode } from "@/lib/env";

export async function generateAndSaveWeeklyManagerBriefing({
  venueId,
  now = new Date()
}: {
  venueId: string;
  now?: Date;
}): Promise<SavedManagerBriefing> {
  const context = await loadManagerBriefingContext({ venueId, now });
  const deterministicBriefing = buildDeterministicManagerBriefing(context);
  const sourceSnapshot = buildBriefingSourceSnapshot(context);
  let providerMode: BriefingProviderMode = "deterministic";
  let content = deterministicBriefing;

  if (getAIMode() === "openai") {
    try {
      content = await generateOpenAIManagerBriefing({
        deterministicBriefing,
        sourceSnapshot
      });
      providerMode = "openai";
    } catch (error) {
      console.error(error);
      content = {
        ...deterministicBriefing,
        risksOrUnusualPatterns: [
          ...deterministicBriefing.risksOrUnusualPatterns,
          "AI enhancement was unavailable, so VenuePilot saved the deterministic briefing generated from local metrics and forecast rows."
        ]
      };
    }
  }

  return saveManagerBriefing({
    venueId,
    weekStartDate: context.weekStartDate,
    weekEndDate: context.weekEndDate,
    providerMode,
    content,
    sourceSnapshot
  });
}

export async function loadManagerBriefingContext({
  venueId,
  now = new Date()
}: {
  venueId: string;
  now?: Date;
}): Promise<ManagerBriefingContext> {
  const settingsContext = await getVenueSettingsContext(venueId);

  if (!settingsContext) {
    throw new Error("Venue settings context is required to generate a briefing.");
  }

  const { weekStartDate, weekEndDate } = getBriefingWeekWindow(now);
  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: {
      id: true,
      name: true,
      city: true,
      venueType: true,
      dailyMetrics: {
        orderBy: { date: "asc" },
        select: {
          date: true,
          guestsCurrentYear: true,
          guestsPreviousYear: true,
          bookingsCurrentYear: true,
          bookingsPreviousYear: true
        }
      },
      weekdayMetrics: {
        orderBy: { weekday: "asc" },
        select: {
          weekday: true,
          bookingsCurrentYear: true,
          bookingsPreviousYear: true,
          guestsCurrentYear: true,
          guestsPreviousYear: true
        }
      }
    }
  });

  if (!venue) {
    throw new Error("Venue was not found.");
  }

  const generatedForecasts = generateDemandForecasts({
    dailyMetrics: venue.dailyMetrics,
    startDate: weekStartDate,
    horizonDays: 7
  });

  await saveVenueForecasts({
    venueId,
    forecasts: generatedForecasts
  });

  const forecasts = await prisma.forecast.findMany({
    where: {
      venueId,
      date: {
        gte: weekStartDate,
        lte: weekEndDate
      }
    },
    orderBy: { date: "asc" },
    select: {
      date: true,
      expectedGuests: true,
      expectedBookings: true,
      confidence: true,
      demandLevel: true,
      explanation: true,
      recommendedActions: true
    }
  });

  return {
    venue: {
      id: venue.id,
      name: venue.name,
      city: venue.city,
      venueType: venue.venueType
    },
    weekStartDate,
    weekEndDate,
    dailyMetrics: venue.dailyMetrics,
    weekdayMetrics: venue.weekdayMetrics,
    forecasts: forecasts.map((forecast) => ({
      date: forecast.date,
      expectedGuests: forecast.expectedGuests,
      expectedBookings: forecast.expectedBookings,
      confidence: parseConfidence(forecast.confidence),
      demandLevel: parseDemandLevel(forecast.demandLevel),
      explanation: forecast.explanation,
      recommendedActions: forecast.recommendedActions
    })),
    settings: {
      openingHours: settingsContext.openingHours,
      bookingPolicy: settingsContext.bookingPolicy,
      depositPolicy: settingsContext.depositPolicy,
      groupBookingThreshold: settingsContext.groupBookingThreshold,
      largeGroupEscalationThreshold: settingsContext.largeGroupEscalationThreshold,
      availableActivities: settingsContext.availableActivities,
      toneOfVoice: settingsContext.toneOfVoice,
      humanReviewRules: settingsContext.humanReviewRules,
      autoReplyAllowed: settingsContext.autoReplyAllowed,
      aiAutonomyLevel: settingsContext.aiAutonomyLevel
    },
    packages: settingsContext.packages
  };
}

function parseConfidence(value: string): "low" | "medium" | "high" {
  if (value === "medium" || value === "high") {
    return value;
  }

  return "low";
}

function parseDemandLevel(value: string): "quiet" | "normal" | "busy" | "peak" {
  if (value === "normal" || value === "busy" || value === "peak") {
    return value;
  }

  return "quiet";
}
