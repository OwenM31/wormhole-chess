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

// Wormhole layer definitions
const OUTER_LAYER_SQUARES = [
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

const INNER_LAYER_SQUARES = [
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
const OUTER_LAYER_SCALE = 0.75; // 25% smaller
const INNER_LAYER_SCALE = 0.5; // 50% smaller
const OUTER_LAYER_TILT = Math.PI / 4; // 45 degrees
const INNER_LAYER_TILT = (Math.PI * 5) / 12; // 75 degrees

// Pentagonal squares
const PENTAGONAL_SQUARES = ["c3", "c6", "f3", "f6"];

// ==================== WORMHOLE TOPOLOGY ====================

const WORMHOLE_CONNECTIONS: { [key: string]: string[] } = {
  // Top surface pentagonal connections
  c3: ["b3", "c2", "d3", "c4", "x1"],
  c6: ["b6", "c7", "d6", "c5", "x4"],
  f3: ["g3", "f2", "e3", "f4", "y1"],
  f6: ["g6", "f7", "e6", "f5", "y4"],

  // Bottom surface pentagonal connections
  "c3'": ["b3'", "c2'", "d3'", "c4'", "x1'"],
  "c6'": ["b6'", "c7'", "d6'", "c5'", "x4'"],
  "f3'": ["g3'", "f2'", "e3'", "f4'", "y1'"],
  "f6'": ["g6'", "f7'", "e6'", "f5'", "y4'"],

  // Inner layer connections (clockwise from d4)
  d4: ["d3", "x1", "e4", "d4'"],
  x1: ["c3", "d4", "x2"],
  x2: ["x1", "x3"],
  x3: ["x2", "x4"],
  x4: ["x3", "c6", "d5"],
  d5: ["x4", "d6", "d5'"],
  e5: ["e6", "y4", "e5'"],
  y4: ["f6", "e5", "y3"],
  y3: ["y4", "y2"],
  y2: ["y3", "y1"],
  y1: ["y2", "f3", "e4"],
  e4: ["e3", "y1", "d4", "e4'"],

  // Prime versions
  "d4'": ["d3'", "x1'", "e4'", "d4"],
  "x1'": ["c3'", "d4'", "x2'"],
  "x2'": ["x1'", "x3'"],
  "x3'": ["x2'", "x4'"],
  "x4'": ["x3'", "c6'", "d5'"],
  "d5'": ["x4'", "d6'", "d5"],
  "e5'": ["e6'", "y4'", "e5"],
  "y4'": ["f6'", "e5'", "y3'"],
  "y3'": ["y4'", "y2'"],
  "y2'": ["y3'", "y1'"],
  "y1'": ["y2'", "f3'", "e4'"],
  "e4'": ["e3'", "y1'", "d4'", "e4"],

  // Outer layer connections
  d3: ["c3", "e3", "d4", "d2"],
  e3: ["d3", "f3", "e4", "e2"],
  c4: ["c3", "c5", "b4"],
  f4: ["f3", "f5", "g4"],
  c5: ["c4", "c6", "b5"],
  f5: ["f4", "f6", "g5"],
  d6: ["c6", "e6", "d5", "d7"],
  e6: ["d6", "f6", "e5", "e7"],

  "d3'": ["c3'", "e3'", "d4'", "d2'"],
  "e3'": ["d3'", "f3'", "e4'", "e2'"],
  "c4'": ["c3'", "c5'", "b4'"],
  "f4'": ["f3'", "f5'", "g4'"],
  "c5'": ["c4'", "c6'", "b5'"],
  "f5'": ["f4'", "f6'", "g5'"],
  "d6'": ["c6'", "e6'", "d5'", "d7'"],
  "e6'": ["d6'", "f6'", "e5'", "e7'"],
};

// ==================== WORMHOLE GEOMETRY ====================

// Get the angle (in radians) for inner layer squares arranged in a circle
const getInnerLayerAngle = (notation: string): number => {
  const cleanNotation = notation.replace("'", "");
  const sequence = [
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
  const index = sequence.indexOf(cleanNotation);

  if (index === -1) return 0;

  // Start at 6 o'clock (270 degrees) and go clockwise
  const startAngle = Math.PI * 1.5; // 270 degrees
  const angleStep = (Math.PI * 2) / sequence.length;
  return startAngle + index * angleStep;
};

// Calculate wormhole-adjusted position for special squares
const getWormholePosition = (
  notation: string,
  baseY: number
): [number, number, number] => {
  const cleanNotation = notation.replace("'", "");
  const isPrime = notation.endsWith("'");

  // For inner layer special squares (x1-x4, y1-y4)
  if (cleanNotation.startsWith("x") || cleanNotation.startsWith("y")) {
    const angle = getInnerLayerAngle(notation);
    const radius = SPACING * 0.6; // Distance from center for inner layer

    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    // Y position: move towards center (0) based on tilt
    const yOffset = Math.sin(INNER_LAYER_TILT) * radius * 0.5;
    const y = isPrime ? baseY + yOffset : baseY - yOffset;

    return [x, y, z];
  }

  return [0, baseY, 0]; // Fallback
};

// Get transformation properties for a square in the wormhole
const getWormholeTransform = (
  notation: string
): {
  scale: number;
  tilt: number;
  yOffset: number;
} => {
  const cleanNotation = notation.replace("'", "");

  if (INNER_LAYER_SQUARES.includes(cleanNotation)) {
    return {
      scale: INNER_LAYER_SCALE,
      tilt: INNER_LAYER_TILT,
      yOffset: 0,
    };
  }

  if (OUTER_LAYER_SQUARES.includes(cleanNotation)) {
    return {
      scale: OUTER_LAYER_SCALE,
      tilt: OUTER_LAYER_TILT,
      yOffset: 0,
    };
  }

  return { scale: 1, tilt: 0, yOffset: 0 };
};

// Calculate rotation to point towards origin
const getRotationTowardsOrigin = (
  position: [number, number, number],
  notation: string,
  tilt: number
): [number, number, number] => {
  const cleanNotation = notation.replace("'", "");
  const isPrime = notation.endsWith("'");

  // Inner layer or non-outer special squares → keep existing tilt logic
  if (INNER_LAYER_SQUARES.includes(cleanNotation)) {
    const angle = getInnerLayerAngle(notation);
    return [-tilt, angle, 0]; // still radial
  }

  // Outer squares
  if (OUTER_LAYER_SQUARES.includes(cleanNotation)) {
    // Determine base tilt
    let tiltX = -tilt; // default top layer
    if (cleanNotation.endsWith("3") || cleanNotation.endsWith("4")) {
      tiltX = tilt; // bottom-facing side mirrored
    }

    // Mirror for prime pieces
    if (isPrime) tiltX = -tiltX;

    // Side squares perpendicular
    if (["c4", "c5", "f4", "f5"].includes(cleanNotation)) {
      return [0, 0, tiltX]; // rotate along Z axis
    }

    // For top/bottom faces
    const angleXZ = Math.atan2(-position[0], -position[2]);
    return [tiltX, angleXZ, 0];
  }

  // Default no tilt
  return [0, 0, 0];
};

// ==================== COORDINATE CONVERSION FUNCTIONS ====================

const worldToGrid = (x: number, z: number): [number, number] => {
  const gridX = Math.round((x - BOARD_MIN) / SPACING);
  const gridZ = Math.round((z - BOARD_MIN) / SPACING);
  return [
    Math.max(0, Math.min(GRID_COUNT - 1, gridX)),
    Math.max(0, Math.min(GRID_COUNT - 1, gridZ)),
  ];
};

const gridToWorld = (
  gridX: number,
  gridZ: number,
  y: number
): [number, number, number] => {
  const worldX = BOARD_MIN + gridX * SPACING;
  const worldZ = BOARD_MIN + gridZ * SPACING;
  return [worldX, y, worldZ];
};

const gridToChess = (gridX: number, gridZ: number, y: number): string => {
  const file = FILES[gridX];
  const rank = RANKS[7 - gridZ]; // Reverse the rank order
  const prime = y < 0 ? "'" : "";
  return `${file}${rank}${prime}`;
};

const chessToGrid = (notation: string): [number, number, number] | null => {
  const isPrime = notation.endsWith("'");
  const cleanNotation = isPrime ? notation.slice(0, -1) : notation;

  if (cleanNotation.startsWith("x") || cleanNotation.startsWith("y")) {
    return null;
  }

  const file = cleanNotation[0];
  const rank = cleanNotation[1];

  const gridX = FILES.indexOf(file);
  const gridZ = 7 - RANKS.indexOf(rank); // Reverse the rank order
  const y = isPrime ? -25 : 25;

  if (gridX === -1 || gridZ === -1) {
    throw new Error(`Invalid chess notation: ${notation}`);
  }

  return [gridX, gridZ, y];
};

const chessToWorld = (notation: string): [number, number, number] => {
  const isPrime = notation.endsWith("'");
  const cleanNotation = notation.replace("'", "");
  const baseY = isPrime ? -25 : 25;

  // Handle special inner layer squares
  if (cleanNotation.startsWith("x") || cleanNotation.startsWith("y")) {
    return getWormholePosition(notation, baseY);
  }

  // Handle regular squares
  const gridCoords = chessToGrid(notation);
  if (!gridCoords)
    throw new Error(`Cannot convert ${notation} to world coordinates`);

  const [gridX, gridZ, y] = gridCoords;
  let [worldX, worldY, worldZ] = gridToWorld(gridX, gridZ, y);

  // Apply wormhole transformations for outer layer squares
  const transform = getWormholeTransform(notation);
  if (transform.tilt > 0) {
    // Calculate distance from center
    const distFromCenter = Math.sqrt(worldX * worldX + worldZ * worldZ);
    const yOffset = Math.sin(transform.tilt) * distFromCenter * 0.15;
    worldY = isPrime ? worldY + yOffset : worldY - yOffset;
  }

  return [worldX, worldY, worldZ];
};

// ==================== COMPONENTS ====================

const ChessboardModel: React.FC = () => {
  const gltf = useGLTF("/chessboard/wormhole-chessboard.glb") as GLTF;
  return <primitive object={gltf.scene} />;
};

// Interactive square component
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
      args={[boxSize, 0.5, boxSize]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSquareClick(position, notation);
      }}
    >
      <meshBasicMaterial
        color={isHighlighted ? "yellow" : isPentagonal ? "cyan" : "white"}
        opacity={isHighlighted ? 0.3 : isPentagonal ? 0.05 : 0.01}
        transparent
      />
    </Box>
  );
};

// Enhanced Rook component with wormhole transformations
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
  const transform = getWormholeTransform(notation);

  // Calculate wormhole rotation
  const wormholeRotation = getRotationTowardsOrigin(
    position,
    notation,
    transform.tilt
  );

  // Combine base rotation with wormhole rotation
  const finalRotation: [number, number, number] = [
    rotation[0] + wormholeRotation[0],
    rotation[1] + wormholeRotation[1],
    rotation[2] + wormholeRotation[2],
  ];

  const { springPos, springScale, springRot } = useSpring({
    springPos: position,
    springScale: transform.scale,
    springRot: finalRotation,
    config: {
      mass: 1,
      tension: 200,
      friction: 20,
    },
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

useGLTF.preload("chessboard/black-pieces/black-rook.glb");

const ChessboardScene: React.FC = () => {
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
        const topNotation = gridToChess(x, z, 25);
        const topPos = chessToWorld(topNotation);
        const isPentTop = PENTAGONAL_SQUARES.includes(topNotation);

        squares.push({
          position: topPos,
          notation: topNotation,
          key: `top-${x}-${z}`,
          isPentagonal: isPentTop,
        });

        const bottomNotation = gridToChess(x, z, -25);
        const bottomPos = chessToWorld(bottomNotation);
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

    // Add special wormhole squares (inner layer)
    const innerSquares = ["x1", "x2", "x3", "x4", "y1", "y2", "y3", "y4"];
    innerSquares.forEach((sq) => {
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

  // Calculate rook moves with wormhole mechanics
  const calculateRookMoves = (notation: string): string[] => {
    const moves = new Set<string>();
    const visited = new Set<string>();

    console.log(`🌀 Calculating moves for rook at ${notation}`);

    const explorePath = (
      current: string,
      direction: "file" | "rank" | "wormhole",
      startNotation: string
    ) => {
      if (visited.has(`${current}-${direction}`)) return;
      visited.add(`${current}-${direction}`);

      const connections = WORMHOLE_CONNECTIONS[current];
      if (connections) {
        connections.forEach((connected) => {
          if (connected !== startNotation) {
            moves.add(connected);

            if (connected.includes("'") !== current.includes("'")) {
              explorePath(connected, "wormhole", startNotation);
            }
          }
        });
      }

      const isPrime = current.endsWith("'");
      const cleanCurrent = isPrime ? current.slice(0, -1) : current;

      if (!cleanCurrent.startsWith("x") && !cleanCurrent.startsWith("y")) {
        const file = cleanCurrent[0];
        const rank = cleanCurrent[1];
        const fileIdx = FILES.indexOf(file);
        const rankIdx = RANKS.indexOf(rank);

        if (direction === "file" || direction === "wormhole") {
          for (let r = 0; r < 8; r++) {
            if (r !== rankIdx) {
              const newNotation = `${file}${RANKS[r]}${isPrime ? "'" : ""}`;
              moves.add(newNotation);
            }
          }
        }

        if (direction === "rank" || direction === "wormhole") {
          for (let f = 0; f < 8; f++) {
            if (f !== fileIdx) {
              const newNotation = `${FILES[f]}${rank}${isPrime ? "'" : ""}`;
              moves.add(newNotation);
            }
          }
        }
      }
    };

    explorePath(notation, "file", notation);
    explorePath(notation, "rank", notation);

    moves.delete(notation);

    const moveArray = Array.from(moves);
    console.log(`Generated ${moveArray.length} possible moves`);
    return moveArray;
  };

  const handlePieceClick = (pieceId: string, notation: string) => {
    console.log(`Piece clicked: ${pieceId} at ${notation}`);

    if (selectedPiece === pieceId) {
      setSelectedPiece(null);
      setPossibleMoves([]);
    } else {
      setSelectedPiece(pieceId);
      const moves = calculateRookMoves(notation);
      setPossibleMoves(moves);
    }
  };

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
    <Canvas camera={{ position: [0, 200, 0], fov: 50, near: 0.1, far: 1000 }}>
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
          const worldPos = chessToWorld(notation);
          const baseRotation: [number, number, number] = notation.includes("'")
            ? [Math.PI, 0, 0]
            : [0, 0, 0];

          return (
            <Rook
              key={id}
              id={id}
              position={worldPos}
              notation={notation}
              rotation={baseRotation}
              isSelected={selectedPiece === id}
              onClick={handlePieceClick}
            />
          );
        })}
      </Suspense>

      <OrbitControls
        target={[0, 0, 0]}
        enableZoom={true}
        enablePan={true}
        // Lock to top-down view (looking straight down the Y-axis)
        minAzimuthAngle={0}
        maxAzimuthAngle={0}
        // Allow rotation left/right to see the reverse side
        // No azimuth limits = full 360° horizontal rotation
      />
    </Canvas>
  );
};

export default ChessboardScene;
