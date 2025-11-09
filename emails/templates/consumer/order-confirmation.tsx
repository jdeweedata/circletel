/**
 * Order Confirmation Email Template
 *
 * Sent when a customer's order is confirmed
 */

import * as React from 'react';
import { Html, Head, Body, Preview, Container } from '@react-email/components';
import {
  CircleTelHeader,
  CircleTelHero,
  CircleTelTextBlock,
  CircleTelButton,
  CircleTelServiceDetails,
  CircleTelFooter,
  emailStyles,
  ServiceDetail,
} from '../../slices';

interface OrderConfirmationEmailProps {
  customerName: string;
  orderNumber: string;
  orderUrl: string;
  packageName: string;
  packageSpeed: string;
  packagePrice: string;
  installationAddress: string;
  installationDate?: string;
}

export const OrderConfirmationEmail: React.FC<OrderConfirmationEmailProps> = ({
  customerName = 'John Doe',
  orderNumber = 'ORD-2025-001',
  orderUrl = 'https://www.circletel.co.za/order/confirmation/123',
  packageName = 'Fibre 100Mbps Uncapped',
  packageSpeed = '100Mbps Down / 50Mbps Up',
  packagePrice = 'R 799.00',
  installationAddress = '123 Main Street, Pretoria',
  installationDate,
}) => {
  const serviceDetails: ServiceDetail[] = [
    {
      label: 'Package',
      value: packageName,
      icon: '📦',
    },
    {
      label: 'Speed',
      value: packageSpeed,
      icon: '⚡',
    },
    {
      label: 'Monthly Price',
      value: packagePrice,
      icon: '💰',
    },
    {
      label: 'Installation Address',
      value: installationAddress,
      icon: '📍',
    },
  ];

  if (installationDate) {
    serviceDetails.push({
      label: 'Scheduled Installation',
      value: installationDate,
      icon: '📅',
    });
  }

  return (
    <Html>
      <Head />
      <Preview>
        Your order {orderNumber} has been confirmed! We're excited to get you
        connected.
      </Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          {/* Header */}
          <CircleTelHeader />

          {/* Hero Section */}
          <CircleTelHero
            title="Order Confirmed!"
            subtitle={`Thank you ${customerName}, your order has been successfully placed.`}
            icon="✅"
            variant="gradient"
          />

          {/* Welcome Message */}
          <CircleTelTextBlock align="center">
            We're excited to welcome you to the CircleTel family! Your order{' '}
            <strong>{orderNumber}</strong> is being processed and our team will be
            in touch soon to schedule your installation.
          </CircleTelTextBlock>

          {/* Service Details */}
          <CircleTelServiceDetails details={serviceDetails} columns={1} />

          {/* Next Steps */}
          <CircleTelTextBlock align="left" variant="normal">
            <strong>What happens next?</strong>
            <br />
            1. Our team will contact you within 24 hours to confirm installation
            details
            <br />
            2. A technician will be dispatched to your address
            <br />
            3. Once installed, you'll receive your login credentials
            <br />
            4. Start enjoying blazing-fast internet!
          </CircleTelTextBlock>

          {/* CTA Button */}
          <CircleTelButton href={orderUrl} variant="primary" align="center">
            View Order Details
          </CircleTelButton>

          {/* Support Info */}
          <CircleTelTextBlock align="center" variant="small">
            Have questions? Our support team is here to help!
            <br />
            Email:{' '}
            <a
              href="mailto:support@circletel.co.za"
              style={{ color: '#F5831F' }}
            >
              support@circletel.co.za
            </a>{' '}
            | Phone:{' '}
            <a href="tel:+27123456789" style={{ color: '#F5831F' }}>
              +27 12 345 6789
            </a>
          </CircleTelTextBlock>

          {/* Footer */}
          <CircleTelFooter showSocialLinks={true} />
        </Container>
      </Body>
    </Html>
  );
};

export default OrderConfirmationEmail;
