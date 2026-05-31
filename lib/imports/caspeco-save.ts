import { prisma } from "@/lib/db/prisma";
import type { CaspecoImportResult } from "@/lib/imports/caspeco-types";

export async function saveCaspecoImport(result: CaspecoImportResult) {
  const venue = await prisma.venue.findFirst({
    where: { name: "Biljardpalatset Göteborg AB", city: "Göteborg" }
  });

  if (!venue) {
    throw new Error("Default venue was not found. Run npm run db:seed first.");
  }

  if (result.fileType === "daily") {
    await prisma.$transaction(
      result.dailyRows.map((row) =>
        prisma.dailyMetric.upsert({
          where: {
            venueId_date: {
              venueId: venue.id,
              date: dateFromIso(row.date)
            }
          },
          update: {
            guestsCurrentYear: row.guestsCurrentYear,
            guestsPreviousYear: row.guestsPreviousYear,
            guestsDiff: row.guestsDiff,
            bookingsCurrentYear: row.bookingsCurrentYear,
            bookingsPreviousYear: row.bookingsPreviousYear,
            bookingsDiff: row.bookingsDiff,
            source: row.source
          },
          create: {
            venueId: venue.id,
            date: dateFromIso(row.date),
            guestsCurrentYear: row.guestsCurrentYear,
            guestsPreviousYear: row.guestsPreviousYear,
            guestsDiff: row.guestsDiff,
            bookingsCurrentYear: row.bookingsCurrentYear,
            bookingsPreviousYear: row.bookingsPreviousYear,
            bookingsDiff: row.bookingsDiff,
            source: row.source
          }
        })
      )
    );
  } else {
    await prisma.$transaction(
      result.weekdayRows.map((row) =>
        prisma.weekdayMetric.upsert({
          where: {
            venueId_weekday: {
              venueId: venue.id,
              weekday: row.weekday
            }
          },
          update: {
            bookingsCurrentYear: row.bookingsCurrentYear,
            bookingsPreviousYear: row.bookingsPreviousYear,
            bookingsDiff: row.bookingsDiff,
            guestsCurrentYear: row.guestsCurrentYear,
            guestsPreviousYear: row.guestsPreviousYear,
            guestsDiff: row.guestsDiff,
            source: row.source
          },
          create: {
            venueId: venue.id,
            weekday: row.weekday,
            bookingsCurrentYear: row.bookingsCurrentYear,
            bookingsPreviousYear: row.bookingsPreviousYear,
            bookingsDiff: row.bookingsDiff,
            guestsCurrentYear: row.guestsCurrentYear,
            guestsPreviousYear: row.guestsPreviousYear,
            guestsDiff: row.guestsDiff,
            source: row.source
          }
        })
      )
    );
  }

  return {
    ...result.summary,
    rowsImported:
      result.fileType === "daily" ? result.dailyRows.length : result.weekdayRows.length
  };
}

function dateFromIso(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}
