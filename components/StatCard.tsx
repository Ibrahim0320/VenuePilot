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
    success: "bg-emerald-50/90",
    warning: "bg-amber-50/90",
    info: "bg-sky-50/90"
  };

  return (
    <article
      className={cn(
        "rounded-lg border border-stone-200 p-4 shadow-sm shadow-stone-200/60 sm:p-5",
        toneStyles[tone]
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-5 text-stone-500">{label}</p>
          <p className="mt-2 break-words text-2xl font-semibold text-ink sm:text-3xl">
            {value}
          </p>
        </div>
        {icon ? (
          <div className="shrink-0 rounded-lg border border-stone-200 bg-white p-2 text-stone-600 shadow-sm">
            {icon}
          </div>
        ) : null}
      </div>
      {helper ? (
        <p className="mt-3 text-sm leading-6 text-stone-500">{helper}</p>
      ) : null}
    </article>
  );
}
