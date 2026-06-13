import { LockKeyhole } from "lucide-react";
import { unlockTrialAccessAction } from "@/app/trial-login/actions";
import { Badge } from "@/components/Badge";
import { getAppName, getTrialAccessPassword } from "@/lib/env";

type TrialLoginPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
    next?: string | string[];
  }>;
};

export default async function TrialLoginPage({ searchParams }: TrialLoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const error = readParam(params.error);
  const nextPath = readParam(params.next) ?? "/dashboard";
  const appName = getAppName();
  const isProductionMissingPassword =
    process.env.NODE_ENV === "production" && !getTrialAccessPassword();

  return (
    <main className="flex min-h-screen items-center justify-center bg-mist px-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <Badge variant="info">Manager trial</Badge>
          <div className="rounded-lg bg-stone-100 p-2 text-stone-600">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>

        <h1 className="mt-6 text-2xl font-semibold text-ink">{appName} access</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Enter the shared trial password to open the manager workspace. AI drafts,
          imports and approvals remain staff-controlled inside the app.
        </p>

        {error === "missing-config" || isProductionMissingPassword ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm leading-6 text-rose-800">
            Trial access is not configured. Set{" "}
            <code className="font-semibold">TRIAL_ACCESS_PASSWORD</code> in Vercel
            before sharing protected manager pages.
          </div>
        ) : error === "invalid" ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            That password did not match the trial access setting.
          </div>
        ) : null}

        {!isProductionMissingPassword ? (
          <form action={unlockTrialAccessAction} className="mt-6 space-y-4">
            <input type="hidden" name="next" value={nextPath} />
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Trial password</span>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 outline-none focus:border-sage"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800"
            >
              Open manager workspace
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}

function readParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}
