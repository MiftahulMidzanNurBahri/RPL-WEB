import { config } from "dotenv";
import { resolve } from "node:path";
import { projectRoot } from "../lib/paths.js";

config({ path: resolve(projectRoot, ".env") });