#!/usr/bin/env node

/**
 * Post-tool-use hook: runs relevant tests after file edits.
 * Uses a heuristic to find the matching test file.
 * Feeds failures back to Claude.
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input);
    const toolName = data.tool_name || "";
    const filePath = data.tool_input?.file_path || data.tool_input?.path || "";

    if (!["write", "edit", "MultiEdit"].includes(toolName)) return;
    if (!filePath.match(/\.(ts|tsx|js|jsx)$/)) return;
    // Don't run tests when editing test files themselves
    if (filePath.match(/\.(test|spec)\.(ts|tsx|js|jsx)$/)) return;

    // Try to find a matching test file
    const parsed = path.parse(filePath);
    const testPatterns = [
      path.join(parsed.dir, "__tests__", `${parsed.name}.test${parsed.ext}`),
      path.join(parsed.dir, `${parsed.name}.test${parsed.ext}`),
      path.join(parsed.dir, `${parsed.name}.spec${parsed.ext}`),
    ];

    const testFile = testPatterns.find((p) => {
      try {
        return fs.existsSync(p);
      } catch {
        return false;
      }
    });

    if (!testFile) return; // No matching test file, skip

    try {
      execSync(`npx vitest run ${testFile} --reporter=verbose 2>&1`, {
        cwd: process.cwd(),
        encoding: "utf8",
        timeout: 60000,
      });
    } catch (testError) {
      const output = testError.stdout || testError.message;
      console.error(
        `\n⚠️  TESTS FAILED after editing ${filePath}:\n\n${output}\n\nFix failing tests before continuing. Do not skip any.`
      );
    }
  } catch (e) {
    // Silently ignore parse errors
  }
});