import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createSessionCache,
  createCachedFetcher,
} from '../src/utils/sessionCache.js';

const createStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    key: (index) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    },
  };
};

test('returns persisted data while it is fresh and removes it after expiry', () => {
  let now = 1_000;
  const cache = createSessionCache({ storage: createStorage(), now: () => now });

  cache.set('auth:user', { id: '1', role: 'admin' }, 500);
  assert.deepEqual(cache.get('auth:user'), { id: '1', role: 'admin' });

  now = 1_501;
  assert.equal(cache.get('auth:user'), null);
});

test('deduplicates concurrent requests and reuses the cached response', async () => {
  const cache = createSessionCache({ storage: createStorage(), now: () => 1_000 });
  let requests = 0;
  const fetcher = createCachedFetcher({
    cache,
    fetch: async () => {
      requests += 1;
      return { data: { items: ['soup'] }, status: 200 };
    },
  });

  const [first, second] = await Promise.all([
    fetcher('/menu', { ttl: 5_000 }),
    fetcher('/menu', { ttl: 5_000 }),
  ]);

  assert.equal(requests, 1);
  assert.deepEqual(first.data, second.data);

  const cached = await fetcher('/menu', { ttl: 5_000 });
  assert.equal(requests, 1);
  assert.equal(cached.fromCache, true);
});

test('supports prefix invalidation after a mutation', () => {
  const storage = createStorage();
  const cache = createSessionCache({ storage, now: () => 1_000 });
  cache.set('http:/menu', { items: [] }, 5_000);
  cache.set('http:/menu?category=mains', { items: [] }, 5_000);
  cache.set('auth:user', { id: '1' }, 5_000);

  cache.removeByPrefix('http:/menu');

  assert.equal(cache.get('http:/menu'), null);
  assert.equal(cache.get('http:/menu?category=mains'), null);
  assert.deepEqual(cache.get('auth:user'), { id: '1' });
});
