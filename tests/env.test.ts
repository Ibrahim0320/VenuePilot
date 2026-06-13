import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getAIMode } from "@/lib/env";

describe("environment handling", () => {
  it("uses mock mode when AI_MODE explicitly requests mock", () => {
    withEnv({ AI_MODE: "mock", OPENAI_API_KEY: "sk-test" }, () => {
      assert.equal(getAIMode(), "mock");
    });
  });

  it("falls back to mock mode when OpenAI mode has no API key", () => {
    withEnv({ AI_MODE: "openai", OPENAI_API_KEY: "" }, () => {
      assert.equal(getAIMode(), "mock");
    });
  });

  it("uses OpenAI mode when auto mode has an API key", () => {
    withEnv({ AI_MODE: "auto", OPENAI_API_KEY: "sk-test" }, () => {
      assert.equal(getAIMode(), "openai");
    });
  });
});

function withEnv(values: Partial<NodeJS.ProcessEnv>, callback: () => void): void {
  const previous = {
    AI_MODE: process.env.AI_MODE,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY
  };

  for (const [key, value] of Object.entries(values)) {
    process.env[key] = value;
  }

  try {
    callback();
  } finally {
    restoreEnvValue("AI_MODE", previous.AI_MODE);
    restoreEnvValue("OPENAI_API_KEY", previous.OPENAI_API_KEY);
  }
}

function restoreEnvValue(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
