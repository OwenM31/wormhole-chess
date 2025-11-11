import React, { Suspense, useState, useMemo, useEffect, useRef } from "react";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF, Box } from "@react-three/drei";
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
  TEAM_COLORS,
  PIECE_COLORS,
  SANDBOX_MODE,
} from "./Constants";
import {
  getPieceWormholeRotation,
  getRotationTowardsOrigin,
  getWormholeTransform,
} from "./WormholeGeometry";
import { gridToChess, chessToWorld } from "./CoordinateConversion";
import Piece from "./PieceAnimation";

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

interface MoveLogEntry {
  moveNumber: number;
  piece: string;
  from: string;
  to: string;
  timestamp: Date;
  isWormholeMove?: boolean;
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
                  move.isWormholeMove ? COLORS.accent : "transparent"
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
                  {move.from} → {move.to}
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
}> = ({ selectedPiece, currentPlayer }) => {
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
          <div
            style={{
              color: COLORS.smokeyTaupe,
              fontSize: "0.875rem",
              marginBottom: "4px",
            }}
          >
            Current Turn
          </div>
          <div
            style={{
              color: COLORS.warmWhite,
              fontSize: "1.25rem",
              fontWeight: "600",
              textTransform: "capitalize",
            }}
          >
            Team {currentPlayer} ({TEAM_COLORS[currentPlayer]})
          </div>
        </div>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: COLORS.lodenGreenDark,
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
        color: PIECE_COLORS[color],
        metalness: 0.6,
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

  let knightRotation: [number, number, number] = [0, 0, 0];
  if (type === "knight") {
    switch (player) {
      case 1:
        knightRotation = [0, Math.PI / 2, 0];
        break;
      case 2:
        knightRotation = [0, -Math.PI / 2, 0];
        break;
      case 3:
        knightRotation = [0, -Math.PI / 2, 0];
        break;
      case 4:
        knightRotation = [0, Math.PI / 2, 0];
        break;
    }
  }

  const finalRotation: [number, number, number] = [
    baseRotation[0] + rotation[0] + wormholeRotation[0] + knightRotation[0],
    baseRotation[1] + rotation[1] + wormholeRotation[1] + knightRotation[1],
    baseRotation[2] + rotation[2] + wormholeRotation[2] + knightRotation[2],
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

// ==================== MAIN COMPONENT ====================

const ChessboardScene: React.FC = () => {
  const [piecePositions, setPiecePositions] = useState<Record<string, string>>({
    // Team 1 (white)
    "team1-rook-a1": "a1",
    "team1-rook-h1": "h1",
    "team1-bishop-c1": "c1",
    "team1-bishop-f1": "f1",
    "team1-knight-b1": "b1",
    "team1-knight-g1": "g1",
    "team1-queen-d1": "d1",
    "team1-king-e1": "e1",

    // Team 2 (black)
    "team2-rook-a8": "a8",
    "team2-rook-h8": "h8",
    "team2-bishop-c8": "c8",
    "team2-bishop-f8": "f8",
    "team2-knight-b8": "b8",
    "team2-knight-g8": "g8",
    "team2-queen-d8": "d8",
    "team2-king-e8": "e8",

    // Team 3 (brown) - on bottom layer
    "team3-rook-a1'": "a1'",
    "team3-rook-h1'": "h1'",
    "team3-knight-b1'": "b1'",
    "team3-knight-g1'": "g1'",
    "team3-bishop-c1'": "c1'",
    "team3-bishop-f1'": "f1'",
    "team3-queen-d1'": "d1'",
    "team3-king-e1'": "e1'",

    // Team 4 (green) - on bottom layer
    "team4-rook-a8'": "a8'",
    "team4-rook-h8'": "h8'",
    "team4-knight-b8'": "b8'",
    "team4-knight-g8'": "g8'",
    "team4-bishop-c8'": "c8'",
    "team4-bishop-f8'": "f8'",
    "team4-queen-d8'": "d8'",
    "team4-king-e8'": "e8'",
  });

  const [pawnPositions, setPawnPositions] = useState<
    Record<string, Record<string, string>>
  >({
    "team1-pawn-a2": { position: "a2", direction: "N" },
    "team1-pawn-b2": { position: "b2", direction: "N" },
    "team1-pawn-c2": { position: "c2", direction: "N" },
    "team1-pawn-d2": { position: "d2", direction: "N" },
    "team1-pawn-e2": { position: "e2", direction: "N" },
    "team1-pawn-f2": { position: "f2", direction: "N" },
    "team1-pawn-g2": { position: "g2", direction: "N" },
    "team1-pawn-h2": { position: "h2", direction: "N" },
  });

  const [pawnDirs, setPawnDirs] = useState<Record<string, Direction>>();

  const [enPassantSquare, setEnPassantSquare] = useState<string | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
  const [possibleMovePaths, setPossibleMovePaths] = useState<
    Record<string, string[]>
  >({});
  const [movePaths, setMovePaths] = useState<Record<string, string[]>>({});
  const [moveHistory, setMoveHistory] = useState<MoveLogEntry[]>([]);
  const [currentPlayer, setCurrentTeam] = useState<1 | 2 | 3 | 4>(1);
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
    team: 1 | 2 | 3 | 4
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

      if (current in outDir && dir == "out") {
        dir = outDir[current];
      }

      if (current in inDir && dir == inDir[current]) {
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
        if (occupiedSquares[next] !== team) {
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
    team: 1 | 2 | 3 | 4
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

    // [Keep all the same diagonal logic but with team checks]
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
        if (occupiedSquares[next] !== team) {
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
    team: 1 | 2 | 3 | 4,
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
          if (occupiedSquares[next] !== team) {
            moves.add(next);
            paths.set(next, [start, next]);
          }
        } else {
          moves.add(next);
          paths.set(next, [start, next]);
        }
      }
    }

    // Castling logic (teams 1 and 2 only for now)
    const kingId = Object.entries(piecePositions).find(
      ([id, pos]) =>
        pos === start &&
        id.includes("king") &&
        getPlayerFromPieceId(id) === team
    )?.[0];

    if (kingId && !hasMoved[kingId] && team <= 2) {
      const startingSquare = team === 1 ? "e1" : "e8";
      const startingSquarePrime = team === 1 ? "e1'" : "e8'";

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
          team === 1
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
            getPlayerFromPieceId(id) === team
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
          team === 1
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
            getPlayerFromPieceId(id) === team
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
    team: 1 | 2 | 3 | 4
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

    // [Keep all the same knight logic but with team checks]
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
                if (occupiedSquares[destination] !== team) {
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

  // Helper function to get team from piece ID
  const getPlayerFromPieceId = (id: string): 1 | 2 | 3 | 4 => {
    if (id.startsWith("team1")) return 1;
    if (id.startsWith("team2")) return 2;
    if (id.startsWith("team3")) return 3;
    if (id.startsWith("team4")) return 4;
    // Legacy support for old naming
    if (id.startsWith("white")) return 1;
    if (id.startsWith("black")) return 2;
    return 1;
  };

  const getPieceFromId = (id: string): string => {
    return id.split("-")[1];
  };

  const [animatingPiece, setAnimatingPiece] = useState<string | null>(null);

  const handleMove = (pieceId: string, path: string[]) => {
    setMovePaths((prev) => ({ ...prev, [pieceId]: path }));

    const finalSquare = path[path.length - 1];
    setPiecePositions((prev) => ({
      ...prev,
      [pieceId]: finalSquare,
    }));
  };

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
  const [hasMoved, setHasMoved] = useState<Record<string, boolean>>({});

  // Add state to track castling moves
  const [isCastlingMove, setIsCastlingMove] = useState<string | null>(null);

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

    if (player !== currentPlayer && !SANDBOX_MODE) return;

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

  const getNextTeam = (currentPlayer: 1 | 2 | 3 | 4): 1 | 2 | 3 | 4 => {
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

  // Update MoveLogEntry interface
  interface MoveLogEntry {
    moveNumber: number;
    piece: string;
    from: string;
    to: string;
    timestamp: Date;
    isWormholeMove?: boolean;
    isCastling?: boolean;
  }

  // Update MoveLog component to show castling indicator
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

    const team = getPlayerFromPieceId(selectedPiece);

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
      const rank = team === 1 ? "1" : team === 2 ? "8" : "";
      const rankSuffix = isPrime ? "'" : "";

      if (notation.startsWith("g")) {
        const rookSquare = `h${rank}${rankSuffix}`;
        const rookDestination = `f${rank}${rankSuffix}`;

        castlingRookId =
          Object.entries(piecePositions).find(
            ([id, pos]) =>
              pos === rookSquare &&
              id.includes("rook") &&
              getPlayerFromPieceId(id) === team
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
              getPlayerFromPieceId(id) === team
          )?.[0] || null;

        if (castlingRookId) {
          castlingRookPath = [rookSquare, rookDestination];
        }
      }
    }

    setAnimatingPiece(selectedPiece);
    setSelectedPiece(null);
    setPossibleMoves([]);
    setCurrentTeam(getNextTeam(currentPlayer));

    animatePieceAlongPath(selectedPiece, pathNotations).then(() => {
      if (castlingRookId && castlingRookPath.length > 0) {
        return animatePieceAlongPath(castlingRookId, castlingRookPath);
      }
    });

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

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        backgroundColor: COLORS.smokeyTaupe,
        fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "80px",
          backgroundColor: COLORS.charcoal,
          display: "flex",
          alignItems: "center",
          padding: "0 40px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
          zIndex: 10,
        }}
      >
        <h1
          style={{
            color: COLORS.warmWhite,
            fontSize: "2rem",
            fontWeight: "700",
            letterSpacing: "-0.02em",
          }}
        >
          Wormhole Chess
          <span
            style={{
              color: COLORS.lodenGreenLight,
              fontSize: "1rem",
              marginLeft: "15px",
              fontWeight: "400",
            }}
          >
            3D Variant
          </span>
        </h1>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          marginTop: "80px",
        }}
      >
        {/* Canvas Container */}
        <div
          style={{
            flex: 1,
            position: "relative",
            backgroundColor: COLORS.charcoalLight,
            borderRight: `1px solid ${COLORS.lodenGreenDark}`,
          }}
        >
          <Canvas
            camera={{ position: [0, 0, 300], fov: 50, near: 0.1, far: 1000 }}
            style={{ width: "100%", height: "100%" }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 10]} intensity={1} />

            <Suspense fallback={null}>
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
                const color = TEAM_COLORS[player];
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
                }
              })}

              {Object.entries(pawnPositions).map(([id, info]) => {
                const player = getPlayerFromPieceId(id);
                const color = TEAM_COLORS[player];
                const modelPath = `chessboard/${color}-pieces/${color}-pawn.glb`;
                const isSelected = selectedPiece === id;
                const props = {
                  id: id,
                  player: getPlayerFromPieceId(id),
                  color: TEAM_COLORS[player],
                  type: "pawn",
                  position: chessToWorld(info.position),
                  notation: info.position,
                  isSelected,
                  capturedPiece,
                  onClick: handlePieceClick,
                  modelPath,
                };
                return <Pawn key={id} {...props} />;
              })}
            </Suspense>

            <OrbitControls
              target={[0, 0, 0]}
              enableZoom={true}
              enablePan={true}
              enableRotate={true}
              minPolarAngle={Math.PI / 2}
              maxPolarAngle={Math.PI / 2}
            />
          </Canvas>
        </div>

        {/* Right Sidebar */}
        <div
          style={{
            width: "380px",
            backgroundColor: COLORS.lodenGreenDark,
            padding: "30px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            overflowY: "auto",
          }}
        >
          <GameInfo
            selectedPiece={selectedPiece}
            currentPlayer={currentPlayer}
          />

          <div style={{ flex: 1, minHeight: 0 }}>
            <MoveLog moves={moveHistory} />
          </div>

          <ControlsInfo />
        </div>
      </div>
    </div>
  );
};

export default ChessboardScene;
