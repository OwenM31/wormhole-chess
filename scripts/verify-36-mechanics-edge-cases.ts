import { DeckChessEngine } from '../src/engine/DeckChessEngine';
import { EmpoweredMove } from '../src/types/deckChess';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
    process.exit(1);
  } else {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(' 36-CARD MECHANICS & EDGE CASES TDD SUITE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ==========================================
// Suite 1: R1 Make Way Edge Cases
// ==========================================
console.log('Suite 1: R1 Make Way Edge Cases');
{
  // 1. Rook on a1, pawn on a2, b2 empty: only 1 perpendicular direction (right/b2)
  const engine1 = new DeckChessEngine('4k3/8/8/8/8/8/P7/R6K w - - 0 1', ['r1_make_way']);
  const moves1 = engine1.getEmpoweredMoves('a1');
  assert(moves1.length > 0, 'R1 Make Way generated moves for a1');
  assert(moves1.every(m => m.extraSquare === 'b2'), 'All moves use b2 as extraSquare (perpendicular)');
  assert(moves1.some(m => m.to === 'a2'), 'Rook can slide into vacated a2');
  assert(moves1.some(m => m.to === 'a5'), 'Rook can slide along opened a-file to a5');

  // 2. Rook on a1, pawn on a2, b2 occupied by friendly pawn: blocked!
  const engine2 = new DeckChessEngine('4k3/8/8/8/8/8/PP6/R6K w - - 0 1', ['r1_make_way']);
  const moves2 = engine2.getEmpoweredMoves('a1');
  assert(moves2.length === 0, 'R1 Make Way generates 0 moves when perpendicular square is blocked');

  // 3. Rook on d1, pawn on d2, both c2 and e2 empty: 2 perpendicular options
  const engine3 = new DeckChessEngine('4k3/8/8/8/8/8/3P4/3R3K w - - 0 1', ['r1_make_way']);
  const moves3 = engine3.getEmpoweredMoves('d1');
  const extraSquares = Array.from(new Set(moves3.map(m => m.extraSquare)));
  assert(extraSquares.includes('c2') && extraSquares.includes('e2'), 'Offers both c2 and e2 as step-aside options');

  // 4. Execution with capture along ray
  const engine4 = new DeckChessEngine('4k3/8/8/3r4/8/8/3P4/3R3K w - - 0 1', ['r1_make_way']);
  const captureMove = engine4.getEmpoweredMoves('d1').find(m => m.to === 'd5' && m.extraSquare === 'c2')!;
  assert(Boolean(captureMove), 'Found Make Way move capturing enemy rook on d5 with pawn stepping to c2');
  const res = engine4.makeEmpoweredMove(captureMove);
  assert(res.success === true, 'Make Way execution succeeded');
  assert(engine4.getPiece('d5')?.type === 'r' && engine4.getPiece('d5')?.color === 'w', 'White Rook at d5');
  assert(engine4.getPiece('c2')?.type === 'p' && engine4.getPiece('c2')?.color === 'w', 'Pawn stepped aside to c2');
  assert(engine4.getGraveyard().b.r === 1, 'Black rook sent to graveyard');
}

// ==========================================
// Suite 2: King Check Invariant Enforcement
// ==========================================
console.log('\nSuite 2: King Check Invariant Enforcement');
{
  // 1. King in check: Card move that does NOT resolve check must be rejected
  // White King on e1 in check from Black Queen on e8. White Rook at a1, pawn at a2.
  const checkEngine = new DeckChessEngine('4q3/8/8/8/8/8/P7/R3K3 w - - 0 1', ['r1_make_way']);
  const checkMoves = checkEngine.getEmpoweredMoves('a1');
  assert(checkMoves.length === 0, 'getEmpoweredMoves filters out card moves that leave king in check');

  // Direct engine execution attempt with handcrafted move leaving king in check
  const fakeMove: EmpoweredMove = {
    from: 'a1',
    to: 'a2',
    cardId: 'r1_make_way',
    actionType: 'move',
    energyCost: 0,
    extraSquare: 'b2',
  };
  const execRes = checkEngine.makeEmpoweredMove(fakeMove);
  assert(execRes.success === false, 'makeEmpoweredMove strictly rejects card move leaving friendly King in check');
  assert(checkEngine.getPiece('e1')?.type === 'k', 'Rollback leaves king unharmed at e1');
  assert(checkEngine.getPiece('a1')?.type === 'r', 'Rollback preserves Rook at a1');

  // 2. Moving a pinned piece that exposes friendly king to check
  // White King on e1, White Bishop on e2, Black Rook on e8.
  // B4 Change Color attempts to step bishop diagonally/orthogonally off the e-file:
  const pinEngine = new DeckChessEngine('4r3/8/8/8/8/8/4B3/4K3 w - - 0 1', ['b4_change_color']);
  const bishopMoves = pinEngine.getEmpoweredMoves('e2');
  assert(bishopMoves.length === 0, 'Pinned piece cannot use card to abandon king file');
}

// ==========================================
// Suite 3: Pin Safety & Non-King Target Guards
// ==========================================
console.log('\nSuite 3: Pin Safety & Non-King Target Guards');
{
  // 1. N4 Pin Swap: White King on e1, White Knight on e2 (pinned by Rook e8).
  // Friendly king at e1 is adjacent to e2, but MUST NOT be a swap target!
  const n4Engine = new DeckChessEngine('4r3/8/8/8/8/8/4N3/3PK3 w - - 0 1', ['n4_pin_swap']);
  const n4Moves = n4Engine.getEmpoweredMoves('e2');
  assert(!n4Moves.some(m => m.to === 'e1'), 'N4 Pin Swap STRICTLY EXCLUDES friendly King as target');
  assert(n4Moves.some(m => m.to === 'd1'), 'N4 Pin Swap targets friendly pawn at d1');

  // 2. B5 Take My Place: White King on e1, White Bishop on e2 (pinned by Rook e8).
  // King on e1 is diagonally adjacent to f2 / d2.
  const b5Engine = new DeckChessEngine('4r3/8/8/8/8/8/4B3/4K3 w - - 0 1', ['b5_take_my_place']);
  const b5Moves = b5Engine.getEmpoweredMoves('e2');
  assert(!b5Moves.some(m => m.to === 'e1'), 'B5 Take My Place never swaps with friendly King');

  // 3. P7 Protect the King: King on e1, Pawn on d2 (pinned by Bishop h4).
  // Enemy cannot be king
  const p7Engine = new DeckChessEngine('8/8/8/8/7b/8/3P4/4K3 w - - 0 1', ['p7_protect_the_king']);
  const p7Moves = p7Engine.getEmpoweredMoves('d2');
  assert(p7Moves.every(m => m.to !== 'e8'), 'P7 Protect the King never targets enemy King');
}

// ==========================================
// Suite 4: Universal Rank-8 Pawn Promotion
// ==========================================
console.log('\nSuite 4: Universal Rank-8 Pawn Promotion');
{
  // 1. P3 Follow Me: White Pawn on e7, White Rook on e6. Pushing e7->e8 promotes pawn to Queen!
  const p3Engine = new DeckChessEngine('7k/4P3/4R3/8/8/8/8/4K3 w - - 0 1', ['p3_follow_me']);
  const p3Moves = p3Engine.getEmpoweredMoves('e7');
  assert(p3Moves.some(m => m.to === 'e8'), 'P3 Follow Me advances pawn to rank 8');
  const p3Res = p3Engine.makeEmpoweredMove(p3Moves[0]);
  assert(p3Res.success === true, 'P3 Follow Me executed to rank 8');
  assert(p3Engine.getPiece('e8')?.type === 'q', 'Pawn promoted to Queen on rank 8');
  assert(p3Engine.getPiece('e7')?.type === 'r', 'Rook advanced to e7 behind Queen');

  // 2. P6 Tag Out: Pawn on e7, Bishop on e8. Swapping places puts pawn on e8, promoting to Queen!
  const p6Engine = new DeckChessEngine('4B2k/4P3/8/8/8/8/8/4K3 w - - 0 1', ['p6_tag_out']);
  const p6Moves = p6Engine.getEmpoweredMoves('e7');
  assert(p6Moves.some(m => m.to === 'e8'), 'P6 Tag Out offers swap with frontally adjacent bishop at e8');
  const p6Res = p6Engine.makeEmpoweredMove(p6Moves[0]);
  assert(p6Res.success === true, 'P6 Tag Out executed');
  assert(p6Engine.getPiece('e8')?.type === 'q', 'Pawn tagged out onto Rank 8 instantly promotes to Queen');
  assert(p6Engine.getPiece('e7')?.type === 'b', 'Bishop now at e7');
}

// ==========================================
// Suite 5: Black Player Orientation Symmetry
// ==========================================
console.log('\nSuite 5: Black Player Orientation Symmetry');
{
  // 1. Black P1 Sidestep: Black pawn on e7 blocked by White pawn on e6 sidesteps horizontally to d7 and f7
  const blackP1 = new DeckChessEngine('4k3/4p3/4P3/8/8/8/8/4K3 b - - 0 1', [], ['p1_sidestep']);
  const p1BlackMoves = blackP1.getEmpoweredMoves('e7');
  assert(p1BlackMoves.some(m => m.to === 'd7'), 'Black P1 Sidestep offers d7 (horizontal sidestep)');
  assert(p1BlackMoves.some(m => m.to === 'f7'), 'Black P1 Sidestep offers f7 (horizontal sidestep)');

  // 2. Black P2 Head On: Black pawn on e5 captures enemy pawn on e4 straight ahead
  const blackP2 = new DeckChessEngine('4k3/8/8/4p3/4P3/8/8/4K3 b - - 0 1', [], ['p2_head_on']);
  const p2BlackMoves = blackP2.getEmpoweredMoves('e5');
  assert(p2BlackMoves.some(m => m.to === 'e4'), 'Black P2 Head On captures White pawn at e4');
  const chosenP2 = p2BlackMoves.find(m => m.to === 'e4')!;
  const p2Res = blackP2.makeEmpoweredMove(chosenP2);
  assert(p2Res.success === true, 'Black P2 Head On executed');
  assert(blackP2.getPiece('e4')?.type === 'p' && blackP2.getPiece('e4')?.color === 'b', 'Black pawn now at e4');
  assert(blackP2.getGraveyard().w.p === 1, 'White pawn added to White graveyard');

  // 3. Black R1 Make Way: Black Rook on e8, Black pawn on e7, steps aside to d7 or f7
  const blackR1 = new DeckChessEngine('4r1k1/4p3/8/8/8/8/8/4K3 b - - 0 1', [], ['r1_make_way']);
  const r1BlackMoves = blackR1.getEmpoweredMoves('e8');
  assert(r1BlackMoves.some(m => m.extraSquare === 'd7'), 'Black R1 offers perpendicular step-aside to d7');
  assert(r1BlackMoves.some(m => m.extraSquare === 'f7'), 'Black R1 offers perpendicular step-aside to f7');
  assert(r1BlackMoves.some(m => m.to === 'e3'), 'Black Rook can slide down opened e-file to e3');
  const chosenBlackR1 = r1BlackMoves.find(m => m.to === 'e3' && m.extraSquare === 'd7')!;
  const r1BlackRes = blackR1.makeEmpoweredMove(chosenBlackR1);
  assert(r1BlackRes.success === true, 'Black R1 Make Way executed');
  assert(blackR1.getPiece('e3')?.type === 'r' && blackR1.getPiece('e3')?.color === 'b', 'Black Rook at e3');
  assert(blackR1.getPiece('d7')?.type === 'p' && blackR1.getPiece('d7')?.color === 'b', 'Black Pawn stepped to d7');

  // 4. Black promotion on Rank 1 (sweepPromotions bSq)
  // Black pawn at e2, Black rook at e3, White King safely at a1: P3 Follow Me pushes pawn e2->e1 and rook e3->e2
  const blackPromoEngine = new DeckChessEngine('7k/8/8/8/8/4r3/4p3/K7 b - - 0 1', [], ['p3_follow_me']);
  const promoMoves = blackPromoEngine.getEmpoweredMoves('e2');
  assert(promoMoves.some(m => m.to === 'e1'), 'Black P3 Follow Me advances pawn to Rank 1');
  const promoRes = blackPromoEngine.makeEmpoweredMove(promoMoves[0]);
  assert(promoRes.success === true, 'Black P3 Follow Me executed to Rank 1');
  assert(blackPromoEngine.getPiece('e1')?.type === 'q' && blackPromoEngine.getPiece('e1')?.color === 'b', 'Black pawn promoted to Black Queen on Rank 1');
}

// ==========================================
// Suite 6: Q2 The Queen's Gambit Attack-Ray Strictness (1. c4 Regression)
// ==========================================
console.log('\nSuite 6: Q2 The Queen\'s Gambit Attack-Ray Strictness');
{
  const openingQ2 = new DeckChessEngine(undefined, [], ['q2_the_queens_gambit']);
  openingQ2.makeMove({ from: 'c2', to: 'c4' });
  const q2MovesAfterC4 = openingQ2.getEmpoweredMoves('d8');
  assert(
    q2MovesAfterC4.length === 0,
    'Black Q2 Queen\'s Gambit generates 0 moves after 1. c4 (White Queen on d1 does NOT attack c7/d7/e7)'
  );
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(` RESULTS: ${passed} / ${passed + failed} PASSED (${failed} FAILED)`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (failed > 0) process.exit(1);
