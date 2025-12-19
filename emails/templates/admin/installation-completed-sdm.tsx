/**
 * Installation Completed - Service Delivery Manager Notification
 *
 * Sent to SDM when technician marks installation as complete
 * Includes order details, document status, and QA review link
 */

import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Preview,
  Container,
  Section,
  Text,
  Hr,
  Link,
} from '@react-email/components';
import {
  CircleTelHeader,
  CircleTelHero,
  CircleTelTextBlock,
  CircleTelButton,
  CircleTelServiceDetails,
  CircleTelFooter,
  emailStyles,
  brandColors,
  ServiceDetail,
} from '../../slices';

export interface InstallationCompletedSDMEmailProps {
  orderNumber: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  installationAddress: string;
  packageName: string;
  technicianName: string;
  completionDate: string;
  documentUploaded: boolean;
  documentUrl?: string;
  documentName?: string;
  notes?: string;
  adminOrderUrl: string;
}

export const InstallationCompletedSDMEmail: React.FC<InstallationCompletedSDMEmailProps> = ({
  orderNumber = 'ORD-20251219-1234',
  orderId = 'abc-123',
  customerName = 'John Smith',
  customerPhone = '+27 82 123 4567',
  installationAddress = '123 Main Street, Boksburg, 1459',
  packageName = 'MTN Fixed LTE 100GB',
  technicianName = 'Kegan Struiss',
  completionDate = '19 December 2025 at 14:30',
  documentUploaded = true,
  documentUrl,
  documentName = 'JobHistory-598272.pdf',
  notes,
  adminOrderUrl = 'https://www.circletel.co.za/admin/orders/abc-123',
}) => {
  const installationDetails: ServiceDetail[] = [
    { label: 'Order Number', value: orderNumber, icon: '#' },
    { label: 'Customer', value: customerName, icon: '👤' },
    { label: 'Phone', value: customerPhone, icon: '📱' },
    { label: 'Address', value: installationAddress, icon: '📍' },
    { label: 'Package', value: packageName, icon: '📦' },
    { label: 'Technician', value: technicianName, icon: '👷' },
    { label: 'Completed', value: completionDate, icon: '✓' },
  ];

  return (
    <Html>
      <Head />
      <Preview>
        Installation Complete - {orderNumber} - Quality Review Required
      </Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          {/* Header */}
          <CircleTelHeader />

          {/* Hero Section */}
          <CircleTelHero
            title="Installation Completed"
            subtitle={`Order ${orderNumber} has been marked as complete by the technician.`}
            icon="✓"
            variant="gradient"
          />

          {/* Action Required Notice */}
          <Section style={emailStyles.section}>
            <div
              style={{
                backgroundColor: '#FEF3C7',
                borderLeft: `4px solid ${brandColors.warning}`,
                padding: '15px',
                margin: '0 0 20px 0',
              }}
            >
              <Text style={{ margin: '0', fontSize: '14px', color: '#92400E', fontWeight: '600' }}>
                Action Required: Please verify installation quality and approve for activation.
              </Text>
            </div>
          </Section>

          {/* Installation Details */}
          <CircleTelServiceDetails details={installationDetails} columns={1} />

          {/* Documentation Status */}
          <Section style={emailStyles.section}>
            <Text style={{ ...emailStyles.paragraph, fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>
              Installation Documentation
            </Text>
            <div
              style={{
                backgroundColor: documentUploaded ? '#D1FAE5' : '#FEE2E2',
                borderLeft: `4px solid ${documentUploaded ? brandColors.success : brandColors.error}`,
                padding: '15px',
                margin: '0 0 15px 0',
              }}
            >
              {documentUploaded ? (
                <>
                  <Text style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#065F46', fontWeight: '600' }}>
                    Document Uploaded
                  </Text>
                  <Text style={{ margin: '0', fontSize: '13px', color: '#047857' }}>
                    File: {documentName}
                  </Text>
                  {documentUrl && (
                    <Text style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
                      <Link href={documentUrl} style={{ color: '#047857', textDecoration: 'underline' }}>
                        View Installation Report
                      </Link>
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <Text style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#991B1B', fontWeight: '600' }}>
                    No Document Uploaded
                  </Text>
                  <Text style={{ margin: '0', fontSize: '13px', color: '#B91C1C' }}>
                    The technician did not upload installation documentation. Please follow up.
                  </Text>
                </>
              )}
            </div>
          </Section>

          {/* Technician Notes */}
          {notes && (
            <Section style={emailStyles.section}>
              <Text style={{ ...emailStyles.paragraph, fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>
                Technician Notes
              </Text>
              <div
                style={{
                  backgroundColor: '#F8F9FA',
                  border: '1px solid #E9ECEF',
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                <Text style={{ margin: '0', fontSize: '14px', color: brandColors.darkNeutral, whiteSpace: 'pre-wrap' }}>
                  {notes}
                </Text>
              </div>
            </Section>
          )}

          {/* QA Checklist */}
          <Section style={emailStyles.section}>
            <Text style={{ ...emailStyles.paragraph, fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>
              Quality Verification Checklist
            </Text>
            <div
              style={{
                backgroundColor: '#F8F9FA',
                border: '1px solid #E9ECEF',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '14px', color: brandColors.secondaryNeutral, lineHeight: '1.8' }}>
                <li>Installation report/photos uploaded and verified</li>
                <li>Equipment properly installed and secured</li>
                <li>Connection tested and working</li>
                <li>Customer signed off on installation</li>
                <li>No outstanding issues reported</li>
              </ul>
            </div>
          </Section>

          {/* CTA Button */}
          <CircleTelButton href={adminOrderUrl} variant="primary" align="center">
            Review Order & Verify Quality
          </CircleTelButton>

          {/* Next Steps */}
          <Section style={emailStyles.section}>
            <Hr style={emailStyles.divider} />
            <Text style={{ ...emailStyles.paragraph, fontSize: '14px', textAlign: 'center' }}>
              Once verified, the order can proceed to <strong>Activation</strong>.
            </Text>
          </Section>

          {/* Footer */}
          <CircleTelFooter showSocialLinks={false} />
        </Container>
      </Body>
    </Html>
  );
};

export default InstallationCompletedSDMEmail;
