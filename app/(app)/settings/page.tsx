import type { ReactNode } from "react";
import {
  Bot,
  Clock3,
  PackageCheck,
  ShieldCheck,
  SlidersHorizontal
} from "lucide-react";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SectionCard } from "@/components/SectionCard";
import { StatCard } from "@/components/StatCard";
import {
  createPackageAction,
  updatePackageAction,
  updateVenueRulesAction
} from "@/app/(app)/settings/actions";
import { prisma } from "@/lib/db/prisma";
import {
  ACTIVITY_OPTIONS,
  AI_AUTONOMY_OPTIONS,
  DEFAULT_VENUE_LOOKUP,
  type AIAutonomyLevel,
  buildVenueSettingsFromRules
} from "@/lib/settings/venue-settings";

export const dynamic = "force-dynamic";

const inputClassName =
  "mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 outline-none focus:border-sage";
const textareaClassName =
  "mt-2 min-h-28 w-full resize-y rounded-md border border-stone-300 bg-white px-3 py-2 text-sm leading-6 text-stone-700 outline-none focus:border-sage";

export default async function SettingsPage() {
  const venue = await prisma.venue.findFirst({
    where: DEFAULT_VENUE_LOOKUP,
    include: {
      venueRules: {
        orderBy: [{ category: "asc" }, { key: "asc" }]
      },
      packages: {
        orderBy: [{ active: "desc" }, { name: "asc" }]
      }
    }
  });

  if (!venue) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <EmptyState
          title="Default venue not seeded"
          description="Run the database seed command to create Biljardpalatset Göteborg AB before editing venue settings."
          icon={<SlidersHorizontal className="h-5 w-5" aria-hidden="true" />}
        />
      </div>
    );
  }

  const settings = buildVenueSettingsFromRules(venue.venueRules);
  const activePackageCount = venue.packages.filter(
    (venuePackage) => venuePackage.active
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader />

      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
        VenuePilot assists staff by preparing context, summaries and drafts. Human
        approval remains required for guest-facing booking decisions, deposits, large
        groups and unusual requests.
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Venue"
          value={venue.city}
          helper={venue.name}
          icon={<SlidersHorizontal className="h-5 w-5" aria-hidden="true" />}
        />
        <StatCard
          label="AI autonomy"
          value={formatAutonomy(settings.aiAutonomyLevel)}
          helper="Full automation is disabled for the MVP."
          icon={<Bot className="h-5 w-5" aria-hidden="true" />}
          tone="info"
        />
        <StatCard
          label="Large group review"
          value={`${settings.largeGroupEscalationThreshold}+`}
          helper="Requests at or above this size need staff review."
          icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
          tone="warning"
        />
        <StatCard
          label="Active packages"
          value={String(activePackageCount)}
          helper="Available to the future copilot context."
          icon={<PackageCheck className="h-5 w-5" aria-hidden="true" />}
          tone="success"
        />
      </div>

      <SectionCard
        title="Venue rules"
        description="These settings are saved as structured rules and will be loaded into the booking copilot context."
        action={<Badge variant="info">Human-in-the-loop</Badge>}
      >
        <form action={updateVenueRulesAction} className="space-y-6">
          <input type="hidden" name="venueId" value={venue.id} />

          <div className="grid gap-4 lg:grid-cols-2">
            <TextAreaField
              label="Opening hours"
              name="openingHours"
              defaultValue={settings.openingHours}
              icon={<Clock3 className="h-4 w-4" aria-hidden="true" />}
            />
            <TextAreaField
              label="Booking policy"
              name="bookingPolicy"
              defaultValue={settings.bookingPolicy}
              icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
            />
            <TextAreaField
              label="Deposit policy"
              name="depositPolicy"
              defaultValue={settings.depositPolicy}
            />
            <TextAreaField
              label="Tone of voice"
              name="toneOfVoice"
              defaultValue={settings.toneOfVoice}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <NumberField
              label="Group booking threshold"
              name="groupBookingThreshold"
              defaultValue={settings.groupBookingThreshold}
            />
            <NumberField
              label="Large group escalation threshold"
              name="largeGroupEscalationThreshold"
              defaultValue={settings.largeGroupEscalationThreshold}
            />
          </div>

          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm font-semibold text-ink">Available activities</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {ACTIVITY_OPTIONS.map((activity) => (
                <label
                  key={activity.value}
                  className="flex items-center gap-3 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700"
                >
                  <input
                    type="checkbox"
                    name="availableActivities"
                    value={activity.value}
                    defaultChecked={settings.availableActivities.includes(
                      activity.value
                    )}
                    className="h-4 w-4 rounded border-stone-300 text-sage"
                  />
                  {activity.label}
                </label>
              ))}
            </div>
          </div>

          <TextAreaField
            label="Human review rules"
            name="humanReviewRules"
            defaultValue={settings.humanReviewRules}
            icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <span className="text-sm font-semibold text-ink">Auto-reply allowed</span>
              <span className="mt-3 flex items-center gap-3 text-sm text-stone-700">
                <input
                  type="checkbox"
                  name="autoReplyAllowed"
                  defaultChecked={settings.autoReplyAllowed}
                  className="h-4 w-4 rounded border-stone-300 text-sage"
                />
                Allow future low-risk auto-reply workflows
              </span>
              <span className="mt-2 block text-xs leading-5 text-stone-500">
                MVP guest replies still remain drafts or staff-reviewed work.
              </span>
            </label>

            <label className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <span className="text-sm font-semibold text-ink">AI autonomy level</span>
              <select
                name="aiAutonomyLevel"
                defaultValue={settings.aiAutonomyLevel}
                className={inputClassName}
              >
                {AI_AUTONOMY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="mt-2 block text-xs leading-5 text-stone-500">
                Full automation is represented as disabled for now and does not send
                replies without staff approval.
              </span>
            </label>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <p className="text-sm font-semibold text-ink">Autonomy reference</p>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {AI_AUTONOMY_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  className="rounded-md border border-stone-100 bg-stone-50 p-3"
                >
                  <p className="text-sm font-medium text-ink">{option.label}</p>
                  <p className="mt-1 text-xs leading-5 text-stone-500">
                    {option.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
            >
              Save venue rules
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Packages"
        description="Packages help staff and the future booking copilot suggest the right offer without inventing unavailable options."
        action={<Badge variant="neutral">Staff maintained</Badge>}
      >
        <div className="space-y-6">
          <form
            action={createPackageAction}
            className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4"
          >
            <input type="hidden" name="venueId" value={venue.id} />
            <p className="text-sm font-semibold text-ink">Add package</p>
            <PackageFields submitLabel="Add package" />
          </form>

          {venue.packages.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {venue.packages.map((venuePackage) => (
                <form
                  key={venuePackage.id}
                  action={updatePackageAction}
                  className="rounded-lg border border-stone-200 bg-stone-50 p-4"
                >
                  <input type="hidden" name="venueId" value={venue.id} />
                  <input type="hidden" name="packageId" value={venuePackage.id} />
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">
                      {venuePackage.name}
                    </p>
                    <Badge variant={venuePackage.active ? "success" : "neutral"}>
                      {venuePackage.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <PackageFields
                    submitLabel="Save package"
                    defaultValues={venuePackage}
                  />
                </form>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No packages yet"
              description="Add packages for billiards, restaurant, event and private booking inquiries."
              icon={<PackageCheck className="h-5 w-5" aria-hidden="true" />}
            />
          )}
        </div>
      </SectionCard>
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <Badge variant="neutral">Venue source of truth</Badge>
      <h1 className="mt-3 text-2xl font-semibold text-ink">Venue settings</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
        Manage Biljardpalatset-specific rules for booking assistance, forecasting
        context, package suggestions and human review.
      </p>
    </div>
  );
}

function TextAreaField({
  label,
  name,
  defaultValue,
  icon
}: {
  label: string;
  name: string;
  defaultValue: string;
  icon?: ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-sm font-semibold text-ink">
        {icon}
        {label}
      </span>
      <textarea name={name} defaultValue={defaultValue} className={textareaClassName} />
    </label>
  );
}

function NumberField({
  label,
  name,
  defaultValue
}: {
  label: string;
  name: string;
  defaultValue: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input
        type="number"
        min="0"
        name={name}
        defaultValue={defaultValue}
        className={inputClassName}
      />
    </label>
  );
}

function PackageFields({
  submitLabel,
  defaultValues
}: {
  submitLabel: string;
  defaultValues?: {
    name: string;
    description: string;
    minGuests: number | null;
    maxGuests: number | null;
    priceDescription: string;
    active: boolean;
  };
}) {
  return (
    <div className="mt-4 space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-stone-700">Package name</span>
        <input
          name="name"
          defaultValue={defaultValues?.name}
          required
          className={inputClassName}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-stone-700">Description</span>
        <textarea
          name="description"
          defaultValue={defaultValues?.description}
          required
          className="mt-2 min-h-24 w-full resize-y rounded-md border border-stone-300 bg-white px-3 py-2 text-sm leading-6 text-stone-700 outline-none focus:border-sage"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-stone-700">Min guests</span>
          <input
            type="number"
            min="0"
            name="minGuests"
            defaultValue={defaultValues?.minGuests ?? ""}
            className={inputClassName}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-stone-700">Max guests</span>
          <input
            type="number"
            min="0"
            name="maxGuests"
            defaultValue={defaultValues?.maxGuests ?? ""}
            className={inputClassName}
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-stone-700">Price description</span>
        <input
          name="priceDescription"
          defaultValue={defaultValues?.priceDescription}
          required
          className={inputClassName}
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-3 text-sm font-medium text-stone-700">
          <input
            type="checkbox"
            name="active"
            defaultChecked={defaultValues?.active ?? true}
            className="h-4 w-4 rounded border-stone-300 text-sage"
          />
          Active package
        </label>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

function formatAutonomy(level: AIAutonomyLevel): string {
  return (
    AI_AUTONOMY_OPTIONS.find((option) => option.value === level)?.label ?? "Draft only"
  );
}
