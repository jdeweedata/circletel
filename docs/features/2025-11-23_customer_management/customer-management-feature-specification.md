<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# create the complete feature spec and provide me with a markdown doc.

Below is the complete feature specification for CircleTel ISP Admin Panel in Markdown format. This version is adapted and condensed for Markdown from your detailed DOCX. You can copy it directly into a `.md` file.

***

# CircleTel ISP Admin Panel - Customer Management Feature Specification

## Executive Summary

This document outlines comprehensive feature requirements for CircleTel’s ISP admin panel customer management system, covering the full customer lifecycle: information, service provisioning, billing, and financial document management. Designed for South African fiber and wireless ISP operations, it draws best practices from Splynx and adapts for CircleTel’s needs.

## Table of Contents

1. Introduction
2. System Overview
3. Customer Information Management
4. Services Management
5. Billing and Finance Management
6. Technical Requirements
7. User Interface Requirements
8. Integration Requirements
9. Security and Compliance
10. Future Enhancements

***

## 1. Introduction

### 1.1 Purpose

A centralized platform for customer relationships, service delivery, and billing for CircleTel’s ISP business.

### 1.2 Scope

- Customer profile/info management
- Service provisioning/lifecycle
- Billing and invoice configuration
- Financial document management
- Account tracking
- Customer communication and portal integration


### 1.3 Target Users

- Operations staff, billing/admins, support
- Management for reporting/analytics
- Customers via portal

***

## 2. System Overview

### 2.1 Core Modules

- Information: profile, contacts, location
- Services: Internet, Voice, Recurring
- Billing: finance documents, transactions, config


### 2.2 Supporting Modules

- Statistics: usage, analytics
- Documents: storage
- CPE: device management
- Lead: pipeline
- Communication: messaging, notifications


### 2.3 Key Metrics Display

| Metric | Description | Example |
| :-- | :-- | :-- |
| Account Balance | Current balance | R680.00 |
| Next Block Status | Days till service blocking | In the next billing cycle |
| Payment Method | Preferred: cash, card, EFT | Cash |
| MRR | Monthly recurring revenue/customer | R199.00 |


***

## 3. Customer Information Management

### 3.1 Top Bar Navigation

- Customer name, ID, account
- Breadcrumb
- Account balance (prominent)
- Prev/next arrows
- Quick-actions


### 3.2 Main Information Section

#### Primary Data Fields

| Field | Type | Description |
| :-- | :-- | :-- |
| ID | Auto-gen | Sequential customer ID |
| Portal Login | String | Portal username |
| Portal Password | Masked String | Show/hide capability |
| Status | Dropdown | Active, Inactive, Blocked, New, Pending |
| Full Name | String | Legal name (multi) |
| Billing Email | String (multi) | Correspondence address |
| Partner | Reference | Org/affiliate |
| Location | Reference | Service location assignment |

#### Address Info

- Street, ZIP, City, State/Province, Country, Geo, Date added


### 3.3 Status Management

| Status | Description |
| :-- | :-- |
| New | Created, no active services |
| Active | Paid services |
| Blocked | Payment overdue, restricted |
| Inactive | Suspended, no usage |

- Automated transitions, configured rules


### 3.4 Additional Info

- Labels, category (individual/business), DOB, SA ID
- Custom fields (text, date, dropdown, checkbox)


### 3.5 Maps

- Address geocoding (Google/OSM), coverage overlays


### 3.6 Comments/To-Do

- Admin notes, tasks per category (follow-up, billing), assignment, tracking, overdue highlighting


### 3.7 Activity Log

- Full audit trail: profile/service/billing/status changes, attribution, filters (period/user/system/API)

***

## 4. Services Management

### 4.1 Types

| Service | Description |
| :-- | :-- |
| Internet Services | Fiber/wireless/LTE connectivity |
| Voice Services | VoIP/telephony |
| Recurring | Extra charges |

### 4.2 Add Service Interface

| Field | Description |
| :-- | :-- |
| Plan | Tariff selection |
| Qty/Unit | Default 1, display on invoice |
| Price | Overrideable |
| Billing Period | Monthly/Quarterly/Annually/Custom |
| Start/End | Service term dates |
| Discount | % discount, start/end dates |
| Status | Active/Disabled/Paused/Pending/Archived |

### 4.3 Technical Config

- Internet: conn. type, CPE, router, PPPoE, DHCP/IP, MAC, network site


### 4.4 Actions

Edit, schedule edit, view stats, discounts, geo, change plan, cancel, delete

### 4.5 Plan Change

- Pro-rata refund or no refund, configurable downgrade fee, custom invoice timing


#### Example Calculation

- Daily rate, days used, unused, apply fees, net refund


### 4.6 Cancellation

- Popup/select date, auto refund, credit note, disabled status, bundled exclusion


### 4.7 Extra Features

Discount stacking, priority, network diagnostics (ping, traceroute, monitor, device mgmt.)

***

## 5. Billing and Finance Management

### 5.1 Structure

Tabs: finance docs, transactions, billing config

### 5.2 Metrics (Top Bar)

Account balance, block, payment method, recurring revenue

### 5.3 Documents

| Type | Purpose |
| :-- | :-- |
| One-time invoice | Single charge |
| Recurring invoice | Automated monthly |
| Proforma | Estimate/non-official |
| Credit note | Refund/adjustment |
| Payment | Received payments |
| Future Items | Scheduled transactions |
| Statement | Summary |

- Table: ID, type, number, date, total, due, payment date, status, actions
- Table: search, filter, add document, export, pagination


### 5.4 Status

| Status | Description |
| :-- | :-- |
| Unpaid | Created, no payment |
| Paid | Settled |
| Overdue | Past due |
| Pending | Processing |
| Deleted | Manual/auto deletion |

### 5.5 Payment/Refunds

- Types: transfer, card, cash, debit order, refill, custom
- Fields: date, amount, method, invoice, receipt, memo
- Priority: debit oldest, unpaid invoices, excess = balance
- Refund: negative value, reduces balance


### 5.6 Credit Notes

- Amend invoices, correct errors, apply discounts/refund
- Manual/auto creation, fields: reference, amount, reason, date


### 5.7 Future Items

- +Debit/-Credit, not applied until invoice loaded, visibility, export, deletion rules


### 5.8 Transactions

| Type | Symbol | Description |
| :-- | :-- | :-- |
| Debit | + | Amount owed |
| Credit | - | Payment received |

- Columns: date, type, category, description, debit, credit, balance, actions
- Filters: date, type, category, invoice status


### 5.9 Billing Config

- Sections: cancel last invoice, settings, payment accounts, block date, billing address, proforma settings, reminders
- Fields: billing enabled, payment period, method, billing day, due, blocking, deactivation, min balance, auto invoices, send email
- Calendar: invoice, due, block, deactivation
- Edit block date, override per cycle
- Address: separate for billing if needed


### 5.10 Financial Reports

Paid, unpaid, overdue totals, method breakdown, statements, PDF/export configuration

### 5.11 Templates \& Localization

Branding, layout, pdf/email, ZAR currency, South African locale

***

## 6. Technical Requirements

- Stack: Next.js (App Router), TypeScript, Tailwind, Supabase
- DB schema: customers, services, invoices, txns, payments, credit notes, tariffs, logs, tasks, comments
- API: RESTful, webhooks, reporting, batch, analytics
- External: Netcash/PayGate, SMTP, SMS, maps, RADIUS, accounting
- Performance: page load <2s, invoice <5s
- Security: RBAC, 2FA, session, password policy, TLS, PCI, POPIA, full audit
- Backup: daily, offsite, recovery, RTO <4h, RPO <1h

***

## 7. User Interface

- Tabs: Information, Services, Billing, Statistics, Documents, CPE, Lead, Communication
- Real-time balance, breadcrumbs, navigation arrows, actions
- Tables: responsive, sort/filter/export/pagination
- Badges: color-coded statuses
- Forms: clear labels, validation, date pickers, dropdowns searchable/multi-select
- Mobile/tablet, WCAG 2.1 AA accessibility
- Branding: CircleTel colors, icons, tooltips

***

## 8. Integration Requirements

- ZOHO (CRM, Books, Desk, Analytics)
- MikroTik API, MTN Tarana, NetFlow, RADIUS
- CPE inventory, remote monitoring, backup/restore/firmware
- Email/SMS: SMTP, BulkSMS integration, notifications, templates
- Portal messaging: attachments, receipts, archive
- Payments: Netcash, EFT, SnapScan/Zapper, manual/bank/cash

***

## 9. Security \& Compliance

- POPIA/RICA: lawful, minimization, consent, subject rights, retention
- Tax: VAT, invoice requirements, audit, 5yr record-keeping
- Permission: roles, granular/module, IP restrict, login security
- Encryption: bcrypt/Argon2, AES-256, TLS 1.3, tokenized payment, backups

***

## 10. Future Enhancements

- Phase 2: self-service portal, mobile app, advanced analytics, AI chat, credit scoring, WhatsApp API, prepaid, multi-currency
- Advanced Billing: usage-based caps, bundles, family/group, dynamic pricing, contract renewals
- Network: real-time visualization, fault/ticket, forecasting, speed tests, quality monitoring, KPI dashboard, churn/revenue analysis

***

## Glossary \& Revision History

| Term | Definition |
| :-- | :-- |
| CPE | On-site customer devices |
| MRR | Monthly recurring revenue |
| POPIA/RICA | SA privacy/comm. laws |
| Pro-rata | Time-based calculation |

| Version | Date | Author | Changes |
| :-- | :-- | :-- | :-- |
| 1.0 | 2025-11-23 | Jeffrey DeWee | Initial specification |


***

Feel free to export this to a `.md` document, adapt fields per your workflows, or request user stories, test scripts, or API details as needed.
<span style="display:none">[^1]</span>

<div align="center">⁂</div>

[^1]: document.docx

