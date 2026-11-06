// Local preview without `vercel dev`: static files + /api/projects.
// usage: VERCEL_TOKEN=xxx node dev-server.mjs   (PORT defaults to 5173)
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import handler from './api/projects.js';

const root = process.cwd();
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

http.createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path === '/api/projects') {
    res.status = c => (res.statusCode = c, res);
    res.json = b => (res.setHeader('Content-Type', 'application/json'), res.end(JSON.stringify(b)), res);
    return handler(req, res);
  }
  const file = normalize(join(root, path.endsWith('/') ? path + 'index.html' : path));
  if (!file.startsWith(root) || file.includes(`${root}\\api`) || file.includes(`${root}/api`)) return res.writeHead(403).end();
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(process.env.PORT || 5173, () => console.log(`http://localhost:${process.env.PORT || 5173}`));
