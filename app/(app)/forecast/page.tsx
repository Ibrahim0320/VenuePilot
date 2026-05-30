import { CalendarRange, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/Badge";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { EmptyState } from "@/components/EmptyState";
import { SectionCard } from "@/components/SectionCard";
import { StatCard } from "@/components/StatCard";

export default function ForecastPage() {
  return (
    <div className="space-y-6">
      <div>
        <Badge variant="info">Demand forecast</Badge>
        <h1 className="mt-3 text-2xl font-semibold text-ink">Forecast</h1>
        <p className="mt-2 text-sm text-stone-600">
          Forecasts will combine booking history, future reservations, opening hours
          and venue rules.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Next 7 days"
          value="Pending"
          helper="Needs imported booking history."
          icon={<CalendarRange className="h-5 w-5" aria-hidden="true" />}
        />
        <StatCard
          label="Busy periods"
          value="0"
          helper="Created after forecast run."
          icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />}
          tone="success"
        />
        <StatCard
          label="Quiet periods"
          value="0"
          helper="Promotion ideas require approval."
          icon={<TrendingDown className="h-5 w-5" aria-hidden="true" />}
          tone="warning"
        />
      </div>

      <SectionCard
        title="Forecast snapshot"
        description="The MVP will begin with transparent heuristics before heavier models."
        action={<ConfidenceBadge confidence="low" />}
      >
        <EmptyState
          title="No forecast generated"
          description="Import historic bookings first. Forecast output will include expected bookings, expected guests, confidence and rationale."
          icon={<CalendarRange className="h-5 w-5" aria-hidden="true" />}
        />
      </SectionCard>
    </div>
  );
}
