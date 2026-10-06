import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, 'output', 'long');
const BASE = 'http://localhost:3000';
const API = 'http://127.0.0.1:8000/api/v1';
const PDF = path.join(ROOT, 'output', 'report-demo.pdf');
const durations = JSON.parse(fs.readFileSync(path.join(ROOT, 'output', 'voice-long', 'durations.json'), 'utf8'));
fs.mkdirSync(OUT, { recursive: true });

async function login(pathname, email) {
  const res = await fetch(API + pathname, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password: 'Password@123', device_name: 'web' }),
  });
  const body = await res.json();
  if (!body.success) throw new Error('login failed ' + email);
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

async function shot(browser, id, options, run) {
  const context = await browser.newContext({
    ...options,
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
    console.error('scene failed', id, error.message || error);
  }
  const video = page.video();
  await context.close();
  fs.renameSync(await video.path(), path.join(OUT, `${id}.webm`));
  console.log('saved', id);
}

async function nextStep(page) {
  await page.waitForFunction(() => {
    const button = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').includes('التالي'));
    return button && !button.disabled;
  }, { timeout: 20000 });
  await click(page, page.getByRole('button', { name: 'التالي' }));
}

async function tabs(page, names, id) {
  const slice = ((durations[id] ?? 12) * 1000) / names.length;
  for (const name of names) {
    const start = Date.now();
    const tab = page.getByRole('tab', { name });
    if (await tab.count()) await click(page, tab);
    const left = slice - (Date.now() - start);
    if (left > 0) await page.waitForTimeout(left);
  }
}

const browser = await chromium.launch({ headless: true });
const clientData = await login('/client/auth/login', 'client@gcmc.sa');
const adminData = await login('/admin/auth/login', 'admin@gcmc.sa');
const consultantData = await login('/admin/auth/login', 'ahmad.alotaibi@gcmc.sa');
const clientState = await authState(browser, 'client_auth', clientData);
const adminState = await authState(browser, 'admin_auth', adminData);
const consultantState = await authState(browser, 'admin_auth', consultantData);

await shot(browser, '02-home', {}, async (page) => {
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'الرئيسية' }).first().waitFor({ timeout: 15000 }).catch(() => {});
  await beat(page, '02-home', async () => {
    await page.waitForTimeout(800);
    await page.mouse.wheel(0, 480);
  });
});

await shot(browser, '03-packages', {}, async (page) => {
  await page.goto(BASE + '/packages', { waitUntil: 'networkidle' });
  await beat(page, '03-packages');
});

await shot(browser, '04-consultants', {}, async (page) => {
  await page.goto(BASE + '/consultants', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await click(page, page.locator('a[href^="/consultants/"]').first());
  await beat(page, '04-consultants');
});

await shot(browser, 'wizard', { storageState: clientState }, async (page) => {
  await page.goto(BASE + '/book/gold', { waitUntil: 'networkidle' });
  await beat(page, '05-wiz-consultant', async () => {
    await page.getByRole('radio').first().waitFor({ timeout: 20000 });
    await click(page, page.getByRole('radio').first());
  });
  await nextStep(page);
  await beat(page, '06-wiz-time', async () => {
    const day = page.locator('button:not([disabled])').filter({ hasText: /^\d{1,2}$/ }).first();
    await click(page, day);
    const slot = page.locator('[role="radio"]').filter({ hasText: /\d{2}:\d{2}/ }).first();
    await slot.waitFor({ timeout: 20000 });
    await click(page, slot);
  });
  await nextStep(page);
  await beat(page, '07-wiz-place');
  await nextStep(page);
  await beat(page, '08-wiz-pay', async () => {
    const fresh = page.getByText('بطاقة جديدة');
    if (await fresh.count()) await page.waitForTimeout(400);
  });
  if (await page.getByRole('button', { name: 'التالي' }).count()) {
    try { await nextStep(page); } catch { /* subscription may skip payment */ }
  }
  await beat(page, '09-wiz-done', async () => {
    const confirm = page.getByRole('button', { name: 'تأكيد الحجز' });
    if (await confirm.count()) {
      await click(page, confirm);
      await page.getByText('تم الحجز بنجاح').waitFor({ timeout: 25000 });
    }
  });
});

await shot(browser, '10-client-home', { storageState: clientState }, async (page) => {
  await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle' });
  await beat(page, '10-client-home');
});

await shot(browser, '11-client-booking', { storageState: clientState }, async (page) => {
  await page.goto(BASE + '/bookings/17', { waitUntil: 'networkidle' });
  await beat(page, '11-client-booking');
});

await shot(browser, '12-client-more', { storageState: clientState }, async (page) => {
  const pages = ['/reports', '/my-packages', '/locations', '/payment-methods'];
  const slice = ((durations['12-client-more'] ?? 16) * 1000) / pages.length;
  for (const href of pages) {
    const start = Date.now();
    await page.goto(BASE + href, { waitUntil: 'networkidle' });
    const left = slice - (Date.now() - start);
    if (left > 0) await page.waitForTimeout(left);
  }
});

await shot(browser, '13-admin-home', { storageState: adminState }, async (page) => {
  await page.goto(BASE + '/admin', { waitUntil: 'networkidle' });
  await beat(page, '13-admin-home');
});

await shot(browser, '14-admin-bookings', { storageState: adminState }, async (page) => {
  await page.goto(BASE + '/admin/bookings', { waitUntil: 'networkidle' });
  await beat(page, '14-admin-bookings');
});

await shot(browser, '15-admin-session', { storageState: adminState }, async (page) => {
  await page.goto(BASE + '/admin/bookings/11', { waitUntil: 'networkidle' });
  await beat(page, '15-admin-session', async () => {
    const complete = page.getByRole('button', { name: 'إتمام الجلسة' });
    if (await complete.count()) {
      await click(page, complete);
      await click(page, page.getByRole('dialog').getByRole('button', { name: 'تأكيد' }));
      await page.waitForTimeout(1500);
    }
    const upload = page.getByRole('button', { name: 'رفع تقرير' });
    if (await upload.count()) {
      await click(page, upload);
      await page.locator('input[name="title"]').fill('تقرير متابعة الجلسة');
      await page.locator('textarea').first().fill('ملخص ما تم الاتفاق عليه خلال الجلسة، والتوصيات التالية للشركة.');
      await page.locator('input[type="file"]').setInputFiles(PDF);
      await page.waitForTimeout(600);
      await click(page, page.getByRole('dialog').getByRole('button', { name: 'رفع تقرير' }));
      await page.waitForTimeout(2000);
    }
  });
});

await shot(browser, '16-admin-pay', { storageState: adminState }, async (page) => {
  await page.goto(BASE + '/admin/payments', { waitUntil: 'networkidle' });
  await beat(page, '16-admin-pay');
});

await shot(browser, '17-admin-reports', { storageState: adminState }, async (page) => {
  await page.goto(BASE + '/admin/reports', { waitUntil: 'networkidle' });
  await beat(page, '17-admin-reports');
});

await shot(browser, '18-admin-client', { storageState: adminState }, async (page) => {
  await page.goto(BASE + '/admin/clients/5', { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: 'نظرة عامة' }).waitFor({ timeout: 20000 });
  await tabs(page, ['نظرة عامة', 'الحجوزات', 'التقارير', 'باقاتي'], '18-admin-client');
});

await shot(browser, '19-admin-consultant', { storageState: adminState }, async (page) => {
  await page.goto(BASE + '/admin/consultants/7', { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: 'الملف' }).waitFor({ timeout: 20000 });
  await tabs(page, ['الملف', 'التوفر', 'الإجازات', 'العملاء', 'الحجوزات', 'تقارير منتظرة', 'التقارير', 'معاينة المواعيد'], '19-admin-consultant');
});

await shot(browser, '20-admin-packages', { storageState: adminState }, async (page) => {
  await page.goto(BASE + '/admin/packages', { waitUntil: 'networkidle' });
  await beat(page, '20-admin-packages');
});

await shot(browser, '21-consultant', { storageState: consultantState }, async (page) => {
  const slice = ((durations['21-consultant'] ?? 16) * 1000) / 4;
  const steps = [
    async () => page.goto(BASE + '/admin', { waitUntil: 'networkidle' }),
    async () => {
      await page.goto(BASE + '/admin/my-availability', { waitUntil: 'networkidle' });
      await click(page, page.getByRole('tab', { name: 'التوفر' }));
    },
    async () => click(page, page.getByRole('tab', { name: 'الإجازات' })),
    async () => click(page, page.getByRole('tab', { name: 'معاينة المواعيد' })),
  ];
  for (const step of steps) {
    const start = Date.now();
    await step();
    const left = slice - (Date.now() - start);
    if (left > 0) await page.waitForTimeout(left);
  }
});

await browser.close();
