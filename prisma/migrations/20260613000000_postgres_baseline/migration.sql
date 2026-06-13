-- VenuePilot production baseline for PostgreSQL.

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "venueType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyMetric" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "guestsCurrentYear" INTEGER NOT NULL,
    "guestsPreviousYear" INTEGER NOT NULL,
    "guestsDiff" INTEGER NOT NULL,
    "bookingsCurrentYear" INTEGER NOT NULL,
    "bookingsPreviousYear" INTEGER NOT NULL,
    "bookingsDiff" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeekdayMetric" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "bookingsCurrentYear" INTEGER NOT NULL,
    "bookingsPreviousYear" INTEGER NOT NULL,
    "bookingsDiff" INTEGER NOT NULL,
    "guestsCurrentYear" INTEGER NOT NULL,
    "guestsPreviousYear" INTEGER NOT NULL,
    "guestsDiff" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeekdayMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Forecast" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "expectedGuests" INTEGER NOT NULL,
    "expectedBookings" INTEGER NOT NULL,
    "confidence" TEXT NOT NULL,
    "demandLevel" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "recommendedActions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Forecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingInquiry" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "rawMessage" TEXT NOT NULL,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "requestedDate" TIMESTAMP(3),
    "requestedTime" TEXT,
    "partySize" INTEGER,
    "intent" TEXT,
    "activityType" TEXT,
    "foodInterest" TEXT,
    "eventType" TEXT,
    "urgency" TEXT,
    "revenuePotential" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIDraft" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "suggestedReply" TEXT NOT NULL,
    "internalSummary" TEXT NOT NULL,
    "recommendedActions" TEXT NOT NULL,
    "requiresHumanReview" BOOLEAN NOT NULL DEFAULT true,
    "riskLevel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueRule" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VenueRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "minGuests" INTEGER,
    "maxGuests" INTEGER,
    "priceDescription" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagerBriefing" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "weekEndDate" TIMESTAMP(3) NOT NULL,
    "providerMode" TEXT NOT NULL,
    "executiveSummary" TEXT NOT NULL,
    "expectedDemand" TEXT NOT NULL,
    "busiestUpcomingDays" TEXT NOT NULL,
    "quietestUpcomingDays" TEXT NOT NULL,
    "staffingRecommendations" TEXT NOT NULL,
    "promotionRecommendations" TEXT NOT NULL,
    "packageUpsellOpportunities" TEXT NOT NULL,
    "risksOrUnusualPatterns" TEXT NOT NULL,
    "suggestedManagerActions" TEXT NOT NULL,
    "sourceSnapshot" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManagerBriefing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Venue_city_idx" ON "Venue"("city");

-- CreateIndex
CREATE INDEX "Venue_venueType_idx" ON "Venue"("venueType");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_name_city_key" ON "Venue"("name", "city");

-- CreateIndex
CREATE INDEX "DailyMetric_venueId_date_idx" ON "DailyMetric"("venueId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMetric_venueId_date_key" ON "DailyMetric"("venueId", "date");

-- CreateIndex
CREATE INDEX "WeekdayMetric_venueId_weekday_idx" ON "WeekdayMetric"("venueId", "weekday");

-- CreateIndex
CREATE UNIQUE INDEX "WeekdayMetric_venueId_weekday_key" ON "WeekdayMetric"("venueId", "weekday");

-- CreateIndex
CREATE INDEX "Forecast_venueId_date_idx" ON "Forecast"("venueId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Forecast_venueId_date_key" ON "Forecast"("venueId", "date");

-- CreateIndex
CREATE INDEX "BookingInquiry_venueId_status_idx" ON "BookingInquiry"("venueId", "status");

-- CreateIndex
CREATE INDEX "BookingInquiry_venueId_requestedDate_idx" ON "BookingInquiry"("venueId", "requestedDate");

-- CreateIndex
CREATE INDEX "AIDraft_inquiryId_status_idx" ON "AIDraft"("inquiryId", "status");

-- CreateIndex
CREATE INDEX "VenueRule_venueId_category_idx" ON "VenueRule"("venueId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "VenueRule_venueId_key_key" ON "VenueRule"("venueId", "key");

-- CreateIndex
CREATE INDEX "Package_venueId_active_idx" ON "Package"("venueId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Package_venueId_name_key" ON "Package"("venueId", "name");

-- CreateIndex
CREATE INDEX "ManagerBriefing_venueId_weekStartDate_idx" ON "ManagerBriefing"("venueId", "weekStartDate");

-- CreateIndex
CREATE INDEX "ManagerBriefing_venueId_createdAt_idx" ON "ManagerBriefing"("venueId", "createdAt");

-- AddForeignKey
ALTER TABLE "DailyMetric" ADD CONSTRAINT "DailyMetric_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeekdayMetric" ADD CONSTRAINT "WeekdayMetric_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Forecast" ADD CONSTRAINT "Forecast_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingInquiry" ADD CONSTRAINT "BookingInquiry_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIDraft" ADD CONSTRAINT "AIDraft_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "BookingInquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueRule" ADD CONSTRAINT "VenueRule_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerBriefing" ADD CONSTRAINT "ManagerBriefing_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
