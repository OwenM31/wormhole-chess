import { hashToken } from './_crypto';

export interface SessionUser {
  userId: string;
  username: string;
  isGuest: boolean;
}

export async function getSession(db: D1Database, request: Request): Promise<SessionUser | null> {
  const token = getSessionToken(request);
  if (!token) return null;

  const tokenHash = await hashToken(token);
  const row = await db.prepare(
    `SELECT s.user_id, u.username, s.is_guest
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > datetime('now')`
  )
    .bind(tokenHash)
    .first<{ user_id: string; username: string; is_guest: number }>();

  if (!row) return null;

  return {
    userId: row.user_id,
    username: row.username,
    isGuest: Boolean(row.is_guest),
  };
}
export function getSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith('session_token=')) {
      return trimmed.substring('session_token='.length);
    }
  }
  return null;
}

export function createSessionCookieHeader(token: string, maxAgeSeconds = 2592000): string {
  return `session_token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export function createClearCookieHeader(): string {
  return 'session_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}

export function jsonResponse(
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  });
}
