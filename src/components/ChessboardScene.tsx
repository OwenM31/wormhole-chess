import React, { Suspense, useState, useMemo } from "react";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF, Box } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { useSpring, a } from "@react-spring/three";
import * as THREE from "three";

// Global constants
const BOARD_SIZE = 170;
const BOARD_MIN = -85;
const BOARD_MAX = 85;
const GRID_COUNT = 8;
const SPACING = BOARD_SIZE / (GRID_COUNT - 1); // 24.285714

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"];

// Special wormhole squares
const SPECIAL_FILES = ["x", "y"];
const SPECIAL_RANKS = ["1", "2", "3", "4"];

// Pentagonal squares (corner squares of the central 4x4)
const PENTAGONAL_SQUARES = ["c3", "c6", "f3", "f6"];

// ==================== WORMHOLE TOPOLOGY ====================

// Define the wormhole connections and adjacencies
const WORMHOLE_CONNECTIONS: { [key: string]: string[] } = {
  // Top surface pentagonal connections
  c3: ["b3", "c2", "d3", "c4", "x1"], // x1 bridges the diagonal c3-d4
  c6: ["b6", "c7", "d6", "c5", "x4"], // x4 bridges the diagonal c6-d5
  f3: ["g3", "f2", "e3", "f4", "y1"], // y1 bridges the diagonal f3-e4
  f6: ["g6", "f7", "e6", "f5", "y4"], // y4 bridges the diagonal f6-e5

  // Bottom surface pentagonal connections (primed)
  "c3'": ["b3'", "c2'", "d3'", "c4'", "x1'"],
  "c6'": ["b6'", "c7'", "d6'", "c5'", "x4'"],
  "f3'": ["g3'", "f2'", "e3'", "f4'", "y1'"],
  "f6'": ["g6'", "f7'", "e6'", "f5'", "y4'"],

  // Special x squares connections
  x1: ["c3", "d4", "x2", "x1'"], // connects to c3 pentagonal edge and through wormhole
  x2: ["x1", "x3", "x2'"],
  x3: ["x2", "x4", "x3'"],
  x4: ["c6", "d5", "x3", "x4'"],

  "x1'": ["c3'", "d4'", "x2'", "x1"],
  "x2'": ["x1'", "x3'", "x2"],
  "x3'": ["x2'", "x4'", "x3"],
  "x4'": ["c6'", "d5'", "x3'", "x4"],

  // Special y squares connections
  y1: ["f3", "e4", "y2", "y1'"],
  y2: ["y1", "y3", "y2'"],
  y3: ["y2", "y4", "y3'"],
  y4: ["f6", "e5", "y3", "y4'"],

  "y1'": ["f3'", "e4'", "y2'", "y1"],
  "y2'": ["y1'", "y3'", "y2"],
  "y3'": ["y2'", "y4'", "y3"],
  "y4'": ["f6'", "e5'", "y3'", "y4"],

  // D-file wormhole connections
  d4: ["d3", "x1", "d4'"], // d4 connects through wormhole to d4'
  d5: ["d6", "x4", "d5'"],
  "d4'": ["d3'", "x1'", "d4"],
  "d5'": ["d6'", "x4'", "d5"],

  // E-file wormhole connections
  e4: ["e3", "y1", "e4'"],
  e5: ["e6", "y4", "e5'"],
  "e4'": ["e3'", "y1'", "e4"],
  "e5'": ["e6'", "y4'", "e5"],
};

// Get world coordinates for special squares
const getSpecialSquarePosition = (
  notation: string
): [number, number, number] | null => {
  const isPrime = notation.endsWith("'");
  const cleanNotation = isPrime ? notation.slice(0, -1) : notation;
  const y = isPrime ? -25 : 25;

  // X squares are positioned between c and d files
  if (cleanNotation.startsWith("x")) {
    const rank = parseInt(cleanNotation[1]);
    const x = BOARD_MIN + 2.5 * SPACING; // Between c (2) and d (3)
    const z = BOARD_MIN + (rank + 1.5) * SPACING; // Offset for x1-x4
    return [x, y, z];
  }

  // Y squares are positioned between e and f files
  if (cleanNotation.startsWith("y")) {
    const rank = parseInt(cleanNotation[1]);
    const x = BOARD_MIN + 4.5 * SPACING; // Between e (4) and f (5)
    const z = BOARD_MIN + (rank + 1.5) * SPACING; // Offset for y1-y4
    return [x, y, z];
  }

  return null;
};

// ==================== COORDINATE CONVERSION FUNCTIONS ====================

// Converts world coordinates → grid coordinates
const worldToGrid = (x: number, z: number): [number, number] => {
  const gridX = Math.round((x - BOARD_MIN) / SPACING);
  const gridZ = Math.round((z - BOARD_MIN) / SPACING);
  return [
    Math.max(0, Math.min(GRID_COUNT - 1, gridX)),
    Math.max(0, Math.min(GRID_COUNT - 1, gridZ)),
  ];
};

// Converts grid coordinates → world coordinates
const gridToWorld = (
  gridX: number,
  gridZ: number,
  y: number
): [number, number, number] => {
  const worldX = BOARD_MIN + gridX * SPACING;
  const worldZ = BOARD_MIN + gridZ * SPACING;
  return [worldX, y, worldZ];
};

// Converts grid coordinates → chess notation
const gridToChess = (gridX: number, gridZ: number, y: number): string => {
  const file = FILES[gridX];
  const rank = RANKS[gridZ];
  const prime = y < 0 ? "'" : "";
  return `${file}${rank}${prime}`;
};

// Converts chess notation → grid coordinates
const chessToGrid = (notation: string): [number, number, number] | null => {
  const isPrime = notation.endsWith("'");
  const cleanNotation = isPrime ? notation.slice(0, -1) : notation;

  // Handle special squares
  if (cleanNotation.startsWith("x") || cleanNotation.startsWith("y")) {
    return null; // Special squares don't have grid coordinates
  }

  const file = cleanNotation[0];
  const rank = cleanNotation[1];

  const gridX = FILES.indexOf(file);
  const gridZ = RANKS.indexOf(rank);
  const y = isPrime ? -25 : 25;

  if (gridX === -1 || gridZ === -1) {
    throw new Error(`Invalid chess notation: ${notation}`);
  }

  return [gridX, gridZ, y];
};

// Converts chess notation → world coordinates
const chessToWorld = (notation: string): [number, number, number] => {
  // Check for special squares first
  const specialPos = getSpecialSquarePosition(notation);
  if (specialPos) return specialPos;

  // Handle regular squares
  const gridCoords = chessToGrid(notation);
  if (!gridCoords)
    throw new Error(`Cannot convert ${notation} to world coordinates`);

  const [gridX, gridZ, y] = gridCoords;
  return gridToWorld(gridX, gridZ, y);
};

// ==================== COMPONENTS ====================

const ChessboardModel: React.FC = () => {
  const gltf = useGLTF("/chessboard/wormhole-chessboard.glb") as GLTF;
  return <primitive object={gltf.scene} />;
};

// Interactive square component for move targets
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
  // Use different geometry for pentagonal squares
  const geometry = isPentagonal ? (
    <meshBasicMaterial
      color={isHighlighted ? "yellow" : "cyan"}
      opacity={isHighlighted ? 0.3 : 0.05}
      transparent
    />
  ) : (
    <meshBasicMaterial
      color={isHighlighted ? "yellow" : "white"}
      opacity={isHighlighted ? 0.3 : 0.01}
      transparent
    />
  );

  return (
    <Box
      position={position}
      args={isPentagonal ? [22, 0.5, 22] : [20, 0.5, 20]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSquareClick(position, notation);
      }}
    >
      {geometry}
    </Box>
  );
};

// Enhanced Rook component
const Rook: React.FC<{
  id: string;
  position: [number, number, number];
  notation: string;
  rotation?: [number, number, number];
  isSelected: boolean;
  onClick: (id: string, notation: string) => void;
}> = ({
  id,
  position,
  notation,
  rotation = [0, 0, 0],
  isSelected,
  onClick,
}) => {
  const gltf = useGLTF("chessboard/black-pieces/black-rook.glb") as GLTF;

  const { springPos } = useSpring({
    springPos: position,
    config: {
      mass: 1,
      tension: 200,
      friction: 20,
    },
  });

  return (
    <a.group
      position={springPos}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onClick(id, notation);
      }}
    >
      <primitive
        object={gltf.scene.clone()}
        rotation={rotation}
        scale={[1, 1, 1]}
      />

      {isSelected && (
        <Box position={[0, 0, 0]} args={[25, 25, 25]}>
          <meshBasicMaterial color="yellow" opacity={0.2} transparent />
        </Box>
      )}
    </a.group>
  );
};

useGLTF.preload("chessboard/black-pieces/black-rook.glb");

const ChessboardScene: React.FC = () => {
  // State for piece positions
  const [piecePositions, setPiecePositions] = useState<{
    [key: string]: string;
  }>({
    "top-rook-0": "a1",
    "top-rook-1": "a8",
    "top-rook-2": "h1",
    "top-rook-3": "h8",
    "bottom-rook-0": "a1'",
    "bottom-rook-1": "a8'",
    "bottom-rook-2": "h1'",
    "bottom-rook-3": "h8'",
  });

  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);

  // Generate all board squares including special wormhole squares
  const boardSquares = useMemo(() => {
    const squares: {
      position: [number, number, number];
      notation: string;
      key: string;
      isPentagonal: boolean;
    }[] = [];

    // Regular board squares
    for (let x = 0; x <= 7; x++) {
      for (let z = 0; z <= 7; z++) {
        // Top surface
        const topNotation = gridToChess(x, z, 25);
        const topPos = gridToWorld(x, z, 25);
        const isPentTop = PENTAGONAL_SQUARES.includes(topNotation);

        squares.push({
          position: topPos,
          notation: topNotation,
          key: `top-${x}-${z}`,
          isPentagonal: isPentTop,
        });

        // Bottom surface
        const bottomNotation = gridToChess(x, z, -25);
        const bottomPos = gridToWorld(x, z, -25);
        const isPentBottom = PENTAGONAL_SQUARES.includes(
          bottomNotation.replace("'", "")
        );

        squares.push({
          position: bottomPos,
          notation: bottomNotation,
          key: `bottom-${x}-${z}`,
          isPentagonal: isPentBottom,
        });
      }
    }

    // Add special wormhole squares
    for (const file of ["x", "y"]) {
      for (let rank = 1; rank <= 4; rank++) {
        const notation = `${file}${rank}`;
        const notationPrime = `${notation}'`;

        const pos = getSpecialSquarePosition(notation);
        const posPrime = getSpecialSquarePosition(notationPrime);

        if (pos) {
          squares.push({
            position: pos,
            notation: notation,
            key: `special-${notation}`,
            isPentagonal: false,
          });
        }

        if (posPrime) {
          squares.push({
            position: posPrime,
            notation: notationPrime,
            key: `special-${notationPrime}`,
            isPentagonal: false,
          });
        }
      }
    }

    return squares;
  }, []);

  // Enhanced rook move calculation with wormhole mechanics
  const calculateRookMoves = (notation: string): string[] => {
    const moves = new Set<string>();
    const visited = new Set<string>();

    console.log(`Calculating moves for rook at ${notation}`);

    // Helper function for recursive pathfinding through wormholes
    const explorePath = (
      current: string,
      direction: "file" | "rank" | "wormhole",
      startNotation: string
    ) => {
      if (visited.has(`${current}-${direction}`)) return;
      visited.add(`${current}-${direction}`);

      // Check for wormhole connections
      const connections = WORMHOLE_CONNECTIONS[current];
      if (connections) {
        connections.forEach((connected) => {
          if (connected !== startNotation) {
            moves.add(connected);

            // Continue exploring through wormhole connections
            if (connected.includes("'") !== current.includes("'")) {
              // This is a wormhole transition
              explorePath(connected, "wormhole", startNotation);
            }
          }
        });
      }

      // For regular squares, continue in straight lines
      const isPrime = current.endsWith("'");
      const cleanCurrent = isPrime ? current.slice(0, -1) : current;

      if (!cleanCurrent.startsWith("x") && !cleanCurrent.startsWith("y")) {
        const file = cleanCurrent[0];
        const rank = cleanCurrent[1];
        const fileIdx = FILES.indexOf(file);
        const rankIdx = RANKS.indexOf(rank);

        if (direction === "file" || direction === "wormhole") {
          // Continue along file
          for (let r = 0; r < 8; r++) {
            if (r !== rankIdx) {
              const newNotation = `${file}${RANKS[r]}${isPrime ? "'" : ""}`;

              // Check for wormhole interruption
              if (
                (file === "d" || file === "e") &&
                (RANKS[r] === "4" || RANKS[r] === "5")
              ) {
                // These squares connect through wormhole
                const wormholeSquare = `${file}${RANKS[r]}${
                  isPrime ? "'" : ""
                }`;
                if (WORMHOLE_CONNECTIONS[wormholeSquare]) {
                  moves.add(wormholeSquare);
                  explorePath(wormholeSquare, "wormhole", startNotation);
                }
              } else {
                moves.add(newNotation);
              }
            }
          }
        }

        if (direction === "rank" || direction === "wormhole") {
          // Continue along rank
          for (let f = 0; f < 8; f++) {
            if (f !== fileIdx) {
              const newNotation = `${FILES[f]}${rank}${isPrime ? "'" : ""}`;
              moves.add(newNotation);
            }
          }
        }
      }
    };

    // Start exploration
    explorePath(notation, "file", notation);
    explorePath(notation, "rank", notation);

    // Remove the starting position
    moves.delete(notation);

    const moveArray = Array.from(moves);
    console.log(
      `Generated ${moveArray.length} possible moves:`,
      moveArray.join(", ")
    );
    return moveArray;
  };

  // Handle piece selection
  const handlePieceClick = (pieceId: string, notation: string) => {
    console.log(`Piece clicked: ${pieceId} at ${notation}`);

    if (selectedPiece === pieceId) {
      console.log("Deselecting piece");
      setSelectedPiece(null);
      setPossibleMoves([]);
    } else {
      console.log(`Selecting piece at ${notation}`);
      setSelectedPiece(pieceId);
      const moves = calculateRookMoves(notation);
      setPossibleMoves(moves);
    }
  };

  // Handle square click for movement
  const handleSquareClick = (
    targetPosition: [number, number, number],
    targetNotation: string
  ) => {
    if (!selectedPiece) return;

    const isValidMove = possibleMoves.includes(targetNotation);

    if (isValidMove) {
      const isOccupied = Object.entries(piecePositions).some(
        ([id, notation]) => id !== selectedPiece && notation === targetNotation
      );

      if (!isOccupied) {
        const previousNotation = piecePositions[selectedPiece];
        setPiecePositions((prev) => ({
          ...prev,
          [selectedPiece]: targetNotation,
        }));
        console.log(
          `♜ Moved ${selectedPiece} from ${previousNotation} to ${targetNotation}`
        );

        setSelectedPiece(null);
        setPossibleMoves([]);
      } else {
        console.log(`Square ${targetNotation} is occupied`);
      }
    }
  };

  const isHighlightedSquare = (notation: string) => {
    return possibleMoves.includes(notation);
  };

  return (
    <Canvas
      camera={{ position: [100, 150, 200], fov: 50, near: 0.1, far: 1000 }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} />

      <Suspense fallback={null}>
        <ChessboardModel />

        {/* Board squares for click detection */}
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

        {/* Render rooks from state */}
        {Object.entries(piecePositions).map(([id, notation]) => {
          const worldPos = chessToWorld(notation);
          return (
            <Rook
              key={id}
              id={id}
              position={worldPos}
              notation={notation}
              rotation={notation.includes("'") ? [Math.PI, 0, 0] : [0, 0, 0]}
              isSelected={selectedPiece === id}
              onClick={handlePieceClick}
            />
          );
        })}
      </Suspense>

      <OrbitControls />
    </Canvas>
  );
};

export default ChessboardScene;
