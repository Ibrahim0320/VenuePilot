import {
  isPostgresSchema,
  logPrismaSelection,
  resolvePrismaSchema,
  runPrisma
} from "./prisma-config.mjs";

const schema = resolvePrismaSchema();
const command = isPostgresSchema(schema) ? ["migrate", "deploy"] : ["migrate", "dev"];

logPrismaSelection(command.join(" "), schema);
runPrisma([...command, "--schema", schema]);
