/**
 * CircleTel Email Hero Component
 *
 * Hero section with title, optional subtitle, icon, and gradient background
 */

import * as React from 'react';
import { Section, Heading, Text } from '@react-email/components';
import { emailStyles, brandColors, typography } from '../utils/styles';

interface CircleTelHeroProps {
  title: string;
  subtitle?: string;
  icon?: string;
  variant?: 'gradient' | 'light' | 'white';
}

export const CircleTelHero: React.FC<CircleTelHeroProps> = ({
  title,
  subtitle,
  icon,
  variant = 'light',
}) => {
  // Choose style based on variant
  const sectionStyle =
    variant === 'gradient'
      ? emailStyles.heroWithGradient
      : variant === 'light'
      ? emailStyles.hero
      : { ...emailStyles.hero, backgroundColor: brandColors.white };

  const titleColor =
    variant === 'gradient' ? brandColors.white : brandColors.darkNeutral;
  const subtitleColor =
    variant === 'gradient' ? brandColors.white : brandColors.secondaryNeutral;

  return (
    <Section style={sectionStyle}>
      {icon && (
        <Text
          style={{
            fontSize: '48px',
            lineHeight: '1',
            margin: '0 0 16px 0',
            textAlign: 'center',
          }}
        >
          {icon}
        </Text>
      )}
      <Heading
        as="h1"
        style={{
          ...typography.h1,
          color: titleColor,
          textAlign: 'center',
          margin: '0 0 12px 0',
        }}
      >
        {title}
      </Heading>
      {subtitle && (
        <Text
          style={{
            ...typography.body,
            color: subtitleColor,
            textAlign: 'center',
            margin: '0',
          }}
        >
          {subtitle}
        </Text>
      )}
    </Section>
  );
};

export default CircleTelHero;
