import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const dashboardFiles = [
  new URL('../src/pages/Admin/Dashboard.jsx', import.meta.url),
  new URL('../src/pages/Manager/Dashboard.jsx', import.meta.url),
];

test('admin and manager dashboards use the consolidated summary request', async () => {
  for (const file of dashboardFiles) {
    const source = await readFile(file, 'utf8');
    const getCalls = source.match(/axios\.get\(/g) || [];

    assert.equal(getCalls.length, 1, `${file.pathname} should make one GET request`);
    assert.match(source, /axios\.get\(['"]\/dashboard\/summary['"]\)/);
    assert.doesNotMatch(source, /axios\.get\(['"]\/(orders|tables\/stats|parcel)['"]/);
  }
});
