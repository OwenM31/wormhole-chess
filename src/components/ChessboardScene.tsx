import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import * as THREE from "three";

const ChessboardModel: React.FC = () => {
  const gltf = useGLTF("/chessboard/wormhole-chessboard.glb") as GLTF;
  return <primitive object={gltf.scene} />;
};

// Rook component
const Rook: React.FC<{
  position: [number, number, number];
  rotation?: [number, number, number];
}> = ({ position, rotation = [0, 0, 0] }) => {
  const gltf = useGLTF("chessboard/black-pieces/black-rook.glb") as GLTF; // Update path to your rook model

  return (
    <primitive
      object={gltf.scene.clone()}
      position={position}
      rotation={rotation}
      scale={[1, 1, 1]} // Adjust scale as needed
    />
  );
};

// Preload the rook model
useGLTF.preload("chessboard/black-pieces/black-rook.glb");

const ChessboardScene: React.FC = () => {
  // Define corner positions for both playing surfaces
  const cornerPositions = {
    topSurface: [
      [-6.5, -6.5, 20], // Bottom-left
      [-6.5, 6.5, 20], // Top-left
      [6.5, -6.5, 20], // Bottom-right
      [90, 25, 90], // Top-right
    ],
    bottomSurface: [
      [-6.5, -6.5, -20], // Bottom-left
      [-6.5, 6.5, -20], // Top-left
      [6.5, -6.5, -20], // Bottom-right
      [6.5, 6.5, -20], // Top-right
    ],
  };

  return (
    <Canvas
      camera={{ position: [100, 150, 200], fov: 50, near: 0.1, far: 1000 }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} />

      <Suspense fallback={null}>
        <ChessboardModel />

        {/* Rooks on top surface (z = 20) */}
        {cornerPositions.topSurface.map((pos, index) => (
          <Rook
            key={`top-rook-${index}`}
            position={pos as [number, number, number]}
          />
        ))}

        {/* Rooks on bottom surface (z = -20) */}
        {/* These might need to be rotated 180 degrees around X axis to face the right way */}
        {cornerPositions.bottomSurface.map((pos, index) => (
          <Rook
            key={`bottom-rook-${index}`}
            position={pos as [number, number, number]}
            rotation={[Math.PI, 0, 0]} // Flip upside down for bottom surface
          />
        ))}
      </Suspense>

      <OrbitControls />
    </Canvas>
  );
};

export default ChessboardScene;
