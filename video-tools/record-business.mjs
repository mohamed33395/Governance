import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, 'output', 'business');
const BASE = 'http://localhost:3000';
fs.mkdirSync(OUT, { recursive: true });

async function click(page, locator) {
  const loc = locator.first();
  await loc.waitFor({ state: 'visible', timeout: 25000 });
  await loc.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'nearest' })).catch(() => {});
  await page.waitForTimeout(250);
  await loc.click({ force: true });
}

async function loginClient(page) {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await page.locator('input[name="email"]').fill('client@gcmc.sa');
  await page.locator('input[name="password"]').fill('Password@123');
  await page.waitForTimeout(400);
  await click(page, page.locator('form').getByRole('button', { name: 'تسجيل الدخول' }));
  await page.waitForURL('**/dashboard', { timeout: 20000 });
}

async function loginAdmin(page, email) {
  await page.goto(BASE + '/admin/login', { waitUntil: 'networkidle' });
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill('Password@123');
  await page.waitForTimeout(400);
  await click(page, page.locator('form').getByRole('button', { name: 'تسجيل الدخول' }));
  await page.waitForURL(/\/admin$/, { timeout: 20000 });
}

async function next(page) {
  await page.waitForFunction(() => {
    const button = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').includes('التالي'));
    return button && !button.disabled;
  }, { timeout: 20000 });
  await click(page, page.getByRole('button', { name: 'التالي' }));
}

const scenes = {
  async home(page) {
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1800);
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, 520);
      await page.waitForTimeout(1100);
    }
    await page.waitForTimeout(1600);
  },
  async packages(page) {
    await page.goto(BASE + '/packages', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3500);
  },
  async consultants(page) {
    await page.goto(BASE + '/consultants', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1800);
    await click(page, page.locator('a[href^="/consultants/"]').first());
    await page.waitForTimeout(2800);
  },
  async account(page) {
    await loginClient(page);
    await page.waitForTimeout(2800);
  },
  async wizard(page) {
    await loginClient(page);
    await page.goto(BASE + '/book/gold', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await click(page, page.getByRole('radio').first());
    await page.waitForTimeout(900);
    await next(page);
    await page.waitForTimeout(900);
    const day = page.locator('button:not([disabled])').filter({ hasText: /^\d{1,2}$/ }).first();
    await click(page, day);
    await page.waitForTimeout(900);
    const slot = page.locator('[role="radio"]').filter({ hasText: /\d{2}:\d{2}/ }).first();
    await slot.waitFor({ state: 'visible', timeout: 20000 });
    await click(page, slot);
    await page.waitForTimeout(800);
    await next(page);
    await page.waitForTimeout(1200);
    await next(page);
    await page.waitForTimeout(1200);
    const pay = page.getByText('بطاقة جديدة');
    if (await pay.count()) {
      await page.waitForTimeout(1400);
      await next(page);
    }
    await page.waitForTimeout(1000);
    await click(page, page.getByRole('button', { name: 'تأكيد الحجز' }));
    await page.getByText('تم الحجز بنجاح').waitFor({ state: 'visible', timeout: 25000 });
    await page.waitForTimeout(3500);
  },
  async client(page) {
    await loginClient(page);
    await page.waitForTimeout(2000);
    await click(page, page.locator('a[href="/my-packages"]').first());
    await page.waitForTimeout(1800);
    await page.goto(BASE + '/bookings/17', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
  },
  async office(page) {
    await loginAdmin(page, 'admin@gcmc.sa');
    await page.waitForTimeout(2200);
    await click(page, page.locator('a[href="/admin/bookings"]').first());
    await page.waitForTimeout(1800);
    await click(page, page.locator('a[href="/admin/payments"]').first());
    await page.waitForTimeout(1800);
    await click(page, page.locator('a[href="/admin/clients"]').first());
    await page.waitForTimeout(1600);
    await click(page, page.locator('a[href="/admin/packages"]').first());
    await page.waitForTimeout(1800);
  },
  async schedule(page) {
    await loginAdmin(page, 'ahmad.alotaibi@gcmc.sa');
    await page.waitForTimeout(1600);
    await click(page, page.locator('a[href="/admin/my-availability"]').first());
    await page.waitForTimeout(2800);
  },
};

const browser = await chromium.launch({ headless: true });
const only = process.argv.slice(2);
const order = only.length ? only : Object.keys(scenes);
for (const id of order) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'ar-EG',
    recordVideo: { dir: OUT, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  console.log('scene', id);
  try {
    await scenes[id](page);
  } catch (error) {
    await page.screenshot({ path: path.join(OUT, `${id}-error.png`) }).catch(() => {});
    console.error('scene failed', id, error);
    await context.close();
    throw error;
  }
  const video = page.video();
  await context.close();
  fs.renameSync(await video.path(), path.join(OUT, `${id}.webm`));
  console.log('saved', id);
}
await browser.close();
