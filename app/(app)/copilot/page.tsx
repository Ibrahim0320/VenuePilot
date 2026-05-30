import { MessageSquareText, Send, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SectionCard } from "@/components/SectionCard";

export default function CopilotPage() {
  return (
    <div className="space-y-6">
      <div>
        <Badge variant="success">Human approval required</Badge>
        <h1 className="mt-3 text-2xl font-semibold text-ink">
          Booking inquiry copilot
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          Paste an inquiry, extract booking details and prepare a reply draft for
          staff review.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard
          title="Inquiry intake"
          description="Manual paste is the first source. Email, SMS, Instagram and widgets can connect later."
        >
          <label className="text-sm font-medium text-stone-700" htmlFor="inquiry">
            Guest inquiry
          </label>
          <textarea
            id="inquiry"
            className="mt-2 min-h-48 w-full resize-none rounded-lg border border-stone-300 bg-white p-3 text-sm text-stone-700 outline-none ring-0 placeholder:text-stone-400 focus:border-sage"
            placeholder="Paste a booking inquiry here once the copilot flow is implemented."
            disabled
          />
          <button
            className="mt-4 inline-flex cursor-not-allowed items-center gap-2 rounded-md bg-stone-200 px-4 py-2 text-sm font-semibold text-stone-500"
            disabled
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            Draft reply
          </button>
        </SectionCard>

        <SectionCard
          title="Prepared reply"
          description="Replies are editable drafts and are never sent automatically."
          action={<Badge variant="warning">Needs approval</Badge>}
        >
          <EmptyState
            title="No reply draft"
            description="The copilot will show extracted details, assumptions, missing information and a guest-ready draft for review."
            icon={<MessageSquareText className="h-5 w-5" aria-hidden="true" />}
          />
        </SectionCard>
      </div>

      <SectionCard title="Safety boundary">
        <div className="flex gap-3 rounded-lg bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            VenuePilot drafts replies and summaries. Staff approve, edit or reject
            them before anything guest-facing is used.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
