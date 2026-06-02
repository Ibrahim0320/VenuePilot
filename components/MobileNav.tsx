"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/components/navigation";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
      <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Mobile navigation">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition",
                isActive
                  ? "border-ink bg-ink text-white"
                  : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
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
