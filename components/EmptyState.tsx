import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  icon
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 bg-stone-50/80 px-6 py-8 text-center">
      {icon ? (
        <div className="mb-4 rounded-lg border border-stone-200 bg-white p-3 text-sage shadow-sm">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
