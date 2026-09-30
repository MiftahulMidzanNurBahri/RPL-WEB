import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function findProjectRoot(startDirectory = process.cwd()): string {
  let directory = resolve(startDirectory);
  while (true) {
    const packagePath = resolve(directory, "package.json");
    if (existsSync(packagePath)) {
      const packageJson = JSON.parse(readFileSync(packagePath, "utf8")) as {
        workspaces?: string[];
      };
      if (packageJson.workspaces?.includes("apps/api")) return directory;
    }

    const parent = dirname(directory);
    if (parent === directory) return resolve(startDirectory);
    directory = parent;
  }
}

export const projectRoot = findProjectRoot();