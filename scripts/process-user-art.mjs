import { chromium } from 'file:///C:/nvm4w/nodejs/node_modules/@playwright/cli/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

async function processArt() {
  console.log('Processing user art...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();

  const pawnB64 = fs.readFileSync(path.join(ROOT, 'wooden-pawn-initial.jpg')).toString('base64');

  const result = await page.evaluate(async (pawnB64) => {
    function loadImg(b64) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = 'data:image/jpeg;base64,' + b64;
      });
    }

    const img = await loadImg(pawnB64);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // BFS Flood Fill from outer edges (excluding bottom where pedestal touches)
    const visited = new Uint8Array(w * h);
    const isTransparent = new Uint8Array(w * h);
    const queue = [];

    function isWhite(idx) {
      const p = idx * 4;
      const r = data[p];
      const g = data[p + 1];
      const b = data[p + 2];
      // Wood is distinctly brown/tan (r: 90-190, g: 60-140, b: 30-90)
      // Pure background is r>230, g>230, b>230
      return (r > 225 && g > 225 && b > 225);
    }

    // Seed top row, left edge, and right edge
    for (let x = 0; x < w; x++) {
      const idx = x;
      if (isWhite(idx)) {
        queue.push(idx);
        visited[idx] = 1;
      }
    }
    for (let y = 0; y < h; y++) {
      const idxL = y * w;
      if (isWhite(idxL) && !visited[idxL]) {
        queue.push(idxL);
        visited[idxL] = 1;
      }
      const idxR = y * w + (w - 1);
      if (isWhite(idxR) && !visited[idxR]) {
        queue.push(idxR);
        visited[idxR] = 1;
      }
    }

    let head = 0;
    while (head < queue.length) {
      const curr = queue[head++];
      isTransparent[curr] = 1;
      const cx = curr % w;
      const cy = Math.floor(curr / w);

      const neighbors = [];
      if (cx > 0) neighbors.push(curr - 1);
      if (cx < w - 1) neighbors.push(curr + 1);
      if (cy > 0) neighbors.push(curr - w);
      if (cy < h - 1) neighbors.push(curr + w);

      for (let i = 0; i < neighbors.length; i++) {
        const nIdx = neighbors[i];
        if (!visited[nIdx]) {
          visited[nIdx] = 1;
          if (isWhite(nIdx)) {
            queue.push(nIdx);
          }
        }
      }
    }

    // Apply transparency and anti-aliasing feather to border pixels
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        const p = idx * 4;
        if (isTransparent[idx]) {
          data[p + 3] = 0; // Fully transparent
        } else {
          // Check if adjacent to transparent pixel for smoothing
          let adjacentBg = false;
          if (x > 0 && isTransparent[idx - 1]) adjacentBg = true;
          else if (x < w - 1 && isTransparent[idx + 1]) adjacentBg = true;
          else if (cy_up(idx, w) && isTransparent[idx - w]) adjacentBg = true;
          else if (cy_down(idx, w, h) && isTransparent[idx + w]) adjacentBg = true;

          if (adjacentBg) {
            const r = data[p], g = data[p + 1], b = data[p + 2];
            const bright = (r + g + b) / 3;
            if (bright > 210) {
              data[p + 3] = Math.max(0, Math.min(255, Math.round((235 - bright) * 10)));
            }
          }
        }
      }
    }

    function cy_up(idx, w) { return idx >= w; }
    function cy_down(idx, w, h) { return idx < w * (h - 1); }

    ctx.putImageData(imgData, 0, 0);

    // Crop to bounding box with padding
    // Pawn is from x: 140 to 748, y: 50 to 572
    const cropX = 136;
    const cropY = 40;
    const cropW = 618;
    const cropH = 532;

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropW;
    cropCanvas.height = cropH;
    const cropCtx = cropCanvas.getContext('2d');
    cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    // Also create a centered square avatar (512x512)
    const squareCanvas = document.createElement('canvas');
    squareCanvas.width = 512;
    squareCanvas.height = 512;
    const sqCtx = squareCanvas.getContext('2d');
    // Fit cropped image inside 512x512
    const scale = 500 / Math.max(cropW, cropH);
    const destW = cropW * scale;
    const destH = cropH * scale;
    const destX = (512 - destW) / 2;
    const destY = 512 - destH; // align pedestal bottom
    sqCtx.drawImage(cropCanvas, 0, 0, cropW, cropH, destX, destY, destW, destH);

    return {
      fullTransparentPng: cropCanvas.toDataURL('image/png'),
      squareAvatarPng: squareCanvas.toDataURL('image/png'),
      crop: { cropW, cropH }
    };
  }, pawnB64);

  const charDir = path.join(ROOT, 'public/assets/characters');
  if (!fs.existsSync(charDir)) fs.mkdirSync(charDir, { recursive: true });

  const bgDir = path.join(ROOT, 'public/assets/backgrounds');
  if (!fs.existsSync(bgDir)) fs.mkdirSync(bgDir, { recursive: true });

  // Save wooden-pawn.png (cropped transparent character)
  const pawnData = result.fullTransparentPng.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(path.join(charDir, 'wooden-pawn.png'), Buffer.from(pawnData, 'base64'));

  // Save wooden-pawn-avatar.png (512x512 square transparent avatar)
  const avatarData = result.squareAvatarPng.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(path.join(charDir, 'wooden-pawn-avatar.png'), Buffer.from(avatarData, 'base64'));

  // Copy village backdrop and tabletop arena
  fs.copyFileSync(path.join(ROOT, 'background-initial.jpg'), path.join(bgDir, 'village-backdrop.jpg'));
  fs.copyFileSync(path.join(ROOT, 'tabletop-background-initial.jpg'), path.join(bgDir, 'tabletop-arena.jpg'));

  console.log('✓ Successfully created:');
  console.log('  - public/assets/characters/wooden-pawn.png (' + result.crop.cropW + 'x' + result.crop.cropH + ')');
  console.log('  - public/assets/characters/wooden-pawn-avatar.png (512x512)');
  console.log('  - public/assets/backgrounds/village-backdrop.jpg');
  console.log('  - public/assets/backgrounds/tabletop-arena.jpg');

  await browser.close();
}

processArt().catch(console.error);
