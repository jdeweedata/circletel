# Admin Integrations Module - UI Testing Guide

**Created**: 2025-11-17
**Dev Server**: http://localhost:3001
**Admin Credentials**:
- Email: `devadmin@circletel.co.za`
- Password: `aQp6vK8bBfNVB4C!`

---

## 🎯 Quick Start Testing

1. **Dev server is already running** at http://localhost:3001
2. **Login**: http://localhost:3001/admin/login
3. **Navigate**: Click "Integrations" in sidebar
4. **Test both pages**:
   - Overview Dashboard: http://localhost:3001/admin/integrations
   - OAuth Management: http://localhost:3001/admin/integrations/oauth

---

## 📊 Page 1: Overview Dashboard

**URL**: http://localhost:3001/admin/integrations

### ✅ Quick Visual Check (2 minutes)

Open the page and verify:
- [ ] Page loads without errors (check browser console - F12)
- [ ] "Integrations" header displays
- [ ] 6 health summary cards visible at top
- [ ] Integration grid shows below
- [ ] Search and filter controls present
- [ ] Sidebar menu shows "Integrations" section

### ✅ Health Summary Cards

Verify all 6 cards display with correct icons and colors:

| Card | Icon | Color | Should Show |
|------|------|-------|-------------|
| Total Integrations | CheckCircle2 | Blue | Total count of integrations |
| Healthy | CheckCircle2 | Green | Count of healthy integrations |
| Degraded | AlertTriangle | Yellow | Count of degraded integrations |
| Down | XCircle | Red | Count of down integrations |
| Unknown | HelpCircle | Gray | Count with unknown status |
| Active Alerts | Bell | Orange | Count of active alerts |

### ✅ Integration Grid

Expected integrations (9 total):
1. **Didit KYC** - Authentication
2. **Google Maps** - Maps
3. **NetCash** - Payment
4. **Resend Email** - Email
5. **Strapi CMS** - CMS
6. **Zoho Billing** - CRM
7. **Zoho CRM** - CRM
8. **Zoho Mail** - Email
9. **Zoho Sign** - CRM

Each card should show:
- [ ] Integration name (bold)
- [ ] Category badge (outline)
- [ ] Health status icon (top-right, color-coded)
- [ ] Description text
- [ ] Health status badge with label
- [ ] Last health check time ("Checked X ago")
- [ ] OAuth/Webhook indicators (if applicable)
- [ ] "View Details" button

### ✅ Search Functionality

Test search:
1. **Type "zoho"** → Should show 4 Zoho integrations only
2. **Type "kyc"** → Should show Didit KYC only
3. **Type "payment"** → Should show NetCash only
4. **Clear search** → All 9 integrations return
5. **Check active filter badge** → Shows "Search: xyz"
6. **Click "Clear all"** → Removes filter

### ✅ Category Filter

Test category dropdown:
1. **Click dropdown** → Lists all unique categories
2. **Select "CRM"** → Shows Zoho integrations (3-4)
3. **Select "Email"** → Shows Resend + Zoho Mail
4. **Select "All Categories"** → Shows all 9
5. **Check filter badge** → Shows "Category: xyz"

### ✅ Health Status Filter

Test health dropdown:
1. **Select "Healthy"** → Shows only healthy integrations
2. **Select "Degraded"** → Shows only degraded (may be 0)
3. **Select "Down"** → Shows only down (may be 0)
4. **Select "Unknown"** → Shows unknown status integrations
5. **Select "All Status"** → Shows all 9

###  ✅ Combined Filters

Test multiple filters together:
1. **Search "zoho" + Category "CRM"** → Should show 3-4 Zoho CRM integrations
2. **Verify both filter badges show**
3. **Click "Clear all"** → Both filters removed

### ✅ Empty State

1. **Search for "nonexistent"**
2. **Verify empty state shows**:
   - Activity icon
   - "No integrations found" message
   - "Try adjusting your filters" text

### ✅ Refresh Button

1. **Click "Refresh" button** (top-right)
2. **Verify**:
   - Button shows loading spinner
   - Data reloads
   - Console shows API call to `/api/admin/integrations/health`

### ✅ Responsive Design

Test at different widths:
- **375px (Mobile)**: Cards stack vertically, filters stack
- **768px (Tablet)**: 2-column grid
- **1440px (Desktop)**: 3-column grid

---

## 🔐 Page 2: OAuth Management

**URL**: http://localhost:3001/admin/integrations/oauth

### ✅ Quick Visual Check (2 minutes)

Open the page and verify:
- [ ] Page loads without errors
- [ ] "OAuth Management" header displays
- [ ] 5 summary cards visible
- [ ] OAuth token table displays
- [ ] Refresh button (top-right) present

### ✅ OAuth Summary Cards

Verify all 5 cards:

| Card | Icon | Color | Should Show |
|------|------|-------|-------------|
| Total Tokens | Key | Blue | Total OAuth tokens |
| Active | CheckCircle2 | Green | Active tokens |
| Expiring Soon | AlertTriangle | Yellow | Tokens expiring in ≤7 days |
| Expired | XCircle | Red | Expired tokens |
| Revoked | Trash2 | Gray | Revoked tokens |

### ✅ OAuth Token Table

Table should show these OAuth-enabled integrations:
1. **Zoho CRM**
2. **Zoho Billing**
3. **Zoho Mail**
4. **Zoho Sign**
5. **Didit KYC** (if OAuth configured)
6. **Google Maps** (if OAuth configured)

Columns to verify:
- [ ] Integration name
- [ ] Status badge (Active/Expired/Revoked)
- [ ] Expires badge with date
- [ ] Last Refreshed time
- [ ] Refresh Count number
- [ ] Actions (Refresh and Revoke buttons)

### ✅ Token Expiry Badges

Check badge colors based on expiry:

| Days Until Expiry | Badge Color | Icon | Example |
|-------------------|-------------|------|---------|
| >30 days | Green | CheckCircle2 | "45 days" |
| 8-30 days | Blue | Calendar | "15 days" |
| 1-7 days | Yellow | AlertTriangle | "3 days" |
| Expired | Red | XCircle | "Expired" |
| No expiry | Gray | Calendar | "No expiry" |

Expiry date should show below badge (e.g., "Dec 25, 2025")

### ✅ Refresh Token

Test token refresh:
1. **Click refresh button** (circular arrow) on any active token
2. **Verify**:
   - Button shows loading spinner
   - Other buttons remain enabled
   - Console shows POST to `/api/admin/integrations/oauth/[id]/refresh`
3. **After success**:
   - "Last Refreshed" updates to "Just now"
   - "Refresh Count" increments by 1
   - No errors in console

### ✅ Revoke Token

Test revocation flow:
1. **Click revoke button** (trash icon) on any active token
2. **Verify dialog appears**:
   - Title: "Revoke OAuth Token?"
   - Shows integration name in bold
   - Warning message about consequences
   - "Cancel" and "Revoke Token" buttons
3. **Click "Cancel"** → Dialog closes, no action
4. **Click revoke again**
5. **Click "Revoke Token" (red button)**
6. **Verify**:
   - Loading spinner shows
   - Console shows POST to `/api/admin/integrations/oauth/[id]/revoke`
   - Token status changes to "Revoked" (gray badge)
   - Refresh and Revoke buttons become disabled

### ✅ Disabled States

After revoking a token:
- [ ] Both action buttons are disabled
- [ ] Buttons are grayed out
- [ ] Clicking does nothing
- [ ] No hover effects

### ✅ Empty State

If no OAuth tokens exist:
- [ ] Key icon displays
- [ ] "No OAuth tokens found" message
- [ ] Helpful description text

### ✅ Error Handling

Test error states:
1. **Open DevTools** (F12) → Network tab
2. **Set network to "Offline"**
3. **Click "Refresh" button** (top-right)
4. **Verify error state**:
   - Red error card displays
   - XCircle icon shows
   - Error message is clear
   - "Try Again" button present
5. **Set network back to "Online"**
6. **Click "Try Again"** → Data loads successfully

### ✅ Responsive Design

Test at different widths:
- **375px (Mobile)**: Cards stack vertically, table scrolls horizontally
- **768px (Tablet)**: Cards in 2-3 columns
- **1440px (Desktop)**: Cards in 5 columns

---

## 🔍 Console Testing

### Check for Errors

1. **Open browser console** (F12)
2. **Navigate to both pages**
3. **Verify no errors** in console
4. **Check Network tab**:
   - Verify API calls succeed (status 200)
   - Check request/response payloads

### API Calls to Verify

**Overview Dashboard**:
```
GET /api/admin/integrations/health
```

**OAuth Management**:
```
GET /api/admin/integrations/oauth
POST /api/admin/integrations/oauth/[id]/refresh (when refresh clicked)
POST /api/admin/integrations/oauth/[id]/revoke (when revoke confirmed)
```

---

## 🐛 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "Unauthorized" error | Login as admin, check credentials |
| Empty data / No integrations | Check backend APIs deployed, database seeded |
| Console errors | Check browser console, fix import/component errors |
| Styling broken | Clear `.next` folder, restart dev server |
| CORS errors | Ensure API routes in `/api/` directory |
| Slow loading | Check network tab, verify API response times |

---

## ✅ Quick Checklist

Copy and paste to track your testing:

```markdown
## Testing Results - [Your Name] - [Date]

### Overview Dashboard (/admin/integrations)
- [ ] ✅ Page loads successfully
- [ ] ✅ 6 summary cards display correctly
- [ ] ✅ 9 integrations show in grid
- [ ] ✅ Search works
- [ ] ✅ Category filter works
- [ ] ✅ Health status filter works
- [ ] ✅ Combined filters work
- [ ] ✅ Empty state shows correctly
- [ ] ✅ Refresh button works
- [ ] ✅ Responsive on mobile/tablet/desktop
- [ ] ✅ No console errors

### OAuth Management (/admin/integrations/oauth)
- [ ] ✅ Page loads successfully
- [ ] ✅ 5 summary cards display correctly
- [ ] ✅ Token table shows OAuth integrations
- [ ] ✅ Expiry badges color-coded correctly
- [ ] ✅ Refresh token works
- [ ] ✅ Revoke token works (with confirmation)
- [ ] ✅ Revoked tokens are disabled
- [ ] ✅ Empty state shows correctly (if no tokens)
- [ ] ✅ Error handling works (offline test)
- [ ] ✅ Responsive on mobile/tablet/desktop
- [ ] ✅ No console errors

### Issues Found
1. [Issue description if any]
   - Browser:
   - Steps to reproduce:
   - Screenshot:

### Overall Assessment
- [ ] ✅ Ready for next page development
- [ ] ⚠️ Minor issues to fix
- [ ] ❌ Blocker issues found

### Notes
[Any additional observations]
```

---

## 🎯 Success Criteria

Both pages should:
- ✅ Load without console errors
- ✅ Display data correctly from backend APIs
- ✅ Handle user interactions smoothly
- ✅ Show appropriate loading states
- ✅ Handle errors gracefully
- ✅ Be fully responsive (mobile/tablet/desktop)
- ✅ Match CircleTel design (orange/blue/gray colors)
- ✅ Provide good UX (clear labels, helpful messages)

---

## 📸 Screenshots Recommended

For documentation, capture:
1. Overview Dashboard - Full page view
2. Overview Dashboard - Health cards closeup
3. Overview Dashboard - Integration grid
4. Overview Dashboard - Search in action
5. Overview Dashboard - Mobile view
6. OAuth Management - Full page view
7. OAuth Management - Token table
8. OAuth Management - Expiry badges (different colors)
9. OAuth Management - Revoke confirmation dialog
10. OAuth Management - Mobile view

---

## 🚀 Ready to Test!

**Start here**:
1. Open http://localhost:3001/admin/login
2. Login with credentials above
3. Click "Integrations" in sidebar
4. Follow the checklists above

**Questions?**
- Check browser console for errors (F12)
- Verify backend APIs are deployed (they are!)
- Ensure dev server is running at port 3001

Happy testing! 🎉
