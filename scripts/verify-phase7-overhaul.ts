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

const suiteArg = process.argv.find(a => a.startsWith('--suite='))?.split('=')[1];

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(' PHASE 7: 36-CARD ABILITY OVERHAUL SPECIFICATION SUITE');
console.log(` Filter: ${suiteArg || 'ALL SUITES'}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// =========================================================================
// SUITE 1: PAWNS (P1, P3, P4, P5, P6, P7, P8)
// =========================================================================
if (!suiteArg || suiteArg === 'pawns-bishops' || suiteArg === 'pawns') {
  console.log('--- Suite 1: Pawns Overhaul (P1, P3, P4, P5, P6, P7, P8) ---');

  // P1: Sidestep
  {
    // Blocked frontally by enemy piece: can step diagonally forward onto empty square
    const engine = new DeckChessEngine('4k3/8/8/8/4n3/8/4P3/4K3 w - - 0 1', ['p1_sidestep']);
    const moves = engine.getEmpoweredMoves('e2');
    assert(moves.length === 0, 'P1: Pawn on e2 not blocked at e3 generates 0 moves');

    const engineBlocked = new DeckChessEngine('4k3/8/8/8/8/4n3/4P3/4K3 w - - 0 1', ['p1_sidestep']);
    const movesBlocked = engineBlocked.getEmpoweredMoves('e2');
    assert(movesBlocked.length === 2, 'P1: Pawn blocked at e3 generates 2 diagonal moves (d3, f3)');
    assert(movesBlocked.some(m => m.to === 'd3') && movesBlocked.some(m => m.to === 'f3'), 'P1: targets d3 and f3');
    
    // Execute d3
    const move = movesBlocked.find(m => m.to === 'd3')!;
    const res = engineBlocked.makeEmpoweredMove(move);
    assert(res.success === true, 'P1: execution succeeds');
    assert(engineBlocked.getPiece('d3')?.type === 'p' && engineBlocked.getPiece('d3')?.color === 'w', 'P1: Pawn landed on d3');
    assert(engineBlocked.getPiece('e3')?.type === 'n', 'P1: Blocking enemy piece still on e3');
  }

  // P3: March Together
  {
    // Two horizontally adjacent friendly pawns with open front squares
    const engine = new DeckChessEngine('4k3/8/8/8/3PP3/8/8/4K3 w - - 0 1', ['p3_follow_me']);
    const moves = engine.getEmpoweredMoves('d4');
    assert(moves.length > 0, 'P3: Adjacent friendly pawns generate March Together moves');
    const marchMove = moves.find(m => m.to === 'd5' && m.extraSquare === 'e4');
    assert(Boolean(marchMove), 'P3: Found move advancing d4 to d5 with partner e4');

    const res = engine.makeEmpoweredMove(marchMove!);
    assert(res.success === true, 'P3: execution succeeds');
    assert(engine.getPiece('d5')?.type === 'p' && engine.getPiece('d5')?.color === 'w', 'P3: Primary pawn advanced to d5');
    assert(engine.getPiece('e5')?.type === 'p' && engine.getPiece('e5')?.color === 'w', 'P3: Partner pawn advanced to e5');
    assert(!engine.getPiece('d4') && !engine.getPiece('e4'), 'P3: Vacated d4 and e4');
  }

  // P4: Attack Together
  {
    // Pawn captures diagonally while another friendly pawn is in its 8 surrounding squares
    // White pawns at d4 and c4, enemy knight at e5
    const engine = new DeckChessEngine('4k3/8/8/4n3/2PP4/8/8/4K3 w - - 0 1', ['p4_attack_together']);
    const moves = engine.getEmpoweredMoves('d4');
    const attackMove = moves.find(m => m.to === 'e5' && m.extraSquare === 'c4');
    assert(Boolean(attackMove), 'P4: Found Attack Together move capturing e5 with adjacent partner c4');

    const res = engine.makeEmpoweredMove(attackMove!);
    assert(res.success === true, 'P4: execution succeeds');
    assert(engine.getPiece('e5')?.type === 'p' && engine.getPiece('e5')?.color === 'w', 'P4: Attacking pawn on e5');
    assert(engine.getPiece('d4')?.type === 'p' && engine.getPiece('d4')?.color === 'w', 'P4: Adjacent pawn stepped into vacated d4');
    assert(!engine.getPiece('c4'), 'P4: c4 is now empty');
    assert(engine.getGraveyard().b.n === 1, 'P4: Black knight sent to graveyard');
  }

  // P5: Get Behind Me
  {
    // Friendly non-pawn in 3 forward squares under attack; swap places
    // White pawn at e4, white knight at e5. Black rook at e8 attacks e5.
    const engine = new DeckChessEngine('4r1k1/8/8/4N3/4P3/8/8/4K3 w - - 0 1', ['p5_get_behind_me']);
    const moves = engine.getEmpoweredMoves('e4');
    const swapMove = moves.find(m => m.to === 'e5');
    assert(Boolean(swapMove), 'P5: Generates rescue swap move with attacked ally on e5');

    const res = engine.makeEmpoweredMove(swapMove!);
    assert(res.success === true, 'P5: execution succeeds');
    assert(engine.getPiece('e5')?.type === 'p', 'P5: Pawn is now on e5');
    assert(engine.getPiece('e4')?.type === 'n', 'P5: Knight rescued to e4');
  }

  // P6: Double Time
  {
    // Pawn on Rank 3, 4, or 5 with 2 empty squares ahead sprints 2 squares forward
    const engineRank3 = new DeckChessEngine('4k3/8/8/8/8/4P3/8/4K3 w - - 0 1', ['p6_tag_out']);
    const moves3 = engineRank3.getEmpoweredMoves('e3');
    assert(moves3.some(m => m.to === 'e5'), 'P6: Pawn on e3 (Rank 3) can sprint 2 squares to e5');

    const res = engineRank3.makeEmpoweredMove(moves3.find(m => m.to === 'e5')!);
    assert(res.success === true, 'P6: execution succeeds');
    assert(engineRank3.getPiece('e5')?.type === 'p', 'P6: Pawn reached e5');

    // On Rank 2, Double Time should reject (it is only for Ranks 3-5)
    const engineRank2 = new DeckChessEngine('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1', ['p6_tag_out']);
    const moves2 = engineRank2.getEmpoweredMoves('e2');
    assert(moves2.length === 0, 'P6: Pawn on e2 (Rank 2) rejects Double Time');
  }

  // P7: Protect the King
  {
    // Friendly King is in 8 surrounding squares; Pawn slides diagonally like a Bishop
    // White King on e1, White Pawn on d2 (adjacent).
    const engine = new DeckChessEngine('4k3/8/8/8/7r/8/3P4/4K3 w - - 0 1', ['p7_protect_the_king']);
    const moves = engine.getEmpoweredMoves('d2');
    assert(moves.some(m => m.to === 'c3') && moves.some(m => m.to === 'b4') && moves.some(m => m.to === 'a5'), 'P7: Pawn slides along c3-b4-a5 diagonal');
    assert(moves.some(m => m.to === 'h6'), 'P7: Pawn slides along e3-f4-g5-h6 diagonal');

    const move = moves.find(m => m.to === 'a5')!;
    const res = engine.makeEmpoweredMove(move);
    assert(res.success === true, 'P7: execution succeeds');
    assert(engine.getPiece('a5')?.type === 'p', 'P7: Pawn moved to a5');
  }

  // P8: Call Reserves
  {
    // Pawn on Ranks 5-7 with empty rear-diagonal square spawns friendly pawn
    // White pawn on e5. Rear diagonals: d4, f4.
    const engine = new DeckChessEngine('4k3/8/8/4P3/8/8/8/4K3 w - - 0 1', ['p8_call_reserves']);
    const moves = engine.getEmpoweredMoves('e5');
    assert(moves.some(m => m.to === 'd4') && moves.some(m => m.to === 'f4'), 'P8: Spawns pawn on d4 or f4');

    const spawnMove = moves.find(m => m.to === 'd4')!;
    const res = engine.makeEmpoweredMove(spawnMove);
    assert(res.success === true, 'P8: execution succeeds');
    assert(engine.getPiece('e5')?.type === 'p', 'P8: Original pawn stays on e5');
    assert(engine.getPiece('d4')?.type === 'p' && engine.getPiece('d4')?.color === 'w', 'P8: New pawn spawned on d4');
  }
}

// =========================================================================
// SUITE 2: BISHOPS (B1, B2, B4, B5, B6, B7)
// =========================================================================
if (!suiteArg || suiteArg === 'pawns-bishops' || suiteArg === 'bishops') {
  console.log('\n--- Suite 2: Bishops Overhaul (B1, B2, B4, B5, B6, B7) ---');

  // B1: Let Me Through
  {
    // Bishop phases through friendly pawn on forward diagonal
    // White Bishop at c1, White Pawn at d2. Empty e3, enemy rook at f4.
    const engine = new DeckChessEngine('4k3/8/8/8/5r2/8/3P4/2B1K3 w - - 0 1', ['b1_let_me_through']);
    const moves = engine.getEmpoweredMoves('c1');
    assert(moves.some(m => m.to === 'e3'), 'B1: Bishop phases through d2 to empty e3');
    assert(moves.some(m => m.to === 'f4'), 'B1: Bishop phases through d2 to capture f4');
    assert(!moves.some(m => m.to === 'd2'), 'B1: Does not land on d2');

    const res = engine.makeEmpoweredMove(moves.find(m => m.to === 'f4')!);
    assert(res.success === true, 'B1: execution succeeds');
    assert(engine.getPiece('f4')?.type === 'b', 'B1: Bishop on f4');
    assert(engine.getPiece('d2')?.type === 'p', 'B1: Friendly pawn on d2 untouched');
    assert(engine.getGraveyard().b.r === 1, 'B1: Black rook captured');
  }

  // B2: Pierce
  {
    // Exactly 1 enemy pawn on diagonal; destroy it and land on empty OR capture enemy beyond
    // White Bishop at c1, Black pawn at e3. f4 empty, Black knight at g5.
    const engine = new DeckChessEngine('4k3/8/8/6n1/8/4p3/8/2B1K3 w - - 0 1', ['b2_pierce']);
    const moves = engine.getEmpoweredMoves('c1');
    assert(moves.some(m => m.to === 'f4' && m.extraSquare === 'e3'), 'B2: Pierces e3 to empty f4');
    assert(moves.some(m => m.to === 'g5' && m.extraSquare === 'e3'), 'B2: Pierces e3 to capture enemy knight at g5');

    const res = engine.makeEmpoweredMove(moves.find(m => m.to === 'g5')!);
    assert(res.success === true, 'B2: execution succeeds');
    assert(engine.getPiece('g5')?.type === 'b', 'B2: Bishop at g5');
    assert(!engine.getPiece('e3'), 'B2: Pierced pawn at e3 removed');
    assert(engine.getGraveyard().b.p === 1 && engine.getGraveyard().b.n === 1, 'B2: Both pawn and knight in graveyard');
  }

  // B4: Change Color
  {
    // Enemy piece orthogonally adjacent; step 1 square orthogonally (empty or capture)
    // White Bishop at c4. Black pawn at c5 (adjacent). Empty d4, b4, c3.
    const engine = new DeckChessEngine('4k3/8/8/2p5/2B5/8/8/4K3 w - - 0 1', ['b4_change_color']);
    const moves = engine.getEmpoweredMoves('c4');
    assert(moves.some(m => m.to === 'c5'), 'B4: Can capture orthogonally adjacent enemy at c5');
    assert(moves.some(m => m.to === 'd4') && moves.some(m => m.to === 'b4') && moves.some(m => m.to === 'c3'), 'B4: Can step to empty orthogonal squares');

    const res = engine.makeEmpoweredMove(moves.find(m => m.to === 'c5')!);
    assert(res.success === true, 'B4: execution succeeds');
    assert(engine.getPiece('c5')?.type === 'b', 'B4: Bishop moved to dark square c5 (switched color!)');
    assert(engine.getGraveyard().b.p === 1, 'B4: Captured pawn in graveyard');
  }

  // B5: Take My Place
  {
    // Bishop under attack; swap with friendly non-king piece along diagonal
    // White Bishop at c4 under attack by Black rook at c8. Friendly knight at e6.
    const engine = new DeckChessEngine('2r1k3/8/4N3/8/2B5/8/8/4K3 w - - 0 1', ['b5_take_my_place']);
    const moves = engine.getEmpoweredMoves('c4');
    assert(moves.some(m => m.to === 'e6'), 'B5: Bishop under attack swaps with friendly knight on diagonal at e6');

    const res = engine.makeEmpoweredMove(moves.find(m => m.to === 'e6')!);
    assert(res.success === true, 'B5: execution succeeds');
    assert(engine.getPiece('e6')?.type === 'b', 'B5: Bishop at e6');
    assert(engine.getPiece('c4')?.type === 'n', 'B5: Knight at c4');
  }

  // B6: Diagonal Launch
  {
    // Friendly pawn in rank ahead of Bishop; launch pawn along its forward diagonals
    // White Bishop at d3, friendly pawn at d4 (in rank ahead).
    const engine = new DeckChessEngine('4k3/8/8/8/3P4/3B4/8/4K3 w - - 0 1', ['b6_come_this_way']);
    const moves = engine.getEmpoweredMoves('d3');
    assert(moves.some(m => m.to === 'c5' && m.extraSquare === 'd4'), 'B6: Launches pawn to c5');
    assert(moves.some(m => m.to === 'e5' && m.extraSquare === 'd4'), 'B6: Launches pawn to e5');
    assert(moves.some(m => m.to === 'b6' && m.extraSquare === 'd4'), 'B6: Launches pawn further along diagonal to b6');

    const res = engine.makeEmpoweredMove(moves.find(m => m.to === 'c5')!);
    assert(res.success === true, 'B6: execution succeeds');
    assert(engine.getPiece('d3')?.type === 'b', 'B6: Bishop stays at d3');
    assert(engine.getPiece('c5')?.type === 'p', 'B6: Pawn launched to c5');
    assert(!engine.getPiece('d4'), 'B6: d4 is now empty');
  }

  // B7: Bishop's Blessing
  {
    // Friendly piece in 8 surrounding squares slides diagonally onto an empty square (cannot capture)
    // White Bishop at d4, friendly knight at d5, enemy pawn on f7.
    const engine = new DeckChessEngine('4k3/5p2/8/3N4/3B4/8/8/4K3 w - - 0 1', ['b7_bishops_blessing']);
    const moves = engine.getEmpoweredMoves('d4');
    assert(moves.some(m => m.to === 'c6' && m.extraSquare === 'd5'), 'B7: Blesses knight to slide to empty c6');
    assert(moves.some(m => m.to === 'b7' && m.extraSquare === 'd5'), 'B7: Blesses knight to slide to empty b7');
    assert(moves.some(m => m.to === 'e6' && m.extraSquare === 'd5'), 'B7: Blesses knight to slide to empty e6');
    assert(!moves.some(m => m.to === 'f7'), 'B7: Cannot capture enemy piece on f7 (empty square only)');

    const res = engine.makeEmpoweredMove(moves.find(m => m.to === 'c6')!);
    assert(res.success === true, 'B7: execution succeeds');
    assert(engine.getPiece('d4')?.type === 'b', 'B7: Bishop remains on d4');
    assert(engine.getPiece('c6')?.type === 'n', 'B7: Blessed knight moved to c6');
  }
}

// =========================================================================
// SUITE 3: KNIGHTS & ROOKS (N2, N3, N4, N5, N6, N7, R2, R4, R5, R6)
// =========================================================================
if (!suiteArg || suiteArg === 'knights-rooks' || suiteArg === 'knights') {
  console.log('\n--- Suite 3: Knights Overhaul (N2, N3, N4, N5, N6, N7) ---');

  // N2: Springboard
  {
    // Friendly piece on L-jump square S1; bounce off S1 to make second L-jump to S2
    // White Knight at b1, friendly pawn at c3. From c3, L-jumps go to d5, e4, etc.
    const engine = new DeckChessEngine('4k3/8/8/3p4/8/2P5/8/1N2K3 w - - 0 1', ['n2_swap_with_me']);
    const moves = engine.getEmpoweredMoves('b1');
    assert(moves.some(m => m.to === 'd5' && m.extraSquare === 'c3'), 'N2: Bounces off c3 to capture at d5');
    assert(moves.some(m => m.to === 'e4' && m.extraSquare === 'c3'), 'N2: Bounces off c3 to empty e4');

    const res = engine.makeEmpoweredMove(moves.find(m => m.to === 'd5')!);
    assert(res.success === true, 'N2: execution succeeds');
    assert(engine.getPiece('d5')?.type === 'n', 'N2: Knight landed on d5');
    assert(engine.getPiece('c3')?.type === 'p', 'N2: Springboard ally remains on c3');
    assert(!engine.getPiece('b1'), 'N2: Vacated b1');
  }

  // N3: Trample
  {
    // Enemy pawn on 2-square straight leg of L-jump path; trample destroys pawn
    // White Knight at b1, Black pawn at b2 (straight leg to c3 or a3).
    // Path A (2 straight along file): b2 and b3. Landing c3. If Black pawn on b2, trampled!
    const engine = new DeckChessEngine('4k3/8/8/8/8/8/1p6/1N2K3 w - - 0 1', ['n3_trample']);
    const moves = engine.getEmpoweredMoves('b1');
    const trampleMove = moves.find(m => m.to === 'c3');
    assert(Boolean(trampleMove), 'N3: Generates trample jump to c3 through enemy pawn on b2');
    assert(Array.isArray(trampleMove?.arrows) && trampleMove.arrows.length > 0, 'N3: Attaches arrow metadata');

    const res = engine.makeEmpoweredMove(trampleMove!);
    assert(res.success === true, 'N3: execution succeeds');
    assert(engine.getPiece('c3')?.type === 'n', 'N3: Knight at c3');
    assert(!engine.getPiece('b2'), 'N3: Trampled pawn at b2 removed');
    assert(engine.getGraveyard().b.p === 1, 'N3: Trampled pawn in graveyard');
  }

  // N4: Square Jump
  {
    // Knight defended by friendly piece jumps 2 squares diagonally (±2, ±2)
    // White Knight at d4 defended by White pawn at c3.
    const engine = new DeckChessEngine('4k3/8/8/8/3N4/2P5/8/4K3 w - - 0 1', ['n4_pin_swap']);
    const moves = engine.getEmpoweredMoves('d4');
    assert(moves.some(m => m.to === 'b6') && moves.some(m => m.to === 'f6'), 'N4: Can jump (±2, ±2) diagonally to b6 and f6');
    assert(moves.some(m => m.to === 'b2') && moves.some(m => m.to === 'f2'), 'N4: Can jump (±2, ±2) diagonally to b2 and f2');

    const res = engine.makeEmpoweredMove(moves.find(m => m.to === 'f6')!);
    assert(res.success === true, 'N4: execution succeeds');
    assert(engine.getPiece('f6')?.type === 'n', 'N4: Knight landed on f6');
  }

  // N5: Get to the King
  {
    // Knight jumps to safe forking square S1 (attacks King + another piece, not attacked itself), then makes second jump to S2
    // Black King at e8, Black Queen at c8.
    // Square d6 attacks both e8 (King) and c8 (Queen)! A royal fork!
    // If d6 is unthreatened, Knight at b5 can jump b5 -> d6 (S1) -> S2.
    const engine = new DeckChessEngine('2q1k3/8/8/1N6/8/8/8/7K w - - 0 1', ['n5_get_to_the_king']);
    const moves = engine.getEmpoweredMoves('b5');
    assert(moves.length > 0, 'N5: Generates moves through safe royal fork square d6');
    assert(moves.every(m => m.extraSquare === 'd6'), 'N5: All moves have extraSquare = d6 (the fork square)');
    assert(moves[0].stageExtraSquareFirst === true, 'N5: stageExtraSquareFirst is true');

    // Test when S1 is threatened by an enemy piece: e.g. Black bishop at g3 covers d6. Should be REJECTED!
    const engineThreatened = new DeckChessEngine('2q1k3/8/8/1N6/8/6b1/8/7K w - - 0 1', ['n5_get_to_the_king']);
    const movesThreatened = engineThreatened.getEmpoweredMoves('b5');
    assert(!movesThreatened.some(m => m.extraSquare === 'd6'), 'N5: Rejects fork square d6 when threatened by enemy piece');
  }

  // N6: Flanking Support
  {
    // Knight on a, b, g, or h file with second friendly Knight on board
    // White Knight at b1, second White Knight at g1.
    const engine = new DeckChessEngine('4k3/8/8/8/8/8/8/1N4NK w - - 0 1', ['n6_flanking_support']);
    const moves = engine.getEmpoweredMoves('b1');
    assert(moves.some(m => m.to === 'c3' && m.extraSquare === 'g1'), 'N6: Jumps b1 to c3 and teleports g1 to b1');

    const res = engine.makeEmpoweredMove(moves.find(m => m.to === 'c3')!);
    assert(res.success === true, 'N6: execution succeeds');
    assert(engine.getPiece('c3')?.type === 'n', 'N6: Knight on c3');
    assert(engine.getPiece('b1')?.type === 'n', 'N6: Second knight teleported to b1');
    assert(!engine.getPiece('g1'), 'N6: g1 vacated');
  }

  // N7: Outpost Support
  {
    // Knight on Ranks 5-8 with empty rear-diagonal square spawns pawn
    // White Knight on d5 (Rank 5). Rear diagonals: c4, e4.
    const engine = new DeckChessEngine('4k3/8/8/3N4/8/8/8/4K3 w - - 0 1', ['n7_outpost_support']);
    const moves = engine.getEmpoweredMoves('d5');
    assert(moves.some(m => m.to === 'c4') && moves.some(m => m.to === 'e4'), 'N7: Spawns pawn on c4 or e4');

    const res = engine.makeEmpoweredMove(moves.find(m => m.to === 'c4')!);
    assert(res.success === true, 'N7: execution succeeds');
    assert(engine.getPiece('d5')?.type === 'n', 'N7: Knight remains on d5');
    assert(engine.getPiece('c4')?.type === 'p' && engine.getPiece('c4')?.color === 'w', 'N7: Spawned pawn on c4');
  }
}

if (!suiteArg || suiteArg === 'knights-rooks' || suiteArg === 'rooks') {
  console.log('\n--- Suite 4: Rooks Overhaul (R2, R4, R5, R6) ---');

  // R2: I've Got Your Back
  {
    // Pushes ally on same rank 1 square forward (move or capture); Rook takes ally's tile
    // White Rook at a4, White knight at d4. Enemy pawn at d5.
    const engine = new DeckChessEngine('4k3/8/8/3p4/R2N4/8/8/4K3 w - - 0 1', ['r2_ive_got_your_back']);
    const moves = engine.getEmpoweredMoves('a4');
    const pushMove = moves.find(m => m.to === 'd4' && m.extraSquare === 'd4');
    assert(Boolean(pushMove), 'R2: Generates push move taking d4 while ally advances to d5');

    const res = engine.makeEmpoweredMove(pushMove!);
    assert(res.success === true, 'R2: execution succeeds');
    assert(engine.getPiece('d4')?.type === 'r', 'R2: Rook took vacated d4');
    assert(engine.getPiece('d5')?.type === 'n', 'R2: Pushed knight captured at d5');
    assert(engine.getGraveyard().b.p === 1, 'R2: Black pawn captured');
  }

  // R4: Move in Unison
  {
    // Connected Rooks: one moves along line, second moves into first Rook's vacated square
    // White Rooks at a1 and f1. Unobstructed rank 1.
    const engine = new DeckChessEngine('4k3/8/8/8/8/8/8/R4R1K w - - 0 1', ['r4_move_in_unison']);
    const moves = engine.getEmpoweredMoves('a1');
    assert(moves.some(m => m.to === 'a5' && m.extraSquare === 'f1'), 'R4: a1 moves to a5 and f1 moves to a1');

    const res = engine.makeEmpoweredMove(moves.find(m => m.to === 'a5')!);
    assert(res.success === true, 'R4: execution succeeds');
    assert(engine.getPiece('a5')?.type === 'r', 'R4: Primary rook at a5');
    assert(engine.getPiece('a1')?.type === 'r', 'R4: Paired rook slid into a1');
    assert(!engine.getPiece('f1'), 'R4: f1 vacated');
  }

  // R5: Catapult
  {
    // Friendly piece directly in front of Rook, enemy non-king along open ray beyond
    // White Rook at d1, friendly knight at d2. Black bishop at d6.
    const engine = new DeckChessEngine('4k3/8/3b4/8/8/8/3N4/3R3K w - - 0 1', ['r5_catapult']);
    const moves = engine.getEmpoweredMoves('d1');
    const catMove = moves.find(m => m.to === 'd6' && m.extraSquare === 'd2');
    assert(Boolean(catMove), 'R5: Found Catapult move launching d2 knight to capture d6 bishop');

    const res = engine.makeEmpoweredMove(catMove!);
    assert(res.success === true, 'R5: execution succeeds');
    assert(engine.getPiece('d1')?.type === 'r', 'R5: Rook stays at d1');
    assert(engine.getPiece('d6')?.type === 'n', 'R5: Knight launched to d6');
    assert(!engine.getPiece('d2'), 'R5: d2 vacated');
    assert(engine.getGraveyard().b.b === 1, 'R5: Enemy bishop captured');
  }

  // R6: Garrison
  {
    // Rook orthogonally adjacent to King spawns pawn 1 rank in front of Rook
    // White King at e1, White Rook at d1 (adjacent). d2 empty.
    const engine = new DeckChessEngine('4k3/8/8/8/8/8/8/3RK3 w - - 0 1', ['r6_garrison']);
    const moves = engine.getEmpoweredMoves('d1');
    assert(moves.some(m => m.to === 'd2'), 'R6: Generates spawn on d2 in front of Rook');

    const res = engine.makeEmpoweredMove(moves.find(m => m.to === 'd2')!);
    assert(res.success === true, 'R6: execution succeeds');
    assert(engine.getPiece('d2')?.type === 'p' && engine.getPiece('d2')?.color === 'w', 'R6: Pawn spawned on d2');
  }
}

// =========================================================================
// SUITE 4: QUEENS & KINGS (Q1, Q2, Q3, Q4, K1, K3, K4)
// =========================================================================
if (!suiteArg || suiteArg === 'queens-kings' || suiteArg === 'queens') {
  console.log('\n--- Suite 5: Queens Overhaul (Q1, Q2, Q3, Q4) ---');

  // Q1: Royal Summons
  {
    // Pulls friendly non-king piece in 8-directional sight (distance >= 2) adjacent to Queen
    // White Queen at d1, friendly knight at d5 (distance 4). Adjacent tile is d2.
    const engine = new DeckChessEngine('4k3/8/8/3N4/8/8/8/3Q3K w - - 0 1', ['q1_royal_summons']);
    const moves = engine.getEmpoweredMoves('d1');
    assert(moves.some(m => m.to === 'd2' && m.extraSquare === 'd5'), 'Q1: Summons d5 knight to d2');

    const res = engine.makeEmpoweredMove(moves.find(m => m.to === 'd2')!);
    assert(res.success === true, 'Q1: execution succeeds');
    assert(engine.getPiece('d1')?.type === 'q', 'Q1: Queen remains on d1');
    assert(engine.getPiece('d2')?.type === 'n', 'Q1: Summoned knight on d2');
    assert(!engine.getPiece('d5'), 'Q1: d5 vacated');
  }

  // Q2: The Queen's Gambit Preview Arrows
  {
    // Ally under attack in Queen sight; generates arrows
    // White Queen at d1, White Knight at d4. Black rook at d8 attacks d4.
    const engine = new DeckChessEngine('3r1k2/8/8/8/3N4/8/8/3Q3K w - - 0 1', ['q2_the_queens_gambit']);
    const moves = engine.getEmpoweredMoves('d1');
    const gambitMove = moves.find(m => m.to === 'd8' && m.extraSquare === 'd4');
    assert(Boolean(gambitMove), 'Q2: Generates Queen Gambit move capturing d8');
    assert(Array.isArray(gambitMove?.arrows) && gambitMove.arrows.length === 2, 'Q2: Attaches 2 preview arrows');
  }

  // Q3: Royal Shield
  {
    // Friendly pawn 1 square away along ray; push pawn to target T, Queen lands on T - dir
    // White Queen at d1, White pawn at d2. Target d4 (pawn to d4, Queen to d3).
    const engine = new DeckChessEngine('4k3/8/8/8/8/8/3P4/3Q3K w - - 0 1', ['q3_all_rise']);
    const moves = engine.getEmpoweredMoves('d1');
    assert(moves.some(m => m.to === 'd4'), 'Q3: Generates Royal Shield push to d4');

    const res = engine.makeEmpoweredMove(moves.find(m => m.to === 'd4')!);
    assert(res.success === true, 'Q3: execution succeeds');
    assert(engine.getPiece('d4')?.type === 'p', 'Q3: Pawn pushed to d4');
    assert(engine.getPiece('d3')?.type === 'q', 'Q3: Queen advanced behind shield to d3');
    assert(!engine.getPiece('d1'), 'Q3: d1 vacated');
  }

  // Q4: One Fell Swoop
  {
    // Supported from behind by R/B/Q (any distance), sweeps ray capturing all enemies
    // White Rook at d1, empty d2, White Queen at d3. Black pawns at d5 and d6.
    const engine = new DeckChessEngine('4k3/8/3p4/3p4/8/3Q4/8/3R3K w - - 0 1', ['q4_one_fell_swoop']);
    const moves = engine.getEmpoweredMoves('d3');
    assert(moves.some(m => m.to === 'd6'), 'Q4: Sweeps along ray capturing d5 and d6');

    const res = engine.makeEmpoweredMove(moves.find(m => m.to === 'd6')!);
    assert(res.success === true, 'Q4: execution succeeds');
    assert(engine.getPiece('d6')?.type === 'q', 'Q4: Queen landed on d6');
    assert(!engine.getPiece('d5'), 'Q4: Trampled enemy at d5 cleared');
    assert(engine.getGraveyard().b.p === 2, 'Q4: Both enemy pawns in graveyard');
  }
}

if (!suiteArg || suiteArg === 'queens-kings' || suiteArg === 'kings') {
  console.log('\n--- Suite 6: Kings Overhaul (K1, K3, K4) ---');

  // K1: Conscription
  {
    // King on Rank 1 spawns pawns on empty orthogonal squares
    // White King on e1. Empty e2, d1, f1.
    const engine = new DeckChessEngine('4k3/8/8/8/8/8/8/4K3 w - - 0 1', ['k1_conscription']);
    const moves = engine.getEmpoweredMoves('e1');
    assert(moves.some(m => m.actionType === 'spawn'), 'K1: Generates spawn moves');

    const res = engine.makeEmpoweredMove(moves[0]);
    assert(res.success === true, 'K1: execution succeeds');
    assert(engine.getPiece('e1')?.type === 'k', 'K1: King remains on e1');
  }

  // K3: Royal Execution
  {
    // Enemy in line of sight, bodyguard adjacent; launch bodyguard to capture enemy
    // White King at e1, friendly bishop at e2 (adjacent bodyguard). Black rook at e5 (in line of sight).
    const engine = new DeckChessEngine('4k3/8/8/4r3/8/8/4B3/4K3 w - - 0 1', ['k3_royal_execution']);
    const moves = engine.getEmpoweredMoves('e1');
    const execMove = moves.find(m => m.to === 'e5' && m.extraSquare === 'e2');
    assert(Boolean(execMove), 'K3: Bodyguard e2 executes enemy at e5');

    const res = engine.makeEmpoweredMove(execMove!);
    assert(res.success === true, 'K3: execution succeeds');
    assert(engine.getPiece('e1')?.type === 'k', 'K3: King remains on e1');
    assert(engine.getPiece('e5')?.type === 'b', 'K3: Bishop struck e5');
    assert(engine.getGraveyard().b.r === 1, 'K3: Black rook captured');
  }

  // K4: Turncoat
  {
    // Enemy pawn in King's 8 surrounding squares converts in-place into friendly pawn
    // White King on e1, Black pawn on e2 (adjacent).
    const engine = new DeckChessEngine('4k3/8/8/8/8/8/4p3/4K3 w - - 0 1', ['k4_banish']);
    const moves = engine.getEmpoweredMoves('e1');
    const convertMove = moves.find(m => m.to === 'e2' && m.actionType === 'in_place');
    assert(Boolean(convertMove), 'K4: Converts adjacent enemy pawn on e2');

    const res = engine.makeEmpoweredMove(convertMove!);
    assert(res.success === true, 'K4: execution succeeds');
    assert(engine.getPiece('e2')?.type === 'p' && engine.getPiece('e2')?.color === 'w', 'K4: Pawn on e2 is now WHITE');
  }
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(` OVERHAUL SPECIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
