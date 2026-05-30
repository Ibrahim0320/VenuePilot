import { CheckCheck, Clock3, FileText } from "lucide-react";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SectionCard } from "@/components/SectionCard";
import { StatCard } from "@/components/StatCard";

export default function ApprovalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Badge variant="success">Human-in-the-loop</Badge>
        <h1 className="mt-3 text-2xl font-semibold text-ink">
          Approval queue
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          Review AI-prepared booking replies, summaries, manager briefings and
          operational recommendations before they are used.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Pending"
          value="0"
          helper="Drafts waiting for review."
          icon={<Clock3 className="h-5 w-5" aria-hidden="true" />}
        />
        <StatCard
          label="Approved today"
          value="0"
          helper="Approved content is stored exactly."
          icon={<CheckCheck className="h-5 w-5" aria-hidden="true" />}
          tone="success"
        />
        <StatCard
          label="Needs revision"
          value="0"
          helper="Returned to the copilot or briefing flow."
          icon={<FileText className="h-5 w-5" aria-hidden="true" />}
          tone="warning"
        />
      </div>

      <SectionCard
        title="Pending review"
        description="AI-prepared work will appear here with approve, reject and request revision actions."
      >
        <EmptyState
          title="No approval tasks"
          description="Draft inquiry replies, manager briefings and recommendations will enter this queue before staff use them."
          icon={<CheckCheck className="h-5 w-5" aria-hidden="true" />}
        />
      </SectionCard>
    </div>
  );
}
