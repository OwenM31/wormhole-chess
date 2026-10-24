/**
 * Types for Deck Builder Chess (2D Variant)
 *
 * Implements the Compositional Multi-Partite Graph architecture:
 * [Piece Anchor] -> [Conditions] -> [Effects] -> [Gambit Tradeoffs]
 */

export type PieceAnchor = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';

export type PieceColor = 'w' | 'b';

export type Square =
  | 'a1' | 'a2' | 'a3' | 'a4' | 'a5' | 'a6' | 'a7' | 'a8'
  | 'b1' | 'b2' | 'b3' | 'b4' | 'b5' | 'b6' | 'b7' | 'b8'
  | 'c1' | 'c2' | 'c3' | 'c4' | 'c5' | 'c6' | 'c7' | 'c8'
  | 'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6' | 'd7' | 'd8'
  | 'e1' | 'e2' | 'e3' | 'e4' | 'e5' | 'e6' | 'e7' | 'e8'
  | 'f1' | 'f2' | 'f3' | 'f4' | 'f5' | 'f6' | 'f7' | 'f8'
  | 'g1' | 'g2' | 'g3' | 'g4' | 'g5' | 'g6' | 'g7' | 'g8'
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'h7' | 'h8';

// Spatial, Relational, Tactical, and Status condition primitives
export type ConditionPrimitive =
  // Spatial
  | 'IN_CORNER'
  | 'IN_CENTER'
  | 'ON_RIM'
  | 'IN_TERRITORY'
  | 'ON_SPECIFIC_RANK'
  // Relational
  | 'OPPOSING_FACEOFF'
  | 'FRIENDLY_ADJACENCY'
  | 'BATTERY_ALIGNMENT'
  | 'LINE_OF_SIGHT_ALIGNMENT'
  // Tactical
  | 'ACTIVE_FORK'
  | 'UNDER_FIRE'
  | 'OPEN_LINE'
  | 'BLOCKADED'
  // Status
  | 'UNMOVED'
  | 'PINNED'
  | 'GRAVEYARD_COUNT';

// Kinetic, Transformation, and Board-altering effect primitives
export type EffectPrimitive =
  // Movement
  | 'EXTEND_RANGE'
  | 'VECTOR_GRAFT'
  | 'PHASE_THROUGH'
  | 'CARRY_PASSENGER'
  | 'TANDEM_SHIFT'
  | 'COORDINATE_SWAP'
  | 'DRAG_OR_PUSH'
  // Transformation
  | 'PIERCE_CAPTURE'
  | 'HIT_AND_RUN'
  // Spawning / Board
  | 'SPAWN_FROM_GRAVEYARD'
  | 'RECRUIT_DEFECTOR'
  | 'SCUTTLE'
  | 'DEPLOY_OBSTACLE';

// Gambit Tradeoffs
export type GambitTradeoff =
  | 'RECOIL'
  | 'EXHAUST'
  | 'GRAVEYARD_BURN'
  | 'TEMPO_CONCESSION';

export interface CardCondition {
  type: ConditionPrimitive;
  param?: string | number | boolean;
}

export interface CardEffect {
  type: EffectPrimitive;
  param?: string | number | boolean | Record<string, any>;
}

// 6x6 Condition and Effect Grammar Matrix Genres
export type ConditionGenre =
  | 'Position'
  | 'Neighbors'
  | 'Lines'
  | 'Threat'
  | 'Blocked'
  | 'Momentum';

export type EffectGenre =
  | 'New Moves'
  | 'Jump & Leap'
  | 'Move Others'
  | 'Special Captures'
  | 'Walls & Shields'
  | 'Spawning';

export interface CardVisualTheme {
  color: string;
  hex: string;
  badgeIcon: string;
}

export interface CardDefinition {
  id: string;
  name: string;
  card_name?: string;
  piece?: string;
  anchor: PieceAnchor;
  energyCost?: number; // Legacy field (deprecated / zero in v3.0 Playbook)
  score?: number;
  artId?: string;
  code?: string; // e.g. 'P1', 'N1', ..., 'K4'
  world?: number; // 1 to 7
  conditionText?: string;
  effectText?: string;
  condition_type?: ConditionGenre;
  condition_exact?: string;
  effect_type?: EffectGenre;
  effect_exact?: string;
  conditions?: CardCondition[];
  effects?: CardEffect[];
  tradeoff?: GambitTradeoff;
  description: string;
  card_description?: string;
  image_description?: string;
  visualTheme: CardVisualTheme;
}

/**
 * Unified Action Model ("The Card IS the Move"):
 * An EmpoweredMove represents an atomic chess move augmented by a card.
 */
export interface EmpoweredMove {
  from: string;
  to: string;
  cardId: string;
  promotion?: string;
  actionType: 'move' | 'in_place' | 'ranged_capture' | 'spawn' | 'wall' | 'shield';
  metadata?: Record<string, any>;
  extraSquare?: string;
  previewFen?: string;
  disambiguationPrompt?: string;
}

export interface ProfileGear {
  title?: string;
  hat?: string;
  skin?: string;
  badge?: string;
  material?: string;
  headgear?: string;
  base?: string;
}

export interface PlayerProfile {
  id: string;
  name: string;
  level: number;
  gold: number;
  unlockedCards: string[];
  copyLimits: Record<string, number>; // cardId -> allowed copies (1 to 5)
  playtestAll36: boolean;
  handSize: number; // default 8
  equippedHand: string[];
  gear: ProfileGear;
}

export interface BoardModifier {
  id: string;
  type: 'barrier' | 'shield';
  square: string;
  ownerColor: PieceColor;
  turnsRemaining: number;
}

export interface Graveyard {
  p: number;
  n: number;
  b: number;
  r: number;
  q: number;
}

export interface DeckChessCardAction {
  cardId: string;
  anchorSquare: string;
  targetSquare?: string;
  extraSquare?: string;
}

export interface DeckChessMove {
  from: string;
  to: string;
  promotion?: string;
}

export interface DeckChessTurnPayload {
  turnNumber: number;
  playerColor: PieceColor;
  cardAction?: DeckChessCardAction;
  chessMove: DeckChessMove;
  resultingFen: string;
  activeModifiers: BoardModifier[];
}

export type TargetingStage = 'none' | 'pick_anchor' | 'pick_target' | 'pick_secondary';

export type GameFinishReason =
  | 'checkmate'
  | 'stalemate'
  | 'draw'
  | 'resignation'
  | 'timeout'
  | 'insufficient_material';
