import type { ReactNode } from "react";
import { MobileNav } from "@/components/MobileNav";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { getTrialAccessPassword } from "@/lib/env";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-mist text-ink">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Topbar />
          <TrialAccessWarning />
          <MobileNav />
          <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function TrialAccessWarning() {
  const shouldShow = process.env.NODE_ENV !== "production" && !getTrialAccessPassword();

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 sm:px-6">
      Trial access password is not set. Local development is open; set{" "}
      <code className="font-semibold">TRIAL_ACCESS_PASSWORD</code> before sharing a
      deployed manager trial.
    </div>
  );
}
