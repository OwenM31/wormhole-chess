import fs from 'node:fs';
import path from 'node:path';
import { CANONICAL_36_CARDS } from '../src/engine/cards/releaseRoster36';
import type { MatchRecord } from './sim-single-match';

export interface CardBalanceMetric {
  cardId: string;
  code: string;
  name: string;
  anchor: string;
  world: number;
  appearances: number;
  whiteAppearances: number;
  blackAppearances: number;
  turnsHeld: number;
  turnsConditionMet: number;
  triggerRate: number;
  timesPlayed: number;
  playRate: number;
  avgSwingCp: number;
  avgLiftCp: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  winRateDelta: number;
  ci95: number;
  pairedWinDelta: number;
  marginalCreditDelta: number;
}

export interface TournamentSummary {
  totalMatches: number;
  uniquePairs: number;
  completedPairs: number;
  whiteWins: number;
  blackWins: number;
  draws: number;
  whiteWinRate: number;
  blackWinRate: number;
  drawRate: number;
  avgPlies: number;
  finishBreakdown: {
    checkmate: number;
    mercyAdjudication: number;
    draw: number;
    maxPliesAdjudication: number;
    other: number;
  };
  openingDiversity: {
    unique2Ply: number;
    unique6Ply: number;
  };
}

export interface AggregatedTournamentResult {
  summary: TournamentSummary;
  cards: CardBalanceMetric[];
}

/**
 * Solves a square linear system A * x = b using Gaussian elimination with partial pivoting.
 */
export function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row) => [...row]);
  const x = [...b];

  for (let k = 0; k < n; k++) {
    // Find pivot row
    let maxRow = k;
    let maxVal = Math.abs(M[k][k]);
    for (let r = k + 1; r < n; r++) {
      if (Math.abs(M[r][k]) > maxVal) {
        maxVal = Math.abs(M[r][k]);
        maxRow = r;
      }
    }

    if (maxVal < 1e-12) {
      continue;
    }

    // Swap pivot row
    if (maxRow !== k) {
      const tempRow = M[k];
      M[k] = M[maxRow];
      M[maxRow] = tempRow;
      const tempB = x[k];
      x[k] = x[maxRow];
      x[maxRow] = tempB;
    }

    // Eliminate below
    for (let r = k + 1; r < n; r++) {
      const factor = M[r][k] / M[k][k];
      for (let c = k; c < n; c++) {
        M[r][c] -= factor * M[k][c];
      }
      x[r] -= factor * x[k];
    }
  }

  // Back substitution
  const sol = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let sum = x[r];
    for (let c = r + 1; c < n; c++) {
      sum -= M[r][c] * sol[c];
    }
    sol[r] = Math.abs(M[r][r]) > 1e-12 ? sum / M[r][r] : 0;
  }

  return sol;
}

/**
 * Fits Ridge-Regularized Marginal Win Credit (beta) solving (X^T X + lambda I) * beta = X^T (y - y_bar).
 * Eliminates teammate and opponent confounding while shrinking noise.
 */
export function computeMarginalCredits(
  matches: MatchRecord[],
  allCardIds: string[],
  lambda: number = 8.0
): Record<string, number> {
  const K = allCardIds.length;
  const cardIndexMap = new Map<string, number>();
  allCardIds.forEach((id, idx) => cardIndexMap.set(id, idx));

  if (matches.length === 0) {
    const res: Record<string, number> = {};
    allCardIds.forEach((id) => (res[id] = 0));
    return res;
  }

  // Calculate mean White outcome
  let whiteScoreSum = 0;
  for (const m of matches) {
    const ym = m.winner === 'w' ? 1.0 : m.winner === 'draw' ? 0.5 : 0.0;
    whiteScoreSum += ym;
  }
  const yMean = whiteScoreSum / matches.length;

  // Initialize A = X^T X + lambda * I, b = X^T * (y - y_bar)
  const A: number[][] = Array.from({ length: K }, () => new Array(K).fill(0));
  const b: number[] = new Array(K).fill(0);

  // Add L2 ridge penalty to diagonal
  for (let i = 0; i < K; i++) {
    A[i][i] += lambda;
  }

  for (const m of matches) {
    const ym = m.winner === 'w' ? 1.0 : m.winner === 'draw' ? 0.5 : 0.0;
    const yCent = ym - yMean;

    const wIndices = (m.whiteDeck || [])
      .map((id) => cardIndexMap.get(id))
      .filter((idx): idx is number => idx !== undefined);
    const bIndices = (m.blackDeck || [])
      .map((id) => cardIndexMap.get(id))
      .filter((idx): idx is number => idx !== undefined);

    // Accumulate b vector: White cards get +yCent, Black cards get -yCent
    for (const wi of wIndices) {
      b[wi] += yCent;
    }
    for (const bi of bIndices) {
      b[bi] -= yCent;
    }

    // Accumulate A matrix (outer products)
    // White * White -> +1
    for (const wi of wIndices) {
      for (const wj of wIndices) {
        A[wi][wj] += 1;
      }
    }
    // Black * Black -> +1
    for (const bi of bIndices) {
      for (const bj of bIndices) {
        A[bi][bj] += 1;
      }
    }
    // White * Black -> -1
    for (const wi of wIndices) {
      for (const bj of bIndices) {
        A[wi][bj] -= 1;
        A[bj][wi] -= 1;
      }
    }
  }

  const beta = solveLinearSystem(A, b);
  const credits: Record<string, number> = {};
  allCardIds.forEach((id, idx) => {
    credits[id] = Number(beta[idx].toFixed(4));
  });

  return credits;
}

/**
 * Aggregates a collection of MatchRecords into full tournament summary and per-card balance metrics.
 */
export function aggregateMatchRecords(
  matches: MatchRecord[],
  canonicalCards = CANONICAL_36_CARDS
): AggregatedTournamentResult {
  const allCardIds = canonicalCards.map((c) => c.id);
  const cardMap = new Map(canonicalCards.map((c) => [c.id, c]));

  let whiteWins = 0;
  let blackWins = 0;
  let draws = 0;
  let totalPlies = 0;

  let checkmateCount = 0;
  let mercyCount = 0;
  let drawCount = 0;
  let maxPliesCount = 0;
  let otherCount = 0;

  const opening2PlySet = new Set<string>();
  const opening6PlySet = new Set<string>();

  // Card raw accumulator
  interface RawCardAccum {
    appearances: number;
    whiteAppearances: number;
    blackAppearances: number;
    turnsHeld: number;
    turnsConditionMet: number;
    timesPlayed: number;
    swingSum: number;
    liftSum: number;
    wins: number;
    draws: number;
    losses: number;
  }

  const rawStats = new Map<string, RawCardAccum>();
  for (const cid of allCardIds) {
    rawStats.set(cid, {
      appearances: 0,
      whiteAppearances: 0,
      blackAppearances: 0,
      turnsHeld: 0,
      turnsConditionMet: 0,
      timesPlayed: 0,
      swingSum: 0,
      liftSum: 0,
      wins: 0,
      draws: 0,
      losses: 0,
    });
  }

  // Group matches by pairId to calculate color-swapped paired win rate
  const pairMatchesMap = new Map<string, MatchRecord[]>();

  for (const m of matches) {
    if (m.winner === 'w') whiteWins++;
    else if (m.winner === 'b') blackWins++;
    else draws++;

    totalPlies += m.plies;

    // Termination breakdown
    const reason = m.finishReason?.toLowerCase() || '';
    if (reason.includes('checkmate')) {
      checkmateCount++;
    } else if (reason === 'mercy_adjudication') {
      mercyCount++;
    } else if (
      reason.includes('draw') ||
      reason.includes('stalemate') ||
      reason.includes('repetition') ||
      reason.includes('insufficient')
    ) {
      drawCount++;
    } else if (reason === 'max_plies_adjudication') {
      maxPliesCount++;
    } else {
      otherCount++;
    }

    // Opening diversity
    if (m.openingMoves6 && m.openingMoves6.length >= 2) {
      opening2PlySet.add(m.openingMoves6.slice(0, 2).join(' '));
    }
    if (m.openingMoves6 && m.openingMoves6.length >= 6) {
      opening6PlySet.add(m.openingMoves6.slice(0, 6).join(' '));
    }

    // Accumulate pairs
    if (m.pairId) {
      if (!pairMatchesMap.has(m.pairId)) {
        pairMatchesMap.set(m.pairId, []);
      }
      pairMatchesMap.get(m.pairId)!.push(m);
    }

    // Process White deck
    for (const cid of m.whiteDeck || []) {
      const s = rawStats.get(cid);
      if (s) {
        s.appearances++;
        s.whiteAppearances++;
        if (m.winner === 'w') s.wins++;
        else if (m.winner === 'draw') s.draws++;
        else s.losses++;
      }
    }

    // Process Black deck
    for (const cid of m.blackDeck || []) {
      const s = rawStats.get(cid);
      if (s) {
        s.appearances++;
        s.blackAppearances++;
        if (m.winner === 'b') s.wins++;
        else if (m.winner === 'draw') s.draws++;
        else s.losses++;
      }
    }

    // Process per-card telemetry (turnsHeld, turnsConditionMet, timesPlayed, swingSum, liftSum)
    if (m.cardTelemetry) {
      for (const [cid, telem] of Object.entries(m.cardTelemetry)) {
        const s = rawStats.get(cid);
        if (s) {
          s.turnsHeld += telem.turnsHeld || 0;
          s.turnsConditionMet += telem.turnsConditionMet || 0;
          s.timesPlayed += telem.timesPlayed || 0;
          s.swingSum += telem.swingSum || 0;
          s.liftSum += telem.liftSum || 0;
        }
      }
    }
  }

  // Calculate Color-Cancelled Paired Win Rate
  const pairScoreSum = new Map<string, number>();
  const pairCount = new Map<string, number>();
  for (const cid of allCardIds) {
    pairScoreSum.set(cid, 0);
    pairCount.set(cid, 0);
  }

  let completedPairs = 0;
  for (const [, pMatches] of pairMatchesMap.entries()) {
    if (pMatches.length !== 2) continue;
    const m1 = pMatches[0];
    const m2 = pMatches[1];

    // Find Deck A (White in m1) and Deck B (Black in m1)
    const deckA = new Set(m1.whiteDeck);
    const deckB = new Set(m1.blackDeck);

    // Score for Deck A in m1: w=1, draw=0.5, b=0
    const s1A = m1.winner === 'w' ? 1.0 : m1.winner === 'draw' ? 0.5 : 0.0;

    // Score for Deck A in m2 (where Deck A played as Black, or if decks weren't swapped, as White):
    let s2A = 0.5;
    // Check if m2 had deckA as Black
    const isDeckABlackInM2 = m2.blackDeck.some((c) => deckA.has(c));
    if (isDeckABlackInM2) {
      s2A = m2.winner === 'b' ? 1.0 : m2.winner === 'draw' ? 0.5 : 0.0;
    } else {
      // Deck A was White in m2
      s2A = m2.winner === 'w' ? 1.0 : m2.winner === 'draw' ? 0.5 : 0.0;
    }

    const pairScoreA = (s1A + s2A) / 2.0;
    const pairScoreB = 1.0 - pairScoreA;

    completedPairs++;

    for (const cid of deckA) {
      pairScoreSum.set(cid, (pairScoreSum.get(cid) || 0) + pairScoreA);
      pairCount.set(cid, (pairCount.get(cid) || 0) + 1);
    }
    for (const cid of deckB) {
      pairScoreSum.set(cid, (pairScoreSum.get(cid) || 0) + pairScoreB);
      pairCount.set(cid, (pairCount.get(cid) || 0) + 1);
    }
  }

  // Compute Ridge-Regularized Marginal Credit
  const marginalCredits = computeMarginalCredits(matches, allCardIds, 8.0);

  // Build CardBalanceMetric objects
  const cards: CardBalanceMetric[] = canonicalCards.map((cardDef) => {
    const s = rawStats.get(cardDef.id)!;
    const pCount = pairCount.get(cardDef.id) || 0;
    const pSum = pairScoreSum.get(cardDef.id) || 0;

    const triggerRate = s.turnsHeld > 0 ? s.turnsConditionMet / s.turnsHeld : 0;
    const playRate = s.appearances > 0 ? s.timesPlayed / s.appearances : 0;
    const avgSwingCp = s.timesPlayed > 0 ? Math.round(s.swingSum / s.timesPlayed) : 0;
    const avgLiftCp = s.timesPlayed > 0 ? Math.round(s.liftSum / s.timesPlayed) : 0;
    const winRate = s.appearances > 0 ? (s.wins + 0.5 * s.draws) / s.appearances : 0.5;
    const winRateDelta = winRate - 0.5;
    const ci95 =
      s.appearances > 0
        ? 1.96 * Math.sqrt((winRate * (1 - winRate)) / s.appearances)
        : 0;

    const pairedWinDelta = pCount > 0 ? pSum / pCount - 0.5 : winRateDelta;
    const marginalCreditDelta = marginalCredits[cardDef.id] ?? 0;

    return {
      cardId: cardDef.id,
      code: cardDef.code || '?',
      name: cardDef.name,
      anchor: cardDef.anchor,
      world: cardDef.world || 1,
      appearances: s.appearances,
      whiteAppearances: s.whiteAppearances,
      blackAppearances: s.blackAppearances,
      turnsHeld: s.turnsHeld,
      turnsConditionMet: s.turnsConditionMet,
      triggerRate: Number(triggerRate.toFixed(4)),
      timesPlayed: s.timesPlayed,
      playRate: Number(playRate.toFixed(4)),
      avgSwingCp,
      avgLiftCp,
      wins: s.wins,
      draws: s.draws,
      losses: s.losses,
      winRate: Number(winRate.toFixed(4)),
      winRateDelta: Number(winRateDelta.toFixed(4)),
      ci95: Number(ci95.toFixed(4)),
      pairedWinDelta: Number(pairedWinDelta.toFixed(4)),
      marginalCreditDelta,
    };
  });

  const totalMatches = matches.length;
  const summary: TournamentSummary = {
    totalMatches,
    uniquePairs: pairMatchesMap.size,
    completedPairs,
    whiteWins,
    blackWins,
    draws,
    whiteWinRate: totalMatches > 0 ? Number((whiteWins / totalMatches).toFixed(4)) : 0,
    blackWinRate: totalMatches > 0 ? Number((blackWins / totalMatches).toFixed(4)) : 0,
    drawRate: totalMatches > 0 ? Number((draws / totalMatches).toFixed(4)) : 0,
    avgPlies: totalMatches > 0 ? Number((totalPlies / totalMatches).toFixed(1)) : 0,
    finishBreakdown: {
      checkmate: checkmateCount,
      mercyAdjudication: mercyCount,
      draw: drawCount,
      maxPliesAdjudication: maxPliesCount,
      other: otherCount,
    },
    openingDiversity: {
      unique2Ply: opening2PlySet.size,
      unique6Ply: opening6PlySet.size,
    },
  };

  return { summary, cards };
}

/**
 * Formats markdown BALANCE_REPORT.md string from aggregated results.
 */
export function generateBalanceReportMarkdown(
  result: AggregatedTournamentResult,
  phaseName: string
): string {
  const { summary, cards } = result;
  const now = new Date().toISOString();

  const pct = (n: number, total: number) =>
    total > 0 ? `${((n / total) * 100).toFixed(1)}%` : '0.0%';
  const fmtDelta = (d: number) => (d >= 0 ? `+${(d * 100).toFixed(1)}%` : `${(d * 100).toFixed(1)}%`);

  // Top 10 Strongest & Top 10 Weakest by De-Confounded Marginal Credit
  const sortedByMarginal = [...cards].sort(
    (a, b) => b.marginalCreditDelta - a.marginalCreditDelta
  );
  const top10Strong = sortedByMarginal.slice(0, 10);
  const top10Weak = sortedByMarginal.slice(-10).reverse();

  // Outliers: |marginalCreditDelta| > 0.15 or playRate < 0.05
  const overpowered = cards.filter((c) => c.marginalCreditDelta > 0.15);
  const underpowered = cards.filter((c) => c.marginalCreditDelta < -0.15);
  const deadCards = cards.filter((c) => c.appearances >= 4 && c.playRate < 0.05);

  let md = `# Phase ${phaseName} Balance Simulation & De-Confounded Statistical Report\n\n`;
  md += `> **Generated**: ${now}  \n`;
  md += `> **Total Matches**: ${summary.totalMatches} (${summary.completedPairs} completed color-swapped duplicate pairs)  \n`;
  md += `> **White Win Rate**: ${(summary.whiteWinRate * 100).toFixed(1)}% | **Black Win Rate**: ${(summary.blackWinRate * 100).toFixed(1)}% | **Draw Rate**: ${(summary.drawRate * 100).toFixed(1)}%  \n`;
  md += `> **Average Plies**: ${summary.avgPlies}  \n\n`;

  md += `## 1. Game Termination Breakdown\n\n`;
  md += `| Termination Reason | Count | Share |\n`;
  md += `| :--- | :--- | :--- |\n`;
  md += `| **Checkmate (Natural)** | ${summary.finishBreakdown.checkmate} | ${pct(summary.finishBreakdown.checkmate, summary.totalMatches)} |\n`;
  md += `| **Mercy Adjudication (Pure Eval $\\ge 650$cp)** | ${summary.finishBreakdown.mercyAdjudication} | ${pct(summary.finishBreakdown.mercyAdjudication, summary.totalMatches)} |\n`;
  md += `| **Natural Draw (Stalemate / Repetition)** | ${summary.finishBreakdown.draw} | ${pct(summary.finishBreakdown.draw, summary.totalMatches)} |\n`;
  md += `| **Max Plies Adjudication (Ply 100)** | ${summary.finishBreakdown.maxPliesAdjudication} | ${pct(summary.finishBreakdown.maxPliesAdjudication, summary.totalMatches)} |\n`;
  if (summary.finishBreakdown.other > 0) {
    md += `| **Other** | ${summary.finishBreakdown.other} | ${pct(summary.finishBreakdown.other, summary.totalMatches)} |\n`;
  }
  md += `\n`;

  md += `## 2. Opening Diversity\n\n`;
  md += `- **Unique 2-Ply Openings**: ${summary.openingDiversity.unique2Ply}\n`;
  md += `- **Unique 6-Ply Variations**: ${summary.openingDiversity.unique6Ply}\n\n`;

  md += `## 3. Top 10 Strongest Cards (De-Confounded Ridge Marginal Credit)\n\n`;
  md += `| Code | Card Name | Anchor | Apps | Play% | Avg Lift | Raw Win% | 95% CI | Paired Δ | Marginal Credit Δ |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
  for (const c of top10Strong) {
    md += `| **${c.code}** | ${c.name} | ${c.anchor} | ${c.appearances} | ${(c.playRate * 100).toFixed(1)}% | ${c.avgLiftCp > 0 ? `+${c.avgLiftCp}` : c.avgLiftCp}cp | ${(c.winRate * 100).toFixed(1)}% | ±${(c.ci95 * 100).toFixed(1)}% | ${fmtDelta(c.pairedWinDelta)} | **${fmtDelta(c.marginalCreditDelta)}** |\n`;
  }
  md += `\n`;

  md += `## 4. Top 10 Weakest Cards (De-Confounded Ridge Marginal Credit)\n\n`;
  md += `| Code | Card Name | Anchor | Apps | Play% | Avg Lift | Raw Win% | 95% CI | Paired Δ | Marginal Credit Δ |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
  for (const c of top10Weak) {
    md += `| **${c.code}** | ${c.name} | ${c.anchor} | ${c.appearances} | ${(c.playRate * 100).toFixed(1)}% | ${c.avgLiftCp > 0 ? `+${c.avgLiftCp}` : c.avgLiftCp}cp | ${(c.winRate * 100).toFixed(1)}% | ±${(c.ci95 * 100).toFixed(1)}% | ${fmtDelta(c.pairedWinDelta)} | **${fmtDelta(c.marginalCreditDelta)}** |\n`;
  }
  md += `\n`;

  md += `## 5. Full 36-Card Balance Roster\n\n`;
  md += `| Code | Card Name | Anchor | W | Apps | Trigger% | Play% | Avg Lift | Raw Win% | 95% CI | Paired Δ | Marginal Credit Δ |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
  for (const c of cards) {
    md += `| **${c.code}** | ${c.name} | ${c.anchor} | ${c.world} | ${c.appearances} | ${(c.triggerRate * 100).toFixed(1)}% | ${(c.playRate * 100).toFixed(1)}% | ${c.avgLiftCp > 0 ? `+${c.avgLiftCp}` : c.avgLiftCp}cp | ${(c.winRate * 100).toFixed(1)}% | ±${(c.ci95 * 100).toFixed(1)}% | ${fmtDelta(c.pairedWinDelta)} | ${fmtDelta(c.marginalCreditDelta)} |\n`;
  }
  md += `\n`;

  md += `## 6. Balance & Health Alerts\n\n`;
  if (overpowered.length === 0 && underpowered.length === 0 && deadCards.length === 0) {
    md += `✅ **No extreme outliers detected.** All cards within $\\pm 15\\%$ marginal credit and $>5\\%$ play rate.\n`;
  } else {
    if (overpowered.length > 0) {
      md += `> [!WARNING]\n`;
      md += `> **Overpowered Cards ($\ge +15\\%$ Marginal Credit)**:\n`;
      for (const c of overpowered) {
        md += `> - **${c.code} (${c.name})**: Marginal Credit = ${fmtDelta(c.marginalCreditDelta)}, Play% = ${(c.playRate * 100).toFixed(1)}%\n`;
      }
      md += `\n`;
    }
    if (underpowered.length > 0) {
      md += `> [!WARNING]\n`;
      md += `> **Underpowered Cards ($\le -15\\%$ Marginal Credit)**:\n`;
      for (const c of underpowered) {
        md += `> - **${c.code} (${c.name})**: Marginal Credit = ${fmtDelta(c.marginalCreditDelta)}, Play% = ${(c.playRate * 100).toFixed(1)}%\n`;
      }
      md += `\n`;
    }
    if (deadCards.length > 0) {
      md += `> [!CAUTION]\n`;
      md += `> **Dead / Low-Play Cards ($< 5\\%$ Play Rate)**:\n`;
      for (const c of deadCards) {
        md += `> - **${c.code} (${c.name})**: Play% = ${(c.playRate * 100).toFixed(1)}% across ${c.appearances} appearances (Trigger% = ${(c.triggerRate * 100).toFixed(1)}%)\n`;
      }
      md += `\n`;
    }
  }

  return md;
}

export function readAndConsolidateMatches(phase: string): MatchRecord[] {
  const phaseDir = path.resolve(`.agent/state/phases/${phase}`);
  const matchesPath = path.join(phaseDir, 'matches.jsonl');
  const workersDir = path.join(phaseDir, 'workers');

  const matchMap = new Map<string, MatchRecord>();

  // 1. Read matches.jsonl if present
  if (fs.existsSync(matchesPath)) {
    const lines = fs.readFileSync(matchesPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const record = JSON.parse(trimmed) as MatchRecord;
        if (record && record.matchId) {
          matchMap.set(record.matchId, record);
        }
      } catch {
        // Skip corrupt lines
      }
    }
  }

  // 2. Read worker_*.jsonl if present
  if (fs.existsSync(workersDir)) {
    const workerFiles = fs
      .readdirSync(workersDir)
      .filter((f) => f.startsWith('worker_') && f.endsWith('.jsonl'));
    for (const wf of workerFiles) {
      const fullPath = path.join(workersDir, wf);
      const lines = fs.readFileSync(fullPath, 'utf-8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const record = JSON.parse(trimmed) as MatchRecord;
          if (record && record.matchId) {
            matchMap.set(record.matchId, record);
          }
        } catch {
          // Skip corrupt lines
        }
      }
    }
  }

  const allMatches = Array.from(matchMap.values());

  // Write consolidated deduplicated records back to matches.jsonl
  if (allMatches.length > 0) {
    fs.mkdirSync(phaseDir, { recursive: true });
    const content = allMatches.map((m) => JSON.stringify(m)).join('\n') + '\n';
    fs.writeFileSync(matchesPath, content, 'utf-8');
  }

  return allMatches;
}

export function runAggregation(phase: string): AggregatedTournamentResult {
  const matches = readAndConsolidateMatches(phase);
  console.log(`Loaded and deduplicated ${matches.length} matches for Phase ${phase}.`);

  const result = aggregateMatchRecords(matches);
  const phaseDir = path.resolve(`.agent/state/phases/${phase}`);
  fs.mkdirSync(phaseDir, { recursive: true });

  const metricsPath = path.join(phaseDir, 'balance-metrics.json');
  fs.writeFileSync(metricsPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`Wrote metrics to ${metricsPath}`);

  const reportPath = path.join(phaseDir, 'BALANCE_REPORT.md');
  const reportMd = generateBalanceReportMarkdown(result, phase);
  fs.writeFileSync(reportPath, reportMd, 'utf-8');
  console.log(`Wrote markdown report to ${reportPath}`);

  return result;
}

// CLI entry point
if (process.argv[1] && process.argv[1].includes('aggregate-deck-balance')) {
  const args = process.argv.slice(2);
  const phaseArg = args.find((a) => a.startsWith('--phase='));
  const phase = phaseArg ? phaseArg.split('=')[1] : '8';

  runAggregation(phase);
}
