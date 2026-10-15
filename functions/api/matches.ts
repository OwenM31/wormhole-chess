import { getSession, jsonResponse } from './_cookie';

export interface Env {
  DB: D1Database;
}

interface MatchRow {
  id: string;
  variant: string;
  white_user_id: string | null;
  white_username: string | null;
  black_user_id: string | null;
  black_username: string | null;
  winner_id: string | null;
  result: string | null;
  moves_pgn: string | null;
  started_at: string;
  ended_at: string | null;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const session = await getSession(context.env.DB, context.request);
    if (!session) {
      return jsonResponse({ success: false, error: 'Unauthenticated' }, 401);
    }

    const url = new URL(context.request.url);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10) || 20));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10) || 0);
    const variant = url.searchParams.get('variant')?.trim() || null;

    let total = 0;
    let rows: MatchRow[] = [];

    if (variant) {
      const countRes = await context.env.DB.prepare(
        `SELECT COUNT(*) AS total FROM matches
         WHERE (white_user_id = ? OR black_user_id = ?) AND variant = ?`
      )
        .bind(session.userId, session.userId, variant)
        .first<{ total: number }>();
      total = countRes?.total ?? 0;

      const queryRes = await context.env.DB.prepare(
        `SELECT 
           m.id, m.variant,
           m.white_user_id, uw.username AS white_username,
           m.black_user_id, ub.username AS black_username,
           m.winner_id, m.result, m.moves_pgn, m.started_at, m.ended_at
         FROM matches m
         LEFT JOIN users uw ON uw.id = m.white_user_id
         LEFT JOIN users ub ON ub.id = m.black_user_id
         WHERE (m.white_user_id = ? OR m.black_user_id = ?) AND m.variant = ?
         ORDER BY m.started_at DESC
         LIMIT ? OFFSET ?`
      )
        .bind(session.userId, session.userId, variant, limit, offset)
        .all<MatchRow>();
      rows = queryRes.results || [];
    } else {
      const countRes = await context.env.DB.prepare(
        `SELECT COUNT(*) AS total FROM matches
         WHERE white_user_id = ? OR black_user_id = ?`
      )
        .bind(session.userId, session.userId)
        .first<{ total: number }>();
      total = countRes?.total ?? 0;

      const queryRes = await context.env.DB.prepare(
        `SELECT 
           m.id, m.variant,
           m.white_user_id, uw.username AS white_username,
           m.black_user_id, ub.username AS black_username,
           m.winner_id, m.result, m.moves_pgn, m.started_at, m.ended_at
         FROM matches m
         LEFT JOIN users uw ON uw.id = m.white_user_id
         LEFT JOIN users ub ON ub.id = m.black_user_id
         WHERE m.white_user_id = ? OR m.black_user_id = ?
         ORDER BY m.started_at DESC
         LIMIT ? OFFSET ?`
      )
        .bind(session.userId, session.userId, limit, offset)
        .all<MatchRow>();
      rows = queryRes.results || [];
    }

    const matches = rows.map((r) => {
      let moves: any[] = [];
      if (r.moves_pgn) {
        try {
          moves = JSON.parse(r.moves_pgn);
        } catch {
          moves = [];
        }
      }

      return {
        id: r.id,
        variant: r.variant,
        whiteUserId: r.white_user_id,
        whiteUsername: r.white_username,
        blackUserId: r.black_user_id,
        blackUsername: r.black_username,
        winnerId: r.winner_id,
        result: r.result,
        moves,
        startedAt: r.started_at,
        endedAt: r.ended_at,
      };
    });

    return jsonResponse({
      success: true,
      matches,
      total,
      limit,
      offset,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to query match history';
    return jsonResponse({ success: false, error: message }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const session = await getSession(context.env.DB, context.request);
    if (!session) {
      return jsonResponse({ success: false, error: 'Unauthenticated' }, 401);
    }

    const body = await context.request.json<{
      variant?: string;
      opponentName?: string;
      result?: string;
      winner?: 'white' | 'black' | 'draw' | null;
      moves?: any[];
      startedAt?: number;
      endedAt?: number;
    }>();

    if (!body || typeof body.variant !== 'string' || !body.variant.trim()) {
      return jsonResponse({ success: false, error: 'Variant is required' }, 400);
    }

    const matchId = crypto.randomUUID();
    const whiteUserId = session.userId;
    const blackUserId = null; // solo or local match
    const winnerId = body.winner === 'white' ? whiteUserId : null;
    const result = body.result || (body.winner === 'white' ? '1-0' : body.winner === 'black' ? '0-1' : body.winner === 'draw' ? '1/2-1/2' : 'unknown');
    const movesJson = JSON.stringify(Array.isArray(body.moves) ? body.moves : []);
    const startedSec = Math.floor((body.startedAt || Date.now()) / 1000);
    const endedSec = Math.floor((body.endedAt || Date.now()) / 1000);

    await context.env.DB.prepare(
      `INSERT INTO matches (id, variant, white_user_id, black_user_id, winner_id, result, moves_pgn, started_at, ended_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime(?, 'unixepoch'), datetime(?, 'unixepoch'))`
    )
      .bind(
        matchId,
        body.variant.trim(),
        whiteUserId,
        blackUserId,
        winnerId,
        result,
        movesJson,
        startedSec,
        endedSec
      )
      .run();

    // Preserve ELO rating integrity (DECISION-008): only increment wins/losses/draws in player_stats, without modifying elo_rating
    if (!session.isGuest) {
      if (body.winner === 'white') {
        await context.env.DB.prepare(
          `INSERT INTO player_stats (user_id, wins, losses, draws, elo_rating, updated_at)
           VALUES (?, 1, 0, 0, 1200, datetime('now'))
           ON CONFLICT(user_id) DO UPDATE SET
             wins = wins + 1,
             updated_at = datetime('now')`
        )
          .bind(session.userId)
          .run();
      } else if (body.winner === 'black') {
        await context.env.DB.prepare(
          `INSERT INTO player_stats (user_id, wins, losses, draws, elo_rating, updated_at)
           VALUES (?, 0, 1, 0, 1200, datetime('now'))
           ON CONFLICT(user_id) DO UPDATE SET
             losses = losses + 1,
             updated_at = datetime('now')`
        )
          .bind(session.userId)
          .run();
      } else if (body.winner === 'draw') {
        await context.env.DB.prepare(
          `INSERT INTO player_stats (user_id, wins, losses, draws, elo_rating, updated_at)
           VALUES (?, 0, 0, 1, 1200, datetime('now'))
           ON CONFLICT(user_id) DO UPDATE SET
             draws = draws + 1,
             updated_at = datetime('now')`
        )
          .bind(session.userId)
          .run();
      }
    }

    return jsonResponse(
      {
        success: true,
        matchId,
      },
      201
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to record match';
    return jsonResponse({ success: false, error: message }, 500);
  }
};
