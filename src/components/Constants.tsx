// Color Palette
export const COLORS = {
  smokeyTaupe: "#8B7E74",
  lodenGreen: "#4C5C4C",
  warmWhite: "#FAF9F6",
  charcoal: "#2F2F2F",
  charcoalLight: "#3A3A3A",
  lodenGreenDark: "#3C493F",
  lodenGreenLight: "#5C6C5C",
  accent: "#D4AF37", // Gold accent for highlights
  red: "#AA4A44",
};

// Team color mapping
export const PLAYER_COLORS: Record<number, string> = {
  1: "white",
  2: "black",
  3: "green",
  4: "brown",
};

export const PIECE_COLORS: Record<string, string> = {
  white: "#ffffff",
  black: "#000000",
  green: "#006400",
  brown: "#c19a6b",
};

export const DEFAULT_PLAYER_COLORS: Record<number, string> = {
  1: "#ffffff",
  2: "#000000",
  3: "#006400",
  4: "#c19a6b",
};

// Global constants
export const PIECE_SPEED = 250; // milliseconds per square

export const BOARD_SIZE = 170;
export const BOARD_MIN = -85;
export const BOARD_MAX = 85;
export const GRID_COUNT = 8;
export const SPACING = BOARD_SIZE / (GRID_COUNT - 1);

export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
export const RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"];

// Wormhole layer definitions
export const OUTER_LAYER_SQUARES = [
  "c3",
  "d3",
  "e3",
  "f3",
  "c4",
  "f4",
  "c5",
  "f5",
  "c6",
  "d6",
  "e6",
  "f6",
];

export const INNER_LAYER_SQUARES = [
  "d4",
  "x1",
  "x2",
  "x3",
  "x4",
  "d5",
  "e5",
  "y4",
  "y3",
  "y2",
  "y1",
  "e4",
];

// Wormhole transformation settings
export const OUTER_LAYER_SCALE = 0.9;
export const INNER_LAYER_SCALE = 0.75;
export const OUTER_LAYER_TILT = Math.PI / 4;
export const INNER_LAYER_TILT = (Math.PI * 5) / 12;

// Pentagonal squares
export const PENTAGONAL_SQUARES = ["c3", "c6", "f3", "f6"];

export const DEFAULT_PIECE_POSITIONS: Record<number, Record<string, string>> = {
  // Player 1 (white)
  1: {
    "player1-rook-a1": "a1",
    "player1-rook-h1": "h1",
    "player1-bishop-c1": "c1",
    "player1-bishop-f1": "f1",
    "player1-knight-b1": "b1",
    "player1-knight-g1": "g1",
    "player1-queen-d1": "d1",
    "player1-king-e1": "e1",
  },
  // Player 2 (black)
  2: {
    "player2-rook-a8": "a8",
    "player2-rook-h8": "h8",
    "player2-bishop-c8": "c8",
    "player2-bishop-f8": "f8",
    "player2-knight-b8": "b8",
    "player2-knight-g8": "g8",
    "player2-queen-d8": "d8",
    "player2-king-e8": "e8",
  },
  // Player 3 (brown) - on bottom layer
  3: {
    "player3-rook-a1'": "a1'",
    "player3-rook-h1'": "h1'",
    "player3-knight-b1'": "b1'",
    "player3-knight-g1'": "g1'",
    "player3-bishop-c1'": "c1'",
    "player3-bishop-f1'": "f1'",
    "player3-queen-d1'": "d1'",
    "player3-king-e1'": "e1'",
  },
  // Player 4 (green) - on bottom layer
  4: {
    "player4-rook-a8'": "a8'",
    "player4-rook-h8'": "h8'",
    "player4-knight-b8'": "b8'",
    "player4-knight-g8'": "g8'",
    "player4-bishop-c8'": "c8'",
    "player4-bishop-f8'": "f8'",
    "player4-queen-d8'": "d8'",
    "player4-king-e8'": "e8'",
  },
};

export const DEFAULT_PAWN_POSITIONS: Record<
  number,
  Record<string, Record<string, string>>
> = {
  1: {
    "player1-pawn-a2": { position: "a2", direction: "N" },
    "player1-pawn-b2": { position: "b2", direction: "N" },
    "player1-pawn-c2": { position: "c2", direction: "N" },
    "player1-pawn-d2": { position: "d2", direction: "N" },
    "player1-pawn-e2": { position: "e2", direction: "N" },
    "player1-pawn-f2": { position: "f2", direction: "N" },
    "player1-pawn-g2": { position: "g2", direction: "N" },
    "player1-pawn-h2": { position: "h2", direction: "N" },
  },
  2: {
    "player2-pawn-a7": { position: "a7", direction: "S" },
    "player2-pawn-b7": { position: "b7", direction: "S" },
    "player2-pawn-c7": { position: "c7", direction: "S" },
    "player2-pawn-d7": { position: "d7", direction: "S" },
    "player2-pawn-e7": { position: "e7", direction: "S" },
    "player2-pawn-f7": { position: "f7", direction: "S" },
    "player2-pawn-g7": { position: "g7", direction: "S" },
    "player2-pawn-h7": { position: "h7", direction: "S" },
  },
  3: {
    "player3-pawn-a2'": { position: "a2'", direction: "N" },
    "player3-pawn-b2'": { position: "b2'", direction: "N" },
    "player3-pawn-c2'": { position: "c2'", direction: "N" },
    "player3-pawn-d2'": { position: "d2'", direction: "N" },
    "player3-pawn-e2'": { position: "e2'", direction: "N" },
    "player3-pawn-f2'": { position: "f2'", direction: "N" },
    "player3-pawn-g2'": { position: "g2'", direction: "N" },
    "player3-pawn-h2'": { position: "h2'", direction: "N" },
  },
  4: {
    "player4-pawn-a7'": { position: "a7'", direction: "S" },
    "player4-pawn-b7'": { position: "b7'", direction: "S" },
    "player4-pawn-c7'": { position: "c7'", direction: "S" },
    "player4-pawn-d7'": { position: "d7'", direction: "S" },
    "player4-pawn-e7'": { position: "e7'", direction: "S" },
    "player4-pawn-f7'": { position: "f7'", direction: "S" },
    "player4-pawn-g7'": { position: "g7'", direction: "S" },
    "player4-pawn-h7'": { position: "h7'", direction: "S" },
  },
};
