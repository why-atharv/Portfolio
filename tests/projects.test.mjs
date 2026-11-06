// run: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { productionUrl, toMission } from '../api/projects.js';

test('productionUrl prefers production alias, falls back to name', () => {
  assert.equal(productionUrl({ name: 'x', targets: { production: { alias: ['x.dev'] } } }), 'https://x.dev');
  assert.equal(productionUrl({ name: 'x', alias: [{ domain: 'y.app' }] }), 'https://y.app');
  assert.equal(productionUrl({ name: 'x' }), 'https://x.vercel.app');
});

test('toMission maps github link + info', () => {
  const m = toMission({ id: '1', name: 'g', framework: 'vite', updatedAt: 5, link: { type: 'github', org: 'o', repo: 'r' } },
    { description: 'd', language: 'C#', stargazers_count: 3, topics: ['unity'] });
  assert.equal(m.repo, 'https://github.com/o/r');
  assert.equal(m.description, 'd');
  assert.equal(m.stars, 3);
  assert.equal(m.updatedAt, 5);
});

const mockRes = () => {
  const r = { code: 0, body: null, headers: {} };
  r.status = c => (r.code = c, r);
  r.json = b => (r.body = b, r);
  r.setHeader = (k, v) => (r.headers[k] = v);
  return r;
};

test('handler: 503 without token', async () => {
  delete process.env.VERCEL_TOKEN;
  const res = mockRes();
  await handler({}, res);
  assert.equal(res.code, 503);
});

test('handler: paginates, hides, sorts newest first', async () => {
  process.env.VERCEL_TOKEN = 't';
  process.env.HIDE_PROJECTS = 'portfolio';
  const pages = [
    { projects: [{ id: 'a', name: 'old', updatedAt: 1 }, { id: 'p', name: 'portfolio', updatedAt: 9 }], pagination: { next: 42 } },
    { projects: [{ id: 'b', name: 'new', updatedAt: 7 }], pagination: { next: null } },
  ];
  const seen = [];
  globalThis.fetch = async url => {
    seen.push(url);
    return { ok: true, json: async () => pages.shift() };
  };
  const res = mockRes();
  await handler({}, res);
  assert.equal(res.code, 200);
  assert.deepEqual(res.body.missions.map(m => m.name), ['new', 'old']);
  assert.match(seen[1], /until=42/);
});
