#!/usr/bin/env bash
# Billing ledger writer allowlist ratchet — whitelabel Phase 1 (spec §3).
# Fails if any file outside .billing-writer-allowlist writes to customer_invoices
# via .insert / .update / .upsert chained after .from('customer_invoices').
#
# Target sole writer: lib/billing/engine/
# Allowlist must only shrink (never grow without explicit PR rationale).
set -euo pipefail
cd "$(dirname "$0")/.."

ALLOWLIST_FILE=".billing-writer-allowlist"
LOOKAHEAD=25

if [[ ! -f "$ALLOWLIST_FILE" ]]; then
  echo "ERROR: $ALLOWLIST_FILE missing."
  exit 1
fi

python3 - "$ALLOWLIST_FILE" "$LOOKAHEAD" <<'PY'
import re
import sys
from pathlib import Path

allowlist_file = Path(sys.argv[1])
lookahead = int(sys.argv[2])

allowed: list[str] = []
for line in allowlist_file.read_text().splitlines():
    s = line.strip()
    if not s or s.startswith("#"):
        continue
    allowed.append(s)

def is_allowed(path: str) -> bool:
    for entry in allowed:
        if entry.endswith("/"):
            if path.startswith(entry):
                return True
        elif path == entry:
            return True
    return False

from_re = re.compile(r"\.from\(\s*['\"]customer_invoices['\"]\s*\)")
write_re = re.compile(r"\.(insert|update|upsert)\s*\(")

scan_roots = ["app", "lib", "scripts", "supabase", "components"]
suffixes = {".ts", ".tsx", ".js"}
skip_parts = {"node_modules", ".next", "dist", "__tests__", ".git"}

writers: list[str] = []
for root_name in scan_roots:
    root = Path(root_name)
    if not root.exists():
        continue
    for p in root.rglob("*"):
        if p.suffix not in suffixes:
            continue
        if any(part in skip_parts for part in p.parts):
            continue
        try:
            text = p.read_text(errors="ignore")
        except OSError:
            continue
        if "customer_invoices" not in text:
            continue
        lines = text.splitlines()
        for i, line in enumerate(lines):
            if not from_re.search(line):
                continue
            window = "\n".join(lines[i : i + lookahead + 1])
            if write_re.search(window):
                writers.append(str(p).replace("\\", "/"))
                break

writers = sorted(set(writers))
violations = [w for w in writers if not is_allowed(w)]

print(f"Billing ledger writers (customer_invoices insert/update/upsert): {len(writers)}")
print(f"Allowlist entries: {len(allowed)}")

if violations:
    print()
    print("FAIL: unallowlisted customer_invoices writers:")
    for v in violations:
        print(f"  - {v}")
    print()
    print("New ledger writes must go through lib/billing/engine/ (billingEngine).")
    print(f"If a temporary exception is required, add the path to {allowlist_file}")
    print("with a comment and shrink it in a follow-up PR.")
    print("See docs/architecture/BILLING_ENGINE.md")
    sys.exit(1)

print("OK — all writers are on the allowlist (target: shrink toward lib/billing/engine/ only)")
sys.exit(0)
PY
