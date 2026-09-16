import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

/** Loads the service worker in an isolated context and returns its fetch hook. */
const loadFetchHandler = async ({ match, networkFetch }) => {
  const listeners = new Map();
  const source = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
  const self = {
    location: { origin: 'https://resto.test' },
    clients: { claim: async () => undefined },
    skipWaiting: () => undefined,
    addEventListener: (name, listener) => listeners.set(name, listener),
  };

  vm.runInNewContext(source, {
    self,
    caches: {
      match,
      open: async () => ({ addAll: async () => undefined, put: async () => undefined }),
      keys: async () => [],
      delete: async () => true,
    },
    fetch: networkFetch,
    Response,
    URL,
  });

  return listeners.get('fetch');
};

test('offline navigation always resolves to a valid response without a cached shell', async () => {
  const handler = await loadFetchHandler({
    match: async () => undefined,
    networkFetch: async () => { throw new Error('offline'); },
  });
  let responsePromise;
  handler({
    request: { method: 'GET', mode: 'navigate', url: 'https://resto.test/admin' },
    respondWith: (promise) => { responsePromise = promise; },
  });

  const response = await responsePromise;
  assert.equal(response.status, 503);
  assert.equal(await response.text(), 'Offline');
});

test('offline navigation survives Cache Storage access failures', async () => {
  const handler = await loadFetchHandler({
    match: async () => { throw new Error('storage unavailable'); },
    networkFetch: async () => { throw new Error('offline'); },
  });
  let responsePromise;
  handler({
    request: { method: 'GET', mode: 'navigate', url: 'https://resto.test/kitchen' },
    respondWith: (promise) => { responsePromise = promise; },
  });

  assert.equal((await responsePromise).status, 503);
});
