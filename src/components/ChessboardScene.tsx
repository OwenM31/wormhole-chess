import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib"; // import GLTF type

const ChessboardModel: React.FC = () => {
  const gltf = useGLTF("/chessboard/wormhole-chessboard.glb") as GLTF;
  return <primitive object={gltf.scene} />;
};

const ChessboardScene: React.FC = () => {
  return (
    <Canvas
      camera={{ position: [100, 150, 200], fov: 50, near: 0.1, far: 1000 }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} />

      <Suspense fallback={null}>
        <ChessboardModel />
      </Suspense>

      <OrbitControls />
    </Canvas>
  );
};

export default ChessboardScene;
