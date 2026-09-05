import { spawn } from "node:child_process";
import { watch } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import { loadContent } from "./lib/content.mjs";

async function build() {
  const child = spawn(process.execPath, ["scripts/build.mjs"], { stdio: "inherit" });
  const code = await new Promise((resolve) => child.on("exit", resolve));
  if (code !== 0) throw new Error("Build failed");
}

await loadContent();
await build();
const server = spawn(process.execPath, ["scripts/serve.mjs", "dist"], { stdio: "inherit" });

let queued = false;
async function rebuild() {
  if (queued) return;
  queued = true;
  await delay(80);
  try {
    await build();
  } catch {
    // The build printed the useful error; keep watching for the next edit.
  } finally {
    queued = false;
  }
}

for (const directory of ["data", "src", "templates"]) watch(directory, { recursive: true }, rebuild);
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.kill(signal);
    process.exit(0);
  });
}
