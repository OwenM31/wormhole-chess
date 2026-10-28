#!/usr/bin/env node
import { spawn } from 'node:child_process';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CANONICAL_36_META = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'canonical36.json'), 'utf-8')
);

const ALL_36_IDS = CANONICAL_36_META.map((c) => c.id);

function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generates stratified color-swapped duplicate match blocks of 18 matches per block
 * (9 pairs x 2 color orientations).
 * Every card appears exactly 8 times per block (4 White, 4 Black against the exact same opposing deck).
 */
export function generateColorSwappedSchedule(
  numBlocks,
  maxPlies = 100,
  difficulty = 'medium'
) {
  const specs = [];

  for (let b = 0; b < numBlocks; b++) {
    // 4 copies of each card = 144 card pool
    const pool144 = shuffle([...ALL_36_IDS, ...ALL_36_IDS, ...ALL_36_IDS, ...ALL_36_IDS]);

    for (let p = 0; p < 9; p++) {
      const whiteDeck = pool144.slice(p * 16, p * 16 + 8);
      const blackDeck = pool144.slice(p * 16 + 8, p * 16 + 16);
      const pairId = `b${b}_p${p}`;
      const seed = 100000 + b * 1000 + p * 2;

      // Match 1: Deck A White, Deck B Black
      specs.push({
        matchId: `${pairId}_w`,
        blockId: b,
        pairId,
        seed,
        whiteDeck: [...whiteDeck],
        blackDeck: [...blackDeck],
        maxPlies,
        difficulty,
      });

      // Match 2: Deck B White, Deck A Black (exact color swap with same seed)
      specs.push({
        matchId: `${pairId}_b`,
        blockId: b,
        pairId,
        seed,
        whiteDeck: [...blackDeck],
        blackDeck: [...whiteDeck],
        maxPlies,
        difficulty,
      });
    }
  }

  return specs;
}

/**
 * Scans matches.jsonl and workers/worker_*.jsonl in the phase directory to find completed match IDs.
 */
function findCompletedMatchIds(phaseDir) {
  const completedIds = new Set();

  const matchesPath = path.join(phaseDir, 'matches.jsonl');
  if (fs.existsSync(matchesPath)) {
    const lines = fs.readFileSync(matchesPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const rec = JSON.parse(trimmed);
        if (rec && rec.matchId) completedIds.add(rec.matchId);
      } catch {}
    }
  }

  const workersDir = path.join(phaseDir, 'workers');
  if (fs.existsSync(workersDir)) {
    const files = fs
      .readdirSync(workersDir)
      .filter((f) => f.startsWith('worker_') && f.endsWith('.jsonl'));
    for (const f of files) {
      const fullPath = path.join(workersDir, f);
      const lines = fs.readFileSync(fullPath, 'utf-8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const rec = JSON.parse(trimmed);
          if (rec && rec.matchId) completedIds.add(rec.matchId);
        } catch {}
      }
    }
  }

  return completedIds;
}

async function main() {
  const args = process.argv.slice(2);
  let requestedGames = 180;
  let outPhase = '8';
  let reset = false;
  let maxPlies = 100;
  let difficulty = 'medium';
  let userWorkers = null;

  for (const arg of args) {
    if (arg.startsWith('--games=')) {
      requestedGames = parseInt(arg.replace('--games=', ''), 10) || requestedGames;
    } else if (arg.startsWith('--phase=')) {
      outPhase = arg.replace('--phase=', '');
    } else if (arg === '--reset') {
      reset = true;
    } else if (arg.startsWith('--maxPlies=')) {
      maxPlies = parseInt(arg.replace('--maxPlies=', ''), 10) || maxPlies;
    } else if (arg.startsWith('--difficulty=')) {
      difficulty = arg.replace('--difficulty=', '');
    } else if (arg.startsWith('--workers=')) {
      userWorkers = parseInt(arg.replace('--workers=', ''), 10);
    }
  }

  const phaseDir = path.resolve(`.agent/state/phases/${outPhase}`);
  const schedulePath = path.join(phaseDir, 'schedule.json');
  const tempDir = path.join(phaseDir, 'temp_batches');
  const workersDir = path.join(phaseDir, 'workers');

  if (reset) {
    console.log(`[Reset] Clearing existing simulation state in ${phaseDir}...`);
    if (fs.existsSync(schedulePath)) fs.unlinkSync(schedulePath);
    const matchesPath = path.join(phaseDir, 'matches.jsonl');
    if (fs.existsSync(matchesPath)) fs.unlinkSync(matchesPath);
    if (fs.existsSync(workersDir)) fs.rmSync(workersDir, { recursive: true, force: true });
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  }

  fs.mkdirSync(phaseDir, { recursive: true });
  fs.mkdirSync(workersDir, { recursive: true });
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  // Load or generate schedule
  let schedule = [];
  if (fs.existsSync(schedulePath)) {
    schedule = JSON.parse(fs.readFileSync(schedulePath, 'utf-8'));
    console.log(`Loaded existing schedule from ${schedulePath} (${schedule.length} matches).`);
  } else {
    // Round requested games up to nearest block of 18 matches
    const numBlocks = Math.max(1, Math.ceil(requestedGames / 18));
    schedule = generateColorSwappedSchedule(numBlocks, maxPlies, difficulty);
    fs.writeFileSync(schedulePath, JSON.stringify(schedule, null, 2), 'utf-8');
    console.log(
      `Generated new schedule: ${schedule.length} matches (${numBlocks} blocks of 18) written to ${schedulePath}.`
    );
  }

  const completedIds = findCompletedMatchIds(phaseDir);
  const remainingSpecs = schedule.filter((s) => !completedIds.has(s.matchId));

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' PHASE 8: COLOR-SWAPPED RESUMABLE TOURNAMENT HARNESS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`Total Schedule:   ${schedule.length} matches`);
  console.log(`Already Completed:${completedIds.size} matches`);
  console.log(`Remaining:        ${remainingSpecs.length} matches`);

  const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

  if (remainingSpecs.length === 0) {
    console.log('\nAll matches in schedule are already completed! Running aggregator...\n');
    await runAggregator(cmd, outPhase);
    return;
  }

  const numCpus = os.cpus().length || 4;
  const numWorkers = Math.min(userWorkers || numCpus, 8, remainingSpecs.length);
  console.log(`Distributing ${remainingSpecs.length} remaining matches across ${numWorkers} worker processes...\n`);

  const specsPerWorker = Math.ceil(remainingSpecs.length / numWorkers);
  const workerScriptPath = 'scripts/deck-balance-worker.ts';
  const startTime = Date.now();
  const workerPromises = [];

  for (let i = 0; i < numWorkers; i++) {
    const slice = remainingSpecs.slice(i * specsPerWorker, (i + 1) * specsPerWorker);
    if (slice.length === 0) continue;

    const batchPath = path.join(tempDir, `batch_${i}.json`);
    const resultPath = path.join(tempDir, `result_${i}.json`);
    const workerJsonlPath = path.join(workersDir, `worker_${i}.jsonl`);

    fs.writeFileSync(
      batchPath,
      JSON.stringify({
        workerId: i,
        specs: slice,
        outJsonl: workerJsonlPath,
        resultPath,
      }),
      'utf-8'
    );

    const p = new Promise((resolve, reject) => {
      const child = spawn(
        cmd,
        ['tsx', workerScriptPath, `--batch=${batchPath}`],
        { stdio: ['inherit', 'pipe', 'inherit'], shell: true }
      );

      child.stdout.on('data', (data) => {
        const text = data.toString();
        process.stdout.write(text);
      });

      child.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker ${i} exited with error code ${code}`));
          return;
        }
        resolve({ workerId: i, completed: slice.length });
      });
    });

    workerPromises.push(p);
  }

  await Promise.all(workerPromises);
  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\nAll worker processes finished in ${elapsedSec}s!`);

  // Consolidate and run aggregator
  await runAggregator(cmd, outPhase);
}

function runAggregator(cmd, outPhase) {
  return new Promise((resolve, reject) => {
    const agg = spawn(
      cmd,
      ['tsx', 'scripts/aggregate-deck-balance.ts', `--phase=${outPhase}`],
      { stdio: 'inherit', shell: true }
    );
    agg.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Aggregator exited with error code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

if (process.argv[1]?.includes('simulate-deck-balance')) {
  main().catch((err) => {
    console.error('Simulation harness error:', err);
    process.exit(1);
  });
}
