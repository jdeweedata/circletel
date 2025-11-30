/**
 * CircleTel Email Invoice Table Component
 *
 * Display invoice line items with pricing and VAT calculation
 */

import * as React from 'react';
import { Section, Row, Column, Text, Hr } from '@react-email/components';
import { emailStyles, brandColors, typography } from '../utils/styles';

export interface InvoiceItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  amount: number;
}

// Alternative interface for string-based amounts (from templates)
export interface InvoiceLineItem {
  description: string;
  quantity?: number;
  unitPrice?: string;
  total?: string;
}

interface CircleTelInvoiceTableProps {
  // Support both old (items) and new (lineItems) prop names
  items?: InvoiceItem[];
  lineItems?: InvoiceLineItem[];
  subtotal?: number | string;
  vat?: number;
  vatAmount?: string;
  vatRate?: number;
  discount?: number;
  total?: number;
  totalAmount?: string;
  currency?: string;
}

export const CircleTelInvoiceTable: React.FC<CircleTelInvoiceTableProps> = ({
  items,
  lineItems,
  subtotal,
  vat,
  vatAmount,
  vatRate = 0.15,
  discount,
  total,
  totalAmount,
  currency = 'R',
}) => {
  // Parse string amounts to numbers
  const parseAmount = (value: string | number | undefined): number => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    // Remove currency symbol and parse
    return parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
  };

  const formatAmount = (amount: number) => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  // Normalize items from either prop
  const normalizedItems: InvoiceItem[] = items || (lineItems || []).map(item => ({
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice ? parseAmount(item.unitPrice) : undefined,
    amount: parseAmount(item.total),
  }));

  // Calculate values
  const subtotalValue = parseAmount(subtotal);
  const vatValue = vat ?? parseAmount(vatAmount) ?? subtotalValue * vatRate;
  const totalValue = total ?? parseAmount(totalAmount) ?? (subtotalValue + vatValue);
  const calculatedVat = vatValue;

  return (
    <Section style={emailStyles.section}>
      {/* Table Header */}
      <Row>
        <Column
          style={{
            ...emailStyles.tableCellHeader,
            width: '60%',
          }}
        >
          <Text style={{ margin: 0, fontWeight: '600' }}>Description</Text>
        </Column>
        <Column
          style={{
            ...emailStyles.tableCellHeader,
            width: '40%',
            textAlign: 'right',
          }}
        >
          <Text style={{ margin: 0, fontWeight: '600' }}>Amount</Text>
        </Column>
      </Row>

      {/* Line Items */}
      {normalizedItems.map((item, index) => (
        <Row key={index}>
          <Column style={{ ...emailStyles.tableCell, width: '60%' }}>
            <Text style={{ margin: 0, ...typography.body }}>
              {item.description}
              {item.quantity && item.quantity > 1 && (
                <span style={{ color: brandColors.secondaryNeutral }}>
                  {' '}
                  × {item.quantity}
                </span>
              )}
            </Text>
          </Column>
          <Column
            style={{
              ...emailStyles.tableCell,
              width: '40%',
              textAlign: 'right',
            }}
          >
            <Text style={{ margin: 0, ...typography.body }}>
              {formatAmount(item.amount)}
            </Text>
          </Column>
        </Row>
      ))}

      {/* Divider */}
      <Hr style={emailStyles.divider} />

      {/* Subtotal */}
      <Row>
        <Column style={{ width: '60%', padding: '8px 12px' }}>
          <Text style={{ margin: 0, fontWeight: '600' }}>Subtotal</Text>
        </Column>
        <Column
          style={{ width: '40%', padding: '8px 12px', textAlign: 'right' }}
        >
          <Text style={{ margin: 0, fontWeight: '600' }}>
            {formatAmount(subtotalValue)}
          </Text>
        </Column>
      </Row>

      {/* Discount (if applicable) */}
      {discount && discount > 0 && (
        <Row>
          <Column style={{ width: '60%', padding: '8px 12px' }}>
            <Text
              style={{ margin: 0, color: brandColors.success, fontWeight: '600' }}
            >
              Discount
            </Text>
          </Column>
          <Column
            style={{ width: '40%', padding: '8px 12px', textAlign: 'right' }}
          >
            <Text
              style={{ margin: 0, color: brandColors.success, fontWeight: '600' }}
            >
              -{formatAmount(discount)}
            </Text>
          </Column>
        </Row>
      )}

      {/* VAT */}
      <Row>
        <Column style={{ width: '60%', padding: '8px 12px' }}>
          <Text style={{ margin: 0 }}>VAT ({(vatRate * 100).toFixed(0)}%)</Text>
        </Column>
        <Column
          style={{ width: '40%', padding: '8px 12px', textAlign: 'right' }}
        >
          <Text style={{ margin: 0 }}>{formatAmount(calculatedVat)}</Text>
        </Column>
      </Row>

      {/* Total */}
      <Row
        style={{
          backgroundColor: brandColors.lightNeutral,
          borderTop: `2px solid ${brandColors.primary}`,
        }}
      >
        <Column style={{ width: '60%', padding: '12px' }}>
          <Text
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '700',
              color: brandColors.darkNeutral,
            }}
          >
            Total
          </Text>
        </Column>
        <Column
          style={{ width: '40%', padding: '12px', textAlign: 'right' }}
        >
          <Text
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '700',
              color: brandColors.primary,
            }}
          >
            {formatAmount(totalValue)}
          </Text>
        </Column>
      </Row>
    </Section>
  );
};

export default CircleTelInvoiceTable;
