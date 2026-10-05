const fs = require('fs');
const zlib = require('zlib');

// CRC32 implementation required for valid PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// Point-in-triangle helper to render a crisp lightning bolt
function sign(p1x, p1y, p2x, p2y, p3x, p3y) {
  return (p1x - p3x) * (p2y - p3y) - (p2x - p3x) * (p1y - p3y);
}

function pointInTriangle(px, py, v1x, v1y, v2x, v2y, v3x, v3y) {
  const d1 = sign(px, py, v1x, v1y, v2x, v2y);
  const d2 = sign(px, py, v2x, v2y, v3x, v3y);
  const d3 = sign(px, py, v3x, v3y, v1x, v1y);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function createEnergyPng(size, maskable = false) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Raw scanlines: each row starts with filter byte 0, followed by RGBA pixels
  const raw = Buffer.alloc(size * (1 + size * 4));
  const scale = maskable ? 0.62 : 0.76;

  // Upper and lower triangles forming a lightning bolt in normalized [-1, 1] space
  const t1 = [0.12, -0.75, -0.48, 0.06, 0.06, 0.06];
  const t2 = [-0.12, 0.75, 0.48, -0.06, -0.06, -0.06];

  for (let y = 0; y < size; y++) {
    const rowOffset = y * (1 + size * 4);
    raw[rowOffset] = 0; // filter type 0 (None)
    const ny = ((y + 0.5) / size * 2 - 1) / scale;

    for (let x = 0; x < size; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const nx = ((x + 0.5) / size * 2 - 1) / scale;

      // Emerald #10b981 background with subtle radial depth
      const dist = Math.hypot((x / size) - 0.5, (y / size) - 0.5);
      let r = 16;
      let g = Math.max(150, Math.round(185 - dist * 35));
      let b = Math.max(105, Math.round(129 - dist * 25));

      const inBolt =
        pointInTriangle(nx, ny, t1[0], t1[1], t1[2], t1[3], t1[4], t1[5]) ||
        pointInTriangle(nx, ny, t2[0], t2[1], t2[2], t2[3], t2[4], t2[5]);

      if (inBolt) {
        r = 255;
        g = 255;
        b = 255;
      }

      raw[pxOffset] = r;
      raw[pxOffset + 1] = g;
      raw[pxOffset + 2] = b;
      raw[pxOffset + 3] = 255; // Fully opaque
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

fs.writeFileSync('public/icon-192x192.png', createEnergyPng(192, false));
fs.writeFileSync('public/icon-512x512.png', createEnergyPng(512, false));
fs.writeFileSync('public/icon-maskable-512x512.png', createEnergyPng(512, true));
fs.writeFileSync('public/apple-touch-icon.png', createEnergyPng(180, false));

console.log('Valid RGBA PNG icons generated successfully!');
