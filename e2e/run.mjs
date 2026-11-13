// Runs every e2e/*.spec.mjs (optionally filtered by name) against `vite preview` of the current build.
import { readdirSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { preview } from 'vite';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = dirname(fileURLToPath(import.meta.url));
const filter = process.argv[2] ?? '';
mkdirSync(join(here, 'out'), { recursive: true });

const server = await preview({ preview: { port: 4173, strictPort: true }, logLevel: 'error' });
const baseUrl = 'http://localhost:4173';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const specs = readdirSync(here).filter((f) => f.endsWith('.spec.mjs') && f.includes(filter)).sort();
let failed = 0;
for (const file of specs) {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
  const errors = [];
  // the Google Fonts request is blocked in this sandbox; the game falls back to monospace
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_NAME|net::ERR/.test(m.text() + (m.location()?.url ?? ''))) errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  try {
    const spec = (await import(pathToFileURL(join(here, file)).href)).default;
    await spec(page, baseUrl);
    if (errors.length) throw new Error('console errors: ' + errors.join(' | '));
    console.log(`PASS ${file}`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${file}: ${e?.message ?? e}`);
  } finally {
    await page.close();
  }
}
await browser.close();
await server.close();
if (!specs.length) { console.log(`no specs match "${filter}"`); process.exit(1); }
process.exit(failed ? 1 : 0);
