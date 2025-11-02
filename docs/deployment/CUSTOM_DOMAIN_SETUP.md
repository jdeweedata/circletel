# Custom Domain Setup for CircleTel Production

**Last Updated**: 2025-11-02
**Purpose**: Guide for configuring custom domains on Vercel for production deployment

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Domain Configuration](#domain-configuration)
4. [DNS Setup](#dns-setup)
5. [SSL Certificate](#ssl-certificate)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

---

## Overview

CircleTel production will use the following domains:

| Domain | Purpose | Redirect |
|--------|---------|----------|
| `circletel.co.za` | Primary production domain | N/A (apex) |
| `www.circletel.co.za` | www variant | → `circletel.co.za` |

**Vercel Project**: `circletel-production`
**Branch**: `master`

---

## Prerequisites

Before starting, ensure you have:

- [ ] Access to Vercel dashboard (https://vercel.com/jdewee-livecoms-projects)
- [ ] Access to domain registrar (where `circletel.co.za` is registered)
- [ ] Admin permissions to modify DNS records
- [ ] `master` branch ready for production

---

## Domain Configuration

### Step 1: Access Vercel Project Settings

1. Go to https://vercel.com/jdewee-livecoms-projects
2. Select `circletel-production` project (or create if it doesn't exist yet)
3. Click "Settings" tab
4. Click "Domains" in left sidebar

### Step 2: Add Primary Domain

1. In the "Domains" section, click "Add Domain"
2. Enter: `circletel.co.za`
3. Click "Add"
4. Vercel will show DNS configuration instructions

### Step 3: Add www Subdomain

1. Click "Add Domain" again
2. Enter: `www.circletel.co.za`
3. Click "Add"
4. Configure redirect to apex domain:
   - Select `www.circletel.co.za`
   - Click "Edit"
   - Set "Redirect to": `circletel.co.za`
   - Save changes

---

## DNS Setup

### Option 1: Using Vercel Nameservers (Recommended)

**Advantages**:
- Automatic DNS management
- Vercel handles everything
- Easiest setup

**Steps**:
1. In Vercel domains settings, click "Use Vercel Nameservers"
2. Vercel will show nameservers like:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
3. Go to your domain registrar
4. Update nameservers to Vercel's nameservers
5. Wait for propagation (can take up to 48 hours, usually <1 hour)

### Option 2: Using Existing DNS Provider (Custom)

**Advantages**:
- Keep existing DNS provider
- More control over DNS records

**Steps**:

#### For Apex Domain (circletel.co.za)

Add an **A Record**:
```
Type: A
Name: @  (or leave blank for apex)
Value: 76.76.21.21
TTL: 3600 (or default)
```

**Vercel's IP addresses** (use all for redundancy):
```
76.76.21.21
76.76.21.142
76.76.21.164
76.76.21.241
```

**Note**: If your DNS provider supports ALIAS/ANAME records, use:
```
Type: ALIAS (or ANAME)
Name: @
Value: cname.vercel-dns.com
```

#### For www Subdomain (www.circletel.co.za)

Add a **CNAME Record**:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600 (or default)
```

### DNS Configuration Examples

#### Example 1: Using Cloudflare

```
DNS Records for circletel.co.za

A     @     76.76.21.21           Auto     Proxied ✓
A     @     76.76.21.142          Auto     Proxied ✓
A     @     76.76.21.164          Auto     Proxied ✓
A     @     76.76.21.241          Auto     Proxied ✓
CNAME www   cname.vercel-dns.com  Auto     Proxied ✓
```

**Note**: If using Cloudflare proxy, ensure "SSL/TLS" is set to "Full" or "Full (strict)"

#### Example 2: Using GoDaddy

```
Type    Name    Value                   TTL
A       @       76.76.21.21            600
A       @       76.76.21.142           600
A       @       76.76.21.164           600
A       @       76.76.21.241           600
CNAME   www     cname.vercel-dns.com   600
```

#### Example 3: Using Namecheap

```
Type         Host    Value                   TTL
A Record     @       76.76.21.21            Automatic
A Record     @       76.76.21.142           Automatic
A Record     @       76.76.21.164           Automatic
A Record     @       76.76.21.241           Automatic
CNAME Record www     cname.vercel-dns.com   Automatic
```

---

## SSL Certificate

### Automatic SSL (Vercel Managed)

Vercel automatically provisions SSL certificates via Let's Encrypt.

**What happens**:
1. After DNS is configured, Vercel detects domain
2. Vercel requests SSL certificate from Let's Encrypt
3. Certificate is automatically issued (usually within 5 minutes)
4. HTTPS is enabled automatically

**Verification**:
```bash
curl -I https://circletel.co.za
# Should return: HTTP/2 200

# Check certificate
openssl s_client -connect circletel.co.za:443 -servername circletel.co.za | grep "subject\|issuer"
# Should show Let's Encrypt certificate
```

### Certificate Auto-Renewal

- Vercel automatically renews certificates before expiry
- No manual intervention required
- Certificates valid for 90 days, renewed at 60 days

---

## Verification

### Step 1: DNS Propagation Check

Check if DNS has propagated:

```bash
# Check A records
nslookup circletel.co.za

# Expected output:
# Name:    circletel.co.za
# Address: 76.76.21.21
# Address: 76.76.21.142
# (etc.)

# Check CNAME record
nslookup www.circletel.co.za

# Expected output:
# www.circletel.co.za  canonical name = cname.vercel-dns.com
```

**Online Tools**:
- https://dnschecker.org/ - Check DNS propagation globally
- https://www.whatsmydns.net/ - Check from multiple locations

### Step 2: Domain Status in Vercel

1. Go to Vercel project settings → Domains
2. Check status of domains:
   - ✅ `circletel.co.za` - Valid
   - ✅ `www.circletel.co.za` - Redirect Configured

If status shows:
- ⚠️ "Invalid Configuration" - Check DNS records
- ⏳ "Pending" - Wait for DNS propagation
- ❌ "Error" - Review error message

### Step 3: HTTPS Verification

```bash
# Test HTTPS
curl -I https://circletel.co.za
# Expected: HTTP/2 200 OK

# Test www redirect
curl -I https://www.circletel.co.za
# Expected: HTTP/2 308 (redirect)
# Location: https://circletel.co.za
```

### Step 4: Browser Test

1. Open https://circletel.co.za in browser
2. Check for:
   - ✅ Green padlock (HTTPS secure)
   - ✅ Certificate valid
   - ✅ No browser warnings
   - ✅ Site loads correctly

3. Open https://www.circletel.co.za
4. Should redirect to https://circletel.co.za

---

## Troubleshooting

### Issue 1: DNS Not Propagating

**Symptom**: Domain still points to old IP or doesn't resolve

**Solutions**:
1. **Wait longer** - DNS propagation can take up to 48 hours
2. **Check DNS records** - Verify records are correct in DNS provider
3. **Clear local DNS cache**:
   ```bash
   # Windows
   ipconfig /flushdns

   # macOS
   sudo dscacheutil -flushcache
   sudo killall -HUP mDNSResponder

   # Linux
   sudo systemd-resolve --flush-caches
   ```
4. **Test with external DNS**:
   ```bash
   nslookup circletel.co.za 8.8.8.8
   # Uses Google DNS to check
   ```

### Issue 2: SSL Certificate Not Issued

**Symptom**: "Your connection is not private" error in browser

**Solutions**:
1. **Wait for certificate** - Can take 5-10 minutes
2. **Check DNS is correct** - Certificate won't issue if DNS is wrong
3. **Remove and re-add domain** in Vercel:
   - Remove domain from Vercel
   - Wait 5 minutes
   - Add domain again
4. **Check CAA records** (if using custom DNS):
   - Ensure no CAA records block Let's Encrypt
   - Or add CAA record allowing Let's Encrypt:
     ```
     circletel.co.za. CAA 0 issue "letsencrypt.org"
     ```

### Issue 3: www Redirect Not Working

**Symptom**: `www.circletel.co.za` doesn't redirect to apex

**Solutions**:
1. **Check redirect configuration** in Vercel:
   - Go to Domains
   - Edit `www.circletel.co.za`
   - Ensure "Redirect to" is set to `circletel.co.za`
2. **Check CNAME record** is correct:
   ```bash
   nslookup www.circletel.co.za
   # Should show: cname.vercel-dns.com
   ```
3. **Clear browser cache** and test in incognito mode

### Issue 4: "Invalid Configuration" Error

**Symptom**: Vercel shows domain as invalid

**Solutions**:
1. **Verify DNS records match** Vercel's requirements:
   - A records: 76.76.21.21, 76.76.21.142, etc.
   - CNAME: cname.vercel-dns.com
2. **Check for conflicting records**:
   - Remove any old A/AAAA records
   - Remove any old CNAME records
3. **Wait for DNS propagation**
4. **Contact Vercel support** if issue persists

### Issue 5: Site Shows 404 Error

**Symptom**: Domain resolves but shows 404 Not Found

**Solutions**:
1. **Check project is deployed**:
   - Go to Vercel dashboard
   - Verify production deployment succeeded
2. **Check domain is assigned** to correct project
3. **Check branch configuration**:
   - Ensure `master` branch is deployed to production
   - Verify build succeeded
4. **Redeploy**:
   ```bash
   git push origin master
   # Or use Vercel dashboard → Redeploy
   ```

---

## Post-Configuration Steps

### Update Environment Variables

After domain is configured, update:

```bash
NEXT_PUBLIC_APP_URL=https://circletel.co.za
```

In Vercel dashboard:
1. Go to project settings → Environment Variables
2. Update `NEXT_PUBLIC_APP_URL`
3. Redeploy for changes to take effect

### Update External Services

Update webhook URLs in:

1. **NetCash Dashboard**:
   - Webhook URL: `https://circletel.co.za/api/payments/webhook`

2. **Didit KYC Dashboard**:
   - Webhook URL: `https://circletel.co.za/api/integrations/didit/webhook`

3. **Zoho CRM**:
   - Webhook URL: `https://circletel.co.za/api/integrations/zoho/crm/webhook`

4. **Zoho Sign**:
   - Webhook URL: `https://circletel.co.za/api/integrations/zoho/sign/webhook`

### Update Documentation

- [ ] Update `CLAUDE.md` with production URL
- [ ] Update `README.md` with production URL
- [ ] Update any API documentation

---

## Domain Management

### Adding Additional Domains

To add more domains (e.g., `circletel.com`, `circletel.net`):

1. Add domain in Vercel dashboard
2. Configure DNS records
3. Set as redirect to primary domain:
   ```
   circletel.com → circletel.co.za
   circletel.net → circletel.co.za
   ```

### Removing Old Domains

When migrating from old domain:

1. Add new domain first
2. Verify new domain works
3. Set old domain to redirect to new domain
4. Keep redirect for 6-12 months (SEO)
5. Eventually remove old domain

---

## Monitoring

### Domain Health Checks

Set up monitoring for:
- [ ] Domain resolution (DNS)
- [ ] HTTPS certificate validity
- [ ] Site uptime
- [ ] Redirect functionality

**Tools**:
- Vercel Analytics (built-in)
- UptimeRobot (external monitoring)
- SSL Labs (certificate monitoring)

---

## Quick Reference

### Vercel DNS Records

```
# Apex domain (circletel.co.za)
A @ 76.76.21.21
A @ 76.76.21.142
A @ 76.76.21.164
A @ 76.76.21.241

# www subdomain
CNAME www cname.vercel-dns.com
```

### Verification Commands

```bash
# Check DNS
nslookup circletel.co.za
nslookup www.circletel.co.za

# Check HTTPS
curl -I https://circletel.co.za

# Check redirect
curl -I https://www.circletel.co.za

# Check certificate
openssl s_client -connect circletel.co.za:443 -servername circletel.co.za
```

---

## Related Documentation

- **Deployment Workflow**: `STAGING_TO_PRODUCTION_WORKFLOW.md`
- **Environment Variables**: `ENVIRONMENT_VARIABLES_GUIDE.md`
- **Vercel Guide**: `VERCEL_DEPLOYMENT_GUIDE.md`

---

**Last Updated**: 2025-11-02
**Next Review**: When domain changes occur
**Support**: Vercel Support (support@vercel.com) or #tech-support
