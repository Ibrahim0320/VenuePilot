"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/components/navigation";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-stone-200 bg-white px-4 py-3 lg:hidden">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium",
                isActive
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-stone-200 bg-white text-stone-600"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
