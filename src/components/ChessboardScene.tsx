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
const chessToGrid = (notation: string): [number, number, number] => {
  const isPrime = notation.endsWith("'");
  const cleanNotation = isPrime ? notation.slice(0, -1) : notation;

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

// Converts world coordinates → chess notation
const worldToChess = (x: number, y: number, z: number): string => {
  const [gridX, gridZ] = worldToGrid(x, z);
  return gridToChess(gridX, gridZ, y);
};

// Converts chess notation → world coordinates
const chessToWorld = (notation: string): [number, number, number] => {
  const [gridX, gridZ, y] = chessToGrid(notation);
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
}> = ({ position, notation, onSquareClick, isHighlighted }) => {
  return (
    <Box
      position={position}
      args={[20, 0.5, 20]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSquareClick(position, notation);
      }}
    >
      <meshBasicMaterial
        color={isHighlighted ? "yellow" : "white"}
        opacity={isHighlighted ? 0.3 : 0.01}
        transparent
      />
    </Box>
  );
};

// Enhanced Rook component with click functionality
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
  // State for piece positions - using chess notation as keys
  const [piecePositions, setPiecePositions] = useState<{
    [key: string]: string; // piece ID → chess notation
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
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]); // Now stores chess notation

  // Generate all board squares for click detection
  const boardSquares = useMemo(() => {
    const squares: {
      position: [number, number, number];
      notation: string;
      key: string;
    }[] = [];

    for (let x = 0; x <= 7; x++) {
      for (let z = 0; z <= 7; z++) {
        // Top surface
        const topPos = gridToWorld(x, z, 25);
        const topNotation = gridToChess(x, z, 25);
        squares.push({
          position: topPos,
          notation: topNotation,
          key: `top-${x}-${z}`,
        });

        // Bottom surface
        const bottomPos = gridToWorld(x, z, -25);
        const bottomNotation = gridToChess(x, z, -25);
        squares.push({
          position: bottomPos,
          notation: bottomNotation,
          key: `bottom-${x}-${z}`,
        });
      }
    }
    return squares;
  }, []);

  // Calculate possible moves for a rook (horizontal and vertical lines)
  const calculateRookMoves = (notation: string): string[] => {
    const moves: string[] = [];
    const [gridX, gridZ, y] = chessToGrid(notation);

    console.log(`Calculating moves for ${notation} (grid: ${gridX}, ${gridZ})`);

    // Horizontal moves (along X axis / files)
    for (let x = 0; x <= 7; x++) {
      if (x !== gridX) {
        const moveNotation = gridToChess(x, gridZ, y);
        moves.push(moveNotation);
      }
    }

    // Vertical moves (along Z axis / ranks)
    for (let z = 0; z <= 7; z++) {
      if (z !== gridZ) {
        const moveNotation = gridToChess(gridX, z, y);
        moves.push(moveNotation);
      }
    }

    console.log(`Generated ${moves.length} possible moves:`, moves.join(", "));
    return moves;
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

    // Check if the target notation is a valid move
    const isValidMove = possibleMoves.includes(targetNotation);

    if (isValidMove) {
      // Check if another piece is already at this position
      const isOccupied = Object.entries(piecePositions).some(
        ([id, notation]) => id !== selectedPiece && notation === targetNotation
      );

      if (!isOccupied) {
        // Move the piece
        const previousNotation = piecePositions[selectedPiece];
        setPiecePositions((prev) => ({
          ...prev,
          [selectedPiece]: targetNotation,
        }));
        console.log(
          `♜ Moved ${selectedPiece} from ${previousNotation} to ${targetNotation}`
        );

        // Clear selection
        setSelectedPiece(null);
        setPossibleMoves([]);
      } else {
        console.log(`Square ${targetNotation} is occupied`);
      }
    }
  };

  // Check if a square should be highlighted as a possible move
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
