#!/usr/bin/env node
import { createProgram } from "./cli/program";

async function main(): Promise<void> {
  const program = createProgram();
  await program.parseAsync(process.argv);
}

main().catch((error: unknown) => {
  console.error((error as Error).message);
  process.exit(2);
});

