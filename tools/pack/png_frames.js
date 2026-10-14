'use strict';
/* Minimal PNG reader (8-bit RGBA / RGB / grey / palette, not interlaced) to find which cells of a sprite
   sheet have something drawn. Used by pack_extra.js to know how many frames each animation has. */
const fs = require('fs'), zlib = require('zlib');

function decode(file) {
  const b = fs.readFileSync(file);
  let p = 8, w = 0, h = 0, depth = 0, type = 0, inter = 0, pal = null, trns = null;
  const idat = [];
  while (p < b.length) {
    const len = b.readUInt32BE(p), tag = b.toString('ascii', p + 4, p + 8), d = b.subarray(p + 8, p + 8 + len);
    if (tag === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); depth = d[8]; type = d[9]; inter = d[12]; }
    else if (tag === 'PLTE') pal = d;
    else if (tag === 'tRNS') trns = d;
    else if (tag === 'IDAT') idat.push(d);
    else if (tag === 'IEND') break;
    p += 12 + len;
  }
  if (depth !== 8 || inter) throw new Error(file + ': only 8-bit, non-interlaced PNG (depth ' + depth + ')');
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type], raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * ch;
  const px = Buffer.alloc(h * stride), alpha = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), o = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? px[o + x - ch] : 0, up = y ? px[o - stride + x] : 0, c = x >= ch && y ? px[o - stride + x - ch] : 0;
      let v = src[x];
      if (f === 1) v += a; else if (f === 2) v += up; else if (f === 3) v += (a + up) >> 1;
      else if (f === 4) { const pp = a + up - c, pa = Math.abs(pp - a), pb = Math.abs(pp - up), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? up : c; }
      px[o + x] = v & 255;
    }
    for (let x = 0; x < w; x++) {
      const i = o + x * ch;
      alpha[y * w + x] = type === 6 ? px[i + 3] : type === 4 ? px[i + 1] : type === 3 ? (trns && px[i] < trns.length ? trns[px[i]] : 255) : 255;
    }
  }
  return { w, h, alpha };
}

/** For a sheet of size x size cells: per row, the number of frames up to the last drawn cell. */
function framesPerRow(file, size) {
  const { w, h, alpha } = decode(file), cols = Math.floor(w / size), rows = Math.floor(h / size), out = [];
  for (let r = 0; r < rows; r++) {
    let last = -1;
    for (let c = 0; c < cols; c++) {
      let any = false;
      for (let y = r * size; y < (r + 1) * size && !any; y++) for (let x = c * size; x < (c + 1) * size; x++) if (alpha[y * w + x] > 8) { any = true; break; }
      if (any) last = c;
    }
    out.push(last + 1);
  }
  return { w, h, cols, rows, frames: out };
}

module.exports = { decode, framesPerRow };
