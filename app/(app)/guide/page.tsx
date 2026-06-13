import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  ClipboardCheck,
  MessageSquareText,
  ShieldCheck
} from "lucide-react";
import { Badge } from "@/components/Badge";
import { GuideActions } from "@/components/GuideActions";
import { SectionCard } from "@/components/SectionCard";
import {
  buildGuideCopyText,
  copilotExamples,
  guideSections
} from "@/lib/guide/manager-trial-guide";

export const dynamic = "force-dynamic";

export default function ManagerTrialGuidePage() {
  return (
    <div className="space-y-6 print:bg-white">
      <div className="flex flex-col gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm print:border-0 print:p-0 print:shadow-none lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="info">Manager trial guide</Badge>
          <h1 className="mt-3 text-2xl font-semibold text-ink">
            Guide för att testa VenuePilot
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            En enkel genomgång på svenska för dig som vill prova VenuePilot inför en
            möjlig användning i verksamheten. Guiden kan skrivas ut eller kopieras.
          </p>
        </div>
        <GuideActions copyText={buildGuideCopyText()} />
      </div>

      <section className="grid gap-4 md:grid-cols-3 print:grid-cols-1">
        <GuideHighlight
          icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
          title="Personal bestämmer"
          description="AI ger förslag. Personal granskar och godkänner."
        />
        <GuideHighlight
          icon={<ClipboardCheck className="h-5 w-5" aria-hidden="true" />}
          title="Testa med data"
          description="Börja med import, dashboard och prognos."
        />
        <GuideHighlight
          icon={<MessageSquareText className="h-5 w-5" aria-hidden="true" />}
          title="Prova kundfrågor"
          description="Copilot skapar utkast som ska kontrolleras av personal."
        />
      </section>

      <article className="space-y-5 print:space-y-4">
        {guideSections.map((section) => (
          <SectionCard
            key={section.title}
            title={section.title}
            className="print:border-0 print:p-0 print:shadow-none"
          >
            <ul className="space-y-3 text-sm leading-6 text-stone-700 print:space-y-1">
              {section.body.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sage print:bg-stone-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        ))}

        <SectionCard
          title="Exempel att testa i Copilot"
          description="Kopiera en fråga i taget till Copilot och se vilket utkast VenuePilot skapar."
          className="print:border-0 print:p-0 print:shadow-none"
          action={
            <Link
              href="/copilot"
              className="inline-flex items-center gap-2 rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 print:hidden"
            >
              Öppna Copilot
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        >
          <div className="space-y-3">
            {copilotExamples.map((example, index) => (
              <blockquote
                key={example}
                className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700 print:border-stone-300 print:bg-white"
              >
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Exempel {index + 1}
                </span>
                &quot;{example}&quot;
              </blockquote>
            ))}
          </div>
        </SectionCard>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 print:border-stone-300 print:bg-white">
          Kom ihåg: AI-utkast måste alltid granskas av personal innan de används.
          Kontrollera tider, tillgänglighet, priser, paket, deposition och regler innan
          ni svarar en gäst.
        </div>
      </article>
    </div>
  );
}

function GuideHighlight({
  icon,
  title,
  description
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm print:border-0 print:p-0 print:shadow-none">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage/15 text-sage print:hidden">
        {icon}
      </div>
      <h2 className="mt-4 text-base font-semibold text-ink print:mt-0">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
    </div>
  );
}
