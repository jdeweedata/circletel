# Notification System - User Stories

**Feature**: Notification System
**Phase**: 3.4 (Enhancement)
**Priority**: Medium
**Estimated Effort**: 3-4 hours
**Created**: 2025-10-24

---

## Overview

The notification system provides real-time alerts to admin users about important events, system updates, and user activities within the CircleTel platform.

---

## User Stories

### Story 1: View In-App Notifications

**As an** admin user
**I want to** see a notification bell icon in the header with a count of unread notifications
**So that** I can quickly see when new notifications arrive without checking email

**Acceptance Criteria**:
- [ ] Notification bell icon visible in admin header (top-right)
- [ ] Badge shows count of unread notifications (red circle with number)
- [ ] Badge disappears when count is 0
- [ ] Clicking bell opens notification dropdown
- [ ] Dropdown shows last 10 notifications
- [ ] Each notification shows: icon, title, message, timestamp
- [ ] Unread notifications have distinct visual style (bold text, highlight)
- [ ] "View All" link at bottom goes to notification history page
- [ ] Notifications update in real-time (refresh every 30 seconds)
- [ ] Mobile responsive (full-screen panel on mobile)

**Edge Cases**:
- User has 0 notifications (show "No notifications" message)
- User has 99+ notifications (show "99+" badge)
- Network error (show cached notifications + error banner)
- Very long notification message (truncate with "...")

---

### Story 2: Mark Notifications as Read

**As an** admin user
**I want to** mark notifications as read individually or in bulk
**So that** I can keep track of which notifications I've addressed

**Acceptance Criteria**:
- [ ] Clicking a notification marks it as read automatically
- [ ] "Mark as Read" button on each notification in dropdown
- [ ] "Mark All as Read" button at top of dropdown
- [ ] Read notifications change visual style (gray text, no highlight)
- [ ] Badge count decreases when notifications marked read
- [ ] Changes persist across page reloads
- [ ] Changes sync across multiple tabs/devices

**Edge Cases**:
- All notifications already read (disable "Mark All as Read" button)
- API fails to mark as read (show error toast, don't update UI)
- User clicks notification while offline (queue for sync when online)

---

### Story 3: Receive Notification for Product Approval Requests

**As an** admin user with product approval permissions
**I want to** receive a notification when a product is submitted for approval
**So that** I can review and approve/reject it promptly

**Acceptance Criteria**:
- [ ] Notification triggered when product status changes to "pending_approval"
- [ ] Notification includes: product name, submitter name, submission time
- [ ] Notification links directly to product edit page
- [ ] Only sent to users with "products:approve" permission
- [ ] In-app notification appears immediately
- [ ] Email notification sent (if user preferences allow)
- [ ] Notification icon is orange warning icon
- [ ] Notification persists until product is approved/rejected

**Edge Cases**:
- Product deleted before admin views notification (show "Product no longer exists")
- Multiple admins approve simultaneously (show who approved first)
- User lacks permission to view product (don't show notification)

---

### Story 4: Configure Notification Preferences

**As an** admin user
**I want to** configure which notifications I receive and how (in-app, email, both)
**So that** I only get alerts for events relevant to my role

**Acceptance Criteria**:
- [ ] Notification preferences page at `/admin/settings/notifications`
- [ ] List all notification types with descriptions
- [ ] Toggle switches for each type: "In-App" and "Email"
- [ ] Notification types include:
  - Product approval requests
  - Price change alerts
  - System updates
  - User activity (new customers, orders)
  - Error alerts
  - Performance warnings
- [ ] "Save Preferences" button
- [ ] Success toast after saving
- [ ] Preferences persist across sessions
- [ ] Default preferences applied to new users based on role

**Edge Cases**:
- User disables all notifications (show warning: "You won't receive any alerts")
- Email address not configured (disable email toggle, show message)
- Invalid email address (show error, prevent saving)
- Preferences fail to save (show error toast, don't update UI)

---

### Story 5: View Notification History

**As an** admin user
**I want to** view all my past notifications in a searchable, filterable list
**So that** I can find and reference previous alerts

**Acceptance Criteria**:
- [ ] Notification history page at `/admin/notifications`
- [ ] Table shows: icon, type, title, message, timestamp, read status
- [ ] Pagination (50 notifications per page)
- [ ] Filter by: type, read/unread, date range
- [ ] Search by: title or message text
- [ ] Sort by: newest first (default), oldest first, type
- [ ] Click notification to view full details
- [ ] "Mark as Read" action in row menu
- [ ] "Delete" action in row menu (soft delete)
- [ ] "Export to CSV" button
- [ ] Mobile responsive (card layout on mobile)

**Acceptance Criteria (Permissions)**:
- [ ] Requires "notifications:read" permission
- [ ] Users only see their own notifications (RLS enforced)
- [ ] Super admins can view all notifications with filter

**Edge Cases**:
- User has 1000+ notifications (pagination, lazy loading)
- Search returns 0 results (show "No notifications found" message)
- Notification deleted by another session (handle gracefully)
- Very old notifications (show relative time: "3 months ago")

---

### Story 6: Receive Email Notifications

**As an** admin user
**I want to** receive email notifications for critical alerts
**So that** I can respond even when not logged into the platform

**Acceptance Criteria**:
- [ ] Email sent for notification types where user enabled email preference
- [ ] Email subject: "[CircleTel] {Notification Title}"
- [ ] Email body includes: notification message, timestamp, link to platform
- [ ] Email styled with CircleTel branding (orange header, logo)
- [ ] Plain text alternative for email clients without HTML support
- [ ] Unsubscribe link at bottom (updates preferences)
- [ ] Email sent within 5 minutes of event
- [ ] Email includes "View in Platform" button (deep link)

**Edge Cases**:
- User has no email address (skip email, only in-app)
- Email fails to send (log error, don't block notification creation)
- User clicks unsubscribe (update preferences, show confirmation)
- Email marked as spam (provide troubleshooting in docs)

---

### Story 7: Dismiss Notifications

**As an** admin user
**I want to** dismiss notifications I'm not interested in
**So that** they don't clutter my notification list

**Acceptance Criteria**:
- [ ] "Dismiss" button on each notification in dropdown
- [ ] Dismissed notifications removed from dropdown immediately
- [ ] Dismissed notifications still visible in history (marked as "dismissed")
- [ ] "Undo" option for 5 seconds after dismissing
- [ ] Dismissed notifications don't count toward badge count
- [ ] Dismissed notifications can be restored from history

**Edge Cases**:
- User dismisses notification then immediately closes dropdown (persist dismissal)
- Undo timeout expires (notification stays dismissed)
- Network error during dismiss (show error, don't update UI)

---

## Notification Types (Detailed)

### 1. Product Approval Requests
- **Trigger**: Product status changes to "pending_approval"
- **Recipients**: Users with "products:approve" permission
- **Priority**: High
- **Icon**: Orange warning icon
- **Default**: In-App + Email

### 2. Price Change Alerts
- **Trigger**: Product price updated by >10%
- **Recipients**: Users with "products:manage" or "products:approve" permission
- **Priority**: Medium
- **Icon**: Yellow dollar icon
- **Default**: In-App only

### 3. System Updates
- **Trigger**: Platform deployment, new features
- **Recipients**: All admin users
- **Priority**: Low
- **Icon**: Blue info icon
- **Default**: In-App only

### 4. User Activity
- **Trigger**: New customer signup, large order placed
- **Recipients**: Users with "customers:read" or "orders:read" permission
- **Priority**: Medium
- **Icon**: Green user icon
- **Default**: In-App only

### 5. Error Alerts
- **Trigger**: API failures, coverage check failures, payment errors
- **Recipients**: Users with "system:monitor" permission
- **Priority**: Critical
- **Icon**: Red error icon
- **Default**: In-App + Email

### 6. Performance Warnings
- **Trigger**: API response time >5s, cache hit rate <80%
- **Recipients**: Users with "system:monitor" permission
- **Priority**: Medium
- **Icon**: Yellow warning icon
- **Default**: In-App + Email

---

## Success Metrics

### Engagement Metrics
- **Target**: 80% of admins view notifications within 1 hour
- **Target**: 90% of critical notifications acted upon within 24 hours
- **Target**: <5% notification dismiss rate (indicates relevance)

### Performance Metrics
- **Target**: Notifications delivered in <5 seconds
- **Target**: Email notifications sent in <5 minutes
- **Target**: Notification dropdown loads in <1 second

### User Satisfaction
- **Target**: 4.5/5 star rating for notification usefulness
- **Target**: <10% users disable all notifications
- **Target**: 90% of users report timely alerts

---

## Technical Requirements

### Database
- `notifications` table with RLS policies
- `notification_preferences` table
- `notification_types` enum
- Indexes on `user_id`, `created_at`, `is_read`

### API Endpoints
- `GET /api/notifications` - List user notifications
- `POST /api/notifications` - Create notification (system only)
- `PATCH /api/notifications/[id]` - Mark as read/dismissed
- `DELETE /api/notifications/[id]` - Soft delete
- `GET /api/notifications/preferences` - Get user preferences
- `PUT /api/notifications/preferences` - Update preferences

### UI Components
- `NotificationBell.tsx` - Header bell icon with badge
- `NotificationDropdown.tsx` - Dropdown with notification list
- `NotificationPreferences.tsx` - Preferences form
- `NotificationHistory.tsx` - Full history page

### Email Service
- Integration with Resend API
- Email templates in `lib/emails/`
- Queue for bulk email sending

---

## Dependencies

- Supabase (database, RLS)
- Resend API (email sending)
- shadcn/ui (UI components)
- React Query (data fetching)

---

## Out of Scope (Future Phases)

- Push notifications (PWA)
- SMS notifications
- Webhook notifications
- Notification scheduling
- AI-powered notification prioritization
- Notification snoozing

---

## Questions for Product/UX

1. Should notifications auto-dismiss after X days?
2. Should we group similar notifications (e.g., "5 products pending approval")?
3. What's the max notification history to keep (90 days? 1 year?)?
4. Should users be able to mute notifications temporarily?
5. Should we show notification sounds/vibrations (browser API)?

---

**Created By**: Multi-Agent Orchestration System (User Stories Worker)
**Review Status**: Pending review by product team
**Next Steps**: Design database schema and begin implementation
