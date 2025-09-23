# Email Testing Setup Guide

## ✅ Your Resend API Key is Configured!

**API Key:** `re_EbcavjSF_QEc7A4JynFGjmzCHdW2DDuRs` (added to `.env.local`)

## 🚀 Next Steps to Get Email Notifications Working

### Step 1: Verify Your Domain with Resend

1. **Go to Resend Dashboard:** https://resend.com/domains
2. **Add Domain:** Click "Add Domain" and enter `circletelsa.co.za`
3. **Add DNS Records in GoDaddy:**

   **Domain Verification:**
   ```
   Type: TXT
   Name: @
   Value: resend-verification=[PROVIDED_BY_RESEND]
   ```

   **DKIM Authentication:**
   ```
   Type: CNAME
   Name: resend._domainkey
   Value: resend._domainkey.resend.com
   ```

   **SPF Record:**
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:resend.com ~all
   ```

### Step 2: Set Up Email Forwarding (Optional)

In GoDaddy, set up email forwarding so you receive emails:
```
unjani@circletelsa.co.za → your-outlook@email.com
unjani-team@circletelsa.co.za → your-outlook@email.com
rollout@circletelsa.co.za → your-outlook@email.com
```

### Step 3: Test Email Sending

Once domain is verified, you can test with this simple script:

```javascript
// test-email.js - Run this to test email sending
const fetch = require('node-fetch');

async function testEmail() {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer re_EbcavjSF_QEc7A4JynFGjmzCHdW2DDuRs',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'CircleTel Test <noreply@circletelsa.co.za>',
      to: ['your-email@gmail.com'], // Replace with your email
      subject: 'Test Email from CircleTel',
      html: '<h1>Test Successful!</h1><p>Your domain email setup is working.</p>',
      text: 'Test Successful! Your domain email setup is working.',
    }),
  });

  const result = await response.json();
  console.log('Email result:', result);
}

testEmail();
```

## 📧 Email Notification System Status

### ✅ Ready Components:
- **Email Templates**: Beautiful HTML emails created
- **Notification Preferences**: UI component for user control
- **API Integration**: Resend API key configured
- **Domain Setup**: Pre-configured for `circletelsa.co.za`

### 🔄 Pending Deployment:
- **Edge Function**: `send-audit-notification` (ready to deploy)
- **Updated Form Function**: Enhanced with email capabilities
- **Domain Verification**: Requires DNS changes in GoDaddy

## 🛠️ Deployment Instructions (When Ready)

### Option 1: Deploy via Supabase Dashboard
1. Go to Supabase Dashboard → Edge Functions
2. Create new function: `send-audit-notification`
3. Copy code from `supabase/functions/send-audit-notification/index.ts`
4. Set environment variables:
   ```
   RESEND_API_KEY=re_EbcavjSF_QEc7A4JynFGjmzCHdW2DDuRs
   CIRCLETEL_DOMAIN=circletelsa.co.za
   UNJANI_TEAM_EMAILS=unjani-team@circletelsa.co.za,rollout@circletelsa.co.za
   ```

### Option 2: CLI Deployment (Later)
```bash
# When Supabase project has write access:
supabase functions deploy send-audit-notification
supabase functions deploy unjani-form-submission
```

## 📝 Testing the Complete Flow

### Current Testing (Without Domain Setup):
You can test the form submission flow right now:
1. Fill out the Unjani audit form
2. Form will save to database successfully
3. Email notifications will fail gracefully (logged, not blocking)
4. You'll see success message

### After Domain Setup:
1. Fill out the Unjani audit form
2. Form saves to database
3. Team notification sent to configured emails
4. Client confirmation sent to contact person
5. All email statuses logged

## 🎯 Immediate Action Items

### High Priority (This Week):
1. **Add DNS records** in GoDaddy for domain verification
2. **Deploy email notification function** via Supabase dashboard
3. **Test email sending** with simple script
4. **Update environment variables** in Supabase

### Medium Priority (Next Week):
1. **Set up email forwarding** for team addresses
2. **Test complete audit submission flow**
3. **Monitor email deliverability**
4. **Fine-tune email templates** based on feedback

## 💡 Pro Tips

### Email Deliverability:
- Start with small volume to build domain reputation
- Monitor bounce rates and spam complaints
- Use descriptive subject lines
- Include unsubscribe links for marketing emails

### Cost Management:
- Free tier: 3,000 emails/month (perfect for your needs)
- Monitor usage in Resend dashboard
- Set up alerts before hitting limits

### Testing Strategy:
1. Test with your own email first
2. Test with team members
3. Test with a clinic contact (with permission)
4. Monitor logs for any issues

## 🔧 Troubleshooting

### Common Issues:

**Domain Not Verified:**
- Check DNS propagation (can take 24 hours)
- Verify DNS records are exact matches
- Use DNS checker tools

**Emails Going to Spam:**
- Ensure SPF/DKIM records are correct
- Start with small volume
- Use professional email content

**API Errors:**
- Check API key is correct
- Verify domain is verified in Resend
- Check request format matches documentation

## ✨ What You'll Get

Once everything is set up, your Unjani audit form will automatically:

### Team Notifications:
- 🚨 Priority-based visual alerts
- 📊 Complete audit summary
- 👤 Contact information
- 📋 Next steps checklist
- 🔗 Direct links to database records

### Client Confirmations:
- ✅ Professional thank you message
- 📅 Clear timeline expectations
- 📞 Support contact information
- 🔄 Process explanation

### System Benefits:
- 📈 Improved response times
- 💼 Professional communication
- 📊 Automated workflow
- 🎯 Priority-based triage

**Your email notification system is ready to go live as soon as you verify the domain! 🚀**