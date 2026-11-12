import fs from "node:fs";
import path from "node:path";

const WATCHED_DIRS = ["src", "public"];
const WATCHED_FILES = ["next.config.ts", "package.json", "pnpm-lock.yaml"];

function newestMtimeInDir(dir) {
  let newest = 0;
  if (!fs.existsSync(dir)) return newest;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const mtime = entry.isDirectory() ? newestMtimeInDir(full) : fs.statSync(full).mtimeMs;
    if (mtime > newest) newest = mtime;
  }
  return newest;
}

/** true เมื่อต้อง build ใหม่: ไม่มี BUILD_ID หรือมีไฟล์ของแอปใหม่กว่า BUILD_ID */
export function needsBuild(rootDir) {
  const buildId = path.join(rootDir, ".next", "BUILD_ID");
  if (!fs.existsSync(buildId)) return true;
  const builtAt = fs.statSync(buildId).mtimeMs;

  let newest = 0;
  for (const dir of WATCHED_DIRS) {
    newest = Math.max(newest, newestMtimeInDir(path.join(rootDir, dir)));
  }
  for (const file of WATCHED_FILES) {
    const full = path.join(rootDir, file);
    if (fs.existsSync(full)) newest = Math.max(newest, fs.statSync(full).mtimeMs);
  }
  return newest > builtAt;
}
