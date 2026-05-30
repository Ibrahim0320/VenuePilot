import { Clock3, PackageCheck, Settings2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/Badge";
import { SectionCard } from "@/components/SectionCard";

const settings = [
  {
    title: "Opening hours",
    description:
      "Weekday schedules and exceptions will guide forecasts and inquiry replies.",
    icon: Clock3
  },
  {
    title: "Booking rules",
    description:
      "Party size limits, duration rules, deposits and cancellation policies.",
    icon: ShieldCheck
  },
  {
    title: "Packages",
    description:
      "Billiards, food and drink packages for structured recommendations.",
    icon: PackageCheck
  }
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Badge variant="neutral">Venue source of truth</Badge>
        <h1 className="mt-3 text-2xl font-semibold text-ink">
          Venue settings
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          Structured rules keep forecasts, briefings and AI drafts aligned with how
          the venue actually operates.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {settings.map((item) => {
          const Icon = item.icon;

          return (
            <SectionCard key={item.title} title={item.title}>
              <div className="flex gap-3">
                <div className="h-fit rounded-md border border-stone-200 bg-stone-50 p-2 text-sage">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="text-sm leading-6 text-stone-600">
                  {item.description}
                </p>
              </div>
            </SectionCard>
          );
        })}
      </div>

      <SectionCard
        title="Biljardpalatset Goteborg AB"
        description="Initial seed data will create this venue for local development."
        action={<Badge variant="info">SQLite MVP</Badge>}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-stone-50 p-4">
            <p className="text-sm font-medium text-stone-500">Timezone</p>
            <p className="mt-1 font-semibold text-ink">Europe/Stockholm</p>
          </div>
          <div className="rounded-lg bg-stone-50 p-4">
            <p className="text-sm font-medium text-stone-500">AI mode</p>
            <p className="mt-1 font-semibold text-ink">Mock until configured</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-stone-50 p-4 text-sm text-stone-600">
          <Settings2 className="h-4 w-4 text-sage" aria-hidden="true" />
          Editable forms will be connected after the data schema is migrated.
        </div>
      </SectionCard>
    </div>
  );
}
