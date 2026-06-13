import {
  logPrismaSelection,
  resolvePrismaSchema,
  runPrisma
} from "./prisma-config.mjs";

const schema = resolvePrismaSchema();

logPrismaSelection("studio", schema);
runPrisma(["studio", "--schema", schema]);
