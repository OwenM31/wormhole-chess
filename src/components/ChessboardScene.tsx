import React, { Suspense, useState, useRef } from "react";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import * as THREE from "three";

const ChessboardModel: React.FC = () => {
  const gltf = useGLTF("/chessboard/wormhole-chessboard.glb") as GLTF;
  return <primitive object={gltf.scene} />;
};

// Calculate the nearest valid square position
const snapToGrid = (
  x: number,
  z: number,
  y: number
): [number, number, number] => {
  // Assuming 8x8 board with squares at intervals of ~21.25 units
  // Board ranges from -85 to 85 (170 units total / 8 squares = 21.25 per square)
  const squareSize = 170 / 8;
  const boardMin = -85;
  const boardMax = 85;

  // Calculate grid positions (center of squares)
  const gridX = Math.round((x - boardMin) / squareSize) * squareSize + boardMin;
  const gridZ = Math.round((z - boardMin) / squareSize) * squareSize + boardMin;

  // Clamp to board boundaries
  const clampedX = Math.max(boardMin, Math.min(boardMax, gridX));
  const clampedZ = Math.max(boardMin, Math.min(boardMax, gridZ));

  // Determine which surface (top or bottom) based on current y position
  const surfaceY = y > 0 ? 25 : -25;

  return [clampedX, surfaceY, clampedZ];
};

// Rook component
const Rook: React.FC<{
  position: [number, number, number];
  rotation?: [number, number, number];
  onMove: (
    from: [number, number, number],
    to: [number, number, number]
  ) => void;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ position, rotation = [0, 0, 0], onMove, isSelected, onSelect }) => {
  const gltf = useGLTF("chessboard/black-pieces/black-rook.glb") as GLTF;
  const meshRef = useRef<THREE.Group>(null);

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect();
  };

  // Highlight selected piece
  const model = gltf.scene.clone();
  if (isSelected) {
    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        // Add emissive glow to selected piece
        if (mesh.material instanceof THREE.MeshStandardMaterial) {
          mesh.material = mesh.material.clone();
          mesh.material.emissive = new THREE.Color(0x444444);
          mesh.material.emissiveIntensity = 0.3;
        }
      }
    });
  }

  return (
    <primitive
      ref={meshRef}
      object={model}
      position={position}
      rotation={rotation}
      scale={[1, 1, 1]}
      onClick={handleClick}
    />
  );
};

// Board Square Indicator component
const BoardSquare: React.FC<{
  position: [number, number, number];
  onClick: () => void;
  highlighted?: boolean;
}> = ({ position, onClick, highlighted = false }) => {
  return (
    <mesh position={position} onClick={onClick} visible={highlighted}>
      <boxGeometry args={[20, 0.5, 20]} />
      <meshBasicMaterial color={0x00ff00} opacity={0.3} transparent={true} />
    </mesh>
  );
};

// Preload the rook model
useGLTF.preload("chessboard/black-pieces/black-rook.glb");

const ChessboardScene: React.FC = () => {
  const [selectedRookIndex, setSelectedRookIndex] = useState<number | null>(
    null
  );
  const [rookPositions, setRookPositions] = useState({
    topSurface: [
      [-85, 25, -85],
      [-85, 25, 85],
      [85, 25, -85],
      [85, 25, 85],
    ] as [number, number, number][],
    bottomSurface: [
      [-85, -25, -85],
      [-85, -25, 85],
      [85, -25, -85],
      [85, -25, 85],
    ] as [number, number, number][],
  });

  // Generate all possible square positions for move indicators
  const generateSquares = () => {
    const squares: [number, number, number][] = [];
    const squareSize = 170 / 8;
    const boardMin = -85;

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const x = boardMin + i * squareSize;
        const z = boardMin + j * squareSize;
        // Add squares for both surfaces
        squares.push([x, 25, z]);
        squares.push([x, -25, z]);
      }
    }
    return squares;
  };

  const allSquares = generateSquares();

  const handleRookMove = (
    rookIndex: number,
    surface: "topSurface" | "bottomSurface",
    from: [number, number, number],
    to: [number, number, number]
  ) => {
    setRookPositions((prev) => {
      const newPositions = { ...prev };
      newPositions[surface] = [...newPositions[surface]];
      newPositions[surface][rookIndex] = to;
      return newPositions;
    });
    setSelectedRookIndex(null);
  };

  const handleSquareClick = (squarePos: [number, number, number]) => {
    if (selectedRookIndex === null) return;

    const { index, surface } =
      selectedRookIndex < 4
        ? { index: selectedRookIndex, surface: "topSurface" as const }
        : { index: selectedRookIndex - 4, surface: "bottomSurface" as const };

    const currentPos = rookPositions[surface][index];
    const snappedPos = snapToGrid(squarePos[0], squarePos[2], squarePos[1]);

    handleRookMove(index, surface, currentPos, snappedPos);
  };

  const handleBoardClick = (event: ThreeEvent<MouseEvent>) => {
    if (selectedRookIndex === null) return;

    // Get intersection point with the board
    const point = event.point;
    const snappedPos = snapToGrid(point.x, point.z, point.y);

    const { index, surface } =
      selectedRookIndex < 4
        ? { index: selectedRookIndex, surface: "topSurface" as const }
        : { index: selectedRookIndex - 4, surface: "bottomSurface" as const };

    const currentPos = rookPositions[surface][index];
    handleRookMove(index, surface, currentPos, snappedPos);
  };

  return (
    <Canvas
      camera={{ position: [100, 150, 200], fov: 50, near: 0.1, far: 1000 }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} />

      <Suspense fallback={null}>
        <group onClick={handleBoardClick}>
          <ChessboardModel />
        </group>

        {/* Visual indicators for valid moves */}
        {selectedRookIndex !== null &&
          allSquares.map((pos, idx) => (
            <BoardSquare
              key={`square-${idx}`}
              position={pos}
              onClick={() => handleSquareClick(pos)}
              highlighted={true}
            />
          ))}

        {/* Rooks on top surface */}
        {rookPositions.topSurface.map((pos, index) => (
          <Rook
            key={`top-rook-${index}`}
            position={pos}
            onMove={(from, to) => handleRookMove(index, "topSurface", from, to)}
            isSelected={selectedRookIndex === index}
            onSelect={() =>
              setSelectedRookIndex(selectedRookIndex === index ? null : index)
            }
          />
        ))}

        {/* Rooks on bottom surface */}
        {rookPositions.bottomSurface.map((pos, index) => (
          <Rook
            key={`bottom-rook-${index}`}
            position={pos}
            rotation={[Math.PI, 0, 0]}
            onMove={(from, to) =>
              handleRookMove(index, "bottomSurface", from, to)
            }
            isSelected={selectedRookIndex === index + 4}
            onSelect={() =>
              setSelectedRookIndex(
                selectedRookIndex === index + 4 ? null : index + 4
              )
            }
          />
        ))}
      </Suspense>

      <OrbitControls />
    </Canvas>
  );
};

export default ChessboardScene;
