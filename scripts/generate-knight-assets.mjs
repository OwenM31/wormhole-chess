import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const CATALOG_PATH = path.join(ROOT, 'src/engine/cards/cardCatalog90.json');
const OUTPUT_DIR = path.join(ROOT, 'public/assets/cards/knight');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
const knightCards = catalog.filter(c => c.anchor === 'knight');

// 5x5 Isometric Board Geometry Constants (Standardized Option B)
const W = 10.5;
const H = 5.8;
const X0 = 60;
const Y0 = 38;
const dz = 6;
const lightColor = '#D5CDC0';
const darkColor = '#2C3539';
const borderColor = '#141618';
const slabLeft = '#222629';
const slabRight = '#151719';

// Pre-calculate 25 tiles
const tiles = [];
for (let r = 0; r <= 4; r++) {
  for (let c = 0; c <= 4; c++) {
    const cx = X0 + (c - r) * W;
    const cy = Y0 + (c + r) * H;
    const isLight = (c + r) % 2 === 0;
    const pts = `${cx},${cy - H} ${cx + W},${cy} ${cx},${cy + H} ${cx - W},${cy}`;
    tiles.push({ c, r, cx, cy, isLight, pts });
  }
}

function getTile(c, r) {
  return tiles.find(t => t.c === c && t.r === r);
}

// 3D Slab Thickness along outer bottom perimeter
const leftPerimeter = [];
const t04 = getTile(0, 4);
leftPerimeter.push(`${t04.cx - W},${t04.cy}`);
for (let c = 0; c <= 4; c++) {
  const t = getTile(c, 4);
  leftPerimeter.push(`${t.cx},${t.cy + H}`);
}

const rightPerimeter = [];
const t44 = getTile(4, 4);
rightPerimeter.push(`${t44.cx},${t44.cy + H}`);
for (let r = 4; r >= 0; r--) {
  const t = getTile(4, r);
  rightPerimeter.push(`${t.cx + W},${t.cy}`);
}

const leftTopStr = leftPerimeter.join(' ');
const leftBottomStr = leftPerimeter.slice().reverse().map(pt => {
  const [x, y] = pt.split(',').map(Number);
  return `${x},${y + dz}`;
}).join(' ');
const leftSlabPoints = `${leftTopStr} ${leftBottomStr}`;

const rightTopStr = rightPerimeter.join(' ');
const rightBottomStr = rightPerimeter.slice().reverse().map(pt => {
  const [x, y] = pt.split(',').map(Number);
  return `${x},${y + dz}`;
}).join(' ');
const rightSlabPoints = `${rightTopStr} ${rightBottomStr}`;

// Staunton Knight Silhouette
function renderKnightPiece(cx, cy, scale = 1.0, isAllied = true, opacity = 1.0) {
  const baseGrad = isAllied ? 'url(#goldK_base)' : '#4A5568';
  const focusGrad = isAllied ? 'url(#goldK_focus)' : '#718096';
  return `
  <g class="knight-piece" transform="translate(${cx}, ${cy}) scale(${scale})" opacity="${opacity}">
    <ellipse cx="0" cy="1.0" rx="5.4" ry="2.8" fill="#0A0B0C" opacity="0.65" />
    <ellipse cx="0" cy="0.2" rx="5.0" ry="2.75" fill="${baseGrad}" stroke="#16181A" stroke-width="0.6" />
    <ellipse cx="0" cy="-0.8" rx="4.0" ry="2.2" fill="${focusGrad}" stroke="#16181A" stroke-width="0.4" />
    <ellipse cx="0" cy="-1.8" rx="3.0" ry="1.6" fill="${baseGrad}" />
    <g transform="translate(0, -1.8) scale(0.10) translate(-257, -312)">
      <path d="
        M 212 312
        C 212 274 224 242 240 224
        L 202 212
        C 194 208 192 196 200 188
        L 232 156
        C 240 148 252 150 260 160
        L 272 176
        L 282 150
        C 286 142 296 142 300 150
        L 308 174
        C 322 192 330 216 330 246
        C 330 276 314 304 302 312
        Z
      " fill="${focusGrad}" stroke="#16181A" stroke-width="6" stroke-linejoin="round" />
      <path d="M 232 156 C 240 148 252 150 260 160 L 272 176" fill="none" stroke="#FFFDF7" stroke-width="5" stroke-linecap="round" />
      <circle cx="236" cy="180" r="5.5" fill="#16181A" />
      <circle cx="234.5" cy="178.5" r="1.8" fill="#FFFDF7" />
      <circle cx="210" cy="198" r="4.0" fill="#16181A" />
      <path d="M 278 186 C 292 202 298 222 298 244" fill="none" stroke="#16181A" stroke-width="6" stroke-linecap="round" />
      <path d="M 286 226 C 298 240 304 258 304 278" fill="none" stroke="#16181A" stroke-width="6" stroke-linecap="round" />
      <path d="M 283 189 C 295 204 300 222 300 242" fill="none" stroke="#FFFDF7" stroke-width="2.5" stroke-linecap="round" opacity="0.8" />
      <path d="M 291 229 C 301 242 306 258 306 276" fill="none" stroke="#FFFDF7" stroke-width="2.5" stroke-linecap="round" opacity="0.8" />
    </g>
  </g>`;
}

// Staunton Pawn Silhouette
function renderPawnPiece(cx, cy, scale = 0.85, isAllied = true, opacity = 1.0) {
  const baseGrad = isAllied ? 'url(#goldK_base)' : '#4A5568';
  const focusGrad = isAllied ? 'url(#goldK_focus)' : '#718096';
  return `
  <g class="pawn-piece" transform="translate(${cx}, ${cy}) scale(${scale})" opacity="${opacity}">
    <ellipse cx="0" cy="0.8" rx="4.0" ry="2.2" fill="#0A0B0C" opacity="0.6" />
    <ellipse cx="0" cy="0.2" rx="3.6" ry="2.0" fill="${baseGrad}" stroke="#16181A" stroke-width="0.5" />
    <path d="M -2.2 -0.2 C -2.2 -3.0 -1.2 -6.5 -0.8 -9.0 L 0.8 -9.0 C 1.2 -6.5 2.2 -3.0 2.2 -0.2 Z" fill="${focusGrad}" stroke="#16181A" stroke-width="0.5" />
    <ellipse cx="0" cy="-9.2" rx="2.2" ry="1.2" fill="${baseGrad}" stroke="#16181A" stroke-width="0.4" />
    <circle cx="0" cy="-12.2" r="2.2" fill="${focusGrad}" stroke="#16181A" stroke-width="0.5" />
    <circle cx="-0.6" cy="-12.8" r="0.7" fill="#FFFDF7" opacity="0.9" />
  </g>`;
}

// Top HUD Condition Badge
function renderConditionBadge(conditionText) {
  const charWidth = 4.6;
  const textWidth = Math.max(70, conditionText.length * charWidth + 24);
  const badgeWidth = Math.min(108, textWidth);
  const startX = (120 - badgeWidth) / 2;

  return `
  <!-- CONDITION HUD BADGE -->
  <g transform="translate(${startX.toFixed(1)}, 6)">
    <rect x="0" y="0" width="${badgeWidth.toFixed(1)}" height="11" rx="2" fill="#141618" stroke="#D4AF37" stroke-width="0.8" />
    <circle cx="8" cy="5.5" r="2.2" fill="#D4AF37" />
    <text x="14" y="8.2" fill="#FAF9F6" font-size="4.7" font-family="monospace" font-weight="bold" letter-spacing="0.3">${conditionText}</text>
  </g>`;
}

// Parabolic Ballistic Leap Arc
function renderParabolicArc(fromTile, toTile, peakHeight = 24, strokeWidth = 2.4, color = 'url(#arcK_focus)') {
  const launchX = fromTile.cx - 3.5;
  const launchY = fromTile.cy - 6.5;
  const landX = toTile.cx;
  const landY = toTile.cy - 1.5;
  const peakX = (launchX + landX) / 2;
  const peakY = Math.min(launchY, landY) - peakHeight;

  return `
  <!-- 3D HIGH BALLISTIC LEAP ARC -->
  <path d="M ${launchX} ${launchY} Q ${peakX} ${peakY} ${landX} ${landY}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" />
  <path d="M ${launchX} ${launchY} Q ${peakX} ${peakY} ${landX} ${landY}" fill="none" stroke="#FFFDF7" stroke-width="0.85" stroke-dasharray="2.5 1.5" />`;
}

// Target Landing Reticle
function renderTargetReticle(cx, cy, radius = 6.5) {
  return `
  <ellipse cx="${cx}" cy="${cy}" rx="${radius}" ry="${radius * 0.54}" fill="none" stroke="#D4AF37" stroke-width="1.3" stroke-dasharray="2 1.5" />
  <polygon points="${cx},${cy + 2.8} ${cx - 2.8},${cy - 2.2} ${cx + 2.8},${cy - 2.2}" fill="#D4AF37" />`;
}

// Caltrop / Wall Slab
function renderWallSlab(cx, cy, width = 7.0, height = 9.0) {
  return `
  <g transform="translate(${cx}, ${cy})">
    <ellipse cx="0" cy="1.0" rx="${width}" ry="${width * 0.5}" fill="rgba(56, 189, 248, 0.25)" />
    <polygon points="0,${-height} ${width},${-height + 3.5} ${width},3.5 0,7 -${width},3.5 -${width},${-height + 3.5}" fill="rgba(56, 189, 248, 0.45)" stroke="#38BDF8" stroke-width="0.8" />
    <line x1="0" y1="${-height}" x2="0" y2="7" stroke="#FFFDF7" stroke-width="0.7" opacity="0.8" />
  </g>`;
}

// Kinetic Shield Dome
function renderShieldDome(cx, cy, rx = 9.5, ry = 13.0) {
  return `
  <g transform="translate(${cx}, ${cy})">
    <ellipse cx="0" cy="${-ry * 0.4}" rx="${rx}" ry="${ry}" fill="rgba(56, 189, 248, 0.22)" stroke="#38BDF8" stroke-width="1.2" stroke-dasharray="3 2" />
    <ellipse cx="0" cy="${-ry * 0.4}" rx="${rx * 0.7}" ry="${ry * 0.7}" fill="none" stroke="#FFFDF7" stroke-width="0.6" opacity="0.7" />
  </g>`;
}

// Swap Arrow
function renderSwapArrow(fromTile, toTile) {
  const mx = (fromTile.cx + toTile.cx) / 2;
  const my = (fromTile.cy + toTile.cy) / 2 - 12;
  return `
  <path d="M ${fromTile.cx} ${fromTile.cy - 4} Q ${mx} ${my} ${toTile.cx} ${toTile.cy - 4}" fill="none" stroke="#D4AF37" stroke-width="1.6" stroke-dasharray="2.5 1.5" />
  <polygon points="${toTile.cx},${toTile.cy - 4} ${toTile.cx - 3},${toTile.cy - 8} ${toTile.cx + 2},${toTile.cy - 7}" fill="#D4AF37" />`;
}

// Generate specific SVG for each card
function generateCardSvg(card) {
  const artId = card.artId || card.id;

  // Derive condition badge text
  let condText = `COND: ${card.condition_exact.toUpperCase()}`;
  if (condText.length > 25) {
    if (card.condition_type === 'Momentum') condText = `COND: ${card.condition_exact.toUpperCase()}`.replace('JUST ', '').replace(' (3+ TURNS)', '');
    else if (card.condition_type === 'Blocked') condText = `COND: ${card.condition_exact.toUpperCase()}`.replace(' (<= 2 MOVES)', '');
    else if (card.condition_type === 'Threat') condText = `COND: ${card.condition_exact.toUpperCase()}`.replace(' (CROSSFIRE)', '');
    else if (card.condition_type === 'Position') condText = `COND: ${card.condition_exact.toUpperCase()}`.replace(' (RANK 1)', '').replace(' / EDGE', '');
    else if (card.condition_type === 'Neighbors') condText = `COND: ${card.condition_exact.toUpperCase()}`;
  }
  // Safe limit
  if (condText.length > 24) condText = condText.slice(0, 24);

  // Setup default tile highlights
  let originC = 3, originR = 2; // Default knight origin
  let targetC = 1, targetR = 2; // Default leap target
  let extraElements = [];
  let tileModifiers = {}; // key: `c,r` -> { fill, stroke, strokeWidth, extra }

  // Tailor visual optics per card ID
  switch (card.id) {
    case 'knight_cavalry_charge': {
      // Extended (3,1) Camel Leap
      originC = 3; originR = 2;
      targetC = 1; targetR = 2; // over center
      tileModifiers['1,2'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      tileModifiers['2,2'] = { extra: `<ellipse cx="${getTile(2,2).cx}" cy="${getTile(2,2).cy}" rx="4" ry="2" fill="none" stroke="rgba(212,175,55,0.35)" stroke-width="0.8" stroke-dasharray="1.5 1.5" />` };
      extraElements.push(renderParabolicArc(getTile(3,2), getTile(1,2), 26));
      extraElements.push(renderTargetReticle(getTile(1,2).cx, getTile(1,2).cy));
      extraElements.push(`<path d="M ${getTile(3,2).cx} ${getTile(3,2).cy} Q ${getTile(2,2).cx} ${getTile(2,2).cy} ${getTile(1,2).cx} ${getTile(1,2).cy}" fill="none" stroke="#D4AF37" stroke-width="1.2" stroke-dasharray="2 1.5" opacity="0.4" />`);
      break;
    }

    case 'knight_double_canter': {
      // Double sequential knight hop: 3,3 -> 2,1 -> 0,2
      originC = 3; originR = 3;
      const hop1 = getTile(2, 1);
      const hop2 = getTile(0, 2);
      tileModifiers['2,1'] = { fill: 'rgba(212, 175, 55, 0.3)', stroke: '#D4AF37', strokeWidth: '1.4' };
      tileModifiers['0,2'] = { fill: 'rgba(212, 175, 55, 0.45)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(renderParabolicArc(getTile(3,3), hop1, 16));
      extraElements.push(renderParabolicArc(hop1, hop2, 16));
      extraElements.push(renderTargetReticle(hop1.cx, hop1.cy, 5.0));
      extraElements.push(renderTargetReticle(hop2.cx, hop2.cy, 6.5));
      break;
    }

    case 'knight_spring_vault': {
      // Zebra (3,2) vault: 3,1 -> 0,3
      originC = 3; originR = 1;
      targetC = 0; targetR = 3;
      tileModifiers['0,3'] = { fill: 'rgba(212, 175, 55, 0.45)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(renderParabolicArc(getTile(3,1), getTile(0,3), 30));
      extraElements.push(renderTargetReticle(getTile(0,3).cx, getTile(0,3).cy, 6.5));
      extraElements.push(`<line x1="${getTile(3,1).cx}" y1="${getTile(3,1).cy}" x2="${getTile(0,3).cx}" y2="${getTile(0,3).cy}" stroke="#D4AF37" stroke-width="1.0" stroke-dasharray="2 2" opacity="0.4" />`);
      break;
    }

    case 'knight_tactical_disengage': {
      // Dabbaba 2,0 orthogonal jump: 2,3 -> 2,1 over 2,2
      originC = 2; originR = 3;
      targetC = 2; targetR = 1;
      tileModifiers['2,1'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      tileModifiers['2,2'] = { extra: `<ellipse cx="${getTile(2,2).cx}" cy="${getTile(2,2).cy}" rx="3.5" ry="1.8" fill="none" stroke="#EF4444" stroke-width="1.0" opacity="0.6" />` };
      extraElements.push(renderParabolicArc(getTile(2,3), getTile(2,1), 22));
      extraElements.push(renderTargetReticle(getTile(2,1).cx, getTile(2,1).cy));
      break;
    }

    case 'knight_outrider_loop': {
      // Knight hop 3,2 -> 1,3 and recoil to 2,3
      originC = 3; originR = 2;
      const tOut = getTile(1, 3);
      const tRecoil = getTile(2, 3);
      tileModifiers['1,3'] = { fill: 'rgba(212, 175, 55, 0.25)', stroke: '#D4AF37', strokeWidth: '1.2' };
      tileModifiers['2,3'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(renderParabolicArc(getTile(3,2), tOut, 18));
      extraElements.push(`<path d="M ${tOut.cx} ${tOut.cy - 2} L ${tRecoil.cx} ${tRecoil.cy - 2}" stroke="#D4AF37" stroke-width="1.5" stroke-dasharray="2 1.5" />`);
      extraElements.push(renderTargetReticle(tRecoil.cx, tRecoil.cy));
      break;
    }

    case 'knight_stable_swap': {
      // Swap with back rank ally: Knight at 1,0 and partner at 3,0
      originC = 1; originR = 0;
      const partner = getTile(3, 0);
      tileModifiers['1,0'] = { stroke: '#D4AF37', strokeWidth: '1.5' };
      tileModifiers['3,0'] = { fill: 'rgba(212, 175, 55, 0.35)', stroke: '#D4AF37', strokeWidth: '1.5' };
      extraElements.push(renderSwapArrow(getTile(1,0), partner));
      extraElements.push(renderSwapArrow(partner, getTile(1,0)));
      extraElements.push(renderKnightPiece(partner.cx, partner.cy, 0.7, false, 0.5));
      break;
    }

    case 'knight_relay_switch': {
      // Swap within knight jump: 2,2 and 0,3
      originC = 2; originR = 2;
      const ally = getTile(0, 3);
      tileModifiers['2,2'] = { stroke: '#D4AF37', strokeWidth: '1.5' };
      tileModifiers['0,3'] = { fill: 'rgba(212, 175, 55, 0.35)', stroke: '#D4AF37', strokeWidth: '1.5' };
      extraElements.push(renderSwapArrow(getTile(2,2), ally));
      extraElements.push(renderPawnPiece(ally.cx, ally.cy, 0.8, true, 0.7));
      break;
    }

    case 'knight_saddle_carry': {
      // Knight leaps 3,2 -> 1,3, carries adjacent pawn 3,3 to vacated square 3,2
      originC = 3; originR = 2;
      const adjPawn = getTile(3, 3);
      const target = getTile(1, 3);
      tileModifiers['1,3'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(renderPawnPiece(adjPawn.cx, adjPawn.cy, 0.75, true, 0.9));
      extraElements.push(renderParabolicArc(getTile(3,2), target, 22));
      extraElements.push(`<path d="M ${adjPawn.cx} ${adjPawn.cy - 3} L ${getTile(3,2).cx} ${getTile(3,2).cy - 3}" stroke="#D4AF37" stroke-width="1.4" stroke-dasharray="2 1.5" />`);
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      break;
    }

    case 'knight_breach_follow_up': {
      // Knight leaps 2,3 -> 0,2, defender at 2,4 moves into 2,3
      originC = 2; originR = 3;
      const defender = getTile(2, 4);
      const target = getTile(0, 2);
      tileModifiers['0,2'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(renderParabolicArc(getTile(2,3), target, 24));
      extraElements.push(renderPawnPiece(defender.cx, defender.cy, 0.8, true, 0.7));
      extraElements.push(`<path d="M ${defender.cx} ${defender.cy - 3} L ${getTile(2,3).cx} ${getTile(2,3).cy - 3}" stroke="#D4AF37" stroke-width="1.4" stroke-dasharray="2 1.5" />`);
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      break;
    }

    case 'knight_draft_slipstream': {
      // Knight leaps 3,1 -> 1,2, adjacent pawn 3,2 moves 1 sq forward to 2,2
      originC = 3; originR = 1;
      const pawn = getTile(3, 2);
      const target = getTile(1, 2);
      tileModifiers['1,2'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      tileModifiers['2,2'] = { fill: 'rgba(212, 175, 55, 0.25)', stroke: '#D4AF37', strokeWidth: '1.2' };
      extraElements.push(renderPawnPiece(pawn.cx, pawn.cy, 0.75, true, 0.9));
      extraElements.push(renderParabolicArc(getTile(3,1), target, 22));
      extraElements.push(`<path d="M ${pawn.cx} ${pawn.cy - 3} L ${getTile(2,2).cx} ${getTile(2,2).cy - 3}" stroke="#D4AF37" stroke-width="1.3" stroke-dasharray="2 1.5" />`);
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      break;
    }

    case 'knight_ray_intercept': {
      // Pinned to King along pin ray: King at 3,3, Knight at 2,2, Attacker at 0,0
      originC = 2; originR = 2;
      tileModifiers['2,2'] = { stroke: '#EF4444', strokeWidth: '1.6' };
      tileModifiers['1,1'] = { fill: 'rgba(212, 175, 55, 0.4)', stroke: '#D4AF37', strokeWidth: '1.5' };
      // Pin Ray
      extraElements.push(`<line x1="${getTile(3,3).cx}" y1="${getTile(3,3).cy}" x2="${getTile(0,0).cx}" y2="${getTile(0,0).cy}" stroke="#EF4444" stroke-width="1.4" stroke-dasharray="3 2" opacity="0.8" />`);
      // Charge arrow along ray
      extraElements.push(`<line x1="${getTile(2,2).cx}" y1="${getTile(2,2).cy - 4}" x2="${getTile(1,1).cx}" y2="${getTile(1,1).cy - 4}" stroke="#D4AF37" stroke-width="2.2" stroke-linecap="round" />`);
      extraElements.push(renderTargetReticle(getTile(1,1).cx, getTile(1,1).cy, 5.5));
      break;
    }

    case 'knight_cornered_dash': {
      // Low mobility: cornered knight at 4,0 dashes 2 sq diagonally to 2,2
      originC = 4; originR = 0;
      tileModifiers['2,2'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(`<line x1="${getTile(4,0).cx}" y1="${getTile(4,0).cy}" x2="${getTile(2,2).cx}" y2="${getTile(2,2).cy}" stroke="#D4AF37" stroke-width="2.2" stroke-dasharray="3 1.5" />`);
      extraElements.push(renderTargetReticle(getTile(2,2).cx, getTile(2,2).cy));
      break;
    }

    case 'knight_side_trot': {
      // Stepping 1 sq orthogonally onto safe square: 2,2 -> 2,3
      originC = 2; originR = 2;
      tileModifiers['2,3'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(`<line x1="${getTile(2,2).cx}" y1="${getTile(2,2).cy}" x2="${getTile(2,3).cx}" y2="${getTile(2,3).cy}" stroke="#D4AF37" stroke-width="2.2" stroke-linecap="round" />`);
      extraElements.push(renderTargetReticle(getTile(2,3).cx, getTile(2,3).cy));
      break;
    }

    case 'knight_straight_lance': {
      // 2 sq orthogonal lunge: 3,2 -> 1,2
      originC = 3; originR = 2;
      tileModifiers['1,2'] = { fill: 'rgba(239, 68, 68, 0.35)', stroke: '#EF4444', strokeWidth: '1.8' };
      extraElements.push(`<line x1="${getTile(3,2).cx}" y1="${getTile(3,2).cy - 4}" x2="${getTile(1,2).cx}" y2="${getTile(1,2).cy - 4}" stroke="#D4AF37" stroke-width="2.6" stroke-linecap="round" />`);
      extraElements.push(`<polygon points="${getTile(1,2).cx},${getTile(1,2).cy - 4} ${getTile(1,2).cx + 3},${getTile(1,2).cy - 7} ${getTile(1,2).cx + 3},${getTile(1,2).cy - 1}" fill="#D4AF37" />`);
      extraElements.push(renderTargetReticle(getTile(1,2).cx, getTile(1,2).cy));
      break;
    }

    case 'knight_formation_stride': {
      // Step 1 sq ortho (2,2 -> 2,3) then knight leap (2,3 -> 0,2)
      originC = 2; originR = 2;
      const stepT = getTile(2, 3);
      const leapT = getTile(0, 2);
      tileModifiers['2,3'] = { fill: 'rgba(212, 175, 55, 0.25)', stroke: '#D4AF37', strokeWidth: '1.2' };
      tileModifiers['0,2'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(`<line x1="${getTile(2,2).cx}" y1="${getTile(2,2).cy}" x2="${stepT.cx}" y2="${stepT.cy}" stroke="#D4AF37" stroke-width="1.8" stroke-dasharray="2 1.5" />`);
      extraElements.push(renderParabolicArc(stepT, leapT, 20));
      extraElements.push(renderTargetReticle(leapT.cx, leapT.cy));
      break;
    }

    case 'knight_parting_kick': {
      // Rear-kick capture on exit: Knight at 2,2 leaps to 0,3, destroying enemy at 3,2
      originC = 2; originR = 2;
      const target = getTile(0, 3);
      const enemy = getTile(3, 2);
      tileModifiers['0,3'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      tileModifiers['3,2'] = { fill: 'rgba(239, 68, 68, 0.35)', stroke: '#EF4444', strokeWidth: '1.8' };
      extraElements.push(renderParabolicArc(getTile(2,2), target, 22));
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      extraElements.push(`<line x1="${getTile(2,2).cx}" y1="${getTile(2,2).cy - 4}" x2="${enemy.cx}" y2="${enemy.cy - 4}" stroke="#EF4444" stroke-width="2.2" stroke-dasharray="2 1.5" />`);
      extraElements.push(`<circle cx="${enemy.cx}" cy="${enemy.cy}" r="4" fill="none" stroke="#EF4444" stroke-width="1.5" />`);
      break;
    }

    case 'knight_trampling_check': {
      // Intermediate path trample: 3,2 -> 1,3 over elbow 2,2 delivering check
      originC = 3; originR = 2;
      const elbow = getTile(2, 2);
      const target = getTile(1, 3);
      tileModifiers['2,2'] = { fill: 'rgba(239, 68, 68, 0.35)', stroke: '#EF4444', strokeWidth: '1.5' };
      tileModifiers['1,3'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(renderParabolicArc(getTile(3,2), target, 24));
      extraElements.push(`<line x1="${getTile(3,2).cx}" y1="${getTile(3,2).cy}" x2="${elbow.cx}" y2="${elbow.cy}" stroke="#D4AF37" stroke-width="1.2" stroke-dasharray="2 1.5" />`);
      extraElements.push(`<line x1="${elbow.cx}" y1="${elbow.cy}" x2="${target.cx}" y2="${target.cy}" stroke="#D4AF37" stroke-width="1.2" stroke-dasharray="2 1.5" />`);
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      break;
    }

    case 'knight_twin_javelin': {
      // Forking ranged strike: Knight at 2,2 targeting enemy at 0,3 and 0,1
      originC = 2; originR = 2;
      const fork1 = getTile(0, 3);
      const fork2 = getTile(0, 1);
      tileModifiers['0,3'] = { fill: 'rgba(239, 68, 68, 0.35)', stroke: '#EF4444', strokeWidth: '1.6' };
      tileModifiers['0,1'] = { fill: 'rgba(239, 68, 68, 0.35)', stroke: '#EF4444', strokeWidth: '1.6' };
      extraElements.push(`<line x1="${getTile(2,2).cx}" y1="${getTile(2,2).cy - 6}" x2="${fork1.cx}" y2="${fork1.cy - 4}" stroke="#D4AF37" stroke-width="1.8" stroke-dasharray="2.5 1.5" />`);
      extraElements.push(`<line x1="${getTile(2,2).cx}" y1="${getTile(2,2).cy - 6}" x2="${fork2.cx}" y2="${fork2.cy - 4}" stroke="#D4AF37" stroke-width="1.8" stroke-dasharray="2.5 1.5" />`);
      extraElements.push(`<circle cx="${fork1.cx}" cy="${fork1.cy}" r="4.5" fill="none" stroke="#EF4444" stroke-width="1.2" />`);
      extraElements.push(`<circle cx="${fork2.cx}" cy="${fork2.cy}" r="4.5" fill="none" stroke="#EF4444" stroke-width="1.2" />`);
      break;
    }

    case 'knight_dragoon_dive': {
      // Threat hunting: high dive leap 3,1 -> 1,2
      originC = 3; originR = 1;
      targetC = 1; targetR = 2;
      tileModifiers['1,2'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(renderParabolicArc(getTile(3,1), getTile(1,2), 28, 2.8));
      extraElements.push(renderTargetReticle(getTile(1,2).cx, getTile(1,2).cy));
      break;
    }

    case 'knight_jousting_pass': {
      // Contested crossfire trample: 2,3 -> 0,2
      originC = 2; originR = 3;
      targetC = 0; targetR = 2;
      tileModifiers['0,2'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      tileModifiers['1,2'] = { fill: 'rgba(239, 68, 68, 0.3)', stroke: '#EF4444', strokeWidth: '1.2' };
      extraElements.push(renderParabolicArc(getTile(2,3), getTile(0,2), 24));
      extraElements.push(renderTargetReticle(getTile(0,2).cx, getTile(0,2).cy));
      break;
    }

    case 'knight_bastion_stance': {
      // Corner breakout shield: Knight at 4,0 with kinetic shield
      originC = 4; originR = 0;
      tileModifiers['4,0'] = { stroke: '#38BDF8', strokeWidth: '1.8' };
      extraElements.push(renderShieldDome(getTile(4,0).cx, getTile(4,0).cy));
      break;
    }

    case 'knight_drop_caltrops': {
      // Center square 2,2 drops caltrops on 2,1 and 2,3
      originC = 2; originR = 2;
      tileModifiers['2,1'] = { fill: 'rgba(56, 189, 248, 0.25)', stroke: '#38BDF8', strokeWidth: '1.4' };
      tileModifiers['2,3'] = { fill: 'rgba(56, 189, 248, 0.25)', stroke: '#38BDF8', strokeWidth: '1.4' };
      extraElements.push(renderWallSlab(getTile(2,1).cx, getTile(2,1).cy));
      extraElements.push(renderWallSlab(getTile(2,3).cx, getTile(2,3).cy));
      break;
    }

    case 'knight_stable_barricade': {
      // Rank 1 knight guards ally at 3,2 with shield
      originC = 3; originR = 0;
      const guarded = getTile(3, 2);
      tileModifiers['3,0'] = { stroke: '#D4AF37', strokeWidth: '1.4' };
      tileModifiers['3,2'] = { stroke: '#38BDF8', strokeWidth: '1.6' };
      extraElements.push(`<line x1="${getTile(3,0).cx}" y1="${getTile(3,0).cy}" x2="${guarded.cx}" y2="${guarded.cy}" stroke="#38BDF8" stroke-width="1.4" stroke-dasharray="2 1.5" />`);
      extraElements.push(renderShieldDome(guarded.cx, guarded.cy, 8.5, 11.5));
      extraElements.push(renderPawnPiece(guarded.cx, guarded.cy, 0.75, true, 0.8));
      break;
    }

    case 'knight_flank_palisade': {
      // Flank file knight at 0,2 places palisade wall on 2,3
      originC = 0; originR = 2;
      const wallT = getTile(2, 3);
      tileModifiers['2,3'] = { fill: 'rgba(56, 189, 248, 0.25)', stroke: '#38BDF8', strokeWidth: '1.4' };
      extraElements.push(`<path d="M ${getTile(0,2).cx} ${getTile(0,2).cy - 4} Q ${getTile(1,2).cx} ${getTile(1,2).cy - 12} ${wallT.cx} ${wallT.cy - 4}" fill="none" stroke="#38BDF8" stroke-width="1.4" stroke-dasharray="2 1.5" />`);
      extraElements.push(renderWallSlab(wallT.cx, wallT.cy));
      break;
    }

    case 'knight_raider_s_aegis': {
      // Enemy territory: Knight leaps 2,2 -> 0,3 leaving wall behind at 2,2
      originC = 2; originR = 2;
      const target = getTile(0, 3);
      tileModifiers['0,3'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(renderParabolicArc(getTile(2,2), target, 24));
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      extraElements.push(renderWallSlab(getTile(2,2).cx, getTile(2,2).cy, 6.0, 7.5));
      extraElements.push(renderShieldDome(target.cx, target.cy, 8.5, 11.5));
      break;
    }

    case 'knight_summon_squire': {
      // Spawn adjacent squire pawn at 2,3
      originC = 2; originR = 2;
      const spawnT = getTile(2, 3);
      tileModifiers['2,3'] = { fill: 'rgba(212, 175, 55, 0.35)', stroke: '#D4AF37', strokeWidth: '1.6' };
      extraElements.push(renderPawnPiece(spawnT.cx, spawnT.cy, 0.8, true, 0.95));
      extraElements.push(`<ellipse cx="${spawnT.cx}" cy="${spawnT.cy}" rx="6" ry="3.2" fill="none" stroke="#D4AF37" stroke-width="1.2" stroke-dasharray="2 1.5" />`);
      break;
    }

    case 'knight_flank_recruit': {
      // Leap 2,2 -> 0,3 and spawn fresh pawn at vacated square 2,2
      originC = 2; originR = 2;
      const target = getTile(0, 3);
      tileModifiers['0,3'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(renderParabolicArc(getTile(2,2), target, 24));
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      extraElements.push(renderPawnPiece(getTile(2,2).cx, getTile(2,2).cy, 0.75, true, 0.85));
      break;
    }

    case 'knight_king_s_outrider': {
      // Resurrect captured pawn at knight-jump square from King
      originC = 2; originR = 2;
      const resT = getTile(1, 0);
      tileModifiers['1,0'] = { fill: 'rgba(212, 175, 55, 0.35)', stroke: '#D4AF37', strokeWidth: '1.6' };
      extraElements.push(renderPawnPiece(resT.cx, resT.cy, 0.8, true, 0.95));
      extraElements.push(`<ellipse cx="${resT.cx}" cy="${resT.cy}" rx="6.5" ry="3.5" fill="none" stroke="#D4AF37" stroke-width="1.4" stroke-dasharray="2 1.5" />`);
      break;
    }

    case 'knight_cavalry_remount': {
      // Linked cavalry: dual pawns spawned at 3,2 and 1,2
      originC = 2; originR = 2;
      const sp1 = getTile(3, 2);
      const sp2 = getTile(1, 2);
      tileModifiers['3,2'] = { fill: 'rgba(212, 175, 55, 0.3)', stroke: '#D4AF37', strokeWidth: '1.4' };
      tileModifiers['1,2'] = { fill: 'rgba(212, 175, 55, 0.3)', stroke: '#D4AF37', strokeWidth: '1.4' };
      extraElements.push(renderPawnPiece(sp1.cx, sp1.cy, 0.75, true, 0.9));
      extraElements.push(renderPawnPiece(sp2.cx, sp2.cy, 0.75, true, 0.9));
      break;
    }

    case 'knight_banner_rally': {
      // 2 escort pawns flank knight; resurrect pawn ahead at 2,0
      originC = 2; originR = 2;
      const p1 = getTile(2, 3);
      const p2 = getTile(3, 2);
      const res = getTile(2, 0);
      tileModifiers['2,0'] = { fill: 'rgba(212, 175, 55, 0.4)', stroke: '#D4AF37', strokeWidth: '1.6' };
      extraElements.push(renderPawnPiece(p1.cx, p1.cy, 0.75, true, 0.8));
      extraElements.push(renderPawnPiece(p2.cx, p2.cy, 0.75, true, 0.8));
      extraElements.push(renderPawnPiece(res.cx, res.cy, 0.85, true, 1.0));
      extraElements.push(`<ellipse cx="${res.cx}" cy="${res.cy}" rx="6.5" ry="3.5" fill="none" stroke="#D4AF37" stroke-width="1.3" stroke-dasharray="2 1.5" />`);
      break;
    }

    default: {
      originC = 3; originR = 2;
      targetC = 1; targetR = 2;
      tileModifiers['1,2'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(renderParabolicArc(getTile(3,2), getTile(1,2), 24));
      extraElements.push(renderTargetReticle(getTile(1,2).cx, getTile(1,2).cy));
      break;
    }
  }

  // Origin tile formatting
  const origKey = `${originC},${originR}`;
  if (!tileModifiers[origKey]) {
    tileModifiers[origKey] = { stroke: '#D4AF37', strokeWidth: '1.4' };
  } else {
    tileModifiers[origKey].stroke = '#D4AF37';
    tileModifiers[origKey].strokeWidth = '1.4';
  }

  // Render 25 tiles
  const tilesSvg = tiles.map(t => {
    const key = `${t.c},${t.r}`;
    const mod = tileModifiers[key] || {};
    const fill = mod.fill || (t.isLight ? lightColor : darkColor);
    const stroke = mod.stroke || borderColor;
    const strokeWidth = mod.strokeWidth || '0.5';
    const extra = mod.extra || '';
    return `<polygon points="${t.pts}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />${extra ? '\n      ' + extra : ''}`;
  }).join('\n      ');

  const originTile = getTile(originC, originR);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="goldK_focus" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFDF7" />
      <stop offset="35%" stop-color="#F5D061" />
      <stop offset="80%" stop-color="#D4AF37" />
      <stop offset="100%" stop-color="#AA8A2A" />
    </linearGradient>
    <linearGradient id="goldK_base" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F5D061" />
      <stop offset="100%" stop-color="#7A6018" />
    </linearGradient>
    <linearGradient id="arcK_focus" x1="1" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#D4AF37" stop-opacity="0.3" />
      <stop offset="50%" stop-color="#FFFDF7" />
      <stop offset="100%" stop-color="#D4AF37" />
    </linearGradient>
  </defs>

  ${renderConditionBadge(condText)}

  <!-- 5x5 BOARD FOUNDATION -->
  <g class="board-5x5">
    <ellipse cx="${X0}" cy="${Y0 + 8 * H + dz + 3}" rx="${5 * W + 4}" ry="${2.5 * H + 2}" fill="#0A0B0C" opacity="0.6" />
    <polygon points="${leftSlabPoints}" fill="${slabLeft}" />
    <polygon points="${rightSlabPoints}" fill="${slabRight}" />
      ${tilesSvg}
  </g>

  ${extraElements.join('\n  ')}

  <!-- STANDING STAUNTON KNIGHT PIECE -->
  ${renderKnightPiece(originTile.cx, originTile.cy)}
</svg>`;
}

// Generate all 30 Knight SVGs
console.log(`Generating ${knightCards.length} Knight vector SVG assets...`);
for (const card of knightCards) {
  const artId = card.artId || card.id;
  const filePath = path.join(OUTPUT_DIR, `${artId}.svg`);
  const svgContent = generateCardSvg(card);
  fs.writeFileSync(filePath, svgContent.trim(), 'utf8');
  console.log(`✓ Generated ${artId}.svg`);
}

console.log(`\n🎉 Successfully generated all ${knightCards.length} Knight vector assets in public/assets/cards/knight/`);
