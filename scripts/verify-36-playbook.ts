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
  // P1: Sidestep (diagonal step when blocked ahead)
  const p1Engine = new DeckChessEngine('4k3/8/8/8/4p3/4P3/8/4K3 w - - 0 1', ['p1_sidestep']);
  const p1Moves = p1Engine.getEmpoweredMoves('e3');
  assert(p1Moves.some(m => m.to === 'd4') && p1Moves.some(m => m.to === 'f4'), 'P1 Sidestep offers d4 and f4');
  assert(p1Moves[0].previewFen !== undefined, 'P1 Sidestep attaches previewFen');
  const p1Res = p1Engine.makeEmpoweredMove(p1Moves.find(m => m.to === 'd4')!);
  assert(p1Res.success === true, 'P1 Sidestep executes move to d4');
  assert(p1Engine.getPiece('d4')?.type === 'p', 'Pawn arrived at d4');
  assert(p1Engine.getPiece('e3') === undefined, 'e3 vacated');

  // P2: Head On
  const p2Engine = new DeckChessEngine('4k3/8/8/8/4p3/4P3/8/4K3 w - - 0 1', ['p2_head_on']);
  const p2Moves = p2Engine.getEmpoweredMoves('e3');
  assert(p2Moves.some(m => m.to === 'e4'), 'P2 Head On targets enemy pawn at e4 straight ahead');
  const p2Res = p2Engine.makeEmpoweredMove(p2Moves.find(m => m.to === 'e4')!);
  assert(p2Res.success === true, 'P2 Head On captures straight ahead');
  assert(p2Engine.getPiece('e4')?.type === 'p' && p2Engine.getPiece('e4')?.color === 'w', 'Friendly pawn now at e4');
  assert(p2Engine.getGraveyard().b.p === 1, 'Captured enemy pawn added to graveyard');

  // P3: March Together
  const p3Engine = new DeckChessEngine('4k3/8/8/8/3PP3/8/8/4K3 w - - 0 1', ['p3_follow_me']);
  const p3Moves = p3Engine.getEmpoweredMoves('d4');
  assert(p3Moves.some(m => m.to === 'd5'), 'P3 March Together targets d5 with partner e4');
  const p3Res = p3Engine.makeEmpoweredMove(p3Moves[0]);
  assert(p3Res.success === true, 'P3 March Together advances pawns');
  assert(p3Engine.getPiece('d5')?.type === 'p', 'Primary pawn advanced to d5');
  assert(p3Engine.getPiece('e5')?.type === 'p', 'Partner pawn advanced to e5');

  // P4: Attack Together
  const p4Engine = new DeckChessEngine('4k3/8/8/4n3/2PP4/8/8/4K3 w - - 0 1', ['p4_attack_together']);
  const p4Moves = p4Engine.getEmpoweredMoves('d4');
  assert(p4Moves.some(m => m.to === 'e5' && m.extraSquare === 'c4'), 'P4 Attack Together offers e5 with partner c4');
  const p4Res = p4Engine.makeEmpoweredMove(p4Moves.find(m => m.to === 'e5' && m.extraSquare === 'c4')!);
  assert(p4Res.success === true, 'P4 Attack Together executed');
  assert(p4Engine.getPiece('e5')?.type === 'p', 'Lead pawn captured e5');
  assert(p4Engine.getPiece('d4')?.type === 'p', 'Partner pawn stepped to d4');
  assert(p4Engine.getPiece('c4') === undefined, 'c4 vacated');
  assert(p4Engine.getGraveyard().b.n === 1, 'Enemy knight added to graveyard');

  // P5: Get Behind Me
  const p5Engine = new DeckChessEngine('4r1k1/8/8/4N3/4P3/8/8/4K3 w - - 0 1', ['p5_get_behind_me']);
  const p5Moves = p5Engine.getEmpoweredMoves('e4');
  assert(p5Moves.some(m => m.to === 'e5'), 'P5 Get Behind Me offers swap with attacked knight at e5');
  const p5Res = p5Engine.makeEmpoweredMove(p5Moves[0]);
  assert(p5Res.success === true, 'P5 Get Behind Me executed');
  assert(p5Engine.getPiece('e5')?.type === 'p', 'Pawn is now on e5');
  assert(p5Engine.getPiece('e4')?.type === 'n', 'Knight rescued to e4');

  // P6: Double Time
  const p6Engine = new DeckChessEngine('4k3/8/8/8/8/4P3/8/4K3 w - - 0 1', ['p6_tag_out']);
  const p6Moves = p6Engine.getEmpoweredMoves('e3');
  assert(p6Moves.some(m => m.to === 'e5'), 'P6 Double Time offers 2-square sprint to e5');
  const p6Res = p6Engine.makeEmpoweredMove(p6Moves[0]);
  assert(p6Res.success === true, 'P6 Double Time executed');
  assert(p6Engine.getPiece('e5')?.type === 'p', 'Pawn sprinted to e5');
  assert(p6Engine.getPiece('e3') === undefined, 'e3 vacated');

  // P7: Protect the King
  const p7Engine = new DeckChessEngine('4k3/8/8/8/8/8/2P5/3K4 w - - 0 1', ['p7_protect_the_king']);
  const p7Moves = p7Engine.getEmpoweredMoves('c2');
  assert(p7Moves.some(m => m.to === 'a4'), 'P7 Protect the King slides diagonally to a4');
  const p7Res = p7Engine.makeEmpoweredMove(p7Moves.find(m => m.to === 'a4')!);
  assert(p7Res.success === true, 'P7 Protect the King executed');
  assert(p7Engine.getPiece('a4')?.type === 'p', 'Pawn moved to a4');

  // P8: Call Reserves
  const p8Engine = new DeckChessEngine('4k3/8/8/4P3/8/8/8/4K3 w - - 0 1', ['p8_call_reserves']);
  const p8Moves = p8Engine.getEmpoweredMoves('e5');
  assert(p8Moves.some(m => m.to === 'd4'), 'P8 Call Reserves offers spawning on d4');
  const p8Res = p8Engine.makeEmpoweredMove(p8Moves[0]);
  assert(p8Res.success === true, 'P8 Call Reserves executed');
  assert(p8Engine.getPiece('d4')?.type === 'p', 'Friendly pawn spawned on d4');
  assert(p8Engine.getPiece('e5')?.type === 'p', 'Original pawn remains on e5');
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

  // N2: Springboard
  const n2Engine = new DeckChessEngine('4k3/8/3p4/8/8/2B5/8/1N2K3 w - - 0 1', ['n2_swap_with_me']);
  const n2Moves = n2Engine.getEmpoweredMoves('b1');
  assert(n2Moves.some(m => m.to === 'd5' && m.extraSquare === 'c3'), 'N2 Springboard bounces off c3 to capture at d5');
  const n2Res = n2Engine.makeEmpoweredMove(n2Moves.find(m => m.to === 'd5')!);
  assert(n2Res.success === true, 'N2 Springboard executed');
  assert(n2Engine.getPiece('d5')?.type === 'n', 'Knight landed on d5');
  assert(n2Engine.getPiece('c3')?.type === 'b', 'Springboard ally remains on c3');

  // N3: Trample
  const n3Engine = new DeckChessEngine('4k3/8/8/8/8/8/1p6/1N2K3 w - - 0 1', ['n3_trample']);
  const n3Moves = n3Engine.getEmpoweredMoves('b1');
  assert(n3Moves.some(m => m.to === 'c3'), 'N3 Trample offers landing at c3 across enemy pawn on b2');
  const n3Res = n3Engine.makeEmpoweredMove(n3Moves.find(m => m.to === 'c3')!);
  assert(n3Res.success === true, 'N3 Trample executed');
  assert(n3Engine.getPiece('c3')?.type === 'n', 'Knight landed at c3');
  assert(n3Engine.getPiece('b2') === undefined, 'Trampled pawn at b2 removed');
  assert(n3Engine.getGraveyard().b.p === 1, 'Destroyed pawn added to graveyard');

  // N4: Square Jump
  const n4Engine = new DeckChessEngine('4k3/8/8/8/3N4/2P5/8/4K3 w - - 0 1', ['n4_pin_swap']);
  const n4Moves = n4Engine.getEmpoweredMoves('d4');
  assert(n4Moves.some(m => m.to === 'f6'), 'N4 Square Jump leaps to f6');
  const n4Res = n4Engine.makeEmpoweredMove(n4Moves.find(m => m.to === 'f6')!);
  assert(n4Res.success === true, 'N4 Square Jump executed');
  assert(n4Engine.getPiece('f6')?.type === 'n', 'Knight landed on f6');

  // N5: Get to the King
  const n5Engine = new DeckChessEngine('2q1k3/8/8/1N6/8/8/8/7K w - - 0 1', ['n5_get_to_the_king']);
  const n5Moves = n5Engine.getEmpoweredMoves('b5');
  assert(n5Moves.some(m => m.extraSquare === 'd6'), 'N5 Get to the King generates safe fork through d6');
  assert(n5Moves[0].stageExtraSquareFirst === true, 'N5 stages extra square first');

  // N6: Flanking Support
  const n6Engine = new DeckChessEngine('4k3/8/8/8/8/8/8/1N4NK w - - 0 1', ['n6_flanking_support']);
  const n6Moves = n6Engine.getEmpoweredMoves('b1');
  assert(n6Moves.some(m => m.to === 'c3' && m.extraSquare === 'g1'), 'N6 Flanking Support moves b1->c3 and pulls g1->b1');
  const n6Res = n6Engine.makeEmpoweredMove(n6Moves.find(m => m.to === 'c3')!);
  assert(n6Res.success === true, 'N6 Flanking Support executed');
  assert(n6Engine.getPiece('c3')?.type === 'n', 'Lead knight at c3');
  assert(n6Engine.getPiece('b1')?.type === 'n', 'Reinforcing knight teleported to b1');
  assert(n6Engine.getPiece('g1') === undefined, 'g1 vacated');

  // N7: Outpost Support
  const n7Engine = new DeckChessEngine('4k3/8/8/3N4/8/8/8/4K3 w - - 0 1', ['n7_outpost_support']);
  const n7Moves = n7Engine.getEmpoweredMoves('d5');
  assert(n7Moves.some(m => m.to === 'c4' || m.to === 'e4'), 'N7 Outpost Support spawns pawn on rear diagonal');
  const n7Res = n7Engine.makeEmpoweredMove(n7Moves[0]);
  assert(n7Res.success === true, 'N7 Outpost Support executed');
  assert(n7Engine.getPiece('d5')?.type === 'n', 'Knight remains on d5');
}

// ==========================================
// Suite 4: Bespoke Bishops Suite (B1–B7)
// ==========================================
console.log('\nSuite 4: Bespoke Bishops Suite (B1–B7)');
{
  // B1: Let Me Through
  const b1Engine = new DeckChessEngine('4k3/8/8/5r2/8/8/3P4/2B1K3 w - - 0 1', ['b1_let_me_through']);
  const b1Moves = b1Engine.getEmpoweredMoves('c1');
  assert(b1Moves.some(m => m.to === 'f4'), 'B1 Let Me Through phases through d2 to capture f4');
  const b1Res = b1Engine.makeEmpoweredMove(b1Moves.find(m => m.to === 'f4')!);
  assert(b1Res.success === true, 'B1 Let Me Through executed');
  assert(b1Engine.getPiece('f4')?.type === 'b', 'Bishop now at f4');
  assert(b1Engine.getPiece('d2')?.type === 'p', 'Friendly pawn at d2 untouched');

  // B2: Pierce
  const b2Engine = new DeckChessEngine('4k3/8/6n1/8/8/4p3/8/2B1K3 w - - 0 1', ['b2_pierce']);
  const b2Moves = b2Engine.getEmpoweredMoves('c1');
  assert(b2Moves.some(m => m.to === 'g5'), 'B2 Pierce offers landing on g5 beyond enemy pawn e3');
  const b2Res = b2Engine.makeEmpoweredMove(b2Moves.find(m => m.to === 'g5')!);
  assert(b2Res.success === true, 'B2 Pierce executed');
  assert(b2Engine.getPiece('g5')?.type === 'b', 'Bishop landed on g5');
  assert(b2Engine.getPiece('e3') === undefined, 'Pierced pawn e3 destroyed');

  // B3: Ricochet
  const b3Engine = new DeckChessEngine('4k3/8/8/8/8/8/8/2B1K3 w - - 0 1', ['b3_ricochet']);
  const b3Moves = b3Engine.getEmpoweredMoves('c1');
  assert(b3Moves.some(m => m.to === 'c5'), 'B3 Ricochet offers bouncing off a3 to c5');
  const b3Res = b3Engine.makeEmpoweredMove(b3Moves.find(m => m.to === 'c5')!);
  assert(b3Res.success === true, 'B3 Ricochet executed');
  assert(b3Engine.getPiece('c5')?.type === 'b', 'Bishop arrived at c5 via ricochet');

  // B4: Change Color
  const b4Engine = new DeckChessEngine('4k3/8/8/2p5/2B5/8/8/4K3 w - - 0 1', ['b4_change_color']);
  const b4Moves = b4Engine.getEmpoweredMoves('c4');
  assert(b4Moves.some(m => m.to === 'c5'), 'B4 Change Color captures orthogonally adjacent c5');
  const b4Res = b4Engine.makeEmpoweredMove(b4Moves.find(m => m.to === 'c5')!);
  assert(b4Res.success === true, 'B4 Change Color executed');
  assert(b4Engine.getPiece('c5')?.type === 'b', 'Bishop now at c5 (color changed to dark square)');

  // B5: Take My Place
  const b5Engine = new DeckChessEngine('2r1k3/8/4N3/8/2B5/8/8/4K3 w - - 0 1', ['b5_take_my_place']);
  const b5Moves = b5Engine.getEmpoweredMoves('c4');
  assert(b5Moves.some(m => m.to === 'e6'), 'B5 Take My Place swaps with friendly knight on diagonal at e6');
  const b5Res = b5Engine.makeEmpoweredMove(b5Moves.find(m => m.to === 'e6')!);
  assert(b5Res.success === true, 'B5 Take My Place executed');
  assert(b5Engine.getPiece('e6')?.type === 'b', 'Bishop now at e6');
  assert(b5Engine.getPiece('c4')?.type === 'n', 'Knight now at c4');

  // B6: Diagonal Launch
  const b6Engine = new DeckChessEngine('4k3/8/8/8/3P4/3B4/8/4K3 w - - 0 1', ['b6_come_this_way']);
  const b6Moves = b6Engine.getEmpoweredMoves('d3');
  assert(b6Moves.some(m => m.to === 'c5' && m.extraSquare === 'd4'), 'B6 Diagonal Launch launches pawn to c5');
  const b6Res = b6Engine.makeEmpoweredMove(b6Moves.find(m => m.to === 'c5')!);
  assert(b6Res.success === true, 'B6 Diagonal Launch executed');
  assert(b6Engine.getPiece('c5')?.type === 'p', 'Pawn launched to c5');
  assert(b6Engine.getPiece('d3')?.type === 'b', 'Bishop stays at d3');

  // B7: Bishop's Blessing
  const b7Engine = new DeckChessEngine('4k3/8/8/3N4/3B4/8/8/4K3 w - - 0 1', ['b7_bishops_blessing']);
  const b7Moves = b7Engine.getEmpoweredMoves('d4');
  assert(b7Moves.some(m => m.to === 'c6' && m.extraSquare === 'd5'), 'B7 Bishop\'s Blessing blesses knight to slide to c6');
  const b7Res = b7Engine.makeEmpoweredMove(b7Moves.find(m => m.to === 'c6')!);
  assert(b7Res.success === true, 'B7 Bishop\'s Blessing executed');
  assert(b7Engine.getPiece('c6')?.type === 'n', 'Blessed knight moved to c6');
  assert(b7Engine.getPiece('d4')?.type === 'b', 'Bishop remained at d4');
}

// ==========================================
// Suite 5: Bespoke Rooks Suite (R1–R6)
// ==========================================
console.log('\nSuite 5: Bespoke Rooks Suite (R1–R6)');
{
  // R1: Make Way
  const r1Engine = new DeckChessEngine('4k3/8/8/8/8/8/4P3/4R2K w - - 0 1', ['r1_make_way']);
  const r1Moves = r1Engine.getEmpoweredMoves('e1');
  assert(r1Moves.some(m => m.to === 'e2' && m.extraSquare === 'd2'), 'R1 Make Way offers perpendicular step-aside to d2');
  assert(r1Moves.some(m => m.to === 'e5'), 'R1 Make Way allows Rook to slide along opened file to e5');
  const chosenMove = r1Moves.find(m => m.to === 'e2' && m.extraSquare === 'd2')!;
  const r1Res = r1Engine.makeEmpoweredMove(chosenMove);
  assert(r1Res.success === true, 'R1 Make Way executed');
  assert(r1Engine.getPiece('e2')?.type === 'r', 'Rook moved into e2');
  assert(r1Engine.getPiece('d2')?.type === 'p', 'Pawn stepped aside perpendicularly to d2');

  // R2: I've Got Your Back
  const r2Engine = new DeckChessEngine('4k3/8/8/3p4/R2N4/8/8/4K3 w - - 0 1', ['r2_ive_got_your_back']);
  const r2Moves = r2Engine.getEmpoweredMoves('a4');
  const pushMove = r2Moves.find(m => m.to === 'd4' && m.extraSquare === 'd4');
  assert(Boolean(pushMove), 'R2 I\'ve Got Your Back pushes knight to d5 and rook to d4');
  const r2Res = r2Engine.makeEmpoweredMove(pushMove!);
  assert(r2Res.success === true, 'R2 I\'ve Got Your Back executed');
  assert(r2Engine.getPiece('d4')?.type === 'r', 'Rook took vacated d4');
  assert(r2Engine.getPiece('d5')?.type === 'n', 'Pushed knight captured at d5');

  // R3: Cut Across
  const r3Engine = new DeckChessEngine('4k3/8/8/8/8/8/8/R6K w - - 0 1', ['r3_cut_across']);
  const r3Moves = r3Engine.getEmpoweredMoves('a1');
  assert(r3Moves.some(m => m.to === 'b2'), 'R3 Cut Across allows diagonal step on main diagonal');
  const r3Res = r3Engine.makeEmpoweredMove(r3Moves[0]);
  assert(r3Res.success === true, 'R3 Cut Across executed');
  assert(r3Engine.getPiece('b2')?.type === 'r', 'Rook stepped diagonally to b2');

  // R4: Move in Unison
  const r4Engine = new DeckChessEngine('4k3/8/8/8/8/8/8/R4R1K w - - 0 1', ['r4_move_in_unison']);
  const r4Moves = r4Engine.getEmpoweredMoves('a1');
  assert(r4Moves.some(m => m.to === 'a5' && m.extraSquare === 'f1'), 'R4 Move in Unison moves a1 to a5 and f1 to a1');
  const r4Res = r4Engine.makeEmpoweredMove(r4Moves.find(m => m.to === 'a5')!);
  assert(r4Res.success === true, 'R4 Move in Unison executed');
  assert(r4Engine.getPiece('a5')?.type === 'r', 'Primary rook at a5');
  assert(r4Engine.getPiece('a1')?.type === 'r', 'Paired rook at a1');
  assert(r4Engine.getPiece('f1') === undefined, 'f1 vacated');

  // R5: Catapult
  const r5Engine = new DeckChessEngine('4k3/8/3b4/8/8/8/3N4/3R3K w - - 0 1', ['r5_catapult']);
  const r5Moves = r5Engine.getEmpoweredMoves('d1');
  assert(r5Moves.some(m => m.to === 'd6' && m.extraSquare === 'd2'), 'R5 Catapult launches d2 knight to capture d6 bishop');
  const r5Res = r5Engine.makeEmpoweredMove(r5Moves.find(m => m.to === 'd6')!);
  assert(r5Res.success === true, 'R5 Catapult executed');
  assert(r5Engine.getPiece('d6')?.type === 'n', 'Knight launched to d6');
  assert(r5Engine.getPiece('d1')?.type === 'r', 'Rook stays at d1');
  assert(r5Engine.getPiece('d2') === undefined, 'd2 vacated');

  // R6: Garrison
  const r6Engine = new DeckChessEngine('4k3/8/8/8/8/8/8/3RK3 w - - 0 1', ['r6_garrison']);
  const r6Moves = r6Engine.getEmpoweredMoves('d1');
  assert(r6Moves.some(m => m.to === 'd2'), 'R6 Garrison offers spawning pawn on d2');
  const r6Res = r6Engine.makeEmpoweredMove(r6Moves.find(m => m.to === 'd2')!);
  assert(r6Res.success === true, 'R6 Garrison executed');
  assert(r6Engine.getPiece('d2')?.type === 'p', 'Pawn spawned on d2');
}

// ==========================================
// Suite 6: Bespoke Queens Suite (Q1–Q4)
// ==========================================
console.log('\nSuite 6: Bespoke Queens Suite (Q1–Q4)');
{
  // Q1: Royal Summons
  const q1Engine = new DeckChessEngine('4k3/8/8/3N4/8/8/8/3Q3K w - - 0 1', ['q1_royal_summons']);
  const q1Moves = q1Engine.getEmpoweredMoves('d1');
  assert(q1Moves.some(m => m.to === 'd2' && m.extraSquare === 'd5'), 'Q1 Royal Summons summons knight to d2');
  const q1Res = q1Engine.makeEmpoweredMove(q1Moves.find(m => m.to === 'd2')!);
  assert(q1Res.success === true, 'Q1 Royal Summons executed');
  assert(q1Engine.getPiece('d2')?.type === 'n', 'Summoned knight on d2');
  assert(q1Engine.getPiece('d1')?.type === 'q', 'Queen remains on d1');
  assert(q1Engine.getPiece('d5') === undefined, 'd5 vacated');

  // Q2: The Queen's Gambit
  const q2Engine = new DeckChessEngine('3r1k2/8/8/8/3N4/8/8/3Q3K w - - 0 1', ['q2_the_queens_gambit']);
  const q2Moves = q2Engine.getEmpoweredMoves('d1');
  assert(q2Moves.some(m => m.to === 'd8' && m.extraSquare === 'd4'), 'Q2 Queen\'s Gambit targets attacker d8 sacrificing d4');
  assert(Array.isArray(q2Moves[0].arrows) && q2Moves[0].arrows.length === 2, 'Q2 attaches 2 preview arrows');
  const q2Res = q2Engine.makeEmpoweredMove(q2Moves.find(m => m.to === 'd8')!);
  assert(q2Res.success === true, 'Q2 Queen\'s Gambit executed');
  assert(q2Engine.getPiece('d8')?.type === 'q', 'Queen captured attacking rook at d8');
  assert(q2Engine.getPiece('d4') === undefined, 'Sacrificed knight removed from d4');

  // Q3: Royal Shield
  const q3Engine = new DeckChessEngine('4k3/8/8/8/8/8/3P4/3Q3K w - - 0 1', ['q3_all_rise']);
  const q3Moves = q3Engine.getEmpoweredMoves('d1');
  assert(q3Moves.some(m => m.to === 'd4'), 'Q3 Royal Shield pushes pawn to d4');
  const q3Res = q3Engine.makeEmpoweredMove(q3Moves.find(m => m.to === 'd4')!);
  assert(q3Res.success === true, 'Q3 Royal Shield executed');
  assert(q3Engine.getPiece('d4')?.type === 'p', 'Pawn pushed to d4');
  assert(q3Engine.getPiece('d3')?.type === 'q', 'Queen advanced behind shield to d3');

  // Q4: One Fell Swoop
  const q4Engine = new DeckChessEngine('4k3/8/3p4/3p4/8/3Q4/8/3R3K w - - 0 1', ['q4_one_fell_swoop']);
  const q4Moves = q4Engine.getEmpoweredMoves('d3');
  assert(q4Moves.some(m => m.to === 'd6'), 'Q4 One Fell Swoop sweeps ray to d6');
  const q4Res = q4Engine.makeEmpoweredMove(q4Moves.find(m => m.to === 'd6')!);
  assert(q4Res.success === true, 'Q4 One Fell Swoop executed');
  assert(q4Engine.getPiece('d6')?.type === 'q', 'Queen arrived at d6');
  assert(q4Engine.getGraveyard().b.p === 2, 'Both swept pawns in Black graveyard');
}

// ==========================================
// Suite 7: Bespoke Kings Suite (K1–K4)
// ==========================================
console.log('\nSuite 7: Bespoke Kings Suite (K1–K4)');
{
  // K1: Conscription
  const k1Engine = new DeckChessEngine('4k3/8/8/8/8/8/8/4K3 w - - 0 1', ['k1_conscription']);
  const k1Moves = k1Engine.getEmpoweredMoves('e1');
  assert(k1Moves.some(m => m.actionType === 'spawn'), 'K1 Conscription offers spawning from home back rank');
  const k1Res = k1Engine.makeEmpoweredMove(k1Moves[0]);
  assert(k1Res.success === true, 'K1 Conscription executed');
  assert(k1Engine.getPiece('e1')?.type === 'k', 'King remains on e1');

  // K2: Royal Knighting
  const k2Engine = new DeckChessEngine('4k3/8/8/8/8/8/8/KP6 w - - 0 1', ['k2_royal_knighting']);
  const k2Moves = k2Engine.getEmpoweredMoves('a1');
  assert(k2Moves.some(m => m.to === 'b1'), 'K2 Royal Knighting targets adjacent pawn b1');
  const k2Res = k2Engine.makeEmpoweredMove(k2Moves[0]);
  assert(k2Res.success === true, 'K2 Royal Knighting executed');
  assert(k2Engine.getPiece('b1')?.type === 'n', 'Pawn knighted into Knight at b1');
  assert(k2Engine.getGraveyard().w.p === 1, 'Consolidated pawn in White graveyard');

  // K3: Royal Execution
  const k3Engine = new DeckChessEngine('4k3/8/8/4r3/8/8/4B3/4K3 w - - 0 1', ['k3_royal_execution']);
  const k3Moves = k3Engine.getEmpoweredMoves('e1');
  assert(k3Moves.some(m => m.to === 'e5' && m.extraSquare === 'e2'), 'K3 Royal Execution strikes e5 using bishop e2');
  const k3Res = k3Engine.makeEmpoweredMove(k3Moves.find(m => m.to === 'e5')!);
  assert(k3Res.success === true, 'K3 Royal Execution executed');
  assert(k3Engine.getPiece('e5')?.type === 'b', 'Bishop executed strike to e5');
  assert(k3Engine.getPiece('e1')?.type === 'k', 'King remained at e1');
  assert(k3Engine.getGraveyard().b.r === 1, 'Enemy rook captured');

  // K4: Turncoat
  const k4Engine = new DeckChessEngine('4k3/8/8/8/8/8/4p3/4K3 w - - 0 1', ['k4_banish']);
  const k4Moves = k4Engine.getEmpoweredMoves('e1');
  assert(k4Moves.some(m => m.to === 'e2' && m.actionType === 'in_place'), 'K4 Turncoat converts adjacent enemy pawn on e2');
  const k4Res = k4Engine.makeEmpoweredMove(k4Moves.find(m => m.to === 'e2')!);
  assert(k4Res.success === true, 'K4 Turncoat executed');
  assert(k4Engine.getPiece('e2')?.type === 'p' && k4Engine.getPiece('e2')?.color === 'w', 'Pawn on e2 converted to friendly white pawn');
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
  const promoEngine = new DeckChessEngine('4r2k/4P3/8/8/8/8/8/1K6 w - - 0 1', ['p1_sidestep']);
  const promoMoves = promoEngine.getEmpoweredMoves('e7');
  assert(promoMoves.some(m => m.to === 'd8'), 'P1 Sidestep available onto Rank 8');
  promoEngine.makeEmpoweredMove(promoMoves.find(m => m.to === 'd8')!);
  assert(promoEngine.getPiece('d8')?.type === 'q', 'Pawn promoted to Queen on Rank 8');

  // 3. limitPawnsTo8 toggle
  const limitEngine = new DeckChessEngine('4k3/8/8/8/8/8/PPPPPPPP/4K3 w - - 0 1', ['k1_conscription']);
  limitEngine.limitPawnsTo8 = true;
  assert(limitEngine.canSpawnPawn('w') === false, 'canSpawnPawn returns false when 8 pawns already exist and limitPawnsTo8 is true');
  const conscriptionMovesLimited = limitEngine.getEmpoweredMoves('e1');
  assert(conscriptionMovesLimited.length === 0, 'Conscription rejected when 8 pawns already exist and limit is active');

  limitEngine.limitPawnsTo8 = false;
  assert(limitEngine.canSpawnPawn('w') === true, 'canSpawnPawn returns true when limitPawnsTo8 is false');
  const conscriptionMovesUncapped = limitEngine.getEmpoweredMoves('e1');
  assert(conscriptionMovesUncapped.length > 0, 'Conscription available when limitPawnsTo8 is disabled');
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(` RESULTS: ${passedTests} / ${totalTests} PASSED (${failedTests} FAILED)`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (failedTests > 0) {
  process.exit(1);
}
