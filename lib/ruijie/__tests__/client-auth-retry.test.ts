/**
 * Ruijie reports an expired server-side session as HTTP 200 + {"code":3,"msg":"Login timeout"}.
 * On 2026-08-02 this was treated as a valid "no groups" response: the sync fetched
 * 0 devices and pruned all 22 cached rows. These tests pin the recovery behaviour:
 * re-authenticate and retry once on code 3, and never prune with an empty keep-set.
 */

const AUTH_OK = {
  code: 0,
  msg: 'OK.',
  accessToken: '',
  refreshToken: '',
};

const GROUP_TREE_OK = {
  code: 0,
  msg: 'OK.',
  groupTree: {
    id: 0,
    name: 'dumy',
    children: [
      { id: 111, name: 'Unjani' },
      { id: 222, name: 'Consumer' },
    ],
  },
};

const LOGIN_TIMEOUT = { code: 3, msg: 'Login timeout' };

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('ruijieFetch auth recovery (via getAllGroups)', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    process.env.RUIJIE_APP_ID = 'test-app-id';
    process.env.RUIJIE_SECRET = 'test-secret';
    process.env.RUIJIE_MOCK_MODE = 'false';
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('re-authenticates and retries once when the API returns code 3 (Login timeout)', async () => {
    let tokenCounter = 0;
    fetchMock.mockImplementation(async (input: string | URL) => {
      const url = String(input);
      if (url.includes('/oauth20/client/access_token')) {
        tokenCounter += 1;
        return jsonResponse({ ...AUTH_OK, accessToken: `token-${tokenCounter}` });
      }
      if (url.includes('/maint/groups')) {
        // First groups call carries the stale token — expire it server-side.
        if (url.includes('access_token=token-1')) {
          return jsonResponse(LOGIN_TIMEOUT);
        }
        return jsonResponse(GROUP_TREE_OK);
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    const { getAllGroups } = await import('../client');
    const groups = await getAllGroups();

    expect(groups).toEqual([111, 222]);
    // auth, groups(code 3), re-auth, groups(ok)
    expect(fetchMock).toHaveBeenCalledTimes(4);
    const lastUrl = String(fetchMock.mock.calls[3][0]);
    expect(lastUrl).toContain('access_token=token-2');
  });

  it('does not retry forever when re-authentication still yields Login timeout', async () => {
    let tokenCounter = 0;
    fetchMock.mockImplementation(async (input: string | URL) => {
      const url = String(input);
      if (url.includes('/oauth20/client/access_token')) {
        tokenCounter += 1;
        return jsonResponse({ ...AUTH_OK, accessToken: `token-${tokenCounter}` });
      }
      return jsonResponse(LOGIN_TIMEOUT);
    });

    const { getAllGroups } = await import('../client');
    // getAllGroups swallows the thrown error and returns [] — the sync-level
    // zero-fetch guard is what protects the cache in this case.
    const groups = await getAllGroups();

    expect(groups).toEqual([]);
    // auth, groups(code 3), re-auth, groups(code 3) — then stop, no third attempt.
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});

describe('pruneDevicesNotInSet empty keep-set guard', () => {
  it('refuses to prune when the keep-set is empty', async () => {
    jest.resetModules();
    // createClient must never be reached — a DB call here would mean the guard failed.
    jest.doMock('@/lib/supabase/server', () => ({
      createClient: jest.fn(() => {
        throw new Error('createClient should not be called for an empty keep-set');
      }),
    }));

    const { pruneDevicesNotInSet } = await import('../sync-service');
    const result = await pruneDevicesNotInSet([]);

    expect(result).toEqual({ deleted: 0, deletedSns: [] });
  });
});
