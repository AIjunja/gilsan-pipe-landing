const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const port = Number(process.env.PORT || 4177);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.gif':'image/gif','.woff2':'font/woff2'};
http.createServer((req, res) => {
  let requested;
  try { requested = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400); return res.end('Bad request'); }
  const file = path.resolve(root, '.' + (requested === '/' ? '/index.html' : requested));
  const relative = path.relative(root, file);
  if (relative.startsWith('..') || path.isAbsolute(relative) || relative.split(path.sep).some(part => ['docs','output'].includes(part)) || !['index.html','styles.css','motion.css','app.js','motion.js','assets'].includes(relative.split(path.sep)[0])) { res.writeHead(404); return res.end('Not found'); }
  fs.readFile(file, (error, body) => {
    if (error) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, {'Content-Type': types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(body);
  });
}).listen(port, '127.0.0.1', () => console.log(`GILSAN preview: http://127.0.0.1:${port}`));
