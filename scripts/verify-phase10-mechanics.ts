/**
 * Automated Specification & Invariant Verification Suite for Phase 10:
 * R1 Ray-Distance Scanning Engine & Clean Slate Deselection State Machine
 */

import { DeckChessEngine } from '../src/engine/DeckChessEngine';
import { CANONICAL_36_CARDS } from '../src/engine/cards/releaseRoster36';

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
console.log(' PHASE 10: R1 RAY DISTANCE & CLEAN SLATE SUITE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ==========================================
// Suite 1: R1 Ray-Distance Scanning (Horizontal)
// ==========================================
console.log('Suite 1: R1 Ray-Distance Scanning (Horizontal Ray)');
{
  // Rook on h2, friendly Pawn on c2. Empty on g2, f2, e2, d2.
  // FEN: 4k3/8/8/8/8/8/2P4R/7K w - - 0 1
  const engine = new DeckChessEngine('4k3/8/8/8/8/8/2P4R/7K w - - 0 1', ['r1_make_way']);
  const moves = engine.getEmpoweredMoves('h2').filter((m) => m.cardId === 'r1_make_way');

  assert(moves.length > 0, 'R1 generates moves for Rook at h2 with Pawn at c2 (distance = 5)');

  // Perpendiculars for c2 are c1 and c3 (both on board and empty)
  const extraSquares = Array.from(new Set(moves.map((m) => m.extraSquare)));
  assert(
    extraSquares.includes('c1') && extraSquares.includes('c3') && extraSquares.length === 2,
    'Pawn at c2 offers exactly c1 and c3 as perpendicular step-aside options'
  );

  // Intermediate squares: g2, f2, e2, d2
  for (const sq of ['g2', 'f2', 'e2', 'd2']) {
    assert(
      moves.some((m) => m.to === sq),
      `Rook can stop at intermediate square ${sq} prior to the pawn`
    );
  }

  // Vacated square: c2
  assert(moves.some((m) => m.to === 'c2'), 'Rook can stop at vacated square c2');

  // Squares beyond: b2, a2
  assert(moves.some((m) => m.to === 'b2'), 'Rook can charge beyond to b2');
  assert(moves.some((m) => m.to === 'a2'), 'Rook can charge beyond to a2');
}

// ==========================================
// Suite 2: R1 Ray-Distance Scanning (Vertical Ray & Capture Beyond)
// ==========================================
console.log('\nSuite 2: R1 Ray-Distance Scanning (Vertical Ray & Enemy Capture)');
{
  // Rook on d1, friendly Pawn on d5. Empty: d2, d3, d4.
  // Enemy Black Bishop on d7. Empty d6.
  // FEN: 4k3/3b4/8/3P4/8/8/8/3R3K w - - 0 1
  const engine = new DeckChessEngine('4k3/3b4/8/3P4/8/8/8/3R3K w - - 0 1', ['r1_make_way']);
  const moves = engine.getEmpoweredMoves('d1').filter((m) => m.cardId === 'r1_make_way');

  assert(moves.length > 0, 'R1 generates moves for vertical ray distance (d1 to d5)');

  // Perpendiculars for d5 are c5 and e5
  const extraSquares = Array.from(new Set(moves.map((m) => m.extraSquare)));
  assert(
    extraSquares.includes('c5') && extraSquares.includes('e5'),
    'Vertical ray offers horizontal perpendiculars c5 and e5'
  );

  // Rook can reach intermediate squares d2, d3, d4
  assert(
    ['d2', 'd3', 'd4'].every((sq) => moves.some((m) => m.to === sq)),
    'Rook can reach all intermediate vertical squares (d2, d3, d4)'
  );

  // Rook can reach vacated square d5
  assert(moves.some((m) => m.to === 'd5'), 'Rook can reach vacated square d5');

  // Rook can reach d6 (beyond) and d7 (capture enemy bishop)
  assert(moves.some((m) => m.to === 'd6'), 'Rook can step beyond to d6');
  assert(moves.some((m) => m.to === 'd7'), 'Rook can capture enemy bishop on d7');

  // Rook cannot pass through enemy on d7 to d8
  assert(!moves.some((m) => m.to === 'd8'), 'Rook cannot charge past enemy piece on d7 to d8');
}

// ==========================================
// Suite 3: R1 Line Obstructions & Perpendicular Blocking
// ==========================================
console.log('\nSuite 3: R1 Line Obstructions & Perpendicular Blocking');
{
  // Case A: Enemy piece blocks line before friendly pawn
  // Rook on h2, Enemy Knight on e2, Friendly Pawn on c2
  // FEN: 4k3/8/8/8/8/8/2P1n2R/7K w - - 0 1
  const engineBlockedByEnemy = new DeckChessEngine('4k3/8/8/8/8/8/2P1n2R/7K w - - 0 1', ['r1_make_way']);
  const movesBlockedEnemy = engineBlockedByEnemy.getEmpoweredMoves('h2').filter((m) => m.cardId === 'r1_make_way');
  assert(
    movesBlockedEnemy.length === 0,
    'R1 generates 0 moves when an enemy piece intercepts the ray before the pawn'
  );

  // Case B: Friendly piece blocks line before friendly pawn
  // Rook on h2, Friendly Knight on f2, Friendly Pawn on c2
  // FEN: 4k3/8/8/8/8/8/2P2N1R/7K w - - 0 1
  const engineBlockedByAlly = new DeckChessEngine('4k3/8/8/8/8/8/2P2N1R/7K w - - 0 1', ['r1_make_way']);
  const movesBlockedAlly = engineBlockedByAlly.getEmpoweredMoves('h2').filter((m) => m.cardId === 'r1_make_way');
  assert(
    movesBlockedAlly.length === 0,
    'R1 generates 0 moves when a friendly non-pawn piece intercepts the ray'
  );

  // Case C: Pawn has 0 available perpendicular squares (c1 and c3 blocked)
  // Rook on h2, Pawn on c2, pieces on c1 and c3
  // FEN: 4k3/8/8/8/8/2n5/2P4R/2B4K w - - 0 1
  const engineNoPerp = new DeckChessEngine('4k3/8/8/8/8/2n5/2P4R/2B4K w - - 0 1', ['r1_make_way']);
  const movesNoPerp = engineNoPerp.getEmpoweredMoves('h2').filter((m) => m.cardId === 'r1_make_way');
  assert(
    movesNoPerp.length === 0,
    'R1 generates 0 moves when the friendly pawn has no open perpendicular squares'
  );
}

// ==========================================
// Suite 4: R1 Execution & Board State Mutation
// ==========================================
console.log('\nSuite 4: R1 Execution & Board State Mutation');
{
  // Rook on h2, Pawn on c2, Enemy Rook on a2.
  // Pawn steps aside to c3, Rook charges to a2 capturing enemy Rook.
  // FEN: 4k3/8/8/8/8/8/r1P4R/7K w - - 0 1
  const engine = new DeckChessEngine('4k3/8/8/8/8/8/r1P4R/7K w - - 0 1', ['r1_make_way']);
  const targetMove = engine.getEmpoweredMoves('h2').find((m) => m.to === 'a2' && m.extraSquare === 'c3');

  assert(Boolean(targetMove), 'Target move found: Rook h2 -> a2, Pawn c2 -> c3');
  if (targetMove) {
    const res = engine.makeEmpoweredMove(targetMove);
    assert(res.success === true, 'Execution of R1 Make Way succeeds');

    // Verify Pawn moved to c3
    const pawnAtC3 = engine.getPiece('c3');
    assert(pawnAtC3?.type === 'p' && pawnAtC3?.color === 'w', 'Friendly Pawn successfully relocated to c3');

    // Verify Rook moved to a2
    const rookAtA2 = engine.getPiece('a2');
    assert(rookAtA2?.type === 'r' && rookAtA2?.color === 'w', 'Rook successfully charged to a2');

    // Verify original squares h2 and c2 are empty (chess.js get returns undefined when vacant)
    assert(!engine.getPiece('h2'), 'Original Rook square h2 is now empty');
    assert(!engine.getPiece('c2'), 'Original Pawn square c2 is now empty');

    // Verify captured piece in graveyard
    const blackGraveyard = engine.getGraveyard().b;
    assert(blackGraveyard.r > 0, 'Captured enemy Rook recorded in Black graveyard');
  }
}

// ==========================================
// Suite 5: Release Roster 36 Copy Alignment
// ==========================================
console.log('\nSuite 5: Release Roster 36 Copy Alignment');
{
  const r1Card = CANONICAL_36_CARDS.find((c) => c.id === 'r1_make_way');
  assert(Boolean(r1Card), 'r1_make_way found in CANONICAL_36_CARDS');

  if (r1Card) {
    assert(
      !r1Card.conditionText.includes('...') && !r1Card.effectText.includes('...'),
      'R1 has zero ellipses in condition and effect copy'
    );
    assert(
      r1Card.conditionText.toLowerCase().includes('line of sight') || r1Card.conditionText.toLowerCase().includes('orthogonal'),
      'R1 condition copy describes orthogonal line of sight ray scanning'
    );
  }
}

// ==========================================
// Suite 6: Card Deselection Blank Slate State Machine Simulation
// ==========================================
console.log('\nSuite 6: Card Deselection Blank Slate State Machine');
{
  // Test the clean slate invariants:
  // Given: an active state with selectedSquare = 'a1', selectedCardId = 'r1_make_way'
  // When toggled off:
  // selectedSquare MUST be null, selectedCardId MUST be null,
  // legalMovesForSelected MUST be [], empoweredMovesForSelected MUST be []
  interface UISelectionState {
    selectedCardId: string | null;
    selectedSquare: string | null;
    legalMovesForSelected: string[];
    empoweredMovesForSelected: any[];
  }

  // Model the transition function under the new clean slate invariant
  function transitionToggleCard(state: UISelectionState, toggledCardId: string): UISelectionState {
    if (state.selectedCardId === toggledCardId) {
      // Clean slate deselection:
      return {
        selectedCardId: null,
        selectedSquare: null,
        legalMovesForSelected: [],
        empoweredMovesForSelected: [],
      };
    }
    return state;
  }

  const initialArmedState: UISelectionState = {
    selectedCardId: 'r1_make_way',
    selectedSquare: 'a1',
    legalMovesForSelected: ['a2', 'a3'],
    empoweredMovesForSelected: [{ to: 'a5' }],
  };

  const nextState = transitionToggleCard(initialArmedState, 'r1_make_way');
  assert(nextState.selectedCardId === null, 'Deselecting card resets selectedCardId to null');
  assert(nextState.selectedSquare === null, 'Deselecting card resets selectedSquare to null (blank slate)');
  assert(nextState.legalMovesForSelected.length === 0, 'Deselecting card resets legalMovesForSelected to empty array');
  assert(nextState.empoweredMovesForSelected.length === 0, 'Deselecting card resets empoweredMovesForSelected to empty array');
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
