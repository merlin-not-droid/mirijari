// GitHub Pages 배포본(out/)을 실제와 같은 하위 경로로 로컬에서 확인한다.
// 사용: PAGES_BASE_PATH=/저장소이름 node scripts/preview-pages.mjs  → http://localhost:4173/저장소이름/
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'out');
const base = (process.env.PAGES_BASE_PATH || '/myseat').replace(/\/$/, '');
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.txt': 'text/plain', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };

createServer(async (req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (!url.startsWith(base)) {
    res.writeHead(302, { location: base + '/' }).end();
    return;
  }
  let file = path.join(root, url.slice(base.length));
  if (!file.startsWith(root)) return res.writeHead(403).end();
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' }).end(await readFile(file));
  } catch {
    res.writeHead(404, { 'content-type': types['.html'] }).end(await readFile(path.join(root, '404.html')).catch(() => 'Not found'));
  }
}).listen(port, () => console.log(`GitHub Pages 미리보기: http://localhost:${port}${base}/`));
