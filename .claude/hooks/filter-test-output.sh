#!/usr/bin/env bash
# PostToolUse hook — injects filtered test summary when jest/npm test output is verbose
# Reads JSON from stdin, detects verbose test output, outputs a concise systemMessage
# Falls through silently (exits 0) if not test output or if < 5 passing lines

exec python3 -c "
import sys, json, re

try:
    d = json.load(sys.stdin)
except Exception:
    sys.exit(0)

# Only act on Bash tool calls
if d.get('tool_name') != 'Bash':
    sys.exit(0)

# Extract output — Claude Code PostToolUse format
result = d.get('tool_response', d.get('tool_result', {}))
if isinstance(result, dict):
    output = result.get('output', result.get('stdout', ''))
elif isinstance(result, str):
    output = result
else:
    sys.exit(0)

# Only if it looks like test output
if not re.search(r'(PASS |FAIL |Tests:|passed|failed|jest|mocha|vitest)', output, re.IGNORECASE):
    sys.exit(0)

lines = output.splitlines()

# Count passing lines — only filter if there are many
pass_lines = [l for l in lines if re.match(r'^\s*(✓|✔|√|PASS\s)', l)]
if len(pass_lines) < 5:
    sys.exit(0)

# Extract failures and summary
fail_lines = [l for l in lines if re.search(r'(FAIL |✗|FAILED|Error:|expect\(|● )', l)]
summary_lines = lines[-10:]

parts = [f'Test output filtered: {len(pass_lines)} passing lines omitted.']
if fail_lines:
    parts.append('FAILURES:\n' + '\n'.join(fail_lines[:20]))
else:
    parts.append('No failures detected.')
parts.append('SUMMARY:\n' + '\n'.join(summary_lines))

print(json.dumps({'systemMessage': '\n\n'.join(parts)}))
"
