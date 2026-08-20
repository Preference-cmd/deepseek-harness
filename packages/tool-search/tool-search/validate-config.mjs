#!/usr/bin/env node

/**
 * Validation script for tool-search plugin configuration
 *
 * This script validates that the tool-search plugin is properly configured
 * in the DeepSeek Harness project.
 */

import { readFileSync } from "fs";
import { join } from "path";

// Run from the project root
const projectRoot = process.cwd();
console.log("Project root:", projectRoot);

const checks = [
  {
    name: "package.json exists",
    check: () => {
      try {
        readFileSync(
          join(projectRoot, "packages/tool-search/package.json"),
          "utf8",
        );
        return true;
      } catch {
        return false;
      }
    },
  },
  {
    name: "lib/index.js exists",
    check: () => {
      try {
        readFileSync(
          join(projectRoot, "packages/tool-search/lib/index.js"),
          "utf8",
        );
        return true;
      } catch {
        return false;
      }
    },
  },
  {
    name: "lib/types/index.d.ts exists",
    check: () => {
      try {
        readFileSync(
          join(projectRoot, "packages/tool-search/lib/types/index.d.ts"),
          "utf8",
        );
        return true;
      } catch {
        return false;
      }
    },
  },
  {
    name: "cordis.patch.yml contains tool-search",
    check: () => {
      try {
        const content = readFileSync(
          join(projectRoot, "packages/bundle/web-app/cordis.patch.yml"),
          "utf8",
        );
        return content.includes("tool-search");
      } catch {
        return false;
      }
    },
  },
  {
    name: "tsconfig.host.json contains tool-search reference",
    check: () => {
      try {
        const content = readFileSync(
          join(projectRoot, "tsconfig.host.json"),
          "utf8",
        );
        return content.includes("tool-search");
      } catch {
        return false;
      }
    },
  },
  {
    name: "tsconfig.client.json contains tool-search reference",
    check: () => {
      try {
        const content = readFileSync(
          join(projectRoot, "tsconfig.client.json"),
          "utf8",
        );
        return content.includes("tool-search");
      } catch {
        return false;
      }
    },
  },
];

console.log("Validating tool-search plugin configuration...\n");

let allPassed = true;
for (const check of checks) {
  const passed = check.check();
  console.log(`${passed ? "✓" : "✗"} ${check.name}`);
  if (!passed) allPassed = false;
}

console.log(
  `\n${allPassed ? "✅ All checks passed!" : "❌ Some checks failed!"}`,
);

process.exit(allPassed ? 0 : 1);
