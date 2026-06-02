import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileSpreadsheet,
  LineChart,
  MessageSquareText,
  ShieldCheck,
  TrendingUp,
  UsersRound
} from "lucide-react";
import { Badge } from "@/components/Badge";

const demoSteps = [
  {
    title: "Upload booking data",
    description:
      "Import Caspeco booking exports without asking managers to read spreadsheets.",
    icon: FileSpreadsheet
  },
  {
    title: "See trends",
    description:
      "Spot guest growth, booking pace, party size and weekday patterns at a glance.",
    icon: BarChart3
  },
  {
    title: "Forecast demand",
    description:
      "Turn historical booking signals into practical quiet, busy and peak-day guidance.",
    icon: LineChart
  },
  {
    title: "Draft customer replies",
    description:
      "Prepare structured inquiry summaries and reply drafts for staff review.",
    icon: MessageSquareText
  },
  {
    title: "Approve AI suggestions",
    description:
      "Keep humans in control before any guest-facing message or booking decision.",
    icon: ClipboardCheck
  }
];

const outcomes = [
  "Better booking conversion from faster, clearer replies",
  "Reduced admin for managers and shift leads",
  "Forecasts that support staffing and promotion choices",
  "Human approval built into every guest-facing workflow"
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-mist text-ink">
      <section className="border-b border-stone-200 bg-ink text-white">
        <div className="mx-auto flex min-h-[84vh] max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sm font-semibold text-ink">
                VP
              </span>
              <span>
                <span className="block text-sm font-semibold">VenuePilot</span>
                <span className="block text-xs text-stone-300">
                  Hospitality AI assistant
                </span>
              </span>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-stone-100"
            >
              Open MVP
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </header>

          <div className="flex flex-1 flex-col justify-center gap-8 py-10">
            <div className="max-w-4xl">
              <Badge
                variant="success"
                className="border-emerald-300 bg-emerald-300/15 text-emerald-100"
              >
                Human-in-the-loop, built for venue teams
              </Badge>
              <h1 className="mt-5 text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                AI booking and operations support for busy hospitality venues.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-200">
                VenuePilot helps restaurants, billiards venues, nightclubs and event
                spaces understand demand, reduce admin and prepare better booking
                replies without replacing the staff who know the venue.
              </p>
              <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
                {outcomes.map((outcome) => (
                  <div key={outcome} className="flex items-start gap-3">
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300"
                      aria-hidden="true"
                    />
                    <p className="text-sm leading-6 text-stone-200">{outcome}</p>
                  </div>
                ))}
              </div>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-emerald-200"
                >
                  View manager dashboard
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/data"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Start with data import
                </Link>
              </div>
            </div>

            <ProductPreview />
          </div>
        </div>
      </section>

      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="info">Demo walkthrough</Badge>
            <h2 className="mt-3 text-2xl font-semibold text-ink">
              From spreadsheet to staff-approved action
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              The MVP is designed around the work a venue owner already does: monitor
              demand, plan staff, protect peak slots and reply to guests with care.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-5">
            {demoSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <article
                  key={step.title}
                  className="rounded-lg border border-stone-200 bg-stone-50 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <Icon className="h-5 w-5 text-sage" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {step.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8">
        <ValueCard
          icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />}
          title="Demand clarity"
          description="Daily, monthly and weekday views help managers identify busy periods, quiet days and revenue opportunities."
        />
        <ValueCard
          icon={<UsersRound className="h-5 w-5" aria-hidden="true" />}
          title="Operational recommendations"
          description="Forecasts and briefings suggest staffing preparation, promotion timing and package upsells for human approval."
        />
        <ValueCard
          icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
          title="Staff stay in control"
          description="AI prepares summaries and drafts, while managers approve booking decisions and guest-facing messages."
        />
      </section>
    </main>
  );
}

function ProductPreview() {
  return (
    <div className="rounded-lg border border-white/15 bg-white p-3 shadow-soft">
      <div className="rounded-lg border border-stone-200 bg-mist p-4">
        <div className="flex flex-col gap-3 border-b border-stone-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Manager snapshot
            </p>
            <h2 className="mt-1 text-lg font-semibold text-ink">
              Biljardpalatset Göteborg AB
            </h2>
          </div>
          <Badge variant="warning">Human approval required</Badge>
        </div>
        <div className="grid gap-3 py-4 sm:grid-cols-3">
          <PreviewMetric label="Expected guests" value="312" helper="Next 7 days" />
          <PreviewMetric label="Peak window" value="Fri" helper="Evening demand" />
          <PreviewMetric label="Open drafts" value="6" helper="Awaiting staff" />
        </div>
        <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">Demand forecast</p>
              <Badge variant="success">Busy</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {[
                ["Mon", 38],
                ["Tue", 44],
                ["Wed", 52],
                ["Thu", 64],
                ["Fri", 92],
                ["Sat", 78],
                ["Sun", 41]
              ].map(([day, value]) => (
                <div key={day} className="grid grid-cols-[2.5rem_1fr_2.5rem] gap-3">
                  <span className="text-xs font-medium text-stone-500">{day}</span>
                  <span className="h-2.5 self-center rounded-full bg-stone-100">
                    <span
                      className="block h-2.5 rounded-full bg-emerald-600"
                      style={{ width: `${value}%` }}
                    />
                  </span>
                  <span className="text-right text-xs font-medium text-stone-600">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <p className="text-sm font-semibold text-ink">Manager briefing</p>
            <div className="mt-3 space-y-3 text-sm leading-6 text-stone-600">
              <p>
                Friday is expected to be high demand. Avoid discounting prime evening
                slots.
              </p>
              <p>
                Ask staff to guide smaller groups toward earlier or later times and
                protect dinner + billiards packages.
              </p>
            </div>
            <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              AI suggestions are internal until a manager approves them.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewMetric({
  label,
  value,
  helper
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-xs text-stone-500">{helper}</p>
    </div>
  );
}

function ValueCard({
  icon,
  title,
  description
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-sage">
        {icon}
      </div>
      <h2 className="mt-4 text-base font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
    </article>
  );
}
