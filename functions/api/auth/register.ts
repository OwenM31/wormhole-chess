import { hashPassword, hashToken, generateSessionToken } from '../_crypto';
import { getSessionToken, createSessionCookieHeader, jsonResponse } from '../_cookie';

export interface Env {
  DB: D1Database;
}

interface RegisterBody {
  username?: string;
  password?: string;
  email?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json().catch(() => ({}))) as RegisterBody;
    const username = body.username?.trim();
    const password = body.password;
    const email = body.email?.trim() || null;

    if (!username || !/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
      return jsonResponse(
        { success: false, error: 'Username must be 3-24 characters (letters, numbers, underscores).' },
        400
      );
    }

    if (!password || password.length < 8) {
      return jsonResponse(
        { success: false, error: 'Password must be at least 8 characters long.' },
        400
      );
    }

    // Check if username is taken
    const existingUser = await context.env.DB.prepare(
      'SELECT id FROM users WHERE LOWER(username) = LOWER(?)'
    )
      .bind(username)
      .first<{ id: string }>();

    if (existingUser) {
      return jsonResponse({ success: false, error: 'Username is already taken.' }, 409);
    }

    const passwordHash = await hashPassword(password);
    const incomingToken = getSessionToken(context.request);

    // Check for guest account upgrade
    if (incomingToken) {
      const incomingHash = await hashToken(incomingToken);
      const guestSession = await context.env.DB.prepare(
        `SELECT s.user_id, s.is_guest, u.created_at
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.expires_at > datetime('now') AND s.is_guest = 1`
      )
        .bind(incomingHash)
        .first<{ user_id: string; is_guest: number; created_at: string }>();

      if (guestSession) {
        const userId = guestSession.user_id;

        await context.env.DB.batch([
          context.env.DB.prepare(
            `UPDATE users 
             SET username = ?, email = ?, password_hash = ?, is_guest = 0, updated_at = datetime('now')
             WHERE id = ?`
          ).bind(username, email, passwordHash, userId),
          context.env.DB.prepare(
            'UPDATE sessions SET is_guest = 0 WHERE token_hash = ?'
          ).bind(incomingHash),
        ]);

        const statsRow = await context.env.DB.prepare(
          'SELECT wins, losses, draws, elo_rating FROM player_stats WHERE user_id = ?'
        )
          .bind(userId)
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
              id: userId,
              username,
              email,
              isGuest: false,
              createdAt: guestSession.created_at,
            },
            stats: {
              userId,
              wins,
              losses,
              draws,
              eloRating,
              totalGames,
              winRate,
            },
          },
          200,
          { 'Set-Cookie': createSessionCookieHeader(incomingToken) }
        );
      }
    }

    // New user registration
    const userId = crypto.randomUUID();
    const sessionToken = generateSessionToken();
    const tokenHash = await hashToken(sessionToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    await context.env.DB.batch([
      context.env.DB.prepare(
        'INSERT INTO users (id, username, email, password_hash, is_guest) VALUES (?, ?, ?, ?, 0)'
      ).bind(userId, username, email, passwordHash),
      context.env.DB.prepare(
        'INSERT INTO player_stats (user_id, wins, losses, draws, elo_rating) VALUES (?, 0, 0, 0, 1200)'
      ).bind(userId),
      context.env.DB.prepare(
        'INSERT INTO sessions (token_hash, user_id, is_guest, expires_at) VALUES (?, ?, 0, ?)'
      ).bind(tokenHash, userId, expiresAt),
    ]);

    return jsonResponse(
      {
        success: true,
        user: {
          id: userId,
          username,
          email,
          isGuest: false,
          createdAt: now,
        },
        stats: {
          userId,
          wins: 0,
          losses: 0,
          draws: 0,
          eloRating: 1200,
          totalGames: 0,
          winRate: 0,
        },
      },
      201,
      { 'Set-Cookie': createSessionCookieHeader(sessionToken) }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    return jsonResponse({ success: false, error: message }, 500);
  }
};
