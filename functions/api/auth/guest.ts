import { hashToken, generateSessionToken } from '../_crypto';
import { createSessionCookieHeader, jsonResponse } from '../_cookie';

export interface Env {
  DB: D1Database;
}

function generateShortGuestId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const array = new Uint8Array(6);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const userId = crypto.randomUUID();
    const guestUsername = `Guest_${generateShortGuestId()}`;
    const sessionToken = generateSessionToken();
    const tokenHash = await hashToken(sessionToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    await context.env.DB.batch([
      context.env.DB.prepare(
        'INSERT INTO users (id, username, email, password_hash, is_guest) VALUES (?, ?, NULL, NULL, 1)'
      ).bind(userId, guestUsername),
      context.env.DB.prepare(
        'INSERT INTO player_stats (user_id, wins, losses, draws, elo_rating) VALUES (?, 0, 0, 0, 1200)'
      ).bind(userId),
      context.env.DB.prepare(
        'INSERT INTO sessions (token_hash, user_id, is_guest, expires_at) VALUES (?, ?, 1, ?)'
      ).bind(tokenHash, userId, expiresAt),
    ]);

    return jsonResponse(
      {
        success: true,
        user: {
          id: userId,
          username: guestUsername,
          email: null,
          isGuest: true,
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
    const message = err instanceof Error ? err.message : 'Guest registration failed';
    return jsonResponse({ success: false, error: message }, 500);
  }
};
