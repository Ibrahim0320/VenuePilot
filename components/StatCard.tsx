import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  helper,
  icon,
  tone = "default"
}: {
  label: string;
  value: string;
  helper?: string;
  icon?: ReactNode;
  tone?: "default" | "success" | "warning" | "info";
}) {
  const toneStyles = {
    default: "bg-white",
    success: "bg-emerald-50/80",
    warning: "bg-amber-50/80",
    info: "bg-sky-50/80"
  };

  return (
    <article
      className={cn(
        "rounded-lg border border-stone-200 p-5 shadow-sm",
        toneStyles[tone]
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-stone-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
        </div>
        {icon ? (
          <div className="rounded-md border border-stone-200 bg-white p-2 text-stone-600">
            {icon}
          </div>
        ) : null}
      </div>
      {helper ? <p className="mt-3 text-sm text-stone-500">{helper}</p> : null}
    </article>
  );
}
