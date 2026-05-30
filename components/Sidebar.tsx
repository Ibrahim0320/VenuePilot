"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/components/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-64 border-r border-stone-200 bg-white px-4 py-5 lg:block">
      <Link href="/" className="flex items-center gap-3 px-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-sm font-semibold text-white">
          VP
        </span>
        <span>
          <span className="block text-base font-semibold text-ink">VenuePilot</span>
          <span className="block text-xs text-stone-500">
            Booking operations
          </span>
        </span>
      </Link>

      <nav className="mt-8 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-emerald-50 text-emerald-900"
                  : "text-stone-600 hover:bg-stone-50 hover:text-ink"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
