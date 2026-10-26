import fs from 'node:fs';
import path from 'node:path';
import { DeckChessEngine } from '../src/engine/DeckChessEngine';
import { computeBestTurn, evaluateBoard } from '../src/engine/DeckChessAI';
import { CANONICAL_36_CARDS } from '../src/engine/cards/releaseRoster36';

const ALL_36_IDS = CANONICAL_36_CARDS.map((c) => c.id);

export interface MatchDeckPair {
  whiteDeck: string[];
  blackDeck: string[];
}

export interface WorkerRawCardStats {
  appearances: number;
  turnsHeld: number;
  turnsConditionMet: number;
  timesPlayed: number;
  swingSum: number;
  wins: number;
  draws: number;
  losses: number;
}

export interface WorkerBatchResult {
  gamesPlayed: number;
  whiteWins: number;
  blackWins: number;
  draws: number;
  totalPlies: number;
  totalCardsPlayed: number;
  cardStats: Record<string, WorkerRawCardStats>;
}

export function simulateMatch(pair: MatchDeckPair): {
  winner: 'w' | 'b' | 'draw';
  plies: number;
  cardsPlayed: number;
  cardTelemetry: {
    cardId: string;
    turnsHeld: number;
    turnsConditionMet: number;
    timesPlayed: number;
    swingSum: number;
  }[];
} {
  const engine = new DeckChessEngine(undefined, pair.whiteDeck, pair.blackDeck);
  const MAX_PLIES = 42;

  const matchStats: Record<
    string,
    { turnsHeld: number; turnsConditionMet: number; timesPlayed: number; swingSum: number }
  > = {};

  for (const c of [...pair.whiteDeck, ...pair.blackDeck]) {
    if (!matchStats[c]) {
      matchStats[c] = { turnsHeld: 0, turnsConditionMet: 0, timesPlayed: 0, swingSum: 0 };
    }
  }

  let plies = 0;
  let cardsPlayed = 0;

  while (!engine.isGameOver() && plies < MAX_PLIES) {
    const turn = engine.getTurn();
    const hand = engine.getHandForColor(turn);
    const uniqueHand = Array.from(new Set(hand));

    for (const cardId of uniqueHand) {
      if (matchStats[cardId]) {
        matchStats[cardId].turnsHeld += 1;
      }
    }

    const legalEmpowered = engine.getEmpoweredMoves(undefined, true);
    const triggeredCardIds = Array.from(new Set(legalEmpowered.map((m) => m.cardId)));
    for (const cardId of triggeredCardIds) {
      if (matchStats[cardId]) {
        matchStats[cardId].turnsConditionMet += 1;
      }
    }

    // AI move decision with slight random tie-breaking
    const evalBefore = evaluateBoard(engine, turn);
    const decision = computeBestTurn(engine, turn, 'medium');

    if (decision.type === 'empowered' && decision.empoweredMove) {
      const cardId = decision.empoweredMove.cardId;
      const res = engine.makeEmpoweredMove(decision.empoweredMove);
      if (res.success) {
        cardsPlayed += 1;
        const evalAfter = evaluateBoard(engine, turn);
        const swing = evalAfter - evalBefore;
        if (matchStats[cardId]) {
          matchStats[cardId].timesPlayed += 1;
          matchStats[cardId].swingSum += swing;
        }
      }
    } else if (decision.move) {
      engine.makeMove(decision.move);
    } else {
      break;
    }

    plies += 1;
  }

  // Determine winner
  let winner: 'w' | 'b' | 'draw';
  if (engine.isGameOver()) {
    const engWinner = engine.getWinner();
    winner = engWinner === 'w' ? 'w' : engWinner === 'b' ? 'b' : 'draw';
  } else {
    // Adjudicate at MAX_PLIES by material + position
    const evalCp = evaluateBoard(engine, 'w');
    if (evalCp >= 140) {
      winner = 'w';
    } else if (evalCp <= -140) {
      winner = 'b';
    } else {
      winner = 'draw';
    }
  }

  const cardTelemetry = Object.entries(matchStats).map(([cardId, stats]) => ({
    cardId,
    ...stats,
  }));

  return {
    winner,
    plies,
    cardsPlayed,
    cardTelemetry,
  };
}

export function runBatch(pairs: MatchDeckPair[], workerId: number = 0): WorkerBatchResult {
  const result: WorkerBatchResult = {
    gamesPlayed: pairs.length,
    whiteWins: 0,
    blackWins: 0,
    draws: 0,
    totalPlies: 0,
    totalCardsPlayed: 0,
    cardStats: {},
  };

  for (const cardId of ALL_36_IDS) {
    result.cardStats[cardId] = {
      appearances: 0,
      turnsHeld: 0,
      turnsConditionMet: 0,
      timesPlayed: 0,
      swingSum: 0,
      wins: 0,
      draws: 0,
      losses: 0,
    };
  }

  for (let g = 0; g < pairs.length; g++) {
    const pair = pairs[g];

    for (const cardId of pair.whiteDeck) {
      result.cardStats[cardId].appearances += 1;
    }
    for (const cardId of pair.blackDeck) {
      result.cardStats[cardId].appearances += 1;
    }

    const sim = simulateMatch(pair);

    result.totalPlies += sim.plies;
    result.totalCardsPlayed += sim.cardsPlayed;

    if (sim.winner === 'w') result.whiteWins += 1;
    else if (sim.winner === 'b') result.blackWins += 1;
    else result.draws += 1;

    for (const cardId of pair.whiteDeck) {
      if (sim.winner === 'w') result.cardStats[cardId].wins += 1;
      else if (sim.winner === 'draw') result.cardStats[cardId].draws += 1;
      else result.cardStats[cardId].losses += 1;
    }

    for (const cardId of pair.blackDeck) {
      if (sim.winner === 'b') result.cardStats[cardId].wins += 1;
      else if (sim.winner === 'draw') result.cardStats[cardId].draws += 1;
      else result.cardStats[cardId].losses += 1;
    }

    for (const t of sim.cardTelemetry) {
      if (result.cardStats[t.cardId]) {
        result.cardStats[t.cardId].turnsHeld += t.turnsHeld;
        result.cardStats[t.cardId].turnsConditionMet += t.turnsConditionMet;
        result.cardStats[t.cardId].timesPlayed += t.timesPlayed;
        result.cardStats[t.cardId].swingSum += t.swingSum;
      }
    }

    if ((g + 1) % 2 === 0 || g + 1 === pairs.length) {
      console.log(`[Worker ${workerId}] Completed game ${g + 1}/${pairs.length}`);
    }
  }

  return result;
}

// CLI execution entrypoint
async function main() {
  const args = process.argv.slice(2);
  let batchPath = '';
  let resultPath = '';

  for (const arg of args) {
    if (arg.startsWith('--batch=')) {
      batchPath = arg.replace('--batch=', '');
    } else if (arg.startsWith('--result=')) {
      resultPath = arg.replace('--result=', '');
    }
  }

  if (!batchPath || !resultPath) {
    console.error('Usage: tsx deck-balance-worker.ts --batch=<path> --result=<path>');
    process.exit(1);
  }

  const raw = fs.readFileSync(batchPath, 'utf-8');
  const { workerId, pairs } = JSON.parse(raw) as { workerId: number; pairs: MatchDeckPair[] };

  console.log(`[Worker ${workerId}] Starting batch of ${pairs.length} games...`);
  const result = runBatch(pairs, workerId);

  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`[Worker ${workerId}] Finished all ${pairs.length} games. Result written.`);
}

if (process.argv[1]?.includes('deck-balance-worker')) {
  main().catch((err) => {
    console.error('Worker error:', err);
    process.exit(1);
  });
}
