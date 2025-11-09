import React, { Suspense, useState, useMemo, useEffect } from "react";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF, Box } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { useSpring, a } from "@react-spring/three";
import * as THREE from "three";

// Color Palette
const COLORS = {
  smokeyTaupe: "#8B7E74",
  lodenGreen: "#4C5C4C",
  warmWhite: "#FAF9F6",
  charcoal: "#2F2F2F",
  charcoalLight: "#3A3A3A",
  lodenGreenDark: "#3C493F",
  lodenGreenLight: "#5C6C5C",
  accent: "#D4AF37", // Gold accent for highlights
};

// Global constants
const BOARD_SIZE = 170;
const BOARD_MIN = -85;
const BOARD_MAX = 85;
const GRID_COUNT = 8;
const SPACING = BOARD_SIZE / (GRID_COUNT - 1);

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
const OUTER_LAYER_SCALE = 0.9;
const INNER_LAYER_SCALE = 0.75;
const OUTER_LAYER_TILT = Math.PI / 4;
const INNER_LAYER_TILT = (Math.PI * 5) / 12;

// Pentagonal squares
const PENTAGONAL_SQUARES = ["c3", "c6", "f3", "f6"];

// ==================== WORMHOLE TOPOLOGY ====================

type Directions = {
  // Orthogonal directions
  N?: string | null;
  E?: string | null;
  S?: string | null;
  W?: string | null;
  in?: string | null;
  out?: string | null;
  cw?: string | null;
  ccw?: string | null;

  // Diagonal directions
  NE?: string | null;
  SE?: string | null;
  SW?: string | null;
  NW?: string | null;

  // for diagonals on wormhole layers (from the piece's perspective)
  idl?: string | null; // inner diagonal left
  idr?: string | null; // inner diagonal right
  od?: string | null; // outer diagonal
  odl?: string | null; // outer diagonal left
  odr?: string | null; // outer diagonal right
};

const boardGraph: Record<string, Directions> = {
  a1: { N: "a2", E: "b1", S: null, W: null, NE: "b2" },
  a2: { N: "a3", E: "b2", S: "a1", W: null, NE: "b3", SE: "b1" },
  a3: { N: "a4", E: "b3", S: "a2", W: null, NE: "b4", SE: "b2" },
  a4: { N: "a5", E: "b4", S: "a3", W: null, NE: "b5", SE: "b3" },
  a5: { N: "a6", E: "b5", S: "a4", W: null, NE: "b6", SE: "b4" },
  a6: { N: "a7", E: "b6", S: "a5", W: null, NE: "b7", SE: "b5" },
  a7: { N: "a8", E: "b7", S: "a6", W: null, NE: "b8", SE: "b6" },
  a8: { N: null, E: "b8", S: "a7", W: null, SE: "b7" },

  b1: { N: "b2", E: "c1", S: null, W: "a1", NE: "c2", NW: "a2" },
  b2: {
    N: "b3",
    E: "c2",
    S: "b1",
    W: "a2",
    NE: "c3",
    SE: "c1",
    NW: "a3",
    SW: "a1",
  },
  b3: {
    N: "b4",
    E: "c3",
    S: "b2",
    W: "a3",
    NE: "c4",
    SE: "c2",
    NW: "a4",
    SW: "a2",
  },
  b4: {
    N: "b5",
    E: "c4",
    S: "b3",
    W: "a4",
    NE: "c5",
    SE: "c3",
    NW: "a5",
    SW: "a3",
  },
  b5: {
    N: "b6",
    E: "c5",
    S: "b4",
    W: "a5",
    NE: "c6",
    SE: "c4",
    NW: "a6",
    SW: "a4",
  },
  b6: {
    N: "b7",
    E: "c6",
    S: "b5",
    W: "a6",
    NE: "c7",
    SE: "c5",
    NW: "a7",
    SW: "a5",
  },
  b7: {
    N: "b8",
    E: "c7",
    S: "b6",
    W: "a7",
    NE: "c8",
    SE: "c6",
    NW: "a8",
    SW: "a6",
  },
  b8: {
    N: null,
    E: "c8",
    S: "b7",
    W: "a8",
    NE: null,
    SE: "c7",
    NW: null,
    SW: "a7",
  },

  c1: { N: "c2", E: "d1", S: null, W: "b1", NE: "d2", NW: "b2" },
  c2: {
    N: "c3",
    E: "d2",
    S: "c1",
    W: "b2",
    NE: "d3",
    SE: "d1",
    NW: "b3",
    SW: "b1",
  },
  c3: {
    N: "c4",
    E: "d3",
    S: "c2",
    W: "b3",
    in: "x1",
    cw: "c4",
    ccw: "d3",
    SW: "b2",
    NW: "b4",
    SE: "d2",
    idl: "x2",
    idr: "d4",
    odl: "d2",
    od: "b2",
    odr: "b4",
  },
  c4: {
    N: "c5",
    E: "x2",
    S: "c3",
    W: "b4",
    in: "x2",
    cw: "c5",
    ccw: "c3",
    SW: "b3",
    NW: "b5",
    NE: "x3",
    SE: "x1",
    idl: "x3",
    idr: "x1",
    odl: "b3",
    odr: "b5",
  },
  c5: {
    N: "c6",
    E: "x3",
    S: "c4",
    W: "b5",
    in: "x3",
    cw: "c6",
    ccw: "c4",
    SW: "b4",
    NW: "b6",
    NE: "x4",
    SE: "x2",
    idl: "x4",
    idr: "x2",
    odl: "b4",
    odr: "b6",
  },
  c6: {
    N: "c7",
    E: "d6",
    S: "c5",
    W: "b6",
    in: "x4",
    cw: "d6",
    ccw: "c5",
    SW: "b5",
    NW: "b7",
    NE: "d7",
    idl: "d5",
    idr: "x3",
    odl: "b5",
    od: "b7",
    odr: "d7",
  },
  c7: {
    N: "c8",
    E: "d7",
    S: "c6",
    W: "b7",
    NW: "b8",
    SW: "b6",
    NE: "d8",
    SE: "d6",
  },
  c8: { N: null, E: "d8", S: "c7", W: "b8", SW: "b7", SE: "d7" },

  x1: {
    out: "c3",
    cw: "x2",
    in: "x1'",
    ccw: "d4",
    idl: "x2'",
    idr: "d4'",
    odl: "d3",
    odr: "c4",
  },
  x2: {
    out: "c4",
    cw: "x3",
    in: "x2'",
    ccw: "x1",
    idl: "x3'",
    idr: "x1'",
    odl: "c3",
    odr: "c5",
  },
  x3: {
    out: "c5",
    cw: "x4",
    in: "x3'",
    ccw: "x2",
    idl: "x4'",
    idr: "x2'",
    odl: "c4",
    odr: "c6",
  },
  x4: {
    out: "c6",
    cw: "d5",
    in: "x4'",
    ccw: "x3",
    idl: "d5'",
    idr: "x3'",
    odl: "c5",
    odr: "d6",
  },

  d1: { N: "d2", E: "e1", S: null, W: "c1", NE: "e2", NW: "c2" },
  d2: {
    N: "d3",
    E: "e2",
    S: "d1",
    W: "c2",
    NE: "e3",
    SE: "e1",
    NW: "c3",
    SW: "c1",
  },
  d3: {
    N: "d4",
    E: "e3",
    S: "d2",
    W: "c3",
    in: "d4",
    out: "d2",
    cw: "c3",
    ccw: "e3",
    NE: "e4",
    SE: "e2",
    NW: "x1",
    SW: "c2",
    idl: "x1",
    idr: "e4",
    odl: "e2",
    odr: "c2",
  },
  d4: {
    N: "d4'",
    S: "d3",
    in: "d4'",
    out: "d3",
    cw: "x1",
    ccw: "e4",
    NE: "e4'",
    SE: "e3",
    NW: "x1'",
    SW: "c3",
    idl: "x1'",
    idr: "e4'",
    odl: "e3",
    odr: "c3",
  },
  d5: {
    N: "d6",
    S: "d5'",
    in: "d5'",
    out: "d6",
    cw: "e5",
    ccw: "x4",
    NE: "e6",
    SE: "e5'",
    NW: "c6",
    SW: "x4'",
    idl: "e5'",
    idr: "x4'",
    odl: "c6",
    odr: "e6",
  },
  d6: {
    N: "d7",
    E: "e6",
    S: "d5",
    W: "c6",
    in: "d5",
    out: "d7",
    cw: "e6",
    ccw: "c6",
    NE: "e7",
    SE: "e5",
    NW: "c7",
    SW: "x4",
    idl: "e5",
    idr: "x4",
    odl: "c7",
    odr: "e7",
  },
  d7: {
    N: "d8",
    E: "e7",
    S: "d6",
    W: "c7",
    NE: "e8",
    SE: "e6",
    NW: "c8",
    SW: "c6",
  },
  d8: { N: null, E: "e8", S: "d7", W: "c8", SW: "c7", SE: "e7" },

  e1: { N: "e2", E: "f1", S: null, W: "d1", NE: "f2", NW: "d2" },
  e2: {
    N: "e3",
    E: "f2",
    S: "e1",
    W: "d2",
    NE: "f3",
    SE: "f1",
    NW: "d3",
    SW: "d1",
  },
  e3: {
    N: "e4",
    E: "f3",
    S: "e2",
    W: "d3",
    in: "e4",
    out: "e2",
    cw: "d3",
    ccw: "f3",
    NW: "d4",
    NE: "y1",
    SE: "f2",
    SW: "d2",
    idl: "d4",
    idr: "y1",
    odl: "f2",
    odr: "d2",
  },
  e4: {
    N: "e4'",
    S: "e3",
    in: "e4'",
    out: "e3",
    cw: "d4",
    ccw: "y1",
    NE: "y1'",
    NW: "d4'",
    SE: "f3",
    SW: "d3",
    idl: "d4'",
    idr: "y1'",
    odl: "f3",
    odr: "d3",
  },
  e5: {
    N: "e6",
    S: "e5'",
    in: "e5'",
    out: "e6",
    cw: "y4",
    ccw: "d5",
    NE: "f6",
    SE: "y4'",
    NW: "d6",
    SW: "d5'",
    idl: "y4'",
    idr: "d5'",
    odl: "d6",
    odr: "f6",
  },
  e6: {
    N: "e7",
    E: "f6",
    S: "e5",
    W: "d6",
    in: "e5",
    out: "e7",
    cw: "f6",
    ccw: "d6",
    NE: "f7",
    SE: "y4",
    NW: "d7",
    SW: "d5",
    idl: "y4",
    idr: "d5",
    odl: "d7",
    odr: "f7",
  },
  e7: {
    N: "e8",
    E: "f7",
    S: "e6",
    W: "d7",
    NE: "f8",
    SE: "f6",
    NW: "d8",
    SW: "d6",
  },
  e8: { N: null, E: "f8", S: "e7", W: "d8", SW: "d7", SE: "f7" },

  y1: {
    in: "y1'",
    out: "f3",
    cw: "e4",
    ccw: "y2",
    idl: "e4'",
    idr: "y2'",
    odl: "f4",
    odr: "e3",
  },
  y2: {
    in: "y2'",
    out: "f4",
    cw: "y1",
    ccw: "y3",
    idl: "y1'",
    idr: "y3'",
    odl: "f5",
    odr: "f3",
  },
  y3: {
    in: "y3'",
    out: "f5",
    cw: "y2",
    ccw: "y4",
    idl: "y2'",
    idr: "y4'",
    odl: "f6",
    odr: "f4",
  },
  y4: {
    in: "y4'",
    out: "f6",
    cw: "y3",
    ccw: "e5",
    idl: "y3'",
    idr: "e5'",
    odl: "e6",
    odr: "f5",
  },

  f1: { N: "f2", E: "g1", S: null, W: "e1", NE: "g2", NW: "e2" },
  f2: {
    N: "f3",
    E: "g2",
    S: "f1",
    W: "e2",
    NE: "g3",
    SE: "g1",
    NW: "e3",
    SW: "e1",
  },
  f3: {
    N: "f4",
    E: "g3",
    S: "f2",
    W: "e3",
    in: "y1",
    cw: "e3",
    ccw: "f4",
    NE: "g4",
    SE: "g2",
    SW: "e2",
    idl: "e4",
    idr: "y2",
    odl: "g4",
    od: "g2",
    odr: "e2",
  },
  f4: {
    N: "f5",
    S: "f3",
    E: "g4",
    W: "y2",
    in: "y2",
    out: "g4",
    cw: "f3",
    ccw: "f5",
    NE: "g5",
    SE: "g3",
    SW: "y1",
    NW: "y3",
    idl: "y1",
    idr: "y3",
    odl: "g5",
    odr: "g3",
  },
  f5: {
    N: "f6",
    S: "f4",
    E: "g5",
    W: "y3",
    in: "y3",
    out: "g5",
    cw: "f4",
    ccw: "f6",
    NE: "g6",
    SE: "g4",
    SW: "y2",
    NW: "y4",
    idl: "y2",
    idr: "y4",
    odl: "g6",
    odr: "g4",
  },
  f6: {
    N: "f7",
    E: "g6",
    S: "f5",
    W: "e6",
    in: "y4",
    cw: "f5",
    ccw: "e6",
    NE: "g7",
    SE: "g5",
    SW: "y3",
    idl: "y3",
    idr: "e5",
    odl: "e7",
    od: "g7",
    odr: "g5",
  },
  f7: {
    N: "f8",
    E: "g7",
    S: "f6",
    W: "e7",
    NE: "g8",
    SE: "g6",
    NW: "e8",
    SW: "e6",
  },
  f8: { N: null, E: "g8", S: "f7", W: "e8", SW: "e7", SE: "g7" },

  g1: { N: "g2", E: "h1", S: null, W: "f1", NE: "h2", NW: "f2" },
  g2: {
    N: "g3",
    E: "h2",
    S: "g1",
    W: "f2",
    NE: "h3",
    SE: "h1",
    NW: "f3",
    SW: "f1",
  },
  g3: {
    N: "g4",
    E: "h3",
    S: "g2",
    W: "f3",
    NE: "h4",
    SE: "h2",
    NW: "f4",
    SW: "f2",
  },
  g4: {
    N: "g5",
    E: "h4",
    S: "g3",
    W: "f4",
    NE: "h5",
    SE: "h3",
    NW: "f5",
    SW: "f3",
  },
  g5: {
    N: "g6",
    E: "h5",
    S: "g4",
    W: "f5",
    NE: "h6",
    SE: "h4",
    NW: "f6",
    SW: "f4",
  },
  g6: {
    N: "g7",
    E: "h6",
    S: "g5",
    W: "f6",
    NE: "h7",
    SE: "h5",
    NW: "f7",
    SW: "f5",
  },
  g7: {
    N: "g8",
    E: "h7",
    S: "g6",
    W: "f7",
    NE: "h8",
    SE: "h6",
    NW: "f8",
    SW: "f6",
  },
  g8: { N: null, E: "h8", S: "g7", W: "f8", SW: "f7", SE: "h7" },

  h1: { N: "h2", E: null, S: null, W: "g1", NE: null, NW: "g2" },
  h2: {
    N: "h3",
    E: null,
    S: "h1",
    W: "g2",
    NE: null,
    SE: "h1",
    NW: "g3",
    SW: "g1",
  },
  h3: {
    N: "h4",
    E: null,
    S: "h2",
    W: "g3",
    NE: null,
    SE: "h2",
    NW: "g4",
    SW: "g2",
  },
  h4: {
    N: "h5",
    E: null,
    S: "h3",
    W: "g4",
    NE: null,
    SE: "h3",
    NW: "g5",
    SW: "g3",
  },
  h5: {
    N: "h6",
    E: null,
    S: "h4",
    W: "g5",
    NE: null,
    SE: "h4",
    NW: "g6",
    SW: "g4",
  },
  h6: {
    N: "h7",
    E: null,
    S: "h5",
    W: "g6",
    NE: null,
    SE: "h5",
    NW: "g7",
    SW: "g5",
  },
  h7: {
    N: "h8",
    E: null,
    S: "h6",
    W: "g7",
    NE: null,
    SE: "h6",
    NW: "g8",
    SW: "g6",
  },
  h8: { N: null, E: null, S: "h7", W: "g8", SW: "g7", SE: null },

  "a1'": { N: "a2'", E: "b1'", S: null, W: null, NE: "b2'" },
  "a2'": { N: "a3'", E: "b2'", S: "a1'", W: null, NE: "b3'", SE: "b1'" },
  "a3'": { N: "a4'", E: "b3'", S: "a2'", W: null, NE: "b4'", SE: "b2'" },
  "a4'": { N: "a5'", E: "b4'", S: "a3'", W: null, NE: "b5'", SE: "b3'" },
  "a5'": { N: "a6'", E: "b5'", S: "a4'", W: null, NE: "b6'", SE: "b4'" },
  "a6'": { N: "a7'", E: "b6'", S: "a5'", W: null, NE: "b7'", SE: "b5'" },
  "a7'": { N: "a8'", E: "b7'", S: "a6'", W: null, NE: "b8'", SE: "b6'" },
  "a8'": { N: null, E: "b8'", S: "a7'", W: null, SE: "b7'" },

  "b1'": { N: "b2'", E: "c1'", S: null, W: "a1'", NE: "c2'", NW: "a2'" },
  "b2'": {
    N: "b3'",
    E: "c2'",
    S: "b1'",
    W: "a2'",
    NE: "c3'",
    SE: "c1'",
    NW: "a3'",
    SW: "a1'",
  },
  "b3'": {
    N: "b4'",
    E: "c3'",
    S: "b2'",
    W: "a3'",
    NE: "c4'",
    SE: "c2'",
    NW: "a4'",
    SW: "a2'",
  },
  "b4'": {
    N: "b5'",
    E: "c4'",
    S: "b3'",
    W: "a4'",
    NE: "c5'",
    SE: "c3'",
    NW: "a5'",
    SW: "a3'",
  },
  "b5'": {
    N: "b6'",
    E: "c5'",
    S: "b4'",
    W: "a5'",
    NE: "c6'",
    SE: "c4'",
    NW: "a6'",
    SW: "a4'",
  },
  "b6'": {
    N: "b7'",
    E: "c6'",
    S: "b5'",
    W: "a6'",
    NE: "c7'",
    SE: "c5'",
    NW: "a7'",
    SW: "a5'",
  },
  "b7'": {
    N: "b8'",
    E: "c7'",
    S: "b6'",
    W: "a7'",
    NE: "c8'",
    SE: "c6'",
    NW: "a8'",
    SW: "a6'",
  },
  "b8'": {
    N: null,
    E: "c8'",
    S: "b7'",
    W: "a8'",
    SE: "c7'",
    NW: null,
    SW: "a7'",
  },

  "c1'": { N: "c2'", E: "d1'", S: null, W: "b1'", NE: "d2'", NW: "b2'" },
  "c2'": {
    N: "c3'",
    E: "d2'",
    S: "c1'",
    W: "b2'",
    NE: "d3'",
    SE: "d1'",
    NW: "b3'",
    SW: "b1'",
  },
  "c3'": {
    N: "c4'",
    E: "d3'",
    S: "c2'",
    W: "b3'",
    in: "x1'",
    cw: "c4'",
    ccw: "d3'",
    NW: "b4'",
    SW: "b2'",
    SE: "d2'",
    idl: "d4'",
    idr: "x2'",
    odl: "b4'",
    od: "b2'",
    odr: "d2'",
  },
  "c4'": {
    N: "c5'",
    E: "x2'",
    S: "c3'",
    W: "b4'",
    in: "x2'",
    cw: "c5'",
    ccw: "c3'",
    NW: "b5'",
    SW: "b3'",
    NE: "x3'",
    SE: "x1'",
    idl: "x1'",
    idr: "x3'",
    odl: "b5'",
    odr: "b3'",
  },
  "c5'": {
    N: "c6'",
    E: "x3'",
    S: "c4'",
    W: "b5'",
    in: "x3'",
    cw: "c6'",
    ccw: "c4'",
    NW: "b6'",
    SW: "b4'",
    NE: "x4'",
    SE: "x2'",
    idl: "x2'",
    idr: "x4'",
    odl: "b6'",
    odr: "b4'",
  },
  "c6'": {
    N: "c7'",
    E: "d6'",
    S: "c5'",
    W: "b6'",
    in: "x4'",
    cw: "d6'",
    ccw: "c5'",
    NE: "d7'",
    SW: "b5'",
    NW: "b7'",
    idl: "x3'",
    idr: "d5'",
    odl: "d7'",
    od: "b7'",
    odr: "b5'",
  },
  "c7'": {
    N: "c8'",
    E: "d7'",
    S: "c6'",
    W: "b7'",
    NE: "d8'",
    NW: "b8'",
    SW: "b6'",
    SE: "d6'",
  },
  "c8'": { N: null, E: "d8'", S: "c7'", W: "b8'", SW: "b7'", SE: "d7'" },

  "x1'": {
    out: "c3'",
    cw: "x2'",
    in: "x1",
    ccw: "d4'",
    idl: "d4",
    idr: "x2",
    odl: "c4'",
    odr: "d3'",
  },
  "x2'": {
    out: "c4'",
    cw: "x3'",
    in: "x2",
    ccw: "x1'",
    idl: "x1",
    idr: "x3",
    odl: "c5'",
    odr: "c3'",
  },
  "x3'": {
    out: "c5'",
    cw: "x4'",
    in: "x3",
    ccw: "x2'",
    idl: "x2",
    idr: "x4",
    odl: "c6'",
    odr: "c4'",
  },
  "x4'": {
    out: "c6'",
    cw: "d5'",
    in: "x4",
    ccw: "x3'",
    idl: "x3",
    idr: "d5",
    odl: "d5'",
    odr: "c5'",
  },

  "d1'": { N: "d2'", E: "e1'", S: null, W: "c1'", NE: "e2'", NW: "c2'" },
  "d2'": {
    N: "d3'",
    E: "e2'",
    S: "d1'",
    W: "c2'",
    NE: "e3'",
    SE: "e1'",
    NW: "c3'",
    SW: "c1'",
  },
  "d3'": {
    N: "d4'",
    E: "e3'",
    S: "d2'",
    W: "c3'",
    in: "d4'",
    out: "d2'",
    cw: "c3'",
    ccw: "e3'",
    NE: "e4'",
    SE: "e2'",
    NW: "x1'",
    SW: "c2'",
    idl: "e4'",
    idr: "x1'",
    odl: "c2'",
    odr: "e2'",
  },
  "d4'": {
    N: "d4",
    S: "d3'",
    in: "d4",
    out: "d3'",
    cw: "x1'",
    ccw: "e4'",
    NE: "e5",
    SE: "e3",
    NW: "x1",
    SW: "c3'",
    idl: "e5",
    idr: "x1",
    odl: "c3'",
    odr: "e3'",
  },
  "d5'": {
    N: "d6'",
    S: "d5",
    in: "d5",
    out: "d6'",
    cw: "e5'",
    ccw: "x4'",
    NE: "e6'",
    SE: "e5",
    NW: "c6'",
    SW: "x4",
    idl: "x4",
    idr: "e5",
    odl: "e6'",
    odr: "c6'",
  },
  "d6'": {
    N: "d7'",
    E: "e6'",
    S: "d5'",
    W: "c6'",
    in: "d5'",
    out: "d7'",
    cw: "e6'",
    ccw: "c6'",
    NE: "e7'",
    SE: "e5'",
    NW: "c7'",
    SW: "x4'",
    idl: "x4'",
    idr: "e5'",
    odl: "e7'",
    odr: "c7'",
  },
  "d7'": {
    N: "d8'",
    E: "e7'",
    S: "d6'",
    W: "c7'",
    NE: "e8'",
    SE: "e6'",
    NW: "c8'",
    SW: "c6'",
  },
  "d8'": { N: null, E: "e8'", S: "d7'", W: "c8'", SW: "c7'", SE: "e7'" },

  "e1'": { N: "e2'", E: "f1'", S: null, W: "d1'", NE: "f2'", NW: "d2'" },
  "e2'": {
    N: "e3'",
    E: "f2'",
    S: "e1'",
    W: "d2'",
    NE: "f3'",
    SE: "f1'",
    NW: "d3'",
    SW: "d1'",
  },
  "e3'": {
    N: "e4'",
    E: "f3'",
    S: "e2'",
    W: "d3'",
    in: "e4'",
    out: "e2'",
    cw: "d3'",
    ccw: "f3'",
    NE: "y1'",
    SE: "f2'",
    NW: "d4'",
    SW: "d2'",
    idl: "y1'",
    idr: "d4'",
    odl: "d2'",
    odr: "f2'",
  },
  "e4'": {
    N: "e4",
    S: "e3'",
    in: "e4",
    out: "e3'",
    cw: "d4'",
    ccw: "y1'",
    NE: "y1",
    NW: "d4",
    SE: "f3'",
    SW: "d3'",
    idl: "y1",
    idr: "d4",
    odl: "d3'",
    odr: "f3'",
  },
  "e5'": {
    N: "e6'",
    S: "e5",
    in: "e5",
    out: "e6'",
    cw: "y4'",
    ccw: "d5'",
    NE: "f6'",
    SE: "y4",
    NW: "d6'",
    SW: "d5",
    idl: "d5",
    idr: "y4",
    odl: "f6'",
    odr: "d6'",
  },
  "e6'": {
    N: "e7'",
    E: "f6'",
    S: "e5'",
    W: "d6'",
    in: "e5'",
    out: "e7'",
    cw: "f6'",
    ccw: "d6'",
    NE: "f7'",
    SE: "y4'",
    NW: "d7'",
    SW: "d5'",
    idl: "d5'",
    idr: "y4'",
    odl: "f7'",
    odr: "d7'",
  },
  "e7'": {
    N: "e8'",
    E: "f7'",
    S: "e6'",
    W: "d7'",
    NE: "f8'",
    SE: "f6'",
    NW: "d8'",
    SW: "d6'",
  },
  "e8'": { N: null, E: "f8'", S: "e7'", W: "d8'", SW: "d7'", SE: "f7'" },

  "y1'": {
    in: "y1",
    out: "f3'",
    cw: "e4'",
    ccw: "y2'",
    idl: "y2",
    idr: "e4",
    odl: "e3'",
    odr: "f4'",
  },
  "y2'": {
    in: "y2",
    out: "f4'",
    cw: "y1'",
    ccw: "y3'",
    idl: "y3",
    idr: "y1",
    odl: "f3'",
    odr: "f5'",
  },
  "y3'": {
    in: "y3",
    out: "f5'",
    cw: "y2'",
    ccw: "y4'",
    idl: "y4",
    idr: "y2",
    odl: "f4'",
    odr: "f6'",
  },
  "y4'": {
    in: "y4",
    out: "f6'",
    cw: "y3'",
    ccw: "e5'",
    idl: "e5",
    idr: "y3",
    odl: "f5'",
    odr: "e6'",
  },

  "f1'": { N: "f2'", E: "g1'", S: null, W: "e1'", NE: "g2'", NW: "e2'" },
  "f2'": {
    N: "f3'",
    E: "g2'",
    S: "f1'",
    W: "e2'",
    NE: "g3'",
    SE: "g1'",
    NW: "e3'",
    SW: "e1'",
  },
  "f3'": {
    N: "f4'",
    E: "g3'",
    S: "f2'",
    W: "e3'",
    in: "y1'",
    cw: "e3'",
    ccw: "f4'",
    NE: "g4'",
    SE: "g2'",
    SW: "e2'",
    idl: "y2'",
    idr: "e4'",
    odl: "e2'",
    od: "g2'",
    odr: "g4'",
  },
  "f4'": {
    N: "f5'",
    S: "f3'",
    E: "g4'",
    W: "y2'",
    in: "y2'",
    out: "g4'",
    cw: "f3'",
    ccw: "f5'",
    NE: "g5'",
    SE: "g3'",
    SW: "y1'",
    NW: "y3'",
    idl: "y3'",
    idr: "y1'",
    odl: "g3'",
    odr: "g5'",
  },
  "f5'": {
    N: "f6'",
    S: "f4'",
    E: "g5'",
    W: "y3'",
    in: "y3'",
    out: "g5'",
    cw: "f4'",
    ccw: "f6'",
    NE: "g6'",
    SE: "g4'",
    SW: "y2'",
    NW: "y4'",
    idl: "y4'",
    idr: "y2'",
    odl: "g4'",
    odr: "g6'",
  },
  "f6'": {
    N: "f7'",
    E: "g6'",
    S: "f5'",
    W: "e6'",
    in: "y4'",
    cw: "f5'",
    ccw: "e6'",
    NE: "g7'",
    SE: "g5'",
    NW: "e7'",
    idl: "e5'",
    idr: "y3'",
    odl: "g5'",
    od: "g7'",
    odr: "e7'",
  },
  "f7'": {
    N: "f8'",
    E: "g7'",
    S: "f'6",
    W: "e7'",
    NE: "g8'",
    SE: "g6'",
    NW: "e8'",
    SW: "e6'",
  },
  "f8'": { N: null, E: "g8'", S: "f7'", W: "e8'", SW: "e7'", SE: "g7'" },

  "g1'": { N: "g2'", E: "h1'", S: null, W: "f1'", NE: "h2'", NW: "f2'" },
  "g2'": {
    N: "g3'",
    E: "h2'",
    S: "g1'",
    W: "f2'",
    NE: "h3'",
    SE: "h1'",
    NW: "f3'",
    SW: "f1'",
  },
  "g3'": {
    N: "g4'",
    E: "h3'",
    S: "g2'",
    W: "f3'",
    NE: "h4'",
    SE: "h2'",
    NW: "f4'",
    SW: "f2'",
  },
  "g4'": {
    N: "g5'",
    E: "h4'",
    S: "g3'",
    W: "f4'",
    NE: "h5'",
    SE: "h3'",
    NW: "f5'",
    SW: "f3'",
  },
  "g5'": {
    N: "g6'",
    E: "h5'",
    S: "g4'",
    W: "f5'",
    NE: "h6'",
    SE: "h4'",
    NW: "f6'",
    SW: "f4'",
  },
  "g6'": {
    N: "g7'",
    E: "h6'",
    S: "g5'",
    W: "f6'",
    NE: "h7'",
    SE: "h5'",
    NW: "f7'",
    SW: "f5'",
  },
  "g7'": {
    N: "g8'",
    E: "h7'",
    S: "g6'",
    W: "f7'",
    NE: "h8'",
    SE: "h6'",
    NW: "f8'",
    SW: "f6'",
  },
  "g8'": { N: null, E: "h8'", S: "g7'", W: "f8'", SW: "f7'", SE: "h7'" },

  "h1'": { N: "h2'", E: null, S: null, W: "g1'", NE: null, NW: "g2'" },
  "h2'": {
    N: "h3'",
    E: null,
    S: "h1'",
    W: "g2'",
    NE: null,
    SE: "h1'",
    NW: "g3'",
    SW: "g1'",
  },
  "h3'": {
    N: "h4'",
    E: null,
    S: "h2'",
    W: "g3'",
    NE: null,
    SE: "h2'",
    NW: "g4'",
    SW: "g2'",
  },
  "h4'": {
    N: "h5'",
    E: null,
    S: "h3'",
    W: "g4'",
    NE: null,
    SE: "h3'",
    NW: "g5'",
    SW: "g3'",
  },
  "h5'": {
    N: "h6'",
    E: null,
    S: "h4'",
    W: "g5'",
    NE: null,
    SE: "h4'",
    NW: "g6'",
    SW: "g4'",
  },
  "h6'": {
    N: "h7'",
    E: null,
    S: "h5'",
    W: "g6'",
    NE: null,
    SE: "h5'",
    NW: "g7'",
    SW: "g5'",
  },
  "h7'": {
    N: "h8'",
    E: null,
    S: "h6'",
    W: "g7'",
    NE: null,
    SE: "h6'",
    NW: "g8'",
    SW: "g6'",
  },
  "h8'": { N: null, E: null, S: "h7'", W: "g8'", SW: "g7'", SE: null },
};

// ==================== WORMHOLE GEOMETRY ====================

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
  const startAngle = -Math.PI * 0.5 - 0.25;
  const angleStep = (Math.PI * 2) / sequence.length;
  return startAngle - index * angleStep;
};

const getOuterLayerAngle = (notation: string): number => {
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
const TORUS_MAJOR = 15; // distance from origin to center of the tube (controls where the ring sits in XY)
const OUTER_MINOR = 35; // tube radius for outer layer (bigger => sits closer to the planes)
const INNER_MINOR = 22.5; // tube radius for inner layer (smaller => deeper into the donut)
const OUTER_PHI = Math.PI / 5; // minor-angle for outer layer (positive = towards top plane)
const INNER_PHI = Math.PI / 7 - 0.1; // minor-angle for inner layer (smaller = closer to the midline)

// Helper: torus param -> world coords
// theta: angle around the donut center (0..2pi), phi: angle around the tube (-pi/2..pi/2)
// R = TORUS_MAJOR, r = minorRadius
const torusPoint = (
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

const getWormholeSquarePosition = (
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

const getWormholeTransform = (
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

const getRotationTowardsOrigin = (
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

const getPieceWormholeRotation = (
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

// ==================== COORDINATE CONVERSION FUNCTIONS ====================

const gridToWorld = (
  gridX: number,
  gridY: number,
  z: number
): [number, number, number] => {
  const worldX = BOARD_MIN + gridX * SPACING;
  const worldY = BOARD_MIN + gridY * SPACING;
  return [worldX, worldY, z];
};

const gridToChess = (gridX: number, gridY: number, z: number): string => {
  const file = FILES[gridX];
  const rank = RANKS[gridY];
  const prime = z < 0 ? "'" : "";
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
  const gridY = RANKS.indexOf(rank);
  const z = isPrime ? -27 : 25;

  if (gridX === -1 || gridY === -1) {
    throw new Error(`Invalid chess notation: ${notation}`);
  }
  return [gridX, gridY, z];
};

const chessToWorld = (notation: string): [number, number, number] => {
  const isPrime = notation.endsWith("'");
  const cleanNotation = notation.replace("'", "");
  const baseZ = isPrime ? -25 : 25;

  if (
    INNER_LAYER_SQUARES.includes(cleanNotation) ||
    OUTER_LAYER_SQUARES.includes(cleanNotation)
  ) {
    return getWormholeSquarePosition(notation, baseZ);
  }

  const gridCoords = chessToGrid(notation);
  if (!gridCoords)
    throw new Error(`Cannot convert ${notation} to world coordinates`);

  const [gridX, gridY, z] = gridCoords;
  let [worldX, worldY, worldZ] = gridToWorld(gridX, gridY, z);

  return [worldX, worldY, worldZ];
};

// ==================== 3D COMPONENTS ====================

const ChessboardModel: React.FC = () => {
  const gltf = useGLTF("/chessboard/wormhole-chessboard.glb") as GLTF;
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <primitive object={gltf.scene} />
    </group>
  );
};

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
      args={[boxSize, boxSize, 0.5]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSquareClick(position, notation);
      }}
    >
      <meshBasicMaterial
        color={isHighlighted ? "yellow" : isPentagonal ? "orange" : "red"}
        opacity={isHighlighted ? 0.75 : isPentagonal ? 0.05 : 0.05}
        transparent
      />
    </Box>
  );
};

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
  const gltf = useGLTF("chessboard/white-pieces/white-rook.glb") as GLTF;
  const transform = getWormholeTransform(notation);
  const wormholeRotation = getPieceWormholeRotation(notation);

  const baseRotation: [number, number, number] = [
    Math.PI / 2,
    0,
    notation.includes("'") ? Math.PI : 0,
  ];

  const finalRotation: [number, number, number] = [
    baseRotation[0] + rotation[0] + wormholeRotation[0],
    baseRotation[1] + rotation[1] + wormholeRotation[1],
    baseRotation[2] + rotation[2] + wormholeRotation[2],
  ];

  const { springPos, springScale, springRot } = useSpring({
    springPos: position,
    springScale: transform.scale,
    springRot: finalRotation,
    config: { mass: 1, tension: 200, friction: 20 },
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

// ==================== UI COMPONENTS ====================

interface MoveLogEntry {
  moveNumber: number;
  piece: string;
  from: string;
  to: string;
  timestamp: Date;
  isWormholeMove?: boolean;
}

const MoveLog: React.FC<{ moves: MoveLogEntry[] }> = ({ moves }) => {
  const moveLogRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (moveLogRef.current) {
      moveLogRef.current.scrollTop = moveLogRef.current.scrollHeight;
    }
  }, [moves]);

  return (
    <div
      style={{
        backgroundColor: COLORS.charcoal,
        borderRadius: "12px",
        padding: "20px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
      }}
    >
      <h2
        style={{
          color: COLORS.warmWhite,
          fontSize: "1.5rem",
          fontWeight: "600",
          marginBottom: "20px",
          borderBottom: `2px solid ${COLORS.lodenGreen}`,
          paddingBottom: "10px",
        }}
      >
        Move History
      </h2>

      <div
        ref={moveLogRef}
        style={{
          flex: 1,
          overflowY: "auto",
          paddingRight: "10px",
        }}
      >
        {moves.length === 0 ? (
          <div
            style={{
              color: COLORS.smokeyTaupe,
              fontStyle: "italic",
              textAlign: "center",
              marginTop: "20px",
            }}
          >
            No moves yet
          </div>
        ) : (
          moves.map((move, index) => (
            <div
              key={index}
              style={{
                backgroundColor:
                  index % 2 === 0 ? COLORS.charcoalLight : "transparent",
                padding: "10px",
                borderRadius: "6px",
                marginBottom: "8px",
                transition: "all 0.3s ease",
                border: `1px solid ${
                  move.isWormholeMove ? COLORS.accent : "transparent"
                }`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color: COLORS.lodenGreenLight,
                    fontWeight: "600",
                    fontSize: "0.9rem",
                  }}
                >
                  {move.moveNumber}.
                </span>
                <span
                  style={{
                    color: COLORS.warmWhite,
                    fontFamily: "monospace",
                    fontSize: "1rem",
                  }}
                >
                  {move.from} → {move.to}
                </span>
              </div>
              {move.isWormholeMove && (
                <div
                  style={{
                    color: COLORS.accent,
                    fontSize: "0.75rem",
                    marginTop: "4px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span>🌀</span>
                  <span>Wormhole traversal</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const GameInfo: React.FC<{
  selectedPiece: string | null;
  currentPlayer: "white" | "black";
}> = ({ selectedPiece, currentPlayer }) => {
  return (
    <div
      style={{
        backgroundColor: COLORS.charcoal,
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "20px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
        }}
      >
        <div>
          <div
            style={{
              color: COLORS.smokeyTaupe,
              fontSize: "0.875rem",
              marginBottom: "4px",
            }}
          >
            Current Turn
          </div>
          <div
            style={{
              color: COLORS.warmWhite,
              fontSize: "1.25rem",
              fontWeight: "600",
              textTransform: "capitalize",
            }}
          >
            {currentPlayer}
          </div>
        </div>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor:
              currentPlayer === "white"
                ? COLORS.warmWhite
                : COLORS.charcoalLight,
            border: `3px solid ${COLORS.lodenGreen}`,
          }}
        />
      </div>

      {selectedPiece && (
        <div
          style={{
            backgroundColor: COLORS.lodenGreenDark,
            borderRadius: "8px",
            padding: "10px",
            borderLeft: `4px solid ${COLORS.accent}`,
          }}
        >
          <div
            style={{
              color: COLORS.warmWhite,
              fontSize: "0.875rem",
            }}
          >
            Selected: <strong>{selectedPiece}</strong>
          </div>
        </div>
      )}
    </div>
  );
};

const ControlsInfo: React.FC = () => {
  return (
    <div
      style={{
        backgroundColor: COLORS.charcoal,
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
      }}
    >
      <h3
        style={{
          color: COLORS.warmWhite,
          fontSize: "1.125rem",
          fontWeight: "600",
          marginBottom: "15px",
        }}
      >
        Controls
      </h3>
      <div
        style={{
          color: COLORS.smokeyTaupe,
          fontSize: "0.875rem",
          lineHeight: "1.6",
        }}
      >
        <div style={{ marginBottom: "8px" }}>
          <span style={{ color: COLORS.lodenGreenLight }}>🖱️ Left Click:</span>{" "}
          Select piece / Move
        </div>
        <div style={{ marginBottom: "8px" }}>
          <span style={{ color: COLORS.lodenGreenLight }}>🖱️ Drag:</span> Rotate
          view
        </div>
        <div style={{ marginBottom: "8px" }}>
          <span style={{ color: COLORS.lodenGreenLight }}>🖱️ Scroll:</span> Zoom
          in/out
        </div>
        <div>
          <span style={{ color: COLORS.lodenGreenLight }}>🖱️ Right Drag:</span>{" "}
          Pan camera
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

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
  const [moveHistory, setMoveHistory] = useState<MoveLogEntry[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<"white" | "black">(
    "white"
  );

  const boardSquares = useMemo(() => {
    const squares: {
      position: [number, number, number];
      notation: string;
      key: string;
      isPentagonal: boolean;
    }[] = [];

    for (let x = 0; x <= 7; x++) {
      for (let y = 0; y <= 7; y++) {
        const topNotation = gridToChess(x, y, 25);
        if (
          INNER_LAYER_SQUARES.includes(topNotation) ||
          OUTER_LAYER_SQUARES.includes(topNotation)
        ) {
          continue;
        }

        const topPos = chessToWorld(topNotation);
        const isPentTop = PENTAGONAL_SQUARES.includes(topNotation);

        squares.push({
          position: topPos,
          notation: topNotation,
          key: `top-${x}-${y}`,
          isPentagonal: isPentTop,
        });

        const bottomNotation = gridToChess(x, y, -25);
        const bottomPos = chessToWorld(bottomNotation);
        const isPentBottom = PENTAGONAL_SQUARES.includes(
          bottomNotation.replace("'", "")
        );

        squares.push({
          position: bottomPos,
          notation: bottomNotation,
          key: `bottom-${x}-${y}`,
          isPentagonal: isPentBottom,
        });
      }
    }

    INNER_LAYER_SQUARES.forEach((sq) => {
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

    OUTER_LAYER_SQUARES.forEach((sq) => {
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

  type EntryDir = keyof Directions; // "N" | "S" | "E" | "W" | "in" | "out" | "cw" | "ccw" | "NW" | "NE" | "SW" | "SE"

  const pentagonOrthogonalExits: Record<
    string,
    Record<string, (keyof Directions)[]>
  > = {
    c3: {
      N: ["N", "cw", "in"],
      E: ["E", "ccw", "in"],
      S: ["S", "ccw"],
      W: ["W", "cw"],
      cw: ["cw", "W"],
      ccw: ["ccw", "S"],
      out: ["S", "W"],
    },
    c6: {
      N: ["N", "cw"],
      E: ["E", "cw", "in"],
      S: ["S", "ccw", "in"],
      W: ["W", "ccw"],
      cw: ["cw", "N"],
      ccw: ["ccw", "W"],
      out: ["N", "W"],
    },
    f3: {
      N: ["N", "ccw", "in"],
      E: ["E", "ccw"],
      S: ["S", "ccw"],
      W: ["W", "cw", "in"],
      cw: ["cw", "S"],
      ccw: ["ccw", "E"],
      out: ["S", "E"],
    },
    f6: {
      N: ["N", "ccw"],
      E: ["E", "cw"],
      S: ["S", "cw", "in"],
      W: ["W", "ccw", "in"],
      cw: ["cw", "E"],
      ccw: ["ccw", "N"],
      out: ["N", "E"],
    },
    "c3'": {
      N: ["N", "cw", "in"],
      E: ["E", "ccw", "in"],
      S: ["S", "ccw"],
      W: ["W", "cw"],
      cw: ["cw", "W"],
      ccw: ["ccw", "S"],
      out: ["S", "W"],
    },
    "c6'": {
      N: ["N", "cw"],
      E: ["E", "cw", "in"],
      S: ["S", "ccw", "in"],
      W: ["W", "ccw"],
      cw: ["cw", "N"],
      ccw: ["ccw", "W"],
      out: ["N", "W"],
    },
    "f3'": {
      N: ["N", "ccw", "in"],
      E: ["E", "ccw"],
      S: ["S", "ccw"],
      W: ["W", "cw", "in"],
      cw: ["cw", "S"],
      ccw: ["ccw", "E"],
      out: ["S", "E"],
    },
    "f6'": {
      N: ["N", "ccw"],
      E: ["E", "cw"],
      S: ["S", "cw", "in"],
      W: ["W", "ccw", "in"],
      cw: ["cw", "E"],
      ccw: ["ccw", "N"],
      out: ["N", "E"],
    },
  };

  const calculateOrthogonalMoves = (start: string): string[] => {
    const moves = new Set<string>();

    // Helper to get the opposite direction
    const oppositeDir: Record<EntryDir, EntryDir> = {
      N: "S",
      S: "N",
      E: "W",
      W: "E",
      in: "out",
      out: "in",
      cw: "ccw",
      ccw: "cw",

      // Diagonal directions are not used for rook movement but included for completeness
      NW: "SE",
      NE: "SW",
      SW: "NE",
      SE: "NW",
      idl: "odr",
      idr: "odl",
      odl: "idr",
      odr: "idl",
      od: "od",
    };

    const outDir: Record<string, EntryDir> = {
      c4: "W",
      c5: "W",
      d3: "S",
      e3: "S",
      d6: "N",
      e6: "N",
      f4: "E",
      f5: "E",

      "c4'": "W",
      "c5'": "W",
      "d3'": "S",
      "e3'": "S",
      "d6'": "N",
      "e6'": "N",
      "f4'": "E",
      "f5'": "E",
    };

    const inDir: Record<string, EntryDir> = {
      c4: "E",
      c5: "E",
      d3: "N",
      e3: "N",
      d6: "S",
      e6: "S",
      f4: "W",
      f5: "W",

      "c4'": "E",
      "c5'": "E",
      "d3'": "N",
      "e3'": "N",
      "d6'": "S",
      "e6'": "S",
      "f4'": "W",
      "f5'": "W",
    };

    // Traverse a line in a specific direction
    const traverseLine = (
      current: string,
      dir: EntryDir,
      visitedLine: Set<string>
    ) => {
      const node = boardGraph[current];
      if (!node) {
        return;
      }

      // \/\/\/ handle in/out transitions \/\/\/

      if (current in outDir && dir == "out") {
        dir = outDir[current];
      }

      if (current in inDir && dir == inDir[current]) {
        dir = "in";
      }
      // /\/\/\

      const next = node[dir];
      if (!next) {
        return;
      }

      // Prevent infinite loops along this line
      const lineKey = `${current}-${dir}`;
      if (visitedLine.has(lineKey)) {
        return;
      }
      visitedLine.add(lineKey);

      moves.add(next);

      // Only allow prime/non-prime transitions via in/out
      const currentPrime = current.endsWith("'");
      const nextPrime = next.endsWith("'");

      let nextDir: EntryDir = dir;
      if ((!currentPrime && nextPrime) || (currentPrime && !nextPrime)) {
        nextDir = oppositeDir[dir];
      }

      // Determine next directions
      if (pentagonOrthogonalExits[next]) {
        // Pentagon square: branch according to entry direction
        const branches = pentagonOrthogonalExits[next][nextDir] || [];
        for (const branch of branches) {
          traverseLine(next, branch, new Set(visitedLine)); // clone visited for each branch
        }
      } else {
        // Normal square: continue straight in same direction
        traverseLine(next, nextDir, visitedLine);
      }
    };

    // Start traversal along each initial rook direction
    const initialDirs: EntryDir[] = [
      "N",
      "S",
      "E",
      "W",
      "in",
      "out",
      "cw",
      "ccw",
    ];
    for (const dir of initialDirs) {
      traverseLine(start, dir, new Set());
    }

    moves.delete(start);
    return Array.from(moves);
  };

  const pentagonDiagonalExits: Record<
    string,
    Record<string, (keyof Directions)[]>
  > = {
    c3: {
      NE: ["idl", "idr"],
      SE: ["idr", "SE"],
      NW: ["NW", "idl"],
      odl: ["SE", "SW"],
      odr: ["NW", "SW"],
    },
    c6: {
      SE: ["idl", "idr"],
      NE: ["NE", "idl"],
      SW: ["SW", "idr"],
      odl: ["NW", "SW"],
      odr: ["NE", "NW"],
    },
    f3: {
      NW: ["idl", "idr"],
      SW: ["idl", "SW"],
      NE: ["NE", "idr"],
      odl: ["NE", "SE"],
      odr: ["SW", "SE"],
    },
    f6: {
      SW: ["idl", "idr"],
      NW: ["NW", "idr"],
      SE: ["SE", "idl"],
      odl: ["NE", "NW"],
      odr: ["SE", "NE"],
    },
    "c3'": {
      NE: ["idl", "idr"],
      SE: ["idl", "SE"],
      NW: ["NW", "idr"],
      odl: ["NW", "SW"],
      odr: ["SE", "SW"],
    },
    "c6'": {
      SE: ["idl", "idr"],
      NE: ["NE", "idr"],
      SW: ["SW", "idl"],
      odl: ["NW", "NE"],
      odr: ["SW", "NW"],
    },
    "f3'": {
      NW: ["idl", "idr"],
      SW: ["idr", "SW"],
      NE: ["NE", "idl"],
      odl: ["SW", "SE"],
      odr: ["NE", "SE"],
    },
    "f6'": {
      SW: ["idl", "idr"],
      NW: ["NW", "idl"],
      SE: ["SE", "idr"],
      odl: ["NE", "SE"],
      odr: ["NW", "NE"],
    },
  };

  const calculateDiagonalMoves = (start: string): string[] => {
    const moves = new Set<string>();

    const inDir: Record<string, Record<string, EntryDir>> = {
      c4: { NE: "idl", SE: "idr" },
      c5: { NE: "idl", SE: "idr" },
      d3: { NW: "idl", NE: "idr" },
      d6: { SE: "idl", SW: "idr" },
      e3: { NW: "idl", NE: "idr" },
      e6: { SE: "idl", SW: "idr" },
      f4: { SW: "idl", NW: "idr" },
      f5: { SW: "idl", NW: "idr" },

      "c4'": { NE: "idr", SE: "idl" },
      "c5'": { NE: "idr", SE: "idl" },
      "d3'": { NW: "idr", NE: "idl" },
      "d6'": { SE: "idr", SW: "idl" },
      "e3'": { NW: "idr", NE: "idl" },
      "e6'": { SE: "idr", SW: "idl" },
      "f4'": { SW: "idr", NW: "idl" },
      "f5'": { SW: "idr", NW: "idl" },
    };

    const outDir: Record<string, Record<string, EntryDir>> = {
      c4: { odl: "SW", odr: "NW" },
      c5: { odl: "SW", odr: "NW" },
      d3: { odl: "SE", odr: "SW" },
      d6: { odl: "NW", odr: "NE" },
      e3: { odl: "SE", odr: "SW" },
      e6: { odl: "NW", odr: "NE" },
      f4: { odl: "NE", odr: "SE" },
      f5: { odl: "NE", odr: "SE" },

      "c4'": { odr: "SW", odl: "NW" },
      "c5'": { odr: "SW", odl: "NW" },
      "d3'": { odr: "SE", odl: "SW" },
      "d6'": { odr: "NW", odl: "NE" },
      "e3'": { odr: "SE", odl: "SW" },
      "e6'": { odr: "NW", odl: "NE" },
      "f4'": { odr: "NE", odl: "SE" },
      "f5'": { odr: "NE", odl: "SE" },
    };

    const traverseDiagonal = (
      current: string,
      dir: EntryDir,
      visitedLine: Set<string>
    ) => {
      const node = boardGraph[current];
      if (!node) {
        return;
      }

      // \/\/\/ handle in/out transitions for diagonal moves \/\/\/
      if (current in inDir) {
        if (dir in inDir[current]) {
          dir = inDir[current][dir];
        }
      }
      if (current in outDir) {
        if (dir in outDir[current]) {
          dir = outDir[current][dir];
        }
      }
      // /\/\/\

      const next = node[dir];
      if (!next) {
        return;
      }

      // Prevent infinite loops along this line
      const lineKey = `${current}-${dir}`;
      if (visitedLine.has(lineKey)) {
        return;
      }
      visitedLine.add(lineKey);

      moves.add(next);

      const currentPrime = current.endsWith("'");
      const nextPrime = next.endsWith("'");
      let nextDir: EntryDir = dir;
      if (currentPrime !== nextPrime) {
        if (dir === "idl") nextDir = "odl";
        else if (dir === "idr") nextDir = "odr";
      }

      if (pentagonDiagonalExits[next]) {
        const branches = pentagonDiagonalExits[next][dir] || [];
        for (const branch of branches) {
          traverseDiagonal(next, branch, new Set(visitedLine)); // clone visited for each branch
        }
      } else {
        traverseDiagonal(next, nextDir, visitedLine);
      }
    };
    const initialDirs: EntryDir[] = [
      "NE",
      "NW",
      "SE",
      "SW",
      "idl",
      "idr",
      "odl",
      "odr",
    ];
    for (const dir of initialDirs) {
      traverseDiagonal(start, dir, new Set());
    }
    return Array.from(moves);
  };

  const handlePieceClick = (pieceId: string, notation: string) => {
    if (selectedPiece === pieceId) {
      setSelectedPiece(null);
      setPossibleMoves([]);
    } else {
      setSelectedPiece(pieceId);
      const moves = calculateOrthogonalMoves(notation);
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

        // Check if it's a wormhole move
        const isWormholeMove =
          previousNotation.includes("'") !== targetNotation.includes("'") ||
          targetNotation.includes("x") ||
          targetNotation.includes("y") ||
          previousNotation.includes("x") ||
          previousNotation.includes("y");

        setPiecePositions((prev) => ({
          ...prev,
          [selectedPiece]: targetNotation,
        }));

        setMoveHistory((prev) => [
          ...prev,
          {
            moveNumber: prev.length + 1,
            piece: selectedPiece,
            from: previousNotation,
            to: targetNotation,
            timestamp: new Date(),
            isWormholeMove,
          },
        ]);

        setCurrentPlayer((prev) => (prev === "white" ? "black" : "white"));
        setSelectedPiece(null);
        setPossibleMoves([]);
      }
    }
  };

  const isHighlightedSquare = (notation: string) => {
    return possibleMoves.includes(notation);
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        backgroundColor: COLORS.smokeyTaupe,
        fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "80px",
          backgroundColor: COLORS.charcoal,
          display: "flex",
          alignItems: "center",
          padding: "0 40px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
          zIndex: 10,
        }}
      >
        <h1
          style={{
            color: COLORS.warmWhite,
            fontSize: "2rem",
            fontWeight: "700",
            letterSpacing: "-0.02em",
          }}
        >
          Wormhole Chess
          <span
            style={{
              color: COLORS.lodenGreenLight,
              fontSize: "1rem",
              marginLeft: "15px",
              fontWeight: "400",
            }}
          >
            3D Variant
          </span>
        </h1>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          marginTop: "80px",
        }}
      >
        {/* Canvas Container */}
        <div
          style={{
            flex: 1,
            position: "relative",
            backgroundColor: COLORS.charcoalLight,
            borderRight: `1px solid ${COLORS.lodenGreenDark}`,
          }}
        >
          <Canvas
            camera={{ position: [0, 0, 300], fov: 50, near: 0.1, far: 1000 }}
            style={{ width: "100%", height: "100%" }}
          >
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
                return (
                  <Rook
                    key={id}
                    id={id}
                    position={worldPos}
                    notation={notation}
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
              enableRotate={true}
              minPolarAngle={Math.PI / 2}
              maxPolarAngle={Math.PI / 2}
            />
          </Canvas>
        </div>

        {/* Right Sidebar */}
        <div
          style={{
            width: "380px",
            backgroundColor: COLORS.lodenGreenDark,
            padding: "30px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            overflowY: "auto",
          }}
        >
          <GameInfo
            selectedPiece={selectedPiece}
            currentPlayer={currentPlayer}
          />

          <div style={{ flex: 1, minHeight: 0 }}>
            <MoveLog moves={moveHistory} />
          </div>

          <ControlsInfo />
        </div>
      </div>
    </div>
  );
};

export default ChessboardScene;
