"use server";

import { redirect } from "next/navigation";
import { generateAndSaveWeeklyManagerBriefing } from "@/lib/briefing/briefing-generation";
import { prisma } from "@/lib/db/prisma";
import { DEFAULT_VENUE_LOOKUP } from "@/lib/settings/venue-settings";

export async function generateWeeklyBriefingAction() {
  const venue = await prisma.venue.findFirst({
    where: DEFAULT_VENUE_LOOKUP,
    select: { id: true }
  });

  if (!venue) {
    redirect("/briefing?error=missing-venue");
  }

  let targetUrl = "/briefing?error=generate-failed";

  try {
    const briefing = await generateAndSaveWeeklyManagerBriefing({
      venueId: venue.id
    });

    targetUrl = `/briefing?briefing=${briefing.id}&mode=${briefing.providerMode}`;
  } catch (error) {
    console.error(error);
  }

  redirect(targetUrl);
}
