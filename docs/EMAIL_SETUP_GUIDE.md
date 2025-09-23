# Email Setup Guide for CircleTel SA

## Domain: circletelsa.co.za

You can create professional email addresses using your GoDaddy domain for the Unjani audit notification system.

## Recommended Email Addresses

### Core Business Functions
- **legal@circletelsa.co.za** - Legal and compliance matters
- **sales@circletelsa.co.za** - Sales inquiries and partnerships
- **partners@circletelsa.co.za** - Partner communications and B2B
- **support@circletelsa.co.za** - Customer and technical support

### Unjani Project Specific
- **unjani@circletelsa.co.za** - Primary Unjani project contact
- **unjani-team@circletelsa.co.za** - Internal Unjani team notifications
- **rollout@circletelsa.co.za** - Rollout planning and coordination
- **audit@circletelsa.co.za** - Audit submissions and management

### Operations & Management
- **ops@circletelsa.co.za** - Operations team
- **admin@circletelsa.co.za** - Administrative functions
- **noreply@circletelsa.co.za** - Automated system emails
- **notifications@circletelsa.co.za** - System notifications

## Setup Options

### Option 1: GoDaddy Email (Easiest)
1. Log into your GoDaddy account
2. Go to "Email & Office" → "Email Forwarding" or "Workspace Email"
3. Create the email addresses you need
4. Set up forwarding to your existing emails or use GoDaddy's webmail

**Pros:** Quick setup, integrated with domain
**Cons:** Limited storage, basic features

### Option 2: Google Workspace (Recommended)
1. Sign up for Google Workspace with your domain
2. Verify domain ownership
3. Create professional email addresses
4. Get Gmail interface, Google Drive, Calendar integration

**Pros:** Professional features, excellent spam filtering, integration
**Cons:** Monthly cost (~$6/user/month)

### Option 3: Resend + Email Forwarding (For Our Notification System)
1. Set up email forwarding in GoDaddy
2. Use Resend for sending (which we're already implementing)
3. Forward received emails to your existing addresses

**Pros:** Cost-effective, perfect for automated notifications
**Cons:** No inbox management for the domain emails

## Integration with Our Notification System

### Current Implementation
Our system uses Resend API for sending emails. Here's how to integrate your domain:

### 1. Domain Verification with Resend
```bash
# Add these DNS records in GoDaddy:
# TXT record for domain verification
# DKIM records for email authentication
# SPF record for sender verification
```

### 2. Update Email Configuration
```typescript
// In .env.local
RESEND_API_KEY=your_resend_api_key
UNJANI_TEAM_EMAILS=unjani-team@circletelsa.co.za,rollout@circletelsa.co.za
UNJANI_SUPPORT_EMAIL=unjani@circletelsa.co.za
CIRCLETEL_DOMAIN=circletelsa.co.za
```

### 3. Email Templates Update
The system will automatically use:
- **From:** CircleTel Unjani <noreply@circletelsa.co.za>
- **Reply-To:** unjani@circletelsa.co.za
- **Team notifications:** unjani-team@circletelsa.co.za

## Implementation Steps

### Step 1: Set Up Basic Email Forwarding (Quick Start)
1. **GoDaddy Setup:**
   - Go to GoDaddy Domain Management
   - Find "Email Forwarding"
   - Create these forwards:
     ```
     unjani@circletelsa.co.za → your-current-email@gmail.com
     unjani-team@circletelsa.co.za → your-current-email@gmail.com
     rollout@circletelsa.co.za → your-current-email@gmail.com
     noreply@circletelsa.co.za → your-current-email@gmail.com
     ```

### Step 2: Configure Resend Domain
1. **Sign up for Resend** (if not already done)
2. **Add Domain:** circletelsa.co.za
3. **Add DNS Records** in GoDaddy:
   ```
   # Resend will provide specific records like:
   TXT @ "resend-verification=abc123..."
   CNAME resend._domainkey "resend._domainkey.resend.com"
   TXT @ "v=spf1 include:resend.com ~all"
   ```

### Step 3: Update Our Notification System
Update the email service configuration to use your domain:

```typescript
// supabase/functions/send-audit-notification/index.ts
const fromEmail = `CircleTel Unjani <noreply@${Deno.env.get('CIRCLETEL_DOMAIN') || 'circletelsa.co.za'}>`;
const teamEmails = Deno.env.get('UNJANI_TEAM_EMAILS')?.split(',') || [
  'unjani-team@circletelsa.co.za',
  'rollout@circletelsa.co.za'
];
```

## Benefits of Using Your Domain

### Professional Branding
- **Consistency:** All emails come from CircleTel domain
- **Trust:** Recipients see legitimate business email
- **Brand Recognition:** Reinforces CircleTel brand

### Email Deliverability
- **Better Delivery Rates:** Domain reputation vs generic email
- **Spam Protection:** Proper SPF/DKIM setup
- **Professional Appearance:** No "via resend.com" notifications

### Organization
- **Department Separation:** Different addresses for different functions
- **Easy Filtering:** Recipients can filter by purpose
- **Scalability:** Add new addresses as needed

## Cost Considerations

### Email Forwarding (Free with GoDaddy)
- **Setup:** Free with domain registration
- **Limitations:** Forwarding only, no sending from domain
- **Best For:** Receiving notifications, simple setup

### Google Workspace ($6/month per user)
- **Features:** Full email hosting, calendar, drive
- **Professional:** Gmail interface, mobile apps
- **Best For:** Full business email solution

### Resend for Sending ($20/month for 100k emails)
- **Focused:** Transactional emails only
- **Reliable:** High deliverability rates
- **Best For:** Automated notifications (our current need)

## Recommendation for Unjani Project

**Immediate (Free):**
1. Set up email forwarding in GoDaddy
2. Configure Resend with your domain
3. Update our notification system

**Long-term (Paid):**
Consider Google Workspace for full business email solution as you scale.

## Next Steps

1. **Set up email forwarding** for key addresses
2. **Get Resend API key** and verify domain
3. **Update environment variables** in our system
4. **Test email notifications** with your domain
5. **Deploy updated functions** to Supabase

Would you like me to help you implement any of these steps?