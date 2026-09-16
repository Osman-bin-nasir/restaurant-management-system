import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const dineInFiles = [
  new URL('../src/pages/Admin/TableManagement.jsx', import.meta.url),
  new URL('../src/pages/Manager/TableManagement.jsx', import.meta.url),
];

test('admin and manager Dine-in lists only request the table data they render', async () => {
  for (const file of dineInFiles) {
    const source = await readFile(file, 'utf8');
    const getCalls = source.match(/axios\.get\(/g) || [];

    assert.equal(getCalls.length, 1, `${file.pathname} should make one GET request`);
    assert.match(source, /axios\.get\(['"]\/tables['"]\)/);
    assert.doesNotMatch(source, /axios\.get\(['"]\/(menu|orders)/);
  }
});

test('Dine-in lists render an explicit empty state', async () => {
  for (const file of dineInFiles) {
    const source = await readFile(file, 'utf8');
    assert.match(source, /No tables found/);
  }
});
