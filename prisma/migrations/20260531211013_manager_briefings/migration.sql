-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Forecast" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venueId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "expectedGuests" INTEGER NOT NULL,
    "expectedBookings" INTEGER NOT NULL,
    "confidence" TEXT NOT NULL,
    "demandLevel" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "recommendedActions" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Forecast_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Forecast" ("confidence", "createdAt", "date", "demandLevel", "expectedBookings", "expectedGuests", "explanation", "id", "recommendedActions", "venueId") SELECT "confidence", "createdAt", "date", "demandLevel", "expectedBookings", "expectedGuests", "explanation", "id", "recommendedActions", "venueId" FROM "Forecast";
DROP TABLE "Forecast";
ALTER TABLE "new_Forecast" RENAME TO "Forecast";
CREATE INDEX "Forecast_venueId_date_idx" ON "Forecast"("venueId", "date");
CREATE UNIQUE INDEX "Forecast_venueId_date_key" ON "Forecast"("venueId", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
