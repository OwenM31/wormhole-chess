import { verifyPassword, hashToken, generateSessionToken } from '../_crypto';
import { createSessionCookieHeader, jsonResponse } from '../_cookie';

export interface Env {
  DB: D1Database;
}

interface LoginBody {
  username?: string;
  password?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json().catch(() => ({}))) as LoginBody;
    const username = body.username?.trim();
    const password = body.password;

    if (!username || !password) {
      return jsonResponse(
        { success: false, error: 'Username and password are required.' },
        400
      );
    }

    const user = await context.env.DB.prepare(
      `SELECT id, username, email, password_hash, is_guest, created_at 
       FROM users 
       WHERE LOWER(username) = LOWER(?)`
    )
      .bind(username)
      .first<{
        id: string;
        username: string;
        email: string | null;
        password_hash: string | null;
        is_guest: number;
        created_at: string;
      }>();

    if (!user || user.is_guest === 1 || !user.password_hash) {
      return jsonResponse(
        { success: false, error: 'Invalid username or password.' },
        401
      );
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return jsonResponse(
        { success: false, error: 'Invalid username or password.' },
        401
      );
    }

    const sessionToken = generateSessionToken();
    const tokenHash = await hashToken(sessionToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await context.env.DB.prepare(
      'INSERT INTO sessions (token_hash, user_id, is_guest, expires_at) VALUES (?, ?, 0, ?)'
    )
      .bind(tokenHash, user.id, expiresAt)
      .run();

    const statsRow = await context.env.DB.prepare(
      'SELECT wins, losses, draws, elo_rating FROM player_stats WHERE user_id = ?'
    )
      .bind(user.id)
      .first<{ wins: number; losses: number; draws: number; elo_rating: number }>();

    const wins = statsRow?.wins ?? 0;
    const losses = statsRow?.losses ?? 0;
    const draws = statsRow?.draws ?? 0;
    const eloRating = statsRow?.elo_rating ?? 1200;
    const totalGames = wins + losses + draws;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

    return jsonResponse(
      {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isGuest: false,
          createdAt: user.created_at,
        },
        stats: {
          userId: user.id,
          wins,
          losses,
          draws,
          eloRating,
          totalGames,
          winRate,
        },
      },
      200,
      { 'Set-Cookie': createSessionCookieHeader(sessionToken) }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    return jsonResponse({ success: false, error: message }, 500);
  }
};
