/**
 * Shared Email Styles
 *
 * Inline styles for email client compatibility
 * All colors match CircleTel brand guidelines
 */

export const brandColors = {
  primary: '#F5831F', // CircleTel Orange
  primaryDark: '#e67516', // Darker orange for gradients
  darkNeutral: '#1F2937', // Dark text
  secondaryNeutral: '#4B5563', // Secondary text
  lightNeutral: '#E6E9EF', // Light backgrounds
  white: '#FFFFFF', // White
  success: '#10B981', // Green for success messages
  warning: '#F59E0B', // Amber for warnings
  error: '#EF4444', // Red for errors
} as const;

export const typography = {
  fontFamily: 'Arial, Helvetica, sans-serif',
  h1: {
    fontSize: '32px',
    fontWeight: '700',
    lineHeight: '1.2',
    color: brandColors.darkNeutral,
    margin: '0 0 16px 0',
  },
  h2: {
    fontSize: '24px',
    fontWeight: '600',
    lineHeight: '1.3',
    color: brandColors.darkNeutral,
    margin: '0 0 12px 0',
  },
  h3: {
    fontSize: '18px',
    fontWeight: '600',
    lineHeight: '1.4',
    color: brandColors.darkNeutral,
    margin: '0 0 8px 0',
  },
  body: {
    fontSize: '16px',
    fontWeight: '400',
    lineHeight: '1.6',
    color: brandColors.secondaryNeutral,
    margin: '0',
  },
  small: {
    fontSize: '14px',
    fontWeight: '400',
    lineHeight: '1.5',
    color: brandColors.secondaryNeutral,
    margin: '0',
  },
  tiny: {
    fontSize: '12px',
    fontWeight: '400',
    lineHeight: '1.4',
    color: brandColors.secondaryNeutral,
    margin: '0',
  },
} as const;

export const emailStyles = {
  // Root body
  body: {
    backgroundColor: brandColors.white,
    fontFamily: typography.fontFamily,
    margin: '0',
    padding: '0',
    width: '100%',
  } as React.CSSProperties,

  // Main container (centered, max-width 600px)
  container: {
    margin: '0 auto',
    maxWidth: '600px',
    backgroundColor: brandColors.white,
  } as React.CSSProperties,

  // Header section
  header: {
    background: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.primaryDark} 100%)`,
    padding: '20px',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  // Hero section
  hero: {
    backgroundColor: brandColors.white,
    padding: '40px 20px',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  heroWithGradient: {
    background: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.primaryDark} 100%)`,
    padding: '40px 20px',
    textAlign: 'center' as const,
    color: brandColors.white,
  } as React.CSSProperties,

  // Content sections
  section: {
    padding: '20px',
  } as React.CSSProperties,

  sectionAlt: {
    padding: '20px',
    backgroundColor: brandColors.lightNeutral,
  } as React.CSSProperties,

  // Text elements
  paragraph: {
    ...typography.body,
    margin: '0 0 16px 0',
  } as React.CSSProperties,

  paragraphCenter: {
    ...typography.body,
    margin: '0 0 16px 0',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  // Buttons
  buttonPrimary: {
    backgroundColor: brandColors.primary,
    color: brandColors.white,
    padding: '12px 24px',
    borderRadius: '6px',
    textDecoration: 'none',
    display: 'inline-block',
    fontWeight: '600',
    fontSize: '16px',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  buttonSecondary: {
    backgroundColor: brandColors.white,
    color: brandColors.primary,
    padding: '12px 24px',
    borderRadius: '6px',
    border: `2px solid ${brandColors.primary}`,
    textDecoration: 'none',
    display: 'inline-block',
    fontWeight: '600',
    fontSize: '16px',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  buttonOutline: {
    backgroundColor: 'transparent',
    color: brandColors.primary,
    padding: '10px 22px',
    borderRadius: '6px',
    border: `2px solid ${brandColors.primary}`,
    textDecoration: 'none',
    display: 'inline-block',
    fontWeight: '600',
    fontSize: '16px',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  // Tables (for layout and data)
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  } as React.CSSProperties,

  tableCell: {
    padding: '12px',
    borderBottom: `1px solid ${brandColors.lightNeutral}`,
  } as React.CSSProperties,

  tableCellHeader: {
    padding: '12px',
    backgroundColor: brandColors.lightNeutral,
    fontWeight: '600',
    textAlign: 'left' as const,
  } as React.CSSProperties,

  // Key-value pairs (service details)
  detailRow: {
    padding: '8px 0',
  } as React.CSSProperties,

  detailLabel: {
    fontSize: '14px',
    color: brandColors.secondaryNeutral,
    fontWeight: '600',
    margin: '0 0 4px 0',
  } as React.CSSProperties,

  detailValue: {
    fontSize: '16px',
    color: brandColors.darkNeutral,
    fontWeight: '400',
    margin: '0',
  } as React.CSSProperties,

  // Footer
  footer: {
    backgroundColor: brandColors.darkNeutral,
    color: brandColors.white,
    padding: '20px',
    textAlign: 'center' as const,
    fontSize: '12px',
    lineHeight: '1.5',
  } as React.CSSProperties,

  footerLink: {
    color: brandColors.primary,
    textDecoration: 'none',
  } as React.CSSProperties,

  // Dividers
  divider: {
    height: '1px',
    backgroundColor: brandColors.lightNeutral,
    margin: '20px 0',
    border: 'none',
  } as React.CSSProperties,

  // Status badges
  badgeSuccess: {
    backgroundColor: brandColors.success,
    color: brandColors.white,
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block',
  } as React.CSSProperties,

  badgeWarning: {
    backgroundColor: brandColors.warning,
    color: brandColors.white,
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block',
  } as React.CSSProperties,

  badgeError: {
    backgroundColor: brandColors.error,
    color: brandColors.white,
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block',
  } as React.CSSProperties,

  // Social media icons
  socialIcon: {
    width: '32px',
    height: '32px',
    margin: '0 8px',
    display: 'inline-block',
  } as React.CSSProperties,
} as const;

/**
 * Responsive email styles (use media queries in <Head>)
 */
export const responsiveStyles = `
  @media only screen and (max-width: 600px) {
    .container {
      width: 100% !important;
    }
    .section {
      padding: 15px !important;
    }
    h1 {
      font-size: 24px !important;
    }
    h2 {
      font-size: 20px !important;
    }
  }

  @media (prefers-color-scheme: dark) {
    .body {
      background-color: #1F2937 !important;
    }
    .container {
      background-color: #374151 !important;
    }
    .text {
      color: #F9FAFB !important;
    }
  }
`;
