import fs from 'node:fs';
import path from 'node:path';
import { CANONICAL_36_CARDS } from '../src/engine/cards/releaseRoster36';
import {
  playSingleMatch,
  MatchSpec,
  MatchRecord,
  MatchCardTelemetry,
} from './sim-single-match';

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

export interface WorkerBatchConfig {
  workerId: number;
  specs?: MatchSpec[];
  pairs?: MatchDeckPair[];
  outJsonl?: string;
  resultPath?: string;
}

/**
 * Runs a list of MatchSpecs, writing each MatchRecord to outJsonl immediately upon completion.
 */
export function runMatchSpecs(
  specs: MatchSpec[],
  workerId: number = 0,
  outJsonl?: string
): MatchRecord[] {
  const records: MatchRecord[] = [];
  const total = specs.length;

  if (outJsonl) {
    const dir = path.dirname(outJsonl);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  for (let i = 0; i < total; i++) {
    const spec = specs[i];
    const record = playSingleMatch(spec);
    records.push(record);

    if (outJsonl) {
      fs.appendFileSync(outJsonl, JSON.stringify(record) + '\n', 'utf-8');
    }

    const cardsPlayed = Object.values(record.cardTelemetry || {}).reduce(
      (sum, t) => sum + (t.timesPlayed || 0),
      0
    );

    console.log(
      `[Worker ${workerId}] (${i + 1}/${total}) Match ${spec.matchId}: ${record.winner} won in ${record.plies} plies (${record.finishReason}, ${cardsPlayed} cards played, ${(record.durationMs / 1000).toFixed(1)}s)`
    );
  }

  return records;
}

// Legacy compatibility wrapper
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
  const spec: MatchSpec = {
    matchId: `legacy_${Date.now()}_${Math.random()}`,
    blockId: 0,
    pairId: 'legacy_pair',
    seed: Math.floor(Math.random() * 1000000),
    whiteDeck: pair.whiteDeck,
    blackDeck: pair.blackDeck,
    maxPlies: 100,
    difficulty: 'medium',
  };

  const record = playSingleMatch(spec);
  const cardsPlayed = Object.values(record.cardTelemetry || {}).reduce(
    (sum, t) => sum + (t.timesPlayed || 0),
    0
  );

  const cardTelemetry = Object.values(record.cardTelemetry || {}).map((t) => ({
    cardId: t.cardId,
    turnsHeld: t.turnsHeld,
    turnsConditionMet: t.turnsConditionMet,
    timesPlayed: t.timesPlayed,
    swingSum: t.swingSum,
  }));

  return {
    winner: record.winner,
    plies: record.plies,
    cardsPlayed,
    cardTelemetry,
  };
}

// Legacy batch runner
export function runBatch(pairs: MatchDeckPair[], workerId: number = 0): WorkerBatchResult {
  const specs: MatchSpec[] = pairs.map((p, idx) => ({
    matchId: `legacy_${workerId}_${idx}`,
    blockId: 0,
    pairId: `legacy_${idx}`,
    seed: 100000 + workerId * 1000 + idx,
    whiteDeck: p.whiteDeck,
    blackDeck: p.blackDeck,
    maxPlies: 100,
    difficulty: 'medium',
  }));

  const records = runMatchSpecs(specs, workerId);

  const result: WorkerBatchResult = {
    gamesPlayed: records.length,
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

  for (const r of records) {
    result.totalPlies += r.plies;
    if (r.winner === 'w') result.whiteWins += 1;
    else if (r.winner === 'b') result.blackWins += 1;
    else result.draws += 1;

    for (const cid of r.whiteDeck) {
      if (!result.cardStats[cid]) continue;
      result.cardStats[cid].appearances += 1;
      if (r.winner === 'w') result.cardStats[cid].wins += 1;
      else if (r.winner === 'draw') result.cardStats[cid].draws += 1;
      else result.cardStats[cid].losses += 1;
    }

    for (const cid of r.blackDeck) {
      if (!result.cardStats[cid]) continue;
      result.cardStats[cid].appearances += 1;
      if (r.winner === 'b') result.cardStats[cid].wins += 1;
      else if (r.winner === 'draw') result.cardStats[cid].draws += 1;
      else result.cardStats[cid].losses += 1;
    }

    for (const [cid, t] of Object.entries(r.cardTelemetry || {})) {
      if (result.cardStats[cid]) {
        result.cardStats[cid].turnsHeld += t.turnsHeld;
        result.cardStats[cid].turnsConditionMet += t.turnsConditionMet;
        result.cardStats[cid].timesPlayed += t.timesPlayed;
        result.cardStats[cid].swingSum += t.swingSum;
        result.totalCardsPlayed += t.timesPlayed;
      }
    }
  }

  return result;
}

// CLI execution entrypoint
async function main() {
  const args = process.argv.slice(2);
  let batchPath = '';
  let resultPath = '';
  let outJsonl = '';

  for (const arg of args) {
    if (arg.startsWith('--batch=')) {
      batchPath = arg.replace('--batch=', '');
    } else if (arg.startsWith('--result=')) {
      resultPath = arg.replace('--result=', '');
    } else if (arg.startsWith('--out=')) {
      outJsonl = arg.replace('--out=', '');
    }
  }

  if (!batchPath) {
    console.error('Usage: tsx deck-balance-worker.ts --batch=<path> [--result=<path>] [--out=<path>]');
    process.exit(1);
  }

  const raw = fs.readFileSync(batchPath, 'utf-8');
  const batch = JSON.parse(raw) as WorkerBatchConfig;
  const workerId = batch.workerId ?? 0;
  const targetOutJsonl = outJsonl || batch.outJsonl;
  const targetResultPath = resultPath || batch.resultPath;

  if (batch.specs && batch.specs.length > 0) {
    console.log(`[Worker ${workerId}] Starting ${batch.specs.length} scheduled matches...`);
    const records = runMatchSpecs(batch.specs, workerId, targetOutJsonl);
    if (targetResultPath) {
      fs.writeFileSync(
        targetResultPath,
        JSON.stringify({ workerId, completed: records.length }, null, 2),
        'utf-8'
      );
    }
    console.log(`[Worker ${workerId}] Finished all ${records.length} matches.`);
  } else if (batch.pairs && batch.pairs.length > 0) {
    console.log(`[Worker ${workerId}] Starting legacy batch of ${batch.pairs.length} games...`);
    const result = runBatch(batch.pairs, workerId);
    if (targetResultPath) {
      fs.writeFileSync(targetResultPath, JSON.stringify(result, null, 2), 'utf-8');
    }
    console.log(`[Worker ${workerId}] Finished all ${batch.pairs.length} games.`);
  } else {
    console.log(`[Worker ${workerId}] No matches assigned to this worker.`);
    if (targetResultPath) {
      fs.writeFileSync(targetResultPath, JSON.stringify({ workerId, completed: 0 }, null, 2), 'utf-8');
    }
  }
}

if (process.argv[1]?.includes('deck-balance-worker')) {
  main().catch((err) => {
    console.error('Worker error:', err);
    process.exit(1);
  });
}
