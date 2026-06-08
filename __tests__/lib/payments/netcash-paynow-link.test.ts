/**
 * Regression guard for the NetCash Pay Now LINK format.
 *
 * The hosted paynow.aspx GET link must carry the amount as `p4` in RANDS. A prior bug encoded the
 * server-to-server form fields (`Amount` in cents) into the GET querystring, so the hosted page
 * rendered R0.00 (NetCash ignores `Amount` on a GET link). These tests lock the correct format in.
 */

import { netcashService } from '@/lib/payments/netcash-service';

const baseFormData: any = {
  m1: '65251ca3-svc',
  m2: '6940844b-pci',
  m3: 'circletel-nextjs',
  m4: 'CT-ref-1',
  m5: 'inv-uuid-1',
  m6: 'INV-2026-00099',
  m9: 'Customer',
  p2: 'return-url',
  p3: 'CircleTel - INV-2026-00099',
  Budget: 'N',
  CardPayment: 'Y',
  EFTPayment: 'Y',
  TestMode: '0',
  Amount: '89900', // cents
};

describe('NetCash Pay Now link (generatePaymentUrl)', () => {
  it('emits the amount as p4 in RANDS, never Amount in cents', () => {
    const url = netcashService.generatePaymentUrl(baseFormData);
    expect(url).toContain('p4=899.00'); // 89900 cents -> R899.00
    expect(url).not.toMatch(/[?&]Amount=/); // the cents form-field must never appear on a GET link
  });

  it('uses m5 as the p2 reference so postback reconciliation matches paynow_transaction_ref', () => {
    const url = netcashService.generatePaymentUrl(baseFormData);
    expect(url).toContain('p2=inv-uuid-1');
  });

  it('converts cents to Rands correctly (41907 -> 419.07)', () => {
    const url = netcashService.generatePaymentUrl({ ...baseFormData, Amount: '41907' });
    expect(url).toContain('p4=419.07');
  });

  it('points at the NetCash hosted Pay Now page', () => {
    const url = netcashService.generatePaymentUrl(baseFormData);
    expect(url).toContain('paynow.netcash.co.za/site/paynow.aspx');
  });
});
