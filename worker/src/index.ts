import { GameRoomDO } from './GameRoomDO';
import { MatchmakerDO } from './MatchmakerDO';
import type { WorkerEnv } from './types';

export { GameRoomDO, MatchmakerDO };

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);

    // Route /room/:code -> GameRoomDO
    if (url.pathname.startsWith('/room/')) {
      const parts = url.pathname.split('/').filter(Boolean);
      // Expected pathname: /room/<code...>
      const roomCode = (parts[1] || 'ROOM').toUpperCase();
      const id = env.GAME_ROOM.idFromName(roomCode);
      const stub = env.GAME_ROOM.get(id);
      return stub.fetch(request);
    }

    // Route /matchmaking/* -> MatchmakerDO (singleton "global")
    if (url.pathname.startsWith('/matchmaking')) {
      const id = env.MATCHMAKER.idFromName('global');
      const stub = env.MATCHMAKER.get(id);
      return stub.fetch(request);
    }

    return new Response(
      JSON.stringify({
        service: 'wormhole-game-worker',
        status: 'online',
        endpoints: ['/room/:code', '/matchmaking/stats', '/matchmaking/ws'],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  },
};
