import Link from "next/link";
import { ArrowRight, MessageSquareText, Send, ShieldCheck } from "lucide-react";
import { analyzeBookingInquiryAction } from "@/app/(app)/copilot/actions";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SectionCard } from "@/components/SectionCard";
import { parseDraftActions } from "@/lib/ai/booking-copilot-display";
import { getBookingCopilotMode } from "@/lib/ai/booking-copilot-service";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

type CopilotPageProps = {
  searchParams?: Promise<{
    draft?: string | string[];
    error?: string | string[];
    mode?: string | string[];
  }>;
};

const inputClassName =
  "mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 outline-none focus:border-sage";
const textareaClassName =
  "mt-2 min-h-56 w-full resize-y rounded-lg border border-stone-300 bg-white p-3 text-sm leading-6 text-stone-700 outline-none placeholder:text-stone-400 focus:border-sage";

export default async function CopilotPage({ searchParams }: CopilotPageProps) {
  const params = searchParams ? await searchParams : {};
  const draftId = readParam(params.draft);
  const error = readParam(params.error);
  const displayedMode = readParam(params.mode);
  const providerMode = getBookingCopilotMode();
  const draft = draftId
    ? await prisma.aIDraft.findUnique({
        where: { id: draftId },
        include: {
          inquiry: true
        }
      })
    : null;
  const parsedActions = draft ? parseDraftActions(draft.recommendedActions) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="success">Human approval required</Badge>
          <h1 className="mt-3 text-2xl font-semibold text-ink">
            Booking inquiry copilot
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            Paste a customer inquiry to extract booking details and prepare a
            staff-reviewed reply draft. VenuePilot helps staff work faster; it does not
            confirm bookings or send replies automatically.
          </p>
        </div>
        <Badge variant={providerMode === "openai" ? "info" : "neutral"}>
          {providerMode === "openai" ? "OpenAI mode" : "Mock AI mode"}
        </Badge>
      </div>

      {error ? <CopilotError error={error} /> : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard
          title="Inquiry intake"
          description="Manual paste is the first source. Email, SMS, Instagram and widgets can connect later."
        >
          <form action={analyzeBookingInquiryAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField
                label="Customer name"
                name="customerName"
                placeholder="Optional"
              />
              <TextField label="Email" name="customerEmail" placeholder="Optional" />
              <TextField label="Phone" name="customerPhone" placeholder="Optional" />
            </div>

            <label className="block">
              <span className="text-sm font-medium text-stone-700">Guest inquiry</span>
              <textarea
                name="rawMessage"
                required
                className={textareaClassName}
                placeholder="Example: Hi, can we book billiards for 14 people next Friday at 19:00? We may want food as well."
                defaultValue={draft?.inquiry.rawMessage ?? ""}
              />
            </label>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              Analyze and draft
            </button>
          </form>
        </SectionCard>

        <SectionCard
          title="Structured analysis"
          description="Saved as a BookingInquiry with an AI draft for the approval queue."
          action={
            draft ? (
              <Badge variant={draft.requiresHumanReview ? "warning" : "success"}>
                {draft.requiresHumanReview ? "Needs review" : "Review optional"}
              </Badge>
            ) : (
              <Badge variant="neutral">No draft yet</Badge>
            )
          }
        >
          {draft && parsedActions ? (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Detail label="Intent" value={draft.inquiry.intent ?? "unknown"} />
                <Detail
                  label="Requested date"
                  value={formatDate(draft.inquiry.requestedDate)}
                />
                <Detail
                  label="Requested time"
                  value={draft.inquiry.requestedTime ?? "Unknown"}
                />
                <Detail
                  label="Party size"
                  value={
                    draft.inquiry.partySize
                      ? String(draft.inquiry.partySize)
                      : "Unknown"
                  }
                />
                <Detail
                  label="Activity"
                  value={draft.inquiry.activityType ?? "unknown"}
                />
                <Detail
                  label="Food interest"
                  value={draft.inquiry.foodInterest ?? "unknown"}
                />
                <Detail
                  label="Event type"
                  value={draft.inquiry.eventType ?? "unknown"}
                />
                <Detail label="Urgency" value={draft.inquiry.urgency ?? "low"} />
                <Detail
                  label="Revenue potential"
                  value={draft.inquiry.revenuePotential ?? "low"}
                />
                <Detail label="Risk level" value={draft.riskLevel} />
                <Detail
                  label="Human review"
                  value={draft.requiresHumanReview ? "Required" : "Optional"}
                />
                <Detail
                  label="Provider"
                  value={displayedMode === "openai" ? "OpenAI" : "Mock"}
                />
              </div>

              <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                <p className="text-sm font-semibold text-ink">Internal summary</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {draft.internalSummary}
                </p>
              </div>

              <div className="rounded-lg border border-stone-200 bg-white p-4">
                <p className="text-sm font-semibold text-ink">Suggested reply</p>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-6 text-stone-700">
                  {draft.suggestedReply}
                </pre>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <ListBlock
                  title="Recommended actions"
                  items={parsedActions.actions}
                  fallback="No recommended actions returned."
                />
                <ListBlock
                  title="Human review reasons"
                  items={parsedActions.humanReviewReasons}
                  fallback="No extra review reasons."
                />
              </div>

              <div className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Draft saved to the approval queue. Nothing has been sent to the
                  customer.
                </p>
                <Link
                  href={`/approvals?draft=${draft.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  Open approvals
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No reply draft"
              description="Submit an inquiry to show extracted details, missing information, recommended actions and a guest-ready draft for staff review."
              icon={<MessageSquareText className="h-5 w-5" aria-hidden="true" />}
            />
          )}
        </SectionCard>
      </div>

      <SectionCard title="Safety boundary">
        <div className="flex gap-3 rounded-lg bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            High-value groups, complaints, unclear dates or times, large groups and VIP
            or private event language require human review. Suggested replies may offer
            to check availability or prepare a request, but must never claim a booking
            is confirmed.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}

function TextField({
  label,
  name,
  placeholder
}: {
  label: string;
  name: string;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input name={name} placeholder={placeholder} className={inputClassName} />
    </label>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold capitalize text-ink">
        {value.replaceAll("_", " ")}
      </p>
    </div>
  );
}

function ListBlock({
  title,
  items,
  fallback
}: {
  title: string;
  items: string[];
  fallback: string;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
      <p className="text-sm font-semibold text-ink">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-stone-600">
          {items.map((item) => (
            <li key={item} className="rounded-md bg-white px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-stone-500">{fallback}</p>
      )}
    </div>
  );
}

function CopilotError({ error }: { error: string }) {
  const messageByError: Record<string, string> = {
    "missing-message": "Paste a customer inquiry before running the copilot.",
    "missing-venue": "The default venue is missing. Run the database seed first.",
    "missing-settings": "Venue settings could not be loaded.",
    "analysis-failed":
      "The inquiry could not be analyzed. If OpenAI mode is enabled, check the API key and model settings."
  };

  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
      {messageByError[error] ?? "Something went wrong while analyzing the inquiry."}
    </div>
  );
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
