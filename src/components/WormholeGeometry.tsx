import { OUTER_LAYER_SCALE, OUTER_LAYER_SQUARES, INNER_LAYER_SQUARES, INNER_LAYER_SCALE, INNER_LAYER_TILT, OUTER_LAYER_TILT, } from "./Constants";
import { chessToGrid, } from "./CoordinateConversion";
import * as THREE from "three";

// ==================== WORMHOLE GEOMETRY ====================

export const getInnerLayerAngle = (notation: string): number => {
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
  const startAngle = -Math.PI * 0.5 - 0.25;
  const angleStep = (Math.PI * 2) / sequence.length;
  return startAngle - index * angleStep;
};

export const getOuterLayerAngle = (notation: string): number => {
  const cleanNotation = notation.replace("'", "");
  const sequence = [
    "d3",
    "c3",
    "c4",
    "c5",
    "c6",
    "d6",
    "e6",
    "f6",
    "f5",
    "f4",
    "f3",
    "e3",
  ];
  const index = sequence.indexOf(cleanNotation);
  if (index === -1) return 0;
  const startAngle = -Math.PI * 0.5 - 0.25;
  const angleStep = (Math.PI * 2) / sequence.length;
  return startAngle - index * angleStep;
};

// ----------------- TORUS / WORMHOLE PARAMETERS -----------------
export const TORUS_MAJOR = 15; // distance from origin to center of the tube (controls where the ring sits in XY)
export const OUTER_MINOR = 35; // tube radius for outer layer (bigger => sits closer to the planes)
export const INNER_MINOR = 22.5; // tube radius for inner layer (smaller => deeper into the donut)
export const OUTER_PHI = Math.PI / 5; // minor-angle for outer layer (positive = towards top plane)
export const INNER_PHI = Math.PI / 7 - 0.1; // minor-angle for inner layer (smaller = closer to the midline)

// Helper: torus param -> world coords
// theta: angle around the donut center (0..2pi), phi: angle around the tube (-pi/2..pi/2)
// R = TORUS_MAJOR, r = minorRadius
export const torusPoint = (
  theta: number,
  phi: number,
  minorRadius: number
): [number, number, number] => {
  const R = TORUS_MAJOR;
  const r = minorRadius;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);

  const x = (R + r * cosPhi) * cosTheta;
  const y = (R + r * cosPhi) * sinTheta;
  const z = r * sinPhi;
  return [x, y, z];
};

export const getWormholeSquarePosition = (
  notation: string,
  baseZ: number
): [number, number, number] => {
  const cleanNotation = notation.replace("'", "");
  const isPrime = notation.endsWith("'");

  // Outer layer squares (the ones listed in OUTER_LAYER_SQUARES) should be placed
  // on a slightly larger tube radius and closer to the top/bottom planes.
  if (OUTER_LAYER_SQUARES.includes(cleanNotation)) {
    // convert the grid world X/Y (the original top/bottom grid locations) to an angle
    const gridCoords = chessToGrid(notation);
    if (!gridCoords) return [0, 0, baseZ];
    const theta = getOuterLayerAngle(notation);
    const minor = OUTER_MINOR;
    const phi = OUTER_PHI;
    const [x, y, rawZ] = torusPoint(theta, phi, minor);
    const z = isPrime ? -rawZ : rawZ;
    return [x, y, z];
  }

  // Inner layer squares that are not x/y (i.e. d4, d5, e4, e5, etc.)
  if (INNER_LAYER_SQUARES.includes(cleanNotation)) {
    // For these we will use the same theta approach but a smaller minor radius (pulled inward)
    const theta = getInnerLayerAngle(notation);
    const minor = INNER_MINOR;
    const phi = INNER_PHI;
    const [x, y, rawZ] = torusPoint(theta, phi, minor);
    const z = isPrime ? -rawZ : rawZ;
    return [x, y, z];
    // inner layer sits more central on the donut: use smaller phi magnitude
  }

  // Fallback: non-wormhole squares stay in their original grid planes
  return [0, 0, baseZ];
};

export const getWormholeTransform = (
  notation: string
): {
  scale: number;
  tilt: number;
  zOffset: number;
} => {
  const cleanNotation = notation.replace("'", "");
  if (INNER_LAYER_SQUARES.includes(cleanNotation)) {
    return { scale: INNER_LAYER_SCALE, tilt: INNER_LAYER_TILT, zOffset: 0 };
  }
  if (OUTER_LAYER_SQUARES.includes(cleanNotation)) {
    return { scale: OUTER_LAYER_SCALE, tilt: OUTER_LAYER_TILT, zOffset: 0 };
  }
  return { scale: 1, tilt: 0, zOffset: 0 };
};

export const getRotationTowardsOrigin = (
  position: [number, number, number],
  notation: string,
  tilt: number
): [number, number, number] => {
  const cleanNotation = notation.replace("'", "");
  const isPrime = notation.endsWith("'");

  if (
    !OUTER_LAYER_SQUARES.includes(cleanNotation) &&
    !INNER_LAYER_SQUARES.includes(cleanNotation)
  ) {
    return [0, 0, 0];
  }

  const [x, y, z] = position;
  const dir = new THREE.Vector3(-x, -y, -z).normalize();

  // Avoid zero-length axis
  const normal = new THREE.Vector3(0, 0, 1);
  let axis = new THREE.Vector3().crossVectors(normal, dir);
  if (axis.length() < 1e-4) {
    axis = new THREE.Vector3(1, 0, 0); // fallback axis
  } else {
    axis.normalize();
  }

  // Angle between normal and direction
  const fullAngle = Math.acos(THREE.MathUtils.clamp(normal.dot(dir), -1, 1));

  // Limit tilt
  const angle = Math.min(fullAngle, tilt);
  const effectiveAngle = isPrime ? -angle : angle;

  const quat = new THREE.Quaternion().setFromAxisAngle(axis, effectiveAngle);

  // Convert to Euler
  const euler = new THREE.Euler().setFromQuaternion(quat, "ZYX"); // ZYX is usually more stable
  return [euler.x, euler.y, euler.z];
};

export const getPieceWormholeRotation = (
  notation: string
): [number, number, number] => {
  let rotation: THREE.Euler;

  switch (notation) {
    // c3 -> c6
    case "c3":
      rotation = new THREE.Euler(-1.6, 0, -1);
      break;
    case "c4":
      rotation = new THREE.Euler(-0.6, 0, -1);
      break;
    case "c5":
      rotation = new THREE.Euler(0.6, 0, -1);
      break;
    case "c6":
      rotation = new THREE.Euler(1.6, 0, -1);
      break;

    // d3 -> d6
    case "d3":
      rotation = new THREE.Euler(-1, -0.6, -0.6);
      break;
    case "d4":
      rotation = new THREE.Euler(-3, 1, 1);
      break;
    case "d5":
      rotation = new THREE.Euler(3, -1, 1);
      break;
    case "d6":
      rotation = new THREE.Euler(1, -0.6, -0.6);
      break;

    // x1 -> x4
    case "x1":
      rotation = new THREE.Euler(-1.6, 2, -0.8);
      break;
    case "x2":
      rotation = new THREE.Euler(-3, 3, -0.6);
      break;
    case "x3":
      rotation = new THREE.Euler(3, -3, -0.6);
      break;
    case "x4":
      rotation = new THREE.Euler(1.6, -2, -0.8);
      break;

    // y1 -> y4
    case "y1":
      rotation = new THREE.Euler(-1.6, -2, 0.8);
      break;
    case "y2":
      rotation = new THREE.Euler(-3, -3, -0.6);
      break;
    case "y3":
      rotation = new THREE.Euler(3, 3, 0.6);
      break;
    case "y4":
      rotation = new THREE.Euler(1.6, 2, 0.8);
      break;

    // e3 -> e6
    case "e3":
      rotation = new THREE.Euler(-1, 0.6, 0.6);
      break;
    case "e4":
      rotation = new THREE.Euler(-3, -1, -1);
      break;
    case "e5":
      rotation = new THREE.Euler(3, 1, -1);
      break;
    case "e6":
      rotation = new THREE.Euler(1, 0.6, 0.6);
      break;

    // f3 -> f6
    case "f3":
      rotation = new THREE.Euler(-1.6, 0, 1);
      break;
    case "f4":
      rotation = new THREE.Euler(-0.6, 0, 1);
      break;
    case "f5":
      rotation = new THREE.Euler(0.6, 0, 1);
      break;
    case "f6":
      rotation = new THREE.Euler(1.6, 0, 1);
      break;

    // FLIP SIDE

    // reflected c3' -> c6'
    case "c3'":
      rotation = new THREE.Euler(1.6, 0, 1);
      break;
    case "c4'":
      rotation = new THREE.Euler(0.6, 0, 1);
      break;
    case "c5'":
      rotation = new THREE.Euler(-0.6, 0, 1);
      break;
    case "c6'":
      rotation = new THREE.Euler(-1.6, 0, 1);
      break;

    // reflected d3' -> d6'
    case "d3'":
      rotation = new THREE.Euler(1, 0.6, -0.6);
      break;
    case "d4'":
      rotation = new THREE.Euler(3, 1, -1);
      break;
    case "d5'":
      rotation = new THREE.Euler(-3, -1, -1);
      break;
    case "d6'":
      rotation = new THREE.Euler(-1, 0.6, 0.6);
      break;

    default:
      rotation = new THREE.Euler(0, 0, 0);
      break;

    // reflected x1' -> x4'
    case "x1'":
      rotation = new THREE.Euler(1.6, 2, 0.8);
      break;
    case "x2'":
      rotation = new THREE.Euler(3, 3, 0.6);
      break;
    case "x3'":
      rotation = new THREE.Euler(-3, -3, 0.6);
      break;
    case "x4'":
      rotation = new THREE.Euler(-1.6, -2, 0.8);
      break;

    // reflected y1' -> y4'
    case "y1'":
      rotation = new THREE.Euler(1.6, -2, -0.8);
      break;
    case "y2'":
      rotation = new THREE.Euler(3, -3, 0.6);
      break;
    case "y3'":
      rotation = new THREE.Euler(-3, 3, -0.6);
      break;
    case "y4'":
      rotation = new THREE.Euler(-1.6, 2, -0.8);
      break;

    // reflected e3' -> e6'
    case "e3'":
      rotation = new THREE.Euler(1, 0.6, -0.6);
      break;
    case "e4'":
      rotation = new THREE.Euler(3, -1, 1);
      break;
    case "e5'":
      rotation = new THREE.Euler(-3, 1, 1);
      break;
    case "e6'":
      rotation = new THREE.Euler(-1, 0.6, -0.6);
      break;

    // reflected f3' -> f6'
    case "f3'":
      rotation = new THREE.Euler(1.6, 0, -1);
      break;
    case "f4'":
      rotation = new THREE.Euler(0.6, 0, -1);
      break;
    case "f5'":
      rotation = new THREE.Euler(-0.6, 0, -1);
      break;
    case "f6'":
      rotation = new THREE.Euler(-1.6, 0, -1);
      break;
  }

  const quat = new THREE.Quaternion().setFromEuler(rotation);
  return [quat.x, quat.y, quat.z];
};

