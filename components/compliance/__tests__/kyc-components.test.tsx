import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { KYCStatusBadge } from '../KYCStatusBadge';
import { LightKYCSession } from '../LightKYCSession';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/customer/quote/123/kyc',
}));

describe('KYC UI Components', () => {
  // Test 1: KYCStatusBadge renders correct color for approved status
  test('KYCStatusBadge shows green badge for approved status', () => {
    render(
      <KYCStatusBadge
        status="completed"
        verificationResult="approved"
        verifiedDate="2025-11-01T10:00:00Z"
      />
    );

    const badge = screen.getByText(/KYC Verified/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-500');
  });

  // Test 2: KYCStatusBadge shows red badge for declined status
  test('KYCStatusBadge shows red badge for declined status', () => {
    render(
      <KYCStatusBadge
        status="completed"
        verificationResult="declined"
      />
    );

    const badge = screen.getByText(/KYC Declined/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-500');
  });

  // Test 3: KYCStatusBadge shows yellow badge for pending review
  test('KYCStatusBadge shows yellow badge for pending review', () => {
    render(
      <KYCStatusBadge
        status="completed"
        verificationResult="pending_review"
      />
    );

    const badge = screen.getByText(/Pending Review/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-yellow-500');
  });

  // Test 4: KYCStatusBadge shows grey badge for not started
  test('KYCStatusBadge shows grey badge for not started status', () => {
    render(<KYCStatusBadge status="not_started" />);

    const badge = screen.getByText(/Not Started/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-300');
  });

  // Test 5: LightKYCSession renders with verification URL
  test('LightKYCSession component renders with correct verification URL', () => {
    const mockSessionData = {
      sessionId: 'test-session-123',
      verificationUrl: 'https://verify.didit.com/session/test-session-123',
      flowType: 'sme_light' as const,
    };

    render(<LightKYCSession {...mockSessionData} />);

    expect(screen.getByText(/Complete Verification/i)).toBeInTheDocument();
    expect(screen.getByText(/Start Verification/i)).toBeInTheDocument();
  });

  // Test 6: LightKYCSession shows loading state
  test('LightKYCSession displays loading state correctly', () => {
    const mockSessionData = {
      sessionId: 'test-session-123',
      verificationUrl: 'https://verify.didit.com/session/test-session-123',
      flowType: 'sme_light' as const,
      isLoading: true,
    };

    render(<LightKYCSession {...mockSessionData} />);

    expect(screen.getByText(/Preparing verification/i)).toBeInTheDocument();
  });

  // Test 7: KYCStatusBadge shows in_progress status
  test('KYCStatusBadge shows blue badge for in_progress status', () => {
    render(<KYCStatusBadge status="in_progress" />);

    const badge = screen.getByText(/In Progress/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-blue-500');
  });

  // Test 8: KYCStatusBadge shows abandoned status
  test('KYCStatusBadge shows grey badge for abandoned status', () => {
    render(<KYCStatusBadge status="abandoned" />);

    const badge = screen.getByText(/Abandoned/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-400');
  });
});
