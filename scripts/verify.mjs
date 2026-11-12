// รันทุก config ของคอร์สต่อกัน: config หลัก แล้วตามด้วย config ของแต่ละบท (เรียงตามเลขบท)
// ใช้ตรวจ branch solutions: pnpm verify --repeat-each=3
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const { LESSON_CONFIG_DIRS } = await import(pathToFileURL(path.join(root, "playwright.shared.ts")).href);
const extraArgs = process.argv.slice(2);

/** @type {{ label: string, args: string[] }[]} */
const runs = [{ label: "config หลัก", args: [] }];

for (const dir of [...LESSON_CONFIG_DIRS].sort()) {
  const config = path.join("lessons", dir, "playwright.config.ts");
  if (!fs.existsSync(path.join(root, config))) continue;
  const base = ["--config", config];
  if (dir.startsWith("45-")) {
    // รอบแรกสร้างภาพต้นแบบบนเครื่องนี้ รอบสองเทียบกับภาพที่เพิ่งสร้าง
    runs.push({ label: `${dir} (สร้างภาพต้นแบบ)`, args: [...base, "--update-snapshots=all"] });
    runs.push({ label: `${dir} (เทียบภาพ)`, args: base });
  } else if (dir.startsWith("48-")) {
    runs.push({ label: dir, args: [...base, "--grep-invert", "@flaky-demo"] });
  } else {
    runs.push({ label: dir, args: base });
  }
}

function quote(arg) {
  return /^[\w@=./:\\-]+$/.test(arg) ? arg : JSON.stringify(arg);
}

const results = [];
for (const run of runs) {
  console.log(`\n=== ${run.label} ===`);
  const args = ["exec", "playwright", "test", "--pass-with-no-tests", ...run.args, ...extraArgs];
  const r = spawnSync("pnpm", args.map(quote), { cwd: root, stdio: "inherit", shell: true });
  results.push({ label: run.label, ok: r.status === 0 });
}

console.log("\n=== สรุป ===");
for (const r of results) console.log(`${r.ok ? "✔" : "✘"} ${r.label}`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
