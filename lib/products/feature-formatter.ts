/**
 * Product Feature Formatter
 * Converts technical product features into customer-friendly marketing copy
 */

export interface FormattedFeature {
  text: string;
  icon?: string;
  category?: 'benefit' | 'technical' | 'contract' | 'support';
}

/**
 * Feature mapping rules for customer-friendly text
 */
const FEATURE_MAPPINGS: Record<string, string> = {
  // Data & Speed
  'speeds up to': '⚡ Lightning-fast speeds of up to',
  'total monthly data': '📊 Monthly data allowance:',
  'priority data': '🎯 Priority high-speed data:',
  'anytime data': '🌙 Anytime data:',
  'bonus data': '🎁 Bonus data included:',
  'uncapped': '♾️ Unlimited data - browse, stream & download as much as you want',
  'unlimited': '♾️ Unlimited usage - no caps, no limits',
  
  // Internet & Connectivity
  'wifi ready': '📶 WiFi ready - connect all your devices',
  'family wifi': '👨‍👩‍👧‍👦 Perfect for family connectivity',
  'fibre': '🌐 Ultra-reliable fibre connection',
  'lte': '📡 Fast LTE wireless internet',
  '5g': '🚀 Next-gen 5G speeds',
  
  // Streaming & Entertainment
  'streaming': '📺 Stream your favorite shows in HD',
  '4k video': '🎬 4K Ultra HD video streaming',
  'hd streaming': '📺 Crystal-clear HD streaming',
  'unlimited entertainment': '🎭 Endless entertainment options',
  'professional streaming': '🎥 Professional-grade streaming quality',
  
  // Gaming
  'gaming ready': '🎮 Optimized for online gaming',
  'gaming ready - pro': '🎮 Pro-level gaming performance with low latency',
  
  // Work & Productivity
  'work from home': '💼 Perfect for working from home',
  'video calls': '📹 Smooth video conferencing',
  'content creation': '🎨 Ideal for content creators',
  'large file downloads': '📥 Download large files quickly',
  'cloud storage': '☁️ Easy cloud backup and storage',
  
  // Installation & Setup
  'free installation': '✅ Free professional installation',
  'free setup': '✅ Free setup - we handle everything',
  'installation time': '⏱️ Quick installation:',
  'month-to-month': '📅 Flexible month-to-month contract - no long-term commitment',
  '24-month contract': '📝 24-month contract with amazing value',
  '36-month contract': '📝 36-month contract with lowest monthly price',
  
  // Router & Equipment
  'router': '📡 Free router included',
  'free router': '📡 FREE high-speed router',
  'free-to-use router': '📡 Free-to-use router (yours to keep)',
  'fully insured': '🛡️ Router fully insured - free replacement if needed',
  'router bundle': '📦 Router bundle available',
  
  // Support & Service
  '24/7 support': '💬 24/7 customer support - we\'re always here',
  'customer support': '💬 Dedicated customer support',
  'priority support': '⭐ Priority customer support',
  'business sla': '🤝 Business-grade service level agreement',
  
  // Value & Savings
  'best value': '💰 Best value for money',
  'cost-effective': '💰 Cost-effective solution',
  'promotional': '🏷️ Special promotional offer',
  
  // Contract & Fees
  'once-off': 'One-time',
  'processing fee': '📋 Setup & processing fee:',
  'setup fee': '💵 Initial setup cost:',
  'no setup fee': '✅ NO setup fees - get started for free',
};

/**
 * Convert technical feature to customer-friendly text
 */
export function formatFeature(feature: string): FormattedFeature {
  let formattedText = feature;
  let category: FormattedFeature['category'] = 'technical';
  
  const lowerFeature = feature.toLowerCase();
  
  // Apply mappings
  for (const [key, replacement] of Object.entries(FEATURE_MAPPINGS)) {
    if (lowerFeature.includes(key.toLowerCase())) {
      formattedText = formattedText.replace(
        new RegExp(key, 'gi'),
        replacement
      );
      
      // Categorize
      if (key.includes('free') || key.includes('insured') || key.includes('router') || key.includes('installation')) {
        category = 'benefit';
      } else if (key.includes('contract') || key.includes('month')) {
        category = 'contract';
      } else if (key.includes('support')) {
        category = 'support';
      }
      break;
    }
  }
  
  // Add bullet point if not already present
  if (!formattedText.match(/^[•●◆▪️⚡📊🎯🌙🎁♾️📶👨‍👩‍👧‍👦🌐📡🚀📺🎬🎭🎥🎮💼📹🎨📥☁️✅⏱️📅📝📡🛡️📦💬⭐🤝💰🏷️📋💵]/)) {
    formattedText = `• ${formattedText}`;
  }
  
  return {
    text: formattedText,
    category,
  };
}

/**
 * Format all features in an array
 */
export function formatFeatures(features: string[]): FormattedFeature[] {
  return features.map(formatFeature);
}

/**
 * Get customer-friendly benefits from features
 * (Features that include free items, included services, etc.)
 */
export function extractBenefits(features: string[]): FormattedFeature[] {
  return formatFeatures(features)
    .filter(f => f.category === 'benefit')
    .slice(0, 4); // Limit to top 4 benefits
}

/**
 * Get additional product information
 * (Contract terms, technical specs, etc.)
 */
export function extractAdditionalInfo(features: string[]): FormattedFeature[] {
  const formatted = formatFeatures(features);
  const benefitTexts = extractBenefits(features).map(b => b.text);
  
  return formatted
    .filter(f => !benefitTexts.includes(f.text)) // Exclude benefits
    .slice(0, 6); // Limit to 6 items
}

/**
 * Generate marketing copy from product features
 */
export function generateMarketingCopy(product: {
  name: string;
  description?: string;
  features: string[];
  speed_down?: number;
  speed_up?: number;
  price: number;
}): string {
  const hasUncapped = product.features.some(f => 
    f.toLowerCase().includes('uncapped') || f.toLowerCase().includes('unlimited')
  );
  
  const hasStreaming = product.features.some(f => 
    f.toLowerCase().includes('streaming')
  );
  
  const hasGaming = product.features.some(f => 
    f.toLowerCase().includes('gaming')
  );
  
  const speedText = product.speed_down 
    ? `with speeds up to ${product.speed_down}Mbps` 
    : '';
  
  let copy = product.description || '';
  
  // Add marketing flair
  if (hasUncapped) {
    copy += ` 🌟 Unlimited data means unlimited possibilities - stream, game, and browse without worrying about data limits!`;
  }
  
  if (hasStreaming && hasGaming) {
    copy += ` Perfect for both entertainment lovers and serious gamers.`;
  } else if (hasStreaming) {
    copy += ` Ideal for binge-watching your favorite shows and movies.`;
  } else if (hasGaming) {
    copy += ` Optimized for competitive online gaming with low latency.`;
  }
  
  return copy.trim();
}
