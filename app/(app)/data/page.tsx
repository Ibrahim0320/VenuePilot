import { Database } from "lucide-react";
import { Badge } from "@/components/Badge";
import { CaspecoImportPanel } from "@/components/CaspecoImportPanel";
import { EmptyState } from "@/components/EmptyState";
import { SectionCard } from "@/components/SectionCard";
import { StatCard } from "@/components/StatCard";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function DataPage() {
  const venue = await prisma.venue.findFirst({
    where: { name: "Biljardpalatset Göteborg AB", city: "Göteborg" },
    include: {
      _count: {
        select: {
          dailyMetrics: true,
          weekdayMetrics: true
        }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="neutral">Caspeco Excel import</Badge>
        <h1 className="mt-3 text-2xl font-semibold text-ink">Data import</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
          Upload booking exports, preview parsed rows and save the metrics that power
          the dashboard, forecasts and manager briefings.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Daily rows"
          value={(venue?._count.dailyMetrics ?? 0).toLocaleString()}
          helper="Date-based booking metrics ready for trends."
        />
        <StatCard
          label="Weekday rows"
          value={(venue?._count.weekdayMetrics ?? 0).toLocaleString()}
          helper="Weekday demand signals for staffing decisions."
        />
        <StatCard
          label="Venue"
          value={venue?.city ?? "Not seeded"}
          helper={venue?.name ?? "Seed the default venue to begin."}
        />
      </div>

      <SectionCard
        title="Upload booking data"
        description="VenuePilot detects whether the workbook is grouped by date or weekday before saving."
      >
        <CaspecoImportPanel />
      </SectionCard>

      <SectionCard
        title="Imported rows"
        description="Saved metrics are kept unique by venue/date or venue/weekday, so repeat imports update rows instead of duplicating them."
      >
        <EmptyState
          title="Imported metrics are ready for analysis"
          description="Future integration: add a searchable row browser and export filters when managers need to inspect individual imported records."
          icon={<Database className="h-5 w-5" aria-hidden="true" />}
        />
      </SectionCard>
    </div>
  );
}
