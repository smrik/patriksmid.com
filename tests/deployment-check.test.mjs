import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

test('deployment stops for missing connection or a mismatched build', (t) => {
  const cwd = mkdtempSync(join(tmpdir(), 'portfolio-deploy-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  mkdirSync(join(cwd, 'dist'));
  writeFileSync(join(cwd, 'dist/deployment.json'), JSON.stringify({ sha: 'a'.repeat(40) }));
  const env = {
    GITHUB_ACTIONS: 'true', GITHUB_REF: 'refs/heads/main',
    CLOUDFLARE_API_TOKEN: 'test-token', CLOUDFLARE_ACCOUNT_ID: 'b'.repeat(32), GITHUB_SHA: 'a'.repeat(40),
  };
  const run = (overrides) => spawnSync(process.execPath, [fileURLToPath(new URL('../ops/check-deployment.mjs', import.meta.url))], {
    cwd, env: { ...env, ...overrides }, encoding: 'utf8',
  });

  assert.equal(run({}).status, 0);
  for (const name of ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'GITHUB_SHA']) {
    const result = run({ [name]: '' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, new RegExp(`Cloud publish is not connected: set ${name}`));
  }
  const mismatch = run({ GITHUB_SHA: 'c'.repeat(40) });
  assert.notEqual(mismatch.status, 0);
  assert.match(mismatch.stderr, /receipt does not match/);
  assert.notEqual(run({ GITHUB_SHA: 'short-sha' }).status, 0);
  assert.notEqual(run({ CLOUDFLARE_ACCOUNT_ID: 'wrong-account' }).status, 0);
  assert.notEqual(run({ GITHUB_ACTIONS: '' }).status, 0);
  assert.notEqual(run({ GITHUB_REF: 'refs/heads/feature' }).status, 0);
});
