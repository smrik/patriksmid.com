import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import { verifyDeployment } from '../ops/verify-deployment.mjs';

const sha = 'a'.repeat(40);

test('live verification retries stale, broken, failed, and unavailable receipts', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const responses = [
    new Response(JSON.stringify({ sha: 'b'.repeat(40) })),
    new Response('not JSON'),
    new Response(JSON.stringify({ sha }), { status: 503 }),
    new Error('network unavailable'),
    new Response(JSON.stringify({ sha })),
  ];
  let attempts = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(new URL(url).origin, 'https://patriksmid.com');
    assert.equal(new URL(url).searchParams.get('sha'), sha);
    assert.equal(options.headers['Cache-Control'], 'no-cache');
    assert.ok(options.signal instanceof AbortSignal);
    const response = responses[attempts++];
    if (response instanceof Error) throw response;
    return response;
  });
  const verified = verifyDeployment(sha);
  for (let retry = 0; retry < 4; retry++) {
    await setImmediate();
    t.mock.timers.tick(5000);
  }
  await verified;
  assert.equal(attempts, 5);
});

test('live verification fails after twelve attempts without a matching receipt', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const fetch = t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ sha: 'b'.repeat(40) })));
  const rejected = assert.rejects(verifyDeployment(sha), /The live site did not confirm/);
  for (let retry = 0; retry < 11; retry++) {
    await setImmediate();
    t.mock.timers.tick(5000);
  }
  await rejected;
  assert.equal(fetch.mock.callCount(), 12);
});

test('live verification rejects a missing commit before contacting the site', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', () => assert.fail('must not fetch'));
  await assert.rejects(verifyDeployment(), /GITHUB_SHA must be a full commit SHA/);
  assert.equal(fetch.mock.callCount(), 0);
});
