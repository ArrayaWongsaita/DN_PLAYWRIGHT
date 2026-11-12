import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { needsBuild } from "./build-check.mjs";

function makeProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dn-build-check-"));
  fs.mkdirSync(path.join(dir, "src", "app"), { recursive: true });
  fs.mkdirSync(path.join(dir, "public"), { recursive: true });
  fs.mkdirSync(path.join(dir, ".next"), { recursive: true });
  for (const f of ["next.config.ts", "package.json", "pnpm-lock.yaml", "src/app/page.tsx", "public/logo.svg"]) {
    fs.writeFileSync(path.join(dir, f), "x");
  }
  return dir;
}

function touch(file, seconds) {
  const t = new Date(seconds * 1000);
  fs.utimesSync(file, t, t);
}

test("needsBuild เมื่อไม่มี .next/BUILD_ID", () => {
  const dir = makeProject();
  assert.equal(needsBuild(dir), true);
});

test("needsBuild เมื่อไฟล์ src ใหม่กว่า BUILD_ID", () => {
  const dir = makeProject();
  const buildId = path.join(dir, ".next", "BUILD_ID");
  fs.writeFileSync(buildId, "id");
  touch(buildId, 1_000_000);
  for (const f of ["next.config.ts", "package.json", "pnpm-lock.yaml", "src/app/page.tsx", "public/logo.svg"]) {
    touch(path.join(dir, f), 900_000);
  }
  touch(path.join(dir, "src/app/page.tsx"), 1_000_100);
  assert.equal(needsBuild(dir), true);
});

test("ไม่ต้อง build เมื่อ BUILD_ID ใหม่กว่าทุกไฟล์", () => {
  const dir = makeProject();
  const buildId = path.join(dir, ".next", "BUILD_ID");
  fs.writeFileSync(buildId, "id");
  for (const f of ["next.config.ts", "package.json", "pnpm-lock.yaml", "src/app/page.tsx", "public/logo.svg"]) {
    touch(path.join(dir, f), 900_000);
  }
  touch(buildId, 1_000_000);
  assert.equal(needsBuild(dir), false);
});
