export type ResolvedAIMode = "mock" | "openai";

export function getAppName(): string {
  return process.env.NEXT_PUBLIC_APP_NAME?.trim() || "VenuePilot";
}

export function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getAIMode(): ResolvedAIMode {
  const configuredMode = process.env.AI_MODE?.trim().toLowerCase();

  if (configuredMode === "mock") {
    return "mock";
  }

  if (configuredMode === "openai") {
    return hasOpenAIKey() ? "openai" : "mock";
  }

  if (configuredMode && configuredMode !== "auto") {
    return "mock";
  }

  return hasOpenAIKey() ? "openai" : "mock";
}

export function getTrialAccessPassword(): string | null {
  const password = process.env.TRIAL_ACCESS_PASSWORD?.trim();

  return password || null;
}
