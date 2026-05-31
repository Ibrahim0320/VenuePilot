-- CreateTable
CREATE TABLE "ManagerBriefing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venueId" TEXT NOT NULL,
    "weekStartDate" DATETIME NOT NULL,
    "weekEndDate" DATETIME NOT NULL,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ManagerBriefing_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ManagerBriefing_venueId_weekStartDate_idx" ON "ManagerBriefing"("venueId", "weekStartDate");

-- CreateIndex
CREATE INDEX "ManagerBriefing_venueId_createdAt_idx" ON "ManagerBriefing"("venueId", "createdAt");
