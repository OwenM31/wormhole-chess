import React, { Suspense, useState, useMemo } from "react";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF, Box } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { useSpring, a } from "@react-spring/three";
import * as THREE from "three";

// Global constant
const BOARD_SIZE = 170;
const BOARD_MIN = -85;
const BOARD_MAX = 85;
const GRID_COUNT = 8;
const SPACING = BOARD_SIZE / (GRID_COUNT - 1); // 24.285714

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

const ChessboardModel: React.FC = () => {
  const gltf = useGLTF("/chessboard/wormhole-chessboard.glb") as GLTF;
  return <primitive object={gltf.scene} />;
};

// Interactive square component for move targets
const BoardSquare: React.FC<{
  position: [number, number, number];
  onSquareClick: (position: [number, number, number]) => void;
  isHighlighted: boolean;
}> = ({ position, onSquareClick, isHighlighted }) => {
  return (
    <Box
      position={position}
      args={[20, 0.5, 20]} // Size of each square
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSquareClick(position);
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
  rotation?: [number, number, number];
  isSelected: boolean;
  onClick: (id: string) => void;
}> = ({ id, position, rotation = [0, 0, 0], isSelected, onClick }) => {
  const gltf = useGLTF("chessboard/black-pieces/black-rook.glb") as GLTF;

  // Use react-spring to interpolate the position
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
        onClick(id);
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

// Preload the rook model
useGLTF.preload("chessboard/black-pieces/black-rook.glb");

const ChessboardScene: React.FC = () => {
  // State for piece positions - using an object with piece IDs as keys
  const [piecePositions, setPiecePositions] = useState<{
    [key: string]: [number, number, number];
  }>({
    "top-rook-0": [-85, 25, -85],
    "top-rook-1": [-85, 25, 85],
    "top-rook-2": [85, 25, -85],
    "top-rook-3": [85, 25, 85],
    "bottom-rook-0": [-85, -25, -85],
    "bottom-rook-1": [-85, -25, 85],
    "bottom-rook-2": [85, -25, -85],
    "bottom-rook-3": [85, -25, 85],
  });

  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<
    [number, number, number][]
  >([]);

  // Generate all board squares for click detection
  const boardSquares = useMemo(() => {
    const squares: { position: [number, number, number]; key: string }[] = [];
    for (let x = 0; x <= 7; x++) {
      for (let z = 0; z <= 7; z++) {
        // Top surface
        squares.push({
          position: gridToWorld(x, z, 25),
          key: `top-${x}-${z}`,
        });
        // Bottom surface
        squares.push({
          position: gridToWorld(x, z, -25),
          key: `bottom-${x}-${z}`,
        });
      }
    }
    return squares;
  }, []);

  // Calculate possible moves for a rook (horizontal and vertical lines)
  const calculateRookMoves = (
    position: [number, number, number]
  ): [number, number, number][] => {
    const moves: [number, number, number][] = [];
    const [currentX, y, currentZ] = position;
    const [gridX, gridZ] = worldToGrid(currentX, currentZ);

    console.log(`Calculating moves for position:`, position);
    console.log(`Grid coordinates:`, gridX, gridZ);

    // Horizontal moves (along X axis)
    for (let x = 0; x <= 7; x++) {
      if (x !== gridX) {
        const move = gridToWorld(x, gridZ, y);
        moves.push(move);
      }
    }

    // Vertical moves (along Z axis)
    for (let z = 0; z <= 7; z++) {
      if (z !== gridZ) {
        const move = gridToWorld(gridX, z, y);
        moves.push(move);
      }
    }

    console.log(`Generated ${moves.length} possible moves`);
    return moves;
  };

  // Handle piece selection
  const handlePieceClick = (pieceId: string) => {
    console.log(`Piece clicked: ${pieceId}`);

    if (selectedPiece === pieceId) {
      // Deselect if clicking the same piece
      console.log("Deselecting piece");
      setSelectedPiece(null);
      setPossibleMoves([]);
    } else {
      // Select new piece and calculate possible moves
      console.log("Selecting new piece");
      setSelectedPiece(pieceId);
      const position = piecePositions[pieceId];
      const moves = calculateRookMoves(position);
      setPossibleMoves(moves);
      console.log(`Possible moves: ${moves}`);
    }
  };

  // Handle square click for movement
  const handleSquareClick = (targetPosition: [number, number, number]) => {
    if (!selectedPiece) return;

    // Check if the target position is a valid move
    const isValidMove = possibleMoves.some(
      (move) =>
        Math.abs(move[0] - targetPosition[0]) < 1 &&
        Math.abs(move[1] - targetPosition[1]) < 1 &&
        Math.abs(move[2] - targetPosition[2]) < 1
    );

    if (isValidMove) {
      // Check if another piece is already at this position
      const isOccupied = Object.entries(piecePositions).some(
        ([id, pos]) =>
          id !== selectedPiece && // Don't check against itself
          Math.abs(pos[0] - targetPosition[0]) < 1 &&
          Math.abs(pos[1] - targetPosition[1]) < 1 &&
          Math.abs(pos[2] - targetPosition[2]) < 1
      );

      if (!isOccupied) {
        // Move the piece
        setPiecePositions((prev) => ({
          ...prev,
          [selectedPiece]: targetPosition,
        }));
        console.log(
          `Moved ${selectedPiece} to ${worldToGrid(
            targetPosition[0],
            targetPosition[2]
          )}`
        );

        // Clear selection
        setSelectedPiece(null);
        setPossibleMoves([]);
      }
    }
  };

  // Check if a square should be highlighted as a possible move
  const isHighlightedSquare = (position: [number, number, number]) => {
    return possibleMoves.some(
      (move) =>
        Math.abs(move[0] - position[0]) < 1 &&
        Math.abs(move[1] - position[1]) < 1 &&
        Math.abs(move[2] - position[2]) < 1
    );
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
            onSquareClick={handleSquareClick}
            isHighlighted={isHighlightedSquare(square.position)}
          />
        ))}

        {/* Render rooks from state */}
        {Object.entries(piecePositions).map(([id, position]) => (
          <Rook
            key={id}
            id={id}
            position={position}
            rotation={id.includes("bottom") ? [Math.PI, 0, 0] : [0, 0, 0]}
            isSelected={selectedPiece === id}
            onClick={handlePieceClick}
          />
        ))}
      </Suspense>

      <OrbitControls />
    </Canvas>
  );
};

export default ChessboardScene;
