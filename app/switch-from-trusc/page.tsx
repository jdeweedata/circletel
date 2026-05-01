import { type Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Switch from TrueSpeed / TRUSC | CircleTel Business Internet',
  description:
    'West Coast business owners: switch from TrueSpeed or TRUSC to CircleTel and save from R152/mo. Guaranteed throughput, month-to-month billing, local support team.',
  keywords: 'switch from TrueSpeed, switch from TRUSC, West Coast business internet, CircleTel, Vredenburg, Langebaan, Saldanha',
  alternates: {
    canonical: 'https://circletel.co.za/switch-from-trusc',
  },
  openGraph: {
    title: 'Tired of Paying More for Unreliable Internet? Switch to CircleTel.',
    description:
      'West Coast businesses save from R152/mo switching to CircleTel. MTN backbone, month-to-month, free installation. 27 towns covered.',
    url: 'https://circletel.co.za/switch-from-trusc',
  },
};

export default function SwitchFromTruscPage() {
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --navy:       oklch(25% 0.07 240);
          --navy-dk:    oklch(18% 0.06 240);
          --orange:     oklch(65% 0.16 50);
          --orange-h:   oklch(55% 0.14 48);
          --cream:      oklch(97% 0.015 65);
          --green:      oklch(48% 0.12 162);
          --green-bg:   oklch(95% 0.03 162);
          --red-bg:     oklch(95% 0.025 25);
          --red:        oklch(45% 0.17 25);
          --mid:        oklch(50% 0.025 240);
          --border:     oklch(91% 0.012 240);
          --subtle:     oklch(48% 0.03 240);
          --wa-green:   oklch(58% 0.18 155);
          --wa-green-h: oklch(50% 0.16 155);
          --font-display: 'Barlow Semi Condensed', sans-serif;
          --font-body:    'Barlow', sans-serif;
        }

        body {
          font-family: var(--font-body);
          background: var(--cream);
          color: var(--navy);
          line-height: 1.55;
        }

        /* ── NAV ─────────────────────────────────────────────────── */
        .site-nav {
          background: var(--navy-dk);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 clamp(1rem, 5vw, 3rem);
          height: 56px;
        }
        .logo {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 1.35rem;
          color: #fff;
          letter-spacing: -0.02em;
        }
        .logo span { color: var(--orange); }
        .nav-cta {
          display: flex;
          align-items: center;
          gap: .45rem;
          background: var(--wa-green);
          color: #fff;
          text-decoration: none;
          font-weight: 600;
          font-size: .85rem;
          padding: .45rem 1rem;
          border-radius: 6px;
          transition: background .15s;
          white-space: nowrap;
        }
        .nav-cta:hover { background: var(--wa-green-h); }
        .nav-cta svg { flex-shrink: 0; }

        /* ── HERO ────────────────────────────────────────────────── */
        .hero {
          background: var(--navy);
          color: #fff;
          padding: clamp(2.5rem, 7vw, 5rem) clamp(1rem, 5vw, 3rem);
        }
        .hero-inner {
          max-width: 1120px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 2.5rem 3rem;
          align-items: start;
        }
        @media (max-width: 760px) {
          .hero-inner { grid-template-columns: 1fr; }
          .price-card { margin: 0 auto; }
        }
        .eyebrow {
          display: inline-block;
          background: color-mix(in oklch, var(--orange) 15%, transparent);
          color: var(--orange);
          font-family: var(--font-display);
          font-weight: 700;
          font-size: .8rem;
          letter-spacing: .1em;
          text-transform: uppercase;
          padding: .3rem .75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
        .hero h1 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(2rem, 5vw, 3.5rem);
          line-height: 1.1;
          letter-spacing: -0.02em;
          text-wrap: pretty;
          margin-bottom: 1rem;
        }
        .hero h1 em { color: var(--orange); font-style: normal; }
        .hero-sub {
          font-size: clamp(.95rem, 2vw, 1.05rem);
          color: oklch(82% 0.03 240);
          max-width: 520px;
          margin-bottom: 1.75rem;
          text-wrap: pretty;
        }
        .hero-ctas { display: flex; flex-wrap: wrap; gap: .75rem; align-items: center; }

        .btn-whatsapp {
          display: inline-flex;
          align-items: center;
          gap: .5rem;
          background: var(--wa-green);
          color: #fff;
          text-decoration: none;
          font-weight: 700;
          font-size: 1rem;
          padding: .75rem 1.5rem;
          border-radius: 8px;
          transition: background .15s;
        }
        .btn-whatsapp:hover { background: var(--wa-green-h); }

        .email-fallback {
          font-size: .85rem;
          color: oklch(75% 0.04 240);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: .3rem;
        }
        .email-fallback-light { color: oklch(82% 0.03 240); }
        .email-fallback:hover { text-decoration: underline; }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: .35rem;
          color: oklch(85% 0.04 240);
          text-decoration: none;
          font-weight: 600;
          font-size: .9rem;
          border: 1.5px solid oklch(40% 0.04 240);
          padding: .65rem 1.2rem;
          border-radius: 8px;
          transition: border-color .15s, color .15s;
        }
        .btn-secondary:hover { border-color: var(--orange); color: var(--orange); }

        /* Price card */
        .price-card {
          background: #fff;
          color: var(--navy);
          border-radius: 14px;
          padding: 1.5rem;
          min-width: 230px;
          max-width: 270px;
          box-shadow: 0 4px 24px oklch(0% 0 0 / .18);
        }
        .price-card-label {
          font-size: .75rem;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--mid);
          margin-bottom: .25rem;
        }
        .price-main {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 2.4rem;
          letter-spacing: -0.03em;
          line-height: 1;
          color: var(--navy);
        }
        .price-main span { font-size: 1.1rem; font-weight: 600; vertical-align: super; }
        .price-period { font-size: .8rem; color: var(--mid); margin-bottom: 1rem; }
        .price-from { font-size: .7rem; color: var(--mid); margin-bottom: .15rem; }
        .savings-row {
          display: flex;
          justify-content: space-between;
          font-size: .82rem;
          padding: .3rem 0;
          border-top: 1px solid var(--border);
        }
        .savings-row:first-of-type { margin-top: .75rem; }
        .savings-label { color: var(--mid); }
        .savings-val { font-weight: 600; }
        .savings-val.bad { color: var(--red); text-decoration: line-through; }
        .savings-val.good { color: var(--green); }
        .savings-val.highlight {
          font-weight: 700;
          font-size: .9rem;
          color: var(--orange);
        }
        .card-cta {
          display: block;
          text-align: center;
          margin-top: 1rem;
          background: var(--orange);
          color: #fff;
          text-decoration: none;
          font-weight: 700;
          font-size: .9rem;
          padding: .65rem;
          border-radius: 7px;
          transition: background .15s;
        }
        .card-cta:hover { background: var(--orange-h); }

        /* ── TRUST BAR ───────────────────────────────────────────── */
        .trust-bar {
          background: var(--navy-dk);
          padding: .9rem clamp(1rem, 5vw, 3rem);
        }
        .trust-items {
          max-width: 1120px;
          margin: 0 auto;
          display: flex;
          flex-wrap: wrap;
          gap: .5rem 1.5rem;
          justify-content: center;
        }
        .trust-item {
          display: flex;
          align-items: center;
          gap: .4rem;
          font-size: .82rem;
          color: oklch(80% 0.03 240);
          font-weight: 500;
        }
        .trust-icon { color: var(--orange); font-size: 1rem; }

        /* ── SECTION SHELL ───────────────────────────────────────── */
        .section-shell {
          max-width: 1120px;
          margin: 0 auto;
          padding: clamp(2.5rem, 6vw, 4rem) clamp(1rem, 5vw, 3rem);
        }
        .section-eyebrow {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: .75rem;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--orange);
          margin-bottom: .6rem;
        }
        .section-heading {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(1.6rem, 4vw, 2.4rem);
          line-height: 1.1;
          letter-spacing: -0.02em;
          text-wrap: pretty;
          margin-bottom: .75rem;
        }
        .section-sub {
          font-size: 1rem;
          color: var(--subtle);
          max-width: 560px;
          margin-bottom: 2.5rem;
          text-wrap: pretty;
        }

        /* ── PAIN GRID ───────────────────────────────────────────── */
        .pain-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1.25rem;
        }
        .pain-card {
          background: var(--red-bg);
          border: 1px solid color-mix(in oklch, var(--red) 20%, transparent);
          border-radius: 12px;
          padding: 1.5rem;
        }
        .pain-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: color-mix(in oklch, var(--red) 12%, transparent);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: .9rem;
          color: var(--red);
        }
        .pain-card h3 {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1rem;
          margin-bottom: .4rem;
          color: var(--navy);
        }
        .pain-card p { font-size: .88rem; color: var(--subtle); }

        /* ── COMPARE TABLE ───────────────────────────────────────── */
        .compare-wrap {
          background: #fff;
          border-radius: 14px;
          border: 1px solid var(--border);
          overflow: hidden;
        }
        .compare-table {
          width: 100%;
          border-collapse: collapse;
          font-size: .9rem;
        }
        .compare-table thead tr {
          background: var(--navy-dk);
          color: #fff;
        }
        .compare-table thead th {
          padding: .9rem 1.1rem;
          text-align: left;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: .95rem;
        }
        .compare-table thead th:not(:first-child) { text-align: center; }
        .compare-table tbody tr {
          border-bottom: 1px solid var(--border);
          transition: background .1s;
        }
        .compare-table tbody tr:last-child { border-bottom: none; }
        .compare-table tbody tr:hover { background: oklch(97% 0.01 240); }
        .compare-table td { padding: .85rem 1.1rem; vertical-align: top; }
        .compare-table td:not(:first-child) { text-align: center; }
        .row-label {
          font-weight: 600;
          font-size: .88rem;
          color: var(--navy);
        }
        .cell-bad {
          color: var(--red);
          font-size: .85rem;
        }
        .cell-good {
          color: var(--green);
          font-size: .85rem;
          font-weight: 600;
        }
        .cell-neutral {
          color: var(--mid);
          font-size: .85rem;
        }
        .chip {
          display: inline-block;
          font-size: .7rem;
          font-weight: 700;
          letter-spacing: .05em;
          text-transform: uppercase;
          padding: .15rem .45rem;
          border-radius: 4px;
          margin-top: .25rem;
        }
        .chip-bad { background: var(--red-bg); color: var(--red); }
        .chip-good { background: var(--green-bg); color: var(--green); }
        .table-footnote {
          font-size: .75rem;
          color: var(--mid);
          padding: .75rem 1.1rem;
          border-top: 1px solid var(--border);
          background: oklch(98% 0.008 240);
        }

        /* ── PACKAGES ────────────────────────────────────────────── */
        .packages-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1.25rem;
        }
        .package-card {
          background: #fff;
          border: 1.5px solid var(--border);
          border-radius: 14px;
          padding: 1.75rem;
          position: relative;
          transition: box-shadow .15s, border-color .15s;
        }
        .package-card:hover {
          box-shadow: 0 4px 20px oklch(0% 0 0 / .08);
          border-color: color-mix(in oklch, var(--orange) 40%, var(--border));
        }
        .package-card.featured {
          border-color: var(--orange);
          box-shadow: 0 4px 24px oklch(0% 0 0 / .10);
        }
        .featured-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--orange);
          color: #fff;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: .72rem;
          letter-spacing: .06em;
          text-transform: uppercase;
          padding: .25rem .75rem;
          border-radius: 20px;
          white-space: nowrap;
        }
        .pkg-speed {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 2rem;
          letter-spacing: -0.03em;
          color: var(--navy);
          line-height: 1;
        }
        .pkg-speed-unit { font-size: 1rem; font-weight: 600; color: var(--mid); }
        .pkg-name {
          font-size: .78rem;
          font-weight: 600;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: var(--mid);
          margin: .3rem 0 1rem;
        }
        .pkg-price {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 1.8rem;
          color: var(--navy);
          letter-spacing: -0.02em;
        }
        .pkg-price span { font-size: .85rem; font-weight: 600; vertical-align: super; }
        .pkg-period { font-size: .78rem; color: var(--mid); margin-bottom: 1.25rem; }
        .pkg-features {
          list-style: none;
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: .45rem;
        }
        .pkg-features li {
          display: flex;
          gap: .5rem;
          font-size: .88rem;
          align-items: flex-start;
        }
        .pkg-features li::before {
          content: '✓';
          color: var(--green);
          font-weight: 700;
          flex-shrink: 0;
          margin-top: .05em;
        }
        .pkg-cta {
          display: block;
          text-align: center;
          text-decoration: none;
          font-weight: 700;
          font-size: .9rem;
          padding: .7rem;
          border-radius: 8px;
          transition: background .15s, color .15s, border-color .15s;
        }
        .pkg-cta.primary {
          background: var(--orange);
          color: #fff;
        }
        .pkg-cta.primary:hover { background: var(--orange-h); }
        .pkg-cta.secondary {
          border: 1.5px solid var(--border);
          color: var(--navy);
        }
        .pkg-cta.secondary:hover { border-color: var(--orange); color: var(--orange); }

        /* ── TOWNS ───────────────────────────────────────────────── */
        .bg-navy { background: color-mix(in oklch, var(--navy) 5%, var(--cream)); }
        .towns-grid {
          display: flex;
          flex-wrap: wrap;
          gap: .6rem;
        }
        .town-chip {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: .55rem .9rem;
          min-width: 110px;
          transition: border-color .15s, box-shadow .15s;
        }
        .town-chip:hover {
          border-color: var(--orange);
          box-shadow: 0 2px 10px oklch(0% 0 0 / .07);
        }
        .town-name {
          font-weight: 600;
          font-size: .85rem;
          color: var(--navy);
        }
        .town-savings {
          font-size: .72rem;
          color: var(--green);
          font-weight: 600;
        }

        /* ── BOTTOM CTA ──────────────────────────────────────────── */
        .bottom-cta {
          background: var(--navy);
          color: #fff;
          text-align: center;
          padding: clamp(3rem, 8vw, 5rem) clamp(1rem, 5vw, 3rem);
        }
        .bottom-cta h2 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          letter-spacing: -0.02em;
          line-height: 1.1;
          margin-bottom: .9rem;
          text-wrap: pretty;
        }
        .bottom-cta h2 em { color: var(--orange); font-style: normal; }
        .bottom-cta p {
          color: oklch(78% 0.03 240);
          max-width: 480px;
          margin: 0 auto 2rem;
          font-size: 1rem;
        }
        .bottom-ctas {
          display: flex;
          flex-wrap: wrap;
          gap: .75rem;
          justify-content: center;
          align-items: center;
        }
        .btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: .45rem;
          color: oklch(82% 0.03 240);
          text-decoration: none;
          font-weight: 600;
          font-size: .9rem;
          border: 1.5px solid oklch(38% 0.04 240);
          padding: .7rem 1.3rem;
          border-radius: 8px;
          transition: border-color .15s, color .15s;
        }
        .btn-ghost:hover { border-color: #fff; color: #fff; }
        .bottom-disclaimer {
          margin-top: 1.5rem;
          font-size: .75rem;
          color: oklch(55% 0.03 240);
          max-width: 480px;
          margin-inline: auto;
        }

        /* ── FOOTER ──────────────────────────────────────────────── */
        .site-footer {
          background: var(--navy-dk);
          color: oklch(60% 0.03 240);
          text-align: center;
          padding: 1.5rem clamp(1rem, 5vw, 3rem);
          font-size: .82rem;
        }
        .footer-brand {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.1rem;
          color: #fff;
          margin-bottom: .3rem;
        }
        .footer-brand span { color: var(--orange); }
        .footer-links { display: flex; gap: 1.5rem; justify-content: center; margin-top: .5rem; }
        .footer-links a {
          color: oklch(60% 0.03 240);
          text-decoration: none;
          transition: color .15s;
        }
        .footer-links a:hover { color: var(--orange); }
      `}</style>

      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Semi+Condensed:wght@600;700;800&display=swap"
        rel="stylesheet"
      />

      {/* ── NAV ─────────────────────────────────────────────────── */}
      <nav className="site-nav">
        <div className="logo">Circle<span>Tel</span></div>
        <a
          href="https://wa.me/27824873900?text=Hi%2C+I%27d+like+to+switch+from+TRUSC+to+CircleTel"
          className="nav-cta"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          WhatsApp us
        </a>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-inner">
          <div>
            <span className="eyebrow">West Coast Business Internet</span>
            <h1>
              Tired of paying more<br />for <em>unreliable</em> wireless?
            </h1>
            <p className="hero-sub">
              West Coast business owners are switching from TrueSpeed and TRUSC to CircleTel — and saving from R152/mo with a guaranteed connection that actually holds during load shedding.
            </p>
            <div className="hero-ctas">
              <a
                href="https://wa.me/27824873900?text=Hi%2C+I%27d+like+to+switch+to+CircleTel+from+TRUSC"
                className="btn-whatsapp"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Get a free quote on WhatsApp
              </a>
              <a href="mailto:contactus@circletel.co.za" className="email-fallback email-fallback-light">
                or email us
              </a>
              <a href="#compare" className="btn-secondary">
                See the comparison ↓
              </a>
            </div>
          </div>

          <div className="price-card">
            <div className="price-card-label">CircleTel Business</div>
            <div className="price-from">from</div>
            <div className="price-main"><span>R</span>449</div>
            <div className="price-period">/month · uncapped</div>
            <div className="savings-row">
              <span className="savings-label">TRUSC avg price</span>
              <span className="savings-val bad">R672/mo</span>
            </div>
            <div className="savings-row">
              <span className="savings-label">CircleTel</span>
              <span className="savings-val good">R449/mo</span>
            </div>
            <div className="savings-row">
              <span className="savings-label">You save</span>
              <span className="savings-val highlight">R223/mo</span>
            </div>
            <a
              href="https://wa.me/27824873900?text=Hi%2C+I%27d+like+a+free+quote+to+switch+to+CircleTel"
              className="card-cta"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get a free quote →
            </a>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ───────────────────────────────────────────── */}
      <div className="trust-bar">
        <div className="trust-items">
          <div className="trust-item"><span className="trust-icon">⚡</span> Installed within 30 days</div>
          <div className="trust-item"><span className="trust-icon">📋</span> Month-to-month billing</div>
          <div className="trust-item"><span className="trust-icon">🕐</span> 4-hour SLA response</div>
          <div className="trust-item"><span className="trust-icon">📍</span> 27 West Coast towns covered</div>
          <div className="trust-item"><span className="trust-icon">🤝</span> Local support team</div>
        </div>
      </div>

      {/* ── PAIN SECTION ────────────────────────────────────────── */}
      <section>
        <div className="section-shell">
          <div className="section-eyebrow">Sound familiar?</div>
          <h2 className="section-heading">The problems West Coast businesses face with shared wireless</h2>
          <p className="section-sub">These are the three complaints we hear most from businesses switching away from TRUSC.</p>
          <div className="pain-grid">
            <div className="pain-card">
              <div className="pain-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <h3>Speed drops when you need it most</h3>
              <p>Shared tower spectrum means your 10 Mbps becomes 2 Mbps at 9am on a Monday. Every business in your area competes for the same bandwidth.</p>
            </div>
            <div className="pain-card">
              <div className="pain-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="6" y="2" width="12" height="20" rx="2"/>
                  <line x1="12" y1="18" x2="12" y2="18"/>
                </svg>
              </div>
              <h3>Surprise billing every month</h3>
              <p>Excess data charges, "speed boost" fees, and opaque invoices make it impossible to budget. Your monthly cost is never what you agreed to.</p>
            </div>
            <div className="pain-card">
              <div className="pain-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.06 1.18 2 2 0 012.03 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.9z"/>
                </svg>
              </div>
              <h3>Support that doesn&apos;t respond</h3>
              <p>Logging a ticket and waiting 24–72 hours while your business is offline. No WhatsApp, no local contact — just a call centre ticket number.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ────────────────────────────────────── */}
      <section id="compare" className="bg-navy">
        <div className="section-shell">
          <div className="section-eyebrow">Side by side</div>
          <h2 className="section-heading">CircleTel vs TrueSpeed / TRUSC</h2>
          <p className="section-sub">Eight categories. See exactly where the difference shows up.</p>
          <div className="compare-wrap">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>TrueSpeed / TRUSC</th>
                  <th>CircleTel</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="row-label">Speed consistency</td>
                  <td className="cell-bad">
                    Shared spectrum — degrades at peak times
                    <br /><span className="chip chip-bad">VARIES</span>
                  </td>
                  <td className="cell-good">
                    Dedicated line · guaranteed throughput
                    <br /><span className="chip chip-good">CONSISTENT</span>
                  </td>
                </tr>
                <tr>
                  <td className="row-label">Uptime SLA</td>
                  <td className="cell-bad">Best-effort · no SLA</td>
                  <td className="cell-good">99.5% uptime SLA with 4-hour fault response</td>
                </tr>
                <tr>
                  <td className="row-label">Technology</td>
                  <td className="cell-neutral">Fixed wireless — shared tower spectrum</td>
                  <td className="cell-good">MTN backbone · carrier-grade backhaul</td>
                </tr>
                <tr>
                  <td className="row-label">Entry price</td>
                  <td className="cell-bad">
                    R672/mo avg
                    <br /><span className="chip chip-bad">HIGHER</span>
                  </td>
                  <td className="cell-good">
                    R449/mo · flat rate
                    <br /><span className="chip chip-good">SAVE R223</span>
                  </td>
                </tr>
                <tr>
                  <td className="row-label">Contract</td>
                  <td className="cell-bad">12–24 month lock-in</td>
                  <td className="cell-good">Month-to-month · cancel anytime</td>
                </tr>
                <tr>
                  <td className="row-label">Data cap</td>
                  <td className="cell-bad">Capped or throttled</td>
                  <td className="cell-good">Uncapped on all business packages</td>
                </tr>
                <tr>
                  <td className="row-label">Load-shedding</td>
                  <td className="cell-bad">Tower outages common during Stage 4+</td>
                  <td className="cell-good">Battery backup at network nodes</td>
                </tr>
                <tr>
                  <td className="row-label">Support</td>
                  <td className="cell-bad">Call centre · 24–72h ticket response</td>
                  <td className="cell-good">Local West Coast team · WhatsApp priority</td>
                </tr>
                <tr>
                  <td className="row-label">Setup fee</td>
                  <td className="cell-bad">R999–R2,499 installation</td>
                  <td className="cell-good">Free installation on 12-month plan</td>
                </tr>
              </tbody>
            </table>
            <p className="table-footnote">
              * Average shared wireless pricing based on published rates for comparable uncapped business packages. CircleTel pricing valid April 2026.
            </p>
          </div>
        </div>
      </section>

      {/* ── PACKAGES ────────────────────────────────────────────── */}
      <section>
        <div className="section-shell">
          <div className="section-eyebrow">Simple pricing</div>
          <h2 className="section-heading">Pick your speed. No hidden fees.</h2>
          <p className="section-sub">All packages include free installation, uncapped data, and month-to-month billing.</p>
          <div className="packages-grid">
            {/* Business Start */}
            <div className="package-card">
              <div className="pkg-speed">10 <span className="pkg-speed-unit">Mbps</span></div>
              <div className="pkg-name">Business Start</div>
              <div className="pkg-price"><span>R</span>449</div>
              <div className="pkg-period">/month · uncapped</div>
              <ul className="pkg-features">
                <li>Guaranteed 10 Mbps throughput</li>
                <li>Uncapped data</li>
                <li>4-hour SLA fault response</li>
                <li>WhatsApp support</li>
              </ul>
              <a
                href="https://wa.me/27824873900?text=Hi%2C+I%27m+interested+in+CircleTel+Business+10+Mbps"
                className="pkg-cta secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get this package
              </a>
            </div>

            {/* Business Pro */}
            <div className="package-card featured">
              <div className="featured-badge">Most popular</div>
              <div className="pkg-speed">25 <span className="pkg-speed-unit">Mbps</span></div>
              <div className="pkg-name">Business Pro</div>
              <div className="pkg-price"><span>R</span>699</div>
              <div className="pkg-period">/month · uncapped</div>
              <ul className="pkg-features">
                <li>Guaranteed 25 Mbps throughput</li>
                <li>Uncapped data</li>
                <li>4-hour SLA fault response</li>
                <li>WhatsApp priority support</li>
                <li>Static IP available</li>
              </ul>
              <a
                href="https://wa.me/27824873900?text=Hi%2C+I%27m+interested+in+CircleTel+Business+25+Mbps"
                className="pkg-cta primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get this package
              </a>
            </div>

            {/* Business Max */}
            <div className="package-card">
              <div className="pkg-speed">50 <span className="pkg-speed-unit">Mbps</span></div>
              <div className="pkg-name">Business Max</div>
              <div className="pkg-price"><span>R</span>999</div>
              <div className="pkg-period">/month · uncapped</div>
              <ul className="pkg-features">
                <li>Guaranteed 50 Mbps throughput</li>
                <li>Uncapped data</li>
                <li>2-hour SLA fault response</li>
                <li>WhatsApp priority support</li>
                <li>Static IP included</li>
                <li>Dedicated account manager</li>
              </ul>
              <a
                href="https://wa.me/27824873900?text=Hi%2C+I%27m+interested+in+CircleTel+Business+50+Mbps"
                className="pkg-cta secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get this package
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── TOWNS ───────────────────────────────────────────────── */}
      <section className="bg-navy">
        <div className="section-shell">
          <div className="section-eyebrow">Coverage</div>
          <h2 className="section-heading">27 West Coast towns covered</h2>
          <p className="section-sub">Your potential saving based on switching from average shared wireless pricing in your area.</p>
          <div className="towns-grid">
            {[
              { name: 'Vredenburg', saving: 223 },
              { name: 'Langebaan', saving: 198 },
              { name: 'Saldanha', saving: 207 },
              { name: 'Paternoster', saving: 185 },
              { name: 'Velddrif', saving: 211 },
              { name: 'Hopefield', saving: 194 },
              { name: 'St Helena Bay', saving: 223 },
              { name: 'Jacobsbaai', saving: 199 },
              { name: 'Yzerfontein', saving: 177 },
              { name: 'Darling', saving: 188 },
              { name: 'Riebeek-Kasteel', saving: 163 },
              { name: 'Malmesbury', saving: 201 },
              { name: 'Moorreesburg', saving: 178 },
              { name: 'Piketberg', saving: 169 },
              { name: 'Clanwilliam', saving: 155 },
              { name: 'Citrusdal', saving: 161 },
              { name: 'Vredendal', saving: 173 },
              { name: 'Lutzville', saving: 167 },
              { name: 'Koekenaap', saving: 158 },
              { name: 'Eendekuil', saving: 152 },
            ].map(({ name, saving }) => (
              <div key={name} className="town-chip">
                <span className="town-name">{name}</span>
                <span className="town-savings">save R{saving}/mo</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ──────────────────────────────────────────── */}
      <section className="bottom-cta">
        <h2>Ready to stop overpaying for<br /><em>unreliable</em> business internet?</h2>
        <p>
          WhatsApp us your address and we&apos;ll check coverage and send you a quote within 2 hours. No salesperson, no pressure — just a straight answer.
        </p>
        <div className="bottom-ctas">
          <a
            href="https://wa.me/27824873900?text=Hi%2C+I%27d+like+to+switch+to+CircleTel+business+internet"
            className="btn-whatsapp"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp us now
          </a>
          <a href="mailto:contactus@circletel.co.za" className="btn-ghost">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="M22 7l-10 7L2 7"/>
            </svg>
            contactus@circletel.co.za
          </a>
        </div>
        <p className="bottom-disclaimer">
          Coverage subject to site survey. Pricing valid April 2026. Free installation applies to 12-month plans. Month-to-month plans available from R549/mo.
        </p>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="site-footer">
        <div className="footer-brand">Circle<span>Tel</span></div>
        <div>© 2026 CircleTel (Pty) Ltd · West Coast, South Africa · 082 487 3900</div>
        <div className="footer-links">
          <a href="/privacy-policy">Privacy Policy</a>
          <a href="/terms-of-service">Terms of Service</a>
          <a href="/check-coverage">Check Coverage</a>
        </div>
      </footer>
    </>
  );
}
