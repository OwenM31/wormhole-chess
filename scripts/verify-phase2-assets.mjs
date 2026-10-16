import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const CATALOG_PATH = path.join(ROOT, 'src/engine/cards/cardCatalog90.json');

if (!fs.existsSync(CATALOG_PATH)) {
  console.error(`Missing catalog file at ${CATALOG_PATH}`);
  process.exit(1);
}

const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

// Parse command line arguments
const args = process.argv.slice(2);
const knightsOnly = args.includes('--knights-only');
const pawnsOnly = args.includes('--pawns-only');
const bishopsOnly = args.includes('--bishops-only');

let targetCards = catalog;
let filterLabel = 'All Minor Units (90 Cards)';

if (knightsOnly) {
  targetCards = catalog.filter(c => c.anchor === 'knight');
  filterLabel = 'Knight Cards (30 Cards)';
} else if (pawnsOnly) {
  targetCards = catalog.filter(c => c.anchor === 'pawn');
  filterLabel = 'Pawn Cards (30 Cards)';
} else if (bishopsOnly) {
  targetCards = catalog.filter(c => c.anchor === 'bishop');
  filterLabel = 'Bishop Cards (30 Cards)';
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(` HARNESS ► PHASE 2 ASSET CONTRACT AUDIT: ${filterLabel}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

let passCount = 0;
let failCount = 0;
const failures = [];

for (const card of targetCards) {
  const anchor = card.anchor || card.piece.toLowerCase();
  const artId = card.artId || card.id;
  const filePath = path.join(ROOT, 'public/assets/cards', anchor, `${artId}.svg`);
  const cardErrors = [];

  // 1. File existence
  if (!fs.existsSync(filePath)) {
    cardErrors.push(`File missing at ${path.relative(ROOT, filePath)}`);
    failCount++;
    failures.push({ card, errors: cardErrors });
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // 2. XML & viewBox
  if (!content.includes('<svg') || !content.includes('http://www.w3.org/2000/svg')) {
    cardErrors.push('Missing valid <svg xmlns="http://www.w3.org/2000/svg" declaration');
  }
  if (!content.includes('</svg>')) {
    cardErrors.push('Missing closing </svg> tag');
  }
  if (!content.includes('viewBox="0 0 120 120"')) {
    cardErrors.push('Missing standard viewBox="0 0 120 120"');
  }

  // 3. Security violations
  if (/<script[\s>]/i.test(content)) {
    cardErrors.push('Security violation: contains <script> tag');
  }
  if (/<foreignObject[\s>]/i.test(content)) {
    cardErrors.push('Security violation: contains <foreignObject> tag');
  }
  if (/onload\s*=/i.test(content)) {
    cardErrors.push('Security violation: contains onload handler');
  }
  if (/https?:\/\/(?!www\.w3\.org)/i.test(content)) {
    cardErrors.push('Security violation: contains external URL');
  }

  // 4. Raster blobs
  if (/<image[\s>]/i.test(content)) {
    cardErrors.push('Raster violation: contains <image> tag');
  }
  if (/data:image\//i.test(content) || /base64/i.test(content)) {
    cardErrors.push('Raster violation: contains base64/data URI image');
  }

  // 5. 5x5 board presence (Option B palette tokens)
  const hasIvory = content.includes('#D5CDC0') || content.includes('D5CDC0');
  const hasObsidian = content.includes('#2C3539') || content.includes('2C3539');
  if (!hasIvory || !hasObsidian) {
    cardErrors.push('Missing Option B palette tokens (#D5CDC0 ivory and #2C3539 obsidian slate)');
  }
  if (!content.includes('board-5x5') && !content.includes('#222629') && !content.includes('#151719')) {
    cardErrors.push('Missing 5x5 board foundation or 3D slab geometry');
  }

  // 6. Top HUD condition badge
  if (!content.includes('COND:')) {
    cardErrors.push('Missing top HUD condition text ("COND:")');
  }
  if (!content.includes('font-family="monospace"') && !content.includes('ui-monospace')) {
    cardErrors.push('Missing monospace font declaration in top HUD condition badge');
  }

  // 7. Zero text on tiles invariant
  // Find all <text> tags and check their y position or ensure they only exist within the top HUD badge (y < 20)
  const textMatches = [...content.matchAll(/<text([^>]*)>([\s\S]*?)<\/text>/gi)];
  if (textMatches.length === 0) {
    cardErrors.push('Missing HUD condition text element');
  } else {
    for (const match of textMatches) {
      const attrs = match[1];
      const textVal = match[2].trim();
      const yMatch = attrs.match(/\by=["']([0-9.]+)["']/);
      if (yMatch) {
        const yVal = parseFloat(yMatch[1]);
        if (yVal > 22) {
          cardErrors.push(`Zero-text-on-tiles violation: found text "${textVal}" stamped at y=${yVal}`);
        }
      }
      if (textVal.toLowerCase().includes('leap over') || textVal.toLowerCase().includes('jump') && !textVal.startsWith('COND:')) {
        cardErrors.push(`Text on chessboard detected: "${textVal}"`);
      }
    }
  }

  if (cardErrors.length > 0) {
    failCount++;
    failures.push({ card, errors: cardErrors });
  } else {
    passCount++;
  }
}

console.log(`Results: ${passCount} / ${targetCards.length} passed.`);

if (failures.length > 0) {
  console.log(`\n❌ ${failCount} asset(s) failed contract verification:\n`);
  for (const f of failures) {
    console.log(`  • [${f.card.anchor}] ${f.card.id} (${f.card.name}):`);
    for (const err of f.errors) {
      console.log(`      - ${err}`);
    }
  }
  process.exit(1);
} else {
  console.log(`\n✅ All ${passCount} assets strictly conform to 5-layer system contracts and Phase 2 invariants!\n`);
  process.exit(0);
}
