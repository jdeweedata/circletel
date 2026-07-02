/**
 * Tests for debit-batch-alert
 *
 * Covers: recipient resolution (defaults, env override, garbage fallback),
 * email payload construction, and non-throwing failure paths.
 */

import {
  resolveAlertRecipients,
  sendBatchAuthorisationAlert,
  type BatchAuthorisationAlertDetails,
} from '../debit-batch-alert';

const DETAILS: BatchAuthorisationAlertDetails = {
  batchType: 'bank_debit_order',
  batchName: 'CircleTel-2026-07-03-1751500000000',
  fileToken: 'FT-12345',
  itemCount: 9,
  totalAmount: 4050,
  actionDate: '2026-07-03',
  loadReportStatus: 'SUCCESSFUL',
};

describe('resolveAlertRecipients', () => {
  test('returns the three default recipients when env is unset', () => {
    expect(resolveAlertRecipients(undefined)).toEqual([
      'jeffrey.de.wee@circletel.co.za',
      'jeffrey@newgengroup.co.za',
      'finance@circletel.co.za',
    ]);
  });

  test('parses a comma-separated override, trimming whitespace', () => {
    expect(resolveAlertRecipients(' a@x.co.za , b@y.co.za ')).toEqual([
      'a@x.co.za',
      'b@y.co.za',
    ]);
  });

  test('falls back to defaults when the override contains no valid addresses', () => {
    expect(resolveAlertRecipients(' , not-an-email, ')).toEqual([
      'jeffrey.de.wee@circletel.co.za',
      'jeffrey@newgengroup.co.za',
      'finance@circletel.co.za',
    ]);
  });
});

describe('sendBatchAuthorisationAlert', () => {
  const originalEnv = process.env;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    process.env = { ...originalEnv, RESEND_API_KEY: 'test-key' };
    delete process.env.DEBIT_BATCH_ALERT_EMAILS;
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'email-id-1' }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  test('sends one Resend email to the default recipients with correct sender and subject', async () => {
    const result = await sendBatchAuthorisationAlert(DETAILS);

    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    const body = JSON.parse(init.body);
    expect(body.from).toBe('CircleTel Billing <billing@notify.circletel.co.za>');
    expect(body.to).toEqual([
      'jeffrey.de.wee@circletel.co.za',
      'jeffrey@newgengroup.co.za',
      'finance@circletel.co.za',
    ]);
    expect(body.subject).toContain('Action required');
    expect(body.subject).toContain('CircleTel-2026-07-03-1751500000000');
    expect(body.subject).toContain('9 items');
    expect(body.tags).toEqual([{ name: 'type', value: 'debit-batch-auth-alert' }]);
  });

  test('body contains action date, file token, total, and load report status', async () => {
    await sendBatchAuthorisationAlert(DETAILS);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.html).toContain('2026-07-03');
    expect(body.html).toContain('FT-12345');
    expect(body.html).toContain('4,050.00');
    expect(body.html).toContain('SUCCESSFUL');
  });

  test('includes the failure reason for credit-card batches', async () => {
    await sendBatchAuthorisationAlert({
      ...DETAILS,
      batchType: 'credit_card',
      loadReportStatus: undefined,
      reason: 'Auto-authorisation failed: error 322',
    });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.html).toContain('Auto-authorisation failed: error 322');
    expect(body.html).toContain('Credit card');
  });

  test('respects DEBIT_BATCH_ALERT_EMAILS override', async () => {
    process.env.DEBIT_BATCH_ALERT_EMAILS = 'ops@circletel.co.za';
    await sendBatchAuthorisationAlert(DETAILS);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.to).toEqual(['ops@circletel.co.za']);
  });

  test('returns failure without calling fetch when RESEND_API_KEY is missing', async () => {
    delete process.env.RESEND_API_KEY;
    const result = await sendBatchAuthorisationAlert(DETAILS);
    expect(result.success).toBe(false);
    expect(result.error).toContain('RESEND_API_KEY');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('returns failure (does not throw) on non-2xx response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ message: 'invalid recipient' }),
    });
    const result = await sendBatchAuthorisationAlert(DETAILS);
    expect(result.success).toBe(false);
    expect(result.error).toContain('invalid recipient');
  });

  test('returns failure (does not throw) when fetch rejects', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    const result = await sendBatchAuthorisationAlert(DETAILS);
    expect(result.success).toBe(false);
    expect(result.error).toContain('network down');
  });
});
