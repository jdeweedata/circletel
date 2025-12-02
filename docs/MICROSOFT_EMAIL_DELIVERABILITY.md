# Microsoft Email Deliverability Guide

This document outlines the steps required to ensure CircleTel marketing and notification emails are delivered to Microsoft email accounts (Outlook.com, Hotmail, Office 365) without being blocked or quarantined.

## Current Configuration

### Domain: `notify.circletel.co.za`
- **DKIM**: ✅ Verified (via Resend)
- **SPF**: ✅ Verified (`v=spf1 include:amazonses.com ~all`)
- **DMARC**: ⚠️ Needs verification
- **List-Unsubscribe**: ✅ Implemented (RFC 8058 compliant)

## Code Changes Implemented

### 1. List-Unsubscribe Headers (RFC 8058)
Added to both email services:
- `lib/emails/enhanced-notification-service.ts`
- `lib/notifications/notification-service.ts`

When `isMarketingEmail: true` is set, emails include:
```
List-Unsubscribe: <https://circletel.co.za/unsubscribe?email=xxx>, <mailto:unsubscribe@circletel.co.za>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

### 2. One-Click Unsubscribe Endpoint
Updated `app/api/unsubscribe/route.ts` to handle RFC 8058 one-click unsubscribe POST requests.

### Usage Example
```typescript
// For marketing emails, set isMarketingEmail: true
await EmailNotificationService.send({
  to: 'customer@outlook.com',
  subject: 'Special Offer from CircleTel',
  template: 'promotional',
  data: { ... },
  isMarketingEmail: true, // Adds List-Unsubscribe headers
});
```

---

## Required DNS Records

### 1. DMARC Record (Critical for Microsoft)
Add this TXT record to your DNS:

| Type | Name | Value |
|------|------|-------|
| TXT | `_dmarc.circletel.co.za` | `v=DMARC1; p=none; rua=mailto:dmarc@circletel.co.za; pct=100` |
| TXT | `_dmarc.notify.circletel.co.za` | `v=DMARC1; p=none; rua=mailto:dmarc@circletel.co.za; pct=100` |

**DMARC Policy Progression:**
1. Start with `p=none` (monitor only)
2. After 2-4 weeks, move to `p=quarantine`
3. After confirming no issues, move to `p=reject`

### 2. Verify Existing Records
Ensure these are correctly configured (from your screenshots):
- ✅ `resend._domainkey.notify` - DKIM key
- ✅ `send.notify` MX record - Feedback loop
- ✅ `send.notify` TXT record - SPF

---

## Microsoft Postmaster Registration (Required)

### Step 1: Register with SNDS (Smart Network Data Services)
1. Go to: https://sendersupport.olc.protection.outlook.com/snds/
2. Sign in with a Microsoft account
3. Register your sending IP addresses (get from Resend dashboard)
4. This provides visibility into your reputation with Microsoft

### Step 2: Join JMRP (Junk Mail Reporting Program)
1. Go to: https://postmaster.live.com/snds/JMRP.aspx
2. Register your domain
3. This sends you feedback when users mark emails as spam

### Step 3: Request Delisting (if currently blocked)
1. Go to: https://sender.office.com/
2. Submit your sending domain for review
3. Provide business justification

---

## Email Content Best Practices

### Required Elements
1. **Physical Address** - Include in every email footer (POPIA/CAN-SPAM compliance)
2. **Unsubscribe Link** - Visible and functional
3. **From Name** - Consistent and recognizable ("CircleTel")
4. **Reply-To** - Valid email address

### Avoid
- ❌ ALL CAPS in subject lines
- ❌ Excessive exclamation marks!!!
- ❌ Spam trigger words (FREE, URGENT, ACT NOW)
- ❌ URL shorteners
- ❌ Too many images with little text
- ❌ Attachments (use links instead)

### Recommended
- ✅ Personalization (customer name)
- ✅ Clear sender identity
- ✅ Mobile-responsive design
- ✅ Text-to-image ratio of 60:40
- ✅ Alt text for images

---

## Domain Warm-Up Strategy

If `notify.circletel.co.za` is a new sending domain:

### Week 1-2
- Send max 50-100 emails/day
- Target engaged subscribers only
- Monitor bounce rates

### Week 3-4
- Increase to 500-1000 emails/day
- Continue monitoring

### Week 5+
- Gradually increase volume
- Maintain complaint rate < 0.1%

---

## Monitoring & Metrics

### Key Metrics to Track
| Metric | Target | Action if Exceeded |
|--------|--------|-------------------|
| Bounce Rate | < 2% | Clean email list |
| Spam Complaint Rate | < 0.1% | Review content |
| Open Rate | > 15% | Improve subject lines |
| Unsubscribe Rate | < 0.5% | Review frequency |

### Tools
- **Resend Dashboard**: Delivery metrics, bounces, complaints
- **Microsoft SNDS**: IP reputation with Microsoft
- **MXToolbox**: DNS record verification

---

## Troubleshooting

### Emails Going to Spam
1. Check DMARC alignment
2. Verify SPF/DKIM passing
3. Review email content for spam triggers
4. Check sender reputation on SNDS

### Emails Being Blocked
1. Submit delisting request at https://sender.office.com/
2. Check if IP is on any blocklists
3. Review sending patterns for spikes

### Low Open Rates
1. A/B test subject lines
2. Optimize send times
3. Segment audience
4. Clean inactive subscribers

---

## Checklist

### Immediate Actions
- [ ] Add DMARC records to DNS
- [ ] Register at Microsoft SNDS
- [ ] Join Microsoft JMRP
- [ ] Submit domain for review at sender.office.com

### Code Changes (Completed)
- [x] Add List-Unsubscribe headers to email services
- [x] Implement RFC 8058 one-click unsubscribe
- [x] Update unsubscribe API endpoint

### Ongoing
- [ ] Monitor delivery metrics weekly
- [ ] Maintain email list hygiene
- [ ] Review and update content regularly

---

## Resources

- [Microsoft Outlook Postmaster](https://postmaster.live.com/)
- [Resend Deliverability Guide](https://resend.com/docs/knowledge-base/deliverability)
- [RFC 8058 - One-Click Unsubscribe](https://datatracker.ietf.org/doc/html/rfc8058)
- [DMARC.org](https://dmarc.org/)
- [MXToolbox](https://mxtoolbox.com/)

---

*Last Updated: December 2024*
