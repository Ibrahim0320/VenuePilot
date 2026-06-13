import { LogOut } from "lucide-react";
import { logoutTrialAccessAction } from "@/app/trial-login/actions";
import { Badge } from "@/components/Badge";
import { getAIMode, getTrialAccessPassword } from "@/lib/env";

export function Topbar() {
  const aiMode = getAIMode() === "openai" ? "AI provider connected" : "Local AI mode";
  const isTrialGateEnabled = Boolean(getTrialAccessPassword());

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b border-stone-200 bg-mist/90 px-4 py-3 backdrop-blur sm:px-6">
      <div>
        <p className="text-sm font-medium text-stone-500">
          Biljardpalatset Göteborg AB
        </p>
        <h1 className="text-lg font-semibold text-ink">Manager workspace</h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 sm:flex">
          <Badge variant="success">Human approval on</Badge>
          <Badge variant="info">{aiMode}</Badge>
        </div>
        {isTrialGateEnabled ? (
          <form action={logoutTrialAccessAction}>
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-stone-300 hover:bg-stone-50"
              aria-label="Log out of trial access"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </form>
        ) : null}
      </div>
    </header>
  );
}
