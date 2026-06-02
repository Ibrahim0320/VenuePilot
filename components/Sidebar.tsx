"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/components/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-72 flex-col border-r border-stone-200 bg-white px-4 py-5 lg:flex">
      <Link href="/" className="flex items-center gap-3 rounded-lg px-2 py-1">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-sm font-semibold text-white shadow-sm">
          VP
        </span>
        <span>
          <span className="block text-base font-semibold text-ink">VenuePilot</span>
          <span className="block text-xs text-stone-500">Hospitality operations</span>
        </span>
      </Link>

      <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">
          Human review active
        </p>
        <p className="mt-1 text-xs leading-5 text-emerald-800">
          AI assists the team with drafts, forecasts and briefings. Staff stay in
          control.
        </p>
      </div>

      <nav className="mt-6 space-y-1" aria-label="Workspace navigation">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-ink text-white shadow-sm"
                  : "text-stone-600 hover:bg-stone-100 hover:text-ink"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  isActive ? "text-emerald-200" : "text-stone-400 group-hover:text-sage"
                )}
                aria-hidden="true"
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-lg border border-stone-200 bg-stone-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          First venue
        </p>
        <p className="mt-1 text-sm font-medium text-ink">Biljardpalatset Göteborg AB</p>
        <p className="mt-1 text-xs text-stone-500">Billiards, restaurant and events</p>
      </div>
    </aside>
  );
}
