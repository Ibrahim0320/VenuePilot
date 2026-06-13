"use client";

import { useState } from "react";
import { Copy, Printer } from "lucide-react";

export function GuideActions({ copyText }: { copyText: string }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copyGuide() {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  return (
    <div className="flex flex-col gap-2 print:hidden sm:flex-row">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-stone-300 hover:bg-stone-50"
      >
        <Printer className="h-4 w-4" aria-hidden="true" />
        Skriv ut
      </button>
      <button
        type="button"
        onClick={copyGuide}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800"
      >
        <Copy className="h-4 w-4" aria-hidden="true" />
        Kopiera guide
      </button>
      <span className="min-h-9 text-sm text-stone-500 sm:flex sm:items-center">
        {copyStatus === "copied" ? "Guiden är kopierad." : null}
        {copyStatus === "failed" ? "Kopiering misslyckades. Markera texten." : null}
      </span>
    </div>
  );
}
