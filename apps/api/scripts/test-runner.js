import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(__dirname, "..");
const projectRoot = path.resolve(apiRoot, "../..");
const cacheRoot = path.resolve(projectRoot, "node_modules/.cache").replaceAll("\\", "/");

let cacheDir = null;
const env = { ...process.env };

const providedDb = process.env.TEST_DATABASE_URL?.replaceAll("\\", "/");
const isAlreadyDisposable =
  providedDb &&
  process.env.DATABASE_URL === process.env.TEST_DATABASE_URL &&
  providedDb.startsWith(`file:${cacheRoot}/cookie-session-`) &&
  providedDb.endsWith("/api-test.db");

if (!isAlreadyDisposable) {
  const sessionId = crypto.randomUUID();
  const dir = path.resolve(projectRoot, `node_modules/.cache/cookie-session-${sessionId}`);
  fs.mkdirSync(dir, { recursive: true });
  cacheDir = dir;

  const dbPath = path.resolve(dir, "api-test.db").replaceAll("\\", "/");
  const dbUrl = `file:${dbPath}`;

  env.DATABASE_URL = dbUrl;
  env.TEST_DATABASE_URL = dbUrl;
  if (!env.SESSION_SECRET || env.SESSION_SECRET.includes("replace-with-a-random-secret")) {
    env.SESSION_SECRET = crypto.randomBytes(32).toString("hex");
  }

  const deploy = spawnSync("npx prisma migrate deploy --schema apps/api/prisma/schema.prisma", {
    cwd: projectRoot,
    env,
    stdio: "inherit",
    shell: true
  });

  if (deploy.status !== 0) {
    if (cacheDir) fs.rmSync(cacheDir, { recursive: true, force: true });
    process.exit(deploy.status ?? 1);
  }
}

try {
  const result = spawnSync("npx tsx --test \"src/**/*.test.ts\"", {
    cwd: apiRoot,
    env,
    stdio: "inherit",
    shell: true
  });
  process.exitCode = result.status ?? 0;
} finally {
  if (cacheDir) {
    try {
      fs.rmSync(cacheDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  }
}
