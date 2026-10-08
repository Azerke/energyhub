const fs = require('fs');
const zlib = require('zlib');

// CRC32 table for valid PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([length, typeBuf, data, crcBuf]);
}

function pointInPolygon(px, py, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// Render Walbo Power icon:
// - Deep emerald/slate background
// - Golden Sun with rays in the upper-right sky
// - Crisp white House silhouette in the center/foreground
// - Bright golden/amber Lightning Bolt inside the house
function sampleColor(nx, ny) {
  // Background gradient: deep emerald-slate (#064e3b to #0f172a)
  let r = Math.round(10 + (1 - ny) * 6);
  let g = Math.round(45 + (1 - ny) * 55);
  let b = Math.round(52 + ny * 20);

  // Subtle glowing circular badge behind the emblem
  const badgeDist = Math.hypot(nx - 0.5, ny - 0.52);
  if (badgeDist < 0.40) {
    const glow = Math.max(0, (0.40 - badgeDist) / 0.40);
    r = Math.min(255, Math.round(r + glow * 8));
    g = Math.min(255, Math.round(g + glow * 42));
    b = Math.min(255, Math.round(b + glow * 28));
  }

  // 1. SUN (upper right above the roof: center (0.66, 0.27))
  const sunCx = 0.66;
  const sunCy = 0.27;
  const sunR = 0.115;
  const dSun = Math.hypot(nx - sunCx, ny - sunCy);

  // Sun rays (8 rays radiating around sunCx, sunCy)
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const x1 = sunCx + Math.cos(angle) * (sunR + 0.025);
    const y1 = sunCy + Math.sin(angle) * (sunR + 0.025);
    const x2 = sunCx + Math.cos(angle) * (sunR + 0.068);
    const y2 = sunCy + Math.sin(angle) * (sunR + 0.068);
    if (distToSegment(nx, ny, x1, y1, x2, y2) <= 0.016) {
      r = 251;
      g = 191;
      b = 36; // #fbbf24
    }
  }

  // Sun disc
  if (dSun <= sunR) {
    r = 251;
    g = 191;
    b = 36; // #fbbf24
    if (dSun <= sunR * 0.75) {
      r = 253;
      g = 224;
      b = 71; // #fde047 bright core
    }
  }

  // 2. HOUSE SILHOUETTE
  // Pitched roof triangle + rectangular body
  const roofPoly = [
    [0.17, 0.50],
    [0.47, 0.22],
    [0.77, 0.50],
  ];
  const chimneyIn = nx >= 0.25 && nx <= 0.32 && ny >= 0.28 && ny <= 0.44;
  const bodyIn = nx >= 0.24 && nx <= 0.70 && ny >= 0.48 && ny <= 0.80;
  const inHouse = pointInPolygon(nx, ny, roofPoly) || bodyIn || chimneyIn;

  if (inHouse) {
    r = 255;
    g = 255;
    b = 255;
  }

  // Roof overhang line accent for crisp architectural look
  const dRoofLeft = distToSegment(nx, ny, 0.15, 0.51, 0.47, 0.21);
  const dRoofRight = distToSegment(nx, ny, 0.47, 0.21, 0.79, 0.51);
  if (dRoofLeft <= 0.022 || dRoofRight <= 0.022) {
    r = 255;
    g = 255;
    b = 255;
  }

  // 3. LIGHTNING BOLT (centered inside the house)
  const boltPoly = [
    [0.51, 0.35],
    [0.36, 0.57],
    [0.46, 0.57],
    [0.42, 0.76],
    [0.59, 0.52],
    [0.49, 0.52],
  ];

  // Dark outline around the bolt so it pops sharply against the white house
  let nearBolt = false;
  for (let i = 0; i < boltPoly.length; i++) {
    const [x1, y1] = boltPoly[i];
    const [x2, y2] = boltPoly[(i + 1) % boltPoly.length];
    if (distToSegment(nx, ny, x1, y1, x2, y2) <= 0.012) {
      nearBolt = true;
      break;
    }
  }

  if (nearBolt && inHouse) {
    r = 15;
    g = 23;
    b = 42; // Dark slate contrast border
  }

  if (pointInPolygon(nx, ny, boltPoly)) {
    r = 245;
    g = 158;
    b = 11; // #f59e0b vibrant amber-gold lightning bolt
  }

  return [r, g, b];
}

function generatePNG(width, height) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);

  // 2x2 supersampling for smooth anti-aliased edges
  const offsets = [
    [0.25, 0.25],
    [0.75, 0.25],
    [0.25, 0.75],
    [0.75, 0.75],
  ];

  for (let y = 0; y < height; y++) {
    const rowStart = y * stride;
    raw[rowStart] = 0; // filter type 0

    for (let x = 0; x < width; x++) {
      let rSum = 0, gSum = 0, bSum = 0;
      for (const [ox, oy] of offsets) {
        const nx = (x + ox) / width;
        const ny = (y + oy) / height;
        const [r, g, b] = sampleColor(nx, ny);
        rSum += r;
        gSum += g;
        bSum += b;
      }

      const idx = rowStart + 1 + x * 4;
      raw[idx] = Math.round(rSum / 4);
      raw[idx + 1] = Math.round(gSum / 4);
      raw[idx + 2] = Math.round(bSum / 4);
      raw[idx + 3] = 255; // 100% opaque
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    signature,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', compressed),
    createChunk('IEND', Buffer.alloc(0)),
  ]);
}

fs.writeFileSync('public/icon-192x192.png', generatePNG(192, 192));
fs.writeFileSync('public/icon-512x512.png', generatePNG(512, 512));
fs.writeFileSync('public/icon-maskable-512x512.png', generatePNG(512, 512));
fs.writeFileSync('public/apple-touch-icon.png', generatePNG(180, 180));

const androidMipmaps = [
  ['mipmap-mdpi', 48],
  ['mipmap-hdpi', 72],
  ['mipmap-xhdpi', 96],
  ['mipmap-xxhdpi', 144],
  ['mipmap-xxxhdpi', 192],
];

for (const [folder, size] of androidMipmaps) {
  const dir = `android/app/src/main/res/${folder}`;
  if (fs.existsSync(dir)) {
    const png = generatePNG(size, size);
    fs.writeFileSync(`${dir}/ic_launcher.png`, png);
    fs.writeFileSync(`${dir}/ic_launcher_round.png`, png);
    fs.writeFileSync(`${dir}/ic_launcher_foreground.png`, png);
  }
}

console.log('Generated Walbo Power PNG icons successfully.');
