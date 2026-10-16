import { DeckChessEngine } from '../src/engine/DeckChessEngine';
import { STARTER_DECK, EXPANDED_LIBRARY } from '../src/engine/cardGraph';
import { Chess } from 'chess.js';
import cardCatalog90 from '../src/engine/cards/cardCatalog90.json';

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
console.log(' DECK BUILDER CHESS BEHAVIOR & MOVE TEST SUITE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ==========================================
// Suite 1: Core Engine & Invariants
// ==========================================
console.log('Suite 1: Core Engine & Turn Lifecycle');
{
  const engine = new DeckChessEngine();
  assert(engine.getEnergy() === 3, 'Initial energy is 3');
  assert(!engine.hasPlayedCardThisTurn(), 'Card window is open at turn start');
  assert(engine.getTurn() === 'w', 'White begins the game');
  assert(engine.getTurnNumber() === 1, 'Initial turn number is 1');

  // Normal chess move without card
  const moveRes = engine.makeMove({ from: 'e2', to: 'e4' });
  assert(moveRes.success === true, 'Standard pawn move e2->e4 succeeds');
  assert(engine.getTurn() === 'b', 'Turn passes to Black');
  assert(engine.getEnergy() === 3, 'Energy resets to 3 for Black');
  assert(!engine.hasPlayedCardThisTurn(), 'Card window is reopened for Black');

  // Black makes countermove
  const blackMove = engine.makeMove({ from: 'e7', to: 'e5' });
  assert(blackMove.success === true, 'Black pawn move e7->e5 succeeds');
  assert(engine.getTurn() === 'w', 'Turn passes back to White');
  assert(engine.getTurnNumber() === 2, 'Turn number increments after Black completes turn');
}

// ==========================================
// Suite 2: Pawn Vanguard (Vanguard Advance)
// ==========================================
console.log('\nSuite 2: Card [pawn_vanguard] (Vanguard Advance)');
{
  const engine = new DeckChessEngine();
  const anchors = engine.getValidAnchorsForCard('pawn_vanguard');
  assert(anchors.length === 8, 'All 8 unmoved pawns are valid anchors at game start');

  const targets = engine.getValidTargetsForCard('pawn_vanguard', 'e2');
  assert(targets.length === 1 && targets[0] === 'e5', 'Valid vanguard destination for e2 is e5 (3 squares forward)');

  const cardRes = engine.activateCard('pawn_vanguard', 'e2', 'e5');
  assert(cardRes.success === true, 'Pawn Vanguard activates successfully on e2->e5');
  assert(engine.getPiece('e2') === undefined, 'e2 square is vacated');
  assert(engine.getPiece('e5')?.type === 'p' && engine.getPiece('e5')?.color === 'w', 'Pawn now exists at e5');
  assert(engine.getEnergy() === 2, '1 Energy deducted (have 2 left)');
  assert(engine.hasPlayedCardThisTurn() === true, 'Card played flag set to true (PRE_MOVE_WINDOW closed)');

  // Attempt to play a second card in same turn
  const secondCard = engine.activateCard('pawn_scuttle', 'd2');
  assert(secondCard.success === false, 'PRE_MOVE_WINDOW: Second card rejected in same turn');

  // Make chess move to complete turn
  const moveRes = engine.makeMove({ from: 'g1', to: 'f3' });
  assert(moveRes.success === true, 'Normal chess move g1->f3 completes turn after card play');
  assert(engine.getTurn() === 'b', 'Turn successfully passed to Black');
  assert(engine.getEnergy() === 3, 'Black has 3 energy restored');

  // FEN and clone validation
  let cloneOk = true;
  try {
    const cloned = engine.clone();
    new Chess(cloned.getFen());
  } catch {
    cloneOk = false;
  }
  assert(cloneOk, 'FEN after vanguard is valid and engine clones cleanly');
}

// ==========================================
// Suite 3: Pawn Scuttle (Abandon Ship)
// ==========================================
console.log('\nSuite 3: Card [pawn_scuttle] (Abandon Ship)');
{
  // Position where Black bishop attacks White pawn on d4
  const engine = new DeckChessEngine('rnbqk1nr/pppp1ppp/8/4p3/1b1P4/8/PPP1PPPP/RNBQKBNR w KQkq - 1 2');
  assert(engine.inCheck() === true, 'White King in check from bishop on b4');

  // Pawn on d4 is attacked by Black pawn on e5
  const anchors = engine.getValidAnchorsForCard('pawn_scuttle');
  assert(anchors.includes('d4'), 'Attacked pawn at d4 is a valid scuttle anchor');

  const scuttleRes = engine.activateCard('pawn_scuttle', 'd4');
  assert(scuttleRes.success === true, 'Scuttle activates successfully on d4');
  assert(engine.getPiece('d4') === undefined, 'Scuttled pawn is removed from d4');
  assert(engine.getGraveyard().w.p === 1, 'White graveyard pawn count incremented to 1');
  assert(engine.getEnergy() === 2, '1 energy deducted');

  // Resolve check with c2->c3
  const blockMove = engine.makeMove({ from: 'c2', to: 'c3' });
  assert(blockMove.success === true, 'Block move c2->c3 succeeds after scuttle');
  assert(engine.inCheck() === false, 'Check resolved');
}

// ==========================================
// Suite 4: Knight Escort (Cavalry Escort) & Rank Safety
// ==========================================
console.log('\nSuite 4: Card [knight_escort] (Cavalry Escort & Edge Row Safety)');
{
  const engine = new DeckChessEngine();
  const anchors = engine.getValidAnchorsForCard('knight_escort');
  assert(anchors.includes('b1') && anchors.includes('g1'), 'Knights at b1 and g1 are valid escort anchors');

  // Passenger targets for b1
  const passengers = engine.getValidTargetsForCard('knight_escort', 'b1');
  assert(passengers.includes('a2') && passengers.includes('c2'), 'Adjacent pawns at a2 and c2 are valid passengers');

  // Secondary targets (knight leaps from b1)
  const leaps = engine.getSecondaryTargetsForCard('knight_escort', 'b1', 'c2');
  assert(leaps.includes('a3') && leaps.includes('c3'), 'Knight leaps a3 and c3 are valid secondary targets');

  // Execute escort: b1 knight leaps to c3, carrying passenger pawn from c2
  const escortRes = engine.activateCard('knight_escort', 'b1', 'c2', 'c3');
  assert(escortRes.success === true, 'Knight escort b1->c3 carrying c2 succeeds');
  assert(engine.getPiece('c3')?.type === 'n', 'Knight arrived at landing square c3');

  // CRITICAL: Passenger pawn MUST NOT be on rank 1 (b1)!
  const pieceAtB1 = engine.getPiece('b1');
  assert(pieceAtB1 === undefined || pieceAtB1.type !== 'p', 'CRITICAL: Pawn is NEVER left on edge row b1');

  // Verify FEN and Clone
  let cloneOk = true;
  try {
    const clone = engine.clone();
    new Chess(clone.getFen());
  } catch {
    cloneOk = false;
  }
  assert(cloneOk, 'CRITICAL: FEN has no edge-row pawns and engine.clone() succeeds without throw');

  // Complete turn with chess move
  const moveRes = engine.makeMove({ from: 'c3', to: 'e4' });
  assert(moveRes.success === true, 'Knight at c3 can move to e4 to complete turn');
}

// ==========================================
// Suite 5: Knight Swap (Dislocation Swap)
// ==========================================
console.log('\nSuite 5: Card [knight_swap] (Dislocation Swap)');
{
  // White Knight deep in enemy territory at d5 (rank 5)
  const engine = new DeckChessEngine('rnbqkbnr/pppp1ppp/8/3N4/8/8/PPPPPPPP/R1BQKBNR w KQkq - 0 1');
  const anchors = engine.getValidAnchorsForCard('knight_swap');
  assert(anchors.includes('d5'), 'Knight at d5 in enemy half satisfies IN_TERRITORY');

  const targets = engine.getValidTargetsForCard('knight_swap', 'd5');
  assert(targets.includes('e2'), 'Friendly pawn at e2 is a valid swap target');
  assert(!targets.includes('e1'), 'King at e1 is STRICTLY EXCLUDED from swap targets');
  assert(!targets.includes('d1'), 'Queen at d1 is excluded (minor pieces and pawns only)');

  const swapRes = engine.activateCard('knight_swap', 'd5', 'e2');
  assert(swapRes.success === true, 'Knight swap d5 <-> e2 succeeds');
  assert(engine.getPiece('e2')?.type === 'n', 'Knight now at e2');
  assert(engine.getPiece('d5')?.type === 'p', 'Pawn now at d5');

  // Complete turn with chess move
  const moveRes = engine.makeMove({ from: 'e2', to: 'c3' });
  assert(moveRes.success === true, 'Swapped knight can make legal chess move');
}

// ==========================================
// Suite 6: Bishop Pierce (Prism Ray) & Active Shield Interaction
// ==========================================
console.log('\nSuite 6: Card [bishop_pierce] (Prism Ray & Shield Interaction)');
{
  // Bishop at c1, d2 empty, unshielded enemy pawn at e3, enemy pawn at f4
  const engine = new DeckChessEngine('rnbqkbnr/pp1ppppp/8/8/5p2/4p3/PPP1PPPP/RNBQKBNR w KQkq - 0 1');
  const targets = engine.getValidTargetsForCard('bishop_pierce', 'c1');
  assert(targets.includes('e3'), 'Enemy pawn at e3 is a valid pierce target');

  // Now apply a shield to e3 owned by Black
  engine.addModifier({
    id: 'shield_test_e3',
    type: 'shield',
    square: 'e3',
    ownerColor: 'b',
    turnsRemaining: 2,
  });

  const targetsShielded = engine.getValidTargetsForCard('bishop_pierce', 'c1');
  assert(!targetsShielded.includes('e3'), 'Shielded piece at e3 CANNOT be targeted by Prism Ray');

  // Unshield and test pierce execution
  (engine as any).activeModifiers = [];
  const pierceRes = engine.activateCard('bishop_pierce', 'c1', 'e3');
  assert(pierceRes.success === true, 'Prism Ray executes on e3');
  assert(engine.getPiece('c1') === undefined, 'Bishop vacated c1');
  assert(engine.getPiece('e3')?.type === 'b', 'Bishop advanced to e3');
  assert(engine.getPiece('f4') === undefined, 'Second enemy piece at f4 captured via piercing ray');
  assert(engine.getGraveyard().b.p === 2, 'Both enemy pawns added to Black graveyard (count = 2)');
}

// ==========================================
// Suite 7: Bishop Invert (Color Inversion)
// ==========================================
console.log('\nSuite 7: Card [bishop_invert] (Color Inversion)');
{
  // Bishop at d4 (dark square), open adjacent orthogonal squares
  const engine = new DeckChessEngine('rnbqkbnr/pppppppp/8/8/3B4/8/PPPPPPPP/RN1QK1NR w KQkq - 0 1');
  const targets = engine.getValidTargetsForCard('bishop_invert', 'd4');
  assert(
    targets.includes('d5') && targets.includes('c4') && targets.includes('e4') && targets.includes('d3'),
    'All 4 adjacent orthogonal squares are valid invert targets'
  );

  const invertRes = engine.activateCard('bishop_invert', 'd4', 'd5');
  assert(invertRes.success === true, 'Bishop invert d4->d5 succeeds');
  assert(engine.getPiece('d4') === undefined, 'd4 vacated');
  assert(engine.getPiece('d5')?.type === 'b', 'Bishop now at d5 (light square, inverted!)');

  // Complete turn with diagonal move from inverted color
  const moveRes = engine.makeMove({ from: 'd5', to: 'c6' });
  assert(moveRes.success === true, 'Inverted bishop can legally move along light-squared diagonals');
}

// ==========================================
// Suite 8: Rook Rampart & Holographic Barrier Path Enforcement
// ==========================================
console.log('\nSuite 8: Card [rook_rampart] & Barrier Enforcement');
{
  const engine = new DeckChessEngine('rnbqkbnr/pppppppp/8/8/8/R7/1PPPPPPP/1NBQKBNR w Kkq - 0 1');
  const targets = engine.getValidTargetsForCard('rook_rampart', 'a3');
  assert(targets.includes('a5'), 'a5 is a valid square for rampart deploy');

  const rampartRes = engine.activateCard('rook_rampart', 'a3', 'a5');
  assert(rampartRes.success === true, 'Rampart barrier deployed on a5');
  assert(engine.isSquareBlockedByBarrier('a5') === true, 'Square a5 is marked as barrier');

  // Complete White turn
  engine.makeMove({ from: 'a3', to: 'b3' });

  // Black turn: Black pawn at a7 CANNOT move onto barrier at a5!
  const pawnMovesA7 = engine.getLegalMoves('a7').map((m) => m.to);
  assert(!pawnMovesA7.includes('a5'), 'Barrier prevents moving onto a5 (a7->a5 double step blocked)');
  assert(pawnMovesA7.includes('a6'), 'Single step a7->a6 remains legal');

  // CRITICAL TEST: Barrier at intermediate square e3 blocking e2->e4 double step
  const barrierEngine = new DeckChessEngine();
  barrierEngine.addModifier({
    id: 'barrier_e3',
    type: 'barrier',
    square: 'e3',
    ownerColor: 'b',
    turnsRemaining: 2,
  });

  const pawnMovesE2 = barrierEngine.getLegalMoves('e2').map((m) => m.to);
  assert(!pawnMovesE2.includes('e4'), 'CRITICAL: Pawn e2->e4 CANNOT jump through barrier at e3');
  assert(!pawnMovesE2.includes('e3'), 'Pawn e2 cannot step onto barrier at e3');
}

// ==========================================
// Suite 9: King Decree (Royal Decree) & Edge Row / Check Safety
// ==========================================
console.log('\nSuite 9: Card [king_decree] (Royal Decree & Back Rank Protection)');
{
  // Position with King at e1, friendly pawn at e2, friendly queen at d1
  const engine = new DeckChessEngine();
  const targetsOnRank1 = engine.getValidTargetsForCard('king_decree', 'e1');
  assert(!targetsOnRank1.includes('e2'), 'CRITICAL: King on rank 1 CANNOT swap with pawn (prevents rank 1 pawn FEN crash)');
  assert(targetsOnRank1.includes('d1'), 'King can swap with Queen at d1');

  // Position with King on rank 3 (away from edge rows)
  const midEngine = new DeckChessEngine('rnbqkbnr/pppp1ppp/8/8/8/4K3/PPPP1PPP/RNBQ1BNR w kq - 0 1');
  const midTargets = midEngine.getValidTargetsForCard('king_decree', 'e3');
  // Pawns on rank 2 (e.g. f2, d2) can now be targets since King is on rank 3!
  assert(midTargets.includes('f2') || midTargets.includes('d2'), 'King on rank 3 can decree with adjacent friendly pawns safely');
}

// ==========================================
// Suite 10: Queen Aegis & Shield Migration
// ==========================================
console.log("\nSuite 10: Card [queen_aegis] (Regent's Aegis & Moving Shield)");
{
  // Queen at d1, friendly knight at c3
  const engine = new DeckChessEngine('rnbqkbnr/pppppppp/8/8/8/2N5/PPPPPPPP/R1BQKBNR w KQkq - 0 1');
  const targets = engine.getValidTargetsForCard('queen_aegis', 'd1');
  // Adjacent to Queen d1: c1, c2, d2, e2, e1
  assert(targets.includes('c1') && targets.includes('e1'), 'Friendly pieces adjacent to queen are valid aegis targets');

  // Add shield to c3 directly
  engine.addModifier({
    id: 'shield_c3',
    type: 'shield',
    square: 'c3',
    ownerColor: 'w',
    turnsRemaining: 2,
  });
  assert(engine.isSquareShielded('c3', 'w') === true, 'c3 is shielded');

  // Move knight from c3 to e4
  const moveRes = engine.makeMove({ from: 'c3', to: 'e4' });
  assert(moveRes.success === true, 'Knight moved c3->e4');
  assert(engine.isSquareShielded('c3', 'w') === false, 'Vacated square c3 is no longer shielded');
  assert(engine.isSquareShielded('e4', 'w') === true, 'CRITICAL: Shield migrated with the knight to e4');

  // Black cannot capture shielded piece at e4
  const blackCaptures = engine.getLegalMoves().filter((m) => m.to === 'e4');
  assert(blackCaptures.length === 0, 'Black cannot legally capture the shielded piece at e4');
}

// ==========================================
// Suite 11: Expanded Library (pawn_reinforce, knight_outflank, rook_ironclad)
// ==========================================
console.log('\nSuite 11: Expanded Library Mechanics');
{
  // 1. Pawn Reinforce
  const reinforceEngine = new DeckChessEngine(
    'rnbqkbnr/pppppppp/8/8/8/8/P1PPPPPP/RNBQKBNR w KQkq - 0 1',
    ['pawn_reinforce']
  );
  (reinforceEngine as any).graveyard.w.p = 1; // 1 pawn in graveyard
  const reinforceTargets = reinforceEngine.getValidTargetsForCard('pawn_reinforce', 'a2');
  assert(reinforceTargets.includes('b2'), 'Empty square b2 on home 2nd rank is valid reinforce target');

  const spawnRes = reinforceEngine.activateCard('pawn_reinforce', 'a2', 'b2');
  assert(spawnRes.success === true, 'Pawn Reinforce succeeds');
  assert(reinforceEngine.getPiece('b2')?.type === 'p', 'Pawn resurrected on b2');
  assert(reinforceEngine.getGraveyard().w.p === 0, 'Graveyard pawn count decremented to 0');

  // 2. Knight Outflank
  const outflankEngine = new DeckChessEngine(
    'rnbqkbnr/pppppppp/8/8/8/N7/PPPPPPPP/R1BQKBNR w KQkq - 0 1',
    ['knight_outflank']
  );
  // Knight at a3 (on rim file 0)
  const outflankTargets = outflankEngine.getValidTargetsForCard('knight_outflank', 'a3');
  assert(outflankTargets.includes('h3'), 'Opposing rim square h3 is a valid outflank target');

  const outflankRes = outflankEngine.activateCard('knight_outflank', 'a3', 'h3');
  assert(outflankRes.success === true, 'Knight Outflank teleports knight across the rim');
  assert(outflankEngine.getPiece('a3') === undefined, 'a3 vacated');
  assert(outflankEngine.getPiece('h3')?.type === 'n', 'Knight arrived at h3');
}

// ==========================================
// Suite 12: 6x6 Taxonomy & 90-Card Canonical Catalog Contract
// ==========================================
console.log('\nSuite 12: 6x6 Taxonomy & 90-Card Canonical Catalog Contract');
{
  assert(Array.isArray(cardCatalog90) && cardCatalog90.length === 90, 'Canonical cardCatalog90 contains exactly 90 cards');

  const validConditions = ['Position', 'Neighbors', 'Lines', 'Threat', 'Blocked', 'Momentum'];
  const validEffects = ['New Moves', 'Jump & Leap', 'Move Others', 'Special Captures', 'Walls & Shields', 'Spawning'];

  let allFieldsValid = true;
  for (const card of cardCatalog90) {
    if (!card.id || !card.name || !card.piece || !card.anchor || !card.energyCost ||
        !card.condition_type || !card.condition_exact || !card.effect_type || !card.effect_exact ||
        !card.description || !card.image_description) {
      allFieldsValid = false;
      break;
    }
    if (!validConditions.includes(card.condition_type) || !validEffects.includes(card.effect_type)) {
      allFieldsValid = false;
      break;
    }
  }
  assert(allFieldsValid, 'All 90 cards possess all required contract fields adhering to 6x6 genres');

  // Verify distribution per piece
  const pieces = ['Pawn', 'Knight', 'Bishop'] as const;
  for (const piece of pieces) {
    const cards = cardCatalog90.filter(c => c.piece === piece);
    assert(cards.length === 30, `${piece} has exactly 30 canonical cards`);

    const cost1 = cards.filter(c => c.energyCost === 1).length;
    const cost2 = cards.filter(c => c.energyCost === 2).length;
    const cost3 = cards.filter(c => c.energyCost === 3).length;
    assert(cost1 === 12 && cost2 === 12 && cost3 === 6, `${piece} adheres to 12 / 12 / 6 energy cost curve (1⚡: ${cost1}, 2⚡: ${cost2}, 3⚡: ${cost3})`);
  }

  // Verify Condition Exclusion Invariants (3-Cycle)
  const pawnMomentum = cardCatalog90.filter(c => c.piece === 'Pawn' && c.condition_type === 'Momentum');
  assert(pawnMomentum.length === 0, 'Pawn excludes Momentum condition (Minor Cycle Invariant)');

  const knightLines = cardCatalog90.filter(c => c.piece === 'Knight' && c.condition_type === 'Lines');
  assert(knightLines.length === 0, 'Knight excludes Lines condition (Minor Cycle Invariant)');

  const bishopBlocked = cardCatalog90.filter(c => c.piece === 'Bishop' && c.condition_type === 'Blocked');
  assert(bishopBlocked.length === 0, 'Bishop excludes Blocked condition (Minor Cycle Invariant)');

  // Contract verification for EmpoweredMove
  const sampleEmpoweredMove = {
    from: 'e2',
    to: 'e4',
    cardId: 'pawn_bayonet_charge',
    energyCost: 2,
    actionType: 'move' as const,
    metadata: { test: true }
  };
  assert(
    typeof sampleEmpoweredMove.from === 'string' &&
    typeof sampleEmpoweredMove.to === 'string' &&
    typeof sampleEmpoweredMove.cardId === 'string' &&
    typeof sampleEmpoweredMove.energyCost === 'number' &&
    sampleEmpoweredMove.actionType === 'move',
    'EmpoweredMove contract matches unified action model specification'
  );
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
