import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  FileSpreadsheet,
  ShieldCheck,
  UsersRound
} from "lucide-react";
import { Badge } from "@/components/Badge";
import { SectionCard } from "@/components/SectionCard";
import { StatCard } from "@/components/StatCard";

const capabilities = [
  {
    title: "Booking trend visibility",
    description:
      "Turn booking exports into clear signals for busy days, quiet periods and guest patterns.",
    icon: CalendarClock
  },
  {
    title: "Manager briefings",
    description:
      "Prepare concise daily summaries with staffing watchouts and promotion ideas for review.",
    icon: UsersRound
  },
  {
    title: "Inquiry copilot",
    description:
      "Draft guest replies and booking summaries while keeping staff in control of every send.",
    icon: ShieldCheck
  }
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-mist text-ink">
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto grid min-h-[88vh] max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="success">Human-in-the-loop hospitality AI</Badge>
            <h1 className="mt-5 text-4xl font-semibold leading-tight text-ink sm:text-5xl">
              VenuePilot
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
              An AI booking and operations assistant for restaurants, billiard
              venues, bowling centers, karaoke bars and event spaces.
            </p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">
              The MVP starts with Biljardpalatset Goteborg AB and helps staff
              understand booking demand, prepare manager briefings, forecast busy
              periods and draft inquiry replies for approval.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800"
              >
                Open dashboard
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/data"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
              >
                View data import
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-mist p-4 shadow-soft">
            <div className="rounded-lg border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div>
                  <p className="text-xs font-medium uppercase text-stone-500">
                    Today
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-ink">
                    Manager snapshot
                  </h2>
                </div>
                <Badge variant="warning">Draft</Badge>
              </div>
              <div className="grid gap-3 py-4 sm:grid-cols-2">
                <StatCard label="Bookings" value="42" helper="Next 7 days" />
                <StatCard label="Peak day" value="Sat" helper="Dinner window" />
              </div>
              <div className="space-y-3 rounded-lg bg-stone-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
                  <p className="text-sm leading-6 text-stone-600">
                    Friday evening is trending above recent average. Review shift
                    coverage before confirming larger groups.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <FileSpreadsheet className="mt-0.5 h-5 w-5 text-copper" />
                  <p className="text-sm leading-6 text-stone-600">
                    Import booking exports to unlock real analytics and demand
                    forecasts for the venue.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-3 lg:px-8">
        {capabilities.map((capability) => {
          const Icon = capability.icon;

          return (
            <SectionCard key={capability.title} title={capability.title}>
              <div className="flex gap-3">
                <div className="h-fit rounded-md border border-stone-200 bg-white p-2 text-sage">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="text-sm leading-6 text-stone-600">
                  {capability.description}
                </p>
              </div>
            </SectionCard>
          );
        })}
      </section>
    </main>
  );
}
