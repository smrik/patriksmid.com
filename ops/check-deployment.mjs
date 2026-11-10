import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

assert.equal(process.env.GITHUB_ACTIONS, 'true', 'Publish through the main-branch GitHub workflow so it uses the tested build.');
assert.equal(process.env.GITHUB_REF, 'refs/heads/main', 'Publishing is limited to the main branch.');
for (const name of ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'GITHUB_SHA']) {
  assert.ok(process.env[name], `Cloud publish is not connected: set ${name}. Use the main-branch GitHub publish workflow.`);
}
assert.match(process.env.CLOUDFLARE_ACCOUNT_ID, /^[a-f0-9]{32}$/, 'CLOUDFLARE_ACCOUNT_ID must be the Cloudflare account ID.');
assert.match(process.env.GITHUB_SHA, /^[a-f0-9]{40}$/, 'GITHUB_SHA must be the full commit SHA.');
const receipt = JSON.parse(readFileSync('dist/deployment.json', 'utf8'));
assert.equal(receipt.sha, process.env.GITHUB_SHA, 'The built deployment receipt does not match this commit. Use the tested GitHub build artifact.');
