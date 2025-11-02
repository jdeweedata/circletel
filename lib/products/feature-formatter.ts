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
 * Feature mapping rules for customer-friendly text (no emojis)
 */
const FEATURE_MAPPINGS: Record<string, string> = {
  // Data & Speed
  'speeds up to': 'Speeds up to',
  'total monthly data': 'Monthly data:',
  'priority data': 'Priority data:',
  'anytime data': 'Anytime data:',
  'bonus data': 'Bonus data:',
  
  // Gaming
  'gaming ready - pro': 'Gaming ready (Pro level)',
  'gaming ready': 'Gaming ready',
  
  // Installation & Setup - Highlight FREE value
  'free installation': 'FREE Installation - worth up to R1,699*',
  'free setup': 'FREE Setup - worth up to R1,699*',
  'installation time': 'Installation time:',
  'month-to-month': 'Month-to-month contract',
  
  // Router & Equipment - Emphasize FREE TO USE with retail value
  'router bundle available': 'FREE TO USE Router - valued at up to R1,999*',
  'free router': 'FREE TO USE Router - valued at up to R1,999*',
  'free-to-use router': 'FREE TO USE Router - valued at up to R1,999*',
  'router bundle': 'FREE TO USE Router - valued at up to R1,999*',
  'fully insured': '', // Remove fully insured
  
  // Contract & Fees
  'once-off': 'One-time',
  'processing fee': 'Processing fee:',
  'setup fee': 'Setup fee:',
};

/**
 * Convert technical feature to customer-friendly text
 */
export function formatFeature(feature: string): FormattedFeature {
  // Handle null/undefined/empty features
  if (!feature || typeof feature !== 'string') {
    return {
      text: '',
      category: 'technical',
    };
  }

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
  
  return {
    text: formattedText,
    category,
  };
}

/**
 * Format all features in an array
 */
export function formatFeatures(features: string[]): FormattedFeature[] {
  if (!features || !Array.isArray(features)) {
    return [];
  }
  return features
    .filter(f => f && typeof f === 'string') // Filter out null/undefined
    .map(formatFeature);
}

/**
 * Get customer-friendly benefits from features
 * (Features that include free items, included services, etc.)
 */
export function extractBenefits(features: string[]): FormattedFeature[] {
  return formatFeatures(features)
    .filter(f => f.category === 'benefit' && f.text.trim() !== '') // Exclude empty features
    .slice(0, 4); // Limit to top 4 benefits
}

/**
 * Get additional product information
 * (Contract terms, technical specs, etc.)
 */
export function extractAdditionalInfo(features: string[]): FormattedFeature[] {
  const formatted = formatFeatures(features);
  const benefitTexts = extractBenefits(features).map(b => b.text);
  
  const additionalInfo = formatted
    .filter(f => !benefitTexts.includes(f.text) && f.text.trim() !== '') // Exclude benefits and empty features
    .slice(0, 6); // Limit to 6 items

  // Add important router disclaimer if router is mentioned
  const hasRouter = benefitTexts.some(b => 
    b.toLowerCase().includes('router') || 
    b.toLowerCase().includes('equipment')
  );
  
  if (hasRouter && additionalInfo.length < 6) {
    additionalInfo.push({
      text: 'Router must be returned to MTN upon contract cancellation or termination',
      category: 'contract'
    });
  }
  
  return additionalInfo;
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
