/**
 * CircleTel Email Social Links Component
 *
 * Social media icon links with customizable platforms
 */

import * as React from 'react';
import { Section, Link, Img, Row, Column } from '@react-email/components';
import { emailStyles } from '../utils/styles';

interface SocialLink {
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin';
  url: string;
  iconUrl?: string;
}

interface CircleTelSocialLinksProps {
  showFacebook?: boolean;
  showTwitter?: boolean;
  showInstagram?: boolean;
  showLinkedIn?: boolean;
  customLinks?: SocialLink[];
  align?: 'left' | 'center' | 'right';
}

export const CircleTelSocialLinks: React.FC<CircleTelSocialLinksProps> = ({
  showFacebook = true,
  showTwitter = true,
  showInstagram = true,
  showLinkedIn = true,
  customLinks,
  align = 'center',
}) => {
  // Default social links
  const defaultLinks: SocialLink[] = [
    {
      platform: 'facebook',
      url: 'https://facebook.com/circletel',
      iconUrl: 'https://www.circletel.co.za/icons/social/facebook.png',
    },
    {
      platform: 'twitter',
      url: 'https://twitter.com/circletel',
      iconUrl: 'https://www.circletel.co.za/icons/social/twitter.png',
    },
    {
      platform: 'instagram',
      url: 'https://instagram.com/circletel',
      iconUrl: 'https://www.circletel.co.za/icons/social/instagram.png',
    },
    {
      platform: 'linkedin',
      url: 'https://linkedin.com/company/circletel',
      iconUrl: 'https://www.circletel.co.za/icons/social/linkedin.png',
    },
  ];

  // Filter based on props
  const links = customLinks || defaultLinks.filter((link) => {
    if (link.platform === 'facebook') return showFacebook;
    if (link.platform === 'twitter') return showTwitter;
    if (link.platform === 'instagram') return showInstagram;
    if (link.platform === 'linkedin') return showLinkedIn;
    return false;
  });

  if (links.length === 0) return null;

  return (
    <Section style={{ ...emailStyles.section, textAlign: align }}>
      <Row>
        {links.map((link, index) => (
          <Column
            key={index}
            style={{
              display: 'inline-block',
              padding: '0 8px',
            }}
          >
            <Link href={link.url} style={{ textDecoration: 'none' }}>
              {link.iconUrl ? (
                <Img
                  src={link.iconUrl}
                  alt={link.platform}
                  width="32"
                  height="32"
                  style={emailStyles.socialIcon}
                />
              ) : (
                // Fallback to text link if no icon
                <span
                  style={{
                    fontSize: '14px',
                    textDecoration: 'none',
                    color: '#F5831F',
                  }}
                >
                  {link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}
                </span>
              )}
            </Link>
          </Column>
        ))}
      </Row>
    </Section>
  );
};

export default CircleTelSocialLinks;
