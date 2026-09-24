// Renders public/images/og-default.png (1200x630) for social sharing.
// Usage: node scripts/generate-og-image.mjs
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/images/og-default.png');

const html = `<!doctype html><html><head><style>
  *{box-sizing:border-box;margin:0}
  body{width:1200px;height:630px;font-family:Inter,"Segoe UI",system-ui,sans-serif;background:#020617;color:#fff;overflow:hidden;position:relative}
  .grid{position:absolute;inset:0;opacity:.08;background-image:linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px);background-size:56px 56px}
  .glow{position:absolute;width:620px;height:620px;border-radius:50%;background:#2563eb;filter:blur(140px);opacity:.45;top:-260px;right:-120px}
  .wrap{position:relative;padding:72px 80px;height:100%;display:flex;flex-direction:column}
  .brand{display:flex;align-items:center;gap:18px}
  .mono{width:60px;height:60px;border-radius:14px;background:#fff;color:#020617;display:flex;align-items:center;justify-content:center;font:600 24px ui-monospace,Menlo,monospace}
  .name{font-size:30px;font-weight:600}
  .role{font-size:20px;color:#7dd3fc;margin-top:4px}
  h1{font-size:84px;line-height:1.02;letter-spacing:-2.5px;font-weight:650;margin-top:64px}
  .pills{margin-top:auto;display:flex;gap:12px;flex-wrap:wrap}
  .pill{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05);border-radius:999px;padding:9px 16px;font-size:18px;color:#e2e8f0}
  .url{position:absolute;right:80px;top:84px;font-size:20px;color:#94a3b8}
</style></head><body><div class="grid"></div><div class="glow"></div>
<div class="wrap">
  <div class="brand"><div class="mono">NT</div><div><div class="name">Naqash Thaheem</div><div class="role">Technical Project Manager · AI Automation · UAE</div></div></div>
  <h1>Build. Automate.<br/>Optimize. Scale.</h1>
  <div class="pills">${['Project Management','AI & Automation','Technical SEO','CRM','QA Automation','SaaS'].map(p=>`<span class="pill">${p}</span>`).join('')}</div>
</div><div class="url">naqashthaheem.com</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.screenshot({ path: out, type: 'png' });
await browser.close();
console.log(`Wrote ${out}`);
