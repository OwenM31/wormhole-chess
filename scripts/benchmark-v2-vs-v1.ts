import { spawn } from 'node:child_process';
import { DeckChessEngine } from '../src/engine/DeckChessEngine';
import {
  computeBestTurn,
  DEFAULT_EVAL_PARAMS,
  EvalParams,
  MATERIAL_VALUES,
  getCardRetentionValue,
} from '../src/engine/DeckChessAI';
import { CANONICAL_36_CARDS } from '../src/engine/cards/releaseRoster36';
import type { PieceColor, EmpoweredMove } from '../src/types/deckChess';
import type { Move } from 'chess.js';

/**
 * Legacy v1 Engine (Baseline before Non-Linear Scarcity, PST fix, Quiescence, and Multi-Ply Card Search)
 */
function evaluateBoardLegacyV1(engine: DeckChessEngine, povColor: PieceColor): number {
  if (engine.inCheck() && engine.isCheckmate()) {
    const winner = engine.getTurn() === 'w' ? 'b' : 'w';
    return winner === povColor ? 100000 : -100000;
  }
  if (
    engine.getPositionRepeatCount() >= 3 ||
    engine.getInternalChess().isInsufficientMaterial()
  ) {
    return 0;
  }

  let whiteScore = 0;
  const board = engine.getBoard();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r][f];
      if (!piece) continue;
      const baseVal = MATERIAL_VALUES[piece.type] || 0;
      if (piece.color === 'w') whiteScore += baseVal;
      else whiteScore -= baseVal;
    }
  }

  for (const cid of engine.getWhiteHand()) whiteScore += getCardRetentionValue(cid);
  for (const cid of engine.getBlackHand()) whiteScore -= getCardRetentionValue(cid);

  return povColor === 'w' ? whiteScore : -whiteScore;
}

function computeTurnLegacyV1(engine: DeckChessEngine, color: PieceColor): {
  type: 'standard' | 'empowered';
  move?: Move;
  empoweredMove?: EmpoweredMove;
} {
  const candidates: Array<{ type: 'standard' | 'empowered'; move?: Move; empoweredMove?: EmpoweredMove }> = [];
  for (const m of engine.getLegalMoves()) {
    candidates.push({ type: 'standard', move: m });
  }
  for (const em of engine.getEmpoweredMoves(undefined, true, false)) {
    candidates.push({ type: 'empowered', empoweredMove: em });
  }

  let bestScore = -Infinity;
  let bestCand = candidates[0];

  for (const cand of candidates) {
    const clone = engine.clone();
    let ok = false;
    if (cand.type === 'standard' && cand.move) {
      ok = clone.makeMove({ from: cand.move.from, to: cand.move.to, promotion: cand.move.promotion }).success;
    } else if (cand.type === 'empowered' && cand.empoweredMove) {
      ok = clone.makeEmpoweredMove(cand.empoweredMove).success;
    }
    if (!ok) continue;

    if (clone.inCheck() && clone.isCheckmate()) return cand;

    let worstReply = Infinity;
    const oppMoves = clone.getLegalMoves();
    if (oppMoves.length === 0) {
      worstReply = evaluateBoardLegacyV1(clone, color);
    } else {
      for (const om of oppMoves) {
        const c2 = clone.clone();
        if (!c2.makeMove({ from: om.from, to: om.to, promotion: om.promotion }).success) continue;
        const sc = evaluateBoardLegacyV1(c2, color);
        if (sc < worstReply) worstReply = sc;
        if (worstReply <= bestScore) break;
      }
    }

    if (worstReply > bestScore) {
      bestScore = worstReply;
      bestCand = cand;
    }
  }

  return bestCand;
}

function sampleDeck(seed: number): string[] {
  const pool = CANONICAL_36_CARDS.map((c) => c.id);
  let s = seed;
  for (let i = pool.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
  return pool.slice(0, 8);
}

function playMatch(
  whiteDeck: string[],
  blackDeck: string[],
  v2Color: PieceColor,
  params: EvalParams = DEFAULT_EVAL_PARAMS,
  maxPlies: number = 42
): { winner: 'v2' | 'v1' | 'draw'; plies: number; v2CardsUsed: number; v1CardsUsed: number; v2AdvCp: number } {
  const engine = new DeckChessEngine(undefined, whiteDeck, blackDeck);
  let plies = 0;
  let v2CardsUsed = 0;
  let v1CardsUsed = 0;

  while (!engine.isGameOver() && plies < maxPlies) {
    const turn = engine.getTurn();
    if (turn === v2Color) {
      const dec = computeBestTurn(engine, turn, 'medium', params);
      if (dec.type === 'empowered' && dec.empoweredMove) {
        engine.makeEmpoweredMove(dec.empoweredMove);
        v2CardsUsed++;
      } else {
        engine.makeMove(dec.move);
      }
    } else {
      const dec = computeTurnLegacyV1(engine, turn);
      if (dec.type === 'empowered' && dec.empoweredMove) {
        engine.makeEmpoweredMove(dec.empoweredMove);
        v1CardsUsed++;
      } else if (dec.move) {
        engine.makeMove({ from: dec.move.from, to: dec.move.to, promotion: dec.move.promotion });
      } else {
        break;
      }
    }
    plies++;
  }

  if (engine.isCheckmate()) {
    const w = engine.getWinner();
    return {
      winner: w === v2Color ? 'v2' : 'v1',
      plies,
      v2CardsUsed,
      v1CardsUsed,
      v2AdvCp: w === v2Color ? 10000 : -10000,
    };
  }

  if (engine.isDraw() || engine.isStalemate()) {
    return { winner: 'draw', plies, v2CardsUsed, v1CardsUsed, v2AdvCp: 0 };
  }

  const v2Score = evaluateBoardLegacyV1(engine, v2Color);
  const winner = v2Score >= 180 ? 'v2' : v2Score <= -180 ? 'v1' : 'draw';
  return { winner, plies, v2CardsUsed, v1CardsUsed, v2AdvCp: v2Score };
}

// Worker mode for single pair execution
const pairArg = process.argv.find((a) => a.startsWith('--pair='));
if (pairArg) {
  const pair = parseInt(pairArg.split('=')[1], 10);
  const deckA = sampleDeck(pair * 101 + 7);
  const deckB = sampleDeck(pair * 313 + 19);
  const g1 = playMatch(deckA, deckB, 'w');
  const g2 = playMatch(deckB, deckA, 'b');
  console.log(JSON.stringify({ pair, g1, g2 }));
  process.exit(0);
}

async function runGauntlet() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' DUPLICATE-DECK HEAD-TO-HEAD GAUNTLET: V2 STRATEGIC VS V1 BASELINE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const DUPLICATE_PAIRS = 8; // 16 duplicate games across 8 parallel worker processes
  const startTime = Date.now();

  const runPairWorker = (pair: number) =>
    new Promise<{
      pair: number;
      g1: ReturnType<typeof playMatch>;
      g2: ReturnType<typeof playMatch>;
    }>((resolve, reject) => {
      const pairStart = Date.now();
      const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      const child = spawn(
        cmd,
        ['tsx', 'scripts/benchmark-v2-vs-v1.ts', `--pair=${pair}`],
        { stdio: ['inherit', 'pipe', 'inherit'], shell: true }
      );
      let out = '';
      child.stdout.on('data', (chunk) => {
        out += chunk.toString();
      });
      child.on('close', (code) => {
        if (code !== 0) return reject(new Error(`Pair ${pair} exited with ${code}`));
        const lines = out.trim().split('\n');
        const parsed = JSON.parse(lines[lines.length - 1]);
        const sec = ((Date.now() - pairStart) / 1000).toFixed(1);
        console.log(
          `  Pair ${String(parsed.pair).padStart(2, ' ')}/${DUPLICATE_PAIRS} (${sec}s): Game1(v2=W)=${parsed.g1.winner.toUpperCase()} (${parsed.g1.plies}p, ${parsed.g1.v2AdvCp > 0 ? '+' : ''}${parsed.g1.v2AdvCp}cp) | Game2(v2=B)=${parsed.g2.winner.toUpperCase()} (${parsed.g2.plies}p, ${parsed.g2.v2AdvCp > 0 ? '+' : ''}${parsed.g2.v2AdvCp}cp)`
        );
        resolve(parsed);
      });
    });

  const results = await Promise.all(
    Array.from({ length: DUPLICATE_PAIRS }, (_, i) => runPairWorker(i + 1))
  );

  let v2Wins = 0;
  let v1Wins = 0;
  let draws = 0;

  for (const { g1, g2 } of results) {
    if (g1.winner === 'v2') v2Wins++;
    else if (g1.winner === 'v1') v1Wins++;
    else draws++;

    if (g2.winner === 'v2') v2Wins++;
    else if (g2.winner === 'v1') v1Wins++;
    else draws++;
  }

  const totalGames = DUPLICATE_PAIRS * 2;
  const scoreRatio = (v2Wins + draws * 0.5) / totalGames;
  const v2ScorePct = (scoreRatio * 100).toFixed(1);
  const eloDelta =
    scoreRatio >= 0.99 ? '+600' : Math.round(-400 * Math.log10(1 / scoreRatio - 1));

  console.log('\n──────────────────────────────────────────────────────────────────');
  console.log(` GAUNTLET RESULTS (${totalGames} Duplicate-Deck Games in ${((Date.now() - startTime) / 1000).toFixed(1)}s)`);
  console.log('──────────────────────────────────────────────────────────────────');
  console.log(`  • V2 Strategic Engine Wins : ${v2Wins} (${((v2Wins / totalGames) * 100).toFixed(1)}%)`);
  console.log(`  • V1 Legacy Baseline Wins  : ${v1Wins} (${((v1Wins / totalGames) * 100).toFixed(1)}%)`);
  console.log(`  • Draws                    : ${draws} (${((draws / totalGames) * 100).toFixed(1)}%)`);
  console.log(`  • V2 Match Score           : ${v2ScorePct}% (Estimated Elo Advantage: ${Number(eloDelta) > 0 ? `+${eloDelta}` : eloDelta} Elo)`);
  console.log('──────────────────────────────────────────────────────────────────\n');

  if (v2Wins <= v1Wins) {
    console.error('❌ FAIL: V2 engine did not outperform V1 baseline!');
    process.exit(1);
  }
}

runGauntlet().catch((e) => {
  console.error(e);
  process.exit(1);
});
