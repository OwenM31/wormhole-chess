import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

type PieceProps = {
  id: string;
  position: [number, number, number];
  color: string;
  capturedPiece: string | null;
  onClick: () => void;
};

export default function Piece({ 
    id,
    position,
    color, 
    capturedPiece, 
    onClick,
}: PieceProps ) {
  const meshRef = useRef<THREE.Group>(null);
  const isCaptured = capturedPiece === id;
  const shrinkSpeed = 1.0; // Adjust for speed

  useFrame((_, delta) => {
    
    if (meshRef.current) {
      if (isCaptured && meshRef.current.scale.x > 0) {
        // shrink smoothly
        meshRef.current.scale.multiplyScalar(1 - delta * shrinkSpeed);
        if (meshRef.current.scale.x < 0.01) {
          meshRef.current.scale.set(0, 0, 0);
        }
      }
    }
  });

  return (
    <group ref={meshRef} position={position} onClick={onClick}>
      {/* your piece geometry here */}
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}