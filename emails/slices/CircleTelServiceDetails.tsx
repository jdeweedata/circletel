/**
 * CircleTel Email Service Details Component
 *
 * Display service/package information as key-value pairs
 */

import * as React from 'react';
import { Section, Row, Column, Text } from '@react-email/components';
import { emailStyles, brandColors } from '../utils/styles';

export interface ServiceDetail {
  label: string;
  value: string;
  icon?: string;
}

interface CircleTelServiceDetailsProps {
  details: ServiceDetail[];
  columns?: 1 | 2;
}

export const CircleTelServiceDetails: React.FC<
  CircleTelServiceDetailsProps
> = ({ details, columns = 1 }) => {
  if (columns === 2) {
    // Two-column layout
    const leftColumn = details.filter((_, index) => index % 2 === 0);
    const rightColumn = details.filter((_, index) => index % 2 === 1);

    return (
      <Section style={emailStyles.section}>
        <Row>
          <Column style={{ width: '50%', paddingRight: '8px' }}>
            {leftColumn.map((detail, index) => (
              <DetailItem key={index} detail={detail} />
            ))}
          </Column>
          <Column style={{ width: '50%', paddingLeft: '8px' }}>
            {rightColumn.map((detail, index) => (
              <DetailItem key={index} detail={detail} />
            ))}
          </Column>
        </Row>
      </Section>
    );
  }

  // Single-column layout
  return (
    <Section style={emailStyles.section}>
      {details.map((detail, index) => (
        <DetailItem key={index} detail={detail} />
      ))}
    </Section>
  );
};

// Helper component for individual detail item
const DetailItem: React.FC<{ detail: ServiceDetail }> = ({ detail }) => {
  return (
    <div style={emailStyles.detailRow}>
      <Text style={emailStyles.detailLabel}>
        {detail.icon && `${detail.icon} `}
        {detail.label}
      </Text>
      <Text style={emailStyles.detailValue}>{detail.value}</Text>
    </div>
  );
};

export default CircleTelServiceDetails;
