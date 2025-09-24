/**
 * Component Integration Tests for EnhancedCoverageCheck
 *
 * These tests validate the EnhancedCoverageCheck component integration with:
 * - Real products display vs MOCK_PACKAGES removal
 * - Promotional pricing visualization
 * - Technology filtering behavior
 * - Loading states and error handling
 * - Performance requirements (<2s total load)
 *
 * Following TDD principles: These tests MUST FAIL initially until the
 * component implementation is complete (T013-T015).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ReactNode } from 'react';
import type {
  ServicePackage,
  TechnologyType,
  AdminProductsCoverageApiResponse
} from '@/types/adminProducts';

// =============================================================================
// Test Configuration
// =============================================================================

const TEST_TIMEOUT = 15000; // 15 seconds for component rendering and interactions
const PERFORMANCE_THRESHOLD = 2000; // 2 seconds for total load time

// Test data representing real admin products (not MOCK_PACKAGES)
const mockRealProducts: ServicePackage[] = [
  {
    id: 'admin-prod-001',
    name: '100Mbps Business Fibre Premium',
    speed: '100Mbps',
    price: 999,
    originalPrice: 1299,
    installation: 0, // Free due to promotion
    router: 0, // Free due to promotion
    provider: 'CircleTel',
    technology: 'FIBRE',
    contract: 24,
    features: [
      'Symmetric Upload/Download',
      'Static IP Included',
      '99.9% SLA Guarantee',
      '24/7 Priority Support'
    ],
    isRecommended: true,
    available: true,
    promotionalOffer: {
      freeInstallation: true,
      freeRouter: true,
      discountedPrice: 999,
      validUntil: '2025-12-31'
    }
  },
  {
    id: 'admin-prod-002',
    name: '50Mbps Fixed Wireless Business',
    speed: '50Mbps',
    price: 799,
    installation: 1200,
    router: 600,
    provider: 'CircleTel',
    technology: 'FIXED_WIRELESS',
    contract: 12,
    features: [
      'Quick Installation',
      'Weather Resistant Equipment',
      'Backup Power Supply'
    ],
    isRecommended: false,
    available: true
  },
  {
    id: 'admin-prod-003',
    name: '200Mbps LTE Business',
    speed: '200Mbps',
    price: 1599,
    installation: 500,
    router: 800,
    provider: 'CircleTel',
    technology: 'LTE',
    contract: 36,
    features: [
      'High-Speed Mobile Data',
      'Nationwide Coverage',
      'Unlimited Data'
    ],
    isRecommended: false,
    available: true
  }
];

// Mock API response
const mockApiResponse: AdminProductsCoverageApiResponse = {
  success: true,
  data: mockRealProducts,
  meta: {
    count: 3,
    technologies: ['FIBRE', 'FIXED_WIRELESS', 'LTE']
  }
};

// =============================================================================
// Test Utilities and Setup
// =============================================================================

/**
 * Create test wrapper with providers
 */
function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, cacheTime: 0 },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

/**
 * Mock fetch for API calls
 */
const mockFetch = vi.fn();
global.fetch = mockFetch;

/**
 * Mock geolocation API
 */
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn()
};
Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true
});

/**
 * Mock Google Maps API
 */
const mockGoogleMaps = {
  Map: vi.fn().mockImplementation(() => ({
    setCenter: vi.fn(),
    setZoom: vi.fn(),
    addListener: vi.fn()
  })),
  places: {
    Autocomplete: vi.fn().mockImplementation(() => ({
      getPlace: vi.fn().mockReturnValue({
        formatted_address: 'Test Address, Johannesburg',
        geometry: { location: { lat: () => -26.2041, lng: () => 28.0473 } }
      }),
      addListener: vi.fn()
    }))
  }
};
(global as any).google = { maps: mockGoogleMaps };

// =============================================================================
// MOCK_PACKAGES Removal Tests
// =============================================================================

describe('EnhancedCoverageCheck - MOCK_PACKAGES Removal', () => {
  const TestWrapper = createTestWrapper();

  beforeEach(() => {
    mockFetch.mockClear();
    vi.clearAllMocks();
  });

  it('should not display any MOCK_PACKAGES data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    render(
      <TestWrapper>
        <EnhancedCoverageCheck />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.queryByText(/mock/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/package/i)).not.toBeInTheDocument();
    });

    // Ensure no hardcoded mock data is present
    expect(screen.queryByText('Basic Package')).not.toBeInTheDocument();
    expect(screen.queryByText('Premium Package')).not.toBeInTheDocument();
    expect(screen.queryByText('Enterprise Package')).not.toBeInTheDocument();
  }, TEST_TIMEOUT);

  it('should display real admin products instead of mock data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    render(
      <TestWrapper>
        <EnhancedCoverageCheck />
      </TestWrapper>
    );

    // Search for address to trigger product loading
    const addressInput = await screen.findByPlaceholderText(/enter your address/i);
    await userEvent.type(addressInput, 'Test Address, Johannesburg');

    const checkButton = screen.getByRole('button', { name: /check coverage/i });
    await userEvent.click(checkButton);

    // Wait for real products to be displayed
    await waitFor(() => {
      expect(screen.getByText('100Mbps Business Fibre Premium')).toBeInTheDocument();
      expect(screen.getByText('50Mbps Fixed Wireless Business')).toBeInTheDocument();
      expect(screen.getByText('200Mbps LTE Business')).toBeInTheDocument();
    });

    // Verify these are real products with admin IDs
    expect(screen.getByText(/admin-prod-001/)).toBeInTheDocument();
    expect(screen.getByText(/admin-prod-002/)).toBeInTheDocument();
    expect(screen.getByText(/admin-prod-003/)).toBeInTheDocument();
  }, TEST_TIMEOUT);

  it('should completely remove MOCK_PACKAGES constants from component code', async () => {
    // This test will validate that MOCK_PACKAGES is not imported or used
    // by checking the component behavior and ensuring it fails without real API data

    mockFetch.mockRejectedValueOnce(new Error('API unavailable'));

    render(
      <TestWrapper>
        <EnhancedCoverageCheck />
      </TestWrapper>
    );

    const addressInput = await screen.findByPlaceholderText(/enter your address/i);
    await userEvent.type(addressInput, 'Test Address, Johannesburg');

    const checkButton = screen.getByRole('button', { name: /check coverage/i });
    await userEvent.click(checkButton);

    // Should show error or loading state, not fall back to mock data
    await waitFor(() => {
      const mockPackageText = screen.queryByText(/basic package|premium package|enterprise package/i);
      expect(mockPackageText).not.toBeInTheDocument();
    });

    // Should show appropriate error handling
    expect(screen.getByText(/error loading products|no products available/i)).toBeInTheDocument();
  }, TEST_TIMEOUT);

});

// =============================================================================
// Real Products Integration Tests
// =============================================================================

describe('EnhancedCoverageCheck - Real Products Integration', () => {
  const TestWrapper = createTestWrapper();

  beforeEach(() => {
    mockFetch.mockClear();
    vi.clearAllMocks();
  });

  it('should integrate with useAdminProducts hook correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    render(
      <TestWrapper>
        <EnhancedCoverageCheck />
      </TestWrapper>
    );

    // Trigger coverage check
    const addressInput = await screen.findByPlaceholderText(/enter your address/i);
    await userEvent.type(addressInput, 'Test Address, Johannesburg');

    const checkButton = screen.getByRole('button', { name: /check coverage/i });
    await userEvent.click(checkButton);

    // Verify API call was made
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/admin-products-coverage'),
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    // Verify products are displayed
    await waitFor(() => {
      expect(screen.getByText('100Mbps Business Fibre Premium')).toBeInTheDocument();
    });
  }, TEST_TIMEOUT);

  it('should handle technology filtering correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockRealProducts.filter(p => p.technology === 'FIBRE'),
        meta: { count: 1, technologies: ['FIBRE'] }
      })
    });

    render(
      <TestWrapper>
        <EnhancedCoverageCheck />
      </TestWrapper>
    );

    // Select only FIBRE technology (assuming there's a filter UI)
    const fibreFilter = await screen.findByRole('checkbox', { name: /fibre/i });
    await userEvent.click(fibreFilter);

    // Trigger coverage check
    const addressInput = screen.getByPlaceholderText(/enter your address/i);
    await userEvent.type(addressInput, 'Test Address, Johannesburg');

    const checkButton = screen.getByRole('button', { name: /check coverage/i });
    await userEvent.click(checkButton);

    // Verify only FIBRE products are shown
    await waitFor(() => {
      expect(screen.getByText('100Mbps Business Fibre Premium')).toBeInTheDocument();
      expect(screen.queryByText('50Mbps Fixed Wireless Business')).not.toBeInTheDocument();
      expect(screen.queryByText('200Mbps LTE Business')).not.toBeInTheDocument();
    });
  }, TEST_TIMEOUT);

  it('should maintain UI patterns and component structure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    render(
      <TestWrapper>
        <EnhancedCoverageCheck />
      </TestWrapper>
    );

    // Verify core UI elements exist
    expect(screen.getByPlaceholderText(/enter your address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /check coverage/i })).toBeInTheDocument();

    // Verify address input works
    const addressInput = screen.getByPlaceholderText(/enter your address/i);
    await userEvent.type(addressInput, 'Test Address');
    expect(addressInput).toHaveValue('Test Address');

    // Verify Google Maps integration (if present)
    const mapContainer = screen.queryByTestId('coverage-map');
    if (mapContainer) {
      expect(mapContainer).toBeInTheDocument();
    }
  }, TEST_TIMEOUT);

});

// =============================================================================
// Promotional Pricing Display Tests
// =============================================================================

describe('EnhancedCoverageCheck - Promotional Pricing Display', () => {
  const TestWrapper = createTestWrapper();

  beforeEach(() => {
    mockFetch.mockClear();
    vi.clearAllMocks();
  });

  it('should display promotional pricing correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    render(
      <TestWrapper>
        <EnhancedCoverageCheck />
      </TestWrapper>
    );

    // Trigger coverage check
    const addressInput = await screen.findByPlaceholderText(/enter your address/i);
    await userEvent.type(addressInput, 'Test Address, Johannesburg');

    const checkButton = screen.getByRole('button', { name: /check coverage/i });
    await userEvent.click(checkButton);

    // Wait for products with promotional pricing
    await waitFor(() => {
      // Should show discounted price
      expect(screen.getByText('R999')).toBeInTheDocument();

      // Should show original price crossed out
      expect(screen.getByText('R1,299')).toBeInTheDocument();

      // Should show promotional badges
      expect(screen.getByText(/free installation/i)).toBeInTheDocument();
      expect(screen.getByText(/free router/i)).toBeInTheDocument();
    });
  }, TEST_TIMEOUT);

  it('should highlight promotional offers visually', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    render(
      <TestWrapper>
        <EnhancedCoverageCheck />
      </TestWrapper>
    );

    const addressInput = await screen.findByPlaceholderText(/enter your address/i);
    await userEvent.type(addressInput, 'Test Address, Johannesburg');

    const checkButton = screen.getByRole('button', { name: /check coverage/i });
    await userEvent.click(checkButton);

    await waitFor(() => {
      // Look for promotional styling indicators
      const promoCard = screen.getByTestId('product-card-admin-prod-001');
      expect(promoCard).toHaveClass(/promotion|featured|highlighted/);

      // Should show validity period
      expect(screen.getByText(/valid until.*2025-12-31/i)).toBeInTheDocument();
    });
  }, TEST_TIMEOUT);

  it('should calculate total cost including promotional discounts', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    render(
      <TestWrapper>
        <EnhancedCoverageCheck />
      </TestWrapper>
    );

    const addressInput = await screen.findByPlaceholderText(/enter your address/i);
    await userEvent.type(addressInput, 'Test Address, Johannesburg');

    const checkButton = screen.getByRole('button', { name: /check coverage/i });
    await userEvent.click(checkButton);

    await waitFor(() => {
      // For the promotional product, total should be just the monthly cost
      // (R999/month + R0 installation + R0 router = R999 total first month)
      const promoProduct = screen.getByTestId('product-card-admin-prod-001');
      const totalCost = within(promoProduct).getByText(/total.*r999/i);
      expect(totalCost).toBeInTheDocument();

      // For non-promotional product, should show full cost
      const regularProduct = screen.getByTestId('product-card-admin-prod-002');
      const regularTotal = within(regularProduct).getByText(/total.*r2599/i); // R799 + R1200 + R600
      expect(regularTotal).toBeInTheDocument();
    });
  }, TEST_TIMEOUT);

});

// =============================================================================
// Loading States and Error Handling Tests
// =============================================================================

describe('EnhancedCoverageCheck - Loading States and Error Handling', () => {
  const TestWrapper = createTestWrapper();

  beforeEach(() => {
    mockFetch.mockClear();
    vi.clearAllMocks();
  });

  it('should show loading state while fetching products', async () => {
    // Simulate slow API response
    mockFetch.mockImplementationOnce(() =>
      new Promise(resolve =>
        setTimeout(() => resolve({
          ok: true,
          json: async () => mockApiResponse
        }), 1000)
      )
    );

    render(
      <TestWrapper>
        <EnhancedCoverageCheck />
      </TestWrapper>
    );

    const addressInput = await screen.findByPlaceholderText(/enter your address/i);
    await userEvent.type(addressInput, 'Test Address, Johannesburg');

    const checkButton = screen.getByRole('button', { name: /check coverage/i });
    await userEvent.click(checkButton);

    // Should show loading indicator
    expect(screen.getByText(/checking coverage|loading products/i)).toBeInTheDocument();

    // Loading should disappear after API responds
    await waitFor(() => {
      expect(screen.queryByText(/checking coverage|loading products/i)).not.toBeInTheDocument();
    }, 3000);
  }, TEST_TIMEOUT);

  it('should handle API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(
      <TestWrapper>
        <EnhancedCoverageCheck />
      </TestWrapper>
    );

    const addressInput = await screen.findByPlaceholderText(/enter your address/i);
    await userEvent.type(addressInput, 'Test Address, Johannesburg');

    const checkButton = screen.getByRole('button', { name: /check coverage/i });
    await userEvent.click(checkButton);

    // Should show user-friendly error message
    await waitFor(() => {
      expect(screen.getByText(/unable to load products|error checking coverage/i)).toBeInTheDocument();
    });

    // Should offer retry option
    expect(screen.getByRole('button', { name: /try again|retry/i })).toBeInTheDocument();
  }, TEST_TIMEOUT);

  it('should handle empty results appropriately', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        meta: { count: 0, technologies: [] }
      })
    });

    render(
      <TestWrapper>
        <EnhancedCoverageCheck />
      </TestWrapper>
    );

    const addressInput = await screen.findByPlaceholderText(/enter your address/i);
    await userEvent.type(addressInput, 'Test Address, Johannesburg');

    const checkButton = screen.getByRole('button', { name: /check coverage/i });
    await userEvent.click(checkButton);

    // Should show appropriate empty state message
    await waitFor(() => {
      expect(screen.getByText(/no products available|no coverage found/i)).toBeInTheDocument();
    });
  }, TEST_TIMEOUT);

});

// =============================================================================
// Performance Requirements Tests
// =============================================================================

describe('EnhancedCoverageCheck - Performance Requirements', () => {
  const TestWrapper = createTestWrapper();

  beforeEach(() => {
    mockFetch.mockClear();
    vi.clearAllMocks();
  });

  it('should load products within 2 seconds', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    const startTime = performance.now();

    render(
      <TestWrapper>
        <EnhancedCoverageCheck />
      </TestWrapper>
    );

    const addressInput = await screen.findByPlaceholderText(/enter your address/i);
    await userEvent.type(addressInput, 'Test Address, Johannesburg');

    const checkButton = screen.getByRole('button', { name: /check coverage/i });
    await userEvent.click(checkButton);

    // Wait for products to be displayed
    await waitFor(() => {
      expect(screen.getByText('100Mbps Business Fibre Premium')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const loadTime = endTime - startTime;

    expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLD);
  }, TEST_TIMEOUT);

  it('should handle rapid successive searches efficiently', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse
    });

    render(
      <TestWrapper>
        <EnhancedCoverageCheck />
      </TestWrapper>
    );

    const addressInput = await screen.findByPlaceholderText(/enter your address/i);
    const checkButton = screen.getByRole('button', { name: /check coverage/i });

    // Perform multiple rapid searches
    for (let i = 0; i < 3; i++) {
      await userEvent.clear(addressInput);
      await userEvent.type(addressInput, `Test Address ${i}`);
      await userEvent.click(checkButton);

      // Small delay between searches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Should handle all searches without breaking
    await waitFor(() => {
      expect(screen.getByText('100Mbps Business Fibre Premium')).toBeInTheDocument();
    });

    // Should optimize API calls (e.g., through debouncing or caching)
    expect(mockFetch).toHaveBeenCalledTimes(1); // Should optimize to single call
  }, TEST_TIMEOUT);

});

// =============================================================================
// Mock Component Implementation (Will be replaced in T013-T015)
// =============================================================================

/**
 * Mock EnhancedCoverageCheck component
 * This will be replaced with the actual implementation in T013
 */
function EnhancedCoverageCheck() {
  // Mock implementation that will fail initially
  throw new Error('EnhancedCoverageCheck component not updated yet - this is expected in TDD approach');
}

// =============================================================================
// Custom Test Utilities
// =============================================================================

/**
 * Custom assertion for performance testing
 */
expect.extend({
  toLoadWithinTimeLimit(received: number, limit: number) {
    const pass = received <= limit;
    return {
      pass,
      message: () =>
        pass
          ? `expected load time ${received}ms not to be within ${limit}ms limit`
          : `expected load time ${received}ms to be within ${limit}ms limit`
    };
  }
});

export {};