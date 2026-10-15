export interface Env {
  MATCHMAKER: DurableObjectNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  try {
    const stub = env.MATCHMAKER.get(env.MATCHMAKER.idFromName('global'));
    const targetUrl = new URL(request.url);
    targetUrl.pathname = '/stats';
    return stub.fetch(new Request(targetUrl.toString(), request));
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'Matchmaker unavailable',
        inQueue: { deck_builder: 0, wormhole_3d: 0, total: 0 },
        activeMatches: 0,
        totalOnline: 0,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
