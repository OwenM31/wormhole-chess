export interface HandDisplayItem {
  cardId: string;
  spent: boolean;
  slotKey: string;
}

/**
 * Pure presentation helper for ordering cards in the player's tactical hand.
 *
 * Rules:
 * 1. Unspent cards appear first, preserving their original relative order from initialDeck.
 * 2. Spent cards shift to the tail of the hand, preserving relative order among spent cards.
 * 3. Count-aware: If 2 copies of P1 are equipped and 1 is played, exactly one copy is unspent
 *    and one is marked spent at the tail.
 * 4. Generates stable, collision-free `slotKey` identifiers for React rendering.
 */
export function buildHandDisplay(
  initialDeck: string[],
  remainingHand: string[]
): HandDisplayItem[] {
  // Count remaining copies for each card
  const remainingCounts = new Map<string, number>();
  for (const cardId of remainingHand) {
    remainingCounts.set(cardId, (remainingCounts.get(cardId) || 0) + 1);
  }

  const unspent: HandDisplayItem[] = [];
  const spent: HandDisplayItem[] = [];
  const cardOccurrence = new Map<string, number>();

  for (const cardId of initialDeck) {
    const occ = (cardOccurrence.get(cardId) || 0) + 1;
    cardOccurrence.set(cardId, occ);
    const slotKey = `${cardId}#${occ}`;

    const count = remainingCounts.get(cardId) || 0;
    if (count > 0) {
      remainingCounts.set(cardId, count - 1);
      unspent.push({ cardId, spent: false, slotKey });
    } else {
      spent.push({ cardId, spent: true, slotKey });
    }
  }

  // Defensive fallback: any cards in remainingHand not accounted for in initialDeck
  for (const [cardId, count] of remainingCounts.entries()) {
    for (let i = 0; i < count; i++) {
      const occ = (cardOccurrence.get(cardId) || 0) + 1;
      cardOccurrence.set(cardId, occ);
      unspent.push({ cardId, spent: false, slotKey: `${cardId}#${occ}` });
    }
  }

  return [...unspent, ...spent];
}
