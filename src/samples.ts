// Procedural sample images for Phase 0 legibility testing.
// Varied luminance structure + one classical Ethiopian icon-style sample
// to test the design direction.

export interface Sample {
  name: string;
  render: () => HTMLCanvasElement;
}

const SIZE = 256;

function canvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = SIZE;
  c.height = SIZE;
  return [c, c.getContext('2d')!];
}

function drawFace(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#e8ddc8';
  ctx.fillRect(0, 0, SIZE, SIZE);
  // shoulders
  ctx.fillStyle = '#2b2420';
  ctx.beginPath();
  ctx.moveTo(0, SIZE);
  ctx.lineTo(70, 150);
  ctx.lineTo(186, 150);
  ctx.lineTo(SIZE, SIZE);
  ctx.closePath();
  ctx.fill();
  // hair
  ctx.fillStyle = '#221a14';
  ctx.beginPath();
  ctx.arc(128, 108, 62, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(66, 100, 124, 14);
  // face
  ctx.fillStyle = '#c89b6a';
  ctx.beginPath();
  ctx.ellipse(128, 140, 46, 60, 0, 0, Math.PI * 2);
  ctx.fill();
  // neck
  ctx.fillRect(114, 180, 28, 26);
  // eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(110, 134, 11, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(146, 134, 11, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1d120a';
  ctx.beginPath();
  ctx.ellipse(110, 135, 5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(146, 135, 5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // brows
  ctx.fillStyle = '#221a14';
  ctx.fillRect(98, 120, 26, 5);
  ctx.fillRect(132, 120, 26, 5);
  // nose
  ctx.beginPath();
  ctx.moveTo(128, 138);
  ctx.lineTo(123, 158);
  ctx.lineTo(133, 158);
  ctx.closePath();
  ctx.fill();
  // mouth
  ctx.fillRect(116, 172, 24, 5);
}

function drawGradient(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  g.addColorStop(0, '#000');
  g.addColorStop(0.5, '#888');
  g.addColorStop(1, '#fff');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SIZE, SIZE);
}

function starPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, outer: number, inner: number): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawStar(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.fillStyle = '#111';
  starPath(ctx, 128, 128, 88, 40);
  ctx.fill();
}

function drawMountains(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(0, 0, 0, SIZE);
  g.addColorStop(0, '#e8e2d0');
  g.addColorStop(1, '#cfc4ae');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SIZE, SIZE);
  // sun
  ctx.fillStyle = '#c9a13a';
  ctx.beginPath();
  ctx.arc(192, 72, 30, 0, Math.PI * 2);
  ctx.fill();
  // far mountains
  ctx.fillStyle = '#6b6252';
  ctx.beginPath();
  ctx.moveTo(0, SIZE);
  ctx.lineTo(0, 170);
  ctx.lineTo(70, 80);
  ctx.lineTo(140, 180);
  ctx.lineTo(SIZE, SIZE);
  ctx.closePath();
  ctx.fill();
  // near mountains
  ctx.fillStyle = '#3d382e';
  ctx.beginPath();
  ctx.moveTo(120, SIZE);
  ctx.lineTo(190, 120);
  ctx.lineTo(SIZE, 200);
  ctx.lineTo(SIZE, SIZE);
  ctx.closePath();
  ctx.fill();
}

function drawJebena(ctx: CanvasRenderingContext2D): void {
  // Ethiopian coffee-pot silhouette on parchment
  ctx.fillStyle = '#efe6d2';
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.fillStyle = '#2a1d12';
  // body
  ctx.beginPath();
  ctx.ellipse(128, 196, 60, 46, 0, 0, Math.PI * 2);
  ctx.fill();
  // neck
  ctx.fillRect(116, 132, 24, 66);
  // flared rim
  ctx.beginPath();
  ctx.moveTo(104, 132);
  ctx.lineTo(152, 132);
  ctx.lineTo(142, 112);
  ctx.lineTo(114, 112);
  ctx.closePath();
  ctx.fill();
  // lid knob
  ctx.beginPath();
  ctx.arc(128, 104, 8, 0, Math.PI * 2);
  ctx.fill();
  // spout
  ctx.beginPath();
  ctx.moveTo(186, 180);
  ctx.lineTo(222, 196);
  ctx.lineTo(196, 208);
  ctx.lineTo(186, 200);
  ctx.closePath();
  ctx.fill();
  // handle
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#2a1d12';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(72, 190, 34, Math.PI / 2, Math.PI * 1.5);
  ctx.stroke();
}

function drawCross(ctx: CanvasRenderingContext2D): void {
  // Ethiopian-style cross silhouette
  ctx.fillStyle = '#efe6d2';
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.fillStyle = '#7a1f14';
  const cx = 128;
  const cy = 132;
  ctx.fillRect(cx - 9, cy - 52, 18, 104);
  ctx.fillRect(cx - 52, cy - 9, 104, 18);
  const tips: Array<[number, number]> = [
    [cx, cy - 62],
    [cx, cy + 62],
    [cx - 62, cy],
    [cx + 62, cy],
    [cx, cy],
  ];
  for (const [px, py] of tips) {
    ctx.beginPath();
    ctx.arc(px, py, 11, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawChecker(ctx: CanvasRenderingContext2D): void {
  const n = 8;
  const cell = SIZE / n;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? '#000' : '#fff';
      ctx.fillRect(c * cell, r * cell, cell, cell);
    }
  }
}

function drawIcon(ctx: CanvasRenderingContext2D): void {
  // Classical Ethiopian icon style: parchment + geometric border band,
  // halo, flat red robe, stylized frontal face with almond eyes.
  ctx.fillStyle = '#d9c79e';
  ctx.fillRect(0, 0, SIZE, SIZE);
  // manuscript-style border band
  ctx.strokeStyle = '#8a2b1d';
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, SIZE - 20, SIZE - 20);
  ctx.strokeStyle = '#b98a2f';
  ctx.lineWidth = 2;
  ctx.strokeRect(22, 22, SIZE - 44, SIZE - 44);
  // halo
  ctx.fillStyle = '#c9a13a';
  ctx.beginPath();
  ctx.arc(128, 108, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b98a2f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(128, 108, 54, 0, Math.PI * 2);
  ctx.stroke();
  // robe (flat deep red)
  ctx.fillStyle = '#8a2b1d';
  ctx.beginPath();
  ctx.moveTo(40, SIZE);
  ctx.lineTo(70, 150);
  ctx.lineTo(186, 150);
  ctx.lineTo(216, SIZE);
  ctx.closePath();
  ctx.fill();
  // face (flat ochre)
  ctx.fillStyle = '#c89b6a';
  ctx.beginPath();
  ctx.ellipse(128, 122, 40, 52, 0, 0, Math.PI * 2);
  ctx.fill();
  // almond eyes (large, classic)
  ctx.fillStyle = '#f2ead6';
  ctx.beginPath();
  ctx.ellipse(111, 116, 11, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(145, 116, 11, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1d120a';
  ctx.beginPath();
  ctx.ellipse(111, 117, 5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(145, 117, 5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // brows
  ctx.strokeStyle = '#1d120a';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(100, 106);
  ctx.lineTo(122, 102);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(156, 106);
  ctx.lineTo(134, 102);
  ctx.stroke();
  // nose line
  ctx.beginPath();
  ctx.moveTo(128, 124);
  ctx.lineTo(128, 142);
  ctx.stroke();
  // mouth
  ctx.beginPath();
  ctx.moveTo(117, 152);
  ctx.lineTo(139, 152);
  ctx.stroke();
  // hairline band
  ctx.fillStyle = '#3a2413';
  ctx.fillRect(92, 90, 72, 8);
}

export function getSamples(): Sample[] {
  return [
    { name: 'face', render: () => { const [c, x] = canvas(); drawFace(x); return c; } },
    { name: 'gradient', render: () => { const [c, x] = canvas(); drawGradient(x); return c; } },
    { name: 'star', render: () => { const [c, x] = canvas(); drawStar(x); return c; } },
    { name: 'mountains', render: () => { const [c, x] = canvas(); drawMountains(x); return c; } },
    { name: 'jebena', render: () => { const [c, x] = canvas(); drawJebena(x); return c; } },
    { name: 'cross', render: () => { const [c, x] = canvas(); drawCross(x); return c; } },
    { name: 'checker', render: () => { const [c, x] = canvas(); drawChecker(x); return c; } },
    { name: 'icon-classical', render: () => { const [c, x] = canvas(); drawIcon(x); return c; } },
  ];
}
