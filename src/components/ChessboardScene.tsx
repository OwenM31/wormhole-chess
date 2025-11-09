import React, { Suspense, useState, useMemo, useEffect } from "react";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF, Box } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { useSpring, a } from "@react-spring/three";
import * as THREE from "three";
import { Directions, boardGraph } from "./WormholeTopology";
import { COLORS, PIECE_SPEED, PENTAGONAL_SQUARES, BOARD_MAX, BOARD_MIN, BOARD_SIZE, GRID_COUNT, SPACING, FILES, RANKS, OUTER_LAYER_SCALE, 
  OUTER_LAYER_SQUARES, OUTER_LAYER_TILT, INNER_LAYER_SCALE, INNER_LAYER_SQUARES, INNER_LAYER_TILT} from "./Constants";
import { getInnerLayerAngle, getOuterLayerAngle, getPieceWormholeRotation, getRotationTowardsOrigin, getWormholeSquarePosition, 
  getWormholeTransform, torusPoint, TORUS_MAJOR, OUTER_MINOR, OUTER_PHI, INNER_PHI, INNER_MINOR} from "./WormholeGeometry";
import { gridToChess, gridToWorld, chessToGrid, chessToWorld, } from "./CoordinateConversion";

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

// Preload piece models
useGLTF.preload("chessboard/white-pieces/white-rook.glb");

useGLTF.preload("chessboard/black-pieces/black-rook.glb");

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
  currentPlayer: "white" | "black";
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
            {currentPlayer}
          </div>
        </div>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor:
              currentPlayer === "white"
                ? COLORS.warmWhite
                : COLORS.charcoalLight,
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
  color: "white" | "black";
  modelPath: string; // e.g. "chessboard/white-pieces/white-rook.glb"
  position: [number, number, number];
  notation: string;
  rotation?: [number, number, number];
  isSelected: boolean;
  onClick: (id: string, notation: string) => void;
}

const ChessPiece: React.FC<ChessPieceProps> = ({
  id,
  color,
  modelPath,
  position,
  notation,
  rotation = [0, 0, 0],
  isSelected,
  onClick,
}) => {
  const gltf = useGLTF(modelPath) as GLTF;
  const transform = getWormholeTransform(notation);
  const wormholeRotation = getPieceWormholeRotation(notation);

  const baseRotation: [number, number, number] = [
    Math.PI / 2,
    0,
    notation.includes("'") ? Math.PI : 0,
  ];

  const finalRotation: [number, number, number] = [
    baseRotation[0] + rotation[0] + wormholeRotation[0],
    baseRotation[1] + rotation[1] + wormholeRotation[1],
    baseRotation[2] + rotation[2] + wormholeRotation[2],
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
      <primitive object={gltf.scene.clone()} scale={[1, 1, 1]} />
      {isSelected && (
        <Box position={[0, 0, 0]} args={[25, 25, 25]}>
          <meshBasicMaterial color="yellow" opacity={0.2} transparent />
        </Box>
      )}
    </a.group>
  );
};

const Bishop: React.FC<
  Omit<ChessPieceProps, "modelPath" | "color"> & { color: "white" | "black" }
> = (props) => {
  const modelPath = `chessboard/${props.color}-pieces/${props.color}-bishop.glb`;
  return <ChessPiece {...props} modelPath={modelPath} />;
};

const Rook: React.FC<
  Omit<ChessPieceProps, "modelPath" | "color"> & { color: "white" | "black" }
> = (props) => {
  const modelPath = `chessboard/${props.color}-pieces/${props.color}-rook.glb`;
  return <ChessPiece {...props} modelPath={modelPath} />;
};

// preload models
useGLTF.preload("chessboard/white-pieces/white-rook.glb");
useGLTF.preload("chessboard/black-pieces/black-rook.glb");

// preload models
useGLTF.preload("chessboard/white-pieces/white-bishop.glb");
useGLTF.preload("chessboard/black-pieces/black-bishop.glb");

// ==================== MAIN COMPONENT ====================

const ChessboardScene: React.FC = () => {
  const [piecePositions, setPiecePositions] = useState<Record<string, string>>({
    "white-rook-a1": "a1",
    "white-rook-h1": "h1",
    "black-rook-a8": "a8",
    "black-rook-h8": "h8",
    "white-bishop-c1": "c1",
    "white-bishop-f1": "f1",
    "black-bishop-c8": "c8",
    "black-bishop-f8": "f8",
  });

  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
  const [possibleMovePaths, setPossibleMovePaths] = useState<
    Record<string, string[]>
  >({});
  const [movePaths, setMovePaths] = useState<Record<string, string[]>>({});
  const [moveHistory, setMoveHistory] = useState<MoveLogEntry[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<"white" | "black">(
    "white"
  );

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

  type EntryDir = keyof Directions; // "N" | "S" | "E" | "W" | "in" | "out" | "cw" | "ccw" | "NW" | "NE" | "SW" | "SE"

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
    piecePositions: Record<string, string>,
    pieceColor: "white" | "black"
  ): { moves: string[]; paths: Record<string, string[]> } => {
    const moves = new Set<string>();
    const paths = new Map<string, string[]>();

    const occupiedByColor = Object.fromEntries(
      Object.entries(piecePositions).map(([id, notation]) => [
        notation,
        id.startsWith("white") ? "white" : "black",
      ])
    );

    // Helper to get the opposite direction
    const oppositeDir: Record<EntryDir, EntryDir> = {
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

    const outDir: Record<string, EntryDir> = {
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

    const inDir: Record<string, EntryDir> = {
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
      dir: EntryDir,
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

      if (next in occupiedByColor) {
        if (occupiedByColor[next] !== pieceColor) {
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

      let nextDir: EntryDir = dir;
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
    const initialDirs: EntryDir[] = [
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
    piecePositions: Record<string, string>,
    pieceColor: "white" | "black"
  ): { moves: string[]; paths: Record<string, string[]> } => {
    const moves = new Set<string>();
    const paths = new Map<string, string[]>();

    const occupiedByColor = Object.fromEntries(
      Object.entries(piecePositions).map(([id, notation]) => [
        notation,
        id.startsWith("white") ? "white" : "black",
      ])
    );

    const inDir: Record<string, Record<string, EntryDir>> = {
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

    const outDir: Record<string, Record<string, EntryDir>> = {
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
      dir: EntryDir,
      visitedLine: Set<string>,
      pathsSoFar: string[]
    ) => {
      const node = boardGraph[current];
      if (!node) {
        return;
      }

      // \/\/\/ handle in/out transitions for diagonal moves \/\/\/
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

      if (next in occupiedByColor) {
        if (occupiedByColor[next] !== pieceColor) {
          moves.add(next); // Can capture opponent piece
          paths.set(next, newPath);
        }
        return;
      }

      moves.add(next);
      paths.set(next, newPath);

      const currentPrime = current.endsWith("'");
      const nextPrime = next.endsWith("'");
      let nextDir: EntryDir = dir;
      if (currentPrime !== nextPrime) {
        if (dir === "idl") nextDir = "odl";
        else if (dir === "idr") nextDir = "odr";
      }

      if (pentagonDiagonalExits[next]) {
        const branches = pentagonDiagonalExits[next][dir] || [];
        for (const branch of branches) {
          traverseDiagonal(next, branch, new Set(visitedLine), newPath); // clone visited for each branch
        }
      } else {
        traverseDiagonal(next, nextDir, visitedLine, newPath);
      }
    };
    const initialDirs: EntryDir[] = [
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

  // ==================== GENERIC PIECE COMPONENT ====================

  interface ChessPieceProps {
    id: string;
    color: "white" | "black";
    modelPath: string; // e.g. "chessboard/white-pieces/white-rook.glb"
    position: [number, number, number];
    notation: string;
    rotation?: [number, number, number];
    isSelected: boolean;
    onClick: (id: string, notation: string) => void;
  }

  const ChessPiece: React.FC<ChessPieceProps & { movePath?: string[] }> = ({
    id,
    color,
    modelPath,
    position,
    notation,
    rotation = [0, 0, 0],
    isSelected,
    onClick,
    movePath = [],
  }) => {
    const gltf = useGLTF(modelPath) as GLTF;
    const transform = getWormholeTransform(notation);
    const wormholeRotation = getPieceWormholeRotation(notation);

    const baseRotation: [number, number, number] = [
      Math.PI / 2,
      0,
      notation.includes("'") ? Math.PI : 0,
    ];

    const finalRotation: [number, number, number] = [
      baseRotation[0] + rotation[0] + wormholeRotation[0],
      baseRotation[1] + rotation[1] + wormholeRotation[1],
      baseRotation[2] + rotation[2] + wormholeRotation[2],
    ];

    const worldPath = useMemo(
      () =>
        movePath.map(
          (notation) => new THREE.Vector3(...chessToWorld(notation))
        ),
      [movePath]
    );

    const [animatedPosition, setAnimatedPosition] = useState(
      new THREE.Vector3(...position)
    );

    useEffect(() => {
      if (!worldPath.length) return;

      let t = 0;
      let segment = 0;
      let start = worldPath[0].clone();
      let end = worldPath[1].clone();

      let frame: number;
      const speed = 1.5;

      const animate = () => {
        if (!end) return;

        t += 0.02 * speed;

        if (t > 1) {
          segment++;
          if (segment >= worldPath.length - 1) {
            setAnimatedPosition(worldPath[worldPath.length - 1]);
            return;
          }
          start = worldPath[segment];
          end = worldPath[segment + 1];
          t = 0;
        }
        const current = start.clone().lerp(end, t);
        setAnimatedPosition(current);

        frame = requestAnimationFrame(animate);
      };

      frame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(frame);
    }, [movePath]);

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
        <primitive object={gltf.scene.clone()} scale={[1, 1, 1]} />
        {isSelected && (
          <Box position={[0, 0, 0]} args={[25, 25, 25]}>
            <meshBasicMaterial color="yellow" opacity={0.2} transparent />
          </Box>
        )}
      </a.group>
    );
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

  const handlePieceClick = (pieceId: string, notation: string) => {
    if (selectedPiece === pieceId) {
      setSelectedPiece(null);
      setPossibleMoves([]);
      setPossibleMovePaths({});
      return;
    }

    setSelectedPiece(pieceId);

    const color = pieceId.startsWith("white") ? "white" : "black";

    let moves: string[] = [];
    let paths: Record<string, string[]> = {};
    if (pieceId.includes("rook")) {
      const result = calculateOrthogonalMoves(notation, piecePositions, color);
      moves = result.moves;
      paths = result.paths;
    } else if (pieceId.includes("bishop")) {
      const result = calculateDiagonalMoves(notation, piecePositions, color);
      moves = result.moves;
      paths = result.paths;
    }

    setPossibleMoves(moves);
    setPossibleMovePaths(paths);
  };

  const animatePieceAlongPath = async (
    pieceId: string,
    pathNotations: string[]
  ) => {
    const delay = PIECE_SPEED; // milliseconds per step
    for (let i = 0; i < pathNotations.length; i++) {
      const notation = pathNotations[i];

      setPiecePositions((prev) => ({
        ...prev,
        [pieceId]: notation,
      }));

      // Add optional capture check
      if (i === pathNotations.length - 1) {
        // End of path → check if capturing
        const targetPiece = Object.entries(piecePositions).find(
          ([id, pos]) => pos === notation && id !== pieceId
        );
        if (targetPiece) {
          const [capturedId] = targetPiece;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // End animation
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

    // Disable interactions while animating
    setAnimatingPiece(selectedPiece);
    setSelectedPiece(null);
    setPossibleMoves([]);

    animatePieceAlongPath(selectedPiece, pathNotations);

    setMoveHistory((prev) => [
      ...prev,
      {
        moveNumber: prev.length + 1,
        piece: selectedPiece,
        from: piecePositions[selectedPiece],
        to: pathNotations[pathNotations.length - 1],
        timestamp: new Date(),
        isWormholeMove:
          pathNotations[0].includes("'") !==
          pathNotations[pathNotations.length - 1].includes("'"),
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
                const color = id.startsWith("white") ? "white" : "black";
                const pos = chessToWorld(notation);
                const isSelected = selectedPiece === id;

                if (id.includes("rook")) {
                  return (
                    <Rook
                      key={id}
                      id={id}
                      color={color}
                      position={pos}
                      notation={notation}
                      isSelected={isSelected}
                      onClick={handlePieceClick}
                    />
                  );
                } else if (id.includes("bishop")) {
                  return (
                    <Bishop
                      key={id}
                      id={id}
                      color={color}
                      position={pos}
                      notation={notation}
                      isSelected={isSelected}
                      onClick={handlePieceClick}
                    />
                  );
                }
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
