# Pull Request

## Description
<!-- Provide a brief description of the changes in this PR -->

## Type of Change
<!-- Mark the relevant option with an 'x' -->

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🎨 Code style update (formatting, renaming)
- [ ] ♻️ Refactoring (no functional changes, no api changes)
- [ ] 🔧 Build configuration change
- [ ] ✅ Test updates
- [ ] 🔒 Security update

## Related Issues
<!-- Link to related issues: Fixes #123, Relates to #456 -->

Fixes #
Relates to #

## Changes Made
<!-- List the specific changes made in this PR -->

-
-
-

## Testing
<!-- Describe the tests you ran and how to reproduce them -->

### Unit Tests
- [ ] All existing tests pass
- [ ] New tests added for new functionality
- [ ] Test coverage meets threshold (>90%)

### Manual Testing
<!-- Describe manual testing steps -->

1.
2.
3.

## Checklist

### General
- [ ] My code follows the project's code style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have run `npm run type-check` and it passes
- [ ] I have run `npm run lint` and fixed any issues

### Testing
- [ ] I have added unit tests that prove my fix/feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] I have run `npm test` and all tests pass
- [ ] I have run `npm test -- --coverage` and coverage meets thresholds

### Payment Integration (if applicable)
- [ ] Payment provider abstraction layer used correctly
- [ ] Type-safe payment operations
- [ ] Webhook signature verification implemented
- [ ] Error handling and logging added
- [ ] Transaction idempotency ensured
- [ ] Tests for all payment flows
- [ ] No sensitive data (keys, secrets) committed

### Database Changes (if applicable)
- [ ] Migration scripts created and tested
- [ ] RLS policies updated
- [ ] Database documentation updated
- [ ] Rollback plan documented

### Security
- [ ] No sensitive data exposed in logs or responses
- [ ] Input validation added where needed
- [ ] Authentication/authorization checks in place
- [ ] CORS settings reviewed (if applicable)
- [ ] Rate limiting considered (if applicable)

### Documentation — Definition of Done (whitelabel spec §8)
<!-- Docs ship WITH the feature, not after. Tick one line in each pair. -->

**User-facing behavior changed?**
- [ ] Matching user guide added/updated in `docs/help/<area>/` (interim home until the /help center ships in Phase 4)
- [ ] N/A — no user-facing change

**API / architecture / integration changed?**
- [ ] Dev doc added/updated in `docs/` (architecture, integration guide, or API reference)
- [ ] N/A — no API/architecture change

**Conventions changed?**
- [ ] CLAUDE.md / `.claude/rules/` updated
- [ ] N/A

## Screenshots
<!-- If applicable, add screenshots to help explain your changes -->

## Deployment Notes
<!-- Any special deployment instructions or considerations -->

## Rollback Plan
<!-- How to rollback these changes if needed -->

## Reviewer Notes
<!-- Any specific areas you want reviewers to focus on -->

## Post-Merge Tasks
<!-- Tasks to complete after merging (e.g., update staging, notify team) -->

- [ ]
- [ ]

---

**By submitting this pull request, I confirm that:**
- I have tested my changes thoroughly
- I understand the impact of my changes
- I am ready to address review feedback
