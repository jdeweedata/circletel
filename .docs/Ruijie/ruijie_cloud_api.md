<!--
  ============================================================
  RUIJIE CLOUD API DOCUMENT — MARKDOWN REFERENCE
  ============================================================
  Source URL : https://cloud.ruijienetworks.com/help/#/ArticleList?id=7e875942927f4e3fb3e5736c8502c03c
  Mirror URL : https://cloud-as.ruijienetworks.com/help/#/ArticleList?id=7e875942927f4e3fb3e5736c8502c03c
  Last Synced: 2026-03-08
  Doc Version: 2024-08-20 (as published on source)

  NOTE: Always verify this document against the source URLs above
  before implementation. API endpoints, parameters, and response
  structures may change without notice. Re-sync recommended when:
    - Ruijie Cloud platform updates are announced
    - New firmware/software versions are released
    - Integration issues arise with existing implementations
  ============================================================
-->

# Ruijie Cloud API Document

> **Document Updated:** 2024-08-20
>
> **Source Reference:** [Ruijie Cloud Help Centre — API Documentation](https://cloud.ruijienetworks.com/help/#/ArticleList?id=7e875942927f4e3fb3e5736c8502c03c)
> *(Always check the source URL for the latest API updates and changes.)*

---

## Table of Contents

1. [Overview](#1-overview)
   - [1.1 Purpose](#11-purpose)
   - [1.2 Glossary](#12-glossary)
   - [1.3 Technical Scheme](#13-technical-scheme)
2. [Ruijie Cloud APIs](#2-ruijie-cloud-apis)
   - [2.1 Authentication APIs](#21-authentication-apis)
     - [2.1.1 Get Access Token (OAuth 2.0)](#211-get-access-token-oauth-20)
     - [2.1.2 Refresh Access Token](#212-refresh-access-token)
   - [2.2 Network Group APIs](#22-network-group-apis)
     - [2.2.1 Get Network Group List](#221-get-network-group-list)
   - [2.3 User Group & Voucher APIs](#23-user-group--voucher-apis)
     - [2.3.1 Get User Group List](#231-get-user-group-list)
     - [2.3.2 Create Voucher](#232-create-voucher)
     - [2.3.3 Create Voucher with Code](#233-create-voucher-with-code)
     - [2.3.4 Get Voucher List](#234-get-voucher-list)
     - [2.3.5 Delete Voucher](#235-delete-voucher)
   - [2.4 SAM Transfer Account APIs](#24-sam-transfer-account-apis)
     - [2.4.1 Create SAM Account](#241-create-sam-account)
     - [2.4.2 Delete SAM Account](#242-delete-sam-account)
     - [2.4.3 Get SAM Account List](#243-get-sam-account-list)
     - [2.4.4 Update SAM Account](#244-update-sam-account)
     - [2.4.5 Reset SAM Account](#245-reset-sam-account)
     - [2.4.6 Get SAM Account Status Summary](#246-get-sam-account-status-summary)
   - [2.5 Statistics APIs](#25-statistics-apis)
     - [2.5.1 Get Online Users (STA)](#251-get-online-users-sta)
     - [2.5.2 Get Network Traffic (Hourly)](#252-get-network-traffic-hourly)
     - [2.5.3 Get Application Flow](#253-get-application-flow)
   - [2.6 Device Management APIs](#26-device-management-apis)
     - [2.6.1 Get Device List](#261-get-device-list)
     - [2.6.2 Get Gateway Device Info](#262-get-gateway-device-info)
     - [2.6.3 Get Gateway Interface Info](#263-get-gateway-interface-info)
     - [2.6.4 Get AP Management Logs](#264-get-ap-management-logs)
     - [2.6.5 Get Device Performance](#265-get-device-performance)
     - [2.6.6 Get Switch Port List](#266-get-switch-port-list)
     - [2.6.7 Get Switch PoE Port Info](#267-get-switch-poe-port-info)
     - [2.6.8 Get Switch PoE Power Summary](#268-get-switch-poe-power-summary)
3. [Appendix — Response Codes](#3-appendix--response-codes)

---

## 1 Overview

### 1.1 Purpose

This document describes the modes, processes, methods, and parameters used to quickly connect third-party platforms to the **RUIJIE CLOUD**.

It provides definitions — not implementation details — of the APIs used for connection between third-party platforms and the RUIJIE CLOUD.

---

### 1.2 Glossary

| Term | Description |
|------|-------------|
| `CloudUrlPrefix` | Base URL of your regional Ruijie Cloud server, e.g. `https://cloudServer.ruijienetworks.com` |
| `appid` | Application ID assigned by the Ruijie Cloud server |
| `secret` | Secret key corresponding to the `appid`, assigned by server |
| `access_token` | Short-lived token (30 minutes) used to authenticate API requests |
| `tenantName` | Tenant account name on the Ruijie Cloud |
| `groupId` | Network group identifier |

**Example URL format:**
```
http://Serverip/service/api/maint/devices?access_token=A002B4E1E91747E0A1E569E2CB8EE07C
```

---

### 1.3 Technical Scheme

The RUIJIE CLOUD provides a **northbound interface via REST (REpresentational State Transfer)**, allowing third-party platforms to invoke RESTful APIs for secondary development.

REST advantages over SOAP used in this implementation:
- Lightweight — no need for SOAP XML
- Browser-friendly client support
- Response caching for improved speeds
- Stateless communication for service scalability
- Reduced software dependencies
- Enhanced long-term compatibility

#### API Request Flow

```
[Third-party App] → Login & Auth → [Ruijie Cloud]
                 ← access_token  ←

[Third-party App] → RESTful API call (with access_token) → [Ruijie Cloud]
                 ← Response ←

[On token expiry] → {code: 4, msg: "The token expires."}
[Third-party App] → Refresh access_token → [Ruijie Cloud]
                 ← New access_token ←
[Third-party App] → Re-invoke RESTful API (new token) → [Ruijie Cloud]
```

**Important Notes:**
- The `access_token` expires after **30 minutes**.
- Always check the `code` field in each response. If `code == 4`, the token has expired.
- Supported HTTP methods: `GET`, `POST`, `DELETE`, `PUT`
- Parameter formats: `JsonParam` (body, `application/json`), `PathParam` (in URL path), `QueryParam` (URL query string)

---

## 2 Ruijie Cloud APIs

---

### 2.1 Authentication APIs

#### 2.1.1 Get Access Token (OAuth 2.0)

| Field | Value |
|-------|-------|
| **URL** | `[CloudUriPrefix]/service/api/oauth20/client/access_token?token=d63dss0a81e4415a889ac5b78fsc904a` |
| **Method** | `POST` |

**JsonParam Request Body:**

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `appid` | String | M | Application ID assigned by server |
| `secret` | String | M | Secret key assigned by server |

**Request Example:**
```bash
POST https://{{cloudserver}}/service/api/oauth20/client/access_token?token=d63dss0a81e4415a889ac5b78fsc904a \
  --header "Content-Type: application/json" \
  --data '{"appid": "Tartestxxxxx","secret": "Dartestxxxxx"}'
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "OK.",
  "accessToken": "jJVmxTfIVok7D0ol5z9Q6oCMkHJPEERl"
}
```

---

#### 2.1.2 Refresh Access Token

| Field | Value |
|-------|-------|
| **URL** | `[CloudUrlPrefix]/service/api/token/refresh?appid={}&secret={}&access_token={}` |
| **Method** | `GET` |

**QueryParam Parameters:**

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `appid` | String | M | Application ID assigned by server |
| `secret` | String | M | Secret key assigned by server |
| `access_token` | String | M | The current (expiring) access token |

**Returned Parameters:**

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `code` | int | M | `0` = success; non-0 = failed |
| `msg` | String | O | Code description |
| `accessToken` | String | O | New token assigned by Ruijie Cloud |

**Request Example:**
```
GET https://cloudServer.ruijienetworks.com/service/api/token/refresh?appid=xxx2&secret=11xxxxx1&access_token=C1EF2AE38BD04A5CB83D4D8CB5DF374E
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "OK.",
  "accessToken": "C1EF2AE38BD04A5CB83D4D8CB5DF374E"
}
```

---

### 2.2 Network Group APIs

#### 2.2.1 Get Network Group List

| Field | Value |
|-------|-------|
| **Description** | Get the network group tree. If your tree has Location, Building, and Sub-group levels, the full hierarchy is returned. |
| **URL** | `[CloudUrlPrefix]/service/api/group/single/tree?depth=BUILDING&access_token={}` |
| **Method** | `GET` |

**QueryParam Parameters:**

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `access_token` | String | M | Valid access token |
| `depth` | String | O | Tree depth level, e.g. `BUILDING` |

**Response Example:**
```json
{
  "code": 0,
  "msg": "OK.",
  "groups": {
    "name": "dumy",
    "timezone": "Asia/Shanghai",
    "groupId": 0,
    "subGroups": [
      {
        "name": "ProjectSDDD",
        "groupId": 12480,
        "type": "LOCATION",
        "businessType": "MARKET",
        "subGroups": [
          {
            "name": "HomeDDA",
            "groupId": 12482,
            "type": "BUILDING",
            "businessType": "UNCERTAIN"
          }
        ]
      }
    ]
  },
  "rootGroupName": "dumy",
  "rootGroupId": 0
}
```

---

### 2.3 User Group & Voucher APIs

#### 2.3.1 Get User Group List

| Field | Value |
|-------|-------|
| **URL** | `[CloudUrlPrefix]/service/api/intl/usergroup/list/{group_Id}?pageIndex={start}&pageSize={pageSize}&access_token={}` |
| **Method** | `GET` |

**PathParam Parameters:**

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `group_Id` | Integer | M | Network Group ID from "Get Network Group List" |

**QueryParam Parameters:**

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `pageIndex` | Integer | M | Start index (0-based) |
| `pageSize` | Integer | M | Number of records per page (e.g. `1000` to fetch all if total < 1000) |
| `access_token` | String | M | Valid access token |

**Returned `data` Fields:**

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `id` | Int | M | UserGroup ID |
| `userGroupName` | String | — | Group name |
| `authProfileId` | String | — | Profile UUID used when creating vouchers |
| `timePeriod` | Int | — | Session time limit (minutes) |
| `quota` | Float | — | Data quota (MB) |
| `downloadRateLimit` | Int | — | Download limit (Kbps) |
| `uploadRateLimit` | Int | — | Upload limit (Kbps) |
| `packageType` | String | — | Package type |

**Request Example:**
```
GET https://{{server}}/service/api/intl/usergroup/list/449441?pageIndex=0&pageSize=20&access_token=tGdm3muWyoT0oM5S9B6oTaKTOISnJV9p
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "OK.",
  "data": [
    {
      "id": 18067,
      "userGroupName": "StaffGroup",
      "authProfileId": "30113648274480073538014045592098",
      "timePeriod": 30,
      "quota": 100.0,
      "downloadRateLimit": 0,
      "uploadRateLimit": 0,
      "packageType": "COMMON"
    }
  ],
  "count": 2,
  "maxAllowNum": 20
}
```

---

#### 2.3.2 Create Voucher

| Field | Value |
|-------|-------|
| **URL** | `[CloudUrlPrefix]/service/api/intlSamVoucher/create/{tenantName}/{userName}/{groupId}?access_token={}` |
| **Method** | `POST` |

**PathParam Parameters:**

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `tenantName` | String | M | Tenant name |
| `userName` | String | M | User name |
| `groupId` | Integer | M | Network Group ID |

**JsonParam Parameters:**

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `profile` | String | M | Profile package UUID from "Get User Group List" (`authProfileId`) |
| `userGroupId` | int | M | User Group ID from "Get User Group List" (`id`) |

---

#### 2.3.3 Create Voucher with Code

| Field | Value |
|-------|-------|
| **URL** | `[CloudUrlPrefix]/service/api/intlSamVoucher/create/{tenantName}/{userName}/{groupId}/{code}?access_token={}&tenantId={}` |
| **Method** | `POST` |

**PathParam Parameters:**

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `tenantName` | String | M | Tenant name |
| `userName` | String | M | User name |
| `groupId` | String | M | Network Group ID from "Get Network Group List" |
| `code` | String | M | Custom voucher code |

**QueryParam Parameters:**

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `access_token` | String | M | Valid access token |
| `tenantId` | String | M | Tenant ID |

**JsonParam Parameters:**

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `profile` | String | M | Profile package UUID from "Get Voucher Package List" |

**Response Example:**
```json
{ "code": 0, "msg": "OK." }
```

---

#### 2.3.4 Get Voucher List

| Field | Value |
|-------|-------|
| **URL** | `[CloudUrlPrefix]/service/api/intlSamVoucher/getList/{tenantName}/{groupId}?access_token={}&tenantId={}&start={}&pageSize={}` |
| **Method** | `GET` |

**Returned `voucherData.list` Fields:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `uuid` | String | Voucher UUID |
| `voucherCode` | String | Voucher code |
| `nameRef` | String | Reference name |
| `timePeriod` | Int | Validity period (minutes) |
| `usedTime` | Int | Used time (minutes) |
| `maxClients` | Int | Max simultaneous devices |
| `quota` | Int | Data quota (MB) |
| `usedQuota` | Int | Used data (MB) |
| `status` | String | `"1"` = active |
| `qrcodeUrl` | String | QR code URL |
| `downloadRateLimit` | Int | Download rate limit (Kbps) |
| `uploadRateLimit` | Int | Upload rate limit (Kbps) |
| `packageName` | String | Package name |

**Response Example:**
```json
{
  "code": 0,
  "msg": "OK.",
  "voucherData": {
    "count": 13,
    "list": [
      {
        "uuid": "3c36bc35f3444394bc0fda39a3a62225",
        "voucherCode": "pgnazc",
        "nameRef": "",
        "timePeriod": 10080,
        "maxClients": 2,
        "quota": 200,
        "status": "1",
        "packageName": "7DayWiFi"
      }
    ]
  }
}
```

---

#### 2.3.5 Delete Voucher

| Field | Value |
|-------|-------|
| **URL** | `[CloudUrlPrefix]/service/api/intlSamVoucher/delete/{uuid}?access_token={}` |
| **Method** | `DELETE` |

**PathParam Parameters:**

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `uuid` | String | M | Voucher UUID to delete |

**QueryParam Parameters:**

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `access_token` | String | M | Valid access token |

**Response Example:**
```json
{ "code": 0, "msg": "OK." }
```

---

### 2.4 SAM Transfer Account APIs

#### 2.4.1 Create SAM Account

| Field | Value |
|-------|-------|
| **URL** | `[CloudUrlPrefix]/service/api/samTransfer/account/create/{tenantName}/{userName}/{groupId}?access_token={}&tenantId={}&ishttps={}` |
| **Method** | `POST` |

**PathParam Parameters:**

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `tenantName` | String | M | Tenant name |
| `userName` | String | M | User name |
| `groupId` | Integer | M | Group ID |

**QueryParam Parameters:**

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `access_token` | String | M | Valid access token |
| `tenantId` | String | M | Tenant ID |
| `ishttps` | String | O | Use HTTPS: `true` or `false` |

**JsonParam Parameters:**

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `username` | String | M | Account name |
| `password` | String | M | Account password |
| `profileId` | String | M | Package/Profile ID |
| `refName` | Double | O | Alias name |

**Returned Parameters:**

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `code` | int | M | Response code |
| `msg` | String | O | Code message (omitted on success) |

---

#### 2.4.2 Delete SAM Account

| Field | Value |
|-------|-------|
| **URL** | `[CloudUrlPrefix]/service/api/samTransfer/account/delete/{groupId}?access_token={}&tenantId={}&ishttps={}` |
| **Method** | `POST` |

**JsonParam Parameters:**

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `uuids` | String[] | M | Array of account UUIDs to delete |

**Returned Parameters:**

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `code` | int | M | Response code |
| `msg` | String | O | Code message |

---

#### 2.4.3 Get SAM Account List

| Field | Value |
|-------|-------|
| **URL** | `[CloudUrlPrefix]/service/api/samTransfer/account/getList/{tenantName}/{groupId}?access_token={}&tenantId={}&ishttps={}&start={}&pageSize={}&name={}&createBegin={}&createEnd={}` |
| **Method** | `GET` |

**QueryParam Parameters:**

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `access_token` | String | M | Valid access token |
| `tenantId` | String | M | Tenant ID |
| `ishttps` | String | O | Use HTTPS |
| `start` | Int | M | Start index |
| `pageSize` | Int | M | Page size |
| `name` | String | O | Filter by account name |
| `createBegin` | String | O | Filter by creation start date |
| `createEnd` | String | O | Filter by creation end date |

**Response Example:**
```json
{
  "code": 0,
  "msg": "OK.",
  "count": 2,
  "list": [
    {
      "uuid": "912e12380275461b9757ce9dd0ddd053",
      "refName": "alias name",
      "username": "test_account_name_02",
      "password": "123456",
      "createTime": 1604307006000,
      "profileId": "14251152229359204590000804102161",
      "profileName": "4233423",
      "status": "1",
      "quotalimit": 100,
      "usedQuota": 0,
      "maxClients": 3,
      "timePeriod": 30
    }
  ]
}
```

---

#### 2.4.4 Update SAM Account

| Field | Value |
|-------|-------|
| **URL** | `[CloudUrlPrefix]/service/api/samTransfer/account/update?access_token={}&tenantId={}&ishttps={}` |
| **Method** | `POST` |

---

#### 2.4.5 Reset SAM Account

| Field | Value |
|-------|-------|
| **URL** | `[CloudUrlPrefix]/service/api/samTransfer/account/reset?access_token={}&tenantId={}&ishttps={}` |
| **Method** | `POST` |

---

#### 2.4.6 Get SAM Account Status Summary

| Field | Value |
|-------|-------|
| **URL** | `[CloudUrlPrefix]/service/api/samTransfer/account/getStatusSummary/{tenantName}/{groupId}?access_token={}&tenantId={}&ishttps={}` |
| **Method** | `GET` |

**Response Example:**
```json
{
  "code": 0,
  "msg": "OK.",
  "total": 2,
  "used": 0,
  "expired": 0
}
```

---

### 2.5 Statistics APIs

#### 2.5.1 Get Online Users (STA)

| Field | Value |
|-------|-------|
| **URL** | `[CloudUrlPrefix]/logbizagent/logbiz/api/sta/sta_users?access_token={}` |
| **Method** | `POST` |

**JsonParam Parameters:**

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `groupId` | int | M | Network Group ID from "Get Network Group List" |
| `pageIndex` | int | M | Page start index (0-based). For page N: `(N-1) * pageSize` |

**Response `list` Fields:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `mac` | String | Client MAC address |
| `userIp` | String | Client IP address |
| `ssid` | String | Connected SSID |
| `rssi` | String | Signal strength (dBm) |
| `band` | String | Radio band (`2.4G` / `5G`) |
| `channel` | String | Channel number |
| `onlineTime` | Long | Online timestamp (ms) |
| `activeTime` | Long | Active duration (ms) |
| `downlinkRate` | Float | Downlink rate (bps) |
| `uplinkRate` | Float | Uplink rate (bps) |
| `score` | Int | Connection quality score |
| `scoreReason` | String | Reason for score |
| `sn` | String | AP serial number |
| `timeDelay` | Int | Latency (ms) |

**Response Example:**
```json
{
  "code": 0,
  "msg": "OK.",
  "list": [
    {
      "mac": "ff61.f313.0101",
      "userIp": "192.168.110.11",
      "ssid": "NAHK0046H0008",
      "rssi": "-67",
      "band": "2.4G",
      "channel": "1",
      "onlineTime": 1716804247000,
      "downlinkRate": 8222548.0,
      "uplinkRate": 1538630.0,
      "score": 27,
      "scoreReason": "heavy interference",
      "sn": "NAHK0046H0008",
      "timeDelay": 64
    }
  ],
  "count": 1
}
```

---

#### 2.5.2 Get Network Traffic (Hourly)

| Field | Value |
|-------|-------|
| **URL** | `[CloudUrlPrefix]/logbizagent/logbiz/api/flow/show/hour?access_token={}` |
| **Method** | `POST` |

**Returned Parameters:**

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `code` | int | M | Response code |

**Response Example:**
```json
{
  "code": 0,
  "msg": "OK.",
  "count": 2,
  "list": [
    {
      "buildingId": 58959,
      "rxBytes": 297421,
      "rxPkts": 1592,
      "txBytes": 297964,
      "txPkts": 1498,
      "timeString": "2021-09-23 03:30:00",
      "timeStamp": 1632339000000
    }
  ]
}
```

---

#### 2.5.3 Get Application Flow

| Field | Value |
|-------|-------|
| **Method** | `POST` |

**JsonParam Parameters:**

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `groupId` | Int | M | Account Root Group ID (all sub-groups included) |

**Response Example:**
```json
{
  "code": 0,
  "msg": "ok.",
  "totalCount": 27,
  "list": [
    {
      "appGroupName": "Other",
      "appName": "TikTok",
      "downFlow": 35970,
      "upDownFlow": 99741,
      "upFlow": 63771
    }
  ]
}
```

---

### 2.6 Device Management APIs

#### 2.6.1 Get Device List

| Field | Value |
|-------|-------|
| **URL** | `[CloudUrlPrefix]/service/api/maint/devices?access_token={}` |
| **Method** | `GET` |

**QueryParam Parameters:**

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `access_token` | String | M | Valid access token |
| `page` | Int | O | Page number |
| `per_page` | Int | O | Records per page |
| `group_id` | Int | O | Filter by group ID |
| `product_type` | String | O | Filter by type: `AP`, `EGW`, `MSW`, etc. |

**Request Example:**
```
GET https://Server.ruijienetworks.com/service/api/maint/devices?page=1&per_page=10&group_id=57805&product_type=AP&access_token=x9oI0oP1E8b8r9J2oawukhdbU2iGzqGk
```

**Response `deviceList` Fields:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `serialNumber` | String | Device serial number |
| `productClass` | String | Product model |
| `productType` | String | Product type (AP/EGW/MSW) |
| `hardwareVersion` | String | Hardware version |
| `softwareVersion` | String | Firmware version |
| `onlineStatus` | String | `ON` or `OFF` |
| `offlineReason` | String | Reason for offline state |
| `aliasName` | String | Device alias |
| `groupId` | Int | Network group ID |
| `groupName` | String | Network group name |
| `timezone` | String | Device timezone |
| `localIp` | String | LAN IP address |
| `cpeIp` | String | WAN IP address |
| `mac` | String | MAC address |
| `lastOnline` | Long | Last online timestamp (ms) |
| `createTime` | Long | Registration timestamp (ms) |
| `confSyncType` | String | Config sync status |
| `apMode` | String | AP mode (FAT/FIT) |

**Response Example:**
```json
{
  "code": 0,
  "msg": "OK.",
  "deviceList": [
    {
      "serialNumber": "G1LQ68P016011",
      "productClass": "AP720-I",
      "productType": "AP",
      "onlineStatus": "ON",
      "groupId": 154845,
      "groupName": "Binnykuoll",
      "localIp": "192.168.110.60",
      "mac": "5869.6ce9.100e",
      "confSyncType": "UP_TO_DATE",
      "apMode": "FAT"
    }
  ],
  "totalCount": 2
}
```

---

#### 2.6.2 Get Gateway Device Info

| Field | Value |
|-------|-------|
| **Method** | `GET` |

**Response Example:**
```json
{
  "code": 0,
  "msg": "OK.",
  "groupId": 189279,
  "localIp": "192.168.200.4",
  "productClass": "EG205G-V2",
  "productType": "EGW",
  "softwareVersion": "ReyeeOS1.53.1621",
  "onlineStatus": "ON",
  "mac": "00d0.f815.0843",
  "serialNumber": "MACC942570020",
  "name": "Gateway"
}
```

---

#### 2.6.3 Get Gateway Interface Info

| Field | Value |
|-------|-------|
| **URL** | `[CloudUrlPrefix]/service/api/gateway/intf/info/{sn}?access_token={}` |
| **Method** | `GET` |

**PathParam Parameters:**

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `sn` | String | M | Device serial number |

**Response `data` Fields:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `alias` | String | Interface alias (e.g. `Gi0/0`) |
| `sn` | String | Device serial number |
| `type` | String | `WAN` or `LAN` |
| `ipAddr` | String | IP address |
| `ipMask` | String | Subnet mask |
| `ipType` | String | IP type (`dhcp`, `none`, etc.) |
| `mtu` | Int | MTU size |
| `bandwidth` | Int | Interface bandwidth (Kbps) |
| `speed` | String | Current speed |
| `pppoe` | String | PPPoE enabled: `true`/`false` |
| `poeStatus` | String | PoE status (`On`/`Off`/`Unsupport`) |
| `dhcpInfo` | Object | DHCP pool configuration |

**Response Example:**
```json
{
  "code": 0,
  "msg": "OK.",
  "data": [
    {
      "alias": "Gi0/0",
      "sn": "H1NA1WA000705",
      "type": "WAN",
      "ipAddr": "42.200.231.215",
      "ipMask": "255.255.255.0",
      "ipType": "dhcp",
      "mtu": 1500,
      "bandwidth": 1000000,
      "speed": "100M",
      "poeStatus": "Off"
    }
  ]
}
```

---

#### 2.6.4 Get AP Management Logs

| Field | Value |
|-------|-------|
| **URL** | `[CloudUrlPrefix]/service/api/apmgt/apinfo/{sn}/devicemgtlogs?access_token={}` |
| **Method** | `GET` |

**PathParam Parameters:**

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `sn` | String | M | AP serial number |

**Response `data.list` Fields:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | Int | Log ID |
| `sn` | String | Device serial number |
| `logType` | String | Log type (`reboot`, `onoffline`) |
| `logDetail` | String | Log description |
| `operateTime` | Long | Event timestamp (ms) |

**Response Example:**
```json
{
  "code": 0,
  "msg": "OK.",
  "data": {
    "count": 17,
    "list": [
      {
        "id": 9,
        "sn": "123494257001C",
        "logType": "reboot",
        "logDetail": "Device restart",
        "operateTime": 1647829099000
      }
    ]
  }
}
```

---

#### 2.6.5 Get Device Performance

| Field | Value |
|-------|-------|
| **URL** | `[CloudUrlPrefix]/logbizagent/logbiz/api/sys/current_performance?access_token={}` |
| **Method** | `GET` |

**Response `data` Fields:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `cpuRate` | Float | CPU utilization (%) |
| `cpuTemp` | Float | CPU temperature |
| `memoryRate` | Float | Memory utilization (%) |
| `memoryFree` | Int | Free memory (KB) |
| `flashRate` | Float | Flash utilization (%) |
| `flashFree` | Int | Free flash (KB) |
| `diskRate` | Float | Disk utilization (%) |
| `diskFree` | Int | Free disk (KB) |
| `processNum` | Int | Number of running processes |

**Response Example:**
```json
{
  "code": 0,
  "msg": "OK.",
  "data": {
    "cpuTemp": 0.0,
    "cpuRate": 30.0,
    "processNum": 179,
    "memoryRate": 63.0,
    "memoryFree": 114336,
    "flashRate": 67.0,
    "flashFree": 84892,
    "diskRate": 0.0,
    "diskFree": 0
  }
}
```

---

#### 2.6.6 Get Switch Port List

| Field | Value |
|-------|-------|
| **Method** | `GET` |

**Response `portList` Fields:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sn` | String | Switch serial number |
| `port` | Int | Port index |
| `name` | String | Port name |
| `alias` | String | Port alias |
| `isUplink` | String | Is uplink port |
| `type` | String | Port type (`Access`/`Trunk`) |
| `vlan` | Int | VLAN ID |
| `status` | String | `Up` or `Down` |
| `speed` | String | Current speed |
| `mediumType` | String | Medium type (`Copper`/`Fiber`) |
| `duplexMode` | String | Duplex mode |
| `poeStatus` | String | PoE status |
| `productType` | String | Device product type |
| `productClass` | String | Device model |

---

#### 2.6.7 Get Switch PoE Port Info

| Field | Value |
|-------|-------|
| **URL** | `[CloudUrlPrefix]/service/api/conf/switch/device/{sn}/poe/info` |
| **Method** | `GET` |

**Response `data` Fields:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `port` | Int | Port index |
| `sn` | String | Switch serial number |
| `poeAdminStatus` | String | Admin status (`On`/`Off`) |
| `poeStatus` | String | Current PoE status |
| `powerUsed` | String | Power consumed (e.g. `5.42 W`) |

**Response Example:**
```json
{
  "code": 0,
  "msg": "OK.",
  "data": [
    { "port": 0, "sn": "NAEK29DFH0005", "poeAdminStatus": "On", "poeStatus": "On", "powerUsed": "5.42 W" },
    { "port": 1, "sn": "NAEK29DFH0005", "poeAdminStatus": "On", "poeStatus": "On", "powerUsed": "3.32 W" }
  ],
  "count": 2
}
```

---

#### 2.6.8 Get Switch PoE Power Summary

| Field | Value |
|-------|-------|
| **URL** | `[CloudUrlPrefix]/service/api/conf/switch/device/{sn}/poe/pwr` |
| **Method** | `GET` |

**Response `data` Fields:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sn` | String | Switch serial number |
| `tenantId` | Int | Tenant ID |
| `groupId` | Int | Group ID |
| `maxPower` | String | Maximum PoE budget (e.g. `370.00 W`) |
| `curPower` | String | Current power draw (e.g. `16.20 W`) |

**Response Example:**
```json
{
  "code": 0,
  "msg": "OK.",
  "data": {
    "sn": "NAEK29DFH0005",
    "tenantId": 118458,
    "groupId": 5805213,
    "maxPower": "370.00 W",
    "curPower": "16.20 W"
  }
}
```

---

## 3 Appendix — Response Codes

| Code Range | Meaning | Action Required |
|------------|---------|-----------------|
| `0` | Operation successful | None |
| `> 0` | Service logic not completed | Developer must handle |
| `-50 ≤ code ≤ -1` | Authorization/verification failure or service exception | Developer must handle |
| `< -50` | Internal error | Contact Ruijie Cloud platform management |
| `4` | `access_token` expired | Refresh token and retry |
| `1009` | Login failed — cause included in message | Check credentials |

**Error Message Example:**
```
Login failed, cause: incorrect password
```

---

> **⚠️ Sync Reminder**
>
> This document was last synced on **2026-03-08** from the official Ruijie Cloud Help Centre.
> Always verify against the source before production use:
>
> - 🌐 **Primary:** https://cloud.ruijienetworks.com/help/#/ArticleList?id=7e875942927f4e3fb3e5736c8502c03c
> - 🌐 **Mirror (AS region):** https://cloud-as.ruijienetworks.com/help/#/ArticleList?id=7e875942927f4e3fb3e5736c8502c03c
