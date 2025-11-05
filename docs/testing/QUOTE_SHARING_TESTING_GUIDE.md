# Quote Sharing & Tracking - Manual Testing Guide

## Overview

This guide provides step-by-step instructions for manually testing the quote sharing and tracking system.

## Prerequisites

- Dev server running (`npm run dev:memory`)
- Admin user account with access to quotes
- Valid quote in the database (status: draft, pending_approval, or approved)

## Test Scenario 1: Generate Share Link

### Steps:

1. **Login to Admin Panel**
   - Navigate to `http://localhost:3001/admin`
   - Login with admin credentials

2. **Navigate to Quotes**
   - Click "Quotes" in the sidebar
   - Select "All Quotes" from the dropdown

3. **Open Quote Detail**
   - Click on any quote from the list
   - Example: Click "BQ-2025-013 - Erhard 8"

4. **Generate Share Link**
   - Locate the "Share Quote" button (purple button with share icon)
   - Click "Share Quote"
   - A dialog should appear with a shareable URL

5. **Verify Share Link**
   - Check that the share URL is displayed
   - Format should be: `https://www.circletel.co.za/quotes/share/[TOKEN]`
   - Click the "Copy" button
   - Verify the "Copied!" confirmation appears

### Expected Results:

✅ Share dialog opens with generated URL
✅ URL contains a unique share token
✅ Copy button works and shows "Copied!" feedback
✅ "Email Link" button opens email client with pre-filled subject and body

---

## Test Scenario 2: Access Quote via Share Link

### Steps:

1. **Open Incognito/Private Window**
   - Open a new incognito/private browser window
   - This ensures no admin session is active

2. **Navigate to Share Link**
   - Paste the copied share URL
   - Example: `http://localhost:3001/quotes/share/[TOKEN]`

3. **Observe Loading State**
   - Should see "Loading Quote..." message with spinner
   - CircleTel branding should be visible

4. **Verify Redirect**
   - Should automatically redirect to `/quotes/business/[ID]/preview`
   - Quote should display in full preview mode

### Expected Results:

✅ Loading state appears briefly
✅ Automatic redirect to quote preview
✅ Quote displays with all details
✅ No admin navigation visible (public view)

---

## Test Scenario 3: Verify Tracking Data

### Steps:

1. **Return to Admin Panel**
   - Go back to the admin browser window
   - Navigate to the same quote detail page

2. **Check Quote Analytics** (Future feature - coming soon)
   - Will show tracking statistics:
     - Total views
     - Unique views
     - Time spent
     - Viewer locations

3. **Verify Database Tracking**
   - Run: `node scripts/get-tracking-data.js [QUOTE_ID]`
   - Should see tracking events in database

### Expected Results:

✅ View event recorded in `quote_tracking` table
✅ Session ID captured
✅ Viewer IP and user agent recorded
✅ Timestamp logged

---

## Test Scenario 4: Share Link Error Handling

### Test 4A: Invalid Token

**Steps:**
1. Navigate to `http://localhost:3001/quotes/share/invalid-token-123`
2. Should see error: "Quote Not Found"
3. Error message explains link may be expired or revoked
4. Contact information displayed

**Expected Results:**
✅ Error page displays
✅ User-friendly error message
✅ CircleTel contact details shown

### Test 4B: Revoked Link

**Steps:**
1. Generate a share link for a quote
2. In admin panel, click "Revoke" (future feature)
3. Try accessing the share link
4. Should see error: "This share link has been revoked"

**Expected Results:**
✅ 403 Forbidden status
✅ Clear error message

### Test 4C: Expired Link

**Steps:**
1. Create a quote with `share_expires_at` set to past date
2. Try accessing the share link
3. Should see error: "This share link has expired"

**Expected Results:**
✅ 410 Gone status
✅ Clear expiration message

---

## Test Scenario 5: Email Share Link

### Steps:

1. **Generate Share Link**
   - Click "Share Quote" button
   - Share dialog opens

2. **Click "Email Link"**
   - Click the purple "Email Link" button
   - Default email client should open

3. **Verify Email**
   - Subject: "CircleTel Quote BQ-2025-XXX"
   - Body: "View your quote: [SHARE_URL]"

4. **Send Test Email**
   - Send email to your test address
   - Click link in email
   - Should redirect to quote preview

### Expected Results:

✅ Email client opens automatically
✅ Subject and body pre-filled
✅ Link in email works correctly
✅ Tracking records "email_sent" event

---

## Test Scenario 6: Multiple Views Tracking

### Steps:

1. **First View**
   - Access share link in incognito window
   - Stay on page for 10 seconds
   - Close window

2. **Second View (Same Session)**
   - Re-open share link in new incognito window
   - Stay for 5 seconds
   - Close window

3. **Third View (Different Device)**
   - Access share link from phone/tablet
   - Stay for 15 seconds

4. **Check Analytics**
   - In admin panel, view tracking data
   - Should show:
     - Total views: 3
     - Unique sessions: 2 (depending on session tracking)
     - Total time: 30 seconds

### Expected Results:

✅ Each view logged separately
✅ Session IDs tracked
✅ Time spent aggregated
✅ Multiple devices detected

---

## Database Verification

### Check Share Token

```sql
SELECT
  id,
  quote_number,
  share_token,
  share_enabled,
  share_expires_at
FROM business_quotes
WHERE id = '[QUOTE_ID]';
```

### Check Tracking Events

```sql
SELECT
  event_type,
  viewer_ip,
  session_id,
  time_spent_seconds,
  created_at,
  metadata
FROM quote_tracking
WHERE quote_id = '[QUOTE_ID]'
ORDER BY created_at DESC;
```

### Check Analytics View

```sql
SELECT * FROM quote_analytics
WHERE quote_id = '[QUOTE_ID]';
```

---

## API Testing (with Authentication)

### Generate Share Link (Admin Only)

```bash
curl -X POST http://localhost:3001/api/quotes/business/[QUOTE_ID]/share \
  -H "Content-Type: application/json" \
  -H "Cookie: [ADMIN_SESSION_COOKIE]"
```

### Resolve Share Token (Public)

```bash
curl http://localhost:3001/api/quotes/share/[TOKEN]
```

### Track View Event (Public)

```bash
curl -X POST http://localhost:3001/api/quotes/business/[QUOTE_ID]/track \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "view",
    "session_id": "test-session-123",
    "time_spent_seconds": 45
  }'
```

### Get Tracking Data (Admin Only)

```bash
curl http://localhost:3001/api/quotes/business/[QUOTE_ID]/track \
  -H "Cookie: [ADMIN_SESSION_COOKIE]"
```

---

## Known Issues & Limitations

### Current Limitations:

1. **Tracking Analytics Dashboard**: Not yet implemented
   - View events are recorded but no admin UI to view them yet
   - Planned for next phase

2. **Geolocation**: Basic IP tracking only
   - Viewer location detection not yet implemented
   - Requires IP geolocation service integration

3. **Email Tracking**: Basic implementation
   - No webhook to track when email is actually sent
   - Tracks when "Email Link" button is clicked only

4. **Link Expiration**: Manual only
   - No automatic expiration based on time
   - Admin must manually set `share_expires_at` in database

---

## Success Criteria

| Feature | Status |
|---------|--------|
| Generate share link | ✅ Implemented |
| Copy to clipboard | ✅ Implemented |
| Email share link | ✅ Implemented |
| Public share page | ✅ Implemented |
| Token resolution | ✅ Implemented |
| View tracking | ✅ Implemented |
| Session tracking | ✅ Implemented |
| Time spent tracking | ✅ Implemented |
| Error handling | ✅ Implemented |
| Analytics dashboard | ⏳ Pending |
| Geolocation | ⏳ Pending |
| Email webhooks | ⏳ Pending |

---

## Test Data

### Sample Quote IDs:
- `8baa3d9e-08cd-4d50-8237-eb6149552d90` (BQ-2025-013)
- `ba33720a-e860-4f38-973d-365a5243581c` (BQ-2025-012)
- `aa07d168-037d-4a96-9bd1-58c6850ab269` (BQ-2025-011)

### Sample Admin Users:
Run `node scripts/get-quote-id.js` to see available quotes in your database.

---

## Troubleshooting

### Issue: Share link generates but doesn't work

**Solution:**
1. Check migration was applied: `node scripts/get-quote-id.js`
2. Verify `share_token` column exists in `business_quotes` table
3. Check `quote_tracking` table exists
4. Restart dev server

### Issue: Tracking not recording

**Solution:**
1. Check RLS policies in Supabase
2. Verify anon key has INSERT permission on `quote_tracking`
3. Check browser console for errors
4. Verify API routes are accessible

### Issue: "Unauthorized" error when generating link

**Solution:**
1. Ensure you're logged in as admin
2. Check admin session cookie is valid
3. Verify admin user has permissions
4. Try logging out and back in

---

## Next Steps

After manual testing is complete:

1. ✅ Verify all test scenarios pass
2. ⏳ Create tracking analytics dashboard
3. ⏳ Add IP geolocation service
4. ⏳ Implement link expiration automation
5. ⏳ Add email webhook tracking
6. ⏳ Create automated E2E tests with Playwright

---

**Last Updated**: 2025-11-05
**Version**: 1.0
**Status**: Ready for Testing
