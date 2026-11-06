// Vercel serverless function: lists your Vercel projects as "missions".
// Env: VERCEL_TOKEN (required), VERCEL_TEAM_ID (optional), HIDE_PROJECTS (comma list, optional),
//      GITHUB_TOKEN (optional, raises GitHub rate limit for repo descriptions).

const VERCEL = 'https://api.vercel.com';

export function productionUrl(p) {
  const alias = p.targets?.production?.alias?.[0] || p.alias?.[0]?.domain || p.latestDeployments?.[0]?.alias?.[0];
  return `https://${alias || `${p.name}.vercel.app`}`;
}

export function toMission(p, gh) {
  const repo = p.link?.type === 'github' ? `https://github.com/${p.link.org}/${p.link.repo}` : null;
  return {
    id: p.id,
    name: p.name,
    url: productionUrl(p),
    repo,
    framework: p.framework || 'static',
    description: gh?.description || null,
    language: gh?.language || null,
    stars: gh?.stargazers_count ?? null,
    topics: gh?.topics || [],
    updatedAt: p.targets?.production?.createdAt || p.updatedAt || p.createdAt,
  };
}

async function listProjects(token, teamId) {
  const all = [];
  let until = null;
  for (let page = 0; page < 5; page++) { // shortcut: caps at 500 projects, raise if you ever have more
    const q = new URLSearchParams({ limit: '100' });
    if (teamId) q.set('teamId', teamId);
    if (until) q.set('until', String(until));
    const r = await fetch(`${VERCEL}/v10/projects?${q}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error(`Vercel API ${r.status}`);
    const { projects = [], pagination } = await r.json();
    all.push(...projects);
    until = pagination?.next;
    if (!until) break;
  }
  return all;
}

async function githubInfo(link) {
  if (link?.type !== 'github') return null;
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'portfolio-missions' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const r = await fetch(`https://api.github.com/repos/${link.org}/${link.repo}`, { headers });
  return r.ok ? r.json() : null;
}

export default async function handler(req, res) {
  const token = process.env.VERCEL_TOKEN;
  if (!token) return res.status(503).json({ error: 'VERCEL_TOKEN not set' });
  try {
    const hide = new Set((process.env.HIDE_PROJECTS || '').split(',').map(s => s.trim()).filter(Boolean));
    const projects = (await listProjects(token, process.env.VERCEL_TEAM_ID)).filter(p => !hide.has(p.name));
    const gh = await Promise.allSettled(projects.map(p => githubInfo(p.link)));
    const missions = projects
      .map((p, i) => toMission(p, gh[i].status === 'fulfilled' ? gh[i].value : null))
      .sort((a, b) => b.updatedAt - a.updatedAt);
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ source: 'vercel', missions });
  } catch (e) {
    return res.status(502).json({ error: String(e.message || e) });
  }
}
