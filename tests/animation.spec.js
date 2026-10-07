import { test as base, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const APP_PATH = '/feynman-qcd/';
const STORAGE_KEY = 'feynman-qcd:t';
const DURATION = 82;

async function expectEmbeddedNotices(page) {
  const notices = await readFile(resolve('THIRD_PARTY_NOTICES.md'), 'utf8');
  expect((await page.locator('#third-party-notices').textContent()).trim()).toBe(notices.trim());
  await expect(page.locator('#third-party-notices')).toHaveAttribute('type', 'text/plain');
}

const test = base.extend({
  browserHealth: [async ({ page }, use) => {
    const failures = [];
    page.on('pageerror', error => failures.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') failures.push(`${message.text()} ${message.location().url}`);
    });
    page.on('response', response => {
      if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
    });
    page.on('requestfailed', request => {
      if (request.failure()?.errorText !== 'net::ERR_ABORTED') {
        failures.push(`${request.failure()?.errorText} ${request.url()}`);
      }
    });
    await use();
    expect(failures, 'No runtime errors or unavailable resources').toEqual([]);
  }, { auto: true }],
});

const timeline = page => page.getByRole('slider', { name: 'Timeline', exact: true });
const playhead = async page => Number(await timeline(page).getAttribute('aria-valuenow'));

async function openPaused(page, url = APP_PATH) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await pausePlayback(page);
}

async function pausePlayback(page) {
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  await page.mouse.move(0, 0);
}

async function seekSeconds(page, seconds) {
  const slider = timeline(page);
  await slider.press('Home');
  for (let index = 0; index < seconds; index += 1) await slider.press('Shift+ArrowRight');
  await expect.poll(() => playhead(page)).toBeCloseTo(seconds, 5);
}

async function resetBodyFocus(page) {
  await page.evaluate(() => document.activeElement?.blur());
}

async function clickFraction(page, fraction) {
  const bounds = await timeline(page).boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.click(bounds.x + bounds.width * fraction, bounds.y + bounds.height / 2);
  await page.mouse.move(0, 0);
}

test('production build loads local assets and renders every chapter with valid equations', async ({ page }, testInfo) => {
  const unexpectedRequests = [];
  page.on('request', request => {
    if (/^https?:/.test(request.url()) && !request.url().startsWith('http://127.0.0.1:4173/')) {
      unexpectedRequests.push(request.url());
    }
  });
  await openPaused(page);
  await expectEmbeddedNotices(page);
  await seekSeconds(page, 2);
  await expect(page.getByText('QCD · Feynman Path Integral', { exact: true })).toBeVisible();
  const titleScreenshot = testInfo.outputPath('title.png');
  await page.screenshot({ path: titleScreenshot });
  await testInfo.attach('title', { path: titleScreenshot, contentType: 'image/png' });

  const chapters = [
    { time: 12, title: '· One Path' },
    { time: 30, title: '· Gluon Self-Coupling' },
    { time: 40, title: '· Sum Over Paths' },
    { time: 57, title: '· Superposition in Time' },
    { time: 67, title: '· Total Amplitude' },
    { time: 81, title: '· Interference of Amplitudes' },
  ];
  for (const chapter of chapters) {
    await seekSeconds(page, chapter.time);
    await expect(page.getByText(chapter.title, { exact: true })).toBeVisible();
    await expect(page.locator('.katex-error')).toHaveCount(0);
    if (chapter.time !== 40) await expect(page.locator('.katex').first()).toBeVisible();
  }
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('16px Heebo'))).toBe(true);
  expect(await page.evaluate(() => document.fonts.check('16px "JetBrains Mono"'))).toBe(true);
  expect(unexpectedRequests, 'Fonts, scripts, and equations are self-hosted').toEqual([]);
  const interferenceScreenshot = testInfo.outputPath('interference.png');
  await page.screenshot({ path: interferenceScreenshot });
  await testInfo.attach('interference', { path: interferenceScreenshot, contentType: 'image/png' });
});

test('playback advances, pauses, and responds once to global Space', async ({ page }) => {
  await openPaused(page);
  await seekSeconds(page, 5);
  const paused = await playhead(page);
  await page.waitForTimeout(250);
  expect(await playhead(page)).toBe(paused);
  await resetBodyFocus(page);
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await expect.poll(() => playhead(page)).toBeGreaterThan(paused + 0.15);
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  const stopped = await playhead(page);
  await page.waitForTimeout(250);
  expect(await playhead(page)).toBe(stopped);
});

test('native Space on the focused play button performs one toggle', async ({ page }) => {
  await openPaused(page);
  await page.getByRole('button', { name: 'Play', exact: true }).press('Space');
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Pause', exact: true }).press('Space');
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
});

test('slider and global shortcuts seek precise amounts and respect bounds', async ({ page }) => {
  await openPaused(page);
  const slider = timeline(page);
  await slider.press('Home');
  await slider.press('ArrowLeft');
  expect(await playhead(page)).toBe(0);
  await slider.press('ArrowRight');
  expect(await playhead(page)).toBeCloseTo(0.1, 8);
  await slider.press('Shift+ArrowRight');
  expect(await playhead(page)).toBeCloseTo(1.1, 8);
  await slider.press('End');
  await slider.press('ArrowRight');
  expect(await playhead(page)).toBe(DURATION);
  await resetBodyFocus(page);
  await page.keyboard.press('Home');
  await page.keyboard.press('Shift+ArrowRight');
  expect(await playhead(page)).toBe(1);
  await page.keyboard.press('0');
  expect(await playhead(page)).toBe(0);
});

test('playing from the paused end restarts the looping animation', async ({ page }) => {
  await openPaused(page);
  await timeline(page).press('End');
  expect(await playhead(page)).toBe(DURATION);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await expect.poll(() => playhead(page)).toBeGreaterThan(0.1);
  expect(await playhead(page)).toBeLessThan(2);
});

test('click and captured pointer drag seek without leaving the timeline range', async ({ page }) => {
  await openPaused(page);
  await clickFraction(page, 0.25);
  expect(await playhead(page)).toBeCloseTo(DURATION / 4, 1);
  const bounds = await timeline(page).boundingBox();
  await page.mouse.move(bounds.x + bounds.width / 4, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width + 40, bounds.y - 60, { steps: 8 });
  await page.mouse.up();
  await page.mouse.move(0, 0);
  expect(await playhead(page)).toBe(DURATION);
});

test('hover previews do not commit a seek and keyboard reset clears the preview', async ({ page }) => {
  await openPaused(page);
  await seekSeconds(page, 12);
  const bounds = await timeline(page).boundingBox();
  await page.mouse.move(bounds.x + bounds.width * 0.8, bounds.y + bounds.height / 2);
  expect(await playhead(page)).toBe(12);
  await resetBodyFocus(page);
  await page.keyboard.press('Home');
  expect(await playhead(page)).toBe(0);
  await expect(page.getByText('· One Path', { exact: true })).toHaveCount(0);
});

test('latest committed playhead persists at pagehide and restores on reload', async ({ page }) => {
  await openPaused(page);
  await seekSeconds(page, 37);
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  expect(await page.evaluate(key => Number(localStorage.getItem(key)), STORAGE_KEY)).toBe(37);
  await openPaused(page);
  expect(await playhead(page)).toBeGreaterThanOrEqual(37);
  expect(await playhead(page)).toBeLessThan(39);
});

for (const storedValue of ['not-a-number', '12garbage', 'Infinity', '-Infinity', '-7', '999999']) {
  test(`stored playhead ${storedValue} remains finite and bounded`, async ({ page }) => {
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
      key: STORAGE_KEY,
      value: storedValue,
    });
    await openPaused(page);
    const time = await playhead(page);
    expect(Number.isFinite(time)).toBe(true);
    expect(time).toBeGreaterThanOrEqual(0);
    expect(time).toBeLessThanOrEqual(DURATION);
    await seekSeconds(page, 3);
    expect(await playhead(page)).toBe(3);
  });
}

test('unavailable local storage does not block playback or seeking', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, 'getItem', {
      value() { throw new DOMException('Storage unavailable', 'SecurityError'); },
    });
    Object.defineProperty(Storage.prototype, 'setItem', {
      value() { throw new DOMException('Storage unavailable', 'SecurityError'); },
    });
  });
  await openPaused(page);
  await seekSeconds(page, 30);
  await expect(page.getByText('· Gluon Self-Coupling', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Return to start', exact: true }).click();
  expect(await playhead(page)).toBe(0);
});

test('modified shortcuts and editable controls preserve normal input behavior', async ({ page }) => {
  await openPaused(page);
  await seekSeconds(page, 8);
  await resetBodyFocus(page);
  await page.keyboard.press('Control+ArrowRight');
  expect(await playhead(page)).toBe(8);
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.setAttribute('aria-label', 'Text entry');
    input.style.position = 'fixed';
    input.style.zIndex = '100';
    document.body.append(input);
    input.focus();
  });
  await page.getByRole('textbox', { name: 'Text entry' }).press('0');
  await page.getByRole('textbox', { name: 'Text entry' }).press('Space');
  await expect(page.getByRole('textbox', { name: 'Text entry' })).toHaveValue('0 ');
  expect(await playhead(page)).toBe(8);
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
});

test('touch dragging and portrait resize keep the animation and transport usable', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  try {
    await openPaused(page, 'http://127.0.0.1:4173' + APP_PATH);
    const bounds = await timeline(page).boundingBox();
    const session = await context.newCDPSession(page);
    const y = bounds.y + bounds.height / 2;
    const touch = x => [{ x, y, radiusX: 2, radiusY: 2, force: 1, id: 1 }];
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: touch(bounds.x + bounds.width * 0.2) });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: touch(bounds.x + bounds.width * 0.7) });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => playhead(page)).toBeCloseTo(DURATION * 0.7, 0);
    await seekSeconds(page, 2);
    await expect(page.getByText('QCD · Feynman Path Integral', { exact: true })).toBeVisible();
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeInViewport();
    await expect(timeline(page)).toBeInViewport();
    await page.setViewportSize({ width: 320, height: 568 });
    await expect(page.getByRole('button', { name: 'Return to start', exact: true })).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeInViewport();
    await expect(timeline(page)).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(failures).toEqual([]);
  } finally {
    await context.close();
  }
});

const standaloneDocument = process.env.PLAYWRIGHT_STANDALONE_LOAD_MODE === 'document';
test(`standalone HTML runs ${standaloneDocument ? 'as a document' : 'directly from disk'} with network access disabled`, async ({ page, context }) => {
  const path = resolve('dist-standalone/index.html');
  const html = await readFile(path, 'utf8');
  expect(html).not.toMatch(/<(?:script|link)\b[^>]*(?:src|href)=["'](?:https?:|\/assets\/)/i);
  const networkRequests = [];
  await context.route(/^https?:\/\//, route => {
    networkRequests.push(route.request().url());
    return route.abort();
  });
  await context.setOffline(true);
  if (standaloneDocument) {
    await page.setContent(html, { waitUntil: 'networkidle' });
    await pausePlayback(page);
  } else {
    await openPaused(page, pathToFileURL(path).href);
  }
  await expectEmbeddedNotices(page);
  await seekSeconds(page, 67);
  await expect(page.getByText('· Total Amplitude', { exact: true })).toBeVisible();
  await expect(page.locator('.katex').first()).toBeVisible();
  await expect(page.locator('.katex-error')).toHaveCount(0);
  expect(networkRequests, 'The standalone file needs no HTTP requests').toEqual([]);
});
