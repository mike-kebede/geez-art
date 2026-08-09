// Generates tests/fixtures/sample.png — a 64×64 gradient PNG for the e2e tests.
const zlib = require('node:zlib');
const fs = require('node:fs');
const path = require('node:path');

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcBuf));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function makePng(w, h) {
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    const rs = y * (1 + w * 3);
    raw[rs] = 0; // filter: none
    for (let x = 0; x < w; x++) {
      const p = rs + 1 + x * 3;
      const hard = x >= 22 && x < 42 && y >= 22 && y < 42; // hard-edged dark square
      raw[p] = hard ? 24 : Math.round((255 * x) / w); // red gradient →
      raw[p + 1] = hard ? 24 : Math.round((255 * y) / h); // green gradient ↓
      raw[p + 2] = hard ? 24 : 120; // blue constant
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const out = path.resolve(__dirname, 'fixtures', 'sample.png');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, makePng(64, 64));
console.log('wrote', out);
