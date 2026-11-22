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
  assert.equal(existsSync('dist/flatbot'), false, 'Flatbot must remain on its existing origin');
  assert.equal(existsSync('dist/hub'), false, 'Hub must remain on its existing origin');
});

test('project and writing listings link to their detail pages', () => {
  const home = readFileSync('dist/index.html', 'utf8');
  const projects = readFileSync('dist/projects/index.html', 'utf8');
  const writing = readFileSync('dist/writing/index.html', 'utf8');

  assert.match(home, /href="\/projects\/ai-fund"/);
  assert.match(projects, /href="\/projects\/ai-fund"/);
  assert.match(writing, /href="\/writing\/first-note"/);
});

test('the homepage links to the public sites and the Quartz blog', () => {
  const home = readFileSync('dist/index.html', 'utf8');
  const writing = readFileSync('dist/writing/index.html', 'utf8');

  assert.match(home, /href="\/#websites"/);
  assert.match(home, /id="websites"/);
  assert.match(home, /href="https:\/\/life\.patriksmid\.com\/"/);
  assert.match(home, /href="https:\/\/cfa\.patriksmid\.com\/"/);
  assert.match(home, /href="https:\/\/keydojo\.patriksmid\.com\/"/);
  assert.match(home, /href="https:\/\/code\.patriksmid\.com\/"/);
  assert.match(home, /ChatGPT sign-in required\./);
  assert.match(home, /href="https:\/\/songs\.patriksmid\.com\/"/);
  assert.match(home, /href="https:\/\/slovenia\.patriksmid\.com\/"/);
  assert.match(home, /href="https:\/\/vim\.patriksmid\.com\/"/);
  for (const page of [home, writing]) {
    assert.match(page, /href="https:\/\/blog\.patriksmid\.com\/"[^>]*>Blog/);
    assert.match(page, /href="https:\/\/blog\.patriksmid\.com\/"[^>]*>Explore the blog/);
    assert.doesNotMatch(page, /href="https:\/\/smrik\.github\.io\//);
    assert.match(page, /id="quartz-posts" hidden/);
  }
});
