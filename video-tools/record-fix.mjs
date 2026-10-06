import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, 'output', 'long');
const BASE = 'http://localhost:3000';
const API = 'http://127.0.0.1:8000/api/v1';
const durations = JSON.parse(fs.readFileSync(path.join(ROOT, 'output', 'voice-long', 'durations.json'), 'utf8'));

async function login(pathname, email) {
  const res = await fetch(API + pathname, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password: 'Password@123', device_name: 'web' }),
  });
  const body = await res.json();
  return body.data;
}

async function authState(browser, key, data) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ key, data }) => {
    localStorage.setItem(key, JSON.stringify({ state: { token: data.token, user: data.user }, version: 0 }));
  }, { key, data });
  const state = await context.storageState();
  await context.close();
  return state;
}

async function click(page, locator) {
  const loc = locator.first();
  await loc.waitFor({ state: 'visible', timeout: 20000 });
  await loc.evaluate((el) => el.scrollIntoView({ block: 'center' })).catch(() => {});
  await loc.click({ force: true });
}

async function beat(page, id, action) {
  const start = Date.now();
  if (action) await action();
  const left = Math.round((durations[id] ?? 8) * 1000) - (Date.now() - start);
  if (left > 0) await page.waitForTimeout(left);
}

async function nextStep(page) {
  await page.waitForFunction(() => {
    const button = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').includes('التالي'));
    return button && !button.disabled;
  }, { timeout: 20000 });
  await click(page, page.getByRole('button', { name: 'التالي' }));
}

const browser = await chromium.launch({ headless: true });
const adminState = await authState(browser, 'admin_auth', await login('/admin/auth/login', 'admin@gcmc.sa'));

async function shot(id, state, run) {
  const context = await browser.newContext({
    storageState: state,
    viewport: { width: 1440, height: 900 },
    locale: 'ar-EG',
    recordVideo: { dir: OUT, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  console.log('scene', id);
  try {
    await run(page);
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

async function tabs(page, names, id) {
  const slice = ((durations[id] ?? 12) * 1000) / names.length;
  for (const name of names) {
    const start = Date.now();
    await click(page, page.getByRole('tab', { name }));
    const left = slice - (Date.now() - start);
    if (left > 0) await page.waitForTimeout(left);
  }
}

await shot('16-admin-pay', adminState, async (page) => {
  await page.goto(BASE + '/admin/payments', { waitUntil: 'networkidle' });
  await page.locator('table').first().waitFor({ timeout: 20000 });
  await page.evaluate(() => {
    document.querySelectorAll('.chart-row').forEach((el) => {
      el.style.display = 'none';
    });
  });
  await beat(page, '16-admin-pay');
});

if (false) await shot('18-admin-client', adminState, async (page) => {
  await page.goto(BASE + '/admin/clients/1', { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: 'نظرة عامة' }).waitFor({ timeout: 20000 });
  await tabs(page, ['نظرة عامة', 'باقاتي', 'التقارير', 'الحجوزات'], '18-admin-client');
});

if (false) await shot('19-admin-consultant', adminState, async (page) => {
  await page.goto(BASE + '/admin/consultants/7', { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: 'الملف' }).waitFor({ timeout: 20000 });
  await tabs(page, ['الملف', 'التوفر', 'الإجازات', 'العملاء', 'تقارير منتظرة', 'التقارير', 'معاينة المواعيد', 'الحجوزات'], '19-admin-consultant');
});

await browser.close();
