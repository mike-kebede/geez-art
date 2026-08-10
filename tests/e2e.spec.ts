import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const SAMPLE = path.resolve('tests', 'fixtures', 'sample.png');
const VIDEO = path.resolve('tests', 'fixtures', 'sample-video.webm');

// Generate a tiny animated WebM once, by recording a canvas in a real browser.
test.beforeAll(async ({ browser }) => {
  if (fs.existsSync(VIDEO)) return;
  const page = await browser.newPage();
  const b64 = await page.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 96;
    c.height = 96;
    const ctx = c.getContext('2d')!;
    const stream = c.captureStream(15);
    const rec = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    const done = new Promise<string>((resolve) => {
      rec.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const buf = new Uint8Array(await blob.arrayBuffer());
        let bin = '';
        for (let i = 0; i < buf.length; i += 32768) {
          bin += String.fromCharCode.apply(null, Array.from(buf.subarray(i, i + 32768)));
        }
        resolve(btoa(bin));
      };
    });
    rec.start(250);
    const t0 = performance.now();
    const draw = () => {
      const k = Math.floor((performance.now() - t0) / 200);
      ctx.fillStyle = `rgb(${k % 255},${(k * 2) % 255},120)`;
      ctx.fillRect(0, 0, 96, 96);
      ctx.fillStyle = '#111';
      ctx.fillRect(20, 20, 56, 56);
      if (performance.now() - t0 < 1500) requestAnimationFrame(draw);
      else rec.stop();
    };
    requestAnimationFrame(draw);
    return done;
  });
  fs.mkdirSync(path.dirname(VIDEO), { recursive: true });
  fs.writeFileSync(VIDEO, Buffer.from(b64, 'base64'));
  await page.close();
});

/** Wait until the app finishes setup (font + ramp) or reports a failure. */
async function waitReady(page: Page): Promise<string> {
  await page.waitForFunction(() => {
    const s = document.getElementById('status');
    return s && /Ready|Setup error|Something went wrong/.test(s.textContent || '');
  });
  return (await page.textContent('#status')) ?? '';
}

async function uploadSample(page: Page): Promise<void> {
  await page.setInputFiles('#file', SAMPLE);
  await page.waitForFunction(() => {
    const c = document.getElementById('mosaic');
    return c && c.width > 10 && c.height > 10;
  });
}

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
}

test('app loads, reaches Ready, and has no console errors', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  const status = await waitReady(page);
  expect(status).toMatch(/Ready/);
  await expect(page.locator('#emptyHint')).toBeVisible();
  expect(errors).toEqual([]);
});

test('uploading a photo renders a mosaic and updates the stat line', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  const stat = await page.textContent('#mosaicStat');
  expect(stat).toMatch(/letters/);
  // the source chip appears once a photo is loaded
  await expect(page.locator('#sourceChip')).toBeVisible();
  expect(errors).toEqual([]);
});

test('custom letter picker opens and toggling a family works', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);

  await page.selectOption('#charset', 'custom');
  await expect(page.locator('#picker')).toBeVisible();
  await expect(page.locator('.fam-tile').first()).toBeVisible();
  await expect(page.locator('#pickSummary')).toContainText('of'); // clean slate: "0 of N letters"

  // Toggle a whole family → mosaic re-renders.
  const before = await page.evaluate(() => (document.getElementById('mosaic') as HTMLCanvasElement).toDataURL());
  await page.locator('.fam-tile').first().click();
  await page.waitForFunction((prev) => {
    const c = document.getElementById('mosaic') as HTMLCanvasElement;
    return c.width > 0 && c.toDataURL() !== prev;
  }, before);

  // Expand a family and toggle an individual letter → re-renders again.
  const before2 = await page.evaluate(() => (document.getElementById('mosaic') as HTMLCanvasElement).toDataURL());
  await page.locator('.fam-expand').first().click();
  await expect(page.locator('.fam-detail').first()).toBeVisible();
  await page.locator('.fam-detail .letter').first().click();
  await page.waitForFunction((prev) => {
    const c = document.getElementById('mosaic') as HTMLCanvasElement;
    return c.width > 0 && c.toDataURL() !== prev;
  }, before2);
  expect(errors).toEqual([]);
});

test('custom picker works before a photo is added (no errors, feedback shown)', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await waitReady(page);
  await page.selectOption('#charset', 'custom');
  await expect(page.locator('#picker')).toBeVisible();
  await expect(page.locator('#pickSummary')).toContainText('of'); // clean slate: "0 of N letters"
  await page.locator('.fam-tile').first().click();
  await expect(page.locator('#pickSummary')).toContainText('add a photo');
  expect(errors).toEqual([]);
});

test('header Share is disabled until a mosaic exists, then enabled', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  const shareTop = page.locator('#shareTop');
  await expect(shareTop).toBeDisabled();
  await uploadSample(page);
  await expect(shareTop).toBeEnabled();
});

test('contrast slider changes the mosaic output', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  const before = await page.evaluate(() => (document.getElementById('mosaic') as HTMLCanvasElement).toDataURL());
  await page.locator('#contrast').fill('100');
  await page.waitForFunction((prev) => {
    const c = document.getElementById('mosaic') as HTMLCanvasElement;
    return c.width > 0 && c.toDataURL() !== prev;
  }, before);
});

test('edges slider changes the mosaic output', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  const before = await page.evaluate(() => (document.getElementById('mosaic') as HTMLCanvasElement).toDataURL());
  await page.locator('#edge').fill('100');
  await page.waitForFunction((prev) => {
    const c = document.getElementById('mosaic') as HTMLCanvasElement;
    return c.width > 0 && c.toDataURL() !== prev;
  }, before);
});

test('palette change updates the artifact', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  await page.selectOption('#palette', 'icon');
  await page.waitForFunction(() => document.getElementById('mosaicStat')!.textContent!.includes('Icon'));
});

test('invert and colorize toggles change the output', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  const get = () => page.evaluate(() => (document.getElementById('mosaic') as HTMLCanvasElement).toDataURL());
  const before = await get();
  await page.check('#invert');
  await page.waitForFunction((prev) => (document.getElementById('mosaic') as HTMLCanvasElement).toDataURL() !== prev, before);
  const before2 = await get();
  await page.uncheck('#colorize');
  await page.waitForFunction((prev) => (document.getElementById('mosaic') as HTMLCanvasElement).toDataURL() !== prev, before2);
});

test('charset presets rebuild the ramp and still render', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  await page.selectOption('#charset', 'common');
  await page.waitForFunction(() => document.getElementById('status')!.textContent!.includes('Ready'));
  await expect(page.locator('#mosaicStat')).toContainText('letters');
  expect(errors).toEqual([]);
});

test('selecting only 3 letters restricts the mosaic to exactly those', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  await page.selectOption('#charset', 'custom');
  // clean slate: nothing selected until you tap
  await page.waitForFunction(() => {
    const s = (window as any).__selectedCps;
    return s && s.length === 0;
  });
  // expand the first family and pick the first 3 individual letters
  await page.locator('.fam-expand').first().click();
  const letters = page.locator('.fam-detail .letter');
  const count = await letters.count();
  const wanted = Math.min(3, count);
  for (let i = 0; i < wanted; i++) await letters.nth(i).click();
  await page.waitForFunction(() => {
    const s = (window as any).__selectedCps;
    return s && s.length === 3;
  });
  await page.waitForTimeout(300);
  const info = await page.evaluate(() => ({
    selected: (window as any).__selectedCps,
    ramp: (window as any).__ramp.map((g: { cp: number }) => g.cp),
    used: (window as any).__lastChars,
  }));
  // the ramp is EXACTLY the 3 selected letters
  expect(info.ramp.slice().sort((a: number, b: number) => a - b)).toEqual(info.selected.slice().sort((a: number, b: number) => a - b));
  // every glyph in the mosaic is one of the selected letters
  const allowed = new Set(info.selected.map((cp: number) => String.fromCodePoint(cp)));
  for (const ch of info.used) expect(allowed.has(ch)).toBe(true);
});

test('toggling a family changes the ramp and the preview strip reflects it', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  await page.selectOption('#charset', 'custom');
  // clean slate (nothing selected yet)
  await page.waitForFunction(() => {
    const r = (window as any).__ramp;
    return r && r.length === 0;
  });
  const before = await page.evaluate(() => (window as any).__ramp.length);
  await page.locator('.fam-tile').first().click();
  await page.waitForFunction((prev) => {
    const r = (window as any).__ramp;
    return r && r.length !== prev;
  }, before);
  const after = await page.evaluate(() => (window as any).__ramp.length);
  expect(before).not.toBe(after);
  // the live "letters in use" strip always mirrors the ramp
  const strip = await page.evaluate(() => document.querySelectorAll('#rampPreview span').length);
  expect(strip).toBe(after);
});

test('custom picker guides you when no photo is loaded', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await page.selectOption('#charset', 'custom');
  await expect(page.locator('#emptyTitle')).toHaveText('Pick your letters');
});

test('zoom in changes the displayed scale', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  await expect(page.locator('#zoomControls')).toBeVisible();
  await page.click('#zoomIn');
  await expect(page.locator('#zoomVal')).toHaveText('125%');
});

test('copy as text produces a fidel letter grid', async ({ page, context }) => {
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.click('#copyText');
  await page.waitForTimeout(300);
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text.length).toBeGreaterThan(0);
  expect(text).toMatch(/[ሀ-፿]/);
});

test('common amharic uses ONLY the standard fidel — no outside letters', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  await page.selectOption('#charset', 'common');
  // wait until the ramp is actually the common ramp (all codepoints inside the set)
  await page.waitForFunction(() => {
    const r = (window as any).__ramp;
    const common = (window as any).__commonSet;
    return r && r.length > 100 && r.every((g: { cp: number }) => common.includes(g.cp));
  });
  const info = await page.evaluate(() => ({
    ramp: (window as any).__ramp.map((g: { cp: number }) => g.cp),
    used: (window as any).__lastChars,
    common: (window as any).__commonSet,
  }));
  expect(info.ramp.length).toBeGreaterThan(100);
  for (const cp of info.ramp) expect(info.common).toContain(cp);
  const allowed = new Set(info.common.map((cp: number) => String.fromCodePoint(cp)));
  for (const ch of info.used) expect(allowed.has(ch)).toBe(true);
});

test('randomize swaps the letter set and the mosaic changes', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  const before = await page.evaluate(() => (document.getElementById('mosaic') as HTMLCanvasElement).toDataURL());
  await page.click('#mixBtn');
  await page.waitForFunction((prev) => {
    const c = document.getElementById('mosaic') as HTMLCanvasElement;
    return c.width > 0 && c.toDataURL() !== prev;
  }, before);
  // randomize produces a custom selection with real variety
  const selected = await page.evaluate(() => (window as any).__selectedCps.length);
  expect(selected).toBeGreaterThan(10);
});

test('texture (dithering) options each change the output', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  const get = () => page.evaluate(() => (document.getElementById('mosaic') as HTMLCanvasElement).toDataURL());
  let prev = await get();
  for (const value of ['ordered', 'fs', 'scatter']) {
    await page.selectOption('#dither', value);
    await page.waitForFunction((p) => {
      const c = document.getElementById('mosaic') as HTMLCanvasElement;
      return c.width > 0 && c.toDataURL() !== p;
    }, prev);
    prev = await get();
  }
});

test('use all / use none set the selection', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  await page.selectOption('#charset', 'custom');
  await page.waitForFunction(() => {
    const s = (window as any).__selectedCps;
    return s && s.length === 0;
  });
  await page.click('#pickAll');
  await page.waitForFunction(() => {
    const s = (window as any).__selectedCps;
    return s && s.length > 300;
  });
  await page.click('#pickNone');
  await page.waitForFunction(() => {
    const s = (window as any).__selectedCps;
    return s && s.length === 0;
  });
});

test('zoom reset returns to fit', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  await page.click('#zoomIn');
  await expect(page.locator('#zoomVal')).toHaveText('125%');
  await page.click('#zoomReset');
  await expect(page.locator('#zoomVal')).toHaveText('100%');
});

test('dense and light presets both render a mosaic', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  for (const value of ['dense', 'light']) {
    await page.selectOption('#charset', value);
    await page.waitForFunction(() => document.getElementById('status')!.textContent!.includes('Ready'));
    await expect(page.locator('#mosaicStat')).toContainText('letters');
  }
});

test('video play/pause toggles', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await page.setInputFiles('#file', VIDEO);
  await expect(page.locator('#playBtn')).toBeVisible();
  await expect(page.locator('#playBtn')).toHaveText('Pause');
  await page.click('#playBtn');
  await expect(page.locator('#playBtn')).toHaveText('Play');
  await page.click('#playBtn');
  await expect(page.locator('#playBtn')).toHaveText('Pause');
});

test('try an example loads a mosaic and the canvas has an accessible name', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await waitReady(page);
  await page.click('#exampleBtn');
  await page.waitForFunction(() => {
    const c = document.getElementById('mosaic') as HTMLCanvasElement;
    return c.width > 10;
  });
  const label = await page.getAttribute('#mosaic', 'aria-label');
  expect(label).toMatch(/Mosaic of Ethiopic letters/);
  expect(errors).toEqual([]);
});

test('download PNG produces a file', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  const downloadPromise = page.waitForEvent('download');
  await page.click('#dlPng');
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('geez-art');
});

test('a video runs through the fidel filter and the mosaic animates', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await waitReady(page);
  await page.setInputFiles('#file', VIDEO);
  // video mode: play/pause appears, mosaic renders
  await expect(page.locator('#playBtn')).toBeVisible();
  await page.waitForFunction(() => {
    const c = document.getElementById('mosaic') as HTMLCanvasElement;
    return c.width > 10 && c.height > 10;
  });
  // the filter follows the motion: two samples 500ms apart differ
  const a = await page.evaluate(() => (document.getElementById('mosaic') as HTMLCanvasElement).toDataURL());
  await page.waitForTimeout(500);
  const b = await page.evaluate(() => (document.getElementById('mosaic') as HTMLCanvasElement).toDataURL());
  expect(a).not.toBe(b);
  expect(errors).toEqual([]);
});

test('changing a slider re-renders the mosaic', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);

  const before = await page.evaluate(() => (document.getElementById('mosaic') as HTMLCanvasElement).toDataURL());
  await page.locator('#width').fill('240');
  await page.waitForFunction((prev) => {
    const c = document.getElementById('mosaic') as HTMLCanvasElement;
    return c.width > 0 && c.toDataURL() !== prev;
  }, before);
  expect(errors).toEqual([]);
});

test('clear button resets the app to the empty state', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  // a mosaic is rendered before we clear
  await expect(page.locator('#emptyHint')).toBeHidden();
  await page.click('#clearBtn');
  // back to the empty state: hint visible again, canvas zero-sized
  await expect(page.locator('#emptyHint')).toBeVisible();
  await page.waitForFunction(() => {
    const c = document.getElementById('mosaic') as HTMLCanvasElement;
    return c.width === 0 && c.height === 0;
  });
  expect(errors).toEqual([]);
});
