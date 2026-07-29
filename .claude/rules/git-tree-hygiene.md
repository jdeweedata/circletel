# Git Tree Hygiene

**Trigger**: Starting work, ending a session, dirty primary checkout, branch diverge, worktree clutter, push/merge conflicts  
**Scope**: Keep primary `main` clean, isolate work, avoid stranded commits and push conflicts  
**Source**: 2026-07-14 tree cleanup (diverged dirty `main`, mixed PostGIS/Zoho/docs WIP, 30+ worktrees)

---

## Constitution (non-negotiable)

1. **Primary checkout is sacred** — `/home/circletel` stays on clean `main` tracking `origin/main`.
2. **One topic = one branch = one worktree** — never mix unrelated dirty files on primary.
3. **Commit early, push early** — first push after first commit; no stranded local-only feature work.
4. **Fetch + rebase onto `origin/main` before PR push** — conflicts fixed on the feature branch, not at merge panic.
5. **Never pull/merge onto multi-topic dirty WIP** — split, stash, or commit first.
6. **Merge → pull primary → delete branch + remove worktree** — finish the lifecycle same day.
7. **Force-push only your feature branch with `--force-with-lease`** — never force-push `main` or `staging`.

**Success check (primary):**
```bash
git status -sb
# Expect: ## main...origin/main   (no M/??, no ahead/behind)
```

---

## Start of work

```bash
cd /home/circletel
git fetch origin
git pull --ff-only origin main   # if behind
git status -sb                   # must be clean

# New work always from origin/main in a worktree
git worktree add -b feat/<topic> /home/circletel/.worktrees/<topic> origin/main
cd /home/circletel/.worktrees/<topic>
```

| DO | DON'T |
|----|--------|
| Branch from latest `origin/main` | Pile feature commits onto primary `main` |
| Path-scoped `git add path/…` | Habitual `git add -A` with mixed files |
| Draft PR early | Accumulate days of unpushed commits |

---

## Before every push / PR

```bash
git fetch origin
git status -sb
git rebase origin/main    # or merge — pick one style per branch and stick to it
# retest
git push -u origin HEAD
```

| Situation | Action |
|-----------|--------|
| Feature behind `main` only | Rebase (or merge) `origin/main`, then push |
| Feature rebased | `git push --force-with-lease` |
| Primary behind only | `git pull --ff-only` |
| Dirty multi-topic tree | Split into topic branches **before** any pull/rebase |

---

## Session end / after merge

1. Primary: clean `main`, `0/0` vs `origin/main` (`git pull --ff-only` after remote merges).
2. Feature: pushed; PR open or merged.
3. If merged: delete remote branch, `git worktree remove …`, prune local branch.
4. Untracked files that matter (migrations, docs) must already live on a **pushed** branch — hard reset will destroy them.

```bash
git fetch --prune
git worktree list
git worktree remove /home/circletel/.worktrees/<topic>
git branch -d feat/<topic>
```

**Target:** few active worktrees (roughly ≤5–8), not dozens.

---

## Divergence cheat sheet

| State | Fix |
|-------|-----|
| Clean primary, behind `origin/main` | `git pull --ff-only` |
| Feature has unique commits + behind `main` | Rebase onto `origin/main`, then `--force-with-lease` |
| Commits landed on primary by mistake | Cherry-pick onto feature branch; reset primary to `origin/main` only after rescue |
| DB migration applied in Supabase | Merge the PR that owns that migration file promptly so `main` and DB stay aligned |

---

## Agent / multi-session rules

- **Do not leave primary dirty.** If you find it dirty, stop and split/rescue before new coding.
- Any change lasting more than a few minutes → **worktree + branch**, not primary.
- Prefer one owner per branch/worktree; two agents on the same tree causes conflict soup.
- End of significant session: primary clean, feature pushed, handoff note if another agent continues.

---

## Weekly prune

- `git fetch --prune`
- Remove worktrees for merged/abandoned branches
- Drop or apply old stashes (`git stash list`)
- Clear `/tmp/circletel-*` leftovers and detached HEADs

---

## Related

- Pre-push validation: `.claude/rules/pre-push-hook.md` (`.githooks/pre-push`)
- Deploy path: feature → staging → main (see `CLAUDE.md` / `AGENTS.md`)
- Global hygiene audit: `git-hygiene.sh` (cron; reports stranded branches/worktrees)
