# MTN Session Monitoring Log

**Session ID**: C97A5AC99A3275D7BC234E1C5A43303D
**Created**: 2025-10-17T10:07:00Z
**Tracked Expiry**: 2025-10-17T11:06:57Z (60-minute estimate)

---

## Validation Timeline

| Time (UTC) | Minutes Since Creation | Minutes vs Tracked Expiry | Status | API Response | Notes |
|------------|------------------------|---------------------------|--------|--------------|-------|
| 10:21:00 | 14 | +46 | ✅ VALID | 200 OK | Initial validation after creation |
| 10:27:00 | 20 | +40 | ✅ VALID | 200 OK | Validation script test |
| **11:09:00** | **63** | **-3** | ✅ **VALID** | 200 OK | **Past tracked expiry, still works!** |
| ? | ? | ? | ❓ UNKNOWN | ? | Next validation pending |

---

## Key Findings

### 1. Session Lasted Beyond Tracked Expiry
- **Expected**: Session expires at 11:06:57Z (60 minutes)
- **Actual**: Still valid at 11:09:00Z (63 minutes, 3 minutes past expiry)
- **Conclusion**: Server-side timeout ≥ 63 minutes

### 2. Validation Success Rate
- **Total Validations**: 3
- **Successful**: 3 (100%)
- **Failed**: 0 (0%)

---

## Next Monitoring Points

**Recommendation**: Continue monitoring to determine actual session lifespan.

### Suggested Test Schedule

| Next Test Time (UTC) | Minutes Since Creation | Purpose |
|---------------------|------------------------|---------|
| 11:15:00 | 68 | Test +8 minutes past tracked expiry |
| 11:30:00 | 83 | Test +23 minutes past tracked expiry |
| 12:00:00 | 113 | Test ~2 hours after creation |
| 12:30:00 | 143 | Test ~2.5 hours after creation |
| 13:00:00 | 173 | Test ~3 hours after creation |

---

## Hypothesis

Based on current data:

1. **Minimum Lifespan**: ≥63 minutes (confirmed)
2. **Expected Actual Lifespan**: 2-4 hours (hypothesis)
3. **Cookie Types**:
   - `_GRECAPTCHA`: 6 months (confirmed from expires timestamp)
   - `JSESSIONID` (SSO): Unknown, testing ongoing
   - `CASTGC`: Unknown, testing ongoing
   - `JSESSIONID` (ASP): Unknown, testing ongoing

---

## How to Continue Monitoring

Run validation periodically:

```bash
# Every 15-30 minutes until expiry detected
npx tsx scripts/validate-mtn-session.ts

# Log results here with timestamp
```

When session expires:
1. Note exact time of expiration
2. Calculate actual session duration
3. Update `MTN_SESSION_LIFESPAN_FINDINGS.md` with confirmed duration
4. Adjust GitHub Actions validation frequency if needed

---

**Last Updated**: 2025-10-17T11:09:00Z
**Status**: Actively Monitoring
**Next Update**: When validation fails or at next scheduled check
