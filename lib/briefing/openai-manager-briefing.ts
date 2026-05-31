import {
  type BriefingSourceSnapshot,
  type ManagerBriefingContent,
  managerBriefingJsonSchema,
  validateManagerBriefingContent
} from "@/lib/briefing/briefing-types";

const defaultModel = "gpt-4o-mini";

export async function generateOpenAIManagerBriefing({
  deterministicBriefing,
  sourceSnapshot,
  apiKey = process.env.OPENAI_API_KEY,
  model = process.env.OPENAI_MODEL ?? defaultModel
}: {
  deterministicBriefing: ManagerBriefingContent;
  sourceSnapshot: BriefingSourceSnapshot;
  apiKey?: string;
  model?: string;
}): Promise<ManagerBriefingContent> {
  if (!apiKey?.trim()) {
    throw new Error("OPENAI_API_KEY is required for AI-enhanced briefings.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: buildSystemPrompt()
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              sourceSnapshot,
              deterministicBriefing
            },
            null,
            2
          )
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "weekly_manager_briefing",
          strict: true,
          schema: managerBriefingJsonSchema
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenAI manager briefing request failed (${response.status}): ${errorText.slice(
        0,
        500
      )}`
    );
  }

  const payload = (await response.json()) as unknown;
  const outputText = extractResponseText(payload);

  if (!outputText) {
    throw new Error("OpenAI response did not include structured output text.");
  }

  return validateManagerBriefingContent(
    JSON.parse(outputText)
  ) satisfies ManagerBriefingContent;
}

function buildSystemPrompt(): string {
  return [
    "You are VenuePilot, a human-in-the-loop operations assistant for hospitality venues.",
    "Write a practical, concise, non-technical weekly manager briefing.",
    "Use only the supplied sourceSnapshot and deterministicBriefing. Do not invent dates, guest counts, booking counts, packages, venue rules or forecast confidence.",
    "Keep recommendations hospitality-focused: staffing, promotion timing, package upsell, deposits and human review.",
    "Never frame the assistant as replacing staff. Make human manager control explicit where decisions affect guests.",
    "Return only JSON that matches the schema."
  ].join(" ");
}

function extractResponseText(payload: unknown): string | null {
  if (!isRecord(payload)) {
    return null;
  }

  if (typeof payload.output_text === "string") {
    return payload.output_text;
  }

  const output = payload.output;

  if (!Array.isArray(output)) {
    return null;
  }

  for (const item of output) {
    if (!isRecord(item) || !Array.isArray(item.content)) {
      continue;
    }

    for (const content of item.content) {
      if (!isRecord(content)) {
        continue;
      }

      if (typeof content.text === "string") {
        return content.text;
      }

      if (typeof content.output_text === "string") {
        return content.output_text;
      }
    }
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
