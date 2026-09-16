import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { resolveApiConfig } from '../src/config/resolveApiConfig.js';

const renderApiUrl = 'https://restaurant-management-system-7r81.onrender.com/api';

test('production API requests use the same-origin proxy while sockets stay direct', () => {
  assert.deepEqual(
    resolveApiConfig({ configuredApiUrl: renderApiUrl, isProduction: true }),
    {
      apiUrl: '/api',
      socketUrl: 'https://restaurant-management-system-7r81.onrender.com',
    },
  );
});

test('development keeps using the configured backend directly', () => {
  assert.deepEqual(
    resolveApiConfig({ configuredApiUrl: 'http://localhost:3000/api', isProduction: false }),
    {
      apiUrl: 'http://localhost:3000/api',
      socketUrl: 'http://localhost:3000',
    },
  );
});

test('Vercel proxies API requests before its SPA fallback', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));

  assert.deepEqual(config.rewrites[0], {
    source: '/api/:path*',
    destination: 'https://restaurant-management-system-7r81.onrender.com/api/:path*',
  });
  assert.deepEqual(config.rewrites.at(-1), {
    source: '/(.*)',
    destination: '/index.html',
  });
});

test('login controls are contained in a semantic form', async () => {
  const source = await readFile(new URL('../src/pages/Shared/Login.jsx', import.meta.url), 'utf8');

  assert.match(source, /<form[^>]*onSubmit=\{handleSubmit\}/);
  assert.match(source, /<button\s+type="submit"/);
});
