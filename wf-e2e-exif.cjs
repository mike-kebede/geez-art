// End-to-end: upload a real EXIF-orientation-6 JPEG (>1600px) through the app's
// #file input and check whether the mosaic renders content or is blank/paper.
const { chromium } = require('@playwright/test');
const { spawn } = require('node:child_process');
const http = require('node:http');

const PORT = 5299;

function startDev() {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], {
      cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    p.stdout.on('data', (d) => { out += d; if (/ready/i.test(out)) resolve(p); });
    p.stderr.on('data', (d) => { out += d; });
    p.on('exit', (code) => reject(new Error('dev server exited code=' + code + ' out=' + out)));
    setTimeout(() => reject(new Error('dev server timeout: ' + out)), 30000);
  });
}

function waitReady(base, timeout = 30000) {
  const t0 = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      http.get(base, (r) => {
        r.resume();
        if (r.statusCode === 200) resolve();
        else if (Date.now() - t0 > timeout) reject(new Error('server not ready'));
        else setTimeout(tick, 200);
      }).on('error', () => {
        if (Date.now() - t0 > timeout) reject(new Error('server not ready'));
        else setTimeout(tick, 200);
      });
    };
    tick();
  });
}

// Build a JPEG with EXIF Orientation tag = 6. We draw a distinctive pattern on a
// 4000x3000 canvas, toBlob->jpeg, then inject an APP1 EXIF segment (II byte order)
// right after SOI with IFD0 tag 0x0112 = 6.
const BUILD_JPEG = `
function buildExifJpeg() {
  // left half RED / right half BLUE / top GREEN / bottom YELLOW
  const c = document.createElement('canvas');
  c.width = 4000; c.height = 3000;
  const x = c.getContext('2d');
  x.fillStyle = '#ff0000'; x.fillRect(0, 0, 2000, 3000);
  x.fillStyle = '#0000ff'; x.fillRect(2000, 0, 2000, 3000);
  x.fillStyle = '#00ff00'; x.fillRect(0, 0, 4000, 1500);
  x.fillStyle = '#ffff00'; x.fillRect(0, 1500, 4000, 1500);
  return new Promise((resolve) => c.toBlob(async (blob) => {
    const buf = new Uint8Array(await blob.arrayBuffer());
    // EXIF APP1: FFE1 len "Exif\0\0" TIFF header II*\0 + IFD0
    const exif = new Uint8Array([
      0xff, 0xe1,
      0x00, 0x1c,
      0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // "Exif\0\0"
      0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, // "II*\0" offset 8
      0x01, 0x00, 0x00, 0x00,             // 1 IFD entry
      0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x06, // Orientation=6 (SHORT)
      0x00, 0x00, 0x00, 0x00,             // next IFD offset
    ]);
    // APP1 total length = 2 (len) + exif bytes after marker (28)
    exif[3] = 28; // length includes the 2 length bytes? spec: length = size of payload after the length field
    // length field = 2 + payloadLen; payloadLen here is 28, so total 30 -> 0x001e
    exif[2] = 0x00; exif[3] = 0x1e;
    const out = new Uint8Array(buf.length + 30);
    out.set(buf.subarray(0, 2), 0);     // SOI FFD8
    out.set(exif, 2);                   // APP1 EXIF
    out.set(buf.subarray(2), 32);       // rest of jpeg
    resolve(new File([out], 'rot.jpg', { type: 'image/jpeg' }));
  }, 'image/jpeg', 0.95));
}
`;

(async () => {
  let server = null;
  try {
    server = await startDev();
    await waitReady('http://localhost:' + PORT);
  } catch (e) {
    console.error('dev server: ' + e.message);
    process.exit(1);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto('http://localhost:' + PORT + '/');
  await page.waitForFunction(() => {
    const s = document.getElementById('status');
    return s && /Ready|Setup error|Something went wrong/.test(s.textContent || '');
  }, { timeout: 30000 });

  // build the EXIF-6 jpeg in the page
  const file = await page.evaluateHandle(new Function(BUILD_JPEG + '; return buildExifJpeg();'));
  const real = await file.evaluate((f) => new Promise((res) => {
    const reader = new FileReader();
    reader.onload = () => res({ name: f.name, size: f.size, type: f.type });
    reader.readAsArrayBuffer(f);
  }));
  console.log('EXIF-6 JPEG built:', JSON.stringify(real));

  // Pull the raw bytes out of the built File and hand them to setInputFiles.
  const bytes = await file.evaluate((f) => f.arrayBuffer().then((a) => Array.from(new Uint8Array(a))));
  await page.setInputFiles('#file', { name: 'rot.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(bytes) });

  // wait for render
  await page.waitForFunction(() => {
    const c = document.getElementById('mosaic');
    return c && c.width > 10 && c.height > 10;
  }, { timeout: 30000 });

  const res = await page.evaluate(() => {
    const c = document.getElementById('mosaic');
    const ctx = c.getContext('2d');
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let ink = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] < 240 || d[i + 1] < 240 || d[i + 2] < 240) ink++;
    return { w: c.width, h: c.height, inkPct: (100 * ink / (c.width * c.height)).toFixed(1) };
  });
  console.log('MOSAIC after EXIF-6 upload:', JSON.stringify(res));
  console.log('console/page errors:', errors);

  await browser.close();
  server.kill();
})();
