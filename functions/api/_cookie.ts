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
