/**
 * Zoho Books Cashbook Service
 *
 * Pulls bank transaction data from Zoho Books for EFT payment reconciliation.
 * The financial accountant records EFT deposits in the Standard Bank cashbook in Zoho Books.
 * This service fetches those deposits so the reconciliation system can match them to customer invoices.
 *
 * API: GET /bankaccounts/{account_id}/transactions
 * Docs: https://www.zoho.com/books/api/v3/bank-transactions/
 */

import { ZohoBooksClient } from './books-api-client';
import { zohoLogger } from '@/lib/logging';

// ============================================================================
// Types
// ============================================================================

export interface ZohoCashbookTransaction {
  transaction_id: string;
  date: string;
  amount: number;
  transaction_type: string; // 'deposit', 'withdrawal', 'transfer', etc.
  reference_number?: string;
  description?: string;
  payee?: string;
  status: string;
  source?: string;
  imported_transaction_id?: string;
  categorized_transaction_id?: string;
}

export interface CashbookDepositRecord {
  transactionId: string;
  date: string;
  amount: number;
  reference: string;
  payerName: string;
  description: string;
  rawData: Record<string, unknown>;
}

export interface CashbookPullResult {
  deposits: CashbookDepositRecord[];
  pullDate: string;
  dateRange: { from: string; to: string };
  totalCount: number;
  totalAmount: number;
}

// ============================================================================
// Service
// ============================================================================

class ZohoCashbookService {
  private client: ZohoBooksClient | null = null;
  private bankAccountId: string | null = null;

  private getClient(): ZohoBooksClient {
    if (!this.client) {
      this.client = new ZohoBooksClient();
    }
    return this.client;
  }

  /**
   * Get or discover the Standard Bank account ID in Zoho Books.
   * Caches the result for the service lifetime.
   */
  async getBankAccountId(): Promise<string> {
    if (this.bankAccountId) return this.bankAccountId;

    const configuredId = process.env.ZOHO_BOOKS_BANK_ACCOUNT_ID;
    if (configuredId) {
      this.bankAccountId = configuredId;
      return configuredId;
    }

    // Auto-discover: list bank accounts and find Standard Bank
    const client = this.getClient();
    const response = await (client as any).request('/bankaccounts');

    const accounts = response.bankaccounts || [];
    const standardBank = accounts.find(
      (acc: any) =>
        acc.account_name?.toLowerCase().includes('standard bank') ||
        acc.bank_name?.toLowerCase().includes('standard bank')
    );

    if (!standardBank) {
      zohoLogger.error('[CashbookService] No Standard Bank account found in Zoho Books', {
        availableAccounts: accounts.map((a: any) => ({
          id: a.account_id,
          name: a.account_name,
          bank: a.bank_name,
        })),
      });
      throw new Error('Standard Bank account not found in Zoho Books. Set ZOHO_BOOKS_BANK_ACCOUNT_ID manually.');
    }

    this.bankAccountId = standardBank.account_id;
    zohoLogger.info('[CashbookService] Discovered Standard Bank account', {
      accountId: standardBank.account_id,
      accountName: standardBank.account_name,
    });

    return standardBank.account_id;
  }

  /**
   * Pull deposit (credit) transactions from the Standard Bank cashbook for a date range.
   *
   * @param fromDate - Start date (YYYY-MM-DD)
   * @param toDate - End date (YYYY-MM-DD)
   * @returns Normalized deposit records ready for reconciliation matching
   */
  async pullDeposits(fromDate: string, toDate: string): Promise<CashbookPullResult> {
    zohoLogger.info('[CashbookService] Pulling deposits', { fromDate, toDate });

    const client = this.getClient();
    const accountId = await this.getBankAccountId();

    const deposits: CashbookDepositRecord[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await (client as any).request(
        `/bankaccounts/${accountId}/transactions`,
        'GET',
        undefined,
        {
          date_start: fromDate,
          date_end: toDate,
          transaction_type: 'deposit',
          sort_column: 'date',
          sort_order: 'D',
          per_page: '200',
          page: String(page),
        }
      );

      const transactions: ZohoCashbookTransaction[] = response.banktransactions || response.transactions || [];

      for (const txn of transactions) {
        if (txn.amount <= 0) continue;

        deposits.push({
          transactionId: txn.transaction_id,
          date: txn.date,
          amount: txn.amount,
          reference: txn.reference_number || txn.description || '',
          payerName: txn.payee || '',
          description: txn.description || '',
          rawData: txn as unknown as Record<string, unknown>,
        });
      }

      const pageContext = response.page_context;
      if (pageContext && pageContext.has_more_page) {
        page++;
      } else {
        hasMore = false;
      }
    }

    const totalAmount = deposits.reduce((sum, d) => sum + d.amount, 0);

    zohoLogger.info('[CashbookService] Deposits pulled', {
      count: deposits.length,
      totalAmount,
      dateRange: { fromDate, toDate },
    });

    return {
      deposits,
      pullDate: new Date().toISOString(),
      dateRange: { from: fromDate, to: toDate },
      totalCount: deposits.length,
      totalAmount,
    };
  }

  /**
   * Pull yesterday's deposits (convenience for daily cron).
   */
  async pullYesterdayDeposits(): Promise<CashbookPullResult> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().slice(0, 10);
    return this.pullDeposits(dateStr, dateStr);
  }

  /**
   * Pull deposits for a full month (for monthly sweep).
   *
   * @param year - e.g., 2026
   * @param month - 1-12
   */
  async pullMonthDeposits(year: number, month: number): Promise<CashbookPullResult> {
    const fromDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const toDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return this.pullDeposits(fromDate, toDate);
  }

  /**
   * List available bank accounts (for admin configuration).
   */
  async listBankAccounts(): Promise<Array<{ id: string; name: string; bank: string; balance: number }>> {
    const client = this.getClient();
    const response = await (client as any).request('/bankaccounts');

    const accounts = response.bankaccounts || [];
    return accounts.map((acc: any) => ({
      id: acc.account_id,
      name: acc.account_name,
      bank: acc.bank_name || 'Unknown',
      balance: acc.balance || 0,
    }));
  }
}

// Singleton export
export const cashbookService = new ZohoCashbookService();
