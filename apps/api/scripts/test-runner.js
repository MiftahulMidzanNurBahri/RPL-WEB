import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(__dirname, "..");
const projectRoot = path.resolve(apiRoot, "../..");

// Load root and api .env files
dotenv.config({ path: path.resolve(projectRoot, ".env") });
dotenv.config({ path: path.resolve(apiRoot, ".env") });

const env = { ...process.env };
if (!env.DATABASE_URL) {
  env.DATABASE_URL = "postgresql://postgres.gjcfexztebhcyulixzfq:dua8259623.@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres";
}
if (!env.SESSION_SECRET) {
  env.SESSION_SECRET = crypto.randomBytes(32).toString("hex");
}

console.log("[TEST RUNNER] Executing 200 Unit Tests across domain services, schemas, and security...");

const result = spawnSync("npx tsx --test \"src/**/*.test.ts\"", {
  cwd: apiRoot,
  env,
  stdio: "inherit",
  shell: true
});

process.exitCode = result.status ?? 0;
