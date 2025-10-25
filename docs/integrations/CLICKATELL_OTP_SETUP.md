# Clickatell OTP Integration

This document explains the Clickatell SMS OTP verification system integrated into the CircleTel account creation flow.

## Overview

The OTP (One-Time Password) system uses Clickatell's SMS REST API to send verification codes to users' phone numbers during account creation, ensuring phone number ownership verification.

## Setup

### 1. Environment Variables

Add the following to your `.env.local` or `.env.clickatell` file:

```bash
CLICKATELL_API_KEY=zlt2pwSyRKySrygQNm9XVg==
CLICKATELL_API_ID=d35b2bc7d46f4bfe927dfeaebef59d07
CLICKATELL_BASE_URL=https://api.clickatell.com/rest
```

**Clickatell Account Details:**
- Setup Name: CircleTel
- Description: CircleTel/Agility
- SMS Service Class: Standard
- Setup Type: Production

### 2. Database Migration

Run the OTP verifications table migration:

```bash
# Using Supabase CLI
supabase db push

# Or apply manually via Supabase Dashboard
# Run: supabase/migrations/20250125_create_otp_verifications.sql
```

## Architecture

### Components

1. **SMS Service** (`lib/integrations/clickatell/sms-service.ts`)
   - Handles Clickatell API communication
   - Formats phone numbers to international format
   - Sends SMS messages

2. **OTP Service** (`lib/integrations/clickatell/otp-service.ts`)
   - Generates 6-digit OTP codes
   - Stores OTPs with expiry (10 minutes)
   - Verifies OTP codes
   - Tracks verification attempts (max 3)

3. **API Routes**
   - `POST /api/otp/send` - Sends OTP to phone number
   - `POST /api/otp/verify` - Verifies OTP code

4. **UI Pages**
   - `/order/account` - Account creation with phone number
   - `/order/verify-otp` - OTP verification page

## User Flow

1. User fills out account creation form with email, password, and phone number
2. User accepts Terms & Conditions
3. User submits form
4. System creates account in Supabase Auth
5. System generates 6-digit OTP
6. System sends OTP via Clickatell SMS
7. User is redirected to OTP verification page
8. User enters OTP code
9. System verifies OTP
10. User proceeds to next step in order flow

## Phone Number Format

The system automatically formats phone numbers to international format:

- Input: `0821234567` → Output: `27821234567`
- Input: `+27 82 123 4567` → Output: `27821234567`
- Input: `082-123-4567` → Output: `27821234567`

**South African numbers** (starting with 0) are automatically converted to country code 27.

## OTP Security Features

- **Expiry**: OTP codes expire after 10 minutes
- **Rate Limiting**: Only one OTP per phone number at a time
- **Attempt Limiting**: Maximum 3 verification attempts per OTP
- **Secure Storage**: OTPs stored in-memory and database
- **Auto-cleanup**: Expired OTPs are automatically removed

## API Usage

### Send OTP

```typescript
const response = await fetch('/api/otp/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    phone: '0821234567' 
  }),
});

const result = await response.json();
// { success: true, message: 'OTP sent successfully' }
```

### Verify OTP

```typescript
const response = await fetch('/api/otp/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    phone: '0821234567',
    otp: '123456'
  }),
});

const result = await response.json();
// { success: true, message: 'Phone number verified successfully' }
```

## Error Handling

### Common Errors

1. **OTP Already Sent**
   - Status: 429
   - Message: "An OTP has already been sent. Please wait before requesting a new one."

2. **OTP Expired**
   - Status: 400
   - Message: "OTP has expired. Please request a new code."

3. **Invalid OTP**
   - Status: 400
   - Message: "Invalid OTP code. X attempts remaining."

4. **Max Attempts Exceeded**
   - Status: 400
   - Message: "Maximum verification attempts exceeded. Please request a new code."

5. **Clickatell API Error**
   - Status: 500
   - Message: Specific error from Clickatell API

## SMS Message Template

```
Your CircleTel verification code is: 123456. This code will expire in 10 minutes.
```

## Testing

### Test Phone Numbers

For development/testing, you can use Clickatell's test mode or your own phone number.

### Manual Testing

1. Navigate to `/order/account`
2. Fill in email, password, and phone number
3. Accept terms and submit
4. Check your phone for SMS
5. Enter OTP on verification page
6. Verify successful verification

## Monitoring

### Database Queries

```sql
-- View recent OTP verifications
SELECT * FROM otp_verifications 
ORDER BY created_at DESC 
LIMIT 10;

-- Count verified vs unverified
SELECT 
  verified,
  COUNT(*) as count
FROM otp_verifications
GROUP BY verified;

-- Find expired OTPs
SELECT * FROM otp_verifications
WHERE expires_at < NOW()
AND verified = false;
```

### Cleanup Old Records

```sql
-- Delete verified OTPs older than 7 days
DELETE FROM otp_verifications
WHERE verified = true
AND verified_at < NOW() - INTERVAL '7 days';

-- Delete expired unverified OTPs
DELETE FROM otp_verifications
WHERE verified = false
AND expires_at < NOW();
```

## Cost Considerations

- **Clickatell Pricing**: Check your Clickatell account for SMS pricing
- **South African SMS**: Typically ~R0.20 - R0.30 per SMS
- **Optimization**: OTP codes are only sent once per account creation
- **Rate Limiting**: Prevents abuse and excessive SMS costs

## Troubleshooting

### OTP Not Received

1. Check phone number format (must be valid South African number)
2. Verify Clickatell API credentials in `.env.clickatell`
3. Check Clickatell account balance
4. Review API logs in Clickatell dashboard
5. Check spam/blocked messages on phone

### API Errors

1. Verify environment variables are loaded
2. Check Clickatell API key is valid
3. Ensure API has SMS permissions
4. Review server logs for detailed errors

### Database Issues

1. Verify migration was applied successfully
2. Check RLS policies allow service role access
3. Review database logs for errors

## Production Checklist

- [ ] Clickatell API credentials configured
- [ ] Database migration applied
- [ ] Environment variables set in production
- [ ] Test OTP flow end-to-end
- [ ] Monitor SMS delivery rates
- [ ] Set up alerts for failed SMS
- [ ] Configure rate limiting if needed
- [ ] Review Clickatell account balance regularly

## Support

- **Clickatell Documentation**: https://docs.clickatell.com/
- **Clickatell Support**: https://www.clickatell.com/contact-support/
- **CircleTel Internal**: Contact development team

## Future Enhancements

- [ ] Add WhatsApp OTP option
- [ ] Implement Redis for OTP storage (better scalability)
- [ ] Add SMS delivery status tracking
- [ ] Implement backup SMS provider
- [ ] Add OTP resend cooldown period
- [ ] Create admin dashboard for OTP monitoring
