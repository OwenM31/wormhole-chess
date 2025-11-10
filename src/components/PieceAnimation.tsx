import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

interface PieceProps {
  id: string;
  position: [number, number, number];
  color: "white" | "black";
  capturedPiece: string | null;
  onClick: () => void;
}

export default function Piece({ id, position, color, capturedPiece, onClick }: PieceProps) {
  const ref = useRef<THREE.Mesh>(null!);
  const isCaptured = capturedPiece === id;

  // shrink animation handled per-frame
  useFrame(() => {
    if (isCaptured && ref.current) {
      const scale = ref.current.scale.x;
      if (scale > 0.01) {
        const newScale = scale * 0.9; // shrink 10% each frame
        ref.current.scale.set(newScale, newScale, newScale);
      }
    } else if (ref.current && ref.current.scale.x < 1) {
      // ensure it resets to normal size when not captured
      ref.current.scale.set(1, 1, 1);
    }
  });

  return (
    <mesh ref={ref} position={position} onClick={onClick}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
