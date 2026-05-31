"use server";

import { redirect } from "next/navigation";
import { analyzeBookingInquiry } from "@/lib/ai/booking-copilot-service";
import type { BookingCopilotContext } from "@/lib/ai/booking-copilot-types";
import { saveBookingCopilotResult } from "@/lib/ai/booking-copilot-persistence";
import { prisma } from "@/lib/db/prisma";
import {
  DEFAULT_VENUE_LOOKUP,
  getVenueSettingsContext
} from "@/lib/settings/venue-settings";

export async function analyzeBookingInquiryAction(formData: FormData) {
  const rawMessage = readString(formData, "rawMessage");

  if (!rawMessage) {
    redirect("/copilot?error=missing-message");
  }

  const venue = await prisma.venue.findFirst({
    where: DEFAULT_VENUE_LOOKUP,
    select: { id: true }
  });

  if (!venue) {
    redirect("/copilot?error=missing-venue");
  }

  const context = await getVenueSettingsContext(venue.id);

  if (!context) {
    redirect("/copilot?error=missing-settings");
  }

  const inquiry = {
    rawMessage,
    customerName: readString(formData, "customerName"),
    customerEmail: readString(formData, "customerEmail"),
    customerPhone: readString(formData, "customerPhone")
  };

  let targetUrl = "/copilot?error=analysis-failed";

  try {
    const output = await analyzeBookingInquiry({
      inquiry,
      context: toBookingCopilotContext(context)
    });
    const savedResult = await saveBookingCopilotResult({
      venueId: venue.id,
      inquiry,
      output
    });

    targetUrl = `/copilot?draft=${savedResult.draftId}&mode=${output.providerMode}`;
  } catch (error) {
    console.error(error);
  }

  redirect(targetUrl);
}

function toBookingCopilotContext(
  context: Awaited<ReturnType<typeof getVenueSettingsContext>>
): BookingCopilotContext {
  if (!context) {
    throw new Error("Venue settings context is required.");
  }

  return {
    venueName: context.venue.name,
    venueCity: context.venue.city,
    openingHours: context.openingHours,
    bookingPolicy: context.bookingPolicy,
    depositPolicy: context.depositPolicy,
    groupBookingThreshold: context.groupBookingThreshold,
    largeGroupEscalationThreshold: context.largeGroupEscalationThreshold,
    availableActivities: context.availableActivities,
    toneOfVoice: context.toneOfVoice,
    humanReviewRules: context.humanReviewRules,
    autoReplyAllowed: context.autoReplyAllowed,
    aiAutonomyLevel: context.aiAutonomyLevel,
    packages: context.packages
  };
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}
