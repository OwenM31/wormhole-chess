import { getSessionToken } from '../_cookie';
import { hashToken } from '../_crypto';

export interface Env {
  DB: D1Database;
  MATCHMAKER: DurableObjectNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

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
    console.error('[MatchmakingProxy] Auth lookup error:', err);
  }

  const reqUrl = new URL(request.url);
  if (!userId) {
    userId = reqUrl.searchParams.get('userId') || `guest_${crypto.randomUUID().slice(0, 8)}`;
    username = reqUrl.searchParams.get('username') || `Guest_${userId.slice(-4)}`;
    isGuest = reqUrl.searchParams.get('isGuest') === 'true' || true;
  }

  const targetUrl = new URL(request.url);
  targetUrl.pathname = '/ws';
  targetUrl.searchParams.set('userId', userId);
  targetUrl.searchParams.set('username', username);
  targetUrl.searchParams.set('isGuest', String(isGuest));

  const stub = env.MATCHMAKER.get(env.MATCHMAKER.idFromName('global'));
  return stub.fetch(new Request(targetUrl.toString(), request));
};
