import {
  logPrismaSelection,
  resolvePrismaSchema,
  runPrisma
} from "./prisma-config.mjs";

const schema = resolvePrismaSchema();

logPrismaSelection("db seed", schema);
runPrisma(["db", "seed", "--schema", schema]);
