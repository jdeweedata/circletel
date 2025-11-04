/**
 * MTN Deal Recommendation Engine
 * 
 * Recommends deals based on customer profile and preferences
 */

export interface CustomerProfile {
  budget?: number;
  preferredContractTerm?: number;
  dataUsage?: 'low' | 'medium' | 'high';
  devicePreference?: string; // e.g., 'Samsung', 'iPhone', 'Budget'
  existingServices?: string[];
}

export interface DealScore {
  deal: any;
  score: number;
  reasons: string[];
}

export class DealRecommender {
  /**
   * Recommend deals based on customer profile
   */
  static recommendDeals(deals: any[], profile: CustomerProfile, limit: number = 5): DealScore[] {
    const scoredDeals = deals.map(deal => ({
      deal,
      score: this.calculateScore(deal, profile),
      reasons: this.getRecommendationReasons(deal, profile)
    }));
    
    // Sort by score descending
    scoredDeals.sort((a, b) => b.score - a.score);
    
    return scoredDeals.slice(0, limit);
  }
  
  /**
   * Calculate recommendation score (0-100)
   */
  private static calculateScore(deal: any, profile: CustomerProfile): number {
    let score = 50; // Base score
    
    // Budget match (0-25 points)
    if (profile.budget) {
      const totalMonthly = deal.monthly_price_incl_vat + (deal.device_payment_incl_vat || 0);
      const budgetDiff = Math.abs(totalMonthly - profile.budget) / profile.budget;
      
      if (budgetDiff < 0.1) {
        score += 25; // Perfect match
      } else if (budgetDiff < 0.2) {
        score += 20; // Close match
      } else if (budgetDiff < 0.3) {
        score += 15; // Acceptable
      } else if (budgetDiff > 0.5) {
        score -= 10; // Too far off budget
      }
    }
    
    // Contract term match (0-20 points)
    if (profile.preferredContractTerm) {
      if (deal.contract_term === profile.preferredContractTerm) {
        score += 20;
      } else {
        const termDiff = Math.abs(deal.contract_term - profile.preferredContractTerm);
        score += Math.max(0, 20 - (termDiff * 5));
      }
    }
    
    // Data usage match (0-20 points)
    if (profile.dataUsage && deal.total_data) {
      const dataGB = this.parseDataToGB(deal.total_data);
      
      if (profile.dataUsage === 'low' && dataGB <= 10) {
        score += 20;
      } else if (profile.dataUsage === 'medium' && dataGB > 10 && dataGB <= 50) {
        score += 20;
      } else if (profile.dataUsage === 'high' && dataGB > 50) {
        score += 20;
      } else {
        score += 10; // Partial match
      }
    }
    
    // Device preference (0-15 points)
    if (profile.devicePreference && deal.device_name) {
      const deviceName = deal.device_name.toLowerCase();
      const preference = profile.devicePreference.toLowerCase();
      
      if (deviceName.includes(preference)) {
        score += 15;
      }
    }
    
    // Value for money (0-10 points)
    const dataGB = this.parseDataToGB(deal.total_data);
    const costPerGB = dataGB > 0 ? deal.monthly_price_incl_vat / dataGB : 999;
    
    if (costPerGB < 20) {
      score += 10; // Excellent value
    } else if (costPerGB < 30) {
      score += 7; // Good value
    } else if (costPerGB < 40) {
      score += 5; // Fair value
    }
    
    // Promo ending soon (0-10 points boost)
    if (deal.promo_end_date) {
      const daysUntilExpiry = this.getDaysUntilExpiry(deal.promo_end_date);
      if (daysUntilExpiry > 0 && daysUntilExpiry < 30) {
        score += 10; // Urgency bonus
      }
    }
    
    return Math.min(100, Math.max(0, score));
  }
  
  /**
   * Generate human-readable recommendation reasons
   */
  private static getRecommendationReasons(deal: any, profile: CustomerProfile): string[] {
    const reasons: string[] = [];
    
    if (profile.budget) {
      const totalMonthly = deal.monthly_price_incl_vat + (deal.device_payment_incl_vat || 0);
      const budgetDiff = Math.abs(totalMonthly - profile.budget) / profile.budget;
      
      if (budgetDiff < 0.1) {
        reasons.push('Perfect budget match');
      } else if (totalMonthly < profile.budget) {
        reasons.push('Under budget');
      }
    }
    
    if (profile.preferredContractTerm && deal.contract_term === profile.preferredContractTerm) {
      reasons.push(`${deal.contract_term}-month contract as requested`);
    }
    
    if (profile.dataUsage && deal.total_data) {
      const dataGB = this.parseDataToGB(deal.total_data);
      
      if (profile.dataUsage === 'high' && dataGB > 50) {
        reasons.push('High data allocation for heavy users');
      } else if (profile.dataUsage === 'medium' && dataGB > 10 && dataGB <= 50) {
        reasons.push('Balanced data for regular users');
      } else if (profile.dataUsage === 'low' && dataGB <= 10) {
        reasons.push('Cost-effective data for light users');
      }
    }
    
    if (profile.devicePreference && deal.device_name) {
      const deviceName = deal.device_name.toLowerCase();
      const preference = profile.devicePreference.toLowerCase();
      
      if (deviceName.includes(preference)) {
        reasons.push(`Matches your ${profile.devicePreference} preference`);
      }
    }
    
    // Value analysis
    const dataGB = this.parseDataToGB(deal.total_data);
    const costPerGB = dataGB > 0 ? deal.monthly_price_incl_vat / dataGB : 999;
    
    if (costPerGB < 20) {
      reasons.push('Excellent value for money');
    }
    
    // Urgency
    if (deal.promo_end_date) {
      const daysUntilExpiry = this.getDaysUntilExpiry(deal.promo_end_date);
      if (daysUntilExpiry > 0 && daysUntilExpiry < 30) {
        reasons.push(`Promo ending in ${daysUntilExpiry} days`);
      }
    }
    
    if (reasons.length === 0) {
      reasons.push('Popular choice');
    }
    
    return reasons;
  }
  
  /**
   * Parse data string to GB (e.g., "50GB" -> 50, "1TB" -> 1000)
   */
  private static parseDataToGB(dataStr: string): number {
    if (!dataStr) return 0;
    
    const match = dataStr.match(/(\d+(?:\.\d+)?)\s*(GB|TB|MB)/i);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    switch (unit) {
      case 'TB':
        return value * 1000;
      case 'GB':
        return value;
      case 'MB':
        return value / 1000;
      default:
        return 0;
    }
  }
  
  /**
   * Get days until promo expiry
   */
  private static getDaysUntilExpiry(endDate: string): number {
    const end = new Date(endDate);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }
}
