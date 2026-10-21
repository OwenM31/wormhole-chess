/**
 * Automated TDD Verification Suite for the 36-Card Playbook & Phase 3 Global Invariants
 */

import { DeckChessEngine } from '../src/engine/DeckChessEngine';
import { CANONICAL_36_CARDS, PIECE_COLOR_THEMES } from '../src/engine/cards/releaseRoster36';
import { getCardById } from '../src/engine/cardGraph';
import { getCardHandler } from '../src/engine/cards/cardRegistry';

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
console.log(' 36-CARD PLAYBOOK TDD VERIFICATION SUITE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ==========================================
// Suite 1: Roster Schema & Visual Themes (36 Cards)
// ==========================================
console.log('Suite 1: Roster Schema & Visual Themes (36 Cards)');
{
  assert(CANONICAL_36_CARDS.length === 36, 'CANONICAL_36_CARDS contains exactly 36 cards');

  const counts: Record<string, number> = { pawn: 0, knight: 0, bishop: 0, rook: 0, queen: 0, king: 0 };
  for (const c of CANONICAL_36_CARDS) {
    counts[c.anchor]++;
  }
  assert(
    counts.pawn === 8 && counts.knight === 7 && counts.bishop === 7 &&
    counts.rook === 6 && counts.queen === 4 && counts.king === 4,
    'Exact 36-Card Abundance Pyramid: 8P, 7N, 7B, 6R, 4Q, 4K'
  );

  let allThemesValid = true;
  let allZeroEllipsis = true;
  for (const c of CANONICAL_36_CARDS) {
    if (!c.code || !c.world || c.energyCost !== 0) allThemesValid = false;
    if (c.name.includes('...') || c.description.includes('...')) allZeroEllipsis = false;
  }
  assert(allThemesValid, 'All 36 cards have valid codes (P1..K4), worlds (1..7), and energyCost = 0');
  assert(allZeroEllipsis, 'Zero-Ellipsis Rule: No ellipsis in titles or descriptions across 36 cards');

  // Verify Pokémon-style piece class themes
  assert(PIECE_COLOR_THEMES.pawn.hex === '#8A9199', 'Pawn color is Gray (#8A9199)');
  assert(PIECE_COLOR_THEMES.knight.hex === '#3FB950', 'Knight color is Green (#3FB950)');
  assert(PIECE_COLOR_THEMES.bishop.hex === '#3B82F6', 'Bishop color is Blue (#3B82F6)');
  assert(PIECE_COLOR_THEMES.rook.hex === '#A855F7', 'Rook color is Purple (#A855F7)');
  assert(PIECE_COLOR_THEMES.queen.hex === '#EF4444', 'Queen color is Red (#EF4444)');
  assert(PIECE_COLOR_THEMES.king.hex === '#D4AF37', 'King color is Gold (#D4AF37)');
}

// ==========================================
// Suite 2: Bespoke Pawns Suite (P1–P8)
// ==========================================
console.log('\nSuite 2: Bespoke Pawns Suite (P1–P8)');
{
  // P1: Sidestep
  const p1Engine = new DeckChessEngine('4k3/8/8/8/4p3/4P3/8/4K3 w - - 0 1', ['p1_sidestep']);
  const p1Moves = p1Engine.getEmpoweredMoves('e3');
  assert(p1Moves.some(m => m.to === 'd3') && p1Moves.some(m => m.to === 'f3'), 'P1 Sidestep offers d3 and f3');
  assert(p1Moves[0].previewFen !== undefined, 'P1 Sidestep attaches previewFen');
  const p1Res = p1Engine.makeEmpoweredMove(p1Moves.find(m => m.to === 'd3')!);
  assert(p1Res.success === true, 'P1 Sidestep executes move to d3');
  assert(p1Engine.getPiece('d3')?.type === 'p', 'Pawn arrived at d3');
  assert(p1Engine.getPiece('e3') === undefined, 'e3 vacated');

  // P2: Head On
  const p2Engine = new DeckChessEngine('4k3/8/8/8/4p3/4P3/8/4K3 w - - 0 1', ['p2_head_on']);
  const p2Moves = p2Engine.getEmpoweredMoves('e3');
  assert(p2Moves.some(m => m.to === 'e4'), 'P2 Head On targets enemy pawn at e4 straight ahead');
  const p2Res = p2Engine.makeEmpoweredMove(p2Moves.find(m => m.to === 'e4')!);
  assert(p2Res.success === true, 'P2 Head On captures straight ahead');
  assert(p2Engine.getPiece('e4')?.type === 'p' && p2Engine.getPiece('e4')?.color === 'w', 'Friendly pawn now at e4');
  assert(p2Engine.getGraveyard().b.p === 1, 'Captured enemy pawn added to graveyard');

  // P3: Follow Me
  const p3Engine = new DeckChessEngine('4k3/8/8/8/8/4P3/4R3/4K3 w - - 0 1', ['p3_follow_me']);
  const p3Moves = p3Engine.getEmpoweredMoves('e3');
  assert(p3Moves.some(m => m.to === 'e4'), 'P3 Follow Me targets empty e4 in front');
  const p3Res = p3Engine.makeEmpoweredMove(p3Moves.find(m => m.to === 'e4')!);
  assert(p3Res.success === true, 'P3 Follow Me advances pawn and trailing rook');
  assert(p3Engine.getPiece('e4')?.type === 'p', 'Pawn arrived at e4');
  assert(p3Engine.getPiece('e3')?.type === 'r', 'Rook advanced to e3');

  // P4: Attack Together (with extraSquare disambiguation)
  const p4Engine = new DeckChessEngine('4k3/8/8/8/3r4/4P3/3P1P2/4K3 w - - 0 1', ['p4_attack_together']);
  const p4Moves = p4Engine.getEmpoweredMoves('e3');
  assert(p4Moves.some(m => m.to === 'd4' && m.extraSquare === 'd2'), 'P4 Attack Together offers d4 with defending pawn d2');
  assert(p4Moves.some(m => m.to === 'd4' && m.extraSquare === 'f2'), 'P4 Attack Together offers d4 with defending pawn f2');
  const p4Res = p4Engine.makeEmpoweredMove(p4Moves.find(m => m.to === 'd4' && m.extraSquare === 'd2')!);
  assert(p4Res.success === true, 'P4 Attack Together executed');
  assert(p4Engine.getPiece('d4')?.type === 'p', 'Lead pawn captured d4');
  assert(p4Engine.getPiece('e3')?.type === 'p', 'Defending pawn advanced to e3');
  assert(p4Engine.getPiece('d2') === undefined, 'd2 vacated');

  // P5: Get Behind Me
  const p5Engine = new DeckChessEngine('4k3/8/8/8/8/4P3/3B4/4K3 w - - 0 1', ['p5_get_behind_me']);
  const p5Moves = p5Engine.getEmpoweredMoves('e3');
  assert(p5Moves.some(m => m.to === 'e2' && m.extraSquare === 'd2'), 'P5 Get Behind Me offers tucking bishop into e2');
  const p5Res = p5Engine.makeEmpoweredMove(p5Moves[0]);
  assert(p5Res.success === true, 'P5 Get Behind Me executed');
  assert(p5Engine.getPiece('e2')?.type === 'b', 'Bishop tucked behind pawn at e2');
  assert(p5Engine.getPiece('d2') === undefined, 'd2 vacated');

  // P6: Tag Out
  const p6Engine = new DeckChessEngine('4k3/8/8/8/8/4B3/4P3/4K3 w - - 0 1', ['p6_tag_out']);
  const p6Moves = p6Engine.getEmpoweredMoves('e2');
  assert(p6Moves.some(m => m.to === 'e3'), 'P6 Tag Out offers swap with frontally adjacent bishop');
  const p6Res = p6Engine.makeEmpoweredMove(p6Moves[0]);
  assert(p6Res.success === true, 'P6 Tag Out executed');
  assert(p6Engine.getPiece('e2')?.type === 'b', 'Bishop now at e2');
  assert(p6Engine.getPiece('e3')?.type === 'p', 'Pawn now at e3');

  // P7: Protect the King (In-Place Pin Strike)
  const p7Engine = new DeckChessEngine('4k3/3r4/8/8/8/2r5/3P4/3K4 w - - 0 1', ['p7_protect_the_king']);
  const p7Moves = p7Engine.getEmpoweredMoves('d2');
  assert(p7Moves.some(m => m.to === 'c3'), 'P7 Protect the King allows in-place strike on c3 while pinned');
  const p7Res = p7Engine.makeEmpoweredMove(p7Moves[0]);
  assert(p7Res.success === true, 'P7 Protect the King executed');
  assert(p7Engine.getPiece('d2')?.type === 'p', 'Pawn remained at d2');
  assert(p7Engine.getPiece('c3') === undefined, 'Enemy rook at c3 destroyed');
  assert(p7Engine.getGraveyard().b.r === 1, 'Enemy rook added to graveyard');

  // P8: Call Reserves
  const p8Engine = new DeckChessEngine('4k3/8/8/3RP3/8/8/8/4K3 w - - 0 1', ['p8_call_reserves']);
  const p8Moves = p8Engine.getEmpoweredMoves('e5');
  assert(p8Moves.some(m => m.to === 'e4'), 'P8 Call Reserves offers spawning on e4 directly behind pawn');
  const p8Res = p8Engine.makeEmpoweredMove(p8Moves[0]);
  assert(p8Res.success === true, 'P8 Call Reserves executed');
  assert(p8Engine.getPiece('e4')?.type === 'p', 'Friendly pawn spawned on e4');
}

// ==========================================
// Suite 3: Bespoke Knights Suite (N1–N7)
// ==========================================
console.log('\nSuite 3: Bespoke Knights Suite (N1–N7)');
{
  // N1: Adrenaline Jump (3x1 Camel Leap)
  const n1Engine = new DeckChessEngine('4k3/1r6/8/8/8/8/8/1N2K3 w - - 0 1', ['n1_adrenaline_jump']);
  const n1Moves = n1Engine.getEmpoweredMoves('b1');
  assert(n1Moves.some(m => m.to === 'c4'), 'N1 Adrenaline Jump offers (3,1) leap to c4 when under attack');
  const n1Res = n1Engine.makeEmpoweredMove(n1Moves.find(m => m.to === 'c4')!);
  assert(n1Res.success === true, 'N1 Adrenaline Jump executed');
  assert(n1Engine.getPiece('c4')?.type === 'n', 'Knight arrived at c4');

  // N2: Swap With Me
  const n2Engine = new DeckChessEngine('4k3/8/8/8/8/2B5/8/1N2K3 w - - 0 1', ['n2_swap_with_me']);
  const n2Moves = n2Engine.getEmpoweredMoves('b1');
  assert(n2Moves.some(m => m.to === 'c3'), 'N2 Swap With Me offers swap with bishop at c3');
  const n2Res = n2Engine.makeEmpoweredMove(n2Moves[0]);
  assert(n2Res.success === true, 'N2 Swap With Me executed');
  assert(n2Engine.getPiece('b1')?.type === 'b', 'Bishop now at b1');
  assert(n2Engine.getPiece('c3')?.type === 'n', 'Knight now at c3');

  // N3: Trample
  const n3Engine = new DeckChessEngine('4k3/8/8/8/8/8/8/N1p1K3 w - - 0 1', ['n3_trample']);
  // Knight at a1, enemy pawn at c1 on straight leg, landing b3 or c2
  // For jump a1 -> c2: df=2, dr=1. Straight leg: b1, c1. With pawn at c1, trample triggers!
  const n3Moves = n3Engine.getEmpoweredMoves('a1');
  assert(n3Moves.some(m => m.to === 'c2'), 'N3 Trample offers landing at c2 across enemy pawn at c1');
  const n3Res = n3Engine.makeEmpoweredMove(n3Moves.find(m => m.to === 'c2')!);
  assert(n3Res.success === true, 'N3 Trample executed');
  assert(n3Engine.getPiece('c2')?.type === 'n', 'Knight landed at c2');
  assert(n3Engine.getPiece('c1') === undefined, 'Enemy pawn on straight leg c1 destroyed');
  assert(n3Engine.getGraveyard().b.p === 1, 'Destroyed pawn added to graveyard');

  // N4: Pin Swap
  const n4Engine = new DeckChessEngine('4k3/8/8/8/4r3/8/4N3/3BK3 w - - 0 1', ['n4_pin_swap']);
  const n4Moves = n4Engine.getEmpoweredMoves('e2');
  assert(n4Moves.some(m => m.to === 'd1'), 'N4 Pin Swap offers swap with adjacent bishop d1');
  const n4Res = n4Engine.makeEmpoweredMove(n4Moves.find(m => m.to === 'd1')!);
  assert(n4Res.success === true, 'N4 Pin Swap executed');
  assert(n4Engine.getPiece('d1')?.type === 'n', 'Knight now at d1');
  assert(n4Engine.getPiece('e2')?.type === 'b', 'Bishop now at e2 (blocking check)');

  // N5: Get to the King
  const n5Engine = new DeckChessEngine('4k3/8/8/8/4r3/8/8/N3K3 w - - 0 1', ['n5_get_to_the_king']);
  const n5Moves = n5Engine.getEmpoweredMoves('a1');
  assert(n5Moves.some(m => m.to === 'e2'), 'N5 Get to the King allows intercepting check at e2');
  const n5Res = n5Engine.makeEmpoweredMove(n5Moves.find(m => m.to === 'e2')!);
  assert(n5Res.success === true, 'N5 Get to the King executed');
  assert(n5Engine.getPiece('e2')?.type === 'n', 'Knight blocked check at e2');

  // N6: Flanking Support
  const n6Engine = new DeckChessEngine('4k3/8/8/8/8/8/8/N3K1N1 w - - 0 1', ['n6_flanking_support']);
  const n6Moves = n6Engine.getEmpoweredMoves('a1');
  assert(n6Moves.some(m => m.to === 'c2' && m.extraSquare === 'g1'), 'N6 Flanking Support moves a1->c2 and pulls g1->a1');
  const n6Res = n6Engine.makeEmpoweredMove(n6Moves.find(m => m.to === 'c2')!);
  assert(n6Res.success === true, 'N6 Flanking Support executed');
  assert(n6Engine.getPiece('c2')?.type === 'n', 'Lead knight at c2');
  assert(n6Engine.getPiece('a1')?.type === 'n', 'Reinforcing knight teleported to a1');
  assert(n6Engine.getPiece('g1') === undefined, 'g1 vacated');

  // N7: Outpost Support
  const n7Engine = new DeckChessEngine('4k3/8/8/4N3/3P4/8/8/4K3 w - - 0 1', ['n7_outpost_support']);
  const n7Moves = n7Engine.getEmpoweredMoves('e5');
  assert(n7Moves.some(m => m.to === 'f4'), 'N7 Outpost Support offers spawning pawn on empty rear-diagonal f4');
  const n7Res = n7Engine.makeEmpoweredMove(n7Moves[0]);
  assert(n7Res.success === true, 'N7 Outpost Support executed');
  assert(n7Engine.getPiece('f4')?.type === 'p', 'Pawn spawned on f4');
}

// ==========================================
// Suite 4: Bespoke Bishops Suite (B1–B7)
// ==========================================
console.log('\nSuite 4: Bespoke Bishops Suite (B1–B7)');
{
  // B1: Let Me Through
  const b1Engine = new DeckChessEngine('4k3/8/8/8/8/3P4/2B5/4K3 w - - 0 1', ['b1_let_me_through']);
  const b1Moves = b1Engine.getEmpoweredMoves('c2');
  assert(b1Moves.some(m => m.to === 'd3'), 'B1 Let Me Through offers swap with friendly pawn at d3');
  const b1Res = b1Engine.makeEmpoweredMove(b1Moves[0]);
  assert(b1Res.success === true, 'B1 Let Me Through executed');
  assert(b1Engine.getPiece('d3')?.type === 'b', 'Bishop now at d3');
  assert(b1Engine.getPiece('c2')?.type === 'p', 'Pawn now at c2');

  // B2: Pierce
  const b2Engine = new DeckChessEngine('4k3/8/8/8/5p2/8/8/2B1K3 w - - 0 1', ['b2_pierce']);
  const b2Moves = b2Engine.getEmpoweredMoves('c1');
  assert(b2Moves.some(m => m.to === 'g5'), 'B2 Pierce offers landing on g5 beyond enemy pawn f4');
  const b2Res = b2Engine.makeEmpoweredMove(b2Moves.find(m => m.to === 'g5')!);
  assert(b2Res.success === true, 'B2 Pierce executed');
  assert(b2Engine.getPiece('g5')?.type === 'b', 'Bishop landed on g5');
  assert(b2Engine.getPiece('f4') === undefined, 'Pierced pawn f4 destroyed');

  // B3: Ricochet
  const b3Engine = new DeckChessEngine('4k3/8/8/8/8/8/8/2B1K3 w - - 0 1', ['b3_ricochet']);
  const b3Moves = b3Engine.getEmpoweredMoves('c1');
  assert(b3Moves.some(m => m.to === 'c5'), 'B3 Ricochet offers bouncing off a3 to c5');
  const b3Res = b3Engine.makeEmpoweredMove(b3Moves.find(m => m.to === 'c5')!);
  assert(b3Res.success === true, 'B3 Ricochet executed');
  assert(b3Engine.getPiece('c5')?.type === 'b', 'Bishop arrived at c5 via ricochet');

  // B4: Change Color
  const b4Engine = new DeckChessEngine('4k3/8/8/8/8/8/8/B3K3 w - - 0 1', ['b4_change_color']);
  const b4Moves = b4Engine.getEmpoweredMoves('a1');
  assert(b4Moves.some(m => m.to === 'a2') && b4Moves.some(m => m.to === 'b1'), 'B4 Change Color offers orthogonal steps a2 and b1');
  const b4Res = b4Engine.makeEmpoweredMove(b4Moves.find(m => m.to === 'a2')!);
  assert(b4Res.success === true, 'B4 Change Color executed');
  assert(b4Engine.getPiece('a2')?.type === 'b', 'Bishop now at a2 (color changed to dark square)');

  // B5: Take My Place
  const b5Engine = new DeckChessEngine('4k3/8/8/8/4r3/8/4B3/4K3 w - - 0 1', ['b5_take_my_place']);
  b5Engine.getInternalChess().put({ type: 'p', color: 'w' }, 'f3');
  const b5Moves = b5Engine.getEmpoweredMoves('e2');
  assert(b5Moves.some(m => m.to === 'f3'), 'B5 Take My Place offers diagonal swap with pawn f3 while pinned');
  const b5Res = b5Engine.makeEmpoweredMove(b5Moves[0]);
  assert(b5Res.success === true, 'B5 Take My Place executed');
  assert(b5Engine.getPiece('f3')?.type === 'b', 'Bishop now at f3');
  assert(b5Engine.getPiece('e2')?.type === 'p', 'Pawn now at e2 (shielding king)');

  // B6: Come This Way
  const b6Engine = new DeckChessEngine('4k3/8/8/8/3B4/8/1P6/4K3 w - - 0 1', ['b6_come_this_way']);
  const b6Moves = b6Engine.getEmpoweredMoves('d4');
  assert(b6Moves.some(m => m.to === 'b2'), 'B6 Come This Way targets pawn at b2');
  const b6Res = b6Engine.makeEmpoweredMove(b6Moves[0]);
  assert(b6Res.success === true, 'B6 Come This Way executed');
  assert(b6Engine.getPiece('c3')?.type === 'p', 'Pawn pulled along diagonal to c3');
  assert(b6Engine.getPiece('b2') === undefined, 'b2 vacated');

  // B7: Bishop's Blessing
  const b7Engine = new DeckChessEngine('4k3/8/8/8/8/4B3/4R3/4K3 w - - 0 1', ['b7_bishops_blessing']);
  const b7Moves = b7Engine.getEmpoweredMoves('e3');
  assert(b7Moves.some(m => m.to === 'c4'), 'B7 Bishop\'s Blessing allows rear rook to slide diagonally to c4');
  const b7Res = b7Engine.makeEmpoweredMove(b7Moves.find(m => m.to === 'c4')!);
  assert(b7Res.success === true, 'B7 Bishop\'s Blessing executed');
  assert(b7Engine.getPiece('c4')?.type === 'r', 'Blessed rook moved to c4');
  assert(b7Engine.getPiece('e3')?.type === 'b', 'Bishop remained at e3');
}

// ==========================================
// Suite 5: Bespoke Rooks Suite (R1–R6)
// ==========================================
console.log('\nSuite 5: Bespoke Rooks Suite (R1–R6)');
{
  // R1: Make Way
  const r1Engine = new DeckChessEngine('4k3/8/8/8/8/8/4P3/4R2K w - - 0 1', ['r1_make_way']);
  const r1Moves = r1Engine.getEmpoweredMoves('e1');
  assert(r1Moves.some(m => m.to === 'e2'), 'R1 Make Way targets adjacent pawn at e2');
  const r1Res = r1Engine.makeEmpoweredMove(r1Moves[0]);
  assert(r1Res.success === true, 'R1 Make Way executed');
  assert(r1Engine.getPiece('e2')?.type === 'r', 'Rook moved into e2');
  assert(r1Engine.getPiece('e3')?.type === 'p', 'Pawn pushed to e3');

  // R2: I've Got Your Back
  const r2Engine = new DeckChessEngine('4k3/8/8/8/8/8/8/R3B2K w - - 0 1', ['r2_ive_got_your_back']);
  const r2Moves = r2Engine.getEmpoweredMoves('a1');
  assert(r2Moves.some(m => m.to === 'e1'), 'R2 I\'ve Got Your Back targets bishop on e1');
  const r2Res = r2Engine.makeEmpoweredMove(r2Moves[0]);
  assert(r2Res.success === true, 'R2 I\'ve Got Your Back executed');
  assert(r2Engine.getPiece('e1')?.type === 'r', 'Rook slid to e1');
  assert(r2Engine.getPiece('e2')?.type === 'b', 'Bishop pushed forward to e2');

  // R3: Cut Across
  const r3Engine = new DeckChessEngine('4k3/8/8/8/8/8/8/R6K w - - 0 1', ['r3_cut_across']);
  const r3Moves = r3Engine.getEmpoweredMoves('a1');
  assert(r3Moves.some(m => m.to === 'b2'), 'R3 Cut Across allows diagonal step on main diagonal');
  const r3Res = r3Engine.makeEmpoweredMove(r3Moves[0]);
  assert(r3Res.success === true, 'R3 Cut Across executed');
  assert(r3Engine.getPiece('b2')?.type === 'r', 'Rook stepped diagonally to b2');

  // R4: Move in Unison
  const r4Engine = new DeckChessEngine('4k3/8/8/8/8/8/8/R5RK w - - 0 1', ['r4_move_in_unison']);
  const r4Moves = r4Engine.getEmpoweredMoves('a1');
  assert(r4Moves.some(m => m.to === 'a3' && m.extraSquare === 'g3'), 'R4 Move in Unison pairs a1->a3 with g1->g3');
  const r4Res = r4Engine.makeEmpoweredMove(r4Moves.find(m => m.to === 'a3')!);
  assert(r4Res.success === true, 'R4 Move in Unison executed');
  assert(r4Engine.getPiece('a3')?.type === 'r', 'Rook 1 at a3');
  assert(r4Engine.getPiece('g3')?.type === 'r', 'Rook 2 at g3');

  // R5: Catapult
  const r5Engine = new DeckChessEngine('4k3/8/8/4r3/8/4R3/4N3/7K w - - 0 1', ['r5_catapult']);
  const r5Moves = r5Engine.getEmpoweredMoves('e3');
  assert(r5Moves.some(m => m.to === 'e5'), 'R5 Catapult targets enemy rook on e5');
  const r5Res = r5Engine.makeEmpoweredMove(r5Moves[0]);
  assert(r5Res.success === true, 'R5 Catapult executed');
  assert(r5Engine.getPiece('e5')?.type === 'n', 'Knight catapulted onto e5');
  assert(r5Engine.getPiece('e3')?.type === 'r', 'Rook stayed at e3');
  assert(r5Engine.getGraveyard().b.r === 1, 'Enemy rook captured');

  // R6: Garrison
  const r6Engine = new DeckChessEngine('4k3/8/8/8/8/8/4R3/4K3 w - - 0 1', ['r6_garrison']);
  const r6Moves = r6Engine.getEmpoweredMoves('e2');
  assert(r6Moves.some(m => m.to === 'e3'), 'R6 Garrison offers spawning pawn on e3');
  const r6Res = r6Engine.makeEmpoweredMove(r6Moves[0]);
  assert(r6Res.success === true, 'R6 Garrison executed');
  assert(r6Engine.getPiece('e3')?.type === 'p', 'Pawn spawned on e3');
}

// ==========================================
// Suite 6: Bespoke Queens Suite (Q1–Q4)
// ==========================================
console.log('\nSuite 6: Bespoke Queens Suite (Q1–Q4)');
{
  // Q1: Royal Summons
  const q1Engine = new DeckChessEngine('4k3/8/8/8/4P3/8/8/4Q2K w - - 0 1', ['q1_royal_summons']);
  const q1Moves = q1Engine.getEmpoweredMoves('e1');
  assert(q1Moves.some(m => m.to === 'e4'), 'Q1 Royal Summons targets pawn at e4');
  const q1Res = q1Engine.makeEmpoweredMove(q1Moves[0]);
  assert(q1Res.success === true, 'Q1 Royal Summons executed');
  assert(q1Engine.getPiece('e2')?.type === 'p', 'Pawn summoned adjacent to Queen at e2');
  assert(q1Engine.getPiece('e4') === undefined, 'e4 vacated');

  // Q2: The Queen's Gambit
  const q2Engine = new DeckChessEngine('4k3/8/8/8/4r3/8/4B3/4Q2K w - - 0 1', ['q2_the_queens_gambit']);
  const q2Moves = q2Engine.getEmpoweredMoves('e1');
  assert(q2Moves.some(m => m.to === 'e4' && m.extraSquare === 'e2'), 'Q2 Queen\'s Gambit targets attacker e4 sacrificing e2');
  const q2Res = q2Engine.makeEmpoweredMove(q2Moves[0]);
  assert(q2Res.success === true, 'Q2 Queen\'s Gambit executed');
  assert(q2Engine.getPiece('e4')?.type === 'q', 'Queen captured attacking rook at e4');
  assert(q2Engine.getPiece('e2') === undefined, 'Sacrificed bishop removed from e2');
  assert(q2Engine.getGraveyard().w.b === 1, 'Sacrificed bishop in White graveyard');
  assert(q2Engine.getGraveyard().b.r === 1, 'Captured enemy rook in Black graveyard');

  // Q3: All Rise
  const q3Engine = new DeckChessEngine('4k3/8/8/8/4Q3/8/2P1P3/4K3 w - - 0 1', ['q3_all_rise']);
  const q3Moves = q3Engine.getEmpoweredMoves('e4');
  assert(q3Moves.length === 1 && q3Moves[0].to === 'e4', 'Q3 All Rise generates wave trigger on Queen');
  const q3Res = q3Engine.makeEmpoweredMove(q3Moves[0]);
  assert(q3Res.success === true, 'Q3 All Rise executed');
  assert(q3Engine.getPiece('c3')?.type === 'p', 'Pawn advanced c2->c3');
  assert(q3Engine.getPiece('e3')?.type === 'p', 'Pawn advanced e2->e3');

  // Q4: One Fell Swoop
  const q4Engine = new DeckChessEngine('4k3/8/4p3/4r3/4p3/4Q3/4R3/7K w - - 0 1', ['q4_one_fell_swoop']);
  const q4Moves = q4Engine.getEmpoweredMoves('e3');
  assert(q4Moves.some(m => m.to === 'e7'), 'Q4 One Fell Swoop sweeps ray to e7');
  const q4Res = q4Engine.makeEmpoweredMove(q4Moves.find(m => m.to === 'e7')!);
  assert(q4Res.success === true, 'Q4 One Fell Swoop executed');
  assert(q4Engine.getPiece('e7')?.type === 'q', 'Queen arrived at e7');
  assert(q4Engine.getGraveyard().b.p === 2, 'Both swept pawns in Black graveyard');
  assert(q4Engine.getGraveyard().b.r === 1, 'Swept rook in Black graveyard');
}

// ==========================================
// Suite 7: Bespoke Kings Suite (K1–K4)
// ==========================================
console.log('\nSuite 7: Bespoke Kings Suite (K1–K4)');
{
  // K1: Conscription
  const k1Engine = new DeckChessEngine('4k3/8/8/8/8/8/8/K7 w - - 0 1', ['k1_conscription']);
  const k1Moves = k1Engine.getEmpoweredMoves('a1');
  assert(k1Moves.length === 1, 'K1 Conscription offers spawning from home corner');
  const k1Res = k1Engine.makeEmpoweredMove(k1Moves[0]);
  assert(k1Res.success === true, 'K1 Conscription executed');
  assert(k1Engine.getPiece('a2')?.type === 'p', 'Friendly pawn conscripted on a2');
  assert(k1Engine.getPiece('b1')?.type === 'p', 'Friendly pawn conscripted on b1 (Rank 1 home pawn!)');

  // K2: Royal Knighting
  const k2Engine = new DeckChessEngine('4k3/8/8/8/8/8/8/KP6 w - - 0 1', ['k2_royal_knighting']);
  const k2Moves = k2Engine.getEmpoweredMoves('a1');
  assert(k2Moves.some(m => m.to === 'b1'), 'K2 Royal Knighting targets adjacent pawn b1');
  const k2Res = k2Engine.makeEmpoweredMove(k2Moves[0]);
  assert(k2Res.success === true, 'K2 Royal Knighting executed');
  assert(k2Engine.getPiece('b1')?.type === 'n', 'Pawn knighted into Knight at b1');
  assert(k2Engine.getGraveyard().w.p === 1, 'Consolidated pawn in White graveyard');

  // K3: Royal Execution
  const k3Engine = new DeckChessEngine('4k3/8/8/8/8/2r5/8/KB6 w - - 0 1', ['k3_royal_execution']);
  const k3Moves = k3Engine.getEmpoweredMoves('a1');
  assert(k3Moves.some(m => m.to === 'c3' && m.extraSquare === 'b1'), 'K3 Royal Execution strikes c3 using bishop b1 sightline from king');
  const k3Res = k3Engine.makeEmpoweredMove(k3Moves[0]);
  assert(k3Res.success === true, 'K3 Royal Execution executed');
  assert(k3Engine.getPiece('c3')?.type === 'b', 'Bishop executed strike to c3');
  assert(k3Engine.getPiece('b1') === undefined, 'b1 vacated');
  assert(k3Engine.getPiece('a1')?.type === 'k', 'King remained at a1');
  assert(k3Engine.getGraveyard().b.r === 1, 'Enemy rook captured');

  // K4: Banish
  const k4Engine = new DeckChessEngine('4k3/8/8/8/8/4p3/4p3/4K3 w - - 0 1', ['k4_banish']);
  const k4Moves = k4Engine.getEmpoweredMoves('e1');
  assert(k4Moves.some(m => m.to === 'e2'), 'K4 Banish targets contiguous enemy stack on e-file');
  const k4Res = k4Engine.makeEmpoweredMove(k4Moves[0]);
  assert(k4Res.success === true, 'K4 Banish executed');
  assert(k4Engine.getPiece('e2') === undefined && k4Engine.getPiece('e3') === undefined, 'e2 and e3 vacated');
  // Top pawn pushed to rank 7 (e7), bottom pawn pushed to e6 (stopping before King on e8)
  assert(k4Engine.getPiece('e7')?.type === 'p' && k4Engine.getPiece('e6')?.type === 'p', 'Enemy stack banished to e6 and e7');
}

// ==========================================
// Suite 8: Global Engine Invariants
// ==========================================
console.log('\nSuite 8: Global Engine Invariants');
{
  // 1. Rank 1 Pawns legal moves (b1 -> b2 single step)
  const rank1Engine = new DeckChessEngine('rnbqkbnr/pppppppp/8/8/8/8/8/1P3K1R w kq - 0 1');
  const legalMoves = rank1Engine.getLegalMoves('b1');
  assert(legalMoves.some(m => m.to === 'b2'), 'Rank 1 Pawn has legal move b1->b2');
  const stepRes = rank1Engine.makeMove({ from: 'b1', to: 'b2' });
  assert(stepRes.success === true, 'Rank 1 Pawn steps forward to b2');
  assert(rank1Engine.getPiece('b2')?.type === 'p', 'Pawn now at b2');

  // 2. Rank 8 Instant Promotion sweep on secondary moves
  const promoEngine = new DeckChessEngine('7k/4P3/4R3/8/8/8/8/4K3 w - - 0 1', ['r1_make_way']);
  const makeWayPromo = promoEngine.getEmpoweredMoves('e6');
  assert(makeWayPromo.some(m => m.to === 'e7'), 'R1 Make Way available on e6');
  promoEngine.makeEmpoweredMove(makeWayPromo[0]);
  assert(promoEngine.getPiece('e8')?.type === 'q', 'Secondary pawn pushed to Rank 8 immediately promotes to Queen');

  // 3. limitPawnsTo8 toggle
  const limitEngine = new DeckChessEngine('4k3/8/8/8/8/8/PPPPPPPP/K7 w - - 0 1', ['k1_conscription']);
  limitEngine.limitPawnsTo8 = true;
  assert(limitEngine.canSpawnPawn('w') === false, 'canSpawnPawn returns false when 8 pawns already exist and limitPawnsTo8 is true');
  const conscriptionMovesLimited = limitEngine.getEmpoweredMoves('a1');
  assert(conscriptionMovesLimited.length === 0, 'Conscription rejected when 8 pawns already exist and limit is active');

  limitEngine.limitPawnsTo8 = false;
  assert(limitEngine.canSpawnPawn('w') === true, 'canSpawnPawn returns true when limitPawnsTo8 is false');
  const conscriptionMovesUncapped = limitEngine.getEmpoweredMoves('a1');
  assert(conscriptionMovesUncapped.length === 1, 'Conscription available when limitPawnsTo8 is disabled');
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(` RESULTS: ${passedTests} / ${totalTests} PASSED (${failedTests} FAILED)`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (failedTests > 0) {
  process.exit(1);
}
