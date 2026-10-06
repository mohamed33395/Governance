import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, 'output');
const BASE = 'http://localhost:3000';
const durations = JSON.parse(fs.readFileSync(path.join(OUT, 'durations.json'), 'utf8'));

fs.mkdirSync(path.join(OUT, 'chapters'), { recursive: true });

function holdFor(id) {
  return Math.round((durations[id] ?? 20) * 1000);
}

async function showCursor(page) {
  await page.evaluate(() => {
    let c = document.getElementById('rec-cursor');
    if (!c) {
      c = document.createElement('div');
      c.id = 'rec-cursor';
      c.style.cssText = [
        'position:fixed',
        'z-index:2147483647',
        'width:22px',
        'height:22px',
        'margin:0',
        'border-radius:50%',
        'border:2px solid #1A412E',
        'background:rgba(193,155,74,.85)',
        'box-shadow:0 0 0 4px rgba(193,155,74,.25)',
        'pointer-events:none',
        'left:48px',
        'top:48px',
        'transform:translate(-50%,-50%)',
      ].join(';');
      document.body.appendChild(c);
    }
  }).catch(() => {});
}

async function point(page, locator) {
  const loc = locator.first();
  await loc.waitFor({ state: 'visible', timeout: 25000 });
  await loc.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'nearest' })).catch(() => {});
  await page.waitForTimeout(200);
  const box = await loc.boundingBox();
  if (!box) return loc;
  const x = box.x + Math.min(Math.max(box.width / 2, 12), box.width - 8);
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y, { steps: 16 });
  await page.evaluate(({ x, y }) => {
    const c = document.getElementById('rec-cursor');
    if (c) {
      c.style.left = x + 'px';
      c.style.top = y + 'px';
    }
  }, { x, y }).catch(() => {});
  await page.waitForTimeout(350);
  return loc;
}

async function click(page, locator) {
  const loc = await point(page, locator);
  await loc.click({ force: true });
  await showCursor(page);
}

async function settle(page, started, id) {
  const left = holdFor(id) - (Date.now() - started);
  if (left > 0) await page.waitForTimeout(left);
}

async function waitEnabled(page, name) {
  await page.waitForFunction((label) => {
    const button = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').includes(label));
    return button && !button.disabled;
  }, name, { timeout: 20000 });
}

const scenes = {
  async '01-home'(page) {
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await showCursor(page);
    await page.waitForTimeout(1500);
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(1200);
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(1000);
    await click(page, page.locator('a[href="/services"]').first());
    await page.waitForTimeout(1500);
    await click(page, page.locator('a[href="/contact"]').first());
    await page.waitForTimeout(1200);
  },
  async '02-catalog'(page) {
    await page.goto(BASE + '/packages', { waitUntil: 'networkidle' });
    await showCursor(page);
    await page.waitForTimeout(1800);
    await click(page, page.locator('a[href="/consultants"]').first());
    await page.waitForTimeout(1600);
    const card = page.locator('a[href^="/consultants/"]').first();
    await click(page, card);
    await page.waitForTimeout(1800);
  },
  async '03-login'(page) {
    await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
    await showCursor(page);
    await click(page, page.locator('form').getByRole('button', { name: 'تسجيل الدخول' }));
    await page.waitForTimeout(1600);
    await page.locator('input[name="email"]').fill('client@gcmc.sa');
    await page.locator('input[name="password"]').fill('Password@123');
    await page.waitForTimeout(600);
    await click(page, page.locator('form').getByRole('button', { name: 'تسجيل الدخول' }));
    await page.waitForURL('**/dashboard', { timeout: 20000 });
    await page.waitForTimeout(1200);
  },
  async '04-wizard'(page) {
    await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
    await page.locator('input[name="email"]').fill('client@gcmc.sa');
    await page.locator('input[name="password"]').fill('Password@123');
    await page.locator('form').getByRole('button', { name: 'تسجيل الدخول' }).click();
    await page.waitForURL('**/dashboard', { timeout: 20000 });
    await page.goto(BASE + '/book/gold', { waitUntil: 'networkidle' });
    await showCursor(page);
    await page.waitForTimeout(1200);
    await click(page, page.getByRole('radio', { name: /نورة السبيعي/ }));
    await waitEnabled(page, 'التالي');
    await click(page, page.getByRole('button', { name: 'التالي' }));
    await page.waitForTimeout(1000);
    const day = page.locator('button:not([disabled])').filter({ hasText: /^4$/ }).first();
    await click(page, day);
    const slot = page.getByRole('radio', { name: /09:00|09:30|10:00/ }).first();
    await slot.waitFor({ state: 'visible', timeout: 20000 });
    await click(page, slot);
    await waitEnabled(page, 'التالي');
    await click(page, page.getByRole('button', { name: 'التالي' }));
    await page.waitForTimeout(800);
    await waitEnabled(page, 'التالي');
    await click(page, page.getByRole('button', { name: 'التالي' }));
    await page.getByText('بطاقة جديدة').waitFor({ state: 'visible', timeout: 20000 });
    await click(page, page.getByText('بطاقة جديدة'));
    await click(page, page.getByText('دفع ناجح (فوري)'));
    await waitEnabled(page, 'التالي');
    await click(page, page.getByRole('button', { name: 'التالي' }));
    await page.waitForTimeout(800);
    await click(page, page.getByRole('button', { name: 'تأكيد الحجز' }));
    await page.waitForTimeout(4000);
  },
  async '05-client'(page) {
    await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
    await page.locator('input[name="email"]').fill('client@gcmc.sa');
    await page.locator('input[name="password"]').fill('Password@123');
    await page.locator('form').getByRole('button', { name: 'تسجيل الدخول' }).click();
    await page.waitForURL('**/dashboard', { timeout: 20000 });
    await showCursor(page);
    await page.waitForTimeout(1500);
    for (const href of ['/bookings', '/reports', '/my-packages', '/locations', '/payment-methods', '/profile']) {
      await click(page, page.locator(`a[href="${href}"]`).first());
      await page.waitForTimeout(1400);
      await showCursor(page);
    }
    await click(page, page.locator('a[href="/bookings"]').first());
    await page.waitForTimeout(800);
    const row = page.locator('table tbody tr').first();
    if (await row.count()) await click(page, row);
    await page.waitForTimeout(1800);
  },
  async '06-admin'(page) {
    await page.goto(BASE + '/admin/login', { waitUntil: 'networkidle' });
    await showCursor(page);
    await page.locator('input[name="email"]').fill('admin@gcmc.sa');
    await page.locator('input[name="password"]').fill('Password@123');
    await page.waitForTimeout(400);
    await click(page, page.locator('form').getByRole('button', { name: 'تسجيل الدخول' }));
    await page.waitForURL('**/admin', { timeout: 20000 });
    await page.waitForTimeout(1800);
    await click(page, page.locator('a[href="/admin/bookings"]').first());
    await page.waitForTimeout(1600);
    await click(page, page.locator('a[href="/admin/bookings/calendar"]').first());
    await page.waitForTimeout(1600);
    await click(page, page.locator('a[href="/admin/bookings"]').first());
    await page.waitForTimeout(800);
    const row = page.locator('table tbody tr').first();
    if (await row.count()) await click(page, row);
    await page.waitForTimeout(1800);
    await click(page, page.locator('a[href="/admin/reports"]').first());
    await page.waitForTimeout(1400);
    await click(page, page.locator('a[href="/admin/payments"]').first());
    await page.waitForTimeout(1400);
  },
  async '07-people'(page) {
    await page.goto(BASE + '/admin/login', { waitUntil: 'networkidle' });
    await page.locator('input[name="email"]').fill('admin@gcmc.sa');
    await page.locator('input[name="password"]').fill('Password@123');
    await page.locator('form').getByRole('button', { name: 'تسجيل الدخول' }).click();
    await page.waitForURL('**/admin', { timeout: 20000 });
    await click(page, page.locator('a[href="/admin/clients"]').first());
    await page.waitForTimeout(1400);
    const clientRow = page.locator('table tbody tr').first();
    if (await clientRow.count()) await click(page, clientRow);
    await page.waitForTimeout(1600);
    await click(page, page.locator('a[href="/admin/consultants"]').first());
    await page.waitForTimeout(1400);
    const consultantRow = page.locator('table tbody tr').first();
    if (await consultantRow.count()) {
      await click(page, consultantRow);
      await page.waitForURL('**/admin/consultants/**', { timeout: 20000 });
      await page.waitForTimeout(800);
      const tab = page.getByRole('button', { name: 'التوفر' });
      if (await tab.count()) await click(page, tab);
      await page.waitForTimeout(1600);
    }
    await click(page, page.locator('a[href="/admin/packages"]').first());
    await page.waitForTimeout(1400);
    await click(page, page.locator('a[href="/admin/users"]').first());
    await page.waitForTimeout(1400);
    await click(page, page.locator('a[href="/admin/roles"]').first());
    await page.waitForTimeout(1600);
  },
  async '08-consultant'(page) {
    await page.goto(BASE + '/admin/login', { waitUntil: 'networkidle' });
    await showCursor(page);
    await page.locator('input[name="email"]').fill('ahmad.alotaibi@gcmc.sa');
    await page.locator('input[name="password"]').fill('Password@123');
    await click(page, page.locator('form').getByRole('button', { name: 'تسجيل الدخول' }));
    await page.waitForURL('**/admin', { timeout: 20000 });
    await page.waitForTimeout(1800);
    await click(page, page.locator('a[href="/admin/my-availability"]').first());
    await page.waitForTimeout(2000);
  },
};

const browser = await chromium.launch({ headless: true });
const order = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(scenes);
for (const id of order) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'ar-EG',
    recordVideo: { dir: path.join(OUT, 'raw'), size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  const started = Date.now();
  console.log('scene', id);
  try {
    await scenes[id](page);
  } catch (error) {
    console.error('scene failed', id, error);
    await page.screenshot({ path: path.join(OUT, `${id}-error.png`) }).catch(() => {});
    throw error;
  }
  await settle(page, started, id);
  const video = page.video();
  await context.close();
  const src = await video.path();
  const dest = path.join(OUT, 'chapters', `${id}.webm`);
  fs.renameSync(src, dest);
  console.log('saved', dest);
}
await browser.close();
