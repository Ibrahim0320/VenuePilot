import { prisma } from "@/lib/db/prisma";
import type { DemandForecast } from "@/lib/forecast/forecast-service";

export async function saveVenueForecasts({
  venueId,
  forecasts
}: {
  venueId: string;
  forecasts: DemandForecast[];
}) {
  if (forecasts.length === 0) {
    return [];
  }

  return prisma.$transaction(
    forecasts.map((forecast) =>
      prisma.forecast.upsert({
        where: {
          venueId_date: {
            venueId,
            date: forecast.date
          }
        },
        create: {
          venueId,
          date: forecast.date,
          expectedGuests: forecast.expectedGuests,
          expectedBookings: forecast.expectedBookings,
          confidence: forecast.confidence,
          demandLevel: forecast.demandLevel,
          explanation: forecast.explanation,
          recommendedActions: forecast.recommendedActions
        },
        update: {
          expectedGuests: forecast.expectedGuests,
          expectedBookings: forecast.expectedBookings,
          confidence: forecast.confidence,
          demandLevel: forecast.demandLevel,
          explanation: forecast.explanation,
          recommendedActions: forecast.recommendedActions
        }
      })
    )
  );
}
