import fs from 'fs';
import path from 'path';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(' PHASE 1 FORMAL AUDIT & CONTRACT VERIFICATION');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

let pass = 0;
let fail = 0;

function check(desc, cond) {
  if (cond) {
    console.log(`  ✓ ${desc}`);
    pass++;
  } else {
    console.error(`  ✗ FAIL: ${desc}`);
    fail++;
  }
}

// 1. Verify cardCatalog90.json
const minorPath = path.resolve('src/engine/cards/cardCatalog90.json');
const minorCards = JSON.parse(fs.readFileSync(minorPath, 'utf8'));

check('Minor catalog contains exactly 90 cards', minorCards.length === 90);
check('All Minor cards have artId matching id', minorCards.every(c => c.artId && c.artId === c.id));
check('All Minor cards have name length <= 21', minorCards.every(c => c.name && c.name.length <= 21));
check('All Minor cards have description length <= 120', minorCards.every(c => c.description && c.description.length <= 120));
check('Zero ellipses (...) in Minor card names or descriptions', minorCards.every(c => !c.name.includes('...') && !c.description.includes('...')));
check('Minor catalog has no duplicate card_name or card_description keys', minorCards.every(c => !('card_name' in c) && !('card_description' in c)));

// 2. Verify cardCatalogMajor90.json
const majorPath = path.resolve('src/engine/cards/cardCatalogMajor90.json');
const majorCards = JSON.parse(fs.readFileSync(majorPath, 'utf8'));

check('Major catalog contains exactly 90 cards', majorCards.length === 90);
check('All Major cards have artId matching id', majorCards.every(c => c.artId && c.artId === c.id));
check('All Major cards have name length <= 21', majorCards.every(c => c.name && c.name.length <= 21));
check('All Major cards have description length <= 120', majorCards.every(c => c.description && c.description.length <= 120));
check('Zero ellipses (...) in Major card names or descriptions', majorCards.every(c => !c.name.includes('...') && !c.description.includes('...')));
check('Major catalog has no duplicate card_name or card_description keys', majorCards.every(c => !('card_name' in c) && !('card_description' in c)));

// 3. Combined 180 Cards
const allCards = [...minorCards, ...majorCards];
const allIds = new Set(allCards.map(c => c.id));
check('Combined library contains exactly 180 unique IDs', allIds.size === 180);

const pieces = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
for (const p of pieces) {
  const cards = allCards.filter(c => c.anchor === p);
  check(`Piece anchor [${p}] has exactly 30 cards`, cards.length === 30);
  const c1 = cards.filter(c => c.energyCost === 1).length;
  const c2 = cards.filter(c => c.energyCost === 2).length;
  const c3 = cards.filter(c => c.energyCost === 3).length;
  check(`Piece anchor [${p}] adheres to 12/12/6 curve (1⚡: ${c1}, 2⚡: ${c2}, 3⚡: ${c3})`, c1 === 12 && c2 === 12 && c3 === 6);
}

// 4. UI Zero-Ellipsis Rule
const handBar = fs.readFileSync('src/components/TacticalHandBar.tsx', 'utf8');
const deckBuilder = fs.readFileSync('src/components/DeckBuilderView.tsx', 'utf8');
check('TacticalHandBar has zero line-clamp-2 on card descriptions', !handBar.includes('line-clamp-2'));
check('DeckBuilderView has zero line-clamp-2 on equipped cards', !deckBuilder.includes('line-clamp-2'));

// 5. Asset Directory Scaffolding
for (const p of pieces) {
  const dirPath = path.resolve(`public/assets/cards/${p}`);
  const keepPath = path.resolve(`public/assets/cards/${p}/.gitkeep`);
  check(`Asset directory public/assets/cards/${p} exists`, fs.existsSync(dirPath) && fs.existsSync(keepPath));
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(` RESULTS: ${pass} PASSED, ${fail} FAILED`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (fail > 0) {
  process.exit(1);
}
