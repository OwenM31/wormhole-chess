import { BOARD_MIN, SPACING, FILES, RANKS, INNER_LAYER_SQUARES, OUTER_LAYER_SQUARES } from "./Constants";
import { getWormholeSquarePosition } from "./WormholeGeometry";


// ==================== COORDINATE CONVERSION FUNCTIONS ====================

export const gridToWorld = (
  gridX: number,
  gridY: number,
  z: number
): [number, number, number] => {
  const worldX = BOARD_MIN + gridX * SPACING;
  const worldY = BOARD_MIN + gridY * SPACING;
  return [worldX, worldY, z];
};

export const gridToChess = (gridX: number, gridY: number, z: number): string => {
  const file = FILES[gridX];
  const rank = RANKS[gridY];
  const prime = z < 0 ? "'" : "";
  return `${file}${rank}${prime}`;
};

export const chessToGrid = (notation: string): [number, number, number] | null => {
  const isPrime = notation.endsWith("'");
  const cleanNotation = isPrime ? notation.slice(0, -1) : notation;

  if (cleanNotation.startsWith("x") || cleanNotation.startsWith("y")) {
    return null;
  }

  const file = cleanNotation[0];
  const rank = cleanNotation[1];
  const gridX = FILES.indexOf(file);
  const gridY = RANKS.indexOf(rank);
  const z = isPrime ? -27 : 25;

  if (gridX === -1 || gridY === -1) {
    throw new Error(`Invalid chess notation: ${notation}`);
  }
  return [gridX, gridY, z];
};

export const chessToWorld = (notation: string): [number, number, number] => {
  const isPrime = notation.endsWith("'");
  const cleanNotation = notation.replace("'", "");
  const baseZ = isPrime ? -25 : 25;

  if (
    INNER_LAYER_SQUARES.includes(cleanNotation) ||
    OUTER_LAYER_SQUARES.includes(cleanNotation)
  ) {
    return getWormholeSquarePosition(notation, baseZ);
  }

  const gridCoords = chessToGrid(notation);
  if (!gridCoords)
    throw new Error(`Cannot convert ${notation} to world coordinates`);

  const [gridX, gridY, z] = gridCoords;
  let [worldX, worldY, worldZ] = gridToWorld(gridX, gridY, z);

  return [worldX, worldY, worldZ];
};