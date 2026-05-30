import { ClipboardList, Sparkles } from "lucide-react";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SectionCard } from "@/components/SectionCard";

const briefingSections = [
  "Yesterday summary",
  "Today outlook",
  "Next 7 days",
  "Staffing watchouts",
  "Quiet-day promotion ideas",
  "Pending approvals"
];

export default function BriefingPage() {
  return (
    <div className="space-y-6">
      <div>
        <Badge variant="warning">Drafts require review</Badge>
        <h1 className="mt-3 text-2xl font-semibold text-ink">
          AI manager briefing
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          Generate concise operational briefings for managers and shift leads,
          backed by imported data and venue rules.
        </p>
      </div>

      <SectionCard
        title="Briefing draft"
        description="Mock AI mode will provide deterministic local drafts until an API key is configured."
        action={<Badge variant="info">Mock AI</Badge>}
      >
        <EmptyState
          title="No briefing draft yet"
          description="The generated briefing will cite its data window, separate facts from suggestions and wait for human review."
          icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
        />
      </SectionCard>

      <SectionCard title="Planned briefing sections">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {briefingSections.map((section) => (
            <div
              key={section}
              className="flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm font-medium text-stone-700"
            >
              <ClipboardList className="h-4 w-4 text-sage" aria-hidden="true" />
              {section}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
