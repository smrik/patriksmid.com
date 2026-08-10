import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

test('build generates project and writing detail pages', () => {
  execSync('npm run build', { stdio: 'inherit' });

  assert.equal(
    existsSync('dist/projects/ai-fund/index.html'),
    true,
    'expected /projects/ai-fund to exist',
  );

  assert.equal(
    existsSync('dist/writing/first-note/index.html'),
    true,
    'expected /writing/first-note to exist',
  );
});

test('project and writing listings link to their detail pages', () => {
  const home = readFileSync('dist/index.html', 'utf8');
  const projects = readFileSync('dist/projects/index.html', 'utf8');
  const writing = readFileSync('dist/writing/index.html', 'utf8');

  assert.match(home, /href="\/projects\/ai-fund"/);
  assert.match(home, /href="\/writing\/first-note"/);
  assert.match(projects, /href="\/projects\/ai-fund"/);
  assert.match(writing, /href="\/writing\/first-note"/);
});