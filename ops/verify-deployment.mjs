import assert from 'node:assert/strict';
import timers from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

export async function verifyDeployment(expectedSha) {
  assert.match(expectedSha ?? '', /^[a-f0-9]{40}$/, 'GITHUB_SHA must be a full commit SHA');
  for (let attempt = 1; attempt <= 12; attempt++) {
    try {
      const response = await fetch(`https://patriksmid.com/deployment.json?sha=${expectedSha}&attempt=${attempt}`, {
        headers: { 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(5000),
      });
      assert.equal(response.status, 200, 'The deployment receipt must return HTTP 200');
      assert.equal((await response.json()).sha, expectedSha, 'The live commit does not match');
      console.log(`Live deployment matches ${expectedSha}`);
      return;
    } catch (error) {
      if (attempt === 12) throw new Error(`The live site did not confirm ${expectedSha}: ${error.message}`);
      await timers.setTimeout(5000);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await verifyDeployment(process.env.GITHUB_SHA);
}
