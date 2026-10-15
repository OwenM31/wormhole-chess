import { getSessionToken } from '../_cookie';
import { hashToken } from '../_crypto';

export interface Env {
  DB: D1Database;
  GAME_ROOM: DurableObjectNamespace;
  MATCHMAKER: DurableObjectNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const roomCode = String(params.code || '').trim().toUpperCase();

  if (!roomCode) {
    return new Response(JSON.stringify({ error: 'Room code is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Determine user identity
  let userId = '';
  let username = '';
  let isGuest = true;

  try {
    const token = getSessionToken(request);
    if (token) {
      const tokenHash = await hashToken(token);
      const user = await env.DB.prepare(
        `SELECT u.id, u.username, u.is_guest
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.expires_at > datetime('now')`
      )
        .bind(tokenHash)
        .first<{ id: string; username: string; is_guest: number }>();

      if (user) {
        userId = user.id;
        username = user.username;
        isGuest = user.is_guest === 1;
      }
    }
  } catch (err) {
    console.error('[RoomProxy] Auth lookup error:', err);
  }

  // Fallback to query params or guest generation
  const reqUrl = new URL(request.url);
  if (!userId) {
    userId = reqUrl.searchParams.get('userId') || `guest_${crypto.randomUUID().slice(0, 8)}`;
    username = reqUrl.searchParams.get('username') || `Guest_${userId.slice(-4)}`;
    isGuest = reqUrl.searchParams.get('isGuest') === 'true' || true;
  }

  // Build target URL for Durable Object
  const targetUrl = new URL(request.url);
  targetUrl.searchParams.set('userId', userId);
  targetUrl.searchParams.set('username', username);
  targetUrl.searchParams.set('isGuest', String(isGuest));
  targetUrl.searchParams.set('code', roomCode);

  // Fetch from GameRoomDO stub
  const stubId = env.GAME_ROOM.idFromName(roomCode);
  const stub = env.GAME_ROOM.get(stubId);

  return stub.fetch(new Request(targetUrl.toString(), request));
};
