import React, { Suspense, useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF, Box, Environment } from "@react-three/drei";
import { playMoveSound, playCaptureSound } from "../utils/soundEffects";

import { HexColorPicker } from "react-colorful";

import { GLTF } from "three-stdlib";
import { useSpring, a } from "@react-spring/three";
import * as THREE from "three";
import { Directions, boardGraph } from "./WormholeTopology";
import {
  COLORS,
  PIECE_SPEED,
  PENTAGONAL_SQUARES,
  OUTER_LAYER_SQUARES,
  INNER_LAYER_SQUARES,
  PLAYER_COLORS,
  PIECE_COLORS,
  DEFAULT_PLAYER_COLORS,
  DEFAULT_PAWN_POSITIONS,
  DEFAULT_PIECE_POSITIONS,
} from "./Constants";
import {
  getPieceWormholeRotation,
  getRotationTowardsOrigin,
  getWormholeTransform,
} from "./WormholeGeometry";
import { gridToChess, chessToWorld } from "./CoordinateConversion";

// ===================  3D ANIMATION  ====================

// ==================== 3D COMPONENTS ====================

const ChessboardModel: React.FC = () => {
  const gltf = useGLTF("/chessboard/wormhole-chessboard.glb") as GLTF;
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <primitive object={gltf.scene} />
    </group>
  );
};

const BoardSquare: React.FC<{
  position: [number, number, number];
  notation: string;
  onSquareClick: (position: [number, number, number], notation: string) => void;
  isHighlighted: boolean;
  isPentagonal?: boolean;
}> = ({
  position,
  notation,
  onSquareClick,
  isHighlighted,
  isPentagonal = false,
}) => {
  const transform = getWormholeTransform(notation);
  const rotation = getRotationTowardsOrigin(position, notation, transform.tilt);
  const boxSize = 20 * transform.scale;

  return (
    <Box
      position={position}
      rotation={rotation}
      args={[boxSize, boxSize, 0.5]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSquareClick(position, notation);
      }}
    >
      <meshBasicMaterial
        color={isHighlighted ? "yellow" : isPentagonal ? "orange" : "red"}
        opacity={isHighlighted ? 0.75 : isPentagonal ? 0.05 : 0.05}
        transparent
      />
    </Box>
  );
};

// ==================== UI COMPONENTS ====================

const PlayerColorPicker: React.FC<{
  color: string;
  onChange: (color: string) => void;
}> = ({ color, onChange }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
      }}
    >
      {/* Picker */}
      <HexColorPicker
        color={color}
        onChange={onChange}
        style={{ width: "120px", height: "80px", borderRadius: "8px" }}
      />

      {/* Hex Input */}
      <input
        type="text"
        value={color}
        onChange={(e) => {
          const val = e.target.value;
          // Allow only valid hex colors
          if (/^#([0-9A-Fa-f]{0,6})$/.test(val)) onChange(val);
        }}
        style={{
          width: "70px",
          padding: "4px 6px",
          borderRadius: "6px",
          border: "1px solid #ccc",
          fontFamily: "monospace",
          textTransform: "uppercase",
        }}
      />
    </div>
  );
};

interface MoveLogEntry {
  moveNumber: number;
  piece: string;
  from: string;
  to: string;
  timestamp: Date;
  isWormholeMove?: boolean;
  isCastling?: boolean;
}

const MoveLog: React.FC<{ moves: MoveLogEntry[] }> = ({ moves }) => {
  const moveLogRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (moveLogRef.current) {
      moveLogRef.current.scrollTop = moveLogRef.current.scrollHeight;
    }
  }, [moves]);

  return (
    <div
      style={{
        backgroundColor: COLORS.charcoal,
        borderRadius: "12px",
        padding: "20px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
      }}
    >
      <h2
        style={{
          color: COLORS.warmWhite,
          fontSize: "1.5rem",
          fontWeight: "600",
          marginBottom: "20px",
          borderBottom: `2px solid ${COLORS.lodenGreen}`,
          paddingBottom: "10px",
        }}
      >
        Move History
      </h2>

      <div
        ref={moveLogRef}
        style={{
          flex: 1,
          overflowY: "auto",
          paddingRight: "10px",
        }}
      >
        {moves.length === 0 ? (
          <div
            style={{
              color: COLORS.smokeyTaupe,
              fontStyle: "italic",
              textAlign: "center",
              marginTop: "20px",
            }}
          >
            No moves yet
          </div>
        ) : (
          moves.map((move, index) => (
            <div
              key={index}
              style={{
                backgroundColor:
                  index % 2 === 0 ? COLORS.charcoalLight : "transparent",
                padding: "10px",
                borderRadius: "6px",
                marginBottom: "8px",
                transition: "all 0.3s ease",
                border: `1px solid ${
                  move.isWormholeMove || move.isCastling
                    ? COLORS.accent
                    : "transparent"
                }`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color: COLORS.lodenGreenLight,
                    fontWeight: "600",
                    fontSize: "0.9rem",
                  }}
                >
                  {move.moveNumber}.
                </span>
                <span
                  style={{
                    color: COLORS.warmWhite,
                    fontFamily: "monospace",
                    fontSize: "1rem",
                  }}
                >
                  {move.isCastling
                    ? move.to.startsWith("g")
                      ? "O-O"
                      : "O-O-O"
                    : `${move.from} → ${move.to}`}
                </span>
              </div>
              {move.isWormholeMove && (
                <div
                  style={{
                    color: COLORS.accent,
                    fontSize: "0.75rem",
                    marginTop: "4px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span>🌀</span>
                  <span>Wormhole traversal</span>
                </div>
              )}
              {move.isCastling && (
                <div
                  style={{
                    color: COLORS.accent,
                    fontSize: "0.75rem",
                    marginTop: "4px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span>🏰</span>
                  <span>Castling</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const GameInfo: React.FC<{
  selectedPiece: string | null;
  currentPlayer: 1 | 2 | 3 | 4;
  sandboxMode: boolean;
}> = ({ selectedPiece, currentPlayer, sandboxMode }) => {
  return (
    <div
      style={{
        backgroundColor: COLORS.charcoal,
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "20px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
        }}
      >
        <div>
          {!sandboxMode && (
            <div
              style={{
                color: COLORS.smokeyTaupe,
                fontSize: "0.875rem",
                marginBottom: "4px",
              }}
            >
              Current Turn
            </div>
          )}
          <div
            style={{
              color: COLORS.warmWhite,
              fontSize: "1.25rem",
              fontWeight: "600",
              textTransform: "capitalize",
            }}
          >
            Player {currentPlayer} ({PLAYER_COLORS[currentPlayer]})
          </div>
        </div>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: PIECE_COLORS[PLAYER_COLORS[currentPlayer]],
            border: `3px solid ${COLORS.lodenGreen}`,
          }}
        />
      </div>

      {selectedPiece && (
        <div
          style={{
            backgroundColor: COLORS.lodenGreenDark,
            borderRadius: "8px",
            padding: "10px",
            borderLeft: `4px solid ${COLORS.accent}`,
          }}
        >
          <div
            style={{
              color: COLORS.warmWhite,
              fontSize: "0.875rem",
            }}
          >
            Selected: <strong>{selectedPiece}</strong>
          </div>
        </div>
      )}
    </div>
  );
};

const ControlsInfo: React.FC = () => {
  return (
    <div
      style={{
        backgroundColor: COLORS.charcoal,
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
      }}
    >
      <h3
        style={{
          color: COLORS.warmWhite,
          fontSize: "1.125rem",
          fontWeight: "600",
          marginBottom: "15px",
        }}
      >
        Controls
      </h3>
      <div
        style={{
          color: COLORS.smokeyTaupe,
          fontSize: "0.875rem",
          lineHeight: "1.6",
        }}
      >
        <div style={{ marginBottom: "8px" }}>
          <span style={{ color: COLORS.lodenGreenLight }}>🖱️ Left Click:</span>{" "}
          Select piece / Move
        </div>
        <div style={{ marginBottom: "8px" }}>
          <span style={{ color: COLORS.lodenGreenLight }}>🖱️ Drag:</span> Rotate
          view
        </div>
        <div style={{ marginBottom: "8px" }}>
          <span style={{ color: COLORS.lodenGreenLight }}>🖱️ Scroll:</span> Zoom
          in/out
        </div>
        <div>
          <span style={{ color: COLORS.lodenGreenLight }}>🖱️ Right Drag:</span>{" "}
          Pan camera
        </div>
      </div>
    </div>
  );
};

// ==================== GENERIC PIECE COMPONENT ====================

interface ChessPieceProps {
  id: string;
  player: 1 | 2 | 3 | 4;
  color: string;
  type: string;
  position: [number, number, number];
  notation: string;
  rotation?: [number, number, number];
  isSelected: boolean;
  capturedPiece: string | null;
  onClick: (id: string, notation: string) => void;
}

const ChessPiece: React.FC<ChessPieceProps> = ({
  id,
  player,
  color,
  type,
  position,
  notation,
  rotation = [0, 0, 0],
  isSelected,
  capturedPiece,
  onClick,
}) => {
  const { nodes } = useGLTF("/chessboard/pieces.glb") as any;

  const mesh = nodes[type];
  const cloned = mesh.clone(true);

  cloned.traverse((child: any) => {
    if (child.isMesh) {
      child.material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        metalness: 0.5,
        roughness: 0.3,
      });
    }
  });
  const transform = getWormholeTransform(notation);
  const wormholeRotation = getPieceWormholeRotation(notation);

  const baseRotation: [number, number, number] = [
    Math.PI / 2,
    0,
    notation.includes("'") ? Math.PI : 0,
  ];

  let extraRotation: [number, number, number] = [0, 0, 0];
  if (type === "knight") {
    switch (player) {
      case 1:
        extraRotation = [0, Math.PI / 2, 0];
        break;
      case 2:
        extraRotation = [0, -Math.PI / 2, 0];
        break;
      case 3:
        extraRotation = [0, -Math.PI / 2, 0];
        break;
      case 4:
        extraRotation = [0, Math.PI / 2, 0];
        break;
    }
  } else if (type === "bishop") {
    switch (player) {
      case 1:
        extraRotation = [0, Math.PI, 0];
        break;
      case 2:
        extraRotation = [0, 0, 0];
        break;
      case 3:
        extraRotation = [0, -Math.PI, 0];
        break;
      case 4:
        extraRotation = [0, 0, 0];
        break;
    }
  }

  const finalRotation: [number, number, number] = [
    baseRotation[0] + rotation[0] + wormholeRotation[0] + extraRotation[0],
    baseRotation[1] + rotation[1] + wormholeRotation[1] + extraRotation[1],
    baseRotation[2] + rotation[2] + wormholeRotation[2] + extraRotation[2],
  ];

  const { springPos, springScale, springRot } = useSpring({
    springPos: position,
    springScale: transform.scale,
    springRot: finalRotation,
    config: { mass: 1, tension: 200, friction: 20 },
  });

  return (
    <a.group
      position={springPos}
      scale={springScale}
      rotation={springRot as unknown as [number, number, number]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onClick(id, notation);
      }}
    >
      <primitive object={cloned} scale={[1, 1, 1]} />
      {isSelected && (
        <Box position={[0, 0, 0]} args={[25, 25, 25]}>
          <meshBasicMaterial color="yellow" opacity={0.2} transparent />
        </Box>
      )}
    </a.group>
  );
};

const Queen: React.FC<ChessPieceProps> = (props) => {
  return <ChessPiece {...props} />;
};

const Knight: React.FC<ChessPieceProps> = (props) => {
  return <ChessPiece {...props} />;
};

const Bishop: React.FC<ChessPieceProps> = (props) => {
  return <ChessPiece {...props} />;
};

const Rook: React.FC<ChessPieceProps> = (props) => {
  return <ChessPiece {...props} />;
};

const King: React.FC<ChessPieceProps> = (props) => {
  return <ChessPiece {...props} />;
};

const Pawn: React.FC<ChessPieceProps> = (props) => {
  return <ChessPiece {...props} />;
};

useGLTF.preload("/chessboard/pieces.glb");

//

const ORIGINAL_ORIENTATION = new THREE.Quaternion(); // identity quaternion

// ==================== MAIN COMPONENT ====================

export interface ChessboardSceneProps {
  hideHeaderTitle?: boolean;
  onGameStateChange?: (state: {
    currentPlayer: 1 | 2 | 3 | 4;
    turnCount: number;
    moveCount: number;
  }) => void;
}

const ChessboardScene: React.FC<ChessboardSceneProps> = ({
  hideHeaderTitle = false,
  onGameStateChange,
}) => {
  // Handles the colors for the UI buttons in scene
  const [toggle180, setToggle180] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [quarterRotation, setQuarterRotationCount] = useState(0);


  const [sandboxMode, setSandboxMode] = useState(false);

  const getDefaultPawnPositionsForPlayer = (
    n: number
  ): Record<string, Record<string, string>> => {
    return DEFAULT_PAWN_POSITIONS[n];
  };

  const getDefaultPiecePositionsForPlayer = (
    n: number
  ): Record<string, string> => {
    return DEFAULT_PIECE_POSITIONS[n];
  };

  const [piecePositions, setPiecePositions] = useState<Record<string, string>>({
    ...getDefaultPiecePositionsForPlayer(1),
    ...getDefaultPiecePositionsForPlayer(2),
    ...getDefaultPiecePositionsForPlayer(3),
    ...getDefaultPiecePositionsForPlayer(4),
  });

  const [pawnPositions, setPawnPositions] = useState<
    Record<string, Record<string, string>>
  >({
    ...getDefaultPawnPositionsForPlayer(1),
    ...getDefaultPawnPositionsForPlayer(2),
    ...getDefaultPawnPositionsForPlayer(3),
    ...getDefaultPawnPositionsForPlayer(4),
  });

  const [pawnDirs, setPawnDirs] = useState<Record<string, Direction>>();

  const [enPassantSquare] = useState<string | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
  const [possibleMovePaths, setPossibleMovePaths] = useState<
    Record<string, string[]>
  >({});
  const [, setMovePaths] = useState<Record<string, string[]>>({});
  const [moveHistory, setMoveHistory] = useState<MoveLogEntry[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2 | 3 | 4>(1);
  const [capturedPiece, setCapturedPiece] = useState<string | null>(null);

  const boardSquares = useMemo(() => {
    const squares: {
      position: [number, number, number];
      notation: string;
      key: string;
      isPentagonal: boolean;
    }[] = [];

    for (let x = 0; x <= 7; x++) {
      for (let y = 0; y <= 7; y++) {
        const topNotation = gridToChess(x, y, 25);
        if (
          INNER_LAYER_SQUARES.includes(topNotation) ||
          OUTER_LAYER_SQUARES.includes(topNotation)
        ) {
          continue;
        }

        const topPos = chessToWorld(topNotation);
        const isPentTop = PENTAGONAL_SQUARES.includes(topNotation);

        squares.push({
          position: topPos,
          notation: topNotation,
          key: `top-${x}-${y}`,
          isPentagonal: isPentTop,
        });

        const bottomNotation = gridToChess(x, y, -25);
        const bottomPos = chessToWorld(bottomNotation);
        const isPentBottom = PENTAGONAL_SQUARES.includes(
          bottomNotation.replace("'", "")
        );

        squares.push({
          position: bottomPos,
          notation: bottomNotation,
          key: `bottom-${x}-${y}`,
          isPentagonal: isPentBottom,
        });
      }
    }

    INNER_LAYER_SQUARES.forEach((sq) => {
      const topPos = chessToWorld(sq);
      const bottomPos = chessToWorld(`${sq}'`);

      squares.push({
        position: topPos,
        notation: sq,
        key: `special-${sq}`,
        isPentagonal: false,
      });

      squares.push({
        position: bottomPos,
        notation: `${sq}'`,
        key: `special-${sq}'`,
        isPentagonal: false,
      });
    });

    OUTER_LAYER_SQUARES.forEach((sq) => {
      const topPos = chessToWorld(sq);
      const bottomPos = chessToWorld(`${sq}'`);

      squares.push({
        position: topPos,
        notation: sq,
        key: `special-${sq}`,
        isPentagonal: false,
      });

      squares.push({
        position: bottomPos,
        notation: `${sq}'`,
        key: `special-${sq}'`,
        isPentagonal: false,
      });
    });

    return squares;
  }, []);

  type Direction = keyof Directions; // "N" | "S" | "E" | "W" | "in" | "out" | "cw" | "ccw" | "NW" | "NE" | "SW" | "SE"

  const pentagonOrthogonalExits: Record<
    string,
    Record<string, (keyof Directions)[]>
  > = {
    c3: {
      N: ["N", "cw", "in"],
      E: ["E", "ccw", "in"],
      S: ["S", "ccw"],
      W: ["W", "cw"],
      cw: ["cw", "W"],
      ccw: ["ccw", "S"],
      out: ["S", "W"],
    },
    c6: {
      N: ["N", "cw"],
      E: ["E", "cw", "in"],
      S: ["S", "ccw", "in"],
      W: ["W", "ccw"],
      cw: ["cw", "N"],
      ccw: ["ccw", "W"],
      out: ["N", "W"],
    },
    f3: {
      N: ["N", "ccw", "in"],
      E: ["E", "ccw"],
      S: ["S", "ccw"],
      W: ["W", "cw", "in"],
      cw: ["cw", "S"],
      ccw: ["ccw", "E"],
      out: ["S", "E"],
    },
    f6: {
      N: ["N", "ccw"],
      E: ["E", "cw"],
      S: ["S", "cw", "in"],
      W: ["W", "ccw", "in"],
      cw: ["cw", "E"],
      ccw: ["ccw", "N"],
      out: ["N", "E"],
    },
    "c3'": {
      N: ["N", "cw", "in"],
      E: ["E", "ccw", "in"],
      S: ["S", "ccw"],
      W: ["W", "cw"],
      cw: ["cw", "W"],
      ccw: ["ccw", "S"],
      out: ["S", "W"],
    },
    "c6'": {
      N: ["N", "cw"],
      E: ["E", "cw", "in"],
      S: ["S", "ccw", "in"],
      W: ["W", "ccw"],
      cw: ["cw", "N"],
      ccw: ["ccw", "W"],
      out: ["N", "W"],
    },
    "f3'": {
      N: ["N", "ccw", "in"],
      E: ["E", "ccw"],
      S: ["S", "ccw"],
      W: ["W", "cw", "in"],
      cw: ["cw", "S"],
      ccw: ["ccw", "E"],
      out: ["S", "E"],
    },
    "f6'": {
      N: ["N", "ccw"],
      E: ["E", "cw"],
      S: ["S", "cw", "in"],
      W: ["W", "ccw", "in"],
      cw: ["cw", "E"],
      ccw: ["ccw", "N"],
      out: ["N", "E"],
    },
  };

  const calculateOrthogonalMoves = (
    start: string,
    player: 1 | 2 | 3 | 4
  ): { moves: string[]; paths: Record<string, string[]> } => {
    const moves = new Set<string>();
    const paths = new Map<string, string[]>();

    const occupiedSquares: Record<string, 1 | 2 | 3 | 4> = Object.fromEntries([
      ...Object.entries(piecePositions).map(([id, notation]) => [
        notation,
        getPlayerFromPieceId(id),
      ]),
      ...Object.entries(pawnPositions).map(([id, info]) => [
        info.position,
        getPlayerFromPieceId(id),
      ]),
    ]);

    // Helper to get the opposite direction
    const oppositeDir: Record<Direction, Direction> = {
      N: "S",
      S: "N",
      E: "W",
      W: "E",
      in: "out",
      out: "in",
      cw: "ccw",
      ccw: "cw",

      // Diagonal directions are not used for rook movement but included for completeness
      NW: "SE",
      NE: "SW",
      SW: "NE",
      SE: "NW",
      idl: "odr",
      idr: "odl",
      odl: "idr",
      odr: "idl",
      od: "od",
    };

    const outDir: Record<string, Direction> = {
      c4: "W",
      c5: "W",
      d3: "S",
      e3: "S",
      d6: "N",
      e6: "N",
      f4: "E",
      f5: "E",

      "c4'": "W",
      "c5'": "W",
      "d3'": "S",
      "e3'": "S",
      "d6'": "N",
      "e6'": "N",
      "f4'": "E",
      "f5'": "E",
    };

    const inDir: Record<string, Direction> = {
      c4: "E",
      c5: "E",
      d3: "N",
      e3: "N",
      d6: "S",
      e6: "S",
      f4: "W",
      f5: "W",

      "c4'": "E",
      "c5'": "E",
      "d3'": "N",
      "e3'": "N",
      "d6'": "S",
      "e6'": "S",
      "f4'": "W",
      "f5'": "W",
    };

    // Traverse a line in a specific direction
    const traverseLine = (
      current: string,
      dir: Direction,
      visitedLine: Set<string>,
      pathsSoFar: string[]
    ) => {
      const node = boardGraph[current];
      if (!node) {
        return;
      }

      // \/\/\/ handle in/out transitions \/\/\/

      if (current in outDir && dir === "out") {
        dir = outDir[current];
      }

      if (current in inDir && dir === inDir[current]) {
        dir = "in";
      }
      // /\/\/\

      const next = node[dir];
      if (!next) {
        return;
      }

      // Prevent infinite loops along this line
      const lineKey = `${current}-${dir}`;
      if (visitedLine.has(lineKey)) {
        return;
      }
      visitedLine.add(lineKey);

      const newPath = [...pathsSoFar, next];

      if (next in occupiedSquares) {
        if (occupiedSquares[next] !== player) {
          moves.add(next); // Can capture opponent piece
          paths.set(next, newPath);
        }
        return;
      }

      moves.add(next);
      paths.set(next, newPath);

      // Only allow prime/non-prime transitions via in/out
      const currentPrime = current.endsWith("'");
      const nextPrime = next.endsWith("'");

      let nextDir: Direction = dir;
      if ((!currentPrime && nextPrime) || (currentPrime && !nextPrime)) {
        nextDir = oppositeDir[dir];
      }

      // Determine next directions
      if (pentagonOrthogonalExits[next]) {
        // Pentagon square: branch according to entry direction
        const branches = pentagonOrthogonalExits[next][nextDir] || [];
        for (const branch of branches) {
          traverseLine(next, branch, new Set(visitedLine), newPath); // clone visited for each branch
        }
      } else {
        // Normal square: continue straight in same direction
        traverseLine(next, nextDir, visitedLine, newPath);
      }
    };

    // Start traversal along each initial rook direction
    const initialDirs: Direction[] = [
      "N",
      "S",
      "E",
      "W",
      "in",
      "out",
      "cw",
      "ccw",
    ];
    for (const dir of initialDirs) {
      traverseLine(start, dir, new Set(), [start]);
    }

    moves.delete(start);
    return { moves: Array.from(moves), paths: Object.fromEntries(paths) };
  };

  const pentagonDiagonalExits: Record<
    string,
    Record<string, (keyof Directions)[]>
  > = {
    c3: {
      NE: ["idl", "idr"],
      SE: ["idr", "SE"],
      NW: ["NW", "idl"],
      odl: ["SE", "SW"],
      odr: ["NW", "SW"],
    },
    c6: {
      SE: ["idl", "idr"],
      NE: ["NE", "idl"],
      SW: ["SW", "idr"],
      odl: ["NW", "SW"],
      odr: ["NE", "NW"],
    },
    f3: {
      NW: ["idl", "idr"],
      SW: ["idl", "SW"],
      NE: ["NE", "idr"],
      odl: ["NE", "SE"],
      odr: ["SW", "SE"],
    },
    f6: {
      SW: ["idl", "idr"],
      NW: ["NW", "idr"],
      SE: ["SE", "idl"],
      odl: ["NE", "NW"],
      odr: ["SE", "NE"],
    },
    "c3'": {
      NE: ["idl", "idr"],
      SE: ["idl", "SE"],
      NW: ["NW", "idr"],
      odl: ["NW", "SW"],
      odr: ["SE", "SW"],
    },
    "c6'": {
      SE: ["idl", "idr"],
      NE: ["NE", "idr"],
      SW: ["SW", "idl"],
      odl: ["NW", "NE"],
      odr: ["SW", "NW"],
    },
    "f3'": {
      NW: ["idl", "idr"],
      SW: ["idr", "SW"],
      NE: ["NE", "idl"],
      odl: ["SW", "SE"],
      odr: ["NE", "SE"],
    },
    "f6'": {
      SW: ["idl", "idr"],
      NW: ["NW", "idl"],
      SE: ["SE", "idr"],
      odl: ["NE", "SE"],
      odr: ["NW", "NE"],
    },
  };

  const calculateDiagonalMoves = (
    start: string,
    player: 1 | 2 | 3 | 4
  ): { moves: string[]; paths: Record<string, string[]> } => {
    const moves = new Set<string>();
    const paths = new Map<string, string[]>();

    const occupiedSquares: Record<string, 1 | 2 | 3 | 4> = Object.fromEntries([
      ...Object.entries(piecePositions).map(([id, notation]) => [
        notation,
        getPlayerFromPieceId(id),
      ]),
      ...Object.entries(pawnPositions).map(([id, info]) => [
        info.position,
        getPlayerFromPieceId(id),
      ]),
    ]);

    // [Keep all the same diagonal logic but with player checks]
    const inDir: Record<string, Record<string, Direction>> = {
      c4: { NE: "idl", SE: "idr" },
      c5: { NE: "idl", SE: "idr" },
      d3: { NW: "idl", NE: "idr" },
      d6: { SE: "idl", SW: "idr" },
      e3: { NW: "idl", NE: "idr" },
      e6: { SE: "idl", SW: "idr" },
      f4: { SW: "idl", NW: "idr" },
      f5: { SW: "idl", NW: "idr" },
      "c4'": { NE: "idr", SE: "idl" },
      "c5'": { NE: "idr", SE: "idl" },
      "d3'": { NW: "idr", NE: "idl" },
      "d6'": { SE: "idr", SW: "idl" },
      "e3'": { NW: "idr", NE: "idl" },
      "e6'": { SE: "idr", SW: "idl" },
      "f4'": { SW: "idr", NW: "idl" },
      "f5'": { SW: "idr", NW: "idl" },
    };

    const outDir: Record<string, Record<string, Direction>> = {
      c4: { odl: "SW", odr: "NW" },
      c5: { odl: "SW", odr: "NW" },
      d3: { odl: "SE", odr: "SW" },
      d6: { odl: "NW", odr: "NE" },
      e3: { odl: "SE", odr: "SW" },
      e6: { odl: "NW", odr: "NE" },
      f4: { odl: "NE", odr: "SE" },
      f5: { odl: "NE", odr: "SE" },
      "c4'": { odr: "SW", odl: "NW" },
      "c5'": { odr: "SW", odl: "NW" },
      "d3'": { odr: "SE", odl: "SW" },
      "d6'": { odr: "NW", odl: "NE" },
      "e3'": { odr: "SE", odl: "SW" },
      "e6'": { odr: "NW", odl: "NE" },
      "f4'": { odr: "NE", odl: "SE" },
      "f5'": { odr: "NE", odl: "SE" },
    };

    const traverseDiagonal = (
      current: string,
      dir: Direction,
      visitedLine: Set<string>,
      pathsSoFar: string[]
    ) => {
      const node = boardGraph[current];
      if (!node) return;

      if (current in inDir) {
        if (dir in inDir[current]) {
          dir = inDir[current][dir];
        }
      }
      if (current in outDir) {
        if (dir in outDir[current]) {
          dir = outDir[current][dir];
        }
      }

      const next = node[dir];
      if (!next) return;

      const lineKey = `${current}-${dir}`;
      if (visitedLine.has(lineKey)) return;
      visitedLine.add(lineKey);

      const newPath = [...pathsSoFar, next];

      if (next in occupiedSquares) {
        if (occupiedSquares[next] !== player) {
          moves.add(next);
          paths.set(next, newPath);
        }
        return;
      }

      moves.add(next);
      paths.set(next, newPath);

      const currentPrime = current.endsWith("'");
      const nextPrime = next.endsWith("'");
      let nextDir: Direction = dir;
      if (currentPrime !== nextPrime) {
        if (dir === "idl") nextDir = "odl";
        else if (dir === "idr") nextDir = "odr";
      }

      if (pentagonDiagonalExits[next]) {
        const branches = pentagonDiagonalExits[next][dir] || [];
        for (const branch of branches) {
          traverseDiagonal(next, branch, new Set(visitedLine), newPath);
        }
      } else {
        traverseDiagonal(next, nextDir, visitedLine, newPath);
      }
    };

    const initialDirs: Direction[] = [
      "NE",
      "NW",
      "SE",
      "SW",
      "idl",
      "idr",
      "odl",
      "odr",
    ];
    for (const dir of initialDirs) {
      traverseDiagonal(start, dir, new Set(), [start]);
    }

    return { moves: Array.from(moves), paths: Object.fromEntries(paths) };
  };

  const calculateKingMoves = (
    start: string,
    player: 1 | 2 | 3 | 4,
    hasMoved: Record<string, boolean> = {}
  ): { moves: string[]; paths: Record<string, string[]> } => {
    const moves = new Set<string>();
    const paths = new Map<string, string[]>();

    const occupiedSquares: Record<string, 1 | 2 | 3 | 4> = Object.fromEntries([
      ...Object.entries(piecePositions).map(([id, notation]) => [
        notation,
        getPlayerFromPieceId(id),
      ]),
      ...Object.entries(pawnPositions).map(([id, info]) => [
        info.position,
        getPlayerFromPieceId(id),
      ]),
    ]);

    const allDirections: Direction[] = [
      "N",
      "S",
      "E",
      "W",
      "NE",
      "NW",
      "SE",
      "SW",
      "in",
      "out",
      "cw",
      "ccw",
      "idl",
      "idr",
      "odl",
      "odr",
    ];

    const node = boardGraph[start];
    if (!node) return { moves: [], paths: {} };

    for (let dir of allDirections) {
      const next = node[dir];
      if (next) {
        if (next in occupiedSquares) {
          if (occupiedSquares[next] !== player) {
            moves.add(next);
            paths.set(next, [start, next]);
          }
        } else {
          moves.add(next);
          paths.set(next, [start, next]);
        }
      }
    }

    // Castling logic (players 1 and 2 only for now)
    const kingId = Object.entries(piecePositions).find(
      ([id, pos]) =>
        pos === start &&
        id.includes("king") &&
        getPlayerFromPieceId(id) === player
    )?.[0];

    if (kingId && !hasMoved[kingId] && player <= 2) {
      const startingSquare = player === 1 ? "e1" : "e8";
      const startingSquarePrime = player === 1 ? "e1'" : "e8'";

      if (start === startingSquare || start === startingSquarePrime) {
        const isPathClear = (pathSquares: string[]): boolean => {
          return pathSquares.every((sq) => !(sq in occupiedSquares));
        };

        const getCastlingPath = (
          direction: "W" | "E",
          squares: number
        ): string[] => {
          const path: string[] = [];
          let current = start;

          for (let i = 0; i < squares; i++) {
            const node = boardGraph[current];
            if (!node || !node[direction]) return [];
            current = String(node[direction]);
            path.push(current);
          }

          return path;
        };

        // Kingside castling
        const kingsideRookSquare =
          player === 1
            ? start.includes("'")
              ? "h1'"
              : "h1"
            : start.includes("'")
            ? "h8'"
            : "h8";

        const kingsideRookId = Object.entries(piecePositions).find(
          ([id, pos]) =>
            pos === kingsideRookSquare &&
            id.includes("rook") &&
            getPlayerFromPieceId(id) === player
        )?.[0];

        if (kingsideRookId && !hasMoved[kingsideRookId]) {
          const kingsidePath = getCastlingPath("E", 2);
          if (kingsidePath.length === 2) {
            const [f_square, g_square] = kingsidePath;
            if (isPathClear([f_square, g_square])) {
              const castleSquare = g_square;
              moves.add(castleSquare);
              paths.set(castleSquare, [start, f_square, castleSquare]);
            }
          }
        }

        // Queenside castling
        const queensideRookSquare =
          player === 1
            ? start.includes("'")
              ? "a1'"
              : "a1"
            : start.includes("'")
            ? "a8'"
            : "a8";

        const queensideRookId = Object.entries(piecePositions).find(
          ([id, pos]) =>
            pos === queensideRookSquare &&
            id.includes("rook") &&
            getPlayerFromPieceId(id) === player
        )?.[0];

        if (queensideRookId && !hasMoved[queensideRookId]) {
          const queensidePath = getCastlingPath("W", 3);
          if (queensidePath.length === 3) {
            const [d_square, c_square, b_square] = queensidePath;
            if (isPathClear([d_square, c_square, b_square])) {
              const castleSquare = c_square;
              moves.add(castleSquare);
              paths.set(castleSquare, [start, d_square, castleSquare]);
            }
          }
        }
      }
    }

    return { moves: Array.from(moves), paths: Object.fromEntries(paths) };
  };

  const calculateKnightMoves = (
    start: string,
    player: 1 | 2 | 3 | 4
  ): { moves: string[]; paths: Record<string, string[]> } => {
    const moves = new Set<string>();
    const paths = new Map<string, string[]>();

    const occupiedSquares: Record<string, 1 | 2 | 3 | 4> = Object.fromEntries([
      ...Object.entries(piecePositions).map(([id, notation]) => [
        notation,
        getPlayerFromPieceId(id),
      ]),
      ...Object.entries(pawnPositions).map(([id, info]) => [
        info.position,
        getPlayerFromPieceId(id),
      ]),
    ]);

    // [Keep all the same knight logic but with player checks]
    const ringSquares = new Set([
      "d4",
      "e4",
      "d5",
      "e5",
      "x1",
      "x2",
      "x3",
      "x4",
      "y1",
      "y2",
      "y3",
      "y4",
      "d4'",
      "e4'",
      "d5'",
      "e5'",
      "x1'",
      "x2'",
      "x3'",
      "x4'",
      "y1'",
      "y2'",
      "y3'",
      "y4'",
    ]);

    const getPerpendicularDirs = (
      square: string,
      primaryDir: Direction
    ): Direction[] => {
      const isRingSquare = ringSquares.has(square);

      if (isRingSquare) {
        if (primaryDir === "in" || primaryDir === "out") {
          return ["cw", "ccw"];
        } else if (primaryDir === "cw" || primaryDir === "ccw") {
          return ["in", "out"];
        }
      }

      const basePerpendicular: Record<Direction, Direction[]> = {
        N: ["E", "W"],
        S: ["E", "W"],
        E: ["N", "S"],
        W: ["N", "S"],
        cw: ["in", "out"],
        ccw: ["in", "out"],
        in: ["cw", "ccw"],
        out: ["cw", "ccw"],
        NE: [],
        NW: [],
        SE: [],
        SW: [],
        idl: [],
        idr: [],
        odl: [],
        odr: [],
        od: [],
      };

      return basePerpendicular[primaryDir] || [];
    };

    const oppositeDir: Record<Direction, Direction> = {
      N: "S",
      S: "N",
      E: "W",
      W: "E",
      in: "out",
      out: "in",
      cw: "ccw",
      ccw: "cw",
      NW: "SE",
      NE: "SW",
      SW: "NE",
      SE: "NW",
      idl: "odr",
      idr: "odl",
      odl: "idr",
      odr: "idl",
      od: "od",
    };

    const outDir: Record<string, Direction> = {
      c4: "W",
      c5: "W",
      d3: "S",
      e3: "S",
      d6: "N",
      e6: "N",
      f4: "E",
      f5: "E",
      "c4'": "W",
      "c5'": "W",
      "d3'": "S",
      "e3'": "S",
      "d6'": "N",
      "e6'": "N",
      "f4'": "E",
      "f5'": "E",
    };

    const inDir: Record<string, Direction> = {
      c4: "E",
      c5: "E",
      d3: "N",
      e3: "N",
      d6: "S",
      e6: "S",
      f4: "W",
      f5: "W",
      "c4'": "E",
      "c5'": "E",
      "d3'": "N",
      "e3'": "N",
      "d6'": "S",
      "e6'": "S",
      "f4'": "W",
      "f5'": "W",
    };

    const moveOneSquare = (
      current: string,
      dir: Direction
    ): Array<{ square: string; nextDir: Direction }> => {
      const node = boardGraph[current];
      if (!node) return [];

      let actualDir = dir;
      if (current in outDir && dir === "out") {
        actualDir = outDir[current];
      }
      if (current in inDir && dir === inDir[current]) {
        actualDir = "in";
      }

      const next = node[actualDir];
      if (!next) return [];

      const currentPrime = current.endsWith("'");
      const nextPrime = next.endsWith("'");
      let nextDir = actualDir;

      if ((!currentPrime && nextPrime) || (currentPrime && !nextPrime)) {
        nextDir = oppositeDir[actualDir];
      }

      if (pentagonOrthogonalExits[next]) {
        const exits = pentagonOrthogonalExits[next][nextDir];
        if (exits && exits.length > 0) {
          return exits.map((exitDir) => ({ square: next, nextDir: exitDir }));
        }
      }

      return [{ square: next, nextDir }];
    };

    const primaryDirs: Direction[] = [
      "N",
      "S",
      "E",
      "W",
      "in",
      "out",
      "cw",
      "ccw",
    ];

    for (const primaryDir of primaryDirs) {
      const firstSteps = moveOneSquare(start, primaryDir);

      for (const step1 of firstSteps) {
        const secondSteps = moveOneSquare(step1.square, step1.nextDir);

        for (const step2 of secondSteps) {
          const intermediatePath = [start, step1.square, step2.square];
          const perpDirs = getPerpendicularDirs(step2.square, step2.nextDir);

          for (const perpDir of perpDirs) {
            const thirdSteps = moveOneSquare(step2.square, perpDir);

            for (const step3 of thirdSteps) {
              const destination = step3.square;
              const fullPath = [...intermediatePath, destination];

              if (destination in occupiedSquares) {
                if (occupiedSquares[destination] !== player) {
                  moves.add(destination);
                  if (!paths.has(destination)) {
                    paths.set(destination, fullPath);
                  }
                }
              } else {
                moves.add(destination);
                if (!paths.has(destination)) {
                  paths.set(destination, fullPath);
                }
              }
            }
          }
        }
      }
    }

    return { moves: Array.from(moves), paths: Object.fromEntries(paths) };
  };

  const pawnMoveDirs: Record<string, Record<string, Direction[]>> = {
    c3: {
      N: ["N", "in", "cw"],
      S: ["S", "ccw", "E"],
      ccw: ["S", "ccw", "E"],
      E: ["E", "in", "ccw"],
      W: ["W", "N", "cw"],
      cw: ["W", "N", "cw"],
      out: ["W", "S"],
    },
    c6: {
      N: ["N", "E", "cw"],
      cw: ["N", "E", "cw"],
      S: ["S", "in"],
      E: ["E", "cw", "in"],
      W: ["W", "ccw", "S"],
      ccw: ["W", "ccw", "S"],
      out: ["N", "W"],
    },
    f3: {
      N: ["N", "ccw", "in"],
      S: ["S", "ccw", "W"],
      cw: ["S", "cw", "W"],
      E: ["E", "N", "ccw"],
      ccw: ["E", "N", "ccw"],
      W: ["W", "in"],
      out: ["E", "S"],
    },
    f6: {
      N: ["N", "ccw", "W"],
      S: ["S", "cw", "in"],
      E: ["E", "S", "cw"],
      W: ["W", "in"],
      cw: ["E", "cw", "S"],
      ccw: ["ccw", "N", "W"],
      out: ["N", "E"],
    },
    "c3'": {
      N: ["N", "in", "ccw"],
      S: ["S", "cw", "E"],
      ccw: ["N", "ccw", "W"],
      E: ["E", "in", "cw"],
      W: ["W", "N", "ccw"],
      cw: ["E", "S", "cw"],
      out: ["W", "S"],
    },
    "c6'": {
      N: ["N", "E", "ccw"],
      cw: ["S", "W", "cw"],
      S: ["S", "in"],
      E: ["E", "ccw", "in"],
      W: ["W", "cw", "S"],
      ccw: ["E", "ccw", "N"],
      out: ["N", "W"],
    },
    "f3'": {
      N: ["N", "cw", "in"],
      S: ["S", "ccw", "W"],
      cw: ["E", "cw", "N"],
      E: ["E", "N", "cw"],
      ccw: ["W", "S", "ccw"],
      W: ["W", "N", "cw"],
      out: ["E", "S"],
    },
    "f6'": {
      N: ["N", "cw", "W"],
      S: ["S", "ccw", "in"],
      E: ["E", "S", "ccw"],
      W: ["W", "in", "cw"],
      cw: ["W", "cw", "N"],
      ccw: ["ccw", "S", "E"],
      out: ["N", "E"],
    },
  };

  const calculatePawnMoves = (
    start: string,
    player: 1 | 2 | 3 | 4,
    dir: Direction,
    enPassantSquare: string | null = null
  ): {
    moves: string[];
    paths: Record<string, string[]>;
    dirs: Record<string, Direction>;
  } => {
    const moves = new Set<string>();
    const paths = new Map<string, string[]>();
    const dirs = new Map<String, Direction>();

    const occupiedSquares: Record<string, 1 | 2 | 3 | 4> = Object.fromEntries([
      ...Object.entries(piecePositions).map(([id, notation]) => [
        notation,
        getPlayerFromPieceId(id),
      ]),
      ...Object.entries(pawnPositions).map(([id, info]) => [
        info.position,
        getPlayerFromPieceId(id),
      ]),
    ]);

    const node = boardGraph[start];
    if (!node) return { moves: [], paths: {}, dirs: {} };

    const isPrime = start.includes("'");

    const isFirstMove =
      (player === 1 && start[1] === "2" && !isPrime) ||
      (player === 2 && start[1] === "7" && !isPrime) ||
      (player === 3 && start[1] === "2" && isPrime) ||
      (player === 4 && start[1] === "7" && isPrime);

    // Check for non-attacks
    if (isFirstMove) {
      const traverse = (square: string, dir: Direction) => {
        let curr = boardGraph[square];
        if (!curr) return;

        let next = curr[dir];
        if (!next) return;
        if (next in occupiedSquares) return;

        if (square === start) {
          if (
            ["c3", "c6", "f3", "f6", "c3'", "c6'", "f3'", "f6'"].includes(next)
          ) {
            traverse(next, "in");
          }
          traverse(next, dir);
        }

        moves.add(next);
        if (square === start) paths.set(next, [next]);
        else paths.set(next, [square, next]);
        dirs.set(next, dir);

        return;
      };
      traverse(start, dir);
    } else {
      if (start in pawnMoveDirs) {
        for (let d of pawnMoveDirs[start][dir]) {
          let next = node[d as Direction];
          if (next && !(next in occupiedSquares)) {
            moves.add(next);
            paths.set(next, [next]);
            dirs.set(next, d);
          }
        }
      } else {
        let next = node[dir];
        if (next && !(next in occupiedSquares)) {
          let newDir: Direction = dir;
          if (next.includes("'") !== isPrime) {
            newDir = "out";
          }
          moves.add(next);
          paths.set(next, [next]);
          dirs.set(next, newDir);
        }
      }
    }

    // Check for attacks

    return {
      moves: Array.from(moves),
      paths: Object.fromEntries(paths),
      dirs: Object.fromEntries(dirs),
    };
  };

  // Helper function to get player from piece ID
  const getPlayerFromPieceId = (id: string): 1 | 2 | 3 | 4 => {
    if (id.startsWith("player1")) return 1;
    if (id.startsWith("player2")) return 2;
    if (id.startsWith("player3")) return 3;
    if (id.startsWith("player4")) return 4;
    // Legacy support for old naming

    return 1;
  };

  const getPieceFromId = (id: string): string => {
    return id.split("-")[1];
  };

  const [, setAnimatingPiece] = useState<string | null>(null);

  useEffect(() => {
    if (capturedPiece) {
      const timeout = setTimeout(() => {
        setPiecePositions((prev) => {
          const newPositions = { ...prev };
          delete newPositions[capturedPiece]; // remove the captured one
          return newPositions;
        });
        setCapturedPiece(null); // clear capture state
      }, 600); // wait for shrink animation to finish
      return () => clearTimeout(timeout);
    }
  }, [capturedPiece]);

  // Add state to track which pieces have moved
  const [hasMoved] = useState<Record<string, boolean>>({});

  // Update handlePieceClick to pass hasMoved
  const handlePieceClick = (pieceId: string, notation: string) => {
    if (selectedPiece === pieceId) {
      setSelectedPiece(null);
      setPossibleMoves([]);
      setPossibleMovePaths({});
      return;
    }

    setSelectedPiece(pieceId);

    const player = getPlayerFromPieceId(pieceId);

    if (player !== currentPlayer && !sandboxMode) return;
    if (sandboxMode) setCurrentPlayer(player);

    let moves: string[] = [];
    let paths: Record<string, string[]> = {};

    if (pieceId.includes("rook")) {
      const result = calculateOrthogonalMoves(notation, player);
      moves = result.moves;
      paths = result.paths;
    } else if (pieceId.includes("bishop")) {
      const result = calculateDiagonalMoves(notation, player);
      moves = result.moves;
      paths = result.paths;
    } else if (pieceId.includes("queen")) {
      const orthoResult = calculateOrthogonalMoves(
        notation,

        player
      );
      const diagResult = calculateDiagonalMoves(
        notation,

        player
      );
      moves = Array.from(new Set([...orthoResult.moves, ...diagResult.moves]));
      paths = { ...orthoResult.paths, ...diagResult.paths };
    } else if (pieceId.includes("king")) {
      const result = calculateKingMoves(
        notation,

        player,
        hasMoved
      );
      moves = result.moves;
      paths = result.paths;
    } else if (pieceId.includes("pawn")) {
      const result = calculatePawnMoves(
        notation,
        player,
        pawnPositions[pieceId]["direction"] as Direction,
        enPassantSquare
      );
      moves = result.moves;
      paths = result.paths;
      setPawnDirs(result.dirs);
    } else if (pieceId.includes("knight")) {
      const result = calculateKnightMoves(notation, player);
      moves = result.moves;
      paths = result.paths;
    }

    setPossibleMoves(moves);
    setPossibleMovePaths(paths);
  };

  const getNextPlayer = (currentPlayer: 1 | 2 | 3 | 4): 1 | 2 | 3 | 4 => {
    switch (currentPlayer) {
      case 1:
        return 2;
      case 2:
        return 3;
      case 3:
        return 4;
      case 4:
        return 1;
      default:
        return 1;
    }
  };



  const animatePieceAlongPath = async (
    pieceId: string,
    pathNotations: string[]
  ) => {
    const delay = PIECE_SPEED; // milliseconds per step

    const isPawn = getPieceFromId(pieceId) === "pawn";

    for (let i = 0; i < pathNotations.length; i++) {
      const notation = pathNotations[i];

      if (isPawn) {
        setPawnPositions((prev) => {
          const newPositions = { ...prev };

          // Step-by-step move
          newPositions[pieceId] = {
            position: notation,
            direction: pawnDirs ? pawnDirs[notation] : prev[pieceId].direction,
          };

          return newPositions;
        });
      } else {
        setPiecePositions((prev) => {
          // Check if another piece is in the spot
          const targetEntry = Object.entries(prev).find(
            ([id, pos]) => pos === notation && id !== pieceId
          );

          // Capture logic at the final step
          if (i === pathNotations.length - 1 && targetEntry) {
            const [capturedId] = targetEntry;
            setCapturedPiece(capturedId);

            const newPositions = { ...prev };
            delete newPositions[capturedId];

            newPositions[pieceId] = notation;
            return newPositions;
          }

          // Move step-by-step
          return { ...prev, [pieceId]: notation };
        });
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // end animation
    setAnimatingPiece(null);
  };

  const handleSquareClick = (
    pos: [number, number, number],
    notation: string
  ) => {
    if (!selectedPiece || !possibleMoves.includes(notation)) return;

    const pathNotations = possibleMovePaths[notation];
    if (!pathNotations) {
      console.warn("No animation path found for move:", notation);
      return;
    }

    const player = getPlayerFromPieceId(selectedPiece);

    // Check for pawn double move to set en passant square

    const fromSquare = selectedPiece.includes("pawn")
      ? pawnPositions[selectedPiece].position
      : piecePositions[selectedPiece];

    // Check if this is a castling move
    let castlingRookId: string | null = null;
    let castlingRookPath: string[] = [];

    if (
      selectedPiece.includes("king") &&
      Math.abs(fromSquare.charCodeAt(0) - notation.charCodeAt(0)) === 2
    ) {
      const isPrime = notation.includes("'");
      const rank = player === 1 ? "1" : player === 2 ? "8" : "";
      const rankSuffix = isPrime ? "'" : "";

      if (notation.startsWith("g")) {
        const rookSquare = `h${rank}${rankSuffix}`;
        const rookDestination = `f${rank}${rankSuffix}`;

        castlingRookId =
          Object.entries(piecePositions).find(
            ([id, pos]) =>
              pos === rookSquare &&
              id.includes("rook") &&
              getPlayerFromPieceId(id) === player
          )?.[0] || null;

        if (castlingRookId) {
          castlingRookPath = [rookSquare, rookDestination];
        }
      } else if (notation.startsWith("c")) {
        const rookSquare = `a${rank}${rankSuffix}`;
        const rookDestination = `d${rank}${rankSuffix}`;

        castlingRookId =
          Object.entries(piecePositions).find(
            ([id, pos]) =>
              pos === rookSquare &&
              id.includes("rook") &&
              getPlayerFromPieceId(id) === player
          )?.[0] || null;

        if (castlingRookId) {
          castlingRookPath = [rookSquare, rookDestination];
        }
      }
    }

    setAnimatingPiece(selectedPiece);
    setSelectedPiece(null);
    setPossibleMoves([]);
    if (!sandboxMode) setCurrentPlayer(getNextPlayer(currentPlayer));

    animatePieceAlongPath(selectedPiece, pathNotations).then(() => {
      if (castlingRookId && castlingRookPath.length > 0) {
        return animatePieceAlongPath(castlingRookId, castlingRookPath);
      }
    });

    if (capturedPiece) {
      playCaptureSound();
    } else {
      playMoveSound();
    }

    setMoveHistory((prev) => [
      ...prev,
      {
        moveNumber: prev.length + 1,
        piece: selectedPiece,
        from: fromSquare,
        to: pathNotations[pathNotations.length - 1],
        captured: capturedPiece || null,
        timestamp: new Date(),
        isWormholeMove:
          pathNotations[0].includes("'") !==
          pathNotations[pathNotations.length - 1].includes("'"),
        isCastling: castlingRookId !== null,
      },
    ]);
  };

  const isHighlightedSquare = (notation: string) => {
    return possibleMoves.includes(notation);
  };

  const handleResetGame = () => {
    const activePlayerIds = players.map((p) => p.id);
    const newPiecePositions = {};
    const newPawnPositions = {};

    activePlayerIds.forEach((playerId) => {
      Object.assign(
        newPiecePositions,
        getDefaultPiecePositionsForPlayer(playerId)
      );
      Object.assign(
        newPawnPositions,
        getDefaultPawnPositionsForPlayer(playerId)
      );
    });
    setPiecePositions(newPiecePositions);
    setPawnPositions(newPawnPositions);

    setSelectedPiece(null); // optional: deselect any piece
    setPossibleMovePaths({});
    setPossibleMoves([]);
    setMovePaths({});
    setMoveHistory([]); // optional: clear move log
  };

  const controlsRef = useRef<any>(null);
  const [polarLocked, setPolarLocked] = useState(true);

  const animateTo = useCallback((
    target: { azimuth?: number; polar?: number },
    duration = 0.2,
    onComplete?: () => void
  ) => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;

    // Read current angles at the very start
    const startPolar = controls.getPolarAngle();
    const startAzimuth = controls.getAzimuthalAngle();
    const endPolar = target.polar ?? startPolar;
    const endAzimuth = target.azimuth ?? startAzimuth;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;
      const t = Math.min(elapsed / duration, 1);

      controls.setPolarAngle(THREE.MathUtils.lerp(startPolar, endPolar, t));
      controls.setAzimuthalAngle(
        THREE.MathUtils.lerp(startAzimuth, endAzimuth, t)
      );
      controls.update();

      if (t < 1) requestAnimationFrame(animate);
      else if (onComplete) onComplete();
    };

    requestAnimationFrame(animate);
  }, []);

  const handlePolarLock = useCallback(() => {
    if (!controlsRef.current) return;

    if (!polarLocked) {
      // Snap smoothly to horizontal (π/2)
      animateTo(
        { polar: Math.PI / 2 },
        0.5,
        () => setPolarLocked(true) // lock after animation
      );
    } else {
      // Unlock
      setPolarLocked(false);
    }
  }, [polarLocked, animateTo]);

  const handleFlip180 = useCallback(() => {
    if (!controlsRef.current) return;
    setToggle180(prev => !prev);
    console.log("180: " + toggle180)
    const currentAzimuth = controlsRef.current.getAzimuthalAngle();

    // Normalize to [0, 2π)
    let az = ((currentAzimuth % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    // Round to nearest multiple of π (0 or π)
    let target = Math.round(az / Math.PI) * Math.PI;

    // If already exactly at 0 or π, flip to the other
    if (Math.abs(az - target) < 0.6) {
      target = target === 0 ? Math.PI : 0;
    }

    animateTo({ azimuth: target });
  }, [toggle180, animateTo]);

  const boardRef = useRef<THREE.Group>(null);

  const rotateBoard90 = useCallback(() => {
    if (!boardRef.current) return;
    if (isRotating) return;
    setIsRotating(true);

    setQuarterRotationCount((prev) => (prev + 1) % 4);

    const axis = new THREE.Vector3(0, 0, 1); // board normal
    const startQuaternion = boardRef.current.quaternion.clone();
    const rot = new THREE.Quaternion().setFromAxisAngle(axis, Math.PI / 2);
    const endQuaternion = startQuaternion.clone().multiply(rot);

    const duration = 0.5; // seconds
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;
      const t = Math.min(elapsed / duration, 1);

      const current = startQuaternion.clone();
      current.slerp(endQuaternion, t);
      boardRef.current!.quaternion.copy(current);

      if (t < 1) requestAnimationFrame(animate);
      else setIsRotating(false); // If it is mod 4 == 0, it is a full rotation (white color), mod 2 == 0 is a half rotation (black color) and mod 2 == 1 is a quarter rotation (gray color)
    };

    requestAnimationFrame(animate); 
  }, [isRotating]);

  const handleTopView = useCallback(() => {
    if (!controlsRef.current) return;
    setPolarLocked(false);
    animateTo({ polar: 0.05, azimuth: 0 }, 0.5);
  }, [animateTo]);

  const resetBoardOrientation = useCallback(() => {
    if (boardRef.current) {
      const startQuaternion = boardRef.current.quaternion.clone();
      const endQuaternion = ORIGINAL_ORIENTATION.clone();
      const duration = 0.5; // seconds
      let startTime: number | null = null;

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = (timestamp - startTime) / 1000;
        const t = Math.min(elapsed / duration, 1);

        const current = startQuaternion.clone();
        current.slerp(endQuaternion, t);
        boardRef.current!.quaternion.copy(current);

        if (t < 1) requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    }
    setQuarterRotationCount(0);
    setToggle180(false);
    if (controlsRef.current) {
      animateTo({ azimuth: 0, polar: Math.PI / 2 }, 0.5);
    }
  }, [animateTo]);

  const [themePopupOpen, setThemePopupOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  type Env =
    | "apartment"
    | "city"
    | "dawn"
    | "forest"
    | "lobby"
    | "night"
    | "park"
    | "studio"
    | "sunset"
    | "warehouse";

  const OPTIONS = [
    "Studio 🎬",
    "Sunset 🌅",
    "Dawn 🌄",
    "Night ⭐",
    "Forest 🌳",
    "Warehouse 🚚",
    "Park 🦆",
    "Lobby 🏢",
    "Apartment 🏠",
    "City 🚖",
  ];

  const [playersMenuOpen, setPlayersMenuOpen] = useState(false);
  const [players, setPlayers] = useState<{ id: number }[]>([
    { id: 1 },
    { id: 2 },
    { id: 3 },
    { id: 4 },
  ]);
  const [playerColors, setPlayerColors] = useState<Record<number, string>>({
    1: "#ffffff",
    2: "#000000",
    3: "#006400",
    4: "#c19a6b",
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [boardViewMode] = useState(0);

  useEffect(() => {
    if (onGameStateChange) {
      onGameStateChange({
        currentPlayer,
        turnCount: Math.floor(moveHistory.length / 2) + 1,
        moveCount: moveHistory.length,
      });
    }
  }, [currentPlayer, moveHistory.length, onGameStateChange]);

  // ========== HOTKEYS ==========
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case "t":
          handleTopView();
          break;
        case "f":
          handleFlip180();
          break;
        case "l":
          handlePolarLock();
          break;
        case "r":
          rotateBoard90();
          break;
        case "x":
          resetBoardOrientation();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleTopView, handleFlip180, handlePolarLock, rotateBoard90, resetBoardOrientation]);

  const dockBtnStyle = (active = false): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 10px",
    backgroundColor: active ? "rgba(212, 175, 55, 0.15)" : "transparent",
    color: active ? "#D4AF37" : "#FAF9F6",
    border: active ? "1px solid #D4AF37" : "1px solid transparent",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: 600,
    transition: "all 0.15s ease",
  });

  const keyBadgeStyle: React.CSSProperties = {
    fontFamily: "ui-monospace, monospace",
    fontSize: "0.7rem",
    fontWeight: 700,
    padding: "1px 4px",
    borderRadius: "3px",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    color: "#8B7E74",
    border: "1px solid rgba(139, 126, 116, 0.3)",
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#090A0F",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Full-viewport Three.js Canvas */}
      <Canvas
        camera={{ position: [0, 0, 300], fov: 50, near: 0.1, far: 1000 }}
        style={{ width: "100%", height: "100%" }}
      >
        {selectedOption !== null && (
          <Environment
            preset={
              OPTIONS[selectedOption].split(" ")[0].toLowerCase() as Env
            }
          />
        )}

        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} />

        <Suspense fallback={null}>
          <group ref={boardRef}>
            <ChessboardModel />

            {boardSquares.map((square) => (
              <BoardSquare
                key={square.key}
                position={square.position}
                notation={square.notation}
                onSquareClick={handleSquareClick}
                isHighlighted={isHighlightedSquare(square.notation)}
                isPentagonal={square.isPentagonal}
              />
            ))}

            {Object.entries(piecePositions).map(([id, notation]) => {
              const player = getPlayerFromPieceId(id);
              const color = playerColors[player];
              const pos = chessToWorld(notation);
              let piece = getPieceFromId(id);
              const isSelected = selectedPiece === id;

              const props = {
                id,
                player,
                color,
                type: piece,
                position: pos,
                notation,
                isSelected,
                capturedPiece,
                onClick: handlePieceClick,
              };

              switch (piece) {
                case "pawn":
                  return <Pawn key={id} {...props} />;
                case "knight":
                  return <Knight key={id} {...props} />;
                case "bishop":
                  return <Bishop key={id} {...props} />;
                case "rook":
                  return <Rook key={id} {...props} />;
                case "queen":
                  return <Queen key={id} {...props} />;
                case "king":
                  return <King key={id} {...props} />;
                default:
                  return null;
              }
            })}

            {Object.entries(pawnPositions).map(([id, info]) => {
              const player = getPlayerFromPieceId(id);
              const color = playerColors[player];
              const isSelected = selectedPiece === id;
              const props = {
                id: id,
                player: getPlayerFromPieceId(id),
                color,
                type: "pawn",
                position: chessToWorld(info.position),
                notation: info.position,
                isSelected,
                capturedPiece,
                onClick: handlePieceClick,
              };
              return <Pawn key={id} {...props} />;
            })}
          </group>
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          target={[0, 0, 0]}
          enableZoom={true}
          enablePan={true}
          enableRotate={boardViewMode === 0}
          minPolarAngle={
            polarLocked && boardViewMode === 0 ? Math.PI / 2 : 0
          }
          maxPolarAngle={
            polarLocked && boardViewMode === 0 ? Math.PI / 2 : 2 * Math.PI
          }
        />
      </Canvas>

      {/* Floating Bottom Camera Control Dock */}
      <div
        style={{
          position: "absolute",
          bottom: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          maxWidth: "calc(100vw - 1.5rem)",
          boxSizing: "border-box",
          gap: "6px",
          padding: "6px 8px",
          backgroundColor: "rgba(28, 30, 32, 0.88)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(139, 126, 116, 0.25)",
          borderRadius: "6px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.45)",
        }}
      >
        <button
          onClick={handleTopView}
          style={dockBtnStyle()}
          title="Top-down camera view (T)"
        >
          <span>Top View</span>
          <span style={keyBadgeStyle}>T</span>
        </button>

        <button
          onClick={handleFlip180}
          style={dockBtnStyle(toggle180)}
          title="Flip camera 180 degrees (F)"
        >
          <span>Flip 180°</span>
          <span style={keyBadgeStyle}>F</span>
        </button>

        <button
          onClick={rotateBoard90}
          style={dockBtnStyle()}
          title="Rotate board 90 degrees (R)"
        >
          <span>Rotate 90°</span>
          <span style={keyBadgeStyle}>R</span>
        </button>

        <button
          onClick={handlePolarLock}
          style={dockBtnStyle(polarLocked)}
          title="Lock camera to horizontal plane (L)"
        >
          <span>{polarLocked ? "Orbit Lock 🔒" : "Orbit Free 🔓"}</span>
          <span style={keyBadgeStyle}>L</span>
        </button>

        <button
          onClick={resetBoardOrientation}
          style={dockBtnStyle()}
          title="Reset board orientation and camera (X)"
        >
          <span>Reset</span>
          <span style={keyBadgeStyle}>X</span>
        </button>
      </div>

      {/* Collapsible Right Telemetry Drawer Toggle (when closed) */}
      {!drawerOpen && (
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            position: "absolute",
            top: "80px",
            right: 0,
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px 8px 14px",
            backgroundColor: "rgba(28, 30, 32, 0.9)",
            backdropFilter: "blur(14px)",
            color: "#FAF9F6",
            border: "1px solid rgba(139, 126, 116, 0.25)",
            borderRight: "none",
            borderRadius: "6px 0 0 6px",
            cursor: "pointer",
            boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.4)",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
          title="Expand telemetry and moves drawer"
        >
          <span>Moves ({moveHistory.length})</span>
          <span style={{ color: "#D4AF37", fontSize: "1rem" }}>◨</span>
        </button>
      )}

      {/* Collapsible Right Telemetry Drawer (when open) */}
      {drawerOpen && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: "290px",
            maxWidth: "85vw",
            zIndex: 60,
            backgroundColor: "rgba(28, 30, 32, 0.95)",
            backdropFilter: "blur(16px)",
            borderLeft: "1px solid rgba(139, 126, 116, 0.25)",
            boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.5)",
            display: "flex",
            flexDirection: "column",
            padding: "16px",
            gap: "12px",
          }}
        >
          {/* Drawer Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(139, 126, 116, 0.2)",
              paddingBottom: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#FAF9F6", fontWeight: 700, fontSize: "1rem" }}>
                Moves
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  padding: "1px 6px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(212, 175, 55, 0.15)",
                  color: "#D4AF37",
                  fontFamily: "ui-monospace, monospace",
                  fontWeight: 600,
                }}
              >
                {moveHistory.length} plies
              </span>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: "#8B7E74",
                cursor: "pointer",
                fontSize: "1.1rem",
                padding: "4px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Collapse drawer"
            >
              ✕
            </button>
          </div>

          {/* Quick Utility Actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <button
              onClick={handleResetGame}
              style={{
                flex: 1,
                padding: "6px 8px",
                borderRadius: "4px",
                backgroundColor: "#24272A",
                color: "#FAF9F6",
                fontSize: "0.75rem",
                fontWeight: 600,
                border: "1px solid rgba(139, 126, 116, 0.3)",
                cursor: "pointer",
              }}
            >
              Reset Board
            </button>
            <button
              onClick={() => setThemePopupOpen((prev) => !prev)}
              style={{
                flex: 1,
                padding: "6px 8px",
                borderRadius: "4px",
                backgroundColor: "#24272A",
                color: "#FAF9F6",
                fontSize: "0.75rem",
                fontWeight: 600,
                border: "1px solid rgba(139, 126, 116, 0.3)",
                cursor: "pointer",
              }}
            >
              Themes
            </button>
            <button
              onClick={() => setSandboxMode((prev) => !prev)}
              style={{
                flex: 1,
                padding: "6px 8px",
                borderRadius: "4px",
                backgroundColor: sandboxMode ? "rgba(76, 92, 76, 0.4)" : "#24272A",
                color: sandboxMode ? "#FAF9F6" : "#8B7E74",
                fontSize: "0.75rem",
                fontWeight: 600,
                border: sandboxMode
                  ? "1px solid rgba(76, 92, 76, 0.6)"
                  : "1px solid rgba(139, 126, 116, 0.3)",
                cursor: "pointer",
              }}
              title="Toggle Sandbox Mode"
            >
              {sandboxMode ? "Sandbox ✓" : "Standard"}
            </button>
          </div>

          {/* Scrollable Move History */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              backgroundColor: "rgba(20, 22, 24, 0.6)",
              borderRadius: "6px",
              padding: "10px",
              border: "1px solid rgba(139, 126, 116, 0.15)",
            }}
          >
            {moveHistory.length === 0 ? (
              <div
                style={{
                  color: "#8B7E74",
                  fontSize: "0.8rem",
                  fontStyle: "italic",
                  textAlign: "center",
                  marginTop: "24px",
                }}
              >
                No moves recorded yet
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {moveHistory.map((move, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      backgroundColor: idx % 2 === 0 ? "rgba(255, 255, 255, 0.03)" : "transparent",
                      fontSize: "0.8rem",
                      fontFamily: "ui-monospace, monospace",
                    }}
                  >
                    <span style={{ color: "#8B7E74", width: "24px" }}>
                      {move.moveNumber}.
                    </span>
                    <span style={{ color: "#FAF9F6", flex: 1, textAlign: "left", marginLeft: "6px" }}>
                      {move.isCastling
                        ? move.to.startsWith("g")
                          ? "O-O"
                          : "O-O-O"
                        : `${move.from} → ${move.to}`}
                    </span>
                    {move.isWormholeMove && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "#D4AF37",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "2px",
                        }}
                        title="Wormhole traversal"
                      >
                        🌀
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer: Camera Tips */}
          <div
            style={{
              borderTop: "1px solid rgba(139, 126, 116, 0.2)",
              paddingTop: "10px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "#8B7E74",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "2px",
              }}
            >
              Camera Tips
            </div>
            <div style={{ fontSize: "0.75rem", color: "#FAF9F6", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#8B7E74" }}>Left Drag</span>
              <span>Orbit view</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#FAF9F6", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#8B7E74" }}>Right Drag</span>
              <span>Pan camera</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#FAF9F6", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#8B7E74" }}>Scroll</span>
              <span>Zoom in / out</span>
            </div>
          </div>
        </div>
      )}

      {/* Theme Selection Modal */}
      {themePopupOpen && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#24272A",
            border: "1px solid rgba(139, 126, 116, 0.3)",
            borderRadius: "6px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            zIndex: 1100,
            width: "320px",
          }}
        >
          <h3
            style={{
              color: "#FAF9F6",
              fontSize: "1.05rem",
              margin: 0,
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            Environment Theme
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "8px",
            }}
          >
            {OPTIONS.map((option, i) => (
              <button
                key={i}
                onClick={() => setSelectedOption((prev) => (prev === i ? null : i))}
                style={{
                  padding: "8px 10px",
                  borderRadius: "4px",
                  border: i === selectedOption ? "1px solid #D4AF37" : "1px solid rgba(139, 126, 116, 0.25)",
                  cursor: "pointer",
                  backgroundColor: i === selectedOption ? "rgba(212, 175, 55, 0.15)" : "#1C1E20",
                  color: i === selectedOption ? "#D4AF37" : "#FAF9F6",
                  fontWeight: i === selectedOption ? 700 : 500,
                  fontSize: "0.8rem",
                  transition: "all 0.15s",
                }}
              >
                {option}
              </button>
            ))}
          </div>

          <button
            onClick={() => setThemePopupOpen(false)}
            style={{
              marginTop: "6px",
              padding: "8px",
              borderRadius: "4px",
              border: "none",
              backgroundColor: "#4C5C4C",
              color: "#FAF9F6",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.85rem",
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default ChessboardScene;
