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
};

// Team color mapping
export const TEAM_COLORS = {
  1: "white",
  2: "black",
  3: "white",
  4: "black",
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
