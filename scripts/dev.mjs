/**
 * 知华科技（上海如静知华信息科技有限公司）
 * 官网：https://www.zhuatech.cn/
 * 商业授权、定制开发、部署与系统集成咨询微信：zhuatech / zhuatech2
 * 仅用于本机预览的静态文件服务。
 */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.PORT || 4174);
const allowed = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/core.js', ['core.js', 'text/javascript; charset=utf-8']],
  ['/logo.jpg', ['logo.jpg', 'image/jpeg']],
]);

http.createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
  const entry = allowed.get(pathname);
  if (!entry) {
    response.writeHead(404).end('Not found');
    return;
  }
  try {
    const body = await fs.readFile(path.join(root, entry[0]));
    response.writeHead(200, { 'Content-Type': entry[1], 'Cache-Control': 'no-store' });
    response.end(body);
  } catch {
    response.writeHead(500).end('Preview file unavailable');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`本机预览：http://127.0.0.1:${port}/`);
});
