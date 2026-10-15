import { getSession, jsonResponse } from './_cookie';

export interface Env {
  DB: D1Database;
}

interface DeckRow {
  id: string;
  user_id: string;
  deck_name: string;
  card_ids_json: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const session = await getSession(context.env.DB, context.request);
    if (!session) {
      return jsonResponse({ success: false, error: 'Unauthenticated' }, 401);
    }

    const { results } = await context.env.DB.prepare(
      `SELECT id, user_id, deck_name, card_ids_json, is_active, created_at, updated_at
       FROM custom_decks
       WHERE user_id = ?
       ORDER BY is_active DESC, updated_at DESC`
    )
      .bind(session.userId)
      .all<DeckRow>();

    const decks = (results || []).map((row) => {
      let cardIds: string[] = [];
      try {
        cardIds = JSON.parse(row.card_ids_json);
      } catch {
        cardIds = [];
      }

      return {
        id: row.id,
        deckName: row.deck_name,
        cardIds,
        isActive: Boolean(row.is_active),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    return jsonResponse({
      success: true,
      decks,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve decks';
    return jsonResponse({ success: false, error: message }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const session = await getSession(context.env.DB, context.request);
    if (!session) {
      return jsonResponse({ success: false, error: 'Unauthenticated' }, 401);
    }

    const body = await context.request.json<{
      id?: string;
      deckName?: string;
      cardIds?: string[];
      isActive?: boolean;
    }>();

    if (!body || typeof body.deckName !== 'string' || !body.deckName.trim()) {
      return jsonResponse({ success: false, error: 'Valid deckName is required' }, 400);
    }

    if (!Array.isArray(body.cardIds) || body.cardIds.length !== 8) {
      return jsonResponse({ success: false, error: 'Deck must contain exactly 8 card IDs' }, 400);
    }

    const deckName = body.deckName.trim();
    const cardIds = body.cardIds;
    const cardIdsJson = JSON.stringify(cardIds);
    const isActive = body.isActive ? 1 : 0;

    // If making this deck active, set other decks for this user to inactive
    if (isActive === 1) {
      await context.env.DB.prepare(
        `UPDATE custom_decks SET is_active = 0, updated_at = datetime('now') WHERE user_id = ?`
      )
        .bind(session.userId)
        .run();
    }

    let deckId = body.id;
    let isUpdate = false;

    if (deckId) {
      const existing = await context.env.DB.prepare(
        `SELECT id FROM custom_decks WHERE id = ? AND user_id = ?`
      )
        .bind(deckId, session.userId)
        .first();

      if (existing) {
        isUpdate = true;
      }
    }

    if (isUpdate && deckId) {
      await context.env.DB.prepare(
        `UPDATE custom_decks
         SET deck_name = ?, card_ids_json = ?, is_active = ?, updated_at = datetime('now')
         WHERE id = ? AND user_id = ?`
      )
        .bind(deckName, cardIdsJson, isActive, deckId, session.userId)
        .run();
    } else {
      deckId = crypto.randomUUID();
      await context.env.DB.prepare(
        `INSERT INTO custom_decks (id, user_id, deck_name, card_ids_json, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      )
        .bind(deckId, session.userId, deckName, cardIdsJson, isActive)
        .run();
    }

    return jsonResponse(
      {
        success: true,
        deck: {
          id: deckId,
          deckName,
          cardIds,
          isActive: Boolean(isActive),
        },
      },
      isUpdate ? 200 : 201
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save deck';
    return jsonResponse({ success: false, error: message }, 500);
  }
};
