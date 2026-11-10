// Minimal HTTP wrapper around the MCP tool functions — powers the live demo.
// Zero runtime deps beyond the project itself; run after `npm run build`.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dispatchTool, TOOL_DEFINITIONS } from '../dist/server.js';

const PUBLIC_DIR = fileURLToPath(new URL('./public', import.meta.url));
const PORT = Number(process.env.PORT ?? 8000);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const VALID_TOOLS = new Set(TOOL_DEFINITIONS.map((t) => t.name));

function json(res, status, body) {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
    if (Buffer.concat(chunks).length > 64 * 1024) throw new Error('Body too large');
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

async function serveStatic(req, res, pathname) {
  const rel = pathname === '/' ? 'index.html' : pathname.slice(1);
  const filePath = normalize(join(PUBLIC_DIR, rel));
  if (!filePath.startsWith(normalize(PUBLIC_DIR))) {
    return json(res, 403, { error: 'Forbidden' });
  }
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    json(res, 404, { error: 'Not found' });
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  const { pathname } = url;

  try {
    if (req.method === 'GET' && pathname === '/api/health') {
      return json(res, 200, { status: 'ok', tools: [...VALID_TOOLS] });
    }

    if (req.method === 'GET' && pathname === '/api/tools') {
      return json(res, 200, { tools: TOOL_DEFINITIONS });
    }

    const toolMatch = /^\/api\/tools\/([a-z_]+)$/.exec(pathname);
    if (req.method === 'POST' && toolMatch) {
      const name = toolMatch[1];
      if (!VALID_TOOLS.has(name)) return json(res, 404, { error: `Unknown tool: ${name}` });
      const args = await readBody(req);
      try {
        return json(res, 200, { ok: true, result: dispatchTool(name, args) });
      } catch (error) {
        return json(res, 400, {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (req.method === 'GET' || req.method === 'HEAD') {
      return serveStatic(req, res, pathname);
    }

    json(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    json(res, 500, { error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(PORT, () => {
  console.log(`mcp-hr-knowledge-evals demo on http://localhost:${PORT}`);
});
