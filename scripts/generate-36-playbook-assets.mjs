import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

// 5x5 Isometric Board Geometry Constants (Centered cleanly in 120x96 art window)
const W = 11.2;
const H = 6.2;
const X0 = 60;
const Y0 = 26;
const dz = 6.5;
const lightColor = '#D5CDC0';
const darkColor = '#2C3539';
const borderColor = '#141618';
const slabLeft = '#222629';
const slabRight = '#151719';

const tiles = [];
for (let r = 0; r <= 4; r++) {
  for (let c = 0; c <= 4; c++) {
    const cx = X0 + (c - r) * W;
    const cy = Y0 + (c + r) * H;
    const isLight = (c + r) % 2 === 0;
    const pts = `${cx.toFixed(1)},${(cy - H).toFixed(1)} ${(cx + W).toFixed(1)},${cy.toFixed(1)} ${cx.toFixed(1)},${(cy + H).toFixed(1)} ${(cx - W).toFixed(1)},${cy.toFixed(1)}`;
    tiles.push({ c, r, cx, cy, isLight, pts });
  }
}

function getTile(c, r) {
  return tiles.find(t => t.c === c && t.r === r);
}

// 3D Slab Thickness
const leftPerimeter = [];
const t04 = getTile(0, 4);
leftPerimeter.push(`${(t04.cx - W).toFixed(1)},${t04.cy.toFixed(1)}`);
for (let c = 0; c <= 4; c++) {
  const t = getTile(c, 4);
  leftPerimeter.push(`${t.cx.toFixed(1)},${(t.cy + H).toFixed(1)}`);
}

const rightPerimeter = [];
const t44 = getTile(4, 4);
rightPerimeter.push(`${t44.cx.toFixed(1)},${(t44.cy + H).toFixed(1)}`);
for (let r = 4; r >= 0; r--) {
  const t = getTile(4, r);
  rightPerimeter.push(`${(t.cx + W).toFixed(1)},${t.cy.toFixed(1)}`);
}

const leftSlabPoints = `${leftPerimeter.join(' ')} ${leftPerimeter.slice().reverse().map(pt => {
  const [x, y] = pt.split(',').map(Number);
  return `${x.toFixed(1)},${(y + dz).toFixed(1)}`;
}).join(' ')}`;

const rightSlabPoints = `${rightPerimeter.join(' ')} ${rightPerimeter.slice().reverse().map(pt => {
  const [x, y] = pt.split(',').map(Number);
  return `${x.toFixed(1)},${(y + dz).toFixed(1)}`;
}).join(' ')}`;

// ============================================================================
// STAUNTON PIECE SILHOUETTES (All 6 Classes: Pawn, Knight, Bishop, Rook, Queen, King)
// ============================================================================
function renderPiece(type, cx, cy, scale = 1.0, isAllied = true, opacity = 1.0) {
  const baseGrad = isAllied ? 'url(#gold_base)' : '#374151';
  const focusGrad = isAllied ? 'url(#gold_focus)' : '#6B7280';
  const rimStroke = isAllied ? '#16181A' : '#111827';

  if (type === 'pawn') {
    return `
    <g transform="translate(${cx.toFixed(1)}, ${cy.toFixed(1)}) scale(${scale})" opacity="${opacity}">
      <ellipse cx="0" cy="1.0" rx="5.4" ry="2.8" fill="#0A0B0C" opacity="0.65" />
      <ellipse cx="0" cy="0.2" rx="5.0" ry="2.75" fill="${baseGrad}" stroke="${rimStroke}" stroke-width="0.6" />
      <ellipse cx="0" cy="-0.8" rx="4.0" ry="2.2" fill="${focusGrad}" stroke="${rimStroke}" stroke-width="0.4" />
      <path d="M -2.6 -1.8 C -2.6 -5.2 -1.4 -9.0 -1.1 -11.4 L 1.1 -11.4 C 1.4 -9.0 2.6 -5.2 2.6 -1.8 Z" fill="${focusGrad}" stroke="${rimStroke}" stroke-width="0.6" />
      <ellipse cx="0" cy="-11.4" rx="2.4" ry="1.2" fill="${baseGrad}" stroke="${rimStroke}" stroke-width="0.5" />
      <circle cx="0" cy="-14.5" r="2.8" fill="${focusGrad}" stroke="${rimStroke}" stroke-width="0.6" />
      ${isAllied ? '<circle cx="-0.8" cy="-15.3" r="0.9" fill="#FFFDF7" opacity="0.9" />' : ''}
    </g>`;
  }

  if (type === 'knight') {
    return `
    <g transform="translate(${cx.toFixed(1)}, ${cy.toFixed(1)}) scale(${scale})" opacity="${opacity}">
      <ellipse cx="0" cy="1.0" rx="5.4" ry="2.8" fill="#0A0B0C" opacity="0.65" />
      <ellipse cx="0" cy="0.2" rx="5.0" ry="2.75" fill="${baseGrad}" stroke="${rimStroke}" stroke-width="0.6" />
      <ellipse cx="0" cy="-0.8" rx="4.0" ry="2.2" fill="${focusGrad}" stroke="${rimStroke}" stroke-width="0.4" />
      <g transform="translate(0, -1.8) scale(0.105) translate(-257, -312)">
        <path d="M 212 312 C 212 274 224 242 240 224 L 202 212 C 194 208 192 196 200 188 L 232 156 C 240 148 252 150 260 160 L 272 176 L 282 150 C 286 142 296 142 300 150 L 308 174 C 322 192 330 216 330 246 C 330 276 314 304 302 312 Z" fill="${focusGrad}" stroke="${rimStroke}" stroke-width="6" stroke-linejoin="round" />
        <circle cx="236" cy="180" r="5.5" fill="${rimStroke}" />
        <path d="M 278 186 C 292 202 298 222 298 244" fill="none" stroke="${rimStroke}" stroke-width="6" stroke-linecap="round" />
      </g>
    </g>`;
  }

  if (type === 'bishop') {
    return `
    <g transform="translate(${cx.toFixed(1)}, ${cy.toFixed(1)}) scale(${scale})" opacity="${opacity}">
      <ellipse cx="0" cy="1.0" rx="5.4" ry="2.8" fill="#0A0B0C" opacity="0.65" />
      <ellipse cx="0" cy="0.2" rx="5.0" ry="2.75" fill="${baseGrad}" stroke="${rimStroke}" stroke-width="0.6" />
      <ellipse cx="0" cy="-0.8" rx="4.0" ry="2.2" fill="${focusGrad}" stroke="${rimStroke}" stroke-width="0.4" />
      <path d="M -2.4 -1.8 C -2.4 -5.5 -1.2 -9.5 -0.9 -12.0 L 0.9 -12.0 C 1.2 -9.5 2.4 -5.5 2.4 -1.8 Z" fill="${focusGrad}" stroke="${rimStroke}" stroke-width="0.6" />
      <ellipse cx="0" cy="-12.0" rx="2.5" ry="1.2" fill="${baseGrad}" stroke="${rimStroke}" stroke-width="0.5" />
      <path d="M -2.2 -12.0 C -3.2 -14.0 -2.6 -17.5 0 -19.0 C 2.6 -17.5 3.2 -14.0 2.2 -12.0 Z" fill="${focusGrad}" stroke="${rimStroke}" stroke-width="0.6" />
      <path d="M 0 -13.0 L 2.2 -15.5" stroke="${rimStroke}" stroke-width="0.9" stroke-linecap="round" />
      <circle cx="0" cy="-19.6" r="1.1" fill="${baseGrad}" stroke="${rimStroke}" stroke-width="0.4" />
    </g>`;
  }

  if (type === 'rook') {
    return `
    <g transform="translate(${cx.toFixed(1)}, ${cy.toFixed(1)}) scale(${scale})" opacity="${opacity}">
      <ellipse cx="0" cy="1.0" rx="5.4" ry="2.8" fill="#0A0B0C" opacity="0.65" />
      <ellipse cx="0" cy="0.2" rx="5.2" ry="2.8" fill="${baseGrad}" stroke="${rimStroke}" stroke-width="0.6" />
      <ellipse cx="0" cy="-0.9" rx="4.2" ry="2.2" fill="${focusGrad}" stroke="${rimStroke}" stroke-width="0.4" />
      <path d="M -3.1 -1.8 L -2.5 -12.2 L 2.5 -12.2 L 3.1 -1.8 Z" fill="${focusGrad}" stroke="${rimStroke}" stroke-width="0.6" />
      <!-- Crenelated Turret Crown -->
      <path d="M -3.6 -12.2 L -3.6 -16.8 L -1.8 -16.8 L -1.8 -14.8 L -0.8 -14.8 L -0.8 -16.8 L 0.8 -16.8 L 0.8 -14.8 L 1.8 -14.8 L 1.8 -16.8 L 3.6 -16.8 L 3.6 -12.2 Z" fill="${focusGrad}" stroke="${rimStroke}" stroke-width="0.6" stroke-linejoin="round" />
    </g>`;
  }

  if (type === 'queen') {
    return `
    <g transform="translate(${cx.toFixed(1)}, ${cy.toFixed(1)}) scale(${scale})" opacity="${opacity}">
      <ellipse cx="0" cy="1.0" rx="5.6" ry="2.9" fill="#0A0B0C" opacity="0.65" />
      <ellipse cx="0" cy="0.2" rx="5.2" ry="2.8" fill="${baseGrad}" stroke="${rimStroke}" stroke-width="0.6" />
      <ellipse cx="0" cy="-0.9" rx="4.2" ry="2.2" fill="${focusGrad}" stroke="${rimStroke}" stroke-width="0.4" />
      <path d="M -2.8 -1.8 C -2.6 -6.2 -1.5 -10.5 -1.2 -13.5 L 1.2 -13.5 C 1.5 -10.5 2.6 -6.2 2.8 -1.8 Z" fill="${focusGrad}" stroke="${rimStroke}" stroke-width="0.6" />
      <ellipse cx="0" cy="-13.5" rx="2.8" ry="1.3" fill="${baseGrad}" stroke="${rimStroke}" stroke-width="0.5" />
      <!-- 5-Pointed Coronet Crown -->
      <path d="M -2.6 -13.8 L -3.8 -18.5 L -1.6 -15.8 L 0 -19.5 L 1.6 -15.8 L 3.8 -18.5 L 2.6 -13.8 Z" fill="${focusGrad}" stroke="${rimStroke}" stroke-width="0.6" stroke-linejoin="round" />
      <circle cx="-3.8" cy="-19.0" r="0.8" fill="#FFFDF7" stroke="${rimStroke}" stroke-width="0.3" />
      <circle cx="0" cy="-20.1" r="0.9" fill="#FFFDF7" stroke="${rimStroke}" stroke-width="0.3" />
      <circle cx="3.8" cy="-19.0" r="0.8" fill="#FFFDF7" stroke="${rimStroke}" stroke-width="0.3" />
    </g>`;
  }

  // King
  return `
  <g transform="translate(${cx.toFixed(1)}, ${cy.toFixed(1)}) scale(${scale})" opacity="${opacity}">
    <ellipse cx="0" cy="1.0" rx="5.8" ry="3.0" fill="#0A0B0C" opacity="0.65" />
    <ellipse cx="0" cy="0.2" rx="5.4" ry="2.9" fill="${baseGrad}" stroke="${rimStroke}" stroke-width="0.6" />
    <ellipse cx="0" cy="-0.9" rx="4.4" ry="2.3" fill="${focusGrad}" stroke="${rimStroke}" stroke-width="0.4" />
    <path d="M -2.9 -1.8 C -2.7 -6.5 -1.6 -11.0 -1.3 -14.0 L 1.3 -14.0 C 1.6 -11.0 2.7 -6.5 2.9 -1.8 Z" fill="${focusGrad}" stroke="${rimStroke}" stroke-width="0.6" />
    <ellipse cx="0" cy="-14.0" rx="3.0" ry="1.3" fill="${baseGrad}" stroke="${rimStroke}" stroke-width="0.5" />
    <path d="M -2.6 -14.2 C -3.4 -16.5 -2.8 -18.8 0 -19.2 C 2.8 -18.8 3.4 -16.5 2.6 -14.2 Z" fill="${focusGrad}" stroke="${rimStroke}" stroke-width="0.6" />
    <!-- Royal Cross Finial -->
    <path d="M -0.6 -19.2 L -0.6 -23.0 L 0.6 -23.0 L 0.6 -19.2 Z" fill="${focusGrad}" stroke="${rimStroke}" stroke-width="0.4" />
    <path d="M -2.0 -21.6 L 2.0 -21.6 L 2.0 -20.5 L -2.0 -20.5 Z" fill="${focusGrad}" stroke="${rimStroke}" stroke-width="0.4" />
  </g>`;
}

function renderArc(fromTile, toTile, peak = 20, color = '#D4AF37') {
  const x1 = fromTile.cx;
  const y1 = fromTile.cy - 6;
  const x2 = toTile.cx;
  const y2 = toTile.cy - 1;
  const qx = (x1 + x2) / 2;
  const qy = Math.min(y1, y2) - peak;
  return `
  <path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${qx.toFixed(1)} ${qy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" />
  <path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${qx.toFixed(1)} ${qy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="#FFFDF7" stroke-width="0.9" stroke-dasharray="2.5 1.5" />`;
}

function renderBeam(fromTile, toTile, color = '#D4AF37') {
  return `
  <line x1="${fromTile.cx.toFixed(1)}" y1="${(fromTile.cy - 3).toFixed(1)}" x2="${toTile.cx.toFixed(1)}" y2="${(toTile.cy - 1).toFixed(1)}" stroke="${color}" stroke-width="2.6" stroke-linecap="round" />
  <line x1="${fromTile.cx.toFixed(1)}" y1="${(fromTile.cy - 3).toFixed(1)}" x2="${toTile.cx.toFixed(1)}" y2="${(toTile.cy - 1).toFixed(1)}" stroke="#FFFDF7" stroke-width="1.0" stroke-dasharray="3 1.5" />`;
}

function renderReticle(tile, color = '#D4AF37') {
  return `
  <ellipse cx="${tile.cx.toFixed(1)}" cy="${tile.cy.toFixed(1)}" rx="6.2" ry="3.4" fill="none" stroke="${color}" stroke-width="1.4" stroke-dasharray="2 1.5" />
  <polygon points="${tile.cx.toFixed(1)},${(tile.cy + 2.4).toFixed(1)} ${(tile.cx - 2.5).toFixed(1)},${(tile.cy - 2.0).toFixed(1)} ${(tile.cx + 2.5).toFixed(1)},${(tile.cy - 2.0).toFixed(1)}" fill="${color}" />`;
}

// ============================================================================
// 36 CARDS SCENE DEFINITIONS
// ============================================================================
const SCENES_36 = [
  // PAWNS (8)
  { dir: 'pawn', id: 'p1_sidestep', anchor: 'pawn', origin: [2, 3], targets: [[3, 3], [1, 3]], enemies: [['pawn', 2, 2]], allies: [], mode: 'arc' },
  { dir: 'pawn', id: 'p2_head_on', anchor: 'pawn', origin: [2, 3], targets: [[2, 2]], enemies: [['pawn', 2, 2]], allies: [], mode: 'beam' },
  { dir: 'pawn', id: 'p3_follow_me', anchor: 'pawn', origin: [2, 2], targets: [[2, 1]], enemies: [], allies: [['knight', 2, 3]], mode: 'beam' },
  { dir: 'pawn', id: 'p4_attack_together', anchor: 'pawn', origin: [2, 2], targets: [[1, 1]], enemies: [['knight', 1, 1]], allies: [['pawn', 3, 3]], mode: 'beam' },
  { dir: 'pawn', id: 'p5_get_behind_me', anchor: 'pawn', origin: [2, 2], targets: [[2, 3]], enemies: [], allies: [['bishop', 1, 3]], mode: 'arc' },
  { dir: 'pawn', id: 'p6_tag_out', anchor: 'pawn', origin: [2, 3], targets: [[2, 2]], enemies: [], allies: [['rook', 2, 2]], mode: 'arc' },
  { dir: 'pawn', id: 'p7_protect_the_king', anchor: 'pawn', origin: [2, 2], targets: [[1, 1]], enemies: [['bishop', 1, 1], ['rook', 2, 0]], allies: [['king', 2, 4]], mode: 'beam' },
  { dir: 'pawn', id: 'p8_call_reserves', anchor: 'pawn', origin: [2, 1], targets: [[2, 2]], enemies: [], allies: [['pawn', 1, 1]], mode: 'beam' },

  // KNIGHTS (7)
  { dir: 'knight', id: 'n1_adrenaline_jump', anchor: 'knight', origin: [2, 4], targets: [[1, 1]], enemies: [['rook', 4, 4]], allies: [], mode: 'arc' },
  { dir: 'knight', id: 'n2_swap_with_me', anchor: 'knight', origin: [2, 3], targets: [[1, 1]], enemies: [], allies: [['bishop', 1, 1]], mode: 'arc' },
  { dir: 'knight', id: 'n3_trample', anchor: 'knight', origin: [2, 4], targets: [[1, 2]], enemies: [['pawn', 2, 3]], allies: [], mode: 'arc' },
  { dir: 'knight', id: 'n4_pin_swap', anchor: 'knight', origin: [2, 2], targets: [[1, 2]], enemies: [['rook', 2, 0]], allies: [['pawn', 1, 2], ['king', 2, 4]], mode: 'arc' },
  { dir: 'knight', id: 'n5_get_to_the_king', anchor: 'knight', origin: [0, 3], targets: [[2, 2]], enemies: [['queen', 2, 0]], allies: [['king', 2, 3]], mode: 'arc' },
  { dir: 'knight', id: 'n6_flanking_support', anchor: 'knight', origin: [0, 3], targets: [[1, 1], [0, 3]], enemies: [], allies: [['knight', 3, 4]], mode: 'arc' },
  { dir: 'knight', id: 'n7_outpost_support', anchor: 'knight', origin: [2, 1], targets: [[3, 2]], enemies: [], allies: [['pawn', 1, 2]], mode: 'beam' },

  // BISHOPS (7)
  { dir: 'bishop', id: 'b1_let_me_through', anchor: 'bishop', origin: [2, 3], targets: [[1, 2]], enemies: [], allies: [['pawn', 1, 2]], mode: 'arc' },
  { dir: 'bishop', id: 'b2_pierce', anchor: 'bishop', origin: [3, 3], targets: [[0, 0]], enemies: [['pawn', 2, 2]], allies: [], mode: 'beam' },
  { dir: 'bishop', id: 'b3_ricochet', anchor: 'bishop', origin: [2, 4], targets: [[0, 2], [2, 0]], enemies: [], allies: [], mode: 'beam' },
  { dir: 'bishop', id: 'b4_change_color', anchor: 'bishop', origin: [0, 4], targets: [[1, 4], [0, 3]], enemies: [], allies: [], mode: 'beam' },
  { dir: 'bishop', id: 'b5_take_my_place', anchor: 'bishop', origin: [1, 1], targets: [[3, 3]], enemies: [['rook', 1, 4]], allies: [['pawn', 3, 3]], mode: 'arc' },
  { dir: 'bishop', id: 'b6_come_this_way', anchor: 'bishop', origin: [2, 2], targets: [[1, 3]], enemies: [], allies: [['pawn', 0, 4]], mode: 'beam' },
  { dir: 'bishop', id: 'b7_bishops_blessing', anchor: 'bishop', origin: [2, 2], targets: [[0, 1]], enemies: [], allies: [['rook', 2, 3]], mode: 'beam' },

  // ROOKS (6)
  { dir: 'rook', id: 'r1_make_way', anchor: 'rook', origin: [2, 3], targets: [[2, 2], [2, 1]], enemies: [], allies: [['pawn', 2, 2]], mode: 'beam' },
  { dir: 'rook', id: 'r2_ive_got_your_back', anchor: 'rook', origin: [0, 2], targets: [[2, 2], [2, 1]], enemies: [], allies: [['knight', 2, 2]], mode: 'beam' },
  { dir: 'rook', id: 'r3_cut_across', anchor: 'rook', origin: [2, 2], targets: [[1, 1]], enemies: [['pawn', 1, 1]], allies: [], mode: 'beam' },
  { dir: 'rook', id: 'r4_move_in_unison', anchor: 'rook', origin: [1, 3], targets: [[1, 1], [3, 1]], enemies: [], allies: [['rook', 3, 3]], mode: 'beam' },
  { dir: 'rook', id: 'r5_catapult', anchor: 'rook', origin: [2, 2], targets: [[2, 0]], enemies: [['knight', 2, 0]], allies: [['pawn', 2, 3]], mode: 'arc' },
  { dir: 'rook', id: 'r6_garrison', anchor: 'rook', origin: [2, 2], targets: [[2, 1]], enemies: [], allies: [['king', 2, 3]], mode: 'beam' },

  // QUEENS (4)
  { dir: 'queen', id: 'q1_royal_summons', anchor: 'queen', origin: [2, 2], targets: [[2, 3]], enemies: [], allies: [['pawn', 2, 4]], mode: 'beam' },
  { dir: 'queen', id: 'q2_the_queens_gambit', anchor: 'queen', origin: [3, 3], targets: [[1, 1]], enemies: [['rook', 1, 1]], allies: [['bishop', 1, 3]], mode: 'arc' },
  { dir: 'queen', id: 'q3_all_rise', anchor: 'queen', origin: [2, 1], targets: [[1, 2], [3, 2]], enemies: [], allies: [['pawn', 1, 3], ['pawn', 3, 3]], mode: 'beam' },
  { dir: 'queen', id: 'q4_one_fell_swoop', anchor: 'queen', origin: [2, 3], targets: [[2, 0]], enemies: [['pawn', 2, 2], ['knight', 2, 1]], allies: [['rook', 2, 4]], mode: 'beam' },

  // KINGS (4)
  { dir: 'king', id: 'k1_conscription', anchor: 'king', origin: [0, 4], targets: [[0, 3], [1, 4]], enemies: [], allies: [], mode: 'beam' },
  { dir: 'king', id: 'k2_royal_knighting', anchor: 'king', origin: [2, 3], targets: [[3, 3]], enemies: [], allies: [['pawn', 3, 3]], mode: 'arc' },
  { dir: 'king', id: 'k3_royal_execution', anchor: 'king', origin: [2, 3], targets: [[2, 1]], enemies: [['bishop', 2, 1]], allies: [['rook', 1, 3]], mode: 'beam' },
  { dir: 'king', id: 'k4_banish', anchor: 'king', origin: [2, 3], targets: [[2, 0]], enemies: [['knight', 2, 2], ['pawn', 2, 1]], allies: [], mode: 'beam' },
];

for (const scene of SCENES_36) {
  const outDir = path.join(ROOT, 'public/assets/cards', scene.dir);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const originTile = getTile(scene.origin[0], scene.origin[1]);
  const targetTiles = scene.targets.map(([c, r]) => getTile(c, r));

  // Render board tiles
  const boardPolys = tiles.map(t => {
    const isOrigin = t.c === scene.origin[0] && t.r === scene.origin[1];
    const isTarget = scene.targets.some(([tc, tr]) => tc === t.c && tr === t.r);
    let fill = t.isLight ? lightColor : darkColor;
    let stroke = borderColor;
    let sw = '0.5';

    if (isTarget) {
      fill = 'rgba(212, 175, 55, 0.42)';
      stroke = '#D4AF37';
      sw = '1.6';
    } else if (isOrigin) {
      stroke = '#D4AF37';
      sw = '1.3';
    }

    return `<polygon points="${t.pts}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
  }).join('\n      ');

  // Render vectors
  const vectors = targetTiles.map(tt => {
    return (scene.mode === 'arc' ? renderArc(originTile, tt, 21) : renderBeam(originTile, tt)) + '\n' + renderReticle(tt);
  }).join('\n');

  // Sort all pieces by depth (c + r) so foreground overlaps background naturally
  const piecesToDraw = [
    { type: scene.anchor, c: scene.origin[0], r: scene.origin[1], scale: 1.0, isAllied: true, opacity: 1.0 },
    ...scene.allies.map(([type, c, r]) => ({ type, c, r, scale: 0.85, isAllied: true, opacity: 0.92 })),
    ...scene.enemies.map(([type, c, r]) => ({ type, c, r, scale: 0.88, isAllied: false, opacity: 0.95 })),
  ].sort((a, b) => (a.c + a.r) - (b.c + b.r));

  const piecesSvg = piecesToDraw.map(p => {
    const pt = getTile(p.c, p.r);
    return renderPiece(p.type, pt.cx, pt.cy, p.scale, p.isAllied, p.opacity);
  }).join('\n');

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 96" width="120" height="96">
  <defs>
    <linearGradient id="gold_focus" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFDF7" />
      <stop offset="35%" stop-color="#F5D061" />
      <stop offset="80%" stop-color="#D4AF37" />
      <stop offset="100%" stop-color="#AA8A2A" />
    </linearGradient>
    <linearGradient id="gold_base" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F5D061" />
      <stop offset="100%" stop-color="#7A6018" />
    </linearGradient>
  </defs>

  <!-- 5x5 COPLANAR ISOMETRIC BOARD -->
  <g class="board-5x5">
    <ellipse cx="60" cy="82" rx="56" ry="14" fill="#0A0B0C" opacity="0.6" />
    <polygon points="${leftSlabPoints}" fill="${slabLeft}" />
    <polygon points="${rightSlabPoints}" fill="${slabRight}" />
      ${boardPolys}
  </g>

  <!-- TACTICAL TRAJECTORY VECTORS -->
  ${vectors}

  <!-- STAUNTON CHESS PIECES -->
  ${piecesSvg}
</svg>
`;

  fs.writeFileSync(path.join(outDir, `${scene.id}.svg`), svgContent, 'utf8');
}

console.log(`✓ Generated all ${SCENES_36.length} canonical 36-Card Playbook SVG illustrations.`);
