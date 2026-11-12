import fs from "node:fs";
import path from "node:path";

// สระอำที่ผิดคือ U+0E4D + U+0E32 (nikhahit + sara aa) ต้องใช้ U+0E33 แทน
const BAD = "ํา";
const TARGETS = ["src", "lessons", "internal", "README.md"];
const SKIP_DIRS = new Set(["node_modules", ".next", "playwright-report", "test-results"]);
const root = process.cwd();
let found = 0;

function scanFile(file) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, i) => {
    if (line.includes(BAD)) {
      console.error(`${path.relative(root, file)}:${i + 1}: พบสระอำผิดรหัส (U+0E4D U+0E32) ให้ใช้ U+0E33`);
      found++;
    }
  });
}

function scan(target) {
  if (!fs.existsSync(target)) return;
  const stat = fs.statSync(target);
  if (stat.isFile()) return scanFile(target);
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    scan(path.join(target, entry.name));
  }
}

for (const t of TARGETS) scan(path.join(root, t));
process.exit(found > 0 ? 1 : 0);
