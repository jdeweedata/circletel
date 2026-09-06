import {
  buildUnjaniIntroductionEmailHtml,
  UNJANI_CLINIC_LOGO_URL,
  UNJANI_HELPDESK_WHATSAPP_HREF,
  UNJANI_HELPDESK_WHATSAPP_NUMBER_DISPLAY,
  unjaniClinicLogoSrc,
  unjaniHelpdeskWhatsAppHref,
  unjaniIntroductionGreeting,
  unjaniIntroductionRecipients,
  unjaniIntroductionSubject,
} from '@/lib/portal/unjani-introduction-email';

describe('unjani introduction email', () => {
  it('CCs Ruth and CircleTel ops, not the nurse', () => {
    expect(
      unjaniIntroductionRecipients({
        to: 'nurse@unjani.org',
        clinicName: 'Unjani Clinic - Delmas',
      })
    ).toEqual({
      to: ['nurse@unjani.org'],
      cc: ['rbutcher@unjani.org', 'contactus@circletel.co.za'],
    });
  });

  it('greets the nurse by name when provided', () => {
    expect(unjaniIntroductionGreeting('Lesedi')).toBe('Hello Sr Lesedi,');
    expect(unjaniIntroductionGreeting('  Thandi  ')).toBe('Hello Sr Thandi,');
    expect(unjaniIntroductionGreeting()).toBe('Hello Sr,');
    expect(unjaniIntroductionGreeting('')).toBe('Hello Sr,');

    const html = buildUnjaniIntroductionEmailHtml({
      clinicName: 'Unjani Clinic - Bridge City KwaMashu',
      nurseName: 'Lesedi',
    });
    expect(html).toContain('Hello Sr Lesedi,');
    expect(html).not.toContain('Good morning');
  });

  it('does not hardcode Mbps — speeds are location-dependent', () => {
    const html = buildUnjaniIntroductionEmailHtml({
      clinicName: 'Unjani Clinic - Bridge City KwaMashu',
    });
    expect(html).not.toMatch(/\d+\s*Mbps/i);
    expect(html).not.toMatch(/\d+\s*MBS/i);
    expect(html).toMatch(/depend on coverage/i);
    expect(html).toMatch(/Patient connection/);
    expect(html).toMatch(/Clinic connection/);
    expect(html).toContain('Bridge City KwaMashu');
  });

  it('is from CircleTel, credits Ruth’s nomination, keeps NPC rules', () => {
    const html = buildUnjaniIntroductionEmailHtml({
      clinicName: 'Unjani Clinic - Bridge City KwaMashu',
    });
    expect(html).toContain('alt="CircleTel"');
    expect(html).toMatch(/Ruth Butcher.*has nominated/i);
    expect(html).toMatch(/We are <strong>CircleTel<\/strong>/);
    expect(html).toContain('CircleTel · Unjani Connect');
    expect(html).toMatch(/Please do not<\/strong> provide us with company, banking/);
    expect(html).not.toMatch(/<p[^>]*>Ruth Butcher<\/p>/);
  });

  it('renders a visual next-steps process with icons', () => {
    const html = buildUnjaniIntroductionEmailHtml({
      clinicName: 'Unjani Clinic - Bridge City KwaMashu',
    });
    expect(html).toContain('What happens next');
    expect(html).toContain('STEP 1');
    expect(html).toContain('STEP 5');
    expect(html).toContain('Confirm clinic details');
    expect(html).not.toContain('Complete the service agreement');
    expect(html).not.toContain('Put the contract in place for this clinic');
    expect(html).toContain('Schedule installation');
    expect(html).toContain('Install day &amp; handover');
    expect(html).toContain('Compare &amp; record');
    expect(html).toContain('Service active');
    expect(html).toMatch(/30-day complimentary period/i);
    expect(html).toContain('&#128203;');
  });

  it('includes Desk-wired WhatsApp helpdesk QR and button', () => {
    const clinicName = 'Unjani Clinic - Bridge City KwaMashu';
    const html = buildUnjaniIntroductionEmailHtml({ clinicName });
    const href = unjaniHelpdeskWhatsAppHref(clinicName);
    expect(href).toContain('wa.me/27847739467');
    expect(href).toContain(encodeURIComponent(clinicName));
    expect(html).toContain(`href="${href}"`);
    expect(html).toContain('Message us on WhatsApp');
    expect(html).toContain(UNJANI_HELPDESK_WHATSAPP_NUMBER_DISPLAY);
    expect(html).toContain('Confirm details &amp; schedule installation');
    expect(html).toMatch(/already in place with Unjani Clinics NPC/i);
    expect(html).not.toContain('Wired to Zoho Desk');
    expect(html).not.toMatch(/If you experience any service issues/i);
    expect(html).toContain('alt="Scan to WhatsApp CircleTel Support"');
    expect(UNJANI_HELPDESK_WHATSAPP_HREF).toContain('wa.me/27847739467');
  });

  it('includes the Unjani Clinic logo in the header', () => {
    const prev = process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.NEXT_PUBLIC_BASE_URL;
    try {
      const html = buildUnjaniIntroductionEmailHtml({
        clinicName: 'Unjani Clinic - Bridge City KwaMashu',
      });
      expect(html).toContain(`src="${UNJANI_CLINIC_LOGO_URL}"`);
      expect(html).toContain('alt="Unjani Clinic"');
      expect(unjaniClinicLogoSrc()).toBe(UNJANI_CLINIC_LOGO_URL);
    } finally {
      if (prev === undefined) delete process.env.NEXT_PUBLIC_BASE_URL;
      else process.env.NEXT_PUBLIC_BASE_URL = prev;
    }
  });

  it('builds a clinic-specific subject', () => {
    expect(unjaniIntroductionSubject('Unjani Clinic - Daggakraal')).toBe(
      'Unjani Connect — CircleTel following your nomination (Unjani Clinic - Daggakraal)'
    );
  });
});
