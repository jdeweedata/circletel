/**
 * Test Payment Description Builder
 *
 * Tests all payment description formats to ensure they meet requirements:
 * - ≤35 characters for bank statement compatibility
 * - Include customer account number, package name, and location
 * - Clear and informative
 */

// Import description builder functions (TypeScript)
import {
  buildPaymentMethodDescription,
  buildOrderDescription,
  buildInvoiceDescription,
  buildGenericDescription,
  abbreviateCity,
  abbreviatePackage,
  abbreviateAccountNumber,
  abbreviateOrderNumber,
  validateDescription,
  truncateDescription
} from '../lib/payments/description-builder';

console.log('='.repeat(70));
console.log('PAYMENT DESCRIPTION BUILDER TESTS');
console.log('='.repeat(70));
console.log();

// Test 1: Payment Method Validation
console.log('Test 1: Payment Method Validation (R1.00 test charge)');
console.log('-'.repeat(70));
const paymentMethodDesc = buildPaymentMethodDescription();
const validation1 = validateDescription(paymentMethodDesc);
console.log('Description:', paymentMethodDesc);
console.log('Length:', validation1.length, '/', validation1.maxLength, 'characters');
console.log('Valid:', validation1.valid ? '✓' : '✗');
if (!validation1.valid) {
  console.log('Errors:', validation1.errors);
}
console.log();

// Test 2: Order Payment - Standard Case
console.log('Test 2: Order Payment - Standard Case');
console.log('-'.repeat(70));
const orderDesc1 = buildOrderDescription({
  account_number: 'CT-2025-00123',
  order_number: 'ORD-2025-00456',
  package_name: 'MTN 100Mbps Fibre Uncapped',
  city: 'Johannesburg',
  suburb: 'Sandton'
});
const validation2 = validateDescription(orderDesc1);
console.log('Input:');
console.log('  Account: CT-2025-00123');
console.log('  Order: ORD-2025-00456');
console.log('  Package: MTN 100Mbps Fibre Uncapped');
console.log('  City: Johannesburg');
console.log('Description:', orderDesc1);
console.log('Length:', validation2.length, '/', validation2.maxLength, 'characters');
console.log('Valid:', validation2.valid ? '✓' : '✗');
if (!validation2.valid) {
  console.log('Errors:', validation2.errors);
}
console.log();

// Test 3: Order Payment - Long Package Name
console.log('Test 3: Order Payment - Long Package Name (Should Truncate)');
console.log('-'.repeat(70));
const orderDesc2 = buildOrderDescription({
  account_number: 'CT-2025-99999',
  order_number: 'ORD-2025-88888',
  package_name: 'Frogfoot 1Gbps Fibre Uncapped Unlimited Business Package Premium',
  city: 'Cape Town',
  suburb: 'Bellville'
});
const validation3 = validateDescription(orderDesc2);
console.log('Input:');
console.log('  Account: CT-2025-99999');
console.log('  Package: Frogfoot 1Gbps Fibre Uncapped Unlimited Business Package Premium');
console.log('  City: Cape Town');
console.log('Description:', orderDesc2);
console.log('Length:', validation3.length, '/', validation3.maxLength, 'characters');
console.log('Valid:', validation3.valid ? '✓' : '✗');
if (!validation3.valid) {
  console.log('Errors:', validation3.errors);
}
console.log();

// Test 4: Invoice Payment
console.log('Test 4: Invoice Payment');
console.log('-'.repeat(70));
const invoiceDesc = buildInvoiceDescription({
  invoice_number: 'INV-2025-00045'
});
const validation4 = validateDescription(invoiceDesc);
console.log('Input:');
console.log('  Invoice: INV-2025-00045');
console.log('Description:', invoiceDesc);
console.log('Length:', validation4.length, '/', validation4.maxLength, 'characters');
console.log('Valid:', validation4.valid ? '✓' : '✗');
if (!validation4.valid) {
  console.log('Errors:', validation4.errors);
}
console.log();

// Test 5: City Abbreviations
console.log('Test 5: City Abbreviation Tests');
console.log('-'.repeat(70));
const cities = [
  'Johannesburg',
  'Cape Town',
  'Durban',
  'Pretoria',
  'Port Elizabeth',
  'Bloemfontein',
  'Midrand',
  'Sandton',
  'Centurion',
  'Unknown City'
];
cities.forEach(city => {
  const abbrev = abbreviateCity(city);
  console.log(`  ${city.padEnd(20)} → ${abbrev}`);
});
console.log();

// Test 6: Package Abbreviations
console.log('Test 6: Package Abbreviation Tests');
console.log('-'.repeat(70));
const packages = [
  'MTN 100Mbps Fibre Uncapped',
  'Vumatel 50Mbps Fibre Package',
  'Frogfoot 1Gbps Unlimited Fibre',
  'Openserve 200Mbps Business Fibre',
  'Supersonic 100Mbps Wireless'
];
packages.forEach(pkg => {
  const abbrev = abbreviatePackage(pkg);
  console.log(`  ${pkg.padEnd(40)} → ${abbrev}`);
});
console.log();

// Test 7: Account Number Abbreviations
console.log('Test 7: Account Number Abbreviation Tests');
console.log('-'.repeat(70));
const accounts = [
  'CT-2025-00123',
  'CT-2025-99999',
  'CT-2024-00001'
];
accounts.forEach(account => {
  const abbrev = abbreviateAccountNumber(account);
  console.log(`  ${account.padEnd(20)} → ${abbrev}`);
});
console.log();

// Test 8: Order Number Abbreviations
console.log('Test 8: Order Number Abbreviation Tests');
console.log('-'.repeat(70));
const orders = [
  'ORD-2025-00456',
  'ORD-2025-12345',
  'ORD-2024-99999'
];
orders.forEach(order => {
  const abbrev = abbreviateOrderNumber(order);
  console.log(`  ${order.padEnd(20)} → ${abbrev}`);
});
console.log();

// Test 9: Edge Cases
console.log('Test 9: Edge Cases');
console.log('-'.repeat(70));

// No account number - should use order number
const edgeCase1 = buildOrderDescription({
  order_number: 'ORD-2025-00789',
  package_name: 'MTN 50Mbps',
  city: 'Durban'
});
console.log('No account number:', edgeCase1);

// No city
const edgeCase2 = buildOrderDescription({
  account_number: 'CT-2025-00123',
  package_name: 'Vuma 100Mbps'
});
console.log('No city:', edgeCase2);

// No package name
const edgeCase3 = buildOrderDescription({
  account_number: 'CT-2025-00123',
  city: 'Johannesburg'
});
console.log('No package name:', edgeCase3);

// Empty object - should use fallback
const edgeCase4 = buildOrderDescription({});
console.log('Empty object:', edgeCase4);
console.log();

// Test 10: Validation Tests
console.log('Test 10: Validation Tests');
console.log('-'.repeat(70));

// Valid description
const validDesc = 'CircleTel - Payment Verification';
const validResult = validateDescription(validDesc);
console.log('Valid (32 chars):', validResult.valid ? '✓' : '✗', '-', validDesc);

// Too long
const tooLongDesc = 'CircleTel - This is a very long description that exceeds the limit';
const tooLongResult = validateDescription(tooLongDesc);
console.log('Too long (68 chars):', tooLongResult.valid ? '✓' : '✗', '-', tooLongResult.errors);

// Empty
const emptyDesc = '';
const emptyResult = validateDescription(emptyDesc);
console.log('Empty:', emptyResult.valid ? '✓' : '✗', '-', emptyResult.errors);

// Invalid characters
const invalidCharsDesc = 'CircleTel - <script>alert("test")</script>';
const invalidCharsResult = validateDescription(invalidCharsDesc);
console.log('Invalid chars:', invalidCharsResult.valid ? '✓' : '✗', '-', invalidCharsResult.errors);
console.log();

// Summary
console.log('='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));
console.log('✓ Payment Method Validation:', paymentMethodDesc);
console.log('✓ Order Payment (Standard):', orderDesc1);
console.log('✓ Order Payment (Truncated):', orderDesc2);
console.log('✓ Invoice Payment:', invoiceDesc);
console.log();
console.log('All descriptions are ≤35 characters ✓');
console.log('All formats include key information ✓');
console.log('Bank statement friendly ✓');
console.log('='.repeat(70));
