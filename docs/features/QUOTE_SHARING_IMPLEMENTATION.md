# Quote Sharing & Tracking System - Implementation Summary

## Overview

Implemented a complete shareable quote link system with comprehensive tracking capabilities for CircleTel business quotes.

**Status**: ✅ Implemented and Ready for Testing
**Date**: November 5, 2025
**Sprint**: Quote Management Enhancement

---

## Feature Requirements

### Original Request
"Create a shareable link for the quote that can be shared with a user or sales agent. The link must be trackable - we must be able to monitor when the link is clicked and opened."

### Implemented Capabilities

1. **Shareable Links**
   - Unique, URL-safe share tokens for each quote
   - Cryptographically secure token generation (24 bytes, base64url encoded)
   - Optional expiration dates
   - Enable/disable sharing per quote
   - Revocation capability

2. **Tracking & Analytics**
   - View tracking (when links are opened)
   - Time-spent tracking (how long viewers engage)
   - Session tracking (unique vs. repeat views)
   - Viewer information (IP, user agent, referrer)
   - UTM parameter tracking (campaign source, medium, campaign)
   - Event types: view, email_sent, shared, downloaded

3. **Admin Interface**
   - "Share Quote" button in quote detail page
   - Copy-to-clipboard functionality
   - Email share integration
   - Visual feedback (loading states, copied confirmation)

4. **Public Quote Access**
   - Clean, branded public quote preview
   - Automatic tracking when accessed
   - Error handling for invalid/expired/revoked links
   - Seamless redirect from share token to quote preview

---

## Architecture

### Database Schema

#### 1. `quote_tracking` Table

Primary tracking table for all quote interactions:

```sql
CREATE TABLE public.quote_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES business_quotes(id) ON DELETE CASCADE,

  -- Event tracking
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'email_sent', 'shared', 'downloaded')),

  -- Viewer information
  viewer_ip TEXT,
  viewer_user_agent TEXT,
  viewer_location JSONB,
  viewer_email TEXT,
  viewer_name TEXT,

  -- Campaign tracking
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  -- Session tracking
  session_id TEXT,
  time_spent_seconds INTEGER DEFAULT 0,

  -- Admin tracking
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,

  -- Metadata
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_quote_tracking_quote_id` - Fast lookups by quote
- `idx_quote_tracking_event_type` - Filter by event type
- `idx_quote_tracking_created_at` - Time-based queries
- `idx_quote_tracking_session_id` - Session-based analytics

#### 2. `business_quotes` Extensions

Added columns to support share functionality:

```sql
ALTER TABLE public.business_quotes
  ADD COLUMN share_token TEXT UNIQUE,
  ADD COLUMN share_enabled BOOLEAN DEFAULT true,
  ADD COLUMN share_expires_at TIMESTAMPTZ;
```

**Index:**
- `idx_business_quotes_share_token` - Fast token lookups

#### 3. `quote_analytics` View

Real-time analytics aggregation:

```sql
CREATE OR REPLACE VIEW public.quote_analytics AS
SELECT
  q.id AS quote_id,
  q.quote_number,
  q.company_name,
  q.contact_email,
  q.status,
  COUNT(DISTINCT qt.id) FILTER (WHERE qt.event_type = 'view') AS total_views,
  COUNT(DISTINCT qt.session_id) FILTER (WHERE qt.event_type = 'view') AS unique_views,
  COUNT(DISTINCT qt.id) FILTER (WHERE qt.event_type = 'email_sent') AS emails_sent,
  COUNT(DISTINCT qt.id) FILTER (WHERE qt.event_type = 'shared') AS shares,
  COUNT(DISTINCT qt.id) FILTER (WHERE qt.event_type = 'downloaded') AS downloads,
  MAX(qt.created_at) FILTER (WHERE qt.event_type = 'view') AS last_viewed_at,
  COALESCE(SUM(qt.time_spent_seconds) FILTER (WHERE qt.event_type = 'view'), 0) AS total_time_spent_seconds,
  q.created_at AS quote_created_at
FROM public.business_quotes q
LEFT JOIN public.quote_tracking qt ON q.id = qt.quote_id
GROUP BY q.id, q.quote_number, q.company_name, q.contact_email, q.status, q.created_at;
```

### Row Level Security (RLS)

#### Public Access Policies

```sql
-- Allow anyone to insert tracking events (for public quote views)
CREATE POLICY "Allow public to track quote views"
  ON quote_tracking FOR INSERT WITH CHECK (true);
```

#### Admin Access Policies

```sql
-- Allow admins to view all tracking data
CREATE POLICY "Allow admins to view all tracking data"
  ON quote_tracking FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()));
```

---

## API Routes

### 1. Generate/Revoke Share Link

**Endpoint**: `POST /api/quotes/business/[id]/share`
**Auth**: Admin Only
**Purpose**: Generate unique shareable link for a quote

**Request**: (No body required)

**Response**:
```json
{
  "success": true,
  "data": {
    "share_url": "https://www.circletel.co.za/quotes/share/ABC123...",
    "share_token": "ABC123XYZ789...",
    "quote_number": "BQ-2025-013"
  }
}
```

**Features**:
- Reuses existing token if available
- Generates new crypto-secure token if needed
- Tracks "shared" event in database
- Links admin user to share action

---

**Endpoint**: `DELETE /api/quotes/business/[id]/share`
**Auth**: Admin Only
**Purpose**: Revoke existing share link

**Response**:
```json
{
  "success": true,
  "message": "Share link revoked successfully"
}
```

---

### 2. Resolve Share Token

**Endpoint**: `GET /api/quotes/share/[token]`
**Auth**: Public
**Purpose**: Convert share token to quote ID with validation

**Response** (Success):
```json
{
  "success": true,
  "data": {
    "quote_id": "8baa3d9e-08cd-4d50-8237-eb6149552d90",
    "quote_number": "BQ-2025-013"
  }
}
```

**Response** (Error - Revoked):
```json
{
  "success": false,
  "error": "This share link has been revoked"
}
```
HTTP Status: 403

**Response** (Error - Expired):
```json
{
  "success": false,
  "error": "This share link has expired"
}
```
HTTP Status: 410

**Validations**:
1. Token exists in database
2. Share is enabled (`share_enabled = true`)
3. Link hasn't expired (`share_expires_at > NOW()` or null)

---

### 3. Track Quote Events

**Endpoint**: `POST /api/quotes/business/[id]/track`
**Auth**: Public (for view tracking), Admin (for retrieving analytics)
**Purpose**: Record quote interaction events

**Request**:
```json
{
  "event_type": "view",
  "session_id": "uuid-session-identifier",
  "viewer_email": "optional@example.com",
  "viewer_name": "Optional Name",
  "time_spent_seconds": 45,
  "metadata": {
    "via_share_link": true,
    "custom_data": "any"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Event tracked successfully"
}
```

**Automatically Captures**:
- Viewer IP address (from headers)
- User agent string
- Referrer URL
- UTM parameters (utm_source, utm_medium, utm_campaign)
- Timestamp

---

**Endpoint**: `GET /api/quotes/business/[id]/track`
**Auth**: Admin Only
**Purpose**: Retrieve tracking analytics for a quote

**Response**:
```json
{
  "success": true,
  "data": {
    "quote_id": "8baa3d9e-08cd-4d50-8237-eb6149552d90",
    "quote_number": "BQ-2025-013",
    "company_name": "Erhard 8",
    "status": "draft",
    "total_views": 15,
    "unique_views": 8,
    "emails_sent": 2,
    "shares": 1,
    "downloads": 3,
    "total_time_spent_seconds": 320,
    "last_viewed_at": "2025-11-05T10:30:00Z",
    "tracking_events": [
      {
        "id": "...",
        "event_type": "view",
        "viewer_ip": "41.185.x.x",
        "viewer_user_agent": "Mozilla/5.0...",
        "session_id": "...",
        "time_spent_seconds": 45,
        "created_at": "2025-11-05T10:30:00Z"
      }
    ]
  }
}
```

---

## Frontend Components

### 1. Admin Quote Detail Page

**File**: `app/admin/quotes/[id]/page.tsx`

**Added Features**:

1. **Share Quote Button**
   - Purple button with share icon
   - Loading state during share generation
   - Positioned next to Download PDF button

2. **Share Dialog Modal**
   - Displays generated share URL
   - Copy-to-clipboard button with feedback
   - "Email Link" button (opens mailto:)
   - Tracking explanation for users

**State Management**:
```typescript
const [showShareDialog, setShowShareDialog] = useState(false);
const [shareUrl, setShareUrl] = useState<string | null>(null);
const [sharingLoading, setSharingLoading] = useState(false);
const [copied, setCopied] = useState(false);
```

**Handler Functions**:
- `handleGenerateShareLink()` - Calls share API
- `handleCopyLink()` - Clipboard API with feedback
- `handleRevokeShareLink()` - Revokes access (future)

---

### 2. Public Share Page

**File**: `app/quotes/share/[token]/page.tsx`

**Flow**:
1. Resolve share token via API
2. Track view event automatically
3. Create/retrieve session ID from sessionStorage
4. Redirect to quote preview page

**Features**:
- Loading state with CircleTel branding
- Error handling with user-friendly messages
- Contact information on error pages
- Automatic session tracking

**Error States**:
- Invalid token
- Revoked link
- Expired link
- Network errors

---

### 3. Quote Preview Page (Enhanced)

**File**: `app/quotes/business/[id]/preview/page.tsx`

**Added Tracking**:
- View event on page load
- Time spent tracking (on unload)
- Session ID management
- Minimum 5-second threshold for time tracking

**Implementation**:
```typescript
useEffect(() => {
  // Get or create session ID
  let sessionId = sessionStorage.getItem('quote_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('quote_session_id', sessionId);
  }

  // Track initial view
  fetch(`/api/quotes/business/${quoteId}/track`, {
    method: 'POST',
    body: JSON.stringify({
      event_type: 'view',
      session_id: sessionId,
      metadata: { quote_number, page_url: window.location.href }
    })
  });

  // Track time spent
  const startTime = Date.now();
  const trackTimeSpent = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    if (timeSpent > 5) {
      fetch(/* ... track time spent ... */);
    }
  };

  window.addEventListener('beforeunload', trackTimeSpent);
  return () => {
    window.removeEventListener('beforeunload', trackTimeSpent);
    trackTimeSpent();
  };
}, [quote, quoteId]);
```

---

## Files Created/Modified

### Database

| File | Status | Description |
|------|--------|-------------|
| `supabase/migrations/20251105000001_create_quote_tracking.sql` | ✅ Created | Complete migration with tables, views, RLS policies |

### API Routes

| File | Status | Description |
|------|--------|-------------|
| `app/api/quotes/business/[id]/share/route.ts` | ✅ Created | Generate/revoke share links |
| `app/api/quotes/share/[token]/route.ts` | ✅ Created | Resolve share tokens |
| `app/api/quotes/business/[id]/track/route.ts` | ✅ Created | Track events & retrieve analytics |

### Frontend Pages

| File | Status | Description |
|------|--------|-------------|
| `app/quotes/share/[token]/page.tsx` | ✅ Created | Public shareable quote page |
| `app/quotes/business/[id]/preview/page.tsx` | ✅ Modified | Added tracking to preview |
| `app/admin/quotes/[id]/page.tsx` | ✅ Modified | Added Share button & dialog |

### Scripts

| File | Status | Description |
|------|--------|-------------|
| `scripts/test-quote-sharing.js` | ✅ Created | Automated test suite |
| `scripts/get-quote-id.js` | ✅ Created | Fetch quote IDs for testing |

### Documentation

| File | Status | Description |
|------|--------|-------------|
| `docs/testing/QUOTE_SHARING_TESTING_GUIDE.md` | ✅ Created | Comprehensive manual testing guide |
| `docs/features/QUOTE_SHARING_IMPLEMENTATION.md` | ✅ Created | This document |

---

## Security Considerations

### 1. Share Link Generation

- **Admin Only**: Only authenticated admin users can generate share links
- **Crypto-Secure Tokens**: Uses `crypto.randomBytes(24)` for token generation
- **Unique Constraint**: Database enforces token uniqueness
- **Collision Detection**: Token regeneration loop ensures uniqueness

### 2. Public Access

- **Limited Information**: Share links only expose quote preview, not sensitive admin data
- **Revocable**: Admins can disable sharing at any time
- **Expirable**: Optional expiration dates supported
- **Read-Only**: Public users cannot modify quote data

### 3. Tracking Privacy

- **Anonymous by Default**: No personal data required for tracking
- **IP Capture**: Standard practice for security/analytics
- **No Authentication Required**: Tracking doesn't require user login
- **GDPR Considerations**: IP addresses are pseudonymous data

### 4. Rate Limiting

**Recommended (Not Yet Implemented)**:
- Limit share link generation per admin per hour
- Rate limit tracking API to prevent spam
- Implement CAPTCHA for suspicious traffic

---

## Performance Optimizations

### Database Indexes

All critical columns indexed for fast queries:
- Quote ID lookups
- Event type filtering
- Time-based queries
- Session tracking

### Caching Strategy

**Future Enhancement**:
- Cache share token to quote ID mapping (Redis)
- Cache analytics data (5-minute refresh)
- CDN caching for public quote previews

### Query Optimization

- `quote_analytics` view pre-aggregates data
- Efficient JOINs with proper foreign keys
- Partial index on share_token (WHERE NOT NULL)

---

## Testing Strategy

### Manual Testing

See `docs/testing/QUOTE_SHARING_TESTING_GUIDE.md` for complete manual test scenarios:

1. Generate share link
2. Access quote via share link
3. Verify tracking data
4. Test error handling
5. Email share link
6. Multiple views tracking

### Automated Testing (Future)

**Planned E2E Tests** (Playwright):
```javascript
test('should generate and use share link', async ({ page, context }) => {
  // Login as admin
  await page.goto('/admin/quotes/[id]');
  await page.click('[data-testid="share-quote-btn"]');

  // Get share URL
  const shareUrl = await page.locator('[data-testid="share-url"]').textContent();

  // Open in new context (simulates incognito)
  const newContext = await browser.newContext();
  const newPage = await newContext.newPage();
  await newPage.goto(shareUrl);

  // Verify redirect to preview
  await expect(newPage).toHaveURL(/\/quotes\/business\/.*\/preview/);

  // Verify tracking recorded
  // ... check database ...
});
```

---

## Known Limitations

### Current Version (v1.0)

1. **No Analytics Dashboard**
   - Tracking data is recorded but no UI to view it yet
   - Planned for next phase

2. **Basic IP Tracking**
   - No geolocation lookup
   - No ISP/organization detection
   - Future: Integrate IP geolocation service (MaxMind, IPinfo)

3. **Manual Expiration**
   - No automatic link expiration
   - Admin must set `share_expires_at` manually
   - Future: Add expiration options in UI

4. **No Email Webhooks**
   - "Email Link" button just opens mailto:
   - No tracking of actual email delivery/opens
   - Future: Integrate with email service provider

5. **Session Tracking**
   - Browser-based (sessionStorage)
   - Cleared when all tabs closed
   - Not tied to user accounts

---

## Future Enhancements

### Phase 2: Analytics Dashboard

**Admin UI for viewing tracking data:**
- Total views counter
- Unique visitors chart
- Geographic map of viewers
- Time spent histogram
- Referrer analysis
- Device/browser breakdown

**Mockup Location**: `app/admin/quotes/[id]/analytics/page.tsx`

### Phase 3: Advanced Tracking

**IP Geolocation**:
- Country, region, city detection
- Coordinates for map visualization
- ISP/organization identification

**Device Fingerprinting**:
- Screen resolution
- Device type (mobile/tablet/desktop)
- Browser capabilities
- Timezone

### Phase 4: Email Integration

**Transactional Email Service**:
- SendGrid/Resend/Postmark integration
- Email open tracking
- Click tracking
- Bounce/spam reporting

### Phase 5: Link Management

**Enhanced Controls**:
- Bulk link generation
- Link expiration UI (dropdown: 24h, 7d, 30d, never)
- One-time use links
- Password-protected links
- Custom vanity URLs

---

## Success Metrics

### Implementation Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Database tables created | 1 + 2 modifications | ✅ 1 + 2 | Complete |
| API routes implemented | 3 | ✅ 3 | Complete |
| Frontend components | 3 | ✅ 3 | Complete |
| RLS policies | 2 | ✅ 2 | Complete |
| Test coverage | Manual guide | ✅ Complete | Ready |

### Business Metrics (To Track After Launch)

- **Share Link Usage**: % of quotes that get shared
- **Engagement**: Average time spent on shared quotes
- **Conversion**: % of shared quotes that get accepted
- **Reach**: Average unique viewers per shared quote
- **Source**: Which channels drive most traffic (email, WhatsApp, etc.)

---

## Deployment Checklist

### Pre-Deployment

- [x] Database migration created
- [x] Migration applied to dev database
- [x] API routes tested locally
- [x] Frontend components working
- [x] Manual testing guide created
- [ ] Type check passes (in progress)
- [ ] Build succeeds
- [ ] Manual testing completed

### Deployment

- [ ] Apply migration to staging database
- [ ] Deploy to staging
- [ ] Test on staging environment
- [ ] Apply migration to production database
- [ ] Deploy to production
- [ ] Verify in production

### Post-Deployment

- [ ] Monitor error logs
- [ ] Check tracking data collection
- [ ] Verify performance metrics
- [ ] Gather user feedback
- [ ] Plan analytics dashboard

---

## API Reference Summary

### Generate Share Link
```
POST /api/quotes/business/{id}/share
Auth: Admin Required
Returns: { share_url, share_token, quote_number }
```

### Revoke Share Link
```
DELETE /api/quotes/business/{id}/share
Auth: Admin Required
Returns: { success, message }
```

### Resolve Token
```
GET /api/quotes/share/{token}
Auth: Public
Returns: { quote_id, quote_number }
Errors: 403 (revoked), 404 (not found), 410 (expired)
```

### Track Event
```
POST /api/quotes/business/{id}/track
Auth: Public
Body: { event_type, session_id, viewer_email, viewer_name, time_spent_seconds, metadata }
Returns: { success }
```

### Get Analytics
```
GET /api/quotes/business/{id}/track
Auth: Admin Required
Returns: { total_views, unique_views, emails_sent, shares, downloads, tracking_events[] }
```

---

## Support & Maintenance

### Monitoring

**Key Metrics to Watch**:
- API error rates (track 4xx, 5xx responses)
- Database query performance (slow queries)
- Tracking event volume (events per minute)
- Share link generation rate

### Troubleshooting

**Common Issues**:

1. **"Unauthorized" when generating link**
   - Check admin session cookie
   - Verify user has admin role

2. **Share link doesn't redirect**
   - Verify migration applied
   - Check share_token exists
   - Ensure share_enabled = true

3. **Tracking not recording**
   - Check RLS policies
   - Verify anon key permissions
   - Check browser console errors

### Database Maintenance

**Regular Tasks**:
- Archive old tracking events (>90 days)
- Clean up orphaned share tokens
- Reindex tracking tables quarterly
- Vacuum analyze tracking tables monthly

---

## Conclusion

The Quote Sharing & Tracking system is fully implemented and ready for testing. All core requirements have been met:

✅ Shareable links with unique tokens
✅ Comprehensive event tracking
✅ Admin interface for link generation
✅ Public quote access with error handling
✅ Session and time-spent tracking
✅ Security via RLS policies
✅ Complete documentation and testing guide

The system is production-ready pending final type checks and manual testing verification.

---

**Implementation Team**: Jeffrey de Wee + Claude Code
**Date Completed**: November 5, 2025
**Next Phase**: Analytics Dashboard (Phase 2)
**Contact**: jeffrey.de.wee@circletel.co.za
