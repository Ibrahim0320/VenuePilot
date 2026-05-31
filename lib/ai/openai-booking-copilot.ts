import {
  type BookingCopilotOutput,
  type BookingCopilotProvider,
  bookingCopilotJsonSchema,
  validateBookingCopilotOutput
} from "@/lib/ai/booking-copilot-types";

const defaultModel = "gpt-4o-mini";

export function createOpenAIBookingCopilotProvider({
  apiKey = process.env.OPENAI_API_KEY,
  model = process.env.OPENAI_MODEL ?? defaultModel
}: {
  apiKey?: string;
  model?: string;
} = {}): BookingCopilotProvider {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for the OpenAI provider.");
  }

  return {
    mode: "openai",
    async analyze({ inquiry, context }) {
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
                  inquiry,
                  venueContext: context
                },
                null,
                2
              )
            }
          ],
          text: {
            format: {
              type: "json_schema",
              name: "booking_inquiry_analysis",
              strict: true,
              schema: bookingCopilotJsonSchema
            }
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `OpenAI booking copilot request failed (${response.status}): ${errorText.slice(
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

      return validateBookingCopilotOutput(
        JSON.parse(outputText)
      ) satisfies BookingCopilotOutput;
    }
  };
}

function buildSystemPrompt(): string {
  return [
    "You are VenuePilot, a human-in-the-loop booking assistant for hospitality venues.",
    "Analyze the customer inquiry and produce only the structured JSON requested by the schema.",
    "Do not claim a booking is confirmed. Do not say a table, lane, room or package is reserved.",
    "Suggested replies may offer to check availability, prepare a request, or ask for missing details.",
    "High-value groups, complaints, unclear dates or times, large groups, VIP/private event language and deposit questions require human review.",
    "Recommended actions are internal staff actions, not messages to the guest."
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
