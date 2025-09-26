---
Document: SkyFibre Township RADIUS Integration with AgilityGIS/Interstellio
Version: 1.0
Date: 10/08/2025
Author: CircleTel Technical Architecture
Scope: Hotspot authentication and billing integration
Status: Implementation Guide
Currency: R (ex-VAT)
---

# SKYFIBRE TOWNSHIP RADIUS INTEGRATION
## AgilityGIS/Interstellio Platform Implementation
## For Community WiFi Hotspot Services

---

## EXECUTIVE SUMMARY

This document outlines the RADIUS integration architecture for SkyFibre Township using the AgilityGIS platform with Interstellio AAA services. The integration enables automated voucher-based authentication, real-time usage tracking, and seamless billing for the R5/day community WiFi service across all township deployment sites.

**Key Integration Points:**
- Captive portal authentication for voucher-based access
- Real-time usage accounting and FUP enforcement
- Automated suspension and reactivation
- Multi-site centralized management
- Spaza shop voucher distribution tracking

---

## 1. ARCHITECTURE OVERVIEW

### 1.1 High-Level Integration Flow

```
TOWNSHIP SITE                    CIRCLETEL CORE (TERACO/CLOUD)
     │                                       │
[MikroTik Hotspot]                          │
     ├── RADIUS Auth ────────────> [Interstellio AAA]
     │                                       │
     ├── Accounting ──────────────> [RADIUS Accounting]
     │                                       │
[User Device] ──────────────────────> [AgilityGIS Portal]
     │                                       │
[Voucher Terminal] ─────────────────> [Voucher Management]
                                            │
                                    [Billing & Reporting]
```

### 1.2 Component Responsibilities

**MikroTik CCR1009 (at each site):**
- Hotspot server configuration
- RADIUS client functionality
- Local caching of active sessions
- Backup authentication (offline mode)
- Traffic shaping and QoS

**Interstellio AAA Server:**
- Voucher validation
- Session authentication
- Usage accounting
- Policy enforcement
- Real-time authorization

**AgilityGIS Platform:**
- Subscriber management
- Voucher generation
- Billing integration
- Reporting and analytics
- Spaza shop management

---

## 2. VOUCHER-BASED AUTHENTICATION

### 2.1 Voucher Structure

```
VOUCHER FORMAT:
SKY-XXXX-XXXX-XXXX

Components:
- SKY: Product identifier
- XXXX: 4-digit alphanumeric segments
- Unique 12-character code
- Case-insensitive entry

VOUCHER ATTRIBUTES IN RADIUS:
- Username: Voucher code
- Password: Voucher code (same)
- Service-Type: Login-User
- NAS-Port-Type: Wireless-802.11
```

### 2.2 Authentication Flow

```
1. USER CONNECTS TO WIFI:
   └── Device connects to open SSID "SkyFibre-Township"
   └── MikroTik redirects to captive portal

2. VOUCHER ENTRY:
   └── User enters voucher code
   └── Portal sends to MikroTik hotspot

3. RADIUS AUTHENTICATION:
   └── MikroTik sends Access-Request to Interstellio
   └── Contains: Voucher, MAC, NAS-ID, Location

4. INTERSTELLIO VALIDATION:
   └── Check voucher validity
   └── Verify not already in use
   └── Check service package
   └── Return Access-Accept with attributes

5. SESSION ESTABLISHMENT:
   └── MikroTik creates session
   └── Applies bandwidth limits
   └── Starts accounting
```

### 2.3 RADIUS Attributes Configuration

**Access-Request (MikroTik → Interstellio):**
```
User-Name = "SKY-1234-5678-9012"
User-Password = "SKY-1234-5678-9012"
NAS-IP-Address = "10.x.x.1" (Site router)
NAS-Identifier = "Township-Site-001"
NAS-Port-Type = Wireless-802.11
Calling-Station-Id = "AA:BB:CC:DD:EE:FF" (User MAC)
Framed-IP-Address = "100.64.x.x" (CGNAT IP)
```

**Access-Accept (Interstellio → MikroTik):**
```
Session-Timeout = 86400 (24 hours for daily)
Idle-Timeout = 900 (15 minutes)
Acct-Interim-Interval = 300 (5-minute updates)
Mikrotik-Rate-Limit = "5M/5M" (5 Mbps up/down)
Mikrotik-Total-Limit = 2147483648 (2GB limit)
Mikrotik-Address-List = "daily-users"
Reply-Message = "Welcome to SkyFibre Township"
```

---

## 3. SERVICE PACKAGE MAPPING

### 3.1 Package Configuration in AgilityGIS

```
PRODUCT CATALOG SETUP:
├── Daily Packages
│   ├── R5 Daily Basic
│   │   ├── Speed: 5/5 Mbps
│   │   ├── Data: 2GB then shaped
│   │   ├── Validity: 24 hours
│   │   └── RADIUS Profile: "daily-basic"
│   │
│   └── R10 Daily Plus
│       ├── Speed: 10/10 Mbps
│       ├── Data: 5GB then shaped
│       ├── Validity: 24 hours
│       └── RADIUS Profile: "daily-plus"
│
├── Weekly Packages
│   ├── R30 Weekly Saver
│   │   ├── Speed: 5/5 Mbps
│   │   ├── Data: 15GB
│   │   ├── Validity: 7 days
│   │   └── RADIUS Profile: "weekly-saver"
│   │
│   └── R50 Weekly Power
│       ├── Speed: 10/10 Mbps
│       ├── Data: 30GB
│       ├── Validity: 7 days
│       └── RADIUS Profile: "weekly-power"
│
└── Monthly Packages
    ├── R120 Monthly Home
    │   ├── Speed: 10/10 Mbps
    │   ├── Data: 60GB
    │   ├── Validity: 30 days
    │   └── RADIUS Profile: "monthly-home"
    │
    └── R199 Monthly Unlimited
        ├── Speed: 5/5 Mbps
        ├── Data: Uncapped (FUP 200GB)
        ├── Validity: 30 days
        └── RADIUS Profile: "monthly-unlimited"
```

### 3.2 Interstellio Service Profiles

**Profile: daily-basic**
```json
{
  "profile_name": "daily-basic",
  "authentication": {
    "method": "voucher",
    "concurrent_sessions": 1
  },
  "authorization": {
    "session_timeout": 86400,
    "idle_timeout": 900,
    "bandwidth_up": 5242880,
    "bandwidth_down": 5242880,
    "data_limit": 2147483648,
    "fup_action": "throttle",
    "fup_speed": 512000
  },
  "accounting": {
    "interim_interval": 300,
    "track_usage": true,
    "billing_model": "prepaid"
  }
}
```

---

## 4. ACCOUNTING AND USAGE TRACKING

### 4.1 Accounting Flow

```
SESSION LIFECYCLE:
1. START: Accounting-Start packet
   └── Session-ID created
   └── Start time recorded
   └── Initial counters set to 0

2. INTERIM: Every 5 minutes
   └── Data uploaded/downloaded
   └── Session time elapsed
   └── Update usage in real-time

3. STOP: Session termination
   └── Final usage recorded
   └── Voucher marked as used
   └── Statistics updated
```

### 4.2 Usage Enforcement

**Real-Time FUP Implementation:**
```
IF (data_used >= package_limit) THEN
  IF (package_type = "shaped") THEN
    → Send CoA (Change of Authorization)
    → Reduce speed to 512 Kbps
    → Notify user via portal redirect
  ELSE
    → Send Disconnect-Request
    → Terminate session
    → Mark voucher as depleted
  END IF
END IF
```

### 4.3 Accounting Database Schema

```sql
-- Session tracking table
CREATE TABLE radius_sessions (
  session_id VARCHAR(64) PRIMARY KEY,
  voucher_code VARCHAR(20),
  mac_address VARCHAR(17),
  site_id VARCHAR(50),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  data_uploaded BIGINT,
  data_downloaded BIGINT,
  session_duration INT,
  termination_cause VARCHAR(50)
);

-- Usage summary table
CREATE TABLE usage_summary (
  voucher_code VARCHAR(20),
  total_data_used BIGINT,
  total_time_used INT,
  last_usage TIMESTAMP,
  remaining_data BIGINT,
  status ENUM('active', 'expired', 'depleted')
);
```

---

## 5. MULTI-SITE MANAGEMENT

### 5.1 Site Identification

**NAS Configuration per Site:**
```
Site: Diepkloof Clinic
NAS-Identifier: "CLINIC-DIEP-001"
NAS-IP-Address: "10.1.1.1"
Location: "Soweto-Diepkloof"
Coverage: "500 users"

Site: Alexandra Clinic
NAS-Identifier: "CLINIC-ALEX-002"
NAS-IP-Address: "10.1.2.1"
Location: "Alexandra"
Coverage: "500 users"
```

### 5.2 Centralized Management in AgilityGIS

```
HIERARCHY:
CircleTel (Master Account)
├── SkyFibre Township Product
│   ├── Gauteng Region
│   │   ├── Diepkloof Site
│   │   ├── Alexandra Site
│   │   ├── Tembisa Site
│   │   ├── Mamelodi Site
│   │   └── Orange Farm Site
│   │
│   └── Western Cape Region
│       └── [Future sites]
│
└── Reporting Dashboard
    ├── Per-site analytics
    ├── Regional summaries
    └── National overview
```

### 5.3 Load Balancing and Redundancy

```
RADIUS SERVER CONFIGURATION:
Primary: radius1.circletel.co.za (Teraco JHB1)
Secondary: radius2.circletel.co.za (Teraco CPT1)

MikroTik Configuration:
/radius add address=41.x.x.1 secret=SharedSecret timeout=3s
/radius add address=41.x.x.2 secret=SharedSecret timeout=3s

Failover: Automatic with 3-second timeout
Local Cache: 1000 recent authentications
```

---

## 6. VOUCHER DISTRIBUTION TRACKING

### 6.1 Spaza Shop Integration

**Voucher Allocation System:**
```
DISTRIBUTION FLOW:
1. Batch Generation (AgilityGIS)
   └── Generate 1000 vouchers
   └── Assign to distribution pool
   └── Set commission rate (15%)

2. Spaza Shop Assignment
   └── Allocate 100 vouchers per shop
   └── Track via shop ID
   └── Enable POS terminal

3. Sale Recording
   └── Voucher activation on first use
   └── Commission calculation
   └── Real-time reporting

4. Settlement
   └── Daily reconciliation
   └── Weekly commission payout
   └── Stock replenishment alerts
```

### 6.2 API Integration for Voucher Management

**REST API Endpoints:**
```
POST /api/v1/vouchers/generate
{
  "batch_size": 1000,
  "package_type": "daily-basic",
  "site_id": "CLINIC-DIEP-001",
  "valid_from": "2025-08-10",
  "valid_until": "2025-09-10"
}

GET /api/v1/vouchers/status/{voucher_code}
Response:
{
  "code": "SKY-1234-5678-9012",
  "status": "unused|active|expired|depleted",
  "package": "daily-basic",
  "activation_date": null,
  "data_remaining": 2147483648,
  "time_remaining": 86400
}

POST /api/v1/shops/{shop_id}/allocate
{
  "voucher_count": 100,
  "package_types": ["daily-basic", "weekly-saver"]
}
```

---

## 7. REPORTING AND ANALYTICS

### 7.1 Real-Time Dashboards

**AgilityGIS Dashboard Widgets:**
```
OPERATIONAL METRICS:
├── Active Sessions
│   ├── Current users online
│   ├── By site breakdown
│   └── By package type
│
├── Usage Statistics
│   ├── Data consumed today
│   ├── Peak concurrent users
│   └── Average session duration
│
├── Revenue Tracking
│   ├── Vouchers sold today
│   ├── Revenue by package
│   └── Commission payable
│
└── Network Health
    ├── Authentication success rate
    ├── Average latency
    └── Site availability
```

### 7.2 Automated Reports

**Daily Operations Report:**
- Voucher sales summary
- Site utilization rates
- Technical issues log
- Revenue reconciliation

**Weekly Management Report:**
- User growth trends
- Package popularity
- Spaza shop performance
- Network capacity planning

**Monthly Executive Report:**
- Financial performance
- Market penetration
- Social impact metrics
- Expansion recommendations

---

## 8. IMPLEMENTATION TIMELINE

### 8.1 Phase 1: Core Setup (Week 1-2)
```
TASKS:
□ Configure Interstellio AAA server
□ Set up AgilityGIS product catalog
□ Create RADIUS profiles
□ Configure API integrations
□ Test authentication flow
```

### 8.2 Phase 2: Site Configuration (Week 3)
```
TASKS:
□ Configure MikroTik routers
□ Set up NAS identifiers
□ Test failover scenarios
□ Configure local caching
□ Validate accounting
```

### 8.3 Phase 3: Voucher System (Week 4)
```
TASKS:
□ Generate initial voucher batch
□ Set up spaza shop accounts
□ Train shop operators
□ Test distribution system
□ Configure commission tracking
```

### 8.4 Phase 4: Go-Live (Week 5)
```
TASKS:
□ Pilot with 10 test users
□ Monitor all metrics
□ Tune performance
□ Fix any issues
□ Full launch
```

---

## 9. TROUBLESHOOTING GUIDE

### 9.1 Common Issues and Solutions

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **Auth Timeout** | User can't connect | Check RADIUS connectivity, verify shared secret |
| **Wrong Speed** | User gets incorrect bandwidth | Verify package profile, check CoA support |
| **Session Drops** | Frequent disconnections | Increase idle timeout, check interim accounting |
| **Voucher Invalid** | Code not accepted | Check validity period, verify not already used |
| **No Internet** | Connected but no access | Verify IP assignment, check NAT configuration |

### 9.2 Debug Commands

**MikroTik Debugging:**
```bash
# Monitor RADIUS requests
/radius monitor 0

# Check active hotspot sessions
/ip hotspot active print

# View RADIUS client statistics
/radius incoming print stats

# Test RADIUS authentication
/tool fetch url="http://router/login" 
  http-method=post 
  http-data="username=TEST&password=TEST"
```

**AgilityGIS API Testing:**
```bash
# Test voucher validation
curl -X GET https://api.agilitygis.com/v1/vouchers/validate \
  -H "Authorization: Bearer TOKEN" \
  -d "code=SKY-1234-5678-9012"

# Check site status
curl -X GET https://api.agilitygis.com/v1/sites/CLINIC-DIEP-001/status
```

---

## 10. SECURITY CONSIDERATIONS

### 10.1 RADIUS Security
- Use strong shared secrets (minimum 20 characters)
- Implement RADIUS over TLS (RadSec) for encryption
- Restrict RADIUS access by source IP
- Regular security audits

### 10.2 Voucher Security
- One-time use enforcement
- MAC address binding after first use
- Brute-force protection (rate limiting)
- Voucher expiry enforcement

### 10.3 Network Security
- Client isolation on WiFi
- VLAN segmentation per service
- DDoS protection at edge
- Regular security updates

---

## CONCLUSION

The integration of SkyFibre Township with AgilityGIS/Interstellio provides a robust, scalable solution for community WiFi services. The RADIUS-based authentication ensures secure access control, while the comprehensive accounting enables accurate billing and usage tracking. The platform's multi-site management capabilities position CircleTel for rapid expansion across South African townships.

**Key Success Factors:**
✅ Automated voucher management reduces operational overhead
✅ Real-time usage tracking ensures fair usage
✅ Centralized management enables efficient scaling
✅ Comprehensive reporting supports data-driven decisions
✅ Integration with existing BSS streamlines operations

---

**Document Classification:** Technical Implementation
**Review Date:** Quarterly
**Next Review:** November 2025
**Technical Contact:** noc@circletel.co.za
**Vendor Support:** support@agilitygis.com

*End of Document*