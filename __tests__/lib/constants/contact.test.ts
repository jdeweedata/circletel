import { CONTACT, formatAddressOneLine } from '@/lib/constants/contact';

describe('CONTACT backward compatibility (tenant-config derived)', () => {
  it('exposes the same values as before the tenant re-route', () => {
    expect(CONTACT.WHATSAPP_NUMBER).toBe('082 487 3900');
    expect(CONTACT.EMAIL_PRIMARY).toBe('contactus@circletel.co.za');
    expect(CONTACT.EMAIL_NOTIFICATIONS).toBe('no-reply@notify.circletel.co.za');
    expect(CONTACT.PHYSICAL_ADDRESS.building).toBe('Imagine House');
    expect(CONTACT.WEBSITE).toBe('https://www.circletel.co.za');
  });

  it('formatters still work against the derived CONTACT', () => {
    expect(formatAddressOneLine()).toBe(
      'Imagine House, 2 Mellis Road, Rivonia, Sandton, 2191'
    );
  });
});
