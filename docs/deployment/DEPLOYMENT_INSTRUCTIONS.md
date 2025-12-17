# 🚀 Unjani Email Notification System - Deployment Instructions

## ✅ Current Status

### What's Working:
- ✅ **Resend API**: Configured with key from environment variables
- ✅ **Domain Verified**: `notifications.circletelsa.co.za` is fully verified
- ✅ **Test Email**: Successfully sent email ID `d2f1abbf-dbb9-462f-9ce8-e7b5121b1469`
- ✅ **Form Integration**: UI components and notification preferences ready
- ✅ **Edge Functions**: Code written and tested locally

### What Needs Deployment:
- 🔄 **Edge Functions**: Need to be deployed to Supabase production
- 🔄 **Environment Variables**: Need to be set in Supabase dashboard

## 📋 Deployment Steps

### Step 1: Deploy Edge Functions

Since the project is currently in read-only mode, you'll need to deploy the Edge Functions manually via the Supabase Dashboard:

#### A. Deploy `send-audit-notification` Function

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to**: Your Project → Edge Functions
3. **Create New Function**: Click "Create Function"
4. **Function Name**: `send-audit-notification`
5. **Copy the code** from: `supabase/functions/send-audit-notification/index.ts`

#### B. Deploy `unjani-form-submission` Function

1. **Create New Function**: `unjani-form-submission`
2. **Copy the code** from: `supabase/functions/unjani-form-submission/index.ts`

### Step 2: Set Environment Variables

In your Supabase Dashboard → Settings → Edge Functions → Environment Variables:

```env
RESEND_API_KEY=your_resend_api_key_here
CIRCLETEL_DOMAIN=notifications.circletelsa.co.za
UNJANI_TEAM_EMAILS=unjani-team@notifications.circletelsa.co.za,rollout@notifications.circletelsa.co.za
UNJANI_SUPPORT_EMAIL=unjani@notifications.circletelsa.co.za
UNJANI_SUPPORT_PHONE=087 150 8000
```

### Step 3: Test the Complete Flow

1. **Go to your website**: http://localhost:8080
2. **Navigate to**: Unjani Contract Audit Form
3. **Fill out the form** with test data
4. **Configure notifications**:
   - ✅ Notify Team (default: on)
   - ✅ Notify Client (default: on)
   - 📧 Custom emails: Add any additional recipients
5. **Submit the form**
6. **Check your email** for notifications

## 📧 Expected Email Behavior

### Team Notification Email:
- **To**: `unjani-team@notifications.circletelsa.co.za`, `rollout@notifications.circletelsa.co.za`
- **From**: `CircleTel Notifications <noreply@notifications.circletelsa.co.za>`
- **Subject**: `🏥 New Unjani Contract Audit Submitted - [PRIORITY] Priority`
- **Content**: Professional HTML email with clinic details, compliance gaps, and next steps

### Client Confirmation Email:
- **To**: Contact person's email from the form
- **From**: `CircleTel Notifications <noreply@notifications.circletelsa.co.za>`
- **Subject**: `✅ Your Unjani Contract Audit Submission Received`
- **Content**: Thank you message with timeline and contact information

### Custom Recipients:
- **To**: Any additional emails specified in the custom emails field
- **Content**: Same as team notification

## 🔧 Alternative CLI Deployment (When Available)

If you get write access to the Supabase project later, you can deploy via CLI:

```bash
# Set the new API key as environment variable
export SUPABASE_ACCESS_TOKEN=sbp_0c5aeee8d0b800b0a6dacf4d4e23678a92e4282d

# Deploy functions
supabase functions deploy send-audit-notification
supabase functions deploy unjani-form-submission

# Set environment variables
supabase secrets set RESEND_API_KEY=your_resend_api_key_here
supabase secrets set CIRCLETEL_DOMAIN=notifications.circletelsa.co.za
supabase secrets set UNJANI_TEAM_EMAILS=unjani-team@notifications.circletelsa.co.za,rollout@notifications.circletelsa.co.za
```

## 🎯 Success Indicators

You'll know everything is working when:

1. **Form submits successfully** ✅
2. **Database record is created** ✅
3. **Team notification email arrives** 📧
4. **Client confirmation email arrives** 📧
5. **Custom recipients get emails** (if specified) 📧
6. **No errors in browser console** ✅

## 📝 Troubleshooting

### Common Issues:

**Emails not sending:**
- Check environment variables are set correctly
- Verify API key has sending permissions
- Confirm domain is verified in Resend dashboard

**Form submission fails:**
- Check Edge Functions are deployed
- Verify environment variables
- Check browser console for errors

**Emails going to spam:**
- This is normal for new domains
- Mark emails as "Not Spam"
- Domain reputation will improve over time

## 🎉 What You'll Get

Once deployed, your Unjani audit form will automatically:

### For Your Team:
- 🚨 **Instant notifications** when new audits are submitted
- 📊 **Complete audit summaries** with priority-based alerts
- 📋 **Next steps checklist** for efficient follow-up
- 📞 **Direct contact information** for immediate reach-out

### For Your Clients:
- ✅ **Professional confirmations** that build trust
- 📅 **Clear timelines** setting proper expectations
- 📞 **Support contacts** for any questions
- 🔄 **Process transparency** showing your professionalism

**Your email notification system is ready to deploy! 🚀**