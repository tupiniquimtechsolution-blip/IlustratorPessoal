import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const dir = path.resolve('assets/icons');
await fs.mkdir(dir, { recursive: true });
const svg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8b6cff"/><stop offset="1" stop-color="#36d7df"/></linearGradient></defs>
  <rect width="512" height="512" rx="116" fill="#111318"/>
  <path d="M143 361 244 109c5-13 24-13 29 0l100 252h-57l-21-58h-89l-21 58zm82-108h52l-26-74z" fill="url(#g)"/>
  <circle cx="372" cy="142" r="34" fill="#fff" opacity=".94"/>
  <path d="m372 92 8 30 30 8-30 8-8 30-8-30-30-8 30-8z" fill="#36d7df"/>
</svg>`);
const png = await sharp(svg).resize(512, 512).png().toBuffer();
await fs.writeFile(path.join(dir, 'app.png'), png);

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
const entry = Buffer.alloc(16);
entry.writeUInt8(0, 0);
entry.writeUInt8(0, 1);
entry.writeUInt8(0, 2);
entry.writeUInt8(0, 3);
entry.writeUInt16LE(1, 4);
entry.writeUInt16LE(32, 6);
entry.writeUInt32LE(png.length, 8);
entry.writeUInt32LE(22, 12);
await fs.writeFile(path.join(dir, 'app.ico'), Buffer.concat([header, entry, png]));
