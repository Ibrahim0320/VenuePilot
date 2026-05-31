-- CreateIndex
CREATE UNIQUE INDEX "DailyMetric_venueId_date_key" ON "DailyMetric"("venueId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WeekdayMetric_venueId_weekday_key" ON "WeekdayMetric"("venueId", "weekday");
