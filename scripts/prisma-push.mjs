import {
  logPrismaSelection,
  resolvePrismaSchema,
  runPrisma
} from "./prisma-config.mjs";

const schema = resolvePrismaSchema();

logPrismaSelection("db push", schema);
runPrisma(["db", "push", "--schema", schema]);
