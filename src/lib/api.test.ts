import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError, toQueryString } from './api';

describe('toQueryString', () => {
  it('omits empty values and encodes the rest', () => {
    expect(toQueryString({ a: 'x y', b: '', c: undefined, d: null, e: 0, f: false })).toBe('?a=x+y&e=0&f=false');
  });

  it('returns an empty string when nothing remains', () => {
    expect(toQueryString({ a: '' })).toBe('');
    expect(toQueryString()).toBe('');
  });
});

describe('api client', () => {
  afterEach(() => vi.restoreAllMocks());

  it('sends credentials and JSON, and unwraps successful responses', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ data: { ok: true } }), { status: 200 }));
    await expect(api.post('/things', { name: 'x' })).resolves.toEqual({ data: { ok: true } });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/v1/things');
    expect(init).toMatchObject({ method: 'POST', credentials: 'include', body: '{"name":"x"}' });
  });

  it('turns error envelopes into ApiError with field issues', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: 'Some fields are invalid', details: [{ field: 'email', message: 'Invalid' }] } }),
        { status: 422 },
      ),
    );
    const err = await api.get('/x').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(422);
    expect((err as ApiError).fieldIssues).toEqual([{ field: 'email', message: 'Invalid' }]);
  });

  it('reports network failures with a friendly message', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(api.get('/x')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });
});
