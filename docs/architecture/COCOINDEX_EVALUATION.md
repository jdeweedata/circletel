# Evaluation: CocoIndex-Code Integration into CircleTel

**Date**: 2026-03-18
**Status**: NOT RECOMMENDED
**Repository**: [cocoindex-io/cocoindex-code](https://github.com/cocoindex-io/cocoindex-code)

## Context

Evaluating whether cocoindex-code — a semantic code search CLI tool — would be beneficial to integrate into the CircleTel codebase.

## Verdict: **NOT beneficial for CircleTel**

The integration would provide minimal value and introduce unnecessary complexity. Here's the breakdown:

---

## What CocoIndex-Code Does

- **Developer tool** for semantic code search (natural language → code snippets)
- AST-based indexing with embeddings for fuzzy/conceptual code matching
- Written in **Rust + Python** — designed as a CLI/daemon for developer workstations
- Primary value: reduces token usage for AI coding agents by ~70%
- Supports 28+ languages, runs locally with SQLite

## Why It Doesn't Fit CircleTel

### 1. Wrong category of tool
CocoIndex is a **developer productivity tool**, not a product feature. It helps developers search *source code* — it doesn't index business data (products, customers, coverage, billing). CircleTel needs semantic search over **business data**, not code.

### 2. Tech stack mismatch
- CocoIndex: Rust + Python
- CircleTel: Node.js / TypeScript / Next.js 15 / Supabase
- Adding a Python/Rust dependency to a pure TypeScript stack adds operational complexity with no product benefit.

### 3. Redundant with existing tooling
CircleTel already has Claude Code with an extensive skills framework (`.claude/skills/`), context management, and codebase exploration capabilities. Claude Code's built-in Grep, Glob, and Explore agents already handle semantic code navigation.

### 4. Better alternatives exist for actual needs
CircleTel's real gap is **no semantic search over business data** (the search modal at `components/navigation/SearchModal.tsx` is a static 18-item hardcoded list). The right solution is:
- **Supabase pgvector** (already on Supabase — just enable the extension)
- **Embeddings via Google Gemini** (already integrated) or OpenAI
- **Inngest background jobs** (already in place) for embedding generation

### 5. No production deployment path
CocoIndex runs as a local daemon/CLI. There's no server-side component suitable for a Next.js web application. You can't serve it to end users.

---

## What CircleTel Actually Needs (if considering search/AI improvements)

| Need | Right Solution | Why |
|------|---------------|-----|
| Product catalog search | Supabase pgvector + embeddings | Already on Supabase, zero new infra |
| Customer support chatbot | RAG over FAQ/docs with Gemini | Already have Gemini integration |
| Smart package recommendations | Embedding similarity on service_packages | Enhances existing CPQ AI |
| Knowledge base for partners | Vector search on CMS content | Sanity + Prismic content ready |

---

## Recommendation

**Do not integrate cocoindex-code.** Instead, if search/AI improvements are a priority:

1. Enable `pgvector` extension on existing Supabase instance
2. Generate embeddings for product/coverage data using existing Gemini integration
3. Build semantic search API endpoint in Next.js (fits existing stack perfectly)
4. Use Inngest for background embedding generation (pattern already established)

This gives CircleTel real semantic search for end users with zero new dependencies.
