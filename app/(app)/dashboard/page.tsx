import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  TrendingDown,
  TrendingUp,
  UsersRound
} from "lucide-react";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SectionCard } from "@/components/SectionCard";
import { StatCard } from "@/components/StatCard";

const watchlist = [
  {
    label: "Friday dinner",
    detail: "Likely above average demand after import history is connected.",
    badge: "Staffing review"
  },
  {
    label: "Monday evening",
    detail: "Candidate for a quiet-day promotion once data is available.",
    badge: "Promotion idea"
  },
  {
    label: "Large groups",
    detail: "Deposit rules will be checked before reply drafts are approved.",
    badge: "Rule check"
  }
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="info">MVP workspace</Badge>
          <h1 className="mt-3 text-2xl font-semibold text-ink">
            Manager dashboard
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            A clean operations overview for bookings, demand signals and pending
            AI-prepared work.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Upcoming bookings"
          value="0"
          helper="Import booking data to populate this metric."
          icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
        />
        <StatCard
          label="Expected guests"
          value="0"
          helper="Forecasting will use booking history."
          icon={<UsersRound className="h-5 w-5" aria-hidden="true" />}
          tone="info"
        />
        <StatCard
          label="Pending approvals"
          value="0"
          helper="Draft replies and briefings appear here."
          icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
          tone="success"
        />
        <StatCard
          label="Quiet-day ideas"
          value="0"
          helper="Generated after imported data is analyzed."
          icon={<TrendingDown className="h-5 w-5" aria-hidden="true" />}
          tone="warning"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Operational watchlist"
          description="Placeholder signals for the first data-backed dashboard."
        >
          <div className="space-y-3">
            {watchlist.map((item) => (
              <div
                key={item.label}
                className="flex flex-col gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-ink">{item.label}</p>
                  <p className="mt-1 text-sm text-stone-600">{item.detail}</p>
                </div>
                <Badge variant="neutral">{item.badge}</Badge>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Latest manager briefing"
          description="AI briefings will stay drafts until reviewed."
          action={<Badge variant="warning">Needs data</Badge>}
        >
          <EmptyState
            title="No briefing generated yet"
            description="Upload booking exports, then create a manager briefing draft for human review."
            icon={<Clock3 className="h-5 w-5" aria-hidden="true" />}
          />
        </SectionCard>
      </div>

      <SectionCard
        title="Demand trend"
        description="A compact chart will appear once imported bookings are available."
      >
        <div className="grid min-h-56 place-items-center rounded-lg bg-stone-50">
          <div className="flex items-center gap-3 text-sm text-stone-500">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
            Waiting for imported booking history
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
