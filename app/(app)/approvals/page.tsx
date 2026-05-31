import { CheckCheck, Clock3, FileText } from "lucide-react";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SectionCard } from "@/components/SectionCard";
import { StatCard } from "@/components/StatCard";
import { parseDraftActions } from "@/lib/ai/booking-copilot-display";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

type ApprovalsPageProps = {
  searchParams?: Promise<{
    draft?: string | string[];
  }>;
};

export default async function ApprovalsPage({ searchParams }: ApprovalsPageProps) {
  const params = searchParams ? await searchParams : {};
  const highlightedDraftId = readParam(params.draft);
  const drafts = await prisma.aIDraft.findMany({
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
    take: 25
  });
  const pendingCount = drafts.filter(
    (draft) => draft.status === "pending_review"
  ).length;
  const approvedCount = drafts.filter((draft) => draft.status === "approved").length;
  const needsRevisionCount = drafts.filter(
    (draft) => draft.status === "needs_revision"
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="success">Human-in-the-loop</Badge>
        <h1 className="mt-3 text-2xl font-semibold text-ink">Approval queue</h1>
        <p className="mt-2 text-sm text-stone-600">
          Review AI-prepared booking replies, summaries, manager briefings and
          operational recommendations before they are used.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Pending"
          value={String(pendingCount)}
          helper="Drafts waiting for review."
          icon={<Clock3 className="h-5 w-5" aria-hidden="true" />}
        />
        <StatCard
          label="Approved"
          value={String(approvedCount)}
          helper="Approved content is stored exactly."
          icon={<CheckCheck className="h-5 w-5" aria-hidden="true" />}
          tone="success"
        />
        <StatCard
          label="Needs revision"
          value={String(needsRevisionCount)}
          helper="Returned to the copilot or briefing flow."
          icon={<FileText className="h-5 w-5" aria-hidden="true" />}
          tone="warning"
        />
      </div>

      <SectionCard
        title="Pending review"
        description="AI-prepared work appears here for staff review. Nothing is sent to a customer automatically."
      >
        {drafts.length ? (
          <div className="space-y-4">
            {drafts.map((draft) => {
              const parsedActions = parseDraftActions(draft.recommendedActions);
              const isHighlighted = highlightedDraftId === draft.id;

              return (
                <article
                  key={draft.id}
                  className={
                    isHighlighted
                      ? "rounded-lg border border-emerald-300 bg-emerald-50 p-4"
                      : "rounded-lg border border-stone-200 bg-stone-50 p-4"
                  }
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
                      <Badge
                        variant={
                          draft.riskLevel === "high"
                            ? "danger"
                            : draft.riskLevel === "medium"
                              ? "warning"
                              : "success"
                        }
                      >
                        {draft.riskLevel} risk
                      </Badge>
                      <Badge variant="warning">{draft.status}</Badge>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                        Internal summary
                      </p>
                      <p className="mt-2 text-sm leading-6 text-stone-700">
                        {draft.internalSummary}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                        Recommended actions
                      </p>
                      <ul className="mt-2 space-y-2 text-sm leading-6 text-stone-700">
                        {parsedActions.actions.slice(0, 4).map((action) => (
                          <li key={action} className="rounded-md bg-white p-2">
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <details className="mt-4 rounded-md bg-white p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-ink">
                      Suggested reply draft
                    </summary>
                    <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-6 text-stone-700">
                      {draft.suggestedReply}
                    </pre>
                  </details>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No approval tasks"
            description="Draft inquiry replies, manager briefings and recommendations will enter this queue before staff use them."
            icon={<CheckCheck className="h-5 w-5" aria-hidden="true" />}
          />
        )}
      </SectionCard>
    </div>
  );
}

function readParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
