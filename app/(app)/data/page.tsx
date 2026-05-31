import { Database } from "lucide-react";
import { Badge } from "@/components/Badge";
import { CaspecoImportPanel } from "@/components/CaspecoImportPanel";
import { EmptyState } from "@/components/EmptyState";
import { SectionCard } from "@/components/SectionCard";
import { StatCard } from "@/components/StatCard";
import { prisma } from "@/lib/db/prisma";

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
        <p className="mt-2 text-sm text-stone-600">
          Upload Caspeco booking exports, preview parsed rows, and save daily or
          weekday metrics for analytics and forecasts.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Daily rows"
          value={(venue?._count.dailyMetrics ?? 0).toLocaleString()}
          helper="Saved DailyMetric records."
        />
        <StatCard
          label="Weekday rows"
          value={(venue?._count.weekdayMetrics ?? 0).toLocaleString()}
          helper="Saved WeekdayMetric records."
        />
        <StatCard
          label="Venue"
          value={venue?.city ?? "Not seeded"}
          helper={venue?.name ?? "Run npm run db:seed first."}
        />
      </div>

      <SectionCard
        title="Upload booking data"
        description="The parser detects whether the workbook is grouped by date or weekday before saving."
      >
        <CaspecoImportPanel />
      </SectionCard>

      <SectionCard
        title="Imported rows"
        description="Caspeco daily and weekday metric records are upserted by venue/date or venue/weekday."
      >
        <EmptyState
          title="Detailed row browser coming next"
          description="The import now saves metrics. A row browser and filters can be added on top of DailyMetric and WeekdayMetric."
          icon={<Database className="h-5 w-5" aria-hidden="true" />}
        />
      </SectionCard>
    </div>
  );
}
