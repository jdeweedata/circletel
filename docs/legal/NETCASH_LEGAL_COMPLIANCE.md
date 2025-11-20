# NetCash Legal Compliance System

**Version:** 1.0
**Last Updated:** 2025-01-20
**Status:** Production Ready

## Overview

The NetCash Legal Compliance System ensures CircleTel's payment processing complies with South African legal requirements including POPIA (Protection of Personal Information Act) and NetCash's merchant obligations.

This system:
- Captures customer consent for all required legal policies
- Maintains an immutable audit trail of consent acceptance
- Supports both B2C (consumer) and B2B (business) customer flows
- Integrates with NetCash PCI DSS Level 1 certified payment gateway

## Key Features

### 1. Policy Pages

Four comprehensive policy pages accessible to all users:

| Policy | URL | Purpose |
|--------|-----|---------|
| Terms & Conditions | `/terms` | General service terms |
| Privacy Policy | `/privacy-policy` | Data protection and privacy |
| Payment Terms | `/payment-terms` | NetCash payment processing details |
| Refund & Cancellation | `/refund-policy` | 30-day money-back guarantee |

### 2. Consent Capture

**B2C (Consumer) Consents:**
- ✅ Terms & Conditions (required)
- ✅ Privacy Policy (required)
- ✅ Payment Terms (required)
- ℹ️ Refund Policy Acknowledgment (optional)
- ℹ️ Recurring Payment Authorization (optional - for subscriptions)
- ℹ️ Marketing Communications (optional)

**B2B (Business) Enhanced Consents:**
All B2C consents above, PLUS:
- ✅ Data Processing Authorization (POPIA compliance)
- ✅ Third-Party Disclosure Consent (ISPs, payment processors, KYC providers)
- ✅ Business Verification Authority (confirms signer can bind company)

### 3. Audit Trail

Every consent acceptance is logged with:
- Policy versions accepted (dated 2025-01-20)
- Timestamp of acceptance (UTC)
- IP address of customer
- User-Agent (browser/device information)
- Transaction/Order/Quote references
- Customer identification

### 4. Data Storage

**Database Table:** `payment_consents`

**Location:** Supabase database (project: `agyjovdugmtopasyvlng`)

**Security:**
- Row Level Security (RLS) enabled
- Customers can view only their own consents
- Admins can view all consents
- Service role required for insertion

**Retention:** Permanent (required for legal compliance)

## Legal Compliance

### POPIA Compliance

The system ensures compliance with South Africa's Protection of Personal Information Act:

1. **Explicit Consent:** All data processing requires explicit opt-in consent
2. **Purpose Specification:** Each consent clearly states what data is used for
3. **Third-Party Disclosure:** Customers explicitly consent to data sharing with service providers
4. **Audit Trail:** Immutable record of when and how consent was obtained
5. **Right to Access:** Customers can view their consent history

### NetCash Merchant Obligations

As per NetCash merchant requirements:

1. **Payment Terms Disclosure:** Customers must acknowledge payment terms before payment
2. **PCI DSS Compliance:** Payment data handling follows PCI DSS Level 1 standards
3. **Refund Policy:** Clear refund policy displayed and acknowledged
4. **Data Protection:** Customer payment data is tokenized and not stored by CircleTel

### Record Keeping

All consent records are kept permanently for:
- Legal dispute resolution
- Regulatory audits
- POPIA compliance verification
- Customer support inquiries

## User Experience

### Consumer Flow (B2C)

1. Customer selects a package and proceeds to checkout
2. Payment form displays with consent checkboxes
3. Required consents are marked with asterisk (*)
4. Policy links open in new tabs for review
5. Form validation prevents submission without required consents
6. Upon submission, consents are logged with audit trail
7. Payment proceeds to NetCash gateway

### Business Flow (B2B)

1. Business customer requests a quote
2. Quote request form includes enhanced B2B consent section
3. Additional business-specific consents are required:
   - Data processing authorization
   - Third-party disclosure consent
   - Business verification authority
4. Form validates all B2B consents before submission
5. Quote is created and consents are logged
6. When quote is approved and payment initiated, payment consents are also captured

## Security & Privacy

### Data Protection

1. **Encryption in Transit:** All consent data transmitted via HTTPS
2. **Encryption at Rest:** Database encryption enabled on Supabase
3. **Access Control:** RLS policies restrict data access
4. **Audit Logging:** All consent logging operations are logged

### Privacy by Design

1. **Minimal Data Collection:** Only necessary consent data is collected
2. **Purpose Limitation:** Consent data used only for compliance purposes
3. **Data Accuracy:** Timestamps and IP addresses ensure accurate records
4. **Storage Limitation:** Data retained as required by law, no longer

### Customer Rights

Customers have the right to:
1. **Access:** View their consent history via customer dashboard (planned)
2. **Rectification:** Update contact information (consent records are immutable)
3. **Portability:** Request copy of consent records
4. **Complaint:** File complaints with Information Regulator

## Monitoring & Maintenance

### Health Checks

Monitor the following:

1. **Consent Logging Success Rate:**
   ```sql
   -- Check recent consent logs
   SELECT
     DATE(consent_timestamp) as date,
     COUNT(*) as total_consents,
     COUNT(DISTINCT customer_email) as unique_customers
   FROM payment_consents
   WHERE consent_timestamp >= NOW() - INTERVAL '7 days'
   GROUP BY DATE(consent_timestamp)
   ORDER BY date DESC;
   ```

2. **Policy Version Currency:**
   - Ensure all new consents use latest policy versions
   - Update policy versions when policies are amended

3. **Missing Consents:**
   ```sql
   -- Find payments without consent logs
   SELECT
     pt.transaction_id,
     pt.created_at,
     pt.amount
   FROM payment_transactions pt
   LEFT JOIN payment_consents pc ON pc.payment_transaction_id = pt.id
   WHERE pt.created_at >= '2025-01-20'
   AND pc.id IS NULL;
   ```

### Policy Updates

When updating policies:

1. Update policy page content
2. Update version in `lib/constants/policy-versions.ts`
3. Update `POLICY_VERSIONS` object with new date
4. Commit changes with clear commit message
5. Deploy to production
6. Notify customers of material changes (if required by law)

### Troubleshooting

**Issue: Consents not being logged**

1. Check API console logs for errors
2. Verify `logPaymentConsents()` is being called
3. Check Supabase service role key is configured
4. Verify RLS policies allow insertion

**Issue: Customer cannot submit payment**

1. Check consent validation errors in browser console
2. Verify all required checkboxes are checked
3. Check for JavaScript errors preventing validation
4. Verify policy links are accessible

**Issue: Admin cannot view consents**

1. Verify admin user has `is_active = true` in `admin_users` table
2. Check RLS policy on `payment_consents` table
3. Verify admin is using correct email address

## Future Enhancements

### Planned Features

1. **Customer Dashboard:**
   - View consent history
   - Download consent records
   - Manage marketing preferences

2. **Admin Dashboard:**
   - Consent analytics and reporting
   - Export consents for audits
   - Search and filter consent logs

3. **Compliance Reports:**
   - Generate POPIA compliance reports
   - Export for regulatory audits
   - Automated compliance checks

4. **Version Management:**
   - Track policy version changes
   - Show customers policy diffs
   - Automated re-consent flows

## Support & Contact

### For System Administrators

Technical issues: Reference this document and developer guide

### For Compliance Queries

Legal compliance questions: Consult with CircleTel legal team

### For Customer Support

Customer consent questions: Reference audit trail in `payment_consents` table

## References

- POPIA: [Protection of Personal Information Act, 2013](https://popia.co.za/)
- NetCash: [NetCash Legal Page](https://netcash.co.za/legal-page/)
- PCI DSS: [Payment Card Industry Data Security Standard](https://www.pcisecuritystandards.org/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-20 | Initial implementation - Full NetCash legal compliance system |

---

**Document Maintained By:** CircleTel Development Team
**Review Cycle:** Quarterly or upon legal/regulatory changes
