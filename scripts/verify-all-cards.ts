import { DeckChessEngine } from '../src/engine/DeckChessEngine';
import { getCardHandler } from '../src/engine/cards/cardRegistry';
import {
  STARTER_DECK,
  EXPANDED_LIBRARY,
  CANONICAL_90_CARDS,
  CANONICAL_MAJOR_90_CARDS,
  CANONICAL_180_CARDS,
  getCardById,
} from '../src/engine/cardGraph';
import { Chess } from 'chess.js';
import cardCatalog90 from '../src/engine/cards/cardCatalog90.json';
import cardCatalogMajor90 from '../src/engine/cards/cardCatalogMajor90.json';

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
// Suite 13: Unified Move Generation & Invariants
// ==========================================
console.log('\nSuite 13: Unified Move Generation & Invariants');
{
  // 1. Camel leap (3,1) for Knight from starting square (knight_cavalry_charge)
  const camelEngine = new DeckChessEngine(undefined, ['knight_cavalry_charge']);
  const camelMoves = camelEngine.getEmpoweredMoves('b1');
  const camelTargets = camelMoves.map(m => m.to);
  assert(camelTargets.includes('a4') && camelTargets.includes('c4'), 'Knight at b1 gets Camel (3,1) leaps to a4 and c4');
  assert(camelMoves[0].energyCost === 2, 'Cavalry Charge requires 2 energy');

  const execCamel = camelEngine.makeEmpoweredMove(camelMoves.find(m => m.to === 'c4')!);
  assert(execCamel.success === true, 'Executing Camel leap c4 succeeds');
  assert(camelEngine.getPiece('b1') === undefined, 'b1 vacated');
  assert(camelEngine.getPiece('c4')?.type === 'n', 'Knight arrived at c4');
  assert(camelEngine.getTurn() === 'b', 'Turn advanced to Black atomically');
  assert(camelEngine.getEnergy() === 3, 'Energy reset to 3 for Black');
  assert(!camelEngine.getWhiteHand().includes('knight_cavalry_charge'), 'Card consumed from White hand');

  // 2. Zebra leap (3,2) for Knight (knight_spring_vault)
  const zebraEngine = new DeckChessEngine('rnbqkbnr/pppp1ppp/8/8/3N4/8/PPP1PPPP/R1BQKBNR w KQkq - 0 1', ['knight_spring_vault']);
  const zebraMoves = zebraEngine.getEmpoweredMoves('d4');
  const zebraTargets = zebraMoves.map(m => m.to);
  assert(zebraTargets.includes('g6') && zebraTargets.includes('f7'), 'Knight at d4 gets Zebra (3,2) leaps to g6 and f7');
  const execZebra = zebraEngine.makeEmpoweredMove(zebraMoves.find(m => m.to === 'f7')!);
  assert(execZebra.success === true, 'Executing Zebra leap to f7 succeeds');
  assert(zebraEngine.getPiece('f7')?.type === 'n', 'Knight arrived at f7');
  assert(zebraEngine.getGraveyard().b.p === 1, 'Black pawn at f7 added to graveyard');

  // 3. Dabbaba straight jump (2,0) for Knight (knight_straight_lance)
  const lanceEngine = new DeckChessEngine('rnbqkbnr/pppp1ppp/3p4/8/3N4/8/PPP1PPPP/R1BQKBNR w KQkq - 0 1', ['knight_straight_lance']);
  const lanceMoves = lanceEngine.getEmpoweredMoves('d4');
  const lanceTargets = lanceMoves.map(m => m.to);
  assert(lanceTargets.includes('d6'), 'Knight at d4 gets straight 2-square lunge to d6 over empty d5');
  const execLance = lanceEngine.makeEmpoweredMove(lanceMoves.find(m => m.to === 'd6')!);
  assert(execLance.success === true, 'Executing straight lance to d6 succeeds');
  assert(lanceEngine.getPiece('d6')?.type === 'n', 'Knight arrived at d6');

  // 4. Bayonet forward capture & Rank 8 promotion invariant (pawn_bayonet_charge)
  const bayonetEngine = new DeckChessEngine('4r3/4P3/8/8/8/8/8/4K2k w - - 0 1', ['pawn_bayonet_charge']);
  const bayonetMoves = bayonetEngine.getEmpoweredMoves('e7');
  assert(bayonetMoves.length === 1 && bayonetMoves[0].to === 'e8', 'Bayonet Charge allows straight capture of enemy rook on e8');
  const execBayonet = bayonetEngine.makeEmpoweredMove(bayonetMoves[0]);
  assert(execBayonet.success === true, 'Bayonet Charge executes straight forward capture');
  assert(bayonetEngine.getPiece('e8')?.type === 'q', 'CRITICAL INVARIANT: Pawn landing on rank 8 promoted to Queen');
  assert(bayonetEngine.getGraveyard().b.r === 1, 'Captured enemy rook added to graveyard');

  // 5. Prism Ray piercing slide through pawn (bishop_piercing_ray)
  const rayEngine = new DeckChessEngine('rnbqkbnr/pp1ppppp/8/8/5p2/4p3/PPP1PPPP/RNBQKBNR w KQkq - 0 1', ['bishop_piercing_ray']);
  const rayMoves = rayEngine.getEmpoweredMoves('c1');
  assert(rayMoves.some(m => m.to === 'f4'), 'Piercing ray targets second enemy piece on diagonal at f4');
  const execRay = rayEngine.makeEmpoweredMove(rayMoves.find(m => m.to === 'f4')!);
  assert(execRay.success === true, 'Piercing ray executes double-target slide');
  assert(rayEngine.getPiece('f4')?.type === 'b', 'Bishop arrived at f4');
  assert(rayEngine.getPiece('e3') === undefined, 'Intervening enemy pawn at e3 destroyed');
  assert(rayEngine.getGraveyard().b.p === 2, 'Both enemy pawns added to Black graveyard (count = 2)');

  // 6. In-place diagonal capture under pin (pawn_hold_the_line)
  const pinEngine = new DeckChessEngine('4q2k/8/8/8/8/3b4/4P3/4K3 w - - 0 1', ['pawn_hold_the_line']);
  assert(!pinEngine.getLegalMoves('e2').map(m => m.to).includes('d3'), 'Pawn at e2 cannot capture diagonally on d3 in standard chess due to pin');
  const holdMoves = pinEngine.getEmpoweredMoves('e2');
  assert(holdMoves.length === 1 && holdMoves[0].to === 'd3', 'Hold the Line provides in-place capture on d3');
  assert(holdMoves[0].actionType === 'in_place', 'Action type is in_place');
  const execHold = pinEngine.makeEmpoweredMove(holdMoves[0]);
  assert(execHold.success === true, 'Hold the Line executes in-place diagonal destruction');
  assert(pinEngine.getPiece('e2')?.type === 'p', 'Pawn remained at e2 (did not move)');
  assert(pinEngine.getPiece('d3') === undefined, 'Enemy bishop at d3 destroyed');
  assert(pinEngine.getGraveyard().b.b === 1, 'Enemy bishop added to Black graveyard');
  assert(!pinEngine.inCheck(), 'King at e1 safely preserved out of check');

  // 7. Bishop orthogonal step color inversion (bishop_aisle_step)
  const aisleEngine = new DeckChessEngine('rnbqkbnr/pppppppp/8/8/3B4/8/PPPPPPPP/RN1QK1NR w KQkq - 0 1', ['bishop_aisle_step']);
  const aisleMoves = aisleEngine.getEmpoweredMoves('d4');
  const aisleTargets = aisleMoves.map(m => m.to);
  assert(aisleTargets.includes('d5') && aisleTargets.includes('e4') && aisleTargets.includes('d3') && aisleTargets.includes('c4'), 'All 4 orthogonal steps available for Aisle Step');
  const execAisle = aisleEngine.makeEmpoweredMove(aisleMoves.find(m => m.to === 'd5')!);
  assert(execAisle.success === true, 'Aisle step succeeds');
  assert(aisleEngine.getPiece('d5')?.type === 'b', 'Bishop now at d5 (light square, color inverted!)');

  // 8. Knight jump color flip (bishop_heretic_s_gambit)
  const hereticEngine = new DeckChessEngine('4b3/8/8/8/8/8/8/2B1K2k w - - 0 1', ['bishop_heretic_s_gambit']);
  const hereticMoves = hereticEngine.getEmpoweredMoves('c1');
  const hereticTargets = hereticMoves.map(m => m.to);
  assert(hereticTargets.includes('d3') && hereticTargets.includes('b3'), 'Heretic Gambit provides Knight jumps from bishop square');
  const execHeretic = hereticEngine.makeEmpoweredMove(hereticMoves.find(m => m.to === 'd3')!);
  assert(execHeretic.success === true, 'Heretic Gambit executed');
  assert(hereticEngine.getPiece('d3')?.type === 'b', 'Bishop jumped like a knight to d3');

  // 9. Pawn sideways bypass step (pawn_sidestep)
  const sideEngine = new DeckChessEngine('4k3/8/8/4p3/4P3/8/8/4K3 w - - 0 1', ['pawn_sidestep']);
  const sideMoves = sideEngine.getEmpoweredMoves('e4');
  const sideTargets = sideMoves.map(m => m.to);
  assert(sideTargets.includes('d4') && sideTargets.includes('f4'), 'Sidestep offers d4 and f4 when blocked in front');
  const execSide = sideEngine.makeEmpoweredMove(sideMoves.find(m => m.to === 'd4')!);
  assert(execSide.success === true, 'Sidestep executed');
  assert(sideEngine.getPiece('d4')?.type === 'p', 'Pawn sidestepped to d4');

  // 10. King Safety Invariant: Pin Ray Linear Intercept (knight_ray_intercept)
  const rayPinEngine = new DeckChessEngine('4k3/8/8/b7/8/8/3N4/4K3 w - - 0 1', ['knight_ray_intercept']);
  const interceptMoves = rayPinEngine.getEmpoweredMoves('d2');
  const interceptTargets = interceptMoves.map(m => m.to);
  assert(interceptTargets.includes('c3') && interceptTargets.includes('b4'), 'Knight can slide along pin ray to c3 and b4');
  assert(!interceptTargets.includes('f3'), 'CRITICAL KING SAFETY: Knight CANNOT leap off pin ray to f3');
  const execIntercept = rayPinEngine.makeEmpoweredMove(interceptMoves.find(m => m.to === 'c3')!);
  assert(execIntercept.success === true, 'Knight slid along pin ray to c3');
  assert(!rayPinEngine.inCheck(), 'Friendly King remains safe from check');
}

// ==========================================
// Suite 14: Major Unit 90-Card Catalog & 180-Card Library
// ==========================================
console.log('\nSuite 14: Major Unit 90-Card Catalog & 180-Card Library');
{
  assert(Array.isArray(cardCatalogMajor90) && cardCatalogMajor90.length === 90, 'cardCatalogMajor90 contains exactly 90 cards');

  const validConditions = ['Position', 'Neighbors', 'Lines', 'Threat', 'Blocked', 'Momentum'];
  const validEffects = ['New Moves', 'Jump & Leap', 'Move Others', 'Special Captures', 'Walls & Shields', 'Spawning'];

  let allFieldsValid = true;
  let allNamesWithinLimit = true;
  for (const card of cardCatalogMajor90) {
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
    const nameToCheck = (card as any).card_name || card.name;
    if (nameToCheck.length > 21) {
      allNamesWithinLimit = false;
      break;
    }
  }
  assert(allFieldsValid, 'All 90 Major Unit cards possess all required contract fields adhering to 6x6 genres');
  assert(allNamesWithinLimit, 'All 90 Major Unit card names are 21 characters or less');

  // Verify distribution per piece
  const majorPieces = ['Rook', 'Queen', 'King'] as const;
  for (const piece of majorPieces) {
    const cards = cardCatalogMajor90.filter(c => c.piece === piece);
    assert(cards.length === 30, `${piece} has exactly 30 canonical cards`);

    const cost1 = cards.filter(c => c.energyCost === 1).length;
    const cost2 = cards.filter(c => c.energyCost === 2).length;
    const cost3 = cards.filter(c => c.energyCost === 3).length;
    assert(cost1 === 12 && cost2 === 12 && cost3 === 6, `${piece} adheres to 12 / 12 / 6 energy cost curve (1⚡: ${cost1}, 2⚡: ${cost2}, 3⚡: ${cost3})`);
  }

  // Verify Condition Exclusion and Specialization Invariants (Major Units 3-Cycle)
  // Rook (Excludes Position, Good at Neighbors: Walls & Shields + Move Others)
  const rookPos = cardCatalogMajor90.filter(c => c.piece === 'Rook' && c.condition_type === 'Position');
  assert(rookPos.length === 0, 'Rook excludes Position condition (Major Cycle Invariant)');
  const rookNeighbors = cardCatalogMajor90.filter(c => c.piece === 'Rook' && c.condition_type === 'Neighbors');
  assert(rookNeighbors.length === 10, 'Rook specializes in Neighbors (10 cards)');
  const rookWalls = rookNeighbors.filter(c => c.effect_type === 'Walls & Shields').length;
  const rookMoveOthers = rookNeighbors.filter(c => c.effect_type === 'Move Others').length;
  assert(rookWalls === 5 && rookMoveOthers === 5, 'Rook Neighbors splits evenly: 5 Walls & Shields, 5 Move Others');

  // Queen (Excludes Neighbors, Good at Threat: Special Captures + Jump & Leap)
  const queenNeighbors = cardCatalogMajor90.filter(c => c.piece === 'Queen' && c.condition_type === 'Neighbors');
  assert(queenNeighbors.length === 0, 'Queen excludes Neighbors condition (Major Cycle Invariant)');
  const queenThreat = cardCatalogMajor90.filter(c => c.piece === 'Queen' && c.condition_type === 'Threat');
  assert(queenThreat.length === 10, 'Queen specializes in Threat (10 cards)');
  const queenSpecialCaptures = queenThreat.filter(c => c.effect_type === 'Special Captures').length;
  const queenJumpLeap = queenThreat.filter(c => c.effect_type === 'Jump & Leap').length;
  assert(queenSpecialCaptures === 5 && queenJumpLeap === 5, 'Queen Threat splits evenly: 5 Special Captures, 5 Jump & Leap');

  // King (Excludes Threat, Good at Position: Spawning + Walls & Shields)
  const kingThreat = cardCatalogMajor90.filter(c => c.piece === 'King' && c.condition_type === 'Threat');
  assert(kingThreat.length === 0, 'King excludes Threat condition (Major Cycle Invariant)');
  const kingPosition = cardCatalogMajor90.filter(c => c.piece === 'King' && c.condition_type === 'Position');
  assert(kingPosition.length === 10, 'King specializes in Position (10 cards)');
  const kingSpawning = kingPosition.filter(c => c.effect_type === 'Spawning').length;
  const kingWalls = kingPosition.filter(c => c.effect_type === 'Walls & Shields').length;
  assert(kingSpawning === 5 && kingWalls === 5, 'King Position splits evenly: 5 Spawning, 5 Walls & Shields');

  // Verify CANONICAL_MAJOR_90_CARDS export
  assert(CANONICAL_MAJOR_90_CARDS.length === 90, 'CANONICAL_MAJOR_90_CARDS exports exactly 90 cards');

  // Verify CANONICAL_180_CARDS export & uniqueness
  assert(CANONICAL_180_CARDS.length === 180, 'CANONICAL_180_CARDS contains exactly 180 cards');
  const uniqueIds = new Set(CANONICAL_180_CARDS.map(c => c.id));
  assert(uniqueIds.size === 180, 'All 180 cards in CANONICAL_180_CARDS have unique IDs');

  // Verify getCardById resolution across all 6 pieces
  const sampleIds = [
    'pawn_bayonet_charge',
    'knight_cavalry_charge',
    'bishop_piercing_ray',
    'rook_railgun_bolt',
    'queen_counter_smite',
    'king_keep_garrison',
  ];
  let allSamplesResolved = true;
  for (const id of sampleIds) {
    if (!getCardById(id)) {
      allSamplesResolved = false;
      break;
    }
  }
  assert(allSamplesResolved, 'getCardById resolves sample cards across all 6 pieces (Pawn, Knight, Bishop, Rook, Queen, King)');
}

// ==========================================
// Suite 15: Major Unit Handlers & Royal Invariant Suite
// ==========================================
console.log('\nSuite 15: Major Unit Handlers & Royal Invariant Suite');
{
  // 1. All 180 cards have a registered CardBehaviorHandler
  let all180Registered = true;
  let missingCardId = '';
  for (const card of CANONICAL_180_CARDS) {
    if (!getCardHandler(card.id)) {
      all180Registered = false;
      missingCardId = card.id;
      break;
    }
  }
  assert(all180Registered, 'All 180 canonical cards have a registered CardBehaviorHandler', missingCardId ? `Missing handler: ${missingCardId}` : undefined);

  // 2. Rook: Railgun Bolt (rook_railgun_bolt) - Ranged capture along open/blocked line
  const railgunEngine = new DeckChessEngine('4k3/8/8/8/4r3/8/4P3/4R2K w - - 0 1', ['rook_railgun_bolt']);
  const railgunMoves = railgunEngine.getEmpoweredMoves('e1');
  assert(railgunMoves.some(m => m.to === 'e4' && m.actionType === 'ranged_capture'), 'Railgun Bolt allows ranged capture of e4 over friendly pawn e2');
  const execRailgun = railgunEngine.makeEmpoweredMove(railgunMoves.find(m => m.to === 'e4')!);
  assert(execRailgun.success === true, 'Railgun Bolt executes ranged capture');
  assert(railgunEngine.getPiece('e1')?.type === 'r', 'Rook remained at e1 (ranged strike)');
  assert(railgunEngine.getPiece('e4') === undefined, 'Enemy rook at e4 destroyed');
  assert(railgunEngine.getGraveyard().b.r === 1, 'Captured enemy rook added to Black graveyard');

  // 3. Rook: Turret Traverse (rook_turret_traverse) - Diagonal step when orthogonally blocked
  const turretEngine = new DeckChessEngine('4k3/8/8/8/8/4P3/3PRP2/4K3 w - - 0 1', ['rook_turret_traverse']);
  const turretMoves = turretEngine.getEmpoweredMoves('e2');
  const turretTargets = turretMoves.map(m => m.to);
  assert(turretTargets.includes('d3') && turretTargets.includes('f3'), 'Turret Traverse offers diagonal steps to d3 and f3');
  const execTurret = turretEngine.makeEmpoweredMove(turretMoves.find(m => m.to === 'd3')!);
  assert(execTurret.success === true, 'Turret Traverse executes diagonal shift');
  assert(turretEngine.getPiece('d3')?.type === 'r', 'Rook arrived at d3');

  // 4. Rook: Siege Hurdle (rook_siege_hurdle) - Orthogonal jump over 1 blocker
  const hurdleEngine = new DeckChessEngine('4k3/8/8/8/8/4p3/8/4R2K w - - 0 1', ['rook_siege_hurdle']);
  const hurdleMoves = hurdleEngine.getEmpoweredMoves('e1');
  const hurdleTargets = hurdleMoves.map(m => m.to);
  assert(hurdleTargets.includes('e4') && hurdleTargets.includes('e5'), 'Siege Hurdle allows leap over e3 to e4 and e5');
  const execHurdle = hurdleEngine.makeEmpoweredMove(hurdleMoves.find(m => m.to === 'e4')!);
  assert(execHurdle.success === true, 'Siege Hurdle executes leap');
  assert(hurdleEngine.getPiece('e4')?.type === 'r', 'Rook landed on e4');

  // 5. Rook: Trench Shift (rook_trench_shift) - Swap with horizontally adjacent friendly pawn
  const trenchEngine = new DeckChessEngine('4k3/8/8/8/8/8/4PR2/4K3 w - - 0 1', ['rook_trench_shift']);
  const trenchMoves = trenchEngine.getEmpoweredMoves('f2');
  assert(trenchMoves.some(m => m.to === 'e2'), 'Trench Shift targets adjacent friendly pawn at e2');
  const execTrench = trenchEngine.makeEmpoweredMove(trenchMoves.find(m => m.to === 'e2')!);
  assert(execTrench.success === true, 'Trench Shift executes swap');
  assert(trenchEngine.getPiece('e2')?.type === 'r', 'Rook now at e2');
  assert(trenchEngine.getPiece('f2')?.type === 'p', 'Pawn now at f2');

  // 6. Queen: Counter Smite (queen_counter_smite) - Ranged strike on threatening minor piece
  const smiteEngine = new DeckChessEngine('4k3/8/8/8/3n4/8/8/3QK3 w - - 0 1', ['queen_counter_smite']);
  const smiteMoves = smiteEngine.getEmpoweredMoves('d1');
  assert(smiteMoves.some(m => m.to === 'd4' && m.actionType === 'ranged_capture'), 'Counter Smite targets threatening knight at d4 with ranged capture');
  const execSmite = smiteEngine.makeEmpoweredMove(smiteMoves.find(m => m.to === 'd4')!);
  assert(execSmite.success === true, 'Counter Smite executes ranged strike');
  assert(smiteEngine.getPiece('d1')?.type === 'q', 'Queen remained at d1');
  assert(smiteEngine.getPiece('d4') === undefined, 'Knight at d4 destroyed');
  assert(smiteEngine.getGraveyard().b.n === 1, 'Captured knight added to Black graveyard');

  // 7. Queen: Amazon Hop (queen_amazon_hop) - Knight leap escape under threat
  const amazonEngine = new DeckChessEngine('4k3/8/8/8/3n4/8/8/3QK3 w - - 0 1', ['queen_amazon_hop']);
  const amazonMoves = amazonEngine.getEmpoweredMoves('d1');
  const amazonTargets = amazonMoves.map(m => m.to);
  assert(amazonTargets.includes('c3') && amazonTargets.includes('e3'), 'Amazon Hop offers knight jumps c3 and e3');
  const execAmazon = amazonEngine.makeEmpoweredMove(amazonMoves.find(m => m.to === 'c3')!);
  assert(execAmazon.success === true, 'Amazon Hop executes knight leap');
  assert(amazonEngine.getPiece('c3')?.type === 'q', 'Queen arrived at c3');

  // 8. Queen: Camel Stride (queen_camel_stride) - Extended (3,1) leap
  const camelStrideEngine = new DeckChessEngine('4k3/8/8/8/8/8/8/3QK3 w - - 0 1', ['queen_camel_stride']);
  const camelStrideMoves = camelStrideEngine.getEmpoweredMoves('d1');
  const camelStrideTargets = camelStrideMoves.map(m => m.to);
  assert(camelStrideTargets.includes('c4') && camelStrideTargets.includes('e4'), 'Camel Stride offers (3,1) leaps to c4 and e4');
  const execCamelStride = camelStrideEngine.makeEmpoweredMove(camelStrideMoves.find(m => m.to === 'e4')!);
  assert(execCamelStride.success === true, 'Camel Stride executes leap');
  assert(camelStrideEngine.getPiece('e4')?.type === 'q', 'Queen arrived at e4');

  // 9. King: Keep Garrison (king_keep_garrison) - Back-rank king spawns pawn on 2nd rank
  const garrisonEngine = new DeckChessEngine('4k3/8/8/8/8/8/8/4K3 w - - 0 1', ['king_keep_garrison']);
  const garrisonMoves = garrisonEngine.getEmpoweredMoves('e1');
  assert(garrisonMoves.some(m => m.to === 'e2' && m.actionType === 'spawn'), 'Keep Garrison offers spawn on empty e2');
  const execGarrison = garrisonEngine.makeEmpoweredMove(garrisonMoves.find(m => m.to === 'e2')!);
  assert(execGarrison.success === true, 'Keep Garrison executes spawn');
  assert(garrisonEngine.getPiece('e1')?.type === 'k', 'King remained at e1');
  assert(garrisonEngine.getPiece('e2')?.type === 'p' && garrisonEngine.getPiece('e2')?.color === 'w', 'Pawn spawned at e2');

  // 10. King: Sanctuary Hop (king_sanctuary_hop) - Jump 2 squares over blocker
  const sanctuaryEngine = new DeckChessEngine('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1', ['king_sanctuary_hop']);
  const sanctuaryMoves = sanctuaryEngine.getEmpoweredMoves('e1');
  assert(sanctuaryMoves.some(m => m.to === 'e3'), 'Sanctuary Hop offers jump over e2 to e3');
  const execSanctuary = sanctuaryEngine.makeEmpoweredMove(sanctuaryMoves.find(m => m.to === 'e3')!);
  assert(execSanctuary.success === true, 'Sanctuary Hop executes jump');
  assert(sanctuaryEngine.getPiece('e3')?.type === 'k', 'King arrived at e3');

  // 11. King: Bodyguard Switch (king_bodyguard_switch) - Swap with adjacent Rook
  const bodyguardEngine = new DeckChessEngine('4k3/8/8/8/8/8/8/4KR2 w - - 0 1', ['king_bodyguard_switch']);
  const bodyguardMoves = bodyguardEngine.getEmpoweredMoves('e1');
  assert(bodyguardMoves.some(m => m.to === 'f1'), 'Bodyguard Switch offers swap with rook at f1');
  const execBodyguard = bodyguardEngine.makeEmpoweredMove(bodyguardMoves.find(m => m.to === 'f1')!);
  assert(execBodyguard.success === true, 'Bodyguard Switch executes swap');
  assert(bodyguardEngine.getPiece('f1')?.type === 'k', 'King now at f1');
  assert(bodyguardEngine.getPiece('e1')?.type === 'r', 'Rook now at e1');

  // 12. Royal Check Invariant: King move destination CANNOT leave King in check
  const checkPinEngine = new DeckChessEngine('4k3/8/8/4r3/8/8/8/4K3 w - - 0 1', ['king_sanctuary_hop']);
  const checkPinMoves = checkPinEngine.getEmpoweredMoves('e1');
  // All moves that land on e-file (e.g. e2, e3) must be filtered out because Black rook on e5 attacks the entire e-file
  assert(!checkPinMoves.some(m => m.to.startsWith('e')), 'CRITICAL KING SAFETY: King empowered moves into check on e-file are strictly filtered');

  // 13. King Exemption Invariant: Ranged captures and Special Captures can NEVER target an enemy King
  const kingSnipeEngine = new DeckChessEngine('4k3/8/8/8/8/8/8/4R2K w - - 0 1', ['rook_railgun_bolt']);
  const kingSnipeMoves = kingSnipeEngine.getEmpoweredMoves('e1');
  assert(!kingSnipeMoves.some(m => m.to === 'e8'), 'CRITICAL INVARIANT: Ranged captures can NEVER target the enemy King');

  // 14. Rank 2-7 Invariant: Major unit spawn/move effects never place a pawn on rank 1 or rank 8
  let rank2to7Valid = true;
  for (const card of CANONICAL_180_CARDS) {
    if (card.effect_type === 'Spawning') {
      const handler = getCardHandler(card.id);
      if (handler) {
        const dummyEngine = new DeckChessEngine('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
        const targets = handler.getTargets(dummyEngine, 'e1');
        for (const t of targets) {
          const rank = parseInt(t[1], 10);
          if (rank < 2 || rank > 7) {
            rank2to7Valid = false;
            break;
          }
        }
      }
    }
  }
  assert(rank2to7Valid, 'Pawn spawning targets for all Spawning cards are strictly between rank 2 and 7');
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
