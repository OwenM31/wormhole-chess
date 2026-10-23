import { buildHandDisplay } from '../src/utils/handOrder';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ PASS: ${message}`);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(' HAND DISPLAY & ORDERING VERIFICATION SUITE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 1. No cards played
{
  const initial = ['p1_sidestep', 'n1_adrenaline_jump', 'b1_let_me_through', 'r1_make_way'];
  const remaining = ['p1_sidestep', 'n1_adrenaline_jump', 'b1_let_me_through', 'r1_make_way'];
  const res = buildHandDisplay(initial, remaining);
  assert(res.length === 4, 'Full hand returns 4 items');
  assert(res.every(item => !item.spent), 'No cards marked spent when hand is full');
  assert(res.map(i => i.cardId).join(',') === initial.join(','), 'Original relative order preserved');
  assert(new Set(res.map(i => i.slotKey)).size === 4, 'All slotKey values are unique');
}

// 2. Single card played shifts to tail
{
  const initial = ['A', 'B', 'C', 'D'];
  const remaining = ['A', 'C', 'D'];
  const res = buildHandDisplay(initial, remaining);
  assert(res.map(i => i.cardId).join(',') === 'A,C,D,B', 'Single played card shifts to tail');
  assert(res[3].spent === true && res[3].cardId === 'B', 'Tail card B is marked spent');
  assert(res.slice(0, 3).every(i => !i.spent), 'Remaining cards A, C, D are not spent');
}

// 3. Two cards played both shift to tail preserving initial relative order
{
  const initial = ['A', 'B', 'C', 'D'];
  const remaining = ['B', 'D'];
  const res = buildHandDisplay(initial, remaining);
  assert(res.map(i => i.cardId).join(',') === 'B,D,A,C', 'Two played cards both at tail in initial deck order');
  assert(res[0].cardId === 'B' && !res[0].spent, 'B unspent at index 0');
  assert(res[1].cardId === 'D' && !res[1].spent, 'D unspent at index 1');
  assert(res[2].cardId === 'A' && res[2].spent, 'A spent at index 2');
  assert(res[3].cardId === 'C' && res[3].spent, 'C spent at index 3');
}

// 4. Duplicate cards are count-aware
{
  const initial = ['P1', 'N1', 'P1', 'R1'];
  const remaining = ['N1', 'P1', 'R1']; // Exactly one P1 spent
  const res = buildHandDisplay(initial, remaining);
  assert(res.map(i => i.cardId).join(',') === 'P1,N1,R1,P1', 'Duplicate copy: unspent P1 stays at front, second P1 moves to tail');
  assert(!res[0].spent && res[0].cardId === 'P1', 'First P1 remains playable');
  assert(res[3].spent && res[3].cardId === 'P1', 'Second P1 is marked spent');
  assert(res[0].slotKey !== res[3].slotKey, 'Duplicate copies have unique slotKeys');
}

// 5. Stable and unique slotKeys across duplicates
{
  const initial = ['K1', 'K1', 'K1'];
  const remaining = ['K1'];
  const res = buildHandDisplay(initial, remaining);
  assert(res.length === 3, 'Triple duplicate returns 3 slots');
  assert(new Set(res.map(i => i.slotKey)).size === 3, 'Unique slotKeys for 3 duplicate copies');
  assert(!res[0].spent && res[1].spent && res[2].spent, 'First copy unspent, 2nd and 3rd spent');
}

// 6. Defensive: Card in remaining hand not in initial deck
{
  const initial = ['A', 'B'];
  const remaining = ['A', 'B', 'EXTRA'];
  const res = buildHandDisplay(initial, remaining);
  assert(res.length === 3, 'Handles extra card gracefully');
  assert(res.some(i => i.cardId === 'EXTRA' && !i.spent), 'Extra card included as unspent');
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(' ALL HAND DISPLAY ASSERTIONS PASSED (0 FAILED)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
