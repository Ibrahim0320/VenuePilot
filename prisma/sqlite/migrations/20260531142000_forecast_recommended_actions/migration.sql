ALTER TABLE "Forecast" ADD COLUMN "recommendedActions" TEXT NOT NULL DEFAULT 'Review staffing, booking pace and venue rules before making operational changes.';

CREATE UNIQUE INDEX "Forecast_venueId_date_key" ON "Forecast"("venueId", "date");
