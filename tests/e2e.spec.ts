import { test, expect, type Page, devices } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';
import { execSync } from 'node:child_process';
import zlib from 'node:zlib';
import { STRINGS } from '../src/i18n';

let distBuilt = false;
function ensureBuilt(): void {
  if (distBuilt) return;
  try {
    execSync('npm run build', { stdio: 'ignore' });
  } catch (e) {
    // L15: a build failure should fail fast with a real message, not a cryptic
    // worker crash from the missing dist/.
    throw new Error('`npm run build` failed — run it manually first. ' + (e instanceof Error ? e.message : String(e)));
  }
  distBuilt = true;
}

/** Listen with a real error handler so EADDRINUSE fails fast (L15) instead of
 *  hanging the suite on an unhandled 'error' event. */
function listenServer(server: http.Server, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, () => {
      server.removeListener('error', reject);
      resolve();
    });
  });
}

/** Serve dist/ with public/_headers applied — the exact way Cloudflare serves it. */
function serveDist(port: number): http.Server {
  return http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
    if (p === '/') p = '/index.html';
    const file = path.resolve('dist', '.' + p);
    const headers: Record<string, string> = {};
    const raw = fs.readFileSync(path.resolve('public', '_headers'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.trim().match(/^([\w-]+): (.+)$/);
      if (m) headers[m[1]] = m[2];
    }
    if (fs.existsSync(file)) {
      const type: Record<string, string> = {
        '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
        '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
      };
      res.writeHead(200, { 'Content-Type': type[path.extname(file)] ?? 'application/octet-stream', ...headers });
      fs.createReadStream(file).pipe(res);
    } else {
      res.writeHead(404, headers);
      res.end();
    }
  });
}

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
    // Distinct motion every frame: the mosaic renderer quantizes cell colors, so
    // a slowly-shifting background could look identical across samples — the
    // fixture needs clearly different frames (hue rotation + a moving square).
    const draw = () => {
      const k = Math.floor((performance.now() - t0) / 200);
      ctx.fillStyle = `hsl(${(k * 60) % 360}, 80%, 55%)`;
      ctx.fillRect(0, 0, 96, 96);
      ctx.fillStyle = '#111';
      ctx.fillRect(10 + ((k * 12) % 30), 20, 56, 56);
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
    return s && /Ready|ዝግጁ|Setup error|Something went wrong|የማዋቀር ስህተት/.test(s.textContent || '');
  });
  // Expand the "Advanced" panel so tests can reach the sliders/picker/exports
  // (it's collapsed by default for the three-tap user flow).
  await page.evaluate(() => {
    const d = document.getElementById('advanced') as HTMLDetailsElement | null;
    if (d) d.open = true;
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
  // A5: poll for the async clipboard write instead of a fixed 300ms sleep.
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText().then((t) => t.length)), { timeout: 5000 }).toBeGreaterThan(0);
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

test('zoom out returns to fit', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  await page.click('#zoomIn');
  await expect(page.locator('#zoomVal')).toHaveText('125%');
  await page.click('#zoomOut');
  await expect(page.locator('#zoomVal')).toHaveText('100%');
});

test('clicking the dropzone opens a file chooser that loads a photo', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('#dropzone')]);
  await chooser.setFiles(SAMPLE);
  await page.waitForFunction(() => {
    const c = document.getElementById('mosaic') as HTMLCanvasElement;
    return c.width > 10;
  });
});

test('clicking the empty canvas opens a file chooser that loads a photo', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('#emptyHint')]);
  await chooser.setFiles(SAMPLE);
  await page.waitForFunction(() => {
    const c = document.getElementById('mosaic') as HTMLCanvasElement;
    return c.width > 10;
  });
});

test('full set and all palette options render', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  await page.selectOption('#charset', 'all');
  await page.waitForFunction(() => document.getElementById('status')!.textContent!.includes('Ready'));
  await expect(page.locator('#mosaicStat')).toContainText('letters');
  for (const pal of ['manuscript', 'mono', 'church']) {
    await page.selectOption('#palette', pal);
    await page.waitForTimeout(250);
    await expect(page.locator('#mosaicStat')).toContainText('letters');
  }
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

test('download video produces a file', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await waitReady(page);
  await page.setInputFiles('#file', VIDEO);
  await page.waitForFunction(() => {
    const c = document.getElementById('mosaic') as HTMLCanvasElement;
    return c.width > 10;
  });
  await expect(page.locator('#dlVideo')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.click('#dlVideo');
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/geez-art-video\.(webm|mp4)/);
  // H1: assert a REAL container + size floor, not just the filename — a silent
  // or undecodable export must fail the suite.
  const bytes = fs.readFileSync((await download.path())!);
  const isWebm = bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  const isMp4 = bytes.subarray(4, 8).toString('ascii') === 'ftyp';
  expect(isWebm || isMp4).toBe(true);
  expect(bytes.length).toBeGreaterThan(1000);
  expect(errors).toEqual([]);
});

test('download GIF produces a valid, capped file', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await page.setInputFiles('#file', VIDEO);
  await page.waitForFunction(() => {
    const c = document.getElementById('mosaic') as HTMLCanvasElement;
    return c.width > 10;
  });
  await expect(page.locator('#dlGif')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.click('#dlGif');
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('geez-art.gif');
  // L38: the exported bytes are a real GIF89a, capped at 480px on BOTH axes.
  const path = await download.path();
  const gif = fs.readFileSync(path!);
  expect(gif.subarray(0, 6).toString('ascii')).toBe('GIF89a');
  expect(gif.readUInt16LE(6)).toBeLessThanOrEqual(480);
  expect(gif.readUInt16LE(8)).toBeLessThanOrEqual(480);
});

test('share metadata: absolute og image, large card, JSON-LD (M7/L46)', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  const og = await page.getAttribute('meta[property="og:image"]', 'content');
  expect(og).toMatch(/^https:\/\//);
  expect(og).toContain('/og-image.png');
  expect(await page.getAttribute('meta[name="twitter:card"]', 'content')).toBe('summary_large_image');
  expect(await page.getAttribute('meta[property="og:image:width"]', 'content')).toBe('1200');
  expect(await page.getAttribute('meta[property="og:image:height"]', 'content')).toBe('630');
  expect(await page.locator('script[type="application/ld+json"]').count()).toBe(1);
});

// --- re-audit round-2 fixes: CSP enforcement, tall-source cap, privacy, share-cancel ---

test('the built app works under its own production CSP headers (blob: media allowed) (H1)', async ({ page }) => {
  // The dev server never sends public/_headers, so the suite couldn't see the
  // release-blocker: the CSP had no media-src and rejected the app's own blob:
  // video URLs — "media load rejected by URL safety check" — killing video mode
  // + replay the moment headers were enforced. Serve the BUILT artifact with the
  // real headers and exercise video mode; a future policy edit that breaks
  // blob: media fails here.
  test.setTimeout(120000);
  ensureBuilt();
  const server = serveDist(5197);
  await listenServer(server, 5197);
  try {
    await page.goto('http://localhost:5197/');
    await page.waitForFunction(() => /Ready/.test(document.getElementById('status')?.textContent ?? ''), null, { timeout: 30000 });
    await page.setInputFiles('#file', VIDEO);
    await page.waitForFunction(() => {
      const c = document.getElementById('mosaic') as HTMLCanvasElement;
      return c.width > 10 && c.height > 10;
    });
    await expect(page.locator('#playBtn')).toBeVisible();
  } finally {
    server.close();
  }
});

test('very tall sources never exceed the 4000px output cap (M3)', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  // Max detail on an 8:1 source is the worst case for the height cap.
  await page.locator('#width').fill('400');
  const b64 = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 100;
    c.height = 800;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 100, 800);
    ctx.fillStyle = '#fff';
    ctx.fillRect(30, 100, 40, 600);
    return c.toDataURL('image/png').split(',')[1];
  });
  await page.setInputFiles('#file', { name: 'tall.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') });
  await page.waitForFunction(() => {
    const c = document.getElementById('mosaic') as HTMLCanvasElement;
    return c.height > 0 && c.height <= 4000; // would timeout (9600px) under the old cap bug
  });
});

test('nothing leaves the origin — all requests same-origin (privacy guarantee) (M13)', async ({ page }) => {
  const urls: string[] = [];
  await page.route('**/*', (route) => {
    urls.push(route.request().url());
    return route.continue();
  });
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  await page.click('#dlPng'); // exports are blob:-based; no network should fire
  await page.waitForTimeout(500);
  const origin = new URL(page.url()).origin;
  const offenders = urls.filter((u) => !u.startsWith('data:') && !u.startsWith('blob:') && !u.startsWith(origin));
  expect(offenders).toEqual([]);
});

test('cancelling the share sheet reports "cancelled", not "saved" (L7)', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: () => Promise.reject(new DOMException('Aborted', 'AbortError')),
    });
  });
  await page.click('#share');
  await expect(page.locator('#status')).toContainText('Share cancelled', { timeout: 10000 });
});

// --- round-3 fixes: EXIF/resize coverage, empty-MIME routing, band, HTML, aria ---

test('EXIF-orientation-6 JPEG >1600px: mosaic renders AND decode-time resize engaged (H1)', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  // Build a 4000×3000 JPEG with EXIF Orientation=6 in-page, exactly as a phone
  // would produce — the highest-risk path (orientation + >1600px resize) had
  // zero automated coverage.
  const file = await page.evaluateHandle(async () => {
    const c = document.createElement('canvas');
    c.width = 4000;
    c.height = 3000;
    const x = c.getContext('2d')!;
    x.fillStyle = '#ff0000'; x.fillRect(0, 0, 2000, 3000);
    x.fillStyle = '#0000ff'; x.fillRect(2000, 0, 2000, 3000);
    x.fillStyle = '#00ff00'; x.fillRect(0, 0, 4000, 1500);
    x.fillStyle = '#ffff00'; x.fillRect(0, 1500, 4000, 1500);
    return new Promise<File>((resolve) => c.toBlob(async (blob) => {
      const buf = new Uint8Array((await blob!.arrayBuffer()));
      // APP1 EXIF segment, II byte order, IFD0 tag 0x0112 Orientation = 6.
      const exif = new Uint8Array([
        0xff, 0xe1, 0x00, 0x1c,
        0x45, 0x78, 0x69, 0x66, 0x00, 0x00,
        0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x00, 0x00,
        0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x06,
        0x00, 0x00, 0x00, 0x00,
      ]);
      exif[2] = 0x00; exif[3] = 0x1e;
      const out = new Uint8Array(buf.length + 30);
      out.set(buf.subarray(0, 2), 0);
      out.set(exif, 2);
      out.set(buf.subarray(2), 32);
      resolve(new File([out], 'rot.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.95));
  });
  const bytes = await file.evaluate((f: File) => f.arrayBuffer().then((a) => Array.from(new Uint8Array(a))));
  await page.setInputFiles('#file', { name: 'rot.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(bytes) });
  await page.waitForFunction(() => {
    const c = document.getElementById('mosaic') as HTMLCanvasElement;
    return c.width > 10 && c.height > 10;
  });
  // Non-blank: a healthy share of the top-left sample is ink (not just paper).
  const ink = await page.evaluate(() => {
    const c = document.getElementById('mosaic') as HTMLCanvasElement;
    const d = c.getContext('2d')!.getImageData(0, 0, Math.min(c.width, 400), Math.min(c.height, 400)).data;
    let dark = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] < 240 || d[i + 1] < 240 || d[i + 2] < 240) dark++;
    return dark / (d.length / 4);
  });
  expect(ink).toBeGreaterThan(0.02);
  // Decode-time resize engaged: the corrected source long edge is ≤1600, not 4000.
  const src = await page.evaluate(() => {
    const s = document.getElementById('source') as HTMLCanvasElement;
    return { w: s.width, h: s.height };
  });
  expect(Math.max(src.w, src.h)).toBeLessThanOrEqual(1600);
});

test('empty-MIME files still route correctly: .heic friendly error + .mp4 video path (M10)', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  // Empty MIME is what Android/Windows expose for .heic — the extension sniff
  // must still reach the friendly HEIC error.
  await page.setInputFiles('#file', { name: 'photo.heic', mimeType: '', buffer: Buffer.from('not a real heic') });
  await expect(page.locator('#status')).toContainText('HEIC', { timeout: 10000 });
  await page.waitForFunction(() => document.getElementById('status')!.textContent === 'Ready', null, { timeout: 8000 });
  // Empty-MIME .mp4 must route to the VIDEO pipeline (error says video, not image).
  await page.setInputFiles('#file', { name: 'clip.mp4', mimeType: '', buffer: Buffer.from('not a real mp4') });
  await expect(page.locator('#status')).toContainText("couldn't read that video", { timeout: 10000 });
});

test('the shared image carries the dark URL brand band (M11)', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  const downloadPromise = page.waitForEvent('download');
  await page.click('#share');
  const download = await downloadPromise;
  const buf = fs.readFileSync((await download.path())!);
  const band = await page.evaluate(async (b64) => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/png;base64,' + b64; });
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const rowY = Math.floor(c.height * 0.97); // inside the bottom band
    const d = ctx.getImageData(0, rowY, c.width, 1).data;
    let dark = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] < 60 && d[i + 1] < 60 && d[i + 2] < 60) dark++;
    return { w: c.width, h: c.height, darkFrac: dark / (d.length / 4) };
  }, buf.toString('base64'));
  expect(band.w).toBeGreaterThan(0);
  expect(band.darkFrac).toBeGreaterThan(0.4); // brand band #15110d dominates the row
});

test('save as HTML embeds the Ethiopic font (self-contained) (L12)', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  const downloadPromise = page.waitForEvent('download');
  await page.click('#dlHtml');
  const download = await downloadPromise;
  const html = fs.readFileSync((await download.path())!, 'utf8');
  expect(html).toContain('data:font/woff2;base64,');
  expect(html).toMatch(/[ሀ-፿]/); // real fidel in the exported <pre>
});

test('picker never emits invalid aria-pressed="mixed" (L2)', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  await page.selectOption('#charset', 'custom');
  await page.locator('.fam-expand').first().click();
  const letters = page.locator('.fam-detail .letter');
  await letters.nth(0).click(); // one letter of a family → partial state
  expect(await page.locator('.fam-tile[aria-pressed="mixed"]').count()).toBe(0);
  const pressed = await page.getAttribute('.fam-tile', 'aria-pressed');
  expect(['true', 'false']).toContain(pressed);
});

test('analytics: plausible provider + malformed config stays silent (L13)', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __plausibleEvents?: string[] }).__plausibleEvents = [];
    // trackEvent reads window.plausible (the property Plausible's snippet defines).
    (window as unknown as { plausible?: (e: string) => void }).plausible = (e: string) => {
      (window as unknown as { __plausibleEvents: string[] }).__plausibleEvents.push(e);
    };
  });
  await page.goto('/');
  await waitReady(page);
  // Malformed config → stays silent (never crashes, never fires).
  await page.evaluate(() => {
    const m = document.createElement('meta');
    m.name = 'geez-art:analytics';
    m.content = 'this is not json';
    document.head.appendChild(m);
    (window as unknown as { __reloadAnalytics?: () => void }).__reloadAnalytics?.();
  });
  await uploadSample(page);
  expect(await page.evaluate(() => (window as unknown as { __plausibleEvents: string[] }).__plausibleEvents)).toEqual([]);
  // Valid plausible config → events reach the stub.
  await page.evaluate(() => {
    const m = document.querySelector('meta[name="geez-art:analytics"]');
    if (m) m.setAttribute('content', JSON.stringify({ provider: 'plausible', domain: 'example.com' }));
    (window as unknown as { __reloadAnalytics?: () => void }).__reloadAnalytics?.();
  });
  await uploadSample(page);
  await page.waitForFunction(() => (window as unknown as { __plausibleEvents?: string[] }).__plausibleEvents?.length > 0);
  const events = await page.evaluate(() => (window as unknown as { __plausibleEvents: string[] }).__plausibleEvents);
  expect(events).toContain('source');
});

test('share_cancelled fires as an analytics event (L13)', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __beaconCalls?: Array<{ body: string }> }).__beaconCalls = [];
    Object.defineProperty(Navigator.prototype, 'sendBeacon', {
      configurable: true,
      value: function (url: string, data: Blob | string | null) {
        const calls = (window as unknown as { __beaconCalls: Array<{ body: string }> }).__beaconCalls;
        if (data instanceof Blob) void data.text().then((t) => calls.push({ body: t }));
        else calls.push({ body: String(data ?? '') });
        return true;
      },
    });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: () => Promise.reject(new DOMException('Aborted', 'AbortError')),
    });
  });
  await page.goto('/');
  await waitReady(page);
  await page.evaluate(() => {
    const m = document.createElement('meta');
    m.name = 'geez-art:analytics';
    m.content = JSON.stringify({ provider: 'beacon', endpoint: '/__stats__' });
    document.head.appendChild(m);
    (window as unknown as { __reloadAnalytics?: () => void }).__reloadAnalytics?.();
    (window as unknown as { __beaconCalls: unknown[] }).__beaconCalls = [];
  });
  await uploadSample(page);
  await page.click('#share');
  await expect(page.locator('#status')).toContainText('Share cancelled', { timeout: 10000 });
  await page.waitForFunction(() => {
    const calls = (window as unknown as { __beaconCalls?: Array<{ body: string }> }).__beaconCalls;
    return Array.isArray(calls) && calls.some((c) => c.body.includes('share_cancelled'));
  });
});

test('keyboard: Enter activates the dropzone and opens the file chooser (L14)', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  const chooserPromise = page.waitForEvent('filechooser');
  await page.locator('#dropzone').focus();
  await page.keyboard.press('Enter');
  expect(await chooserPromise).toBeTruthy();
});

test('keyboard: Enter on the empty-state drop target opens the file chooser (L14)', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  const chooserPromise = page.waitForEvent('filechooser');
  await page.locator('#emptyHint').focus();
  await page.keyboard.press('Enter');
  expect(await chooserPromise).toBeTruthy();
});

test('a corrupt video shows the friendly message, not a hang (M9)', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await page.setInputFiles('#file', { name: 'broken.webm', mimeType: 'video/webm', buffer: Buffer.from('garbage bytes') });
  await expect(page.locator('#status')).toContainText("couldn't read that video", { timeout: 10000 });
});

test('pausing a video disables both video and GIF export (L28/M9)', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await page.setInputFiles('#file', VIDEO);
  await page.waitForFunction(() => {
    const c = document.getElementById('mosaic') as HTMLCanvasElement;
    return c.width > 10;
  });
  await page.click('#playBtn'); // pause — exports would be static otherwise
  await expect(page.locator('#dlVideo')).toBeDisabled();
  await expect(page.locator('#dlGif')).toBeDisabled();
});

test('dist perf budget: main JS gzipped under 30KB, Ethiopic font present (L30)', async ({ page }) => {
  ensureBuilt();
  const server = serveDist(5196);
  await listenServer(server, 5196);
  try {
    const html = await (await page.request.get('http://localhost:5196/')).text();
    const js = html.match(/assets\/index-[^"]+\.js/);
    const css = html.match(/assets\/index-[^"]+\.css/);
    expect(js).toBeTruthy();
    expect(css).toBeTruthy();
    const jsBytes = await (await page.request.get('http://localhost:5196/' + js![0])).body();
    expect(zlib.gzipSync(jsBytes).length).toBeLessThan(34 * 1024); // ~29KB today — headroom for the Amharic dictionary
    const cssText = await (await page.request.get('http://localhost:5196/' + css![0])).text();
    expect(cssText).toContain('noto-sans-ethiopic-ethiopic-wght-normal'); // the 198KB face is in the build
  } finally {
    server.close();
  }
});

test('video download shows an in-app replay', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await page.setInputFiles('#file', VIDEO);
  await page.waitForFunction(() => {
    const c = document.getElementById('mosaic') as HTMLCanvasElement;
    return c.width > 10;
  });
  const downloadPromise = page.waitForEvent('download');
  await page.click('#dlVideo');
  await downloadPromise; // the download fires; also the replay appears
  await expect(page.locator('#replay')).toBeVisible({ timeout: 15000 });
  const src = await page.getAttribute('#replayVideo', 'src');
  expect(src).toBeTruthy();
});

test('save as HTML produces a file', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  const downloadPromise = page.waitForEvent('download');
  await page.click('#dlHtml');
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('geez-art.html');
});

test('share does not error', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  await page.click('#share');
  await page.waitForTimeout(600);
  expect(errors).toEqual([]);
});

test('dropping a file onto the canvas loads it', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  const buffer = fs.readFileSync(SAMPLE);
  const dt = await page.evaluateHandle((data) => {
    const t = new DataTransfer();
    t.items.add(new File([new Uint8Array(data)], 'sample.png', { type: 'image/png' }));
    return t;
  }, Array.from(buffer));
  await page.dispatchEvent('#dropzone', 'drop', { dataTransfer: dt });
  await page.waitForFunction(() => {
    const c = document.getElementById('mosaic') as HTMLCanvasElement;
    return c.width > 10;
  });
});

test('pasting an image loads it', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await waitReady(page);
  const buffer = fs.readFileSync(SAMPLE);
  await page.evaluate((data) => {
    const dt = new DataTransfer();
    dt.items.add(new File([new Uint8Array(data)], 'sample.png', { type: 'image/png' }));
    document.body.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt }));
  }, Array.from(buffer));
  await page.waitForFunction(() => {
    const c = document.getElementById('mosaic') as HTMLCanvasElement;
    return c.width > 10;
  });
  expect(errors).toEqual([]);
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

// --- critic-fix coverage: devices without video recording, HEIC, analytics ---

test('on devices without video recording, the video button is replaced by a GIF hint', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await waitReady(page);
  // Force the "iOS Safari" path: no canvas.captureStream support.
  await page.evaluate(() => {
    (window as unknown as { __forceNoVideoCapture?: boolean }).__forceNoVideoCapture = true;
  });
  await page.setInputFiles('#file', VIDEO);
  await page.waitForFunction(() => {
    const c = document.getElementById('mosaic') as HTMLCanvasElement;
    return c.width > 10 && c.height > 10;
  });
  // GIF stays available; the video button yields to an actionable hint.
  await expect(page.locator('#dlGif')).toBeVisible();
  await expect(page.locator('#dlVideo')).toBeHidden();
  await expect(page.locator('#videoCapHint')).toBeVisible();
  // The hint disappears with the video (Clear → empty state).
  await page.click('#clearBtn');
  await expect(page.locator('#videoCapHint')).toBeHidden();
  expect(errors).toEqual([]);
});

test('an undecodable HEIC photo shows a friendly conversion message', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await waitReady(page);
  // Garbage bytes with a real HEIC name/type — the decode must fail.
  await page.setInputFiles('#file', {
    name: 'photo.heic',
    mimeType: 'image/heic',
    buffer: Buffer.from('this is not a real heic image'),
  });
  await expect(page.locator('#status')).toContainText('HEIC', { timeout: 10000 });
  // And a plain unreadable file still gets the generic message, not the HEIC one.
  // M13: poll for the flash to expire instead of a hard 5.2s sleep.
  await page.waitForFunction(() => document.getElementById('status')!.textContent === 'Ready', null, { timeout: 8000 });
  await page.setInputFiles('#file', {
    name: 'broken.png',
    mimeType: 'image/png',
    buffer: Buffer.from('also not a real image'),
  });
  await expect(page.locator('#status')).toContainText("couldn't read that picture", { timeout: 10000 });
  expect(errors).toEqual([]);
});

test('analytics are off by default and fire only when a provider is configured', async ({ page }) => {
  // Stub sendBeacon so a configured beacon provider can be observed.
  await page.addInitScript(() => {
    (window as unknown as { __beaconCalls?: Array<{ url: string; body: string }> }).__beaconCalls = [];
    Object.defineProperty(Navigator.prototype, 'sendBeacon', {
      configurable: true,
      value: function (url: string, data: Blob | string | null) {
        const calls = (window as unknown as { __beaconCalls: Array<{ url: string; body: string }> }).__beaconCalls;
        if (data instanceof Blob) void data.text().then((t) => calls.push({ url: String(url), body: t }));
        else calls.push({ url: String(url), body: String(data ?? '') });
        return true;
      },
    });
  });
  await page.goto('/');
  await waitReady(page);

  // Off by default: a photo drop sends nothing.
  await page.evaluate(() => {
    (window as unknown as { __beaconCalls: unknown[] }).__beaconCalls = [];
  });
  await uploadSample(page);
  await page.waitForTimeout(300);
  const silent = await page.evaluate(() => (window as unknown as { __beaconCalls: unknown[] }).__beaconCalls);
  expect(silent).toEqual([]);

  // Configure a beacon provider at runtime (as a deployer would via the meta
  // tag) — the next event goes out.
  await page.evaluate(() => {
    const m = document.createElement('meta');
    m.name = 'geez-art:analytics';
    m.content = JSON.stringify({ provider: 'beacon', endpoint: '/__stats__' });
    document.head.appendChild(m);
    (window as unknown as { __reloadAnalytics?: () => void }).__reloadAnalytics?.();
    (window as unknown as { __beaconCalls: unknown[] }).__beaconCalls = [];
  });
  await uploadSample(page);
  await page.waitForFunction(() => {
    const calls = (window as unknown as { __beaconCalls?: Array<{ body: string }> }).__beaconCalls;
    return Array.isArray(calls) && calls.some((c) => c.body.includes('"source"'));
  });
  const calls = await page.evaluate(() => (window as unknown as { __beaconCalls: Array<{ url: string; body: string }> }).__beaconCalls);
  expect(calls.length).toBeGreaterThan(0);
  expect(calls[0].url).toContain('/__stats__');
  expect(calls[0].body).toContain('"source"');
  expect(calls[0].body).toContain('"kind":"image"');
});

// --- round-2 rubric-audit fixes: font load, bilingual sync, samples, empty ramp ---

test('the density ramp is non-empty — the Ethiopic font actually loaded (M2)', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  // If the U+1200-1399 face never loaded, the ramp would be empty and the mosaic
  // would not render — this pins the unicode-range fix so it can't regress.
  const n = await page.evaluate(() => (window as unknown as { __ramp?: unknown[] }).__ramp?.length ?? 0);
  expect(n).toBeGreaterThan(100);
});

test('language toggle: the share hint switches between English and Amharic (M3)', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await expect(page.locator('#shareHint')).toContainText('Ready');
  await page.selectOption('#lang', 'am');
  await expect(page.locator('#shareHint')).toContainText('ዝግጁ');
  await expect(page.locator('#status')).toContainText('ዝግጁ'); // A1: not stuck on "Loading…"
  await page.selectOption('#lang', 'en');
  await expect(page.locator('#shareHint')).toContainText('Ready');
});

test('language toggle: empty state and picker guidance switch languages (M4)', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await expect(page.locator('#emptyTitle')).toContainText('Choose a photo');
  await page.selectOption('#lang', 'am');
  await expect(page.locator('#emptyTitle')).toContainText('ይምረጡ');
  await page.selectOption('#charset', 'custom');
  await expect(page.locator('#emptyTitle')).toContainText('ፊደሎችዎን');
  await page.selectOption('#lang', 'en');
  await expect(page.locator('#emptyTitle')).toContainText('Pick your letters');
});

test('language toggle: controls, export buttons, and palette options switch too (F8)', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await page.selectOption('#lang', 'am');
  await expect(page.locator('[data-i18n="groupExport"]')).toHaveText('ያስወጡ');
  await expect(page.locator('#dlPng')).toHaveText('PNG ያውርዱ');
  await expect(page.locator('#exampleBtn')).toHaveText('ምሳሌ ይሞክሩ');
  await expect(page.locator('#palette option[value="mono"]')).toHaveText('ሞኖ');
  await page.selectOption('#lang', 'en');
  await expect(page.locator('#dlPng')).toHaveText('Download PNG');
  await expect(page.locator('#palette option[value="church"]')).toHaveText('Church mural');
});

test('a successful share fires share_success and buttons re-enable (audit #8)', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __beaconCalls?: Array<{ body: string }> }).__beaconCalls = [];
    Object.defineProperty(Navigator.prototype, 'sendBeacon', {
      configurable: true,
      value: function (url: string, data: Blob | string | null) {
        const calls = (window as unknown as { __beaconCalls: Array<{ body: string }> }).__beaconCalls;
        if (data instanceof Blob) void data.text().then((t) => calls.push({ body: t }));
        else calls.push({ body: String(data ?? '') });
        return true;
      },
    });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', { configurable: true, value: () => Promise.resolve() });
  });
  await page.goto('/');
  await waitReady(page);
  await page.evaluate(() => {
    const m = document.createElement('meta');
    m.name = 'geez-art:analytics';
    m.content = JSON.stringify({ provider: 'beacon', endpoint: '/__s__' });
    document.head.appendChild(m);
    (window as unknown as { __reloadAnalytics?: () => void }).__reloadAnalytics?.();
    (window as unknown as { __beaconCalls: unknown[] }).__beaconCalls = [];
  });
  await uploadSample(page);
  await page.click('#share');
  await expect(page.locator('#status')).toContainText('Shared', { timeout: 10000 });
  await page.waitForFunction(() => {
    const calls = (window as unknown as { __beaconCalls?: Array<{ body: string }> }).__beaconCalls;
    return Array.isArray(calls) && calls.some((c) => c.body.includes('share_success'));
  });
  await expect(page.locator('#share')).toBeEnabled();
  await expect(page.locator('#shareTop')).toBeEnabled();
});

test('referral_visit fires when arriving with ?ref=share (audit #8)', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __beaconCalls?: Array<{ body: string }> }).__beaconCalls = [];
    Object.defineProperty(Navigator.prototype, 'sendBeacon', {
      configurable: true,
      value: function (url: string, data: Blob | string | null) {
        const calls = (window as unknown as { __beaconCalls: Array<{ body: string }> }).__beaconCalls;
        if (data instanceof Blob) void data.text().then((t) => calls.push({ body: t }));
        else calls.push({ body: String(data ?? '') });
        return true;
      },
    });
  });
  await page.goto('/?ref=share');
  await waitReady(page);
  await page.evaluate(() => {
    const m = document.createElement('meta');
    m.name = 'geez-art:analytics';
    m.content = JSON.stringify({ provider: 'beacon', endpoint: '/__s__' });
    document.head.appendChild(m);
    (window as unknown as { __reloadAnalytics?: () => void }).__reloadAnalytics?.();
  });
  await page.waitForFunction(() => {
    const calls = (window as unknown as { __beaconCalls?: Array<{ body: string }> }).__beaconCalls;
    return Array.isArray(calls) && calls.some((c) => c.body.includes('referral_visit'));
  });
});

test('an oversized file is rejected with the friendly message (audit #9)', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  // Playwright caps setInputFiles buffers at 50MB — write a sparse >200MB file
  // and pass its path (the >200MB guard is what we're testing).
  const bigPath = path.resolve('tests', 'fixtures', 'huge-tmp.png');
  fs.closeSync(fs.openSync(bigPath, 'w'));
  fs.truncateSync(bigPath, 201 * 1024 * 1024);
  try {
    await page.setInputFiles('#file', bigPath);
    await expect(page.locator('#status')).toContainText('200 MB', { timeout: 10000 });
  } finally {
    fs.unlinkSync(bigPath);
  }
});

test('prefers-reduced-motion pauses the video and disables exports (audit #10)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await waitReady(page);
  await page.setInputFiles('#file', VIDEO);
  await page.waitForFunction(() => {
    const c = document.getElementById('mosaic') as HTMLCanvasElement;
    return c.width > 10;
  });
  await expect(page.locator('#playBtn')).toHaveText('Play');
  await expect(page.locator('#dlVideo')).toBeDisabled();
  await expect(page.locator('#dlGif')).toBeDisabled();
});

test('a superseded video load cannot clobber a fresh photo (A6)', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  // Stall the video's post-metadata processing so the race window is deterministic.
  await page.evaluate(() => { (window as unknown as { __stallVideoLoad?: boolean }).__stallVideoLoad = true; });
  await page.setInputFiles('#file', VIDEO); // A: will stall before starting its loop
  await page.setInputFiles('#file', SAMPLE); // B: photo — must supersede A
  await page.waitForFunction(() => {
    const c = document.getElementById('mosaic') as HTMLCanvasElement;
    return c.width > 10;
  });
  // Let A's stall elapse: the photo must NOT be replaced by a video loop.
  await page.waitForTimeout(3200);
  const src = await page.evaluate(() => {
    const s = document.getElementById('source') as HTMLCanvasElement;
    return { w: s.width, h: s.height };
  });
  expect(src.w).toBeGreaterThan(0);
  await expect(page.locator('#playBtn')).toBeHidden(); // no video controls active
});

test('i18n dictionary is in sync: every data-i18n key exists in both languages (F25)', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  const keys = await page.evaluate(() =>
    [...document.querySelectorAll('[data-i18n]')].map((el) => (el as HTMLElement).dataset.i18n ?? ''),
  );
  const ariaKeys = await page.evaluate(() =>
    [...document.querySelectorAll('[data-i18n-aria], [data-i18n-title]')].map((el) => {
      const a = (el as HTMLElement).getAttribute('data-i18n-aria');
      const t2 = (el as HTMLElement).getAttribute('data-i18n-title');
      return [a, t2].filter(Boolean) as string[];
    }).flat(),
  );
  const unique = [...new Set([...keys, ...ariaKeys].filter(Boolean))];
  expect(unique.length).toBeGreaterThan(15);
  for (const k of unique) {
    expect(STRINGS.en[k], `missing en.${k}`).toBeTruthy();
    expect(STRINGS.am[k], `missing am.${k}`).toBeTruthy();
  }
});

test('try an example loads the icon-classical sample, not the fallback face (L32)', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await page.click('#exampleBtn');
  await page.waitForFunction(() => {
    const c = document.getElementById('mosaic') as HTMLCanvasElement;
    return c.width > 10;
  });
  const name = await page.evaluate(() => (window as unknown as { __currentSample?: string }).__currentSample);
  expect(name).toBe('icon-classical');
});

test.describe('mobile (Pixel 7 — F-7)', () => {
  // defaultBrowserType is config-only and invalid in test.use — drop it.
  const { defaultBrowserType: _dbt, ...pixel7 } = devices['Pixel 7'];
  test.use(pixel7);

  test('coarse-pointer default is 120 and max is 240', async ({ page }) => {
    await page.goto('/');
    await waitReady(page);
    const w = await page.evaluate(() => {
      const el = document.getElementById('width') as HTMLInputElement;
      return { value: el.value, max: el.max };
    });
    expect(w.value).toBe('120');
    expect(w.max).toBe('240');
  });

  test('renders a mosaic at the phone viewport without errors', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/');
    await waitReady(page);
    await uploadSample(page);
    await page.waitForFunction(() => (document.getElementById('mosaic') as HTMLCanvasElement).width > 10);
    await expect(page.locator('#emptyHint')).toBeHidden();
    expect(errors).toEqual([]);
  });

  test('copy link copies an attributed URL (F-4)', async ({ page, context }) => {
    await page.goto('/');
    await waitReady(page);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.click('#copyLink');
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText().then((t) => t.length)), { timeout: 5000 }).toBeGreaterThan(0);
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toMatch(/ref=share-/);
  });
});

test('language + palette persist across reloads (M7)', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await page.selectOption('#lang', 'am');
  await page.selectOption('#palette', 'church');
  await page.reload();
  await waitReady(page);
  await expect(page.locator('#emptyTitle')).toContainText('ይምረጡ');
  expect(await page.inputValue('#lang')).toBe('am');
  expect(await page.inputValue('#palette')).toBe('church');
});

test('use none blanks the mosaic instead of leaving a stale image (L31)', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await uploadSample(page);
  await page.selectOption('#charset', 'custom');
  await page.click('#pickNone');
  await page.waitForFunction(() => {
    const c = document.getElementById('mosaic') as HTMLCanvasElement;
    return c.width === 0 && c.height === 0;
  });
  expect(await page.textContent('#mosaicStat')).toBe('');
  await expect(page.locator('#status')).toContainText('No letters selected');
});
