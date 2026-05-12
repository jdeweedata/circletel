#!/usr/bin/env node

/**
 * Post-tool-use hook: runs tsc --noEmit after TypeScript file edits.
 * If type errors exist, feeds them back to Claude via stderr.
 * Exit code 0 = no issues (post-hooks can't block, but feedback is sent).
 */

const { execSync } = require("child_process");

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input);
    const toolName = data.tool_name || "";
    const filePath = data.tool_input?.file_path || data.tool_input?.path || "";

    // Only run after file edit tools on TypeScript files
    if (!["write", "edit", "MultiEdit"].includes(toolName)) return;
    if (!filePath.match(/\.(ts|tsx)$/)) return;

    try {
      execSync("npx tsc --noEmit --pretty 2>&1", {
        cwd: process.cwd(),
        encoding: "utf8",
        timeout: 30000,
      });
    } catch (tscError) {
      const output = tscError.stdout || tscError.message;
      // Count errors
      const errorCount = (output.match(/error TS\d+/g) || []).length;
      console.error(
        `\n⚠️  TYPE CHECK FAILED — ${errorCount} error(s) found after editing ${filePath}:\n\n${output}\n\nFix these type errors before continuing.`
      );
    }
  } catch (e) {
    // Silently ignore parse errors — don't break Claude's workflow
  }
});
