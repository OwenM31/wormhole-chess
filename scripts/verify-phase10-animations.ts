/**
 * Automated Verification Suite for Phase 10:
 * Move Animation Engine, Coordinate Delta Computations & 6 Card Animation Archetypes
 */

import { CANONICAL_36_CARDS } from '../src/engine/cards/releaseRoster36';
import { CardAnimationArchetype } from '../src/types/deckChess';
import { getSquareCenterPct } from '../src/components/CardAnimationFX';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName}${detail ? ` (${detail})` : ''}`);
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(' PHASE 10: ANIMATION ENGINE & ARCHETYPE MATRIX');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ==========================================
// Suite 1: 36-Card Animation Archetype Mapping
// ==========================================
console.log('Suite 1: 36-Card Animation Archetype Mapping');
{
  assert(CANONICAL_36_CARDS.length === 36, 'CANONICAL_36_CARDS contains exactly 36 cards');

  const validArchetypes: CardAnimationArchetype[] = [
    'charge',
    'leap',
    'teleport',
    'beam',
    'displace',
    'shockwave',
  ];

  const archetypeCounts: Record<CardAnimationArchetype, number> = {
    charge: 0,
    leap: 0,
    teleport: 0,
    beam: 0,
    displace: 0,
    shockwave: 0,
  };

  let allArchetypesValid = true;
  for (const card of CANONICAL_36_CARDS) {
    if (!card.animationArchetype || !validArchetypes.includes(card.animationArchetype)) {
      allArchetypesValid = false;
      console.error(`Missing or invalid archetype on card [${card.code}]: ${card.animationArchetype}`);
    } else {
      archetypeCounts[card.animationArchetype]++;
    }
  }

  assert(allArchetypesValid, 'All 36 cards possess a valid animationArchetype');

  // Verify all 6 archetypes are actively utilized
  for (const arch of validArchetypes) {
    assert(
      archetypeCounts[arch] > 0,
      `Archetype "${arch}" has at least 1 mapped card (count = ${archetypeCounts[arch]})`
    );
  }

  console.log('  Archetype Breakdown:', archetypeCounts);
}

// ==========================================
// Suite 2: FLIP Coordinate Delta Computation
// ==========================================
console.log('\nSuite 2: FLIP Coordinate Delta Computation (White & Black Orientations)');
{
  function computeSlideDelta(from: string, to: string, orientation: 'w' | 'b') {
    const fromF = from.charCodeAt(0) - 'a'.charCodeAt(0);
    const fromR = parseInt(from[1], 10) - 1;
    const toF = to.charCodeAt(0) - 'a'.charCodeAt(0);
    const toR = parseInt(to[1], 10) - 1;

    const fromCol = orientation === 'w' ? fromF : 7 - fromF;
    const fromRow = orientation === 'w' ? 7 - fromR : fromR;
    const toCol = orientation === 'w' ? toF : 7 - toF;
    const toRow = orientation === 'w' ? 7 - toR : toR;

    return {
      dx: (fromCol - toCol) * 100,
      dy: (fromRow - toRow) * 100,
    };
  }

  // 1. Move e2 -> e4 (White orientation: upward move 2 squares)
  // Origin e2 is below destination e4 on screen, so fromRow > toRow => dy is +200%
  const deltaE2E4_w = computeSlideDelta('e2', 'e4', 'w');
  assert(deltaE2E4_w.dx === 0, 'e2->e4 dx === 0% (same file)');
  assert(deltaE2E4_w.dy === 200, `e2->e4 dy === +200% (from is 2 squares below to on screen, got: ${deltaE2E4_w.dy})`);

  // 2. Move e7 -> e5 (Black orientation: from e7 moving downward to e5)
  // On Black orientation, Rank 7 is near bottom, Rank 5 is near top
  const deltaE7E5_b = computeSlideDelta('e7', 'e5', 'b');
  assert(deltaE7E5_b.dx === 0, 'e7->e5 dx === 0% on Black orientation');
  assert(deltaE7E5_b.dy === 200, `e7->e5 dy === +200% on Black orientation (got: ${deltaE7E5_b.dy})`);

  // 3. Move b1 -> c3 (Knight jump: right 1 file, up 2 ranks)
  const deltaB1C3_w = computeSlideDelta('b1', 'c3', 'w');
  assert(deltaB1C3_w.dx === -100, `b1->c3 dx === -100% (origin b1 was 1 square to the left, got: ${deltaB1C3_w.dx})`);
  assert(deltaB1C3_w.dy === 200, `b1->c3 dy === +200% (origin b1 was 2 squares below, got: ${deltaB1C3_w.dy})`);
}

// ==========================================
// Suite 3: Square Center Percentage Clamping & Center Bounds
// ==========================================
console.log('\nSuite 3: SVG FX Square Center Coordinates');
{
  const a1_w = getSquareCenterPct('a1', 'w');
  assert(a1_w.x === 6.25, `a1 x center is 6.25% (got: ${a1_w.x})`);
  assert(a1_w.y === 93.75, `a1 y center is 93.75% for White (got: ${a1_w.y})`);

  const h8_w = getSquareCenterPct('h8', 'w');
  assert(h8_w.x === 93.75, `h8 x center is 93.75% for White (got: ${h8_w.x})`);
  assert(h8_w.y === 6.25, `h8 y center is 6.25% for White (got: ${h8_w.y})`);

  const a1_b = getSquareCenterPct('a1', 'b');
  assert(a1_b.x === 93.75, `a1 x center is 93.75% for Black (got: ${a1_b.x})`);
  assert(a1_b.y === 6.25, `a1 y center is 6.25% for Black (got: ${a1_b.y})`);
}

// ==========================================
// Summary
// ==========================================
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(` RESULTS: ${passedTests} / ${totalTests} PASSED (${failedTests} FAILED)`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (failedTests > 0) {
  process.exit(1);
}
