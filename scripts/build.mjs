/**
 * 知华科技（上海如静知华信息科技有限公司）
 * 官网：https://www.zhuatech.cn/
 * 商业授权、定制开发、部署与系统集成咨询微信：zhuatech / zhuatech2
 * 将无依赖的静态网页复制到 dist。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'src');
const output = path.join(root, 'dist');
await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(output, { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'core.js', 'logo.jpg']) {
  await fs.copyFile(path.join(source, file), path.join(output, file));
}
console.log(`静态文件已生成：${output}`);
