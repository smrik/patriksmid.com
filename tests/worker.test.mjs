import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import worker from '../worker/index.js';

test('app requests reach the existing origin unchanged', async (t) => {
  for (const path of ['/flatbot', '/flatbot/', '/flatbot/api/status', '/flatbot//', '/hub', '/hub/', '/hub/api/tasks']) {
    await t.test(path, async (t) => {
      const request = new Request(`https://patriksmid.com${path}?filter=a%2Bb&limit=2`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-request-id': 'test-request' },
        body: '{"action":"test"}',
      });
      const originResponse = new Response('origin response', { status: 202, headers: { 'x-origin': 'preserved' } });
      t.mock.method(globalThis, 'fetch', async (forwarded) => {
        assert.equal(forwarded, request);
        assert.equal(new URL(forwarded.url).search, '?filter=a%2Bb&limit=2');
        assert.equal(forwarded.method, 'POST');
        assert.equal(forwarded.headers.get('x-request-id'), 'test-request');
        assert.equal(await forwarded.text(), '{"action":"test"}');
        return originResponse;
      });
      const response = await worker.fetch(request, {
        ASSETS: { fetch: () => assert.fail('app requests must not use static assets') },
      });
      assert.equal(response, originResponse);
      assert.equal(response.status, 202);
      assert.equal(response.headers.get('x-origin'), 'preserved');
      assert.equal(await response.text(), 'origin response');
    });
  }
});

test('all other paths use static assets, including similar names', async (t) => {
  for (const path of ['/', '/about', '/flatbot-other', '/hubris', '/nested/flatbot', '/Flatbot', '/flatbot%2Fapi/status']) {
    await t.test(path, async (t) => {
      t.mock.method(globalThis, 'fetch', () => assert.fail('static requests must not reach the origin'));
      const request = new Request(`https://patriksmid.com${path}?source=test`);
      const assetResponse = new Response('static response');
      const response = await worker.fetch(request, {
        ASSETS: { fetch: (forwarded) => {
          assert.equal(forwarded, request);
          return assetResponse;
        } },
      });
      assert.equal(response, assetResponse);
    });
  }
});

test('www redirects every path to the main domain without fetching content', async (t) => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('www must not reach the origin'));
  for (const path of ['/', '/projects/ai-fund', '/flatbot/api/status', '/hub/', '/a%20b']) {
    const response = await worker.fetch(new Request(`http://www.patriksmid.com${path}?filter=a%2Bb&limit=2`), {
      ASSETS: { fetch: () => assert.fail('www must not serve static assets') },
    });
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('location'), `https://patriksmid.com${path}?filter=a%2Bb&limit=2`);
  }
});

test('route configuration preserves the origin and runs redirects before assets', () => {
  const config = JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
  assert.deepEqual(config.routes, [
    { pattern: 'patriksmid.com/*', zone_name: 'patriksmid.com' },
    { pattern: 'www.patriksmid.com/*', zone_name: 'patriksmid.com' },
  ]);
  assert.equal(config.workers_dev, false);
  assert.equal(config.preview_urls, false);
  assert.equal(config.assets.binding, 'ASSETS');
  assert.equal(config.assets.run_worker_first, true);
});
