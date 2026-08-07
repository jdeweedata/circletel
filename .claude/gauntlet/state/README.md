# Skill Upgrade Gauntlet — persistent state

Resume contract. If the session dies, read these in order:

1. `state/run_state.json`  — phase, selected skills, per-skill status, open blockers
2. `originals/` + `originals_manifest.json` — IMMUTABLE. chmod a-w. Never edit. sha256 per file.
3. `contracts/<skill>.json` — frozen outcome contract (has `frozen: true` + hash once sealed)
4. `benchmarks/<skill>/iteration.json` — tasks builders MAY see
5. `benchmarks/<skill>/heldout.sealed.json` — tasks builders MUST NEVER see
6. `candidates/<skill>/v<N>/` — candidate skill versions
7. `runs/<skill>/<trial-id>/` — one dir per contestant run + judge verdict
8. `dashboard/index.html` — regenerated from the above by `build_dashboard.py`

## Invariants
- `originals/` is read-only and never modified.
- A frozen contract/benchmark is never edited; supersede with a new version + reason.
- Builder agents never receive held-out task text, packets, or judge verdicts.
- Judge agents never receive skill files, model identity, condition labels, or prior verdicts.
- Every trial records the exact model id actually used.
