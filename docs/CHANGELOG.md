# CLAUDE.md Changelog

Version history for CircleTel CLAUDE.md configuration.

---

## v5.9 (2026-02-17)
- Added Superpowers Skills section with 13 dynamic workflow skills
- Skills now auto-invoke via Skill tool when trigger keywords detected
- Key skills: brainstorming, systematic-debugging, verification-before-completion
- Added NetCash Pay Now parameter mapping pattern (m2=PCI Vault Key, p4=Rands)
- Documented skill invocation pattern with 1% rule

## v5.8 (2026-02-10)
- Added billing automation patterns (Pay Now, SMS, email)
- Added lazy-load pattern for external services (prevents build errors)
- Added external URL redirect pattern (use API routes)
- Added Resend domain config (notify.circletel.co.za)
- Added Billing Tables section to Database Schema

## v5.7 (2026-02-03)
- Added Claude Code Business OS framework (Event Hooks, Custom Commands)
- Session start hook for automatic context analysis
- Pre-edit backup hook for file protection
- Post-bash logging hook for audit trail
- Custom commands: `/new-migration`, `/health-check`, `/sync-types`
- YAML metadata headers added to architecture docs for better searchability

## v5.6 (2026-01-27)
- Admin Order Details page refactored to tabbed workflow interface
- Improved UX with focused sections (Overview, Installation/Service, Financials, History/Notes)
- Persistent header and workflow stepper for continuous status visibility

## v5.5 (2026-01-20)
- Partner Portal complete with FICA/CIPC document upload
- Consumer Dashboard enhancement with service management dropdown
- Payment System with NetCash Pay Now (20+ methods)

## v5.4 (2026-01-13)
- B2B Quote-to-Contract KYC workflow foundation
- Customer Dashboard spec created (147 points)
- Admin Orders Management complete

## v5.3 and earlier
See git history for previous versions.
