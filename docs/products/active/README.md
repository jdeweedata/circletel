# CircleTel Active Products
**Product Documentation Hub**

Welcome to the CircleTel product documentation repository. This directory contains comprehensive documentation for all active products and services offered by CircleTel.

---

## 📚 Quick Navigation

### 🎯 Start Here
- **[Product Catalogue](PRODUCT_CATALOGUE.md)** - Complete product portfolio with pricing and specifications
- **Product Selection Guide** - Find the right product for your needs (see below)

### 📁 Product Categories

#### 1. 🌐 Fibre Products
| Product | Directory | Target Market | Price Range |
|---------|-----------|---------------|-------------|
| **SkyFibre Residential** | [SkyFibre/Residential/](SkyFibre/Residential/) | Homes | R799 - R1,099 |
| **SkyFibre SME** | [SkyFibre/SME/](SkyFibre/SME/) | Small-Medium Business | R999 - R2,299 |
| **SkyFibre Business** | [SkyFibre/Business/](SkyFibre/Business/) | Enterprise | R1,999 - R7,999 |
| **SkyFibre Township** | [SkyFibre/Township/](SkyFibre/Township/) | Communities | R5/day - R199/month |
| **HomeFibreConnect** | [HomeFibreConnect/](HomeFibreConnect/) | Residential (FTTH) | R449 - R849 |
| **BizFibreConnect** | [BizFibreConnect/](BizFibreConnect/) | Business (FTTB) | R1,699 - R4,373 |

#### 2. 📡 Wireless Solutions
| Product | Directory | Target Market | Price Range |
|---------|-----------|---------------|-------------|
| **MTN 5G Business** | [MTN 5G-LTE/](MTN%205G-LTE/) | Business | R449 - R949 |

#### 3. 🔧 Managed Services
| Product | Directory | Target Market | Price Range |
|---------|-----------|---------------|-------------|
| **SD-WAN Lite** | [Managed_Services/SD_WAN_Lite/](Managed_Services/SD_WAN_Lite/) | SME (No Fibre) | R1,999 - R5,999 |
| **SmartBranch LTE** | [Managed_Services/SmartBranch_LTE/](Managed_Services/SmartBranch_LTE/) | Branch Offices | TBD |
| **EdgeConnect 360** | [Managed_Services/EdgeConnect_360/](Managed_Services/EdgeConnect_360/) | Edge Computing | TBD |

---

## 🎯 Product Selection Guide

### By Customer Type

#### 🏠 Residential/Home Users
**Budget Conscious (under R500/month)**
- [HomeFibreConnect Starter](HomeFibreConnect/) - R449/month (25 Mbps FTTH)

**Standard Home Use (R500-R1,000/month)**
- [SkyFibre Home Lite](SkyFibre/Residential/) - R799/month promo (50 Mbps)
- [HomeFibreConnect Plus](HomeFibreConnect/) - R649/month (50 Mbps FTTH)
- [HomeFibreConnect Max](HomeFibreConnect/) - R649/month (100 Mbps FTTH)

**Power Users/Families (R1,000-R1,500/month)**
- [SkyFibre Home Plus](SkyFibre/Residential/) - R899/month promo (100 Mbps)
- [SkyFibre Home Max](SkyFibre/Residential/) - R1,099/month promo (200 Mbps)

#### 🏢 Small Business (5-15 employees)
**Entry Level**
- [MTN 5G Essential](MTN%205G-LTE/) - R449/month (35 Mbps, 500GB)
- [SkyFibre SME Essential](SkyFibre/SME/) - R999/month (50 Mbps)

**Standard Business**
- [MTN 5G Professional](MTN%205G-LTE/) - R649/month (60 Mbps, 800GB)
- [SkyFibre SME Professional](SkyFibre/SME/) - R1,499/month (100 Mbps)
- [BizFibreConnect Lite](BizFibreConnect/) - R1,699/month (10 Mbps FTTB)

**No Fibre Available**
- [SD-WAN Lite Starter](Managed_Services/SD_WAN_Lite/) - R1,999/month (Dual-SIM LTE)

#### 🏭 Medium Business (15-50 employees)
**Fixed Wireless**
- [SkyFibre Business 100](SkyFibre/Business/) - R2,999/month (100 Mbps)
- [SkyFibre SME Premium](SkyFibre/SME/) - R2,299/month (200 Mbps)

**Fibre Available**
- [BizFibreConnect Plus](BizFibreConnect/) - R2,499/month (50 Mbps FTTB)
- [BizFibreConnect Pro](BizFibreConnect/) - R2,999/month (100 Mbps FTTB)

**Mobile/Redundancy**
- [SD-WAN Lite Business](Managed_Services/SD_WAN_Lite/) - R2,999/month (Dual-carrier)
- [MTN 5G Enterprise](MTN%205G-LTE/) - R949/month (Best effort, 1.5TB)

#### 🏢 Large Business/Enterprise (50+ employees)
**High Performance**
- [SkyFibre Business 200](SkyFibre/Business/) - R4,499/month (200 Mbps)
- [SkyFibre Business 300](SkyFibre/Business/) - R5,999/month (300 Mbps bonded)
- [SkyFibre Business 400](SkyFibre/Business/) - R7,999/month (400 Mbps bonded)

**Fibre**
- [BizFibreConnect Ultra](BizFibreConnect/) - R4,373/month (200 Mbps FTTB)

**SD-WAN**
- [SD-WAN Lite Enterprise](Managed_Services/SD_WAN_Lite/) - R5,999/month (Dual-carrier, 500GB)

#### 🏘️ Community/Township
**Daily/Weekly/Monthly Access**
- [SkyFibre Township](SkyFibre/Township/) - R5/day, R30/week, R199/month

---

## 🔍 Product Documentation Structure

Each product directory contains:

### Standard Documentation Files
- `ProductSpec_*.md` - Complete product specification
- `*-product-doc.md` - Detailed product documentation
- `*-specs.md` - Technical specifications
- `router-*.md` - Router and hardware recommendations
- `pricing-*.md` - Pricing structures and financial models

### SkyFibre Product Family

#### Residential
```
SkyFibre/Residential/
├── pricing-structure-v4.0.md          # Latest pricing (Oct 2025)
├── skyfibre-residential-product-doc-v7.md
├── skyfibre-home-specs.md
└── skyfibre-router-hardware-recommendations.md
```

#### SME
```
SkyFibre/SME/
├── ProductSpec_SkyFibre-SME_v2.0_2025-01-10_19.md
├── skyfibre-smb-product-doc.md
├── skyfibre-smb-specs.md
└── skyfibre-smb-router-hardware-recommendations.md
```

#### Business
```
SkyFibre/Business/
├── ProductSpec_SkyFibre-Business_v2.0_2025-01-10_19.md
└── ProductSpec_SkyFibre-Business_v2.0_2025-09-04_10-00.md
```

#### Township
```
SkyFibre/Township/
├── ProductSpec_SkyFibre-Township_v1.0_2025-01-11_00.md
├── User_Experience_Guide_v1.0_2025-08-10.md
└── RADIUS_Integration_AgilityGIS_v1.0_2025-08-10.md
```

### FTTH Products

#### HomeFibreConnect
```
HomeFibreConnect/
├── homefibreconnect-portfolio.md
├── homefibre-connect-product-doc.md
└── router-recommendations-for-homefibreconnect-doc.md
```

#### BizFibreConnect
```
BizFibreConnect/
├── bizfibre-connect-product-doc.md
├── bizfibre-connect-product-doc-v2.md
└── bizfibre-router-recommendations.md
```

### Wireless Products

#### MTN 5G/LTE
```
MTN 5G-LTE/
├── mtn-5g-product-doc.md
├── mtn-lte-uncapped-product-doc.md
└── mtn-broadband-lte-product-doc.md
```

### Managed Services

#### SD-WAN Lite
```
Managed_Services/SD_WAN_Lite/
└── ProductSpec_SD-WAN-Lite_v1.0_2025-01-10_22.md
```

#### SmartBranch LTE
```
Managed_Services/SmartBranch_LTE/
└── ProductSpec_SmartBranch-LTE-Backup_v1.0_2025-01-10_23.md
```

#### EdgeConnect 360
```
Managed_Services/EdgeConnect_360/
└── ProductSpec_EdgeConnect-360_v1.0_2025-01-10_21.md
```

---

## 📊 Key Product Metrics

### Market Segments
- **Residential:** SkyFibre Home (3 tiers), HomeFibreConnect (4 tiers)
- **SME:** SkyFibre SME (3 tiers), BizFibreConnect Lite/Starter
- **Business:** SkyFibre Business (5 tiers), BizFibreConnect Plus/Pro/Ultra
- **Township:** SkyFibre Township (6 package options)
- **Wireless:** MTN 5G/LTE (3 tiers)
- **Managed:** SD-WAN Lite (4 tiers)

### Technology Platforms
- **MTN Tarana:** SkyFibre product family
- **MTN FTTH:** HomeFibreConnect
- **DFA FTTB:** BizFibreConnect
- **MTN 5G/LTE:** Wireless solutions
- **Adapt IT APN:** SD-WAN Lite

### Price Ranges by Category
- **Residential:** R449 - R1,099/month
- **SME:** R999 - R2,299/month
- **Business:** R1,699 - R7,999/month
- **Township:** R5/day - R199/month
- **Wireless:** R449 - R949/month
- **Managed:** R1,999 - R5,999/month

---

## 🚀 Getting Started

### For Sales Team
1. Start with [Product Catalogue](PRODUCT_CATALOGUE.md) for pricing and features
2. Review product-specific documentation for technical details
3. Use Quick Reference Guide for customer recommendations

### For Technical Team
1. Review technical specifications in product-specific folders
2. Check router recommendations for hardware guidance
3. Refer to integration guides for system setup

### For Product Management
1. Complete product specs available in each directory
2. Financial models and margin analysis included
3. Market positioning and competitive analysis documented

---

## 📝 Document Conventions

### Version Control
- Documents use semantic versioning (v1.0, v2.0, etc.)
- Dates included in filenames where applicable
- Latest versions marked in catalogue

### File Naming
- `ProductSpec_` - Complete product specifications
- `*-product-doc` - Detailed product documentation
- `*-specs` - Technical specifications only
- `router-*` - Hardware recommendations
- `pricing-*` - Pricing structures

### Status Indicators
- ✅ **Active** - Current product offering
- ⚠️ **Under Review** - Pricing or features being revised
- 🚧 **Coming Soon** - In development

---

## 🔄 Updates & Maintenance

### Review Schedule
- **Monthly:** Pricing updates
- **Quarterly:** Product specifications
- **Annually:** Complete portfolio review

### Latest Updates
- **October 2025:** SkyFibre Residential pricing structure v4.0
- **January 2025:** SkyFibre Business/SME v2.0 specs
- **January 2025:** SkyFibre Township v1.0 launch
- **September 2025:** MTN 5G/LTE product updates

---

## 📞 Contact & Support

### Product Inquiries
- **Email:** products@circletel.co.za
- **Phone:** 0860 CIRCLE (247253)

### Sales Support
- **Email:** sales@circletel.co.za
- **Technical Sales:** enterprise@circletel.co.za

### Technical Documentation
- **NOC:** noc@circletel.co.za
- **Support:** support@circletel.co.za

---

## ⚠️ Important Notes

### Strategic Considerations
1. **HomeFibreConnect** - Currently under pricing review due to MTN Fibre competition
2. **SkyFibre Township** - Pilot phase with Gauteng clinics (POC deployment)
3. **SD-WAN Lite** - New offering targeting 200,000+ SMEs without fibre
4. **MTN 5G** - Promotional pricing valid until 7 September 2025

### Competitive Intelligence
- CircleTel is one of only **2 ISPs** on MTN FTTH network
- Major ISPs (Afrihost, Vox) absent from MTN FTTH
- Exclusive market positioning on MTN infrastructure

---

**Last Updated:** October 2025
**Document Version:** 1.0
**Classification:** Internal Use - Confidential

*© 2025 CircleTel (Pty) Ltd. All Rights Reserved.*
