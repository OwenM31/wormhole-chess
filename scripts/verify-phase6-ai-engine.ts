import { DeckChessEngine } from '../src/engine/DeckChessEngine';
import {
  evaluateBoard,
  evaluateHandSynergy,
  evaluatePosition,
  computeBestTurn,
  getCardRetentionValue,
} from '../src/engine/DeckChessAI';

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
console.log(' PHASE 6 CARD-AWARE AI ENGINE & HAND SYNERGY TDD SUITE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ==========================================
// Invariant 1: Symmetric Starting Evaluation
// ==========================================
console.log('Suite 1: Invariant 1 — Symmetric Starting Position Evaluation');
{
  const symmetricHand = ['p1_sidestep', 'n1_adrenaline_jump', 'b1_let_me_through', 'r1_make_way'];
  const engine = new DeckChessEngine(undefined, [...symmetricHand], [...symmetricHand]);

  const evalPos = evaluatePosition(engine);
  console.log('  Evaluation readout:', evalPos);

  assert(evalPos.whiteCp === 0, `Starting whiteCp is exactly 0 (got ${evalPos.whiteCp})`);
  assert(evalPos.displayLabel === '0.0', `Starting displayLabel is '0.0' (got '${evalPos.displayLabel}')`);
  assert(
    Math.round(evalPos.whiteWinPct) === 50,
    `Starting whiteWinPct is 50% (got ${evalPos.whiteWinPct}%)`
  );

  // Check card retention values
  assert(getCardRetentionValue('p1_sidestep') === 55, 'Pawn retention is 55cp');
  assert(getCardRetentionValue('n1_adrenaline_jump') === 70, 'Knight retention is 70cp');
  assert(getCardRetentionValue('b1_let_me_through') === 70, 'Bishop retention is 70cp');
  assert(getCardRetentionValue('r1_make_way') === 85, 'Rook retention is 85cp');
  assert(getCardRetentionValue('q1_royal_summons') === 100, 'Queen retention is 100cp');
  assert(getCardRetentionValue('k1_conscription') === 100, 'King retention is 100cp');
}

// ==========================================
// Invariant 2: Card Conservation Threshold
// ==========================================
console.log('\nSuite 2: Invariant 2 — Card Conservation Threshold');
{
  // In quiet opening with unspent n2_swap_with_me or p1_sidestep,
  // the AI should refuse to burn its card for 0cp material gain,
  // preferring a normal standard developing move.
  const quietEngine = new DeckChessEngine(undefined, ['n2_swap_with_me'], ['n2_swap_with_me']);
  const decision = computeBestTurn(quietEngine, 'w', 'tactical');

  console.log('  Quiet opening decision:', {
    type: decision.type,
    move: decision.move,
    empoweredCard: decision.empoweredMove?.cardId,
    explanation: decision.explanation,
  });

  assert(
    decision.type === 'standard',
    `AI chooses standard chess move (${decision.move.from}-${decision.move.to}) instead of wasting card on 0cp move`
  );
  assert(
    !decision.empoweredMove,
    'No empoweredMove attached when card conservation threshold is upheld'
  );
}

// ==========================================
// Invariant 3: Multi-Ply Blunder Prevention on Card Plays
// ==========================================
console.log('\nSuite 3: Invariant 3 — Multi-Ply Blunder Prevention on Card Plays');
{
  // Tactical trap setup:
  // Black has a Pawn on e7 and Queen on d8.
  // White has a Pawn on e6 and a Rook on d1 pointing down the open d-file at Black's Queen on d8.
  // Black holds p2_attack_head_on which allows e7 pawn to capture head-on to e6 (+100cp material at depth 0).
  // BUT if Black plays p2 (e7xe6), it unblocks the d-file, allowing White's d1 Rook to capture Black's Queen on d8 (Rxd8# / -900cp).
  // A 0-ply greedy AI would fall for the trap. A multi-ply card-aware AI avoids it.
  const trapFen = 'r1bqkbnr/pppp1ppp/8/8/8/4P3/PPP1P1PP/RNBR2K1 b kq - 0 5';
  // Let's make an explicit trap FEN:
  // White: Kd1 (or Rd1 on open d-file), Black: Qd8 on d8, friendly pawn on d7.
  // If Black's pawn on d7 uses p1_sidestep to c7 or e7, White's Rd1 captures Qd8!
  const openTrapFen = '3qkb1r/3p1ppp/8/8/8/8/8/3R2K1 b k - 0 1';
  const trapEngine = new DeckChessEngine(openTrapFen, [], ['p1_sidestep']);

  const blackDecision = computeBestTurn(trapEngine, 'b', 'tactical');
  console.log('  Trap position decision for Black:', {
    type: blackDecision.type,
    move: blackDecision.move,
    empoweredCard: blackDecision.empoweredMove?.cardId,
    explanation: blackDecision.explanation,
  });

  // Black must NOT use p1_sidestep from d7 because Rd1xd8 captures Black's Queen!
  assert(
    blackDecision.empoweredMove?.cardId !== 'p1_sidestep' || blackDecision.type === 'standard',
    'AI does not play p1_sidestep to expose Queen to immediate capture'
  );
}

// ==========================================
// Invariant 4: Proactive Setup (Synergy) & Winning Card Plays
// ==========================================
console.log('\nSuite 4: Invariant 4 — Pre-Condition Shaping & Checkmate Execution');
{
  // 1. Geometric synergy: r3_cut_across awards bonus on main diagonal
  const engineRookOffDiag = new DeckChessEngine('4k3/8/8/8/8/8/R7/4K3 w - - 0 1', ['r3_cut_across']); // a2 (not on diagonal)
  const engineRookOnDiag = new DeckChessEngine('4k3/8/8/8/8/8/8/R3K3 w - - 0 1', ['r3_cut_across']); // a1 (on main diagonal a1-h8)

  const synOff = evaluateHandSynergy(engineRookOffDiag, 'w');
  const synOn = evaluateHandSynergy(engineRookOnDiag, 'w');
  console.log(`  r3_cut_across synergy: a1 (on-diag) = ${synOn}cp, a2 (off-diag) = ${synOff}cp`);
  assert(synOn > synOff, 'evaluateHandSynergy awards bonus for Rook on main diagonal holding r3_cut_across');

  // 2. Geometric synergy: r4_move_in_unison awards bonus when 2 Rooks share rank/file
  const engineRooksUnison = new DeckChessEngine('4k3/8/8/8/8/8/8/R3K2R w - - 0 1', ['r4_move_in_unison']); // a1 and h1 share rank 1
  const engineRooksApart = new DeckChessEngine('4k3/8/8/8/8/1R6/8/R3K3 w - - 0 1', ['r4_move_in_unison']); // a1 and b3
  const synUnison = evaluateHandSynergy(engineRooksUnison, 'w');
  const synApart = evaluateHandSynergy(engineRooksApart, 'w');
  console.log(`  r4_move_in_unison synergy: unison = ${synUnison}cp, apart = ${synApart}cp`);
  assert(synUnison > synApart, 'evaluateHandSynergy awards bonus for 2 Rooks aligned on rank holding r4_move_in_unison');

  // 3. Geometric synergy: b6_come_this_way awards bonus for Bishop in center (d4, d5, e4, e5)
  const engineBishopCenter = new DeckChessEngine('4k3/8/8/8/3B4/8/8/4K3 w - - 0 1', ['b6_come_this_way']); // d4
  const engineBishopRim = new DeckChessEngine('4k3/8/8/8/8/8/8/B3K3 w - - 0 1', ['b6_come_this_way']); // a1
  const synCenter = evaluateHandSynergy(engineBishopCenter, 'w');
  const synRim = evaluateHandSynergy(engineBishopRim, 'w');
  console.log(`  b6_come_this_way synergy: center = ${synCenter}cp, rim = ${synRim}cp`);
  assert(synCenter > synRim, 'evaluateHandSynergy awards bonus for Bishop in center holding b6_come_this_way');

  // 4. Winning Card Play: When an empowered move delivers immediate checkmate
  // Setup: Black King on b8, White King on b6 (covering a7, b7), White Bishop on c6 (defending a8).
  // White Rook on a1 blocked by White Pawn on a2.
  // Standard moves cannot mate. But r1_make_way steps pawn to b2 and rook mates on a8 (defended by c6 bishop)!
  const cardMateFen = '1k6/8/1KB5/8/8/8/P7/R7 w - - 0 1';
  const cardMateEngine = new DeckChessEngine(cardMateFen, ['r1_make_way'], []);
  const cardMateDecision = computeBestTurn(cardMateEngine, 'w', 'tactical');
  console.log('  Card Mate decision:', {
    type: cardMateDecision.type,
    move: cardMateDecision.move,
    empoweredCard: cardMateDecision.empoweredMove?.cardId,
    explanation: cardMateDecision.explanation,
  });
  assert(cardMateDecision.type === 'empowered', 'AI selects empowered move when card delivers winning mate');
  assert(cardMateDecision.empoweredMove?.cardId === 'r1_make_way', 'AI plays r1_make_way for checkmate');
  assert(cardMateDecision.move.to === 'a8', 'Rook delivers checkmate to a8');
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(` ALL INVARIANT ASSERTIONS PASSED (${passed}/${passed}) ✓`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
