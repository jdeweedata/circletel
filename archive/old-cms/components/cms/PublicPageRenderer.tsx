'use client';

/**
 * Public Page Renderer Component
 *
 * Renders published CMS pages on the public site
 * Features:
 * - Theming support (Light, Dark, Black Friday)
 * - Rich Pricing Tables
 * - Enhanced Hero & Feature sections
 * - Responsive design
 */

import React from 'react';
import { Check, Star, X, ArrowRight, Zap, Shield, Globe } from 'lucide-react';
import type { PageContent, SEOMetadata, ContentSection, PricingItem } from '@/lib/cms/types';

interface PageData {
  id: string;
  slug: string;
  title: string;
  content_type: string;
  status: string;
  content: PageContent;
  seo_metadata: SEOMetadata;
  featured_image: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface PublicPageRendererProps {
  page: PageData;
}

// Theme Configuration
const THEMES = {
  light: {
    bg: 'bg-white',
    text: 'text-slate-900',
    textMuted: 'text-slate-600',
    cardBg: 'bg-white',
    cardBorder: 'border-slate-200',
    heading: 'text-slate-900',
    accent: 'text-circleTel-orange',
    buttonPrimary: 'bg-circleTel-orange text-white hover:bg-orange-600',
    buttonSecondary: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50',
    heroBg: 'bg-gradient-to-r from-circleTel-orange to-orange-500',
    heroText: 'text-white',
  },
  dark: {
    bg: 'bg-slate-950',
    text: 'text-slate-100',
    textMuted: 'text-slate-400',
    cardBg: 'bg-slate-900',
    cardBorder: 'border-slate-800',
    heading: 'text-white',
    accent: 'text-orange-400',
    buttonPrimary: 'bg-orange-500 text-white hover:bg-orange-600',
    buttonSecondary: 'bg-transparent text-white border border-slate-700 hover:bg-slate-800',
    heroBg: 'bg-gradient-to-b from-slate-900 to-slate-950',
    heroText: 'text-white',
  },
  black_friday: {
    bg: 'bg-black',
    text: 'text-gray-100',
    textMuted: 'text-gray-400',
    cardBg: 'bg-zinc-900',
    cardBorder: 'border-orange-500/30',
    heading: 'text-white',
    accent: 'text-yellow-400',
    buttonPrimary: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold hover:from-yellow-400 hover:to-orange-400',
    buttonSecondary: 'bg-transparent text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/10',
    heroBg: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-black to-black',
    heroText: 'text-white',
  },
};

export default function PublicPageRenderer({ page }: PublicPageRendererProps) {
  const { content } = page;
  const themeName = content.theme || 'light';
  const theme = THEMES[themeName as keyof typeof THEMES] || THEMES.light;

  // Helper to render icons
  const renderIcon = (iconName?: string) => {
    if (!iconName) return null;
    // Try to match lucide icons
    const icons: Record<string, React.ReactNode> = {
      zap: <Zap className="w-6 h-6" />,
      shield: <Shield className="w-6 h-6" />,
      globe: <Globe className="w-6 h-6" />,
      star: <Star className="w-6 h-6" />,
      check: <Check className="w-6 h-6" />,
    };
    return icons[iconName.toLowerCase()] || <span className="text-2xl">{iconName}</span>;
  };

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} transition-colors duration-300 font-sans`}>
      {/* Hero Section */}
      {content.hero && (
        <section className={`relative py-20 lg:py-32 overflow-hidden ${themeName === 'black_friday' ? 'border-b border-orange-900/30' : ''}`}>
          {/* Dynamic Background for Themes */}
          <div className={`absolute inset-0 ${theme.heroBg} z-0`} />
          
          {/* Background Image Overlay */}
          {content.hero.background_image && (
            <div className="absolute inset-0 z-0 opacity-20">
              <img 
                src={content.hero.background_image} 
                alt="Hero Background" 
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Black Friday Specific Elements */}
          {themeName === 'black_friday' && (
            <>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 z-20" />
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl z-0 pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl z-0 pointer-events-none" />
            </>
          )}

          <div className="container mx-auto px-4 relative z-10 text-center lg:text-left">
            <div className="max-w-4xl mx-auto lg:mx-0">
              {themeName === 'black_friday' && (
                <span className="inline-block px-4 py-1 mb-6 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                  Black Friday Exclusive
                </span>
              )}
              
              <h1 className={`text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight ${theme.heroText}`}>
                {content.hero.headline}
              </h1>
              
              <p className={`text-xl md:text-2xl mb-10 max-w-2xl ${themeName === 'light' ? 'text-white/90' : 'text-gray-300'} leading-relaxed`}>
                {content.hero.subheadline}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {content.hero.cta_primary && (
                  <a href={content.hero.cta_primary_url || '#'} className={`px-8 py-4 rounded-lg font-bold text-lg shadow-lg transition-all transform hover:-translate-y-1 ${theme.buttonPrimary}`}>
                    {content.hero.cta_primary}
                  </a>
                )}
                {content.hero.cta_secondary && (
                  <a href={content.hero.cta_secondary_url || '#'} className={`px-8 py-4 rounded-lg font-bold text-lg backdrop-blur-sm transition-all ${theme.buttonSecondary}`}>
                    {content.hero.cta_secondary}
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content Sections */}
      <div className="container mx-auto px-4 py-16 space-y-24">
        {content.sections.map((section, index) => {
          // Text Section
          if (section.type === 'text') {
            return (
              <section key={index} className={`prose prose-lg max-w-4xl mx-auto ${themeName !== 'light' ? 'prose-invert' : ''}`}>
                {section.heading && <h2 className={theme.heading}>{section.heading}</h2>}
                <div dangerouslySetInnerHTML={{ __html: section.content }} />
              </section>
            );
          }

          // Features Section
          if (section.type === 'features') {
            return (
              <section key={index}>
                {section.heading && (
                  <h2 className={`text-3xl md:text-4xl font-bold mb-4 text-center ${theme.heading}`}>
                    {section.heading}
                  </h2>
                )}
                {section.subheading && (
                  <p className={`text-xl text-center mb-12 max-w-3xl mx-auto ${theme.textMuted}`}>
                    {section.subheading}
                  </p>
                )}
                
                <div className={`grid grid-cols-1 md:grid-cols-2 ${section.layout === 'grid-3' ? 'lg:grid-cols-3' : ''} gap-8`}>
                  {section.items.map((feature, i) => (
                    <div
                      key={i}
                      className={`${theme.cardBg} rounded-2xl p-8 border ${theme.cardBorder} hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl group`}
                    >
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300 ${themeName === 'black_friday' ? 'bg-gradient-to-br from-yellow-500 to-orange-600 text-black' : 'bg-circleTel-orange text-white'}`}>
                        {renderIcon(feature.icon) || (themeName === 'black_friday' ? '⚡' : '★')}
                      </div>
                      <h3 className={`text-xl font-bold mb-3 ${theme.heading}`}>
                        {feature.title}
                      </h3>
                      <p className={theme.textMuted}>
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          // Pricing Section
          if (section.type === 'pricing') {
            return (
              <section key={index} className="relative">
                {section.heading && (
                  <h2 className={`text-3xl md:text-5xl font-bold mb-6 text-center ${theme.heading}`}>
                    {section.heading}
                  </h2>
                )}
                {section.subheading && (
                  <p className={`text-xl text-center mb-16 max-w-3xl mx-auto ${theme.textMuted}`}>
                    {section.subheading}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                  {section.items.map((plan: PricingItem, i: number) => (
                    <div
                      key={i}
                      className={`relative flex flex-col ${theme.cardBg} rounded-3xl border ${
                        plan.highlight 
                          ? (themeName === 'black_friday' ? 'border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.2)]' : 'border-circleTel-orange shadow-xl')
                          : theme.cardBorder
                      } p-8 transition-transform hover:-translate-y-2 duration-300`}
                    >
                      {plan.badge && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                          <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                            themeName === 'black_friday' 
                              ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg' 
                              : 'bg-circleTel-orange text-white'
                          }`}>
                            {plan.badge}
                          </span>
                        </div>
                      )}

                      <h3 className={`text-xl font-semibold mb-2 ${theme.textMuted}`}>{plan.title}</h3>
                      
                      <div className="flex items-baseline gap-2 mb-6">
                        {plan.original_price && (
                          <span className="text-lg text-gray-500 line-through decoration-red-500 decoration-2">
                            {plan.original_price}
                          </span>
                        )}
                        <span className={`text-4xl md:text-5xl font-bold ${themeName === 'black_friday' ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500' : theme.heading}`}>
                          {plan.price}
                        </span>
                        {plan.period && <span className={`text-sm ${theme.textMuted}`}>{plan.period}</span>}
                      </div>

                      <ul className="space-y-4 mb-8 flex-1">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <Check className={`w-5 h-5 shrink-0 ${theme.accent}`} />
                            <span className={`text-sm ${theme.text}`}>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <a
                        href={plan.cta_url || '#'}
                        className={`w-full py-4 rounded-xl font-bold text-center transition-all ${
                          plan.highlight
                            ? theme.buttonPrimary
                            : theme.buttonSecondary
                        }`}
                      >
                        {plan.cta_text || 'Choose Plan'}
                      </a>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          // CTA Section
          if (section.type === 'cta') {
            return (
              <section
                key={index}
                className={`relative rounded-3xl p-12 md:p-20 text-center overflow-hidden ${themeName === 'black_friday' ? 'bg-zinc-900 border border-orange-500/30' : 'bg-gradient-to-br from-slate-900 to-slate-800'}`}
              >
                {themeName === 'black_friday' && (
                  <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5 mix-blend-overlay" />
                )}
                
                <div className="relative z-10 max-w-3xl mx-auto">
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                    {section.heading}
                  </h2>
                  <p className="text-xl text-gray-300 mb-10 leading-relaxed">
                    {section.description}
                  </p>
                  {section.button_text && (
                    <a
                      href={section.button_url || '#'}
                      className={`inline-flex items-center gap-2 px-10 py-5 rounded-full font-bold text-lg shadow-xl transition-transform hover:scale-105 ${
                        themeName === 'black_friday'
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-400'
                          : 'bg-circleTel-orange text-white hover:bg-orange-600'
                      }`}
                    >
                      {section.button_text}
                      <ArrowRight className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </section>
            );
          }

          // Image Section
          if (section.type === 'image') {
            return (
              <section key={index} className="max-w-5xl mx-auto">
                <div className={`rounded-2xl overflow-hidden shadow-2xl ${theme.cardBorder} border`}>
                  <img
                    src={section.src}
                    alt={section.alt || 'Content image'}
                    className="w-full h-auto"
                  />
                  {section.caption && (
                    <p className={`text-center text-sm p-4 ${theme.cardBg} ${theme.textMuted}`}>
                      {section.caption}
                    </p>
                  )}
                </div>
              </section>
            );
          }

          return null;
        })}
      </div>

      {/* Footer CTA (Global) */}
      <section className={`py-16 border-t ${themeName === 'black_friday' ? 'bg-black border-orange-900/30' : 'bg-slate-50 border-slate-200'}`}>
        <div className="container mx-auto px-4 text-center">
          <h2 className={`text-2xl font-bold mb-4 ${theme.heading}`}>
            Still have questions?
          </h2>
          <p className={`text-lg mb-8 ${theme.textMuted}`}>
            Our team is ready to help you find the perfect solution.
          </p>
          <a href="/contact" className={`px-8 py-3 rounded-lg font-bold inline-block ${theme.buttonSecondary}`}>
            Contact Sales
          </a>
        </div>
      </section>
    </div>
  );
}
