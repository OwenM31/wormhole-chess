import { hashToken } from '../_crypto';
import { getSessionToken, createClearCookieHeader, jsonResponse } from '../_cookie';

export interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const token = getSessionToken(context.request);
    if (token) {
      const tokenHash = await hashToken(token);
      await context.env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?')
        .bind(tokenHash)
        .run();
    }

    return jsonResponse(
      { success: true },
      200,
      { 'Set-Cookie': createClearCookieHeader() }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Logout failed';
    return jsonResponse({ success: false, error: message }, 500);
  }
};
