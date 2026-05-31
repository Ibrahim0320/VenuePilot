import { Clock3, PackageCheck, Settings2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/Badge";
import { SectionCard } from "@/components/SectionCard";
import { prisma } from "@/lib/db/prisma";

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

export default async function SettingsPage() {
  const venue = await prisma.venue.findFirst({
    where: { venueType: "billiards_restaurant" },
    include: {
      venueRules: {
        orderBy: [{ category: "asc" }, { key: "asc" }]
      },
      packages: {
        orderBy: { name: "asc" }
      }
    }
  });

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
        title={venue?.name ?? "Default venue not seeded yet"}
        description={
          venue
            ? `${venue.city} · ${venue.venueType}`
            : "Run npm run db:migrate and npm run db:seed to create the default venue."
        }
        action={<Badge variant="info">SQLite MVP</Badge>}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-stone-50 p-4">
            <p className="text-sm font-medium text-stone-500">City</p>
            <p className="mt-1 font-semibold text-ink">
              {venue?.city ?? "Not available"}
            </p>
          </div>
          <div className="rounded-lg bg-stone-50 p-4">
            <p className="text-sm font-medium text-stone-500">Venue type</p>
            <p className="mt-1 font-semibold text-ink">
              {venue?.venueType ?? "Not available"}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg bg-stone-50 p-4">
            <p className="text-sm font-semibold text-ink">Seeded venue rules</p>
            <div className="mt-3 space-y-2">
              {venue?.venueRules.length ? (
                venue.venueRules.map((rule) => (
                  <div key={rule.id} className="rounded-md bg-white p-3">
                    <p className="text-xs font-medium uppercase text-stone-500">
                      {rule.category}
                    </p>
                    <p className="mt-1 text-sm font-medium text-ink">{rule.key}</p>
                    <p className="mt-1 text-sm leading-6 text-stone-600">
                      {rule.value}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-stone-500">No venue rules seeded.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-stone-50 p-4">
            <p className="text-sm font-semibold text-ink">Seeded packages</p>
            <div className="mt-3 space-y-2">
              {venue?.packages.length ? (
                venue.packages.map((venuePackage) => (
                  <div key={venuePackage.id} className="rounded-md bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-ink">
                        {venuePackage.name}
                      </p>
                      <Badge variant={venuePackage.active ? "success" : "neutral"}>
                        {venuePackage.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      {venuePackage.description}
                    </p>
                    <p className="mt-2 text-xs font-medium text-stone-500">
                      {venuePackage.priceDescription}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-stone-500">No packages seeded.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-stone-50 p-4 text-sm text-stone-600">
          <Settings2 className="h-4 w-4 text-sage" aria-hidden="true" />
          Editable forms will be connected after the Prisma models are used by the
          app workflows.
        </div>
      </SectionCard>
    </div>
  );
}
