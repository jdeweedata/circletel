// lib/integrations/zoho/__tests__/desk-campaign-service.test.ts

import {
  ConversationIntelligence,
  type CampaignConversation,
} from '../desk-campaign-service';

function makeConv(overrides: Partial<CampaignConversation>): CampaignConversation {
  return {
    id: 'c1',
    author: 'Test User',
    direction: 'in',
    content: 'Hello',
    timestamp: new Date().toISOString(),
    channel: 'whatsapp',
    ...overrides,
  };
}

describe('ConversationIntelligence', () => {
  describe('extractLeadProfile', () => {
    it('extracts email from inbound message', () => {
      const conversations: CampaignConversation[] = [
        makeConv({ direction: 'in', content: 'My email is john.doe@gmail.com' }),
      ];
      const ci = new ConversationIntelligence(conversations, 'Open');
      expect(ci.extractLeadProfile().email).toBe('john.doe@gmail.com');
    });

    it('extracts SA phone number starting with 0', () => {
      const conversations: CampaignConversation[] = [
        makeConv({ direction: 'in', content: 'Call me on 083 123 4567' }),
      ];
      const ci = new ConversationIntelligence(conversations, 'Open');
      expect(ci.extractLeadProfile().phone).toBe('0831234567');
    });

    it('extracts SA phone number starting with +27', () => {
      const conversations: CampaignConversation[] = [
        makeConv({ direction: 'in', content: 'My number is +27821234567' }),
      ];
      const ci = new ConversationIntelligence(conversations, 'Open');
      expect(ci.extractLeadProfile().phone).toBe('+27821234567');
    });

    it('returns empty profile when no data found', () => {
      const conversations: CampaignConversation[] = [
        makeConv({ direction: 'in', content: 'Hello I need internet' }),
      ];
      const ci = new ConversationIntelligence(conversations, 'Open');
      const profile = ci.extractLeadProfile();
      expect(profile.email).toBeUndefined();
      expect(profile.phone).toBeUndefined();
    });
  });

  describe('deriveInsightStatus', () => {
    it('returns awaiting_agent when only inbound messages exist', () => {
      const conversations: CampaignConversation[] = [
        makeConv({ direction: 'in', content: 'Hello I need internet' }),
      ];
      const ci = new ConversationIntelligence(conversations, 'Open');
      expect(ci.deriveInsightStatus({ isSigned_up: false })).toBe('awaiting_agent');
    });

    it('returns no_coverage when agent message contains "no coverage"', () => {
      const conversations: CampaignConversation[] = [
        makeConv({ direction: 'in', content: 'I live in Pretoria' }),
        makeConv({ direction: 'out', author: 'Tamsyn', content: 'Unfortunately there is no coverage in your area.' }),
      ];
      const ci = new ConversationIntelligence(conversations, 'Open');
      expect(ci.deriveInsightStatus({ isSigned_up: false })).toBe('no_coverage');
    });

    it('returns closed_resolved when ticket status is Closed', () => {
      const conversations: CampaignConversation[] = [
        makeConv({ direction: 'in', content: 'Thanks!' }),
        makeConv({ direction: 'out', author: 'Tamsyn', content: 'Welcome aboard!' }),
      ];
      const ci = new ConversationIntelligence(conversations, 'Closed');
      expect(ci.deriveInsightStatus({ isSigned_up: false })).toBe('closed_resolved');
    });

    it('returns signed_up with highest priority even over no_coverage', () => {
      const conversations: CampaignConversation[] = [
        makeConv({ direction: 'in', content: 'I live in Pretoria' }),
        makeConv({ direction: 'out', author: 'Tamsyn', content: 'No coverage in your area.' }),
      ];
      const ci = new ConversationIntelligence(conversations, 'Open');
      expect(ci.deriveInsightStatus({ isSigned_up: true })).toBe('signed_up');
    });

    it('returns completed when all 4 fields extracted and thread >= 5 messages', () => {
      const now = new Date();
      const conversations: CampaignConversation[] = [
        makeConv({ direction: 'in', content: '15 Milner Rd, Vaalview' }),
        makeConv({ direction: 'in', content: 'John Doe' }),
        makeConv({ direction: 'in', content: 'john.doe@example.com' }),
        makeConv({ direction: 'in', content: '0831234567' }),
        makeConv({ direction: 'out', author: 'Tamsyn', content: 'Thank you John! What is your full name and address?' }),
      ];
      const ci = new ConversationIntelligence(conversations, 'Open');
      expect(ci.deriveInsightStatus({ isSigned_up: false })).toBe('completed');
    });

    it('returns awaiting_details when GC started but fields missing', () => {
      const conversations: CampaignConversation[] = [
        makeConv({ direction: 'in', content: '15 Milner Rd, Vaalview' }),
        makeConv({ direction: 'out', author: 'Tamsyn', content: 'What is your name?' }),
      ];
      const ci = new ConversationIntelligence(conversations, 'Open');
      expect(ci.deriveInsightStatus({ isSigned_up: false })).toBe('awaiting_details');
    });

    it('returns unresponsive when last inbound > 48h ago with no outbound follow-up', () => {
      const oldDate = new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(); // 50h ago
      const conversations: CampaignConversation[] = [
        makeConv({ direction: 'in', content: 'Hello', timestamp: oldDate }),
        makeConv({ direction: 'out', author: 'Tamsyn', content: 'Hi! What is your address?', timestamp: oldDate }),
        // No inbound reply since
      ];
      const ci = new ConversationIntelligence(conversations, 'Open');
      expect(ci.deriveInsightStatus({ isSigned_up: false })).toBe('unresponsive');
    });

    it('returns in_progress when agent has replied, ticket Open, no negative signals', () => {
      const recentDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2h ago
      const conversations: CampaignConversation[] = [
        makeConv({ direction: 'in', content: 'I need fibre', timestamp: recentDate }),
        makeConv({ direction: 'out', author: 'Tamsyn', content: 'We can help!', timestamp: recentDate }),
        makeConv({ direction: 'in', content: 'Great, my address is 5 Oak St', timestamp: recentDate }),
      ];
      const ci = new ConversationIntelligence(conversations, 'Open');
      expect(ci.deriveInsightStatus({ isSigned_up: false })).toBe('in_progress');
    });
  });
});
