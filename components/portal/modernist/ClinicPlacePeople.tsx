import { PiMapPinBold, PiPhoneBold, PiWhatsappLogoBold } from 'react-icons/pi';

function waHref(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const intl = digits.startsWith('0') ? `27${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}`;
}

function mapsHref(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function ClinicPlacePeople({
  address,
  province,
  lat,
  lng,
  contactName,
  contactPhone,
  contactEmail,
}: {
  address: string;
  province?: string | null;
  lat?: number | null;
  lng?: number | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
}) {
  const query = [address, province].filter(Boolean).join(', ');
  const hasPin = lat != null && lng != null;

  return (
    <section
      aria-labelledby="place-people-heading"
      className="rounded-xl bg-white px-5 py-5 shadow-sm ring-1 ring-black/[0.06]"
    >
      <h2
        id="place-people-heading"
        className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
        style={{ color: 'var(--pm-navy)' }}
      >
        Place and people
      </h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-extrabold" style={{ color: 'var(--pm-navy)' }}>
            {contactName || 'On-site contact'}
          </p>
          {contactPhone && (
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              <a href={`tel:${contactPhone}`} className="inline-flex items-center gap-1 font-semibold">
                <PiPhoneBold aria-hidden="true" />
                {contactPhone}
              </a>
              <a
                href={waHref(contactPhone)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold"
              >
                <PiWhatsappLogoBold aria-hidden="true" />
                WhatsApp
              </a>
            </div>
          )}
          {contactEmail && (
            <a href={`mailto:${contactEmail}`} className="mt-2 block text-sm">
              {contactEmail}
            </a>
          )}
        </div>
        <div>
          <p className="text-sm" style={{ color: 'var(--pm-body)' }}>
            {query || 'Address not captured yet'}
          </p>
          {query && (
            <a
              href={mapsHref(query)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold"
            >
              <PiMapPinBold aria-hidden="true" />
              Open in Google Maps
            </a>
          )}
          {hasPin && (
            <p className="mt-2 text-xs" style={{ color: '#6B7280' }}>
              Pin {lat}, {lng}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
