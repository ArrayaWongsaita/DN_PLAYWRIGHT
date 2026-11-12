import { spawn } from "node:child_process";
import { needsBuild } from "./build-check.mjs";

const PORT = 3100;
let child = null;
let stopping = false;

function run(command) {
  // shell: true ทำให้ `pnpm` (pnpm.cmd) ทำงานบน Windows ได้
  return spawn(command, { shell: true, stdio: "inherit" });
}

function forward(signal) {
  stopping = true;
  if (child && !child.killed) child.kill(signal);
}
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => forward(signal));
}

function runAndWait(command) {
  return new Promise((resolve) => {
    child = run(command);
    child.on("exit", (code, signal) => resolve({ code: code ?? (signal ? 1 : 0), signal }));
  });
}

if (needsBuild(process.cwd())) {
  const build = await runAndWait("pnpm exec next build");
  if (stopping) process.exit(0);
  if (build.code !== 0) process.exit(build.code);
}

const server = await runAndWait(`pnpm exec next start -p ${PORT}`);
// หยุดด้วย SIGINT/SIGTERM ที่เราส่งต่อเอง ถือเป็นการหยุดตามปกติ
process.exit(stopping ? 0 : server.code);
