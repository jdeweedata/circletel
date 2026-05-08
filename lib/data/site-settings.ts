import { SiteSettings } from './types'

export const siteSettings: SiteSettings = {
  siteName: 'CircleTel',
  tagline: 'Connecting Today. Creating Tomorrow',
  contactInfo: {
    address: 'Imagine House, 2 Mellis Rd, Rivonia, Sandton, 2191',
    email: 'contactus@circletel.co.za',
    phone: '082 487 3900',
    supportHours: 'Mon–Fri 8am–5pm SAST',
  },
  defaultSeo: {
    metaTitle: 'CircleTel | Fast, Reliable Internet for Home & Business',
    metaDescription:
      'CircleTel delivers fast fixed wireless and fibre internet across South Africa. Connect today with flexible home and business packages.',
  },
  socialLinks: {
    facebook: 'https://web.facebook.com/circletelsa/',
    twitter: 'https://twitter.com/circletel',
    instagram: '',
    linkedin: 'https://www.linkedin.com/company/circle-tel-sa',
    youtube: '',
  },
  footerCta: {
    headline: 'Ready to connect?',
    description: 'Get fast, reliable internet from CircleTel today.',
    cta: {
      label: 'View Packages',
      url: '/packages',
      style: 'primary',
      openInNewTab: false,
    },
  },
}
