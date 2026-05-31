import Link from "next/link";
import {
  CheckCheck,
  Clock3,
  FileText,
  Hand,
  MessageSquareReply,
  XCircle
} from "lucide-react";
import { updateDraftReviewAction } from "@/app/(app)/approvals/actions";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SectionCard } from "@/components/SectionCard";
import { StatCard } from "@/components/StatCard";
import { parseDraftActions } from "@/lib/ai/booking-copilot-display";
import { prisma } from "@/lib/db/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ApprovalsPageProps = {
  searchParams?: Promise<{
    draft?: string | string[];
    status?: string | string[];
    risk?: string | string[];
  }>;
};

type StatusFilter =
  | "all"
  | "pending_review"
  | "approved"
  | "rejected"
  | "needs_follow_up"
  | "handled_manually";
type RiskFilter = "all" | "low" | "medium" | "high";

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending_review", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "needs_follow_up", label: "Needs follow-up" },
  { value: "handled_manually", label: "Handled manually" }
];

const riskFilters: Array<{ value: RiskFilter; label: string }> = [
  { value: "all", label: "All risk" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" }
];

const reviewActions = [
  {
    status: "approved",
    label: "Approve draft",
    icon: CheckCheck,
    className: "bg-emerald-700 hover:bg-emerald-800"
  },
  {
    status: "rejected",
    label: "Reject draft",
    icon: XCircle,
    className: "bg-rose-700 hover:bg-rose-800"
  },
  {
    status: "needs_follow_up",
    label: "Needs follow-up",
    icon: MessageSquareReply,
    className: "bg-amber-700 hover:bg-amber-800"
  },
  {
    status: "handled_manually",
    label: "Handled manually",
    icon: Hand,
    className: "bg-stone-700 hover:bg-stone-800"
  }
] as const;

const replyTextareaClassName =
  "min-h-56 w-full resize-y rounded-md border border-stone-300 bg-white px-3 py-2 font-sans text-sm leading-6 text-stone-700 outline-none focus:border-sage";

export default async function ApprovalsPage({ searchParams }: ApprovalsPageProps) {
  const params = searchParams ? await searchParams : {};
  const highlightedDraftId = readParam(params.draft);
  const statusFilter = readStatusFilter(params.status);
  const riskFilter = readRiskFilter(params.risk);
  const where = {
    ...(statusFilter === "all" ? {} : { status: statusFilter }),
    ...(riskFilter === "all" ? {} : { riskLevel: riskFilter })
  };
  const [drafts, counts] = await Promise.all([
    prisma.aIDraft.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        inquiry: {
          include: {
            venue: {
              select: {
                name: true,
                city: true
              }
            }
          }
        }
      },
      take: 50
    }),
    prisma.aIDraft.groupBy({
      by: ["status"],
      _count: true
    })
  ]);
  const countByStatus = new Map(counts.map((count) => [count.status, count._count]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="success">Human-in-the-loop</Badge>
          <h1 className="mt-3 text-2xl font-semibold text-ink">Approval queue</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            Review, edit and internally approve AI-prepared booking replies. This page
            does not send real emails, SMS, Instagram messages or booking-system
            updates.
          </p>
        </div>
        <Badge variant="warning">Staff control required</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Pending"
          value={String(countByStatus.get("pending_review") ?? 0)}
          helper="Drafts waiting for review."
          icon={<Clock3 className="h-5 w-5" aria-hidden="true" />}
        />
        <StatCard
          label="Approved"
          value={String(countByStatus.get("approved") ?? 0)}
          helper="Approved internally by staff."
          icon={<CheckCheck className="h-5 w-5" aria-hidden="true" />}
          tone="success"
        />
        <StatCard
          label="Rejected"
          value={String(countByStatus.get("rejected") ?? 0)}
          helper="Not suitable for use."
          icon={<XCircle className="h-5 w-5" aria-hidden="true" />}
          tone="warning"
        />
        <StatCard
          label="Needs follow-up"
          value={String(countByStatus.get("needs_follow_up") ?? 0)}
          helper="Staff needs more information."
          icon={<MessageSquareReply className="h-5 w-5" aria-hidden="true" />}
          tone="info"
        />
        <StatCard
          label="Handled manually"
          value={String(countByStatus.get("handled_manually") ?? 0)}
          helper="Resolved outside VenuePilot."
          icon={<Hand className="h-5 w-5" aria-hidden="true" />}
        />
      </div>

      <SectionCard
        title="Review filters"
        description="Narrow the queue by workflow status or risk level."
      >
        <div className="space-y-4">
          <FilterRow
            label="Status"
            filters={statusFilters}
            activeValue={statusFilter}
            getHref={(value) =>
              buildFilterHref({
                status: value,
                risk: riskFilter
              })
            }
          />
          <FilterRow
            label="Risk"
            filters={riskFilters}
            activeValue={riskFilter}
            getHref={(value) =>
              buildFilterHref({
                status: statusFilter,
                risk: value
              })
            }
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Drafts for review"
        description="Approval means staff approved the draft internally. Sending can be connected later through email, SMS, Instagram or booking systems."
      >
        {drafts.length ? (
          <div className="space-y-5">
            {drafts.map((draft) => {
              const parsedActions = parseDraftActions(draft.recommendedActions);
              const isHighlighted = highlightedDraftId === draft.id;

              return (
                <article
                  key={draft.id}
                  className={cn(
                    "rounded-lg border p-4",
                    isHighlighted
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-stone-200 bg-stone-50"
                  )}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {draft.inquiry.customerName || "Guest inquiry"}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        {draft.inquiry.venue.name} ·{" "}
                        {draft.inquiry.createdAt.toISOString().slice(0, 10)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <RiskBadge riskLevel={draft.riskLevel} />
                      <StatusBadge status={draft.status} />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                    <div className="space-y-4">
                      <InfoPanel title="Inquiry details">
                        <DetailGrid
                          details={[
                            ["Name", draft.inquiry.customerName || "Unknown"],
                            ["Email", draft.inquiry.customerEmail || "Unknown"],
                            ["Phone", draft.inquiry.customerPhone || "Unknown"],
                            ["Intent", draft.inquiry.intent || "unknown"],
                            ["Requested date", formatDate(draft.inquiry.requestedDate)],
                            [
                              "Requested time",
                              draft.inquiry.requestedTime || "Unknown"
                            ],
                            [
                              "Party size",
                              draft.inquiry.partySize
                                ? String(draft.inquiry.partySize)
                                : "Unknown"
                            ],
                            ["Activity", draft.inquiry.activityType || "unknown"],
                            ["Food interest", draft.inquiry.foodInterest || "unknown"],
                            ["Event", draft.inquiry.eventType || "unknown"],
                            ["Urgency", draft.inquiry.urgency || "unknown"],
                            ["Revenue", draft.inquiry.revenuePotential || "unknown"]
                          ]}
                        />
                        <details className="mt-3 rounded-md bg-white p-3">
                          <summary className="cursor-pointer text-sm font-semibold text-ink">
                            Raw inquiry
                          </summary>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                            {draft.inquiry.rawMessage}
                          </p>
                        </details>
                      </InfoPanel>

                      <InfoPanel title="AI internal summary">
                        <p className="text-sm leading-6 text-stone-700">
                          {draft.internalSummary}
                        </p>
                      </InfoPanel>

                      <InfoPanel title="Recommended actions">
                        <ListItems
                          items={parsedActions.actions}
                          fallback="No recommended actions returned."
                        />
                      </InfoPanel>

                      <InfoPanel title="Human review reasons">
                        <ListItems
                          items={parsedActions.humanReviewReasons}
                          fallback="No specific review reasons returned."
                        />
                      </InfoPanel>
                    </div>

                    <form
                      action={updateDraftReviewAction}
                      className="rounded-lg border border-stone-200 bg-white p-4"
                    >
                      <input type="hidden" name="draftId" value={draft.id} />
                      <p className="text-sm font-semibold text-ink">
                        Suggested customer reply
                      </p>
                      <p className="mt-1 text-xs leading-5 text-stone-500">
                        Staff can edit this text before approving it internally.
                        Approval does not send the message.
                      </p>
                      <textarea
                        name="suggestedReply"
                        defaultValue={draft.suggestedReply}
                        className={`${replyTextareaClassName} mt-3`}
                      />
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {reviewActions.map((action) => {
                          const Icon = action.icon;

                          return (
                            <button
                              key={action.status}
                              type="submit"
                              name="status"
                              value={action.status}
                              className={cn(
                                "inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white transition",
                                action.className
                              )}
                            >
                              <Icon className="h-4 w-4" aria-hidden="true" />
                              {action.label}
                            </button>
                          );
                        })}
                      </div>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No drafts match these filters"
            description="Try another status or risk filter, or create a new draft from the booking copilot."
            icon={<FileText className="h-5 w-5" aria-hidden="true" />}
          />
        )}
      </SectionCard>
    </div>
  );
}

function FilterRow<T extends string>({
  label,
  filters,
  activeValue,
  getHref
}: {
  label: string;
  filters: Array<{ value: T; label: string }>;
  activeValue: T;
  getHref: (value: T) => string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-stone-500">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Link
            key={filter.value}
            href={getHref(filter.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition",
              filter.value === activeValue
                ? "border-ink bg-ink text-white"
                : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
            )}
          >
            {filter.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
        {title}
      </p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function DetailGrid({ details }: { details: Array<[string, string]> }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {details.map(([label, value]) => (
        <div key={label} className="rounded-md bg-stone-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            {label}
          </p>
          <p className="mt-1 text-sm font-medium capitalize text-ink">
            {value.replaceAll("_", " ")}
          </p>
        </div>
      ))}
    </div>
  );
}

function ListItems({ items, fallback }: { items: string[]; fallback: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-stone-500">{fallback}</p>;
  }

  return (
    <ul className="space-y-2 text-sm leading-6 text-stone-700">
      {items.map((item) => (
        <li key={item} className="rounded-md bg-stone-50 p-2">
          {item}
        </li>
      ))}
    </ul>
  );
}

function RiskBadge({ riskLevel }: { riskLevel: string }) {
  const variant =
    riskLevel === "high" ? "danger" : riskLevel === "medium" ? "warning" : "success";

  return <Badge variant={variant}>{riskLevel} risk</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "approved"
      ? "success"
      : status === "rejected"
        ? "danger"
        : status === "needs_follow_up"
          ? "warning"
          : status === "handled_manually"
            ? "neutral"
            : "info";

  return <Badge variant={variant}>{status.replaceAll("_", " ")}</Badge>;
}

function buildFilterHref({ status, risk }: { status: StatusFilter; risk: RiskFilter }) {
  const params = new URLSearchParams();

  if (status !== "all") {
    params.set("status", status);
  }

  if (risk !== "all") {
    params.set("risk", risk);
  }

  const query = params.toString();

  return query ? `/approvals?${query}` : "/approvals";
}

function formatDate(value: Date | null): string {
  if (!value) {
    return "Unknown";
  }

  return value.toISOString().slice(0, 10);
}

function readParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function readStatusFilter(value: string | string[] | undefined): StatusFilter {
  const status = readParam(value);

  return statusFilters.some((filter) => filter.value === status)
    ? (status as StatusFilter)
    : "all";
}

function readRiskFilter(value: string | string[] | undefined): RiskFilter {
  const risk = readParam(value);

  return riskFilters.some((filter) => filter.value === risk)
    ? (risk as RiskFilter)
    : "all";
}
