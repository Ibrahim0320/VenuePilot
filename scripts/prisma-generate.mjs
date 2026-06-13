import {
  logPrismaSelection,
  resolvePrismaSchema,
  runPrisma
} from "./prisma-config.mjs";

const schema = resolvePrismaSchema();

logPrismaSelection("generate", schema);
runPrisma(["generate", "--schema", schema]);
