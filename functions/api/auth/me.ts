import { hashToken } from '../_crypto';
import { getSessionToken, createClearCookieHeader, jsonResponse } from '../_cookie';

export interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const token = getSessionToken(context.request);
    if (!token) {
      return jsonResponse({ success: false, error: 'Unauthenticated' }, 401);
    }

    const tokenHash = await hashToken(token);

    const row = await context.env.DB.prepare(
      `SELECT 
         s.user_id, s.is_guest AS session_is_guest, s.expires_at,
         u.id, u.username, u.email, u.is_guest AS user_is_guest, u.created_at,
         p.wins, p.losses, p.draws, p.elo_rating
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN player_stats p ON p.user_id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > datetime('now')`
    )
      .bind(tokenHash)
      .first<{
        user_id: string;
        session_is_guest: number;
        expires_at: string;
        id: string;
        username: string;
        email: string | null;
        user_is_guest: number;
        created_at: string;
        wins: number | null;
        losses: number | null;
        draws: number | null;
        elo_rating: number | null;
      }>();

    if (!row) {
      return jsonResponse(
        { success: false, error: 'Session expired or invalid' },
        401,
        { 'Set-Cookie': createClearCookieHeader() }
      );
    }

    const wins = row.wins ?? 0;
    const losses = row.losses ?? 0;
    const draws = row.draws ?? 0;
    const eloRating = row.elo_rating ?? 1200;
    const totalGames = wins + losses + draws;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

    return jsonResponse(
      {
        success: true,
        user: {
          id: row.id,
          username: row.username,
          email: row.email,
          isGuest: Boolean(row.user_is_guest),
          createdAt: row.created_at,
        },
        stats: {
          userId: row.id,
          wins,
          losses,
          draws,
          eloRating,
          totalGames,
          winRate,
        },
      },
      200
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication check failed';
    return jsonResponse({ success: false, error: message }, 500);
  }
};
