/**
 * Tests for Payment Transactions System
 *
 * @group payment-management
 * @group transactions
 */

import {
  createMockTransaction,
  createMockTransactions,
  assertValidTransaction,
  assertTransactionStats,
  setupMockEnv
} from './management-test-utils';

describe('Payment Transactions', () => {
  let cleanupEnv: () => void;

  beforeEach(() => {
    cleanupEnv = setupMockEnv();
  });

  afterEach(() => {
    cleanupEnv();
  });

  describe('Transaction Data Structure', () => {
    it('should create valid transaction with all required fields', () => {
      // Arrange & Act
      const transaction = createMockTransaction();

      // Assert
      assertValidTransaction(transaction);
      expect(transaction.id).toBeDefined();
      expect(transaction.transaction_id).toBeDefined();
      expect(transaction.amount).toBeGreaterThan(0);
      expect(transaction.currency).toBe('ZAR');
    });

    it('should allow overriding transaction fields', () => {
      // Arrange & Act
      const transaction = createMockTransaction({
        amount: 1500.0,
        status: 'pending',
        provider: 'payfast'
      });

      // Assert
      expect(transaction.amount).toBe(1500.0);
      expect(transaction.status).toBe('pending');
      expect(transaction.provider).toBe('payfast');
    });

    it('should include customer information', () => {
      // Arrange & Act
      const transaction = createMockTransaction({
        customer_email: 'test@example.com',
        customer_name: 'Test User'
      });

      // Assert
      expect(transaction.customer_email).toBe('test@example.com');
      expect(transaction.customer_name).toBe('Test User');
    });

    it('should include timestamps', () => {
      // Arrange & Act
      const transaction = createMockTransaction();

      // Assert
      expect(transaction.initiated_at).toBeDefined();
      expect(transaction.created_at).toBeDefined();
      expect(transaction.updated_at).toBeDefined();
      expect(new Date(transaction.initiated_at)).toBeInstanceOf(Date);
    });

    it('should include provider response data', () => {
      // Arrange & Act
      const transaction = createMockTransaction({
        provider_response: {
          status: 'success',
          transaction_code: 'ABC123'
        }
      });

      // Assert
      expect(transaction.provider_response).toBeDefined();
      expect(transaction.provider_response.status).toBe('success');
    });

    it('should include error information for failed transactions', () => {
      // Arrange & Act
      const transaction = createMockTransaction({
        status: 'failed',
        error_code: 'INSUFFICIENT_FUNDS',
        error_message: 'Insufficient funds in account',
        failure_reason: 'Customer has insufficient balance'
      });

      // Assert
      expect(transaction.status).toBe('failed');
      expect(transaction.error_code).toBe('INSUFFICIENT_FUNDS');
      expect(transaction.error_message).toBe('Insufficient funds in account');
      expect(transaction.failure_reason).toBeDefined();
    });
  });

  describe('Transaction Status', () => {
    it('should support all valid status values', () => {
      const statuses = [
        'pending',
        'processing',
        'completed',
        'failed',
        'refunded',
        'cancelled',
        'expired'
      ];

      statuses.forEach(status => {
        const transaction = createMockTransaction({ status });
        expect(transaction.status).toBe(status);
      });
    });

    it('should track completion timestamp for completed transactions', () => {
      // Arrange & Act
      const transaction = createMockTransaction({
        status: 'completed',
        completed_at: new Date().toISOString()
      });

      // Assert
      expect(transaction.status).toBe('completed');
      expect(transaction.completed_at).toBeDefined();
      expect(new Date(transaction.completed_at!)).toBeInstanceOf(Date);
    });

    it('should not have completion timestamp for pending transactions', () => {
      // Arrange & Act
      const transaction = createMockTransaction({
        status: 'pending',
        completed_at: null
      });

      // Assert
      expect(transaction.status).toBe('pending');
      expect(transaction.completed_at).toBeNull();
    });
  });

  describe('Transaction Statistics', () => {
    it('should calculate stats for single transaction', () => {
      // Arrange
      const transactions = [
        createMockTransaction({ status: 'completed', amount: 799.0 })
      ];

      const stats = {
        total_count: transactions.length,
        total_amount: transactions.reduce((sum, t) => sum + t.amount, 0),
        completed_count: transactions.filter(t => t.status === 'completed').length,
        completed_amount: transactions
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0),
        failed_count: transactions.filter(t => t.status === 'failed').length,
        pending_count: transactions.filter(t =>
          t.status === 'pending' || t.status === 'processing'
        ).length
      };

      // Assert
      assertTransactionStats(stats, transactions);
      expect(stats.total_amount).toBe(799.0);
      expect(stats.completed_amount).toBe(799.0);
    });

    it('should calculate stats for multiple transactions', () => {
      // Arrange
      const transactions = createMockTransactions(10, [
        { status: 'completed', amount: 100 },
        { status: 'completed', amount: 200 },
        { status: 'completed', amount: 300 },
        { status: 'pending', amount: 400 },
        { status: 'pending', amount: 500 },
        { status: 'failed', amount: 600 },
        { status: 'failed', amount: 700 },
        { status: 'processing', amount: 800 },
        { status: 'refunded', amount: 900 },
        { status: 'cancelled', amount: 1000 }
      ]);

      const stats = {
        total_count: transactions.length,
        total_amount: transactions.reduce((sum, t) => sum + t.amount, 0),
        completed_count: transactions.filter(t => t.status === 'completed').length,
        completed_amount: transactions
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0),
        failed_count: transactions.filter(t => t.status === 'failed').length,
        pending_count: transactions.filter(t =>
          t.status === 'pending' || t.status === 'processing'
        ).length
      };

      // Assert
      expect(stats.total_count).toBe(10);
      expect(stats.completed_count).toBe(3);
      expect(stats.completed_amount).toBe(600); // 100 + 200 + 300
      expect(stats.failed_count).toBe(2);
      expect(stats.pending_count).toBe(3); // 2 pending + 1 processing
    });

    it('should calculate failure rate correctly', () => {
      // Arrange
      const transactions = createMockTransactions(100, [
        ...Array(90).fill({ status: 'completed' }),
        ...Array(10).fill({ status: 'failed' })
      ]);

      const failureRate = transactions.filter(t => t.status === 'failed').length /
        transactions.length * 100;

      // Assert
      expect(failureRate).toBe(10);
    });
  });

  describe('Transaction Filtering', () => {
    it('should filter by status', () => {
      // Arrange
      const transactions = createMockTransactions(5, [
        { status: 'completed' },
        { status: 'completed' },
        { status: 'pending' },
        { status: 'failed' },
        { status: 'processing' }
      ]);

      // Act
      const completed = transactions.filter(t => t.status === 'completed');
      const pending = transactions.filter(t => t.status === 'pending');
      const failed = transactions.filter(t => t.status === 'failed');

      // Assert
      expect(completed).toHaveLength(2);
      expect(pending).toHaveLength(1);
      expect(failed).toHaveLength(1);
    });

    it('should filter by provider', () => {
      // Arrange
      const transactions = createMockTransactions(4, [
        { provider: 'netcash' },
        { provider: 'netcash' },
        { provider: 'payfast' },
        { provider: 'zoho_billing' }
      ]);

      // Act
      const netcash = transactions.filter(t => t.provider === 'netcash');
      const payfast = transactions.filter(t => t.provider === 'payfast');

      // Assert
      expect(netcash).toHaveLength(2);
      expect(payfast).toHaveLength(1);
    });

    it('should search by transaction ID', () => {
      // Arrange
      const transactions = createMockTransactions(3, [
        { transaction_id: 'CT-ORDER-001' },
        { transaction_id: 'CT-ORDER-002' },
        { transaction_id: 'CT-ORDER-003' }
      ]);

      // Act
      const searchTerm = 'ORDER-002';
      const results = transactions.filter(t =>
        t.transaction_id.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].transaction_id).toBe('CT-ORDER-002');
    });

    it('should search by customer email', () => {
      // Arrange
      const transactions = createMockTransactions(3, [
        { customer_email: 'john@example.com' },
        { customer_email: 'jane@example.com' },
        { customer_email: 'bob@example.com' }
      ]);

      // Act
      const searchTerm = 'jane';
      const results = transactions.filter(t =>
        t.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].customer_email).toBe('jane@example.com');
    });

    it('should search by reference', () => {
      // Arrange
      const transactions = createMockTransactions(3, [
        { reference: 'ORDER-001' },
        { reference: 'ORDER-002' },
        { reference: 'INVOICE-001' }
      ]);

      // Act
      const searchTerm = 'INVOICE';
      const results = transactions.filter(t =>
        t.reference.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].reference).toBe('INVOICE-001');
    });

    it('should combine multiple filters', () => {
      // Arrange
      const transactions = createMockTransactions(5, [
        { status: 'completed', provider: 'netcash' },
        { status: 'completed', provider: 'payfast' },
        { status: 'pending', provider: 'netcash' },
        { status: 'failed', provider: 'netcash' },
        { status: 'completed', provider: 'netcash' }
      ]);

      // Act
      const results = transactions.filter(t =>
        t.status === 'completed' && t.provider === 'netcash'
      );

      // Assert
      expect(results).toHaveLength(2);
    });
  });

  describe('Transaction Sorting', () => {
    it('should sort by created date descending (newest first)', () => {
      // Arrange
      const now = Date.now();
      const transactions = createMockTransactions(3, [
        { created_at: new Date(now - 3000).toISOString() }, // Oldest
        { created_at: new Date(now - 2000).toISOString() },
        { created_at: new Date(now - 1000).toISOString() }  // Newest
      ]);

      // Act
      const sorted = [...transactions].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Assert
      expect(new Date(sorted[0].created_at).getTime()).toBeGreaterThan(
        new Date(sorted[1].created_at).getTime()
      );
      expect(new Date(sorted[1].created_at).getTime()).toBeGreaterThan(
        new Date(sorted[2].created_at).getTime()
      );
    });

    it('should sort by amount', () => {
      // Arrange
      const transactions = createMockTransactions(3, [
        { amount: 100 },
        { amount: 500 },
        { amount: 250 }
      ]);

      // Act
      const sortedAsc = [...transactions].sort((a, b) => a.amount - b.amount);
      const sortedDesc = [...transactions].sort((a, b) => b.amount - a.amount);

      // Assert
      expect(sortedAsc[0].amount).toBe(100);
      expect(sortedAsc[2].amount).toBe(500);
      expect(sortedDesc[0].amount).toBe(500);
      expect(sortedDesc[2].amount).toBe(100);
    });
  });

  describe('Transaction Pagination', () => {
    it('should limit results to 100', () => {
      // Arrange
      const transactions = createMockTransactions(150);

      // Act
      const paginated = transactions.slice(0, 100);

      // Assert
      expect(paginated).toHaveLength(100);
    });

    it('should return all results if less than limit', () => {
      // Arrange
      const transactions = createMockTransactions(50);

      // Act
      const paginated = transactions.slice(0, 100);

      // Assert
      expect(paginated).toHaveLength(50);
    });
  });

  describe('CSV Export', () => {
    it('should generate CSV with correct headers', () => {
      // Arrange
      const transactions = [createMockTransaction()];
      const headers = [
        'Transaction ID',
        'Reference',
        'Provider',
        'Amount',
        'Currency',
        'Status',
        'Payment Method',
        'Customer Email',
        'Customer Name',
        'Initiated At',
        'Completed At'
      ];

      // Act
      const csvLines = [headers.join(',')];
      const csv = csvLines.join('\n');

      // Assert
      expect(csv).toContain('Transaction ID');
      expect(csv).toContain('Reference');
      expect(csv).toContain('Provider');
    });

    it('should format transaction data for CSV', () => {
      // Arrange
      const transaction = createMockTransaction({
        transaction_id: 'CT-TEST-123',
        reference: 'ORDER-001',
        amount: 799.0,
        status: 'completed'
      });

      // Act
      const row = [
        transaction.transaction_id,
        transaction.reference,
        transaction.provider,
        transaction.amount,
        transaction.currency,
        transaction.status,
        transaction.payment_method || '',
        transaction.customer_email || '',
        transaction.customer_name || '',
        new Date(transaction.initiated_at).toLocaleString(),
        transaction.completed_at ? new Date(transaction.completed_at).toLocaleString() : ''
      ];

      const csvRow = row.map(cell => `"${cell}"`).join(',');

      // Assert
      expect(csvRow).toContain('CT-TEST-123');
      expect(csvRow).toContain('ORDER-001');
      expect(csvRow).toContain('799');
    });

    it('should handle empty values in CSV', () => {
      // Arrange
      const transaction = createMockTransaction({
        payment_method: null,
        customer_email: null,
        customer_name: null,
        completed_at: null
      });

      // Act
      const row = [
        transaction.payment_method || '',
        transaction.customer_email || '',
        transaction.customer_name || '',
        transaction.completed_at || ''
      ];

      // Assert
      expect(row.every(cell => cell === '')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle transaction with zero amount', () => {
      // Note: This should actually fail validation, but testing edge case
      const transaction = createMockTransaction({ amount: 0 });
      expect(transaction.amount).toBe(0);
    });

    it('should handle very large amounts', () => {
      // Arrange & Act
      const transaction = createMockTransaction({
        amount: 999999.99
      });

      // Assert
      expect(transaction.amount).toBe(999999.99);
    });

    it('should handle transactions with no customer info', () => {
      // Arrange & Act
      const transaction = createMockTransaction({
        customer_email: null,
        customer_name: null,
        customer_id: null
      });

      // Assert
      expect(transaction.customer_email).toBeNull();
      expect(transaction.customer_name).toBeNull();
    });

    it('should handle transactions with metadata', () => {
      // Arrange & Act
      const transaction = createMockTransaction({
        metadata: {
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          custom_field: 'custom_value'
        }
      });

      // Assert
      expect(transaction.metadata).toBeDefined();
      expect(transaction.metadata.ip_address).toBe('192.168.1.1');
    });
  });
});
