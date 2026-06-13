import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

export const POSTGRES_SCHEMA = "prisma/schema.prisma";
export const SQLITE_SCHEMA = "prisma/sqlite/schema.prisma";
const DEFAULT_SQLITE_DATABASE_URL = "file:../dev.db";

export function resolvePrismaSchema() {
  const explicitSchema = process.env.PRISMA_SCHEMA?.trim();

  if (explicitSchema) {
    return explicitSchema;
  }

  const databaseUrl = getEnvValue("DATABASE_URL") ?? "";

  if (process.env.VERCEL || isPostgresUrl(databaseUrl)) {
    return POSTGRES_SCHEMA;
  }

  return SQLITE_SCHEMA;
}

export function isPostgresSchema(schema) {
  return schema === POSTGRES_SCHEMA || isPostgresUrl(getEnvValue("DATABASE_URL") ?? "");
}

export function runPrisma(args) {
  const schema = getSchemaFromArgs(args);
  const env = { ...process.env };

  if (schema === SQLITE_SCHEMA && !getEnvValue("DATABASE_URL")) {
    env.DATABASE_URL = DEFAULT_SQLITE_DATABASE_URL;
  }

  const result = spawnSync("npx", ["prisma", ...args], {
    env,
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  process.exit(result.status ?? 1);
}

function getSchemaFromArgs(args) {
  const schemaFlagIndex = args.indexOf("--schema");

  if (schemaFlagIndex === -1) {
    return null;
  }

  return args[schemaFlagIndex + 1] ?? null;
}

export function logPrismaSelection(action, schema) {
  console.log(`[prisma] ${action} using ${schema}`);
}

function getEnvValue(key) {
  if (process.env[key]) {
    return process.env[key];
  }

  return readDotEnv()[key];
}

function isPostgresUrl(value) {
  return /^postgres(?:ql)?:\/\//i.test(value);
}

function readDotEnv() {
  const env = {};

  for (const filename of [".env.local", ".env"]) {
    if (!existsSync(filename)) {
      continue;
    }

    const content = readFileSync(filename, "utf8");

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }

      const index = trimmed.indexOf("=");
      const key = trimmed.slice(0, index).trim();
      const value = trimmed
        .slice(index + 1)
        .trim()
        .replace(/^["']|["']$/g, "");

      if (key && env[key] === undefined) {
        env[key] = value;
      }
    }
  }

  return env;
}
