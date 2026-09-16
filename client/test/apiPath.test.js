import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeApiPath } from '../src/api/normalizeApiPath.js';

test('removes trailing slashes from API paths', () => {
  assert.equal(normalizeApiPath('/tables/'), '/tables');
  assert.equal(normalizeApiPath('/menu/?available=true'), '/menu?available=true');
  assert.equal(normalizeApiPath('/orders/#recent'), '/orders#recent');
});

test('preserves the API root and absolute URLs', () => {
  assert.equal(normalizeApiPath('/'), '/');
  assert.equal(
    normalizeApiPath('https://example.com/api/tables/'),
    'https://example.com/api/tables/',
  );
});

test('leaves non-string request targets unchanged', () => {
  assert.equal(normalizeApiPath(undefined), undefined);
});
