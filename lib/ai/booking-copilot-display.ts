export type ParsedDraftActions = {
  actions: string[];
  humanReviewReasons: string[];
};

export function parseDraftActions(value: string): ParsedDraftActions {
  try {
    const parsedValue = JSON.parse(value) as unknown;

    if (isRecord(parsedValue)) {
      return {
        actions: readStringArray(parsedValue.actions),
        humanReviewReasons: readStringArray(parsedValue.humanReviewReasons)
      };
    }
  } catch {
    return {
      actions: value
        .split(/\n|;/)
        .map((item) => item.trim())
        .filter(Boolean),
      humanReviewReasons: []
    };
  }

  return {
    actions: [],
    humanReviewReasons: []
  };
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
