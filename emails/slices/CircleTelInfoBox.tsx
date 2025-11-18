/**
 * CircleTel Email Info Box Component
 *
 * Displays key-value pairs in a styled info box
 */

import * as React from 'react';
import { Section, Row, Column, Text } from '@react-email/components';
import { emailStyles } from '../utils/styles';

interface InfoBoxItem {
  label: string;
  value: string;
}

interface CircleTelInfoBoxProps {
  items: InfoBoxItem[];
  variant?: 'default' | 'highlight';
}

export const CircleTelInfoBox: React.FC<CircleTelInfoBoxProps> = ({
  items,
  variant = 'default',
}) => {
  const boxStyle = {
    backgroundColor: variant === 'highlight' ? '#FEF3E7' : '#F8F9FA',
    borderRadius: '8px',
    padding: '20px',
    margin: '16px 0',
    border: variant === 'highlight' ? '1px solid #F5831F' : '1px solid #E5E7EB',
  };

  const labelStyle = {
    fontSize: '13px',
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  };

  const valueStyle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1F2937',
    marginTop: '0',
    marginBottom: '16px',
  };

  return (
    <Section style={emailStyles.section}>
      <div style={boxStyle}>
        {items.map((item, index) => (
          <div key={index} style={{ marginBottom: index === items.length - 1 ? '0' : '12px' }}>
            <Text style={labelStyle}>{item.label}</Text>
            <Text style={valueStyle}>{item.value}</Text>
          </div>
        ))}
      </div>
    </Section>
  );
};

export default CircleTelInfoBox;
