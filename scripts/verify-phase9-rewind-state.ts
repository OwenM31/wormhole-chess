import { DeckChessEngine, DeckChessEngineState } from '../src/engine/DeckChessEngine';
import { CANONICAL_36_CARDS } from '../src/engine/cards/releaseRoster36';
import {
  PIECE_CARD_COLORS,
  getCardTag,
  groupTurnsIntoRows,
  RecordedTurn,
  TurnRow,
  formatEmpoweredMoveSan,
} from '../src/utils/moveNotation';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  } else {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  }
}

console.log('======================================================');
console.log(' Phase 9 Rewind & Move Stream Contract Verification');
console.log('======================================================\n');

// -----------------------------------------------------------------------------
// Suite 1: Canonical 36-Card Tag Codes & Theme Color Mapping
// -----------------------------------------------------------------------------
console.log('--- Suite 1: Card Codes & Theme Color Mapping ---');

assert(
  CANONICAL_36_CARDS.length === 36,
  `CANONICAL_36_CARDS contains exactly 36 cards (found: ${CANONICAL_36_CARDS.length})`
);

// Check all 36 cards have valid cardCode (P1-P8, N1-N7, B1-B7, R1-R6, Q1-Q4, K1-K4)
let validCodes = 0;
for (const card of CANONICAL_36_CARDS) {
  const tag = getCardTag(card.id);
  if (tag && tag.code === card.code && tag.pieceType === card.anchor) {
    validCodes++;
  }
}
assert(
  validCodes === 36,
  `All 36 cards resolve to accurate card codes and anchor piece types (36/36)`
);

// Verify PIECE_CARD_COLORS contract tokens
assert(PIECE_CARD_COLORS.p === '#8A9199' && PIECE_CARD_COLORS.pawn === '#8A9199', 'Pawn color is #8A9199 (Gray)');
assert(PIECE_CARD_COLORS.n === '#3FB950' && PIECE_CARD_COLORS.knight === '#3FB950', 'Knight color is #3FB950 (Green)');
assert(PIECE_CARD_COLORS.b === '#3B82F6' && PIECE_CARD_COLORS.bishop === '#3B82F6', 'Bishop color is #3B82F6 (Blue)');
assert(PIECE_CARD_COLORS.r === '#A855F7' && PIECE_CARD_COLORS.rook === '#A855F7', 'Rook color is #A855F7 (Purple)');
assert(PIECE_CARD_COLORS.q === '#EF4444' && PIECE_CARD_COLORS.queen === '#EF4444', 'Queen color is #EF4444 (Red)');
assert(PIECE_CARD_COLORS.k === '#D4AF37' && PIECE_CARD_COLORS.king === '#D4AF37', 'King color is #D4AF37 (Gold)');

// Verify tag resolution for representative cards
const p1Tag = getCardTag('p1_sidestep');
assert(p1Tag?.code === 'P1' && p1Tag?.color === '#8A9199', 'p1_sidestep maps to [P1] with #8A9199');

const n1Tag = getCardTag('n1_adrenaline_jump');
assert(n1Tag?.code === 'N1' && n1Tag?.color === '#3FB950', 'n1_adrenaline_jump maps to [N1] with #3FB950');

const b1Tag = getCardTag('b1_let_me_through');
assert(b1Tag?.code === 'B1' && b1Tag?.color === '#3B82F6', 'b1_let_me_through maps to [B1] with #3B82F6');

const r1Tag = getCardTag('r1_make_way');
assert(r1Tag?.code === 'R1' && r1Tag?.color === '#A855F7', 'r1_make_way maps to [R1] with #A855F7');

const q1Tag = getCardTag('q1_royal_summons');
assert(q1Tag?.code === 'Q1' && q1Tag?.color === '#EF4444', 'q1_royal_summons maps to [Q1] with #EF4444');

const k1Tag = getCardTag('k1_conscription');
assert(k1Tag?.code === 'K1' && k1Tag?.color === '#D4AF37', 'k1_conscription maps to [K1] with #D4AF37');

// -----------------------------------------------------------------------------
// Suite 2: SAN Move Generation & Formatting
// -----------------------------------------------------------------------------
console.log('\n--- Suite 2: SAN Move Generation & Formatting ---');

assert(
  formatEmpoweredMoveSan('n', 'b1', 'c3', false) === 'Nc3',
  'formatEmpoweredMoveSan non-capture knight returns Nc3'
);
assert(
  formatEmpoweredMoveSan('n', 'c3', 'd5', true) === 'Nxd5',
  'formatEmpoweredMoveSan capture knight returns Nxd5'
);
assert(
  formatEmpoweredMoveSan('p', 'e2', 'e4', false) === 'e4',
  'formatEmpoweredMoveSan non-capture pawn returns e4'
);
assert(
  formatEmpoweredMoveSan('p', 'e4', 'd5', true) === 'exd5',
  'formatEmpoweredMoveSan capture pawn returns exd5'
);

// -----------------------------------------------------------------------------
// Suite 3: Match Simulation, Snapshots & Read-Only Timeline Scrubber
// -----------------------------------------------------------------------------
console.log('\n--- Suite 3: Match Simulation & Snapshot Captures ---');

const whiteStarter = CANONICAL_36_CARDS.slice(0, 8).map((c) => c.id);
const blackStarter = CANONICAL_36_CARDS.slice(0, 8).map((c) => c.id);

const engine = new DeckChessEngine(undefined, whiteStarter, blackStarter);
const initialStateSnapshot: DeckChessEngineState = JSON.parse(JSON.stringify(engine.getState()));

assert(initialStateSnapshot.turn === 'w', 'Initial snapshot turn is White');
assert(initialStateSnapshot.turnNumber === 1, 'Initial snapshot turnNumber is 1');
assert(initialStateSnapshot.whiteHand.length === 8, 'Initial snapshot whiteHand has 8 cards');
assert(initialStateSnapshot.blackHand.length === 8, 'Initial snapshot blackHand has 8 cards');

const recordedTurns: RecordedTurn[] = [];

// Move 1: White 1. e4
const m1 = engine.makeMove({ from: 'e2', to: 'e4' });
assert(m1.success && m1.move?.san === 'e4', 'Move 1 standard move 1. e4 executed with SAN "e4"');
recordedTurns.push({
  turnNumber: 1,
  player: 'w',
  chessMove: { from: 'e2', to: 'e4' },
  san: m1.move?.san || 'e4',
  fenAfter: engine.getFen(),
  stateSnapshot: JSON.parse(JSON.stringify(engine.getState())),
  timestamp: Date.now(),
});

// Move 2: Black 1... e5
const m2 = engine.makeMove({ from: 'e7', to: 'e5' });
assert(m2.success && m2.move?.san === 'e5', 'Move 2 standard move 1... e5 executed with SAN "e5"');
recordedTurns.push({
  turnNumber: 1,
  player: 'b',
  chessMove: { from: 'e7', to: 'e5' },
  san: m2.move?.san || 'e5',
  fenAfter: engine.getFen(),
  stateSnapshot: JSON.parse(JSON.stringify(engine.getState())),
  timestamp: Date.now(),
});

// Move 3: White 2. Pxe5 with card played (p2_head_on)
const p2Card = whiteStarter.find((c) => c.startsWith('p2')) || 'p2_head_on';
const m3Emp = engine.makeEmpoweredMove({
  cardId: p2Card,
  from: 'e4',
  to: 'e5',
});
assert(m3Emp.success, 'Move 3 empowered move 2. Pxe5 with P2 succeeded');
const p2TagResult = getCardTag(p2Card);
recordedTurns.push({
  turnNumber: 2,
  player: 'w',
  chessMove: { from: 'e4', to: 'e5' },
  cardAction: { cardId: p2Card, anchorSquare: 'e4', targetSquare: 'e5' },
  cardCode: p2TagResult?.code,
  cardPieceType: p2TagResult?.pieceType,
  san: formatEmpoweredMoveSan('p', 'e4', 'e5', true),
  fenAfter: engine.getFen(),
  stateSnapshot: JSON.parse(JSON.stringify(engine.getState())),
  timestamp: Date.now(),
});

// Move 4: Black 2... Nc6
const m4 = engine.makeMove({ from: 'b8', to: 'c6' });
assert(m4.success && m4.move?.san === 'Nc6', 'Move 4 standard move 2... Nc6 executed with SAN "Nc6"');
recordedTurns.push({
  turnNumber: 2,
  player: 'b',
  chessMove: { from: 'b8', to: 'c6' },
  san: m4.move?.san || 'Nc6',
  fenAfter: engine.getFen(),
  stateSnapshot: JSON.parse(JSON.stringify(engine.getState())),
  timestamp: Date.now(),
});

assert(recordedTurns.length === 4, `Recorded turns length is 4 (found: ${recordedTurns.length})`);
assert(recordedTurns[2].cardCode === 'P2', 'Turn 3 has cardCode "P2"');
assert(recordedTurns[2].cardPieceType === 'pawn', 'Turn 3 has cardPieceType "pawn"');
assert(recordedTurns[2].san === 'exd5' || recordedTurns[2].san === 'exe5', 'Turn 3 has valid pawn capture SAN');

// -----------------------------------------------------------------------------
// Suite 4: Timeline Navigation & Boundary Clamping
// -----------------------------------------------------------------------------
console.log('\n--- Suite 4: Timeline Navigation & Boundary Clamping ---');

class TimelineScrubberSimulator {
  private viewIndex: number | null = null; // null = Live

  constructor(
    private turns: RecordedTurn[],
    private initialSnapshot: DeckChessEngineState
  ) {}

  public get activeMoveIndex(): number {
    return this.viewIndex !== null ? this.viewIndex : this.turns.length - 1;
  }

  public get isViewingHistory(): boolean {
    return this.viewIndex !== null && this.viewIndex < this.turns.length - 1;
  }

  public stepBackward(): void {
    const current = this.activeMoveIndex;
    if (current > -1) {
      this.viewIndex = current - 1;
    }
  }

  public stepForward(): void {
    const current = this.activeMoveIndex;
    if (current < this.turns.length - 1) {
      const next = current + 1;
      this.viewIndex = next === this.turns.length - 1 ? null : next;
    }
  }

  public stepToMove(index: number | null): void {
    if (index === null || index >= this.turns.length - 1) {
      this.viewIndex = null;
    } else if (index < -1) {
      this.viewIndex = -1;
    } else {
      this.viewIndex = index;
    }
  }

  public jumpToLive(): void {
    this.viewIndex = null;
  }

  public getDisplayedState(): DeckChessEngineState {
    if (this.viewIndex === -1) {
      return this.initialSnapshot;
    }
    const idx = this.activeMoveIndex;
    if (idx >= 0 && idx < this.turns.length) {
      return this.turns[idx].stateSnapshot;
    }
    return this.turns[this.turns.length - 1].stateSnapshot;
  }
}

const scrubber = new TimelineScrubberSimulator(recordedTurns, initialStateSnapshot);

// Initially Live
assert(!scrubber.isViewingHistory, 'Initially isViewingHistory is false (Live)');
assert(scrubber.activeMoveIndex === 3, 'Initially activeMoveIndex is 3 (latest move)');
assert(scrubber.getDisplayedState().turnNumber === 3, 'Live displayedState turnNumber is 3');

// Step backward to move index 2
scrubber.stepBackward();
assert(scrubber.isViewingHistory, 'After 1 step back, isViewingHistory is true');
assert(scrubber.activeMoveIndex === 2, 'activeMoveIndex is 2');
assert(scrubber.getDisplayedState().whiteHand.length === 7, 'After Move 3 (N1 played), White hand in history snapshot has 7 cards');

// Step backward to move index 1
scrubber.stepBackward();
assert(scrubber.activeMoveIndex === 1, 'activeMoveIndex is 1');
assert(scrubber.getDisplayedState().whiteHand.length === 8, 'Before Move 3, White hand in history snapshot has 8 cards');

// Step backward to move index 0
scrubber.stepBackward();
assert(scrubber.activeMoveIndex === 0, 'activeMoveIndex is 0 (after 1. e4)');

// Step backward to move index -1 (Initial board before Move 1)
scrubber.stepBackward();
assert(scrubber.activeMoveIndex === -1, 'activeMoveIndex is -1 (starting position)');
assert(
  scrubber.getDisplayedState().fen === initialStateSnapshot.fen,
  'Displayed state at index -1 matches starting FEN'
);

// Underflow clamp
scrubber.stepBackward();
assert(scrubber.activeMoveIndex === -1, 'Stepping backward at -1 remains clamped at -1');

// Step forward from -1 to 0
scrubber.stepForward();
assert(scrubber.activeMoveIndex === 0, 'Stepping forward from -1 reaches move 0');

// Step to move 2 directly
scrubber.stepToMove(2);
assert(scrubber.activeMoveIndex === 2, 'stepToMove(2) jumps to move 2');

// Step forward to latest move (3) -> auto-switches to Live (null)
scrubber.stepForward();
assert(!scrubber.isViewingHistory, 'Stepping forward to latest move auto-restores Live mode');
assert(scrubber.activeMoveIndex === 3, 'activeMoveIndex is 3');

// jumpToLive from earlier move
scrubber.stepToMove(0);
assert(scrubber.isViewingHistory, 'Viewing move 0 isViewingHistory is true');
scrubber.jumpToLive();
assert(!scrubber.isViewingHistory, 'jumpToLive() restores Live view');
assert(scrubber.activeMoveIndex === 3, 'Live activeMoveIndex is 3');

// Verify read-only state projection: live engine state was NEVER modified
assert(engine.getTurnNumber() === 3, 'Live engine turnNumber was preserved at 3');
assert(engine.getTurn() === 'w', 'Live engine turn is White');

// -----------------------------------------------------------------------------
// Suite 5: TurnRow 2-Column Desktop Matrix Grouping
// -----------------------------------------------------------------------------
console.log('\n--- Suite 5: TurnRow Desktop 2-Column Grouping ---');

const turnRows: TurnRow[] = groupTurnsIntoRows(recordedTurns);
assert(turnRows.length === 2, `Recorded 4 moves grouped into 2 turn rows (found: ${turnRows.length})`);

assert(turnRows[0].turnNumber === 1, 'Row 0 turnNumber is 1');
assert(turnRows[0].white?.san === 'e4' && turnRows[0].whiteIndex === 0, 'Row 0 white is "e4" at index 0');
assert(turnRows[0].black?.san === 'e5' && turnRows[0].blackIndex === 1, 'Row 0 black is "e5" at index 1');

assert(turnRows[1].turnNumber === 2, 'Row 1 turnNumber is 2');
assert(turnRows[1].white?.cardCode === 'P2', 'Row 1 white is empowered card move with [P2]');
assert(turnRows[1].whiteIndex === 2, 'Row 1 whiteIndex is 2');
assert(turnRows[1].black?.san === 'Nc6' && turnRows[1].blackIndex === 3, 'Row 1 black is "Nc6" at index 3');

// Grouping with an in-progress turn (White only)
const oddTurns: RecordedTurn[] = [...recordedTurns.slice(0, 3)];
const oddRows: TurnRow[] = groupTurnsIntoRows(oddTurns);
assert(oddRows.length === 2, '3 moves form 2 rows');
assert(oddRows[1].white?.cardCode === 'P2', 'Turn 2 white exists with P2');
assert(oddRows[1].black === undefined, 'Turn 2 black is undefined (turn in progress)');
assert(oddRows[1].blackIndex === undefined, 'Turn 2 blackIndex is undefined');

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n======================================================');
console.log(` Summary: ${passed} Passed, ${failed} Failed`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
}
