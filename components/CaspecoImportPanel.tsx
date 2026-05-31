"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, FileSpreadsheet, UploadCloud } from "lucide-react";
import { Badge } from "@/components/Badge";
import type { CaspecoImportResult } from "@/lib/imports/caspeco-types";

type SaveSummary = CaspecoImportResult["summary"];

export function CaspecoImportPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<CaspecoImportResult | null>(null);
  const [savedSummary, setSavedSummary] = useState<SaveSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const previewRows = useMemo(() => {
    if (!parsed) {
      return [];
    }
    return parsed.fileType === "daily"
      ? parsed.dailyRows.slice(0, 8)
      : parsed.weekdayRows.slice(0, 8);
  }, [parsed]);

  async function previewImport() {
    if (!file) {
      setError("Choose a Caspeco Excel file first.");
      return;
    }

    setError(null);
    setSavedSummary(null);
    setIsPreviewing(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/imports/caspeco/preview", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as {
        parsed?: CaspecoImportResult;
        error?: string;
      };

      if (!response.ok || !payload.parsed) {
        throw new Error(payload.error ?? "Could not preview the Caspeco file.");
      }

      setParsed(payload.parsed);
    } catch (previewError) {
      setParsed(null);
      setError(
        previewError instanceof Error
          ? previewError.message
          : "Could not preview the Caspeco file."
      );
    } finally {
      setIsPreviewing(false);
    }
  }

  async function saveImport() {
    if (!parsed) {
      setError("Preview a file before saving it.");
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/imports/caspeco/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parsed })
      });
      const payload = (await response.json()) as {
        summary?: SaveSummary;
        error?: string;
      };

      if (!response.ok || !payload.summary) {
        throw new Error(payload.error ?? "Could not save the import.");
      }

      setSavedSummary(payload.summary);
      setParsed({
        ...parsed,
        summary: payload.summary
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Could not save the import."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-6">
        <UploadCloud className="h-8 w-8 text-stone-400" aria-hidden="true" />
        <h2 className="mt-4 text-base font-semibold text-ink">
          Upload Caspeco booking export
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
          Supports daily files grouped by date and weekday files grouped by Swedish
          weekday. Preview parses the workbook without saving rows.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setParsed(null);
              setSavedSummary(null);
              setError(null);
            }}
            className="block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 file:mr-4 file:rounded-md file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
          />
          <button
            type="button"
            onClick={previewImport}
            disabled={!file || isPreviewing}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            {isPreviewing ? "Previewing" : "Preview import"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {parsed ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <SummaryTile label="Detected type" value={parsed.summary.detectedFileType} />
            <SummaryTile
              label="Rows detected"
              value={parsed.summary.rowsDetected.toLocaleString()}
            />
            <SummaryTile
              label="Guests CY"
              value={parsed.summary.totalGuestsCurrentYear.toLocaleString()}
            />
            <SummaryTile
              label="Bookings CY"
              value={parsed.summary.totalBookingsCurrentYear.toLocaleString()}
            />
            <SummaryTile
              label="Rows imported"
              value={parsed.summary.rowsImported.toLocaleString()}
            />
          </div>

          <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-ink">Import preview</p>
                <p className="text-xs text-stone-500">
                  Showing the first {previewRows.length} parsed rows.
                </p>
              </div>
              <Badge variant={parsed.fileType === "daily" ? "info" : "success"}>
                {parsed.fileType === "daily" ? "Daily" : "Weekday"}
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
                <thead className="bg-stone-50 text-xs uppercase text-stone-500">
                  <tr>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3">Guests CY</th>
                    <th className="px-4 py-3">Guests PY</th>
                    <th className="px-4 py-3">Bookings CY</th>
                    <th className="px-4 py-3">Bookings PY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {previewRows.map((row) => (
                    <tr
                      key={
                        "date" in row
                          ? `daily-${row.bookingUnit}-${row.date}`
                          : `weekday-${row.bookingUnit}-${row.weekday}`
                      }
                    >
                      <td className="px-4 py-3 font-medium text-ink">
                        {"date" in row ? row.date : row.weekdayName}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {row.guestsCurrentYear.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {row.guestsPreviousYear.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {row.bookingsCurrentYear.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {row.bookingsPreviousYear.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {parsed.warnings.length ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">Parser warnings</p>
              <ul className="mt-2 space-y-1 text-sm text-amber-800">
                {parsed.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <button
            type="button"
            onClick={saveImport}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-sage px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {isSaving ? "Saving" : "Save imported rows"}
          </button>

          {savedSummary ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              Imported {savedSummary.rowsImported.toLocaleString()}{" "}
              {savedSummary.detectedFileType} rows. Existing rows were updated
              instead of duplicated.
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <p className="text-xs font-medium uppercase text-stone-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}
