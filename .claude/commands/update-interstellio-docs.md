# Update Interstellio API Documentation

Refresh the Interstellio (NebularStack) API documentation by polling the official docs.

## Instructions

1. **Fetch all source documentation pages** using WebFetch:
   - https://docs.interstellio.io/subscriber/subscriber_account
   - https://docs.interstellio.io/subscriber/service_profile
   - https://docs.interstellio.io/subscriber/virtuals
   - https://docs.interstellio.io/subscriber/subscriber_profile
   - https://docs.interstellio.io/subscriber/webhooks
   - https://docs.interstellio.io/subscriber/radius_flow
   - https://docs.interstellio.io/subscriber/api/virtuals
   - https://docs.interstellio.io/subscriber/api/services
   - https://docs.interstellio.io/subscriber/api/profiles
   - https://docs.interstellio.io/subscriber/api/accounts
   - https://docs.interstellio.io/subscriber/api/webhooks
   - https://docs.interstellio.io/subscriber/api/routes
   - https://docs.interstellio.io/subscriber/api/telemetry
   - https://docs.interstellio.io/subscriber/api/sessions
   - https://docs.interstellio.io/subscriber/api/credits
   - https://docs.interstellio.io/api_guide/auth
   - https://docs.interstellio.io/api_guide/basics
   - https://docs.interstellio.io/api_guide/endpoints

2. **Compare with existing documentation** at `docs/api/INTERSTELLIO_API.md`

3. **Update the documentation file** with any changes:
   - New endpoints
   - Changed parameters
   - New webhook events
   - Updated response formats
   - New concepts or features

4. **Update the metadata section** at the bottom:
   - Set `last_polled` to current datetime
   - Set `next_poll` to one week from now

5. **Report changes**:
   - List any new endpoints discovered
   - List any deprecated/removed endpoints
   - List any parameter changes
   - Note if no changes were found

## Output Format

```
## Interstellio Documentation Update Report

**Poll Date**: YYYY-MM-DD
**Status**: [Updated | No Changes]

### Changes Found
- [List of changes]

### New Endpoints
- [List of new endpoints]

### Deprecated
- [List of deprecated items]

### Next Poll
- Scheduled for: YYYY-MM-DD
```
