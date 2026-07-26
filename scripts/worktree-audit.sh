#!/usr/bin/env bash
# Worktree audit — classify every worktree as SAFE / HOLD before any removal.
#
# READ-ONLY. This script never deletes anything. It prints a verdict per
# worktree and, at the end, the exact commands to run for the safe ones.
#
# Why this exists: `git worktree remove` deletes the directory, and git only
# guards some of what lives there. Measured behaviour (git 2.43):
#
#   Untracked files    REFUSES ("contains modified or untracked files")  -> git protects you
#   Modified tracked   REFUSES                                           -> git protects you
#   Gitignored files   SUCCEEDS SILENTLY, exit 0, no warning             -> UNRECOVERABLE
#   Unpushed commits   SUCCEEDS; commits survive via the branch ref,
#                      and `git branch -d` then refuses to drop them.
#                      Only `git branch -D` actually loses them.
#
# So the one case with NO safety net is gitignored files — .env.local, local
# .sql dumps, scratch notes. They never appear in `git status`, and removal
# deletes them without a word. That is the gap this audit closes.
#
# Usage:  bash scripts/worktree-audit.sh [base-ref]     (default: origin/main)
# See: .claude/rules/git-tree-hygiene.md
set -uo pipefail

BASE="${1:-origin/main}"

# Build dirs that are gitignored and genuinely disposable. Everything else
# that is gitignored gets flagged as precious and blocks removal.
DISPOSABLE='^(node_modules|\.next|dist|build|out|coverage|\.turbo|\.swc|\.cache|playwright-report|test-results|\.code-review-graph)/'

echo "Worktree audit — base ref: $BASE"
git fetch origin --prune --quiet 2>/dev/null || echo "  (warning: fetch failed, verdicts use stale refs)"

if ! git rev-parse --verify --quiet "$BASE" >/dev/null; then
  echo "ERROR: base ref '$BASE' does not exist." >&2
  exit 1
fi

echo
echo "=== Stale metadata (worktree dir already gone) ==="
# `prune -n` reports admin files for worktrees whose directory no longer exists.
# Removing these deletes NO files — the files are already gone.
# NOTE: the report goes to stderr, not stdout — capturing with 2>/dev/null
# silently yields nothing and makes every repo look clean.
prunable=$(git worktree prune --dry-run --verbose 2>&1)
if [[ -n "$prunable" ]]; then
  echo "$prunable"
  echo "  -> 'git worktree prune' is safe: it only clears .git/worktrees bookkeeping."
else
  echo "  none"
fi

safe_list=()
hold_count=0
safe_count=0

echo
echo "=== Per-worktree verdicts ==="

# Parse porcelain output into parallel arrays; avoids a subshell so the
# counters below survive.
paths=(); heads=(); branches=(); flags=()
while IFS= read -r line; do
  case "$line" in
    worktree\ *) paths+=("${line#worktree }"); heads+=(""); branches+=("(detached)"); flags+=("") ;;
    HEAD\ *)     heads[${#heads[@]}-1]="${line#HEAD }" ;;
    branch\ *)   branches[${#branches[@]}-1]="${line#branch refs/heads/}" ;;
    locked*|prunable*) flags[${#flags[@]}-1]="${flags[${#flags[@]}-1]} ${line%% *}" ;;
  esac
done < <(git worktree list --porcelain)

main_wt="${paths[0]}"

for i in "${!paths[@]}"; do
  w="${paths[$i]}"
  br="${branches[$i]}"
  fl="${flags[$i]}"
  risks=()

  echo
  echo "--- $w"
  echo "    branch: $br${fl:+  flags:$fl}"

  if [[ ! -d "$w" ]]; then
    echo "    VERDICT: STALE — directory missing, clear with 'git worktree prune'"
    continue
  fi

  # 1. Tracked modifications + untracked files (git status sees both).
  modified=$(git -C "$w" ls-files --modified --deleted 2>/dev/null | wc -l | tr -d ' ')
  untracked=$(git -C "$w" ls-files --others --exclude-standard 2>/dev/null | wc -l | tr -d ' ')

  [[ "$modified" -gt 0 ]] && risks+=("$modified modified/deleted tracked file(s)")
  if [[ "$untracked" -gt 0 ]]; then
    risks+=("$untracked UNTRACKED file(s)")
    echo "    untracked:"
    git -C "$w" ls-files --others --exclude-standard | head -15 | sed 's/^/      + /'
    [[ "$untracked" -gt 15 ]] && echo "      ... and $((untracked - 15)) more"
  fi

  # 2. Gitignored files that are NOT disposable build output.
  #    These never appear in `git status` — the silent-loss category.
  precious=$(git -C "$w" ls-files --others --ignored --exclude-standard --directory 2>/dev/null \
             | grep -Ev "$DISPOSABLE" || true)
  if [[ -n "$precious" ]]; then
    n=$(printf '%s\n' "$precious" | wc -l | tr -d ' ')
    risks+=("$n gitignored file(s) invisible to git status")
    echo "    gitignored (not build output):"
    printf '%s\n' "$precious" | head -10 | sed 's/^/      ! /'
    [[ "$n" -gt 10 ]] && echo "      ... and $((n - 10)) more"
  fi

  # 3. Commits that exist nowhere else.
  if upstream=$(git -C "$w" rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null); then
    ahead=$(git -C "$w" rev-list --count "@{u}..HEAD" 2>/dev/null || echo 0)
    if [[ "$ahead" -gt 0 ]]; then
      risks+=("$ahead commit(s) not pushed to $upstream")
      git -C "$w" log --oneline "@{u}..HEAD" | head -5 | sed 's/^/      ^ /'
    fi
  else
    # No upstream at all — every commit unique to this branch is at risk.
    uniq=$(git -C "$w" rev-list --count "$BASE..HEAD" 2>/dev/null || echo 0)
    if [[ "$uniq" -gt 0 ]]; then
      risks+=("NO UPSTREAM — $uniq commit(s) exist only here")
      git -C "$w" log --oneline "$BASE..HEAD" | head -5 | sed 's/^/      ^ /'
    fi
  fi

  # 4. Merge status — informational; an unmerged branch that is fully pushed
  #    is still safe to remove, because the commits survive on the remote.
  if git -C "$w" merge-base --is-ancestor HEAD "$BASE" 2>/dev/null; then
    merged="merged into $BASE"
  else
    merged="NOT merged into $BASE"
  fi
  echo "    $merged"

  # The primary checkout is never a removal candidate.
  if [[ "$w" == "$main_wt" ]]; then
    echo "    VERDICT: PRIMARY — never remove"
    [[ ${#risks[@]} -gt 0 ]] && printf '      note: %s\n' "${risks[@]}"
    continue
  fi

  if [[ ${#risks[@]} -eq 0 ]]; then
    echo "    VERDICT: SAFE — nothing lives only here"
    safe_list+=("$w|$br|$merged")
    ((safe_count++))
  else
    echo "    VERDICT: HOLD — rescue first:"
    printf '      * %s\n' "${risks[@]}"
    ((hold_count++))
  fi
done

echo
echo "=== Summary ==="
echo "  worktrees: ${#paths[@]}   safe: $safe_count   hold: $hold_count"

if [[ ${#safe_list[@]} -gt 0 ]]; then
  echo
  echo "=== Commands for SAFE worktrees (review before running) ==="
  for entry in "${safe_list[@]}"; do
    IFS='|' read -r w br m <<< "$entry"
    echo "git worktree remove '$w'"
    [[ "$m" == merged* ]] && echo "git branch -d '$br'   # merged, -d refuses if wrong"
  done
  echo "git worktree prune"
fi

if [[ $hold_count -gt 0 ]]; then
  echo
  echo "=== Rescue recipes for HOLD worktrees ==="
  echo "  untracked/modified :  cd <wt> && git add -A && git commit -m 'wip: rescue' && git push -u origin HEAD"
  echo "  gitignored files   :  cp -a <wt>/<file> /home/circletel/.rescue/<topic>/   # git will NOT save these"
  echo "  unpushed commits   :  cd <wt> && git push -u origin HEAD"
  echo "  no upstream        :  cd <wt> && git push -u origin HEAD"
  echo
  echo "  Re-run this audit after rescuing. Never use --force to skip a HOLD."
fi
