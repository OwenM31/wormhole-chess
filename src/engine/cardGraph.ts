import { CardDefinition, PieceAnchor } from '../types/deckChess';
import { CANONICAL_36_CARDS, PIECE_COLOR_THEMES as THEMES_36 } from './cards/releaseRoster36';

export { CANONICAL_36_CARDS };

/**
 * Visual color identities and badges by piece class
 */
export const PIECE_COLOR_THEMES: Record<
  PieceAnchor,
  { color: string; hex: string; badgeIcon: string; label: string }
> = {
  pawn: {
    color: 'pawn-gray',
    hex: '#8A9199',
    badgeIcon: '♟',
    label: 'Pawn Infantry',
  },
  knight: {
    color: 'knight-green',
    hex: '#3FB950',
    badgeIcon: '♞',
    label: 'Knight Cavalry',
  },
  bishop: {
    color: 'bishop-blue',
    hex: '#3B82F6',
    badgeIcon: '♝',
    label: 'Bishop Cleric',
  },
  rook: {
    color: 'rook-purple',
    hex: '#A855F7',
    badgeIcon: '♜',
    label: 'Rook Citadel',
  },
  queen: {
    color: 'queen-red',
    hex: '#EF4444',
    badgeIcon: '♛',
    label: 'Queen Regent',
  },
  king: {
    color: 'king-gold',
    hex: '#D4AF37',
    badgeIcon: '♚',
    label: 'Royal Sovereign',
  },
};

/**
 * 8-Card Curated Starter Deck from the 36-Card Playbook (First 8 Cards: P1, P2, P3, N1, B1, N2, R1, N3)
 */
export const STARTER_DECK: CardDefinition[] = CANONICAL_36_CARDS.slice(0, 8);

export const LEGACY_STARTER_DECK: CardDefinition[] = [
  {
    id: 'pawn_vanguard',
    artId: 'pawn_vanguard_tow',
    name: 'Vanguard Advance',
    anchor: 'pawn',
    energyCost: 1,
    conditions: [{ type: 'UNMOVED' }],
    effects: [{ type: 'EXTEND_RANGE', param: 1 }],
    description: 'An unmoved pawn can advance 3 squares forward on its opening leap instead of 2 (if unobstructed).',
    visualTheme: PIECE_COLOR_THEMES.pawn,
  },
  {
    id: 'pawn_scuttle',
    artId: 'pawn_tactical_retreat',
    name: 'Abandon Ship',
    anchor: 'pawn',
    energyCost: 1,
    conditions: [{ type: 'UNDER_FIRE' }],
    effects: [{ type: 'SCUTTLE' }],
    description: 'Scuttle an attacked pawn off the board to your graveyard before it is taken, denying enemy tempo.',
    visualTheme: PIECE_COLOR_THEMES.pawn,
  },
  {
    id: 'knight_escort',
    artId: 'knight_saddle_carry',
    name: 'Cavalry Escort',
    anchor: 'knight',
    energyCost: 2,
    conditions: [{ type: 'FRIENDLY_ADJACENCY' }],
    effects: [{ type: 'CARRY_PASSENGER' }],
    description: 'Target a friendly adjacent pawn. When the Knight jumps, transport the passenger to the landing square or adjacent flank.',
    visualTheme: PIECE_COLOR_THEMES.knight,
  },
  {
    id: 'knight_swap',
    artId: 'knight_stable_swap',
    name: 'Dislocation Swap',
    anchor: 'knight',
    energyCost: 2,
    conditions: [{ type: 'IN_TERRITORY', param: 'ENEMY_HALF' }],
    effects: [{ type: 'COORDINATE_SWAP' }],
    tradeoff: 'TEMPO_CONCESSION',
    description: 'A knight deep in enemy territory swaps coordinates with any friendly minor piece or pawn.',
    visualTheme: PIECE_COLOR_THEMES.knight,
  },
  {
    id: 'bishop_pierce',
    artId: 'bishop_piercing_ray',
    name: 'Prism Ray',
    anchor: 'bishop',
    energyCost: 3,
    conditions: [{ type: 'LINE_OF_SIGHT_ALIGNMENT' }],
    effects: [{ type: 'PIERCE_CAPTURE', param: 2 }],
    description: 'Bishop fires along a diagonal, capturing an enemy piece and immediately continuing to capture the piece directly behind it.',
    visualTheme: PIECE_COLOR_THEMES.bishop,
  },
  {
    id: 'bishop_invert',
    artId: 'bishop_color_shift',
    name: 'Color Inversion',
    anchor: 'bishop',
    energyCost: 2,
    conditions: [{ type: 'OPEN_LINE' }],
    effects: [{ type: 'VECTOR_GRAFT', param: 'orthogonal_step' }],
    description: 'Shift an active bishop 1 square orthogonally onto an empty square, permanently inverting its diagonal square color.',
    visualTheme: PIECE_COLOR_THEMES.bishop,
  },
  {
    id: 'rook_rampart',
    name: 'Rampart Deploy',
    anchor: 'rook',
    energyCost: 2,
    conditions: [{ type: 'OPEN_LINE' }],
    effects: [{ type: 'DEPLOY_OBSTACLE', param: 2 }],
    description: 'Deploy a holographic barrier along the rook line on an empty square for 2 rounds, blocking line-of-sight and passage.',
    visualTheme: PIECE_COLOR_THEMES.rook,
  },
  {
    id: 'king_decree',
    name: 'Royal Decree',
    anchor: 'king',
    energyCost: 2,
    conditions: [{ type: 'FRIENDLY_ADJACENCY' }],
    effects: [{ type: 'TANDEM_SHIFT' }],
    description: 'The King steps 1 square and an adjacent friendly piece immediately shifts into the square vacated by the King.',
    visualTheme: PIECE_COLOR_THEMES.king,
  },
];

import rawCatalog90 from './cards/cardCatalog90.json';
import rawCatalogMajor90 from './cards/cardCatalogMajor90.json';

/**
 * 90 Canonical Minor Unit Cards (Pawn, Knight, Bishop) adhering to 6x6 taxonomy
 */
export const CANONICAL_90_CARDS: CardDefinition[] = (rawCatalog90 as any[]).map((raw) => ({
  id: raw.id,
  name: raw.name,
  card_name: raw.card_name,
  piece: raw.piece,
  anchor: raw.anchor as PieceAnchor,
  energyCost: raw.energyCost,
  score: raw.score,
  artId: raw.artId || raw.id,
  condition_type: raw.condition_type,
  condition_exact: raw.condition_exact,
  effect_type: raw.effect_type,
  effect_exact: raw.effect_exact,
  conditions: raw.conditions || [],
  effects: raw.effects || [],
  description: raw.description,
  card_description: raw.card_description,
  image_description: raw.image_description,
  visualTheme: PIECE_COLOR_THEMES[raw.anchor as PieceAnchor] || PIECE_COLOR_THEMES.pawn,
}));

/**
 * 90 Canonical Major Unit Cards (Rook, Queen, King) adhering to 6x6 taxonomy
 */
export const CANONICAL_MAJOR_90_CARDS: CardDefinition[] = (rawCatalogMajor90 as any[]).map((raw) => ({
  id: raw.id,
  name: raw.name,
  card_name: raw.card_name,
  piece: raw.piece,
  anchor: raw.anchor as PieceAnchor,
  energyCost: raw.energyCost,
  score: raw.score,
  artId: raw.artId || raw.id,
  condition_type: raw.condition_type,
  condition_exact: raw.condition_exact,
  effect_type: raw.effect_type,
  effect_exact: raw.effect_exact,
  conditions: raw.conditions || [],
  effects: raw.effects || [],
  description: raw.description,
  card_description: raw.card_description,
  image_description: raw.image_description,
  visualTheme: PIECE_COLOR_THEMES[raw.anchor as PieceAnchor] || PIECE_COLOR_THEMES.rook,
}));

/**
 * Full 180 Canonical Cards (90 Minor Units + 90 Major Units)
 */
export const CANONICAL_180_CARDS: CardDefinition[] = [
  ...CANONICAL_90_CARDS,
  ...CANONICAL_MAJOR_90_CARDS,
];

export const LEGACY_EXTRA_CARDS: CardDefinition[] = [
  {
    id: 'queen_aegis',
    name: "Regent's Aegis",
    anchor: 'queen',
    energyCost: 3,
    conditions: [{ type: 'FRIENDLY_ADJACENCY' }],
    effects: [{ type: 'DEPLOY_OBSTACLE', param: { type: 'shield', duration: 2 } }],
    description: 'Grant a kinetic shield to an adjacent piece, protecting it from capture for 2 turns.',
    visualTheme: PIECE_COLOR_THEMES.queen,
  },
  {
    id: 'rook_ironclad',
    name: 'Ironclad Battery',
    anchor: 'rook',
    energyCost: 2,
    conditions: [{ type: 'BATTERY_ALIGNMENT' }],
    effects: [{ type: 'EXTEND_RANGE', param: 'unlimited' }],
    description: 'When aligned in battery with another major piece, this rook pierces through the first friendly obstruction.',
    visualTheme: PIECE_COLOR_THEMES.rook,
  },
  {
    id: 'pawn_reinforce',
    name: 'Conscription Call',
    anchor: 'pawn',
    energyCost: 2,
    conditions: [{ type: 'GRAVEYARD_COUNT', param: 1 }],
    effects: [{ type: 'SPAWN_FROM_GRAVEYARD', param: 'pawn' }],
    description: 'Resurrect a fallen pawn from your graveyard onto any empty square in your home 2nd rank.',
    visualTheme: PIECE_COLOR_THEMES.pawn,
  },
  {
    id: 'knight_outflank',
    name: 'Ghost Steed',
    anchor: 'knight',
    energyCost: 2,
    conditions: [{ type: 'ON_RIM' }],
    effects: [{ type: 'PHASE_THROUGH' }],
    description: 'A knight on the rim can leap through an edge warp directly to the opposing rim file.',
    visualTheme: PIECE_COLOR_THEMES.knight,
  },
];

/**
 * Expanded Card Library for deck customization
 */
export const EXPANDED_LIBRARY: CardDefinition[] = [
  ...CANONICAL_36_CARDS,
  ...LEGACY_STARTER_DECK,
  ...CANONICAL_180_CARDS.filter(
    (c) => !CANONICAL_36_CARDS.some((p) => p.id === c.id) && !LEGACY_EXTRA_CARDS.some((l) => l.id === c.id)
  ),
  ...LEGACY_EXTRA_CARDS.filter((l) => !CANONICAL_36_CARDS.some((p) => p.id === l.id)),
];

/**
 * Get card definition by unique ID (prioritizes Canonical 36-Card Playbook)
 */
export function getCardById(id: string): CardDefinition | undefined {
  const from36 = CANONICAL_36_CARDS.find((c) => c.id === id);
  if (from36) return from36;
  return EXPANDED_LIBRARY.find((c) => c.id === id);
}

/**
 * Filter library cards by piece anchor
 */
export function getCardsByAnchor(anchor?: PieceAnchor): CardDefinition[] {
  if (!anchor) return EXPANDED_LIBRARY;
  return EXPANDED_LIBRARY.filter((c) => c.anchor === anchor);
}

/**
 * Validate that an 8-card deck complies with tournament rules:
 * - Exactly 8 cards
 * - At least 1 pawn card
 * - At least 1 minor piece card (knight or bishop)
 */
export function validateDeckLoadout(deck: CardDefinition[]): {
  isValid: boolean;
  error?: string;
} {
  if (deck.length !== 8) {
    return { isValid: false, error: `Deck must contain exactly 8 cards (currently ${deck.length})` };
  }

  const hasPawn = deck.some((c) => c.anchor === 'pawn');
  if (!hasPawn) {
    return { isValid: false, error: 'Deck must contain at least 1 Pawn card' };
  }

  const hasMinor = deck.some((c) => c.anchor === 'knight' || c.anchor === 'bishop');
  if (!hasMinor) {
    return { isValid: false, error: 'Deck must contain at least 1 Minor piece card (Knight or Bishop)' };
  }

  return { isValid: true };
}
