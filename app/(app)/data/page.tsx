import { Database, FileSpreadsheet, UploadCloud } from "lucide-react";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SectionCard } from "@/components/SectionCard";
import { StatCard } from "@/components/StatCard";

export default function DataPage() {
  return (
    <div className="space-y-6">
      <div>
        <Badge variant="neutral">Excel and CSV import</Badge>
        <h1 className="mt-3 text-2xl font-semibold text-ink">Data import</h1>
        <p className="mt-2 text-sm text-stone-600">
          Upload booking exports, map columns and review imported rows before they
          power analytics and forecasts.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Import batches" value="0" helper="No files imported yet." />
        <StatCard label="Valid rows" value="0" helper="Awaiting first upload." />
        <StatCard label="Rows needing review" value="0" helper="Validation pending." />
      </div>

      <SectionCard
        title="Upload booking data"
        description="The upload workflow will parse .xlsx and .csv files, detect columns and show validation results."
      >
        <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
          <UploadCloud className="mx-auto h-10 w-10 text-stone-400" />
          <h2 className="mt-4 text-base font-semibold text-ink">
            Import workflow placeholder
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-stone-600">
            File handling will be implemented in the next phase. This page is ready
            for the parser, column mapping table and validation summary.
          </p>
          <button
            className="mt-5 inline-flex cursor-not-allowed items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-500"
            disabled
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            Upload disabled for scaffold
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Imported rows" description="Normalized bookings will appear here.">
        <EmptyState
          title="No imported data"
          description="After the first import, staff will be able to inspect bookings, skipped rows and source file history."
          icon={<Database className="h-5 w-5" aria-hidden="true" />}
        />
      </SectionCard>
    </div>
  );
}
