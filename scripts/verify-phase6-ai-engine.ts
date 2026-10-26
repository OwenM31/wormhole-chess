import { DeckChessEngine } from '../src/engine/DeckChessEngine';
import {
  evaluateBoard,
  evaluateCardScarcityAndHand,
  evaluateHandSynergy,
  evaluatePosition,
  computeBestTurn,
  getCardRetentionValue,
} from '../src/engine/DeckChessAI';
import type { FriendlyPieceSummary } from '../src/engine/cards/cardRegistry';

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

function getPiecesForColor(engine: DeckChessEngine, color: 'w' | 'b'): FriendlyPieceSummary[] {
  const board = engine.getBoard();
  const list: FriendlyPieceSummary[] = [];
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = board[r][f];
      if (!p || p.color !== color) continue;
      const rankIdx = 7 - r;
      const sq = DeckChessEngine.coordsToSquare(f, rankIdx);
      if (sq) list.push({ sq, type: p.type, file: f, rank: rankIdx });
    }
  }
  return list;
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(' GRANDMASTER CARD-AWARE AI ENGINE & STRATEGIC BENCHMARK SUITE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ==========================================================
// Suite 1: Invariant 1 — Symmetric Starting Evaluation
// ==========================================================
console.log('Suite 1: Invariant 1 — Symmetric Starting Position Evaluation');
{
  const symmetricHand = ['p1_sidestep', 'n1_adrenaline_jump', 'b1_let_me_through', 'r1_make_way'];
  const engine = new DeckChessEngine(undefined, [...symmetricHand], [...symmetricHand]);

  const evalPos = evaluatePosition(engine);
  assert(evalPos.whiteCp === 0, `Starting whiteCp is exactly 0 (got ${evalPos.whiteCp})`);
  assert(evalPos.displayLabel === '0.0', `Starting displayLabel is '0.0' (got '${evalPos.displayLabel}')`);
  assert(
    Math.round(evalPos.whiteWinPct) === 50,
    `Starting whiteWinPct is 50% (got ${evalPos.whiteWinPct}%)`
  );

  assert(getCardRetentionValue('p1_sidestep') === 55, 'Pawn retention is 55cp');
  assert(getCardRetentionValue('n1_adrenaline_jump') === 70, 'Knight retention is 70cp');
  assert(getCardRetentionValue('b1_let_me_through') === 70, 'Bishop retention is 70cp');
  assert(getCardRetentionValue('r1_make_way') === 85, 'Rook retention is 85cp');
  assert(getCardRetentionValue('q1_royal_summons') === 100, 'Queen retention is 100cp');
  assert(getCardRetentionValue('k1_conscription') === 100, 'King retention is 100cp');
}

// ==========================================================
// Suite 2: Invariant 2 — Card Conservation Threshold
// ==========================================================
console.log('\nSuite 2: Invariant 2 — Card Conservation Threshold');
{
  const quietEngine = new DeckChessEngine(undefined, ['n2_swap_with_me'], ['n2_swap_with_me']);
  const decision = computeBestTurn(quietEngine, 'w', 'tactical');

  assert(
    decision.type === 'standard',
    `AI chooses standard developing move (${decision.move.from}-${decision.move.to}) instead of wasting card on 0cp move`
  );
  assert(!decision.empoweredMove, 'No empoweredMove attached when card conservation holds');
}

// ==========================================================
// Suite 3: Opening Development & Anti-Shuffling (Ra8-b8 Cure)
// ==========================================================
console.log('\nSuite 3: Opening Development & Anti-Shuffling (Ra8-b8-a8-b8 Cure)');
{
  const openingEngine = new DeckChessEngine(
    undefined,
    ['p1_sidestep', 'n1_adrenaline_jump', 'b3_ricochet', 'r3_cut_across'],
    ['p1_sidestep', 'n1_adrenaline_jump', 'b3_ricochet', 'r3_cut_across']
  );

  const moveHistory: string[] = [];
  for (let ply = 0; ply < 10; ply++) {
    const turn = openingEngine.getTurn();
    const best = computeBestTurn(openingEngine, turn, 'medium');
    if (best.type === 'empowered' && best.empoweredMove) {
      openingEngine.makeEmpoweredMove(best.empoweredMove);
      moveHistory.push(`[${best.empoweredMove.cardId}]${best.move.from}-${best.move.to}`);
    } else {
      openingEngine.makeMove(best.move);
      moveHistory.push(`${best.move.from}-${best.move.to}`);
    }
  }

  console.log('  10-Ply Opening Progression:', moveHistory.join(' ➔ '));
  assert(
    openingEngine.getPositionRepeatCount() === 1,
    'Zero repeated board positions during 10-ply opening development'
  );

  // Verify central pawns or knights were developed, NOT back-rank Rook shuffling
  const hasCentralPawnOrKnight = moveHistory.some((m) =>
    ['d2-d4', 'e2-e4', 'd7-d5', 'e7-e5', 'g1-f3', 'b1-c3', 'g8-f6', 'b8-c6'].includes(m)
  );
  assert(hasCentralPawnOrKnight, 'AI actively develops center pawns and knights in the opening');
}

// ==========================================================
// Suite 4: Non-Linear Piece Scarcity, Orphaning & Anchor Hunting
// ==========================================================
console.log('\nSuite 4: Non-Linear Piece Scarcity, Card Orphaning & Offensive Anchor Hunting');
{
  // 1. Non-linear Pawn scarcity: losing 8 -> 7 vs 2 -> 1 vs 1 -> 0
  const eng8P = new DeckChessEngine('4k3/8/8/8/8/8/PPPPPPPP/4K3 w - - 0 1', ['p1_sidestep']);
  const eng7P = new DeckChessEngine('4k3/8/8/8/8/8/PPPPPPP1/4K3 w - - 0 1', ['p1_sidestep']);
  const eng2P = new DeckChessEngine('4k3/8/8/8/8/8/PP6/4K3 w - - 0 1', ['p1_sidestep']);
  const eng1P = new DeckChessEngine('4k3/8/8/8/8/8/P7/4K3 w - - 0 1', ['p1_sidestep']);
  const eng0P = new DeckChessEngine('4k3/8/8/8/8/8/8/4K3 w - - 0 1', ['p1_sidestep']);

  const val8P = evaluateCardScarcityAndHand(getPiecesForColor(eng8P, 'w'), ['p1_sidestep'], 'w');
  const val7P = evaluateCardScarcityAndHand(getPiecesForColor(eng7P, 'w'), ['p1_sidestep'], 'w');
  const val2P = evaluateCardScarcityAndHand(getPiecesForColor(eng2P, 'w'), ['p1_sidestep'], 'w');
  const val1P = evaluateCardScarcityAndHand(getPiecesForColor(eng1P, 'w'), ['p1_sidestep'], 'w');
  const val0P = evaluateCardScarcityAndHand(getPiecesForColor(eng0P, 'w'), ['p1_sidestep'], 'w');

  const drop8to7 = val8P - val7P;
  const drop2to1 = val2P - val1P;
  const drop1to0 = val1P - val0P;
  console.log(
    `  Pawn card curve (8->7->2->1->0): 8P=${val8P}cp, 7P=${val7P}cp (-${drop8to7}), 2P=${val2P}cp, 1P=${val1P}cp (-${drop2to1}), 0P=${val0P}cp (-${drop1to0})`
  );
  assert(drop8to7 <= 2, `Losing 1 of 8 pawns costs <= 2cp of card value (got ${drop8to7}cp)`);
  assert(
    drop2to1 > drop8to7 * 4,
    `Losing 2->1 pawn costs >4x more than losing 8->7 pawn (${drop2to1}cp vs ${drop8to7}cp)`
  );
  assert(
    drop1to0 > drop2to1,
    `Losing last pawn (1->0) costs more than losing 2->1 pawn (${drop1to0}cp vs ${drop2to1}cp)`
  );
  assert(val0P === 0, 'With 0 pawns and no spawner card, Pawn card is orphaned at 0cp');

  // 2. Non-linear Bishop scarcity (2 -> 1 vs 1 -> 0)
  const eng2B = new DeckChessEngine('4k3/8/8/8/8/8/8/2B1KB2 w - - 0 1', ['b3_ricochet']);
  const eng1B = new DeckChessEngine('4k3/8/8/8/8/8/8/2B1K3 w - - 0 1', ['b3_ricochet']);
  const eng0B = new DeckChessEngine('4k3/8/8/8/8/8/8/4K3 w - - 0 1', ['b3_ricochet']);

  const val2B = evaluateCardScarcityAndHand(getPiecesForColor(eng2B, 'w'), ['b3_ricochet'], 'w');
  const val1B = evaluateCardScarcityAndHand(getPiecesForColor(eng1B, 'w'), ['b3_ricochet'], 'w');
  const val0B = evaluateCardScarcityAndHand(getPiecesForColor(eng0B, 'w'), ['b3_ricochet'], 'w');
  console.log(
    `  Bishop card curve (2->1->0): 2B=${val2B}cp, 1B=${val1B}cp (-${val2B - val1B}), 0B=${val0B}cp (-${val1B - val0B})`
  );
  assert(
    val1B - val0B > (val2B - val1B) * 2.5,
    `Losing last Bishop (1->0: -${val1B - val0B}cp) is >2.5x steeper than losing first Bishop (2->1: -${val2B - val1B}cp)`
  );

  // 3. Pair-dependent card (R4 Move in Unison) orphans at 2 -> 1 Rook!
  const eng2R = new DeckChessEngine('4k3/8/8/8/8/8/8/R3K2R w - - 0 1', ['r4_move_in_unison']);
  const eng1R = new DeckChessEngine('4k3/8/8/8/8/8/8/R3K3 w - - 0 1', ['r4_move_in_unison']);
  const valR4_2R = evaluateCardScarcityAndHand(getPiecesForColor(eng2R, 'w'), ['r4_move_in_unison'], 'w');
  const valR4_1R = evaluateCardScarcityAndHand(getPiecesForColor(eng1R, 'w'), ['r4_move_in_unison'], 'w');
  console.log(`  R4 (Move in Unison) pair scarcity: 2 Rooks = ${valR4_2R}cp, 1 Rook = ${valR4_1R}cp`);
  assert(valR4_2R > 100 && valR4_1R === 0, 'R4 Move in Unison drops to 0cp when dropping from 2 Rooks to 1 Rook');

  // 4. Defensive Scarcity vs Offensive Anchor Hunting on Queen Trades
  // Position: White Queen on d1, Black Queen on d8 (protected by Black Rook on e8), open d-file.
  // If White holds 2 Queen cards and Black holds 0, White should REFUSE Qxd8 (because trading Queens bricks White's 2 Queen cards).
  // If Black holds 2 Queen cards and White holds 0, White should PLAY Qxd8 (because trading Queens bricks Black's 2 Queen cards!).
  const queenTradeFen = '3qr1k1/ppp2ppp/8/8/8/8/PPP2PPP/3Q1RK1 w - - 0 1';
  const whiteHasQueenCards = new DeckChessEngine(
    queenTradeFen,
    ['q2_the_queens_gambit', 'q4_one_fell_swoop'],
    []
  );
  const blackHasQueenCards = new DeckChessEngine(
    queenTradeFen,
    [],
    ['q2_the_queens_gambit', 'q4_one_fell_swoop']
  );

  const decProtectOwnQueen = computeBestTurn(whiteHasQueenCards, 'w', 'tactical');
  const decHuntEnemyQueen = computeBestTurn(blackHasQueenCards, 'w', 'tactical');
  console.log(
    `  Queen trade when White holds Q2+Q4: ${decProtectOwnQueen.move.from}-${decProtectOwnQueen.move.to} (avoids d1-d8 trade)`
  );
  console.log(
    `  Queen trade when Black holds Q2+Q4: ${decHuntEnemyQueen.move.from}-${decHuntEnemyQueen.move.to} (hunts d8 Queen to brick Black's cards!)`
  );

  assert(
    !(decProtectOwnQueen.move.from === 'd1' && decProtectOwnQueen.move.to === 'd8'),
    'White refuses equal Queen trade when holding 2 Queen cards in hand'
  );
  assert(
    decHuntEnemyQueen.move.from === 'd1' && decHuntEnemyQueen.move.to === 'd8',
    'White actively trades Queens (Qxd8) when doing so orphans Black\'s 2 Queen cards'
  );
}

// ==========================================================
// Suite 5: Underpromotions (Q, R, B, N) & Card Revival (K2)
// ==========================================================
console.log('\nSuite 5: Winning Underpromotions (Q, R, B, N) & Card Revival (K2 Royal Knighting)');
{
  // 1. Tactical Underpromotion to Knight:
  // White Pawn on f7, Black King on h7 boxed in by Black pieces on h8, g8, g7, g6, h6.
  // Promoting f7-f8=Q does NOT give check (and Black has Qb2-a1# on next move!).
  // Underpromoting f7-f8=N# delivers immediate smothered checkmate on h7!
  const smotheredFen = '6br/5Ppk/6pp/8/8/8/1q3PPP/6K1 w - - 0 1';
  const smotheredEngine = new DeckChessEngine(smotheredFen, [], []);
  const promoDecision = computeBestTurn(smotheredEngine, 'w', 'tactical');
  console.log('  Smothered mate underpromotion decision:', promoDecision.move, promoDecision.explanation);
  assert(
    promoDecision.move.from === 'f7' &&
      promoDecision.move.to === 'f8' &&
      promoDecision.move.promotion === 'n',
    'AI selects underpromotion to Knight (f7-f8=N#) to deliver checkmate'
  );

  // 2. Card Revival Valuation via K2 Royal Knighting or Rank-7 Pawn
  const deadKnightEng = new DeckChessEngine('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1', ['n1_adrenaline_jump']);
  const revivableByK2Eng = new DeckChessEngine('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1', [
    'n1_adrenaline_jump',
    'k2_royal_knighting',
  ]);
  const revivableByRank7Eng = new DeckChessEngine('4k3/4P3/8/8/8/8/8/4K3 w - - 0 1', [
    'n1_adrenaline_jump',
  ]);

  const deadVal = evaluateCardScarcityAndHand(
    getPiecesForColor(deadKnightEng, 'w'),
    ['n1_adrenaline_jump'],
    'w'
  );
  const k2ReviveVal = evaluateCardScarcityAndHand(
    getPiecesForColor(revivableByK2Eng, 'w'),
    ['n1_adrenaline_jump', 'k2_royal_knighting'],
    'w'
  );
  const r7ReviveVal = evaluateCardScarcityAndHand(
    getPiecesForColor(revivableByRank7Eng, 'w'),
    ['n1_adrenaline_jump'],
    'w'
  );

  console.log(
    `  Orphaned N1 value: dead=${deadVal}cp, with Rank-7 Pawn=${r7ReviveVal}cp, with K2 in hand=${k2ReviveVal - 100}cp`
  );
  assert(deadVal === 0, 'Orphaned Knight card with no revival path is 0cp');
  assert(r7ReviveVal > 30, 'Orphaned Knight card retains revival value when friendly Pawn is on Rank 7');
  assert(k2ReviveVal > 130, 'Orphaned Knight card retains revival value when K2 Royal Knighting is in hand');
}

// ==========================================================
// Suite 6: 2-Turn Proactive Card Combo (Ply-3 Card Discovery)
// ==========================================================
console.log('\nSuite 6: 2-Turn Proactive Card Strategy (Ply-3 Card Combo Discovery)');
{
  // Position: Black King boxed in on a8, Black Bishop on b8 (blocking 8th rank), Black Pawn on h7.
  // White King on b6, White Bishop on c6, White Pawn on a2, White Knight on b2, White Rook on a1.
  // White holds ['r1_make_way'].
  // On Turn 1 (Ply 1), White CANNOT play r1_make_way yet because the a2 pawn's step-aside square (b2)
  // is blocked by White's own Knight on b2, and Rd1-d8 is blocked by Black's Bishop on b8!
  // Only by vacating b2 with the Knight on Turn 1 (Nb2-*) can White unlock R1 Make Way (a2->b2, Ra1-a7#/a8#)
  // on Turn 2 (Ply 3) for forced Checkmate!
  const combo2TurnFen = 'k6p/8/1KB5/8/8/8/PN6/R7 w - - 0 1';
  const comboEngine = new DeckChessEngine(combo2TurnFen, ['r1_make_way'], []);
  const turn1Decision = computeBestTurn(comboEngine, 'w', 'tactical');
  console.log('  2-Turn Combo Turn 1 Setup Decision:', {
    type: turn1Decision.type,
    move: turn1Decision.move,
    evalScore: turn1Decision.evalScore,
    explanation: turn1Decision.explanation,
  });

  assert(
    turn1Decision.type === 'standard' && turn1Decision.move.from === 'b2',
    `AI discovers 2-turn card mate combo and vacates b2 with Knight on Turn 1 (got ${turn1Decision.move.from}-${turn1Decision.move.to})`
  );
  assert(
    turn1Decision.evalScore >= 90000,
    `AI sees forced checkmate score (>= 90000cp) at Ply 3 via R1 Make Way (got ${turn1Decision.evalScore})`
  );
}

// ==========================================================
// Suite 7: Opponent Card Threat Defense (Ply-2 Card Awareness)
// ==========================================================
console.log('\nSuite 7: Opponent Card Threat Defense (Ply-2 Opponent Card Awareness)');
{
  // Black holds `r3_cut_across` and has a Rook on `h8` (main diagonal a1-h8).
  // White's Queen is on `g7`!
  // In standard chess, a Rook on `h8` CANNOT capture a Queen on `g7` (since `g7` is diagonal to `h8`).
  // But because Black holds `r3_cut_across`, on Ply 2 Black's Rook on `h8` WILL capture `Rh8xg7`!
  // White must recognize the opponent's Ply-2 card threat and move the Queen away from `g7` (or capture `Qxh8`)!
  const defenseFen = '4k2r/6Q1/8/8/8/8/8/4K3 w - - 0 1';
  const defenseEngine = new DeckChessEngine(defenseFen, [], ['r3_cut_across']);
  const defenseDecision = computeBestTurn(defenseEngine, 'w', 'tactical');
  console.log('  Defense against opponent R3 Cut Across:', defenseDecision.move, defenseDecision.explanation);
  assert(
    defenseDecision.move.from === 'g7',
    `White evacuates/uses Queen on g7 (${defenseDecision.move.from}-${defenseDecision.move.to}) instead of leaving it to be sniped by Black's R3 Cut Across`
  );
}

// ==========================================================
// Suite 8: Multi-Ply Blunder Prevention on Own Card Plays
// ==========================================================
console.log('\nSuite 8: Multi-Ply Blunder Prevention on Card Plays');
{
  // Black's pawn on d7 is pinned/shielding Black's Queen on d8 from White's Rook on d1.
  // Playing p1_sidestep with d7 exposes Black's Queen on d8 to Rd1xd8.
  const openTrapFen = '3qkb1r/3p1ppp/8/8/8/8/8/3R2K1 b k - 0 1';
  const trapEngine = new DeckChessEngine(openTrapFen, [], ['p1_sidestep']);
  const blackDecision = computeBestTurn(trapEngine, 'b', 'tactical');
  assert(
    blackDecision.empoweredMove?.cardId !== 'p1_sidestep' || blackDecision.type === 'standard',
    'AI does not play p1_sidestep from d7 to expose its Queen to immediate capture'
  );
}

// ==========================================================
// Suite 9: Modular Card Setup Heuristics & Immediate Card Mate
// ==========================================================
console.log('\nSuite 9: Modular Handler Setup Heuristics & Immediate Card Mate');
{
  const engineRookOffDiag = new DeckChessEngine('4k3/8/8/8/8/8/R7/4K3 w - - 0 1', ['r3_cut_across']);
  const engineRookOnDiag = new DeckChessEngine('4k3/8/8/8/8/8/8/R3K3 w - - 0 1', ['r3_cut_across']);
  assert(
    evaluateHandSynergy(engineRookOnDiag, 'w') > evaluateHandSynergy(engineRookOffDiag, 'w'),
    'Modular handler evaluateSetup awards bonus for Rook on main diagonal holding r3_cut_across'
  );

  const cardMateFen = '1k6/8/1KB5/8/8/8/P7/R7 w - - 0 1';
  const cardMateEngine = new DeckChessEngine(cardMateFen, ['r1_make_way'], []);
  const cardMateDecision = computeBestTurn(cardMateEngine, 'w', 'tactical');
  assert(cardMateDecision.type === 'empowered', 'AI selects empowered move when card delivers mate');
  assert(cardMateDecision.empoweredMove?.cardId === 'r1_make_way', 'AI plays r1_make_way for mate');
  assert(cardMateDecision.move.to === 'a8', 'Rook delivers checkmate on a8');
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(` ALL GRANDMASTER ENGINE ASSERTIONS PASSED (${passed}/${passed}) ✓`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
