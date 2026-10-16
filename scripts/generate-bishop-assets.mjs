import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const CATALOG_PATH = path.join(ROOT, 'src/engine/cards/cardCatalog90.json');
const OUTPUT_DIR = path.join(ROOT, 'public/assets/cards/bishop');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
const bishopCards = catalog.filter(c => c.anchor === 'bishop');

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

// Staunton Bishop Silhouette (Height 18px, Base rx=5.0, ry=2.75 centered squarely on tile)
function renderBishopPiece(cx, cy, scale = 1.0, isAllied = true, opacity = 1.0) {
  const baseGrad = isAllied ? 'url(#goldB_base)' : '#4A5568';
  const focusGrad = isAllied ? 'url(#goldB_focus)' : '#718096';
  return `
  <g class="bishop-piece" transform="translate(${cx}, ${cy}) scale(${scale})" opacity="${opacity}">
    <!-- Ground drop shadow -->
    <ellipse cx="0" cy="1.0" rx="5.4" ry="2.8" fill="#0A0B0C" opacity="0.65" />
    <!-- Turned circular plinth base -->
    <ellipse cx="0" cy="0.2" rx="5.0" ry="2.75" fill="${baseGrad}" stroke="#16181A" stroke-width="0.6" />
    <ellipse cx="0" cy="-0.8" rx="4.0" ry="2.2" fill="${focusGrad}" stroke="#16181A" stroke-width="0.4" />
    <ellipse cx="0" cy="-1.8" rx="3.0" ry="1.6" fill="${baseGrad}" />
    <!-- Tapered pedestal neck -->
    <path d="
      M -2.4 -1.8
      C -2.4 -5.5 -1.2 -9.5 -0.9 -12.0
      L 0.9 -12.0
      C 1.2 -9.5 2.4 -5.5 2.4 -1.8
      Z
    " fill="${focusGrad}" stroke="#16181A" stroke-width="0.6" />
    <!-- Waist fillet collar -->
    <ellipse cx="0" cy="-12.0" rx="2.5" ry="1.2" fill="${baseGrad}" stroke="#16181A" stroke-width="0.5" />
    <!-- Fluted mitre head -->
    <path d="
      M -2.2 -12.0
      C -3.2 -14.0 -2.6 -17.5 0 -19.0
      C 2.6 -17.5 3.2 -14.0 2.2 -12.0
      Z
    " fill="${focusGrad}" stroke="#16181A" stroke-width="0.6" />
    <!-- Authentic diagonal mitre cleft cut -->
    <path d="M 0 -13.0 L 2.2 -15.5" stroke="#16181A" stroke-width="0.9" stroke-linecap="round" />
    <!-- Finial orb atop mitre -->
    <circle cx="0" cy="-19.6" r="1.1" fill="${baseGrad}" stroke="#16181A" stroke-width="0.4" />
    <circle cx="-0.3" cy="-19.9" r="0.4" fill="#FFFDF7" opacity="0.9" />
  </g>`;
}

// Staunton Pawn Silhouette
function renderPawnPiece(cx, cy, scale = 0.85, isAllied = true, opacity = 1.0) {
  const baseGrad = isAllied ? 'url(#goldB_base)' : '#4A5568';
  const focusGrad = isAllied ? 'url(#goldB_focus)' : '#718096';
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
function renderParabolicArc(fromTile, toTile, peakHeight = 24, strokeWidth = 2.4, color = 'url(#arcB_focus)') {
  const launchX = fromTile.cx - 2.5;
  const launchY = fromTile.cy - 7.5;
  const landX = toTile.cx;
  const landY = toTile.cy - 1.5;
  const peakX = (launchX + landX) / 2;
  const peakY = Math.min(launchY, landY) - peakHeight;

  return `
  <!-- 3D HIGH BALLISTIC LEAP ARC -->
  <path d="M ${launchX} ${launchY} Q ${peakX} ${peakY} ${landX} ${landY}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" />
  <path d="M ${launchX} ${launchY} Q ${peakX} ${peakY} ${landX} ${landY}" fill="none" stroke="#FFFDF7" stroke-width="0.85" stroke-dasharray="2.5 1.5" />`;
}

// Radiant Piercing Beam
function renderPiercingBeam(fromTile, toTile, color = '#A855F7') {
  return `
  <!-- RADIANT PIERCING BEAM -->
  <line x1="${fromTile.cx}" y1="${fromTile.cy - 6}" x2="${toTile.cx}" y2="${toTile.cy - 6}" stroke="${color}" stroke-width="3.2" stroke-linecap="round" opacity="0.85" />
  <line x1="${fromTile.cx}" y1="${fromTile.cy - 6}" x2="${toTile.cx}" y2="${toTile.cy - 6}" stroke="#FFFDF7" stroke-width="1.2" stroke-linecap="round" />`;
}

// Target Landing Reticle
function renderTargetReticle(cx, cy, radius = 6.5) {
  return `
  <ellipse cx="${cx}" cy="${cy}" rx="${radius}" ry="${radius * 0.54}" fill="none" stroke="#D4AF37" stroke-width="1.3" stroke-dasharray="2 1.5" />
  <polygon points="${cx},${cy + 2.8} ${cx - 2.8},${cy - 2.2} ${cx + 2.8},${cy - 2.2}" fill="#D4AF37" />`;
}

// Cathedral Dome / Sanctuary Ward
function renderCathedralDome(cx, cy, rx = 10.5, ry = 14.5) {
  return `
  <g transform="translate(${cx}, ${cy})">
    <ellipse cx="0" cy="${-ry * 0.45}" rx="${rx}" ry="${ry}" fill="rgba(168, 85, 247, 0.22)" stroke="#A855F7" stroke-width="1.2" stroke-dasharray="3 2" />
    <ellipse cx="0" cy="${-ry * 0.45}" rx="${rx * 0.7}" ry="${ry * 0.7}" fill="none" stroke="#FFFDF7" stroke-width="0.6" opacity="0.7" />
  </g>`;
}

// Wall Slab
function renderWallSlab(cx, cy, width = 7.0, height = 9.0) {
  return `
  <g transform="translate(${cx}, ${cy})">
    <ellipse cx="0" cy="1.0" rx="${width}" ry="${width * 0.5}" fill="rgba(168, 85, 247, 0.25)" />
    <polygon points="0,${-height} ${width},${-height + 3.5} ${width},3.5 0,7 -${width},3.5 -${width},${-height + 3.5}" fill="rgba(168, 85, 247, 0.45)" stroke="#A855F7" stroke-width="0.8" />
    <line x1="0" y1="${-height}" x2="0" y2="7" stroke="#FFFDF7" stroke-width="0.7" opacity="0.8" />
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

// Generate specific SVG for each Bishop card
function generateCardSvg(card) {
  const artId = card.artId || card.id;

  // Derive condition badge text
  let condText = `COND: ${card.condition_exact.toUpperCase()}`;
  if (condText.length > 25) {
    if (card.condition_type === 'Lines') condText = `COND: ${card.condition_exact.toUpperCase()}`.replace(' (SAME CLASS)', '');
    else if (card.condition_type === 'Threat') condText = `COND: ${card.condition_exact.toUpperCase()}`.replace(' (CROSSFIRE)', '');
    else if (card.condition_type === 'Position') condText = `COND: ${card.condition_exact.toUpperCase()}`.replace(' / EDGE', '');
    else if (card.condition_type === 'Momentum') condText = `COND: ${card.condition_exact.toUpperCase()}`.replace('JUST ', '').replace(' (3+ TURNS)', '');
  }
  if (condText.length > 24) condText = condText.slice(0, 24);

  // Setup default tile highlights
  let originC = 3, originR = 3; // Standard bishop diagonal position
  let extraElements = [];
  let tileModifiers = {}; // key: `c,r` -> { fill, stroke, strokeWidth, extra }

  switch (card.id) {
    case 'bishop_file_smite': {
      // Open-file smite: Bishop at 3,3 slides ortho along open file to capture at 3,0
      originC = 3; originR = 3;
      const target = getTile(3, 0);
      tileModifiers['3,0'] = { fill: 'rgba(239, 68, 68, 0.38)', stroke: '#EF4444', strokeWidth: '1.8' };
      extraElements.push(renderPiercingBeam(getTile(3,3), target, '#D4AF37'));
      extraElements.push(renderTargetReticle(target.cx, target.cy, 6.5));
      break;
    }

    case 'bishop_censure_sweep': {
      // Diagonal slide to 1,1 with adjacent side cleave at 0,1 and 2,1
      originC = 3; originR = 3;
      const arrival = getTile(1, 1);
      tileModifiers['1,1'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      tileModifiers['0,1'] = { fill: 'rgba(239, 68, 68, 0.35)', stroke: '#EF4444', strokeWidth: '1.5' };
      tileModifiers['2,1'] = { fill: 'rgba(239, 68, 68, 0.35)', stroke: '#EF4444', strokeWidth: '1.5' };
      extraElements.push(renderPiercingBeam(getTile(3,3), arrival, '#A855F7'));
      extraElements.push(`<path d="M ${arrival.cx} ${arrival.cy - 4} Q ${arrival.cx - 6} ${arrival.cy - 10} ${getTile(0,1).cx} ${getTile(0,1).cy - 4}" stroke="#EF4444" stroke-width="1.8" stroke-dasharray="2 1.5" />`);
      extraElements.push(`<path d="M ${arrival.cx} ${arrival.cy - 4} Q ${arrival.cx + 6} ${arrival.cy - 10} ${getTile(2,1).cx} ${getTile(2,1).cy - 4}" stroke="#EF4444" stroke-width="1.8" stroke-dasharray="2 1.5" />`);
      extraElements.push(renderTargetReticle(arrival.cx, arrival.cy));
      break;
    }

    case 'bishop_piercing_ray': {
      // Double target piercing slide: 4,4 -> strikes at 2,2 and pierces through to 0,0
      originC = 4; originR = 4;
      const t1 = getTile(2, 2);
      const t2 = getTile(0, 0);
      tileModifiers['2,2'] = { fill: 'rgba(239, 68, 68, 0.35)', stroke: '#EF4444', strokeWidth: '1.6' };
      tileModifiers['0,0'] = { fill: 'rgba(239, 68, 68, 0.38)', stroke: '#EF4444', strokeWidth: '1.8' };
      extraElements.push(renderPiercingBeam(getTile(4,4), t2, '#A855F7'));
      extraElements.push(renderTargetReticle(t1.cx, t1.cy, 5.5));
      extraElements.push(renderTargetReticle(t2.cx, t2.cy, 6.5));
      break;
    }

    case 'bishop_mirror_shatter': {
      // Facing enemy bishop at 0,0: step back and destroy
      originC = 3; originR = 3;
      const enemy = getTile(0, 0);
      tileModifiers['0,0'] = { fill: 'rgba(239, 68, 68, 0.38)', stroke: '#EF4444', strokeWidth: '1.8' };
      extraElements.push(renderPiercingBeam(getTile(3,3), enemy, '#A855F7'));
      extraElements.push(`<circle cx="${enemy.cx}" cy="${enemy.cy}" r="5" fill="none" stroke="#EF4444" stroke-width="1.5" />`);
      extraElements.push(renderTargetReticle(enemy.cx, enemy.cy));
      break;
    }

    case 'bishop_halo_strike': {
      // Sightline to King: strike target at 1,1 from range without moving
      originC = 3; originR = 3;
      const target = getTile(1, 1);
      tileModifiers['1,1'] = { fill: 'rgba(239, 68, 68, 0.38)', stroke: '#EF4444', strokeWidth: '1.8' };
      extraElements.push(`<line x1="${getTile(3,3).cx}" y1="${getTile(3,3).cy - 8}" x2="${target.cx}" y2="${target.cy - 4}" stroke="#A855F7" stroke-width="2.4" stroke-dasharray="3 1.5" />`);
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      break;
    }

    case 'bishop_nave_procession': {
      // Three square file glide orthogonally: 3,3 -> 3,0
      originC = 3; originR = 3;
      const target = getTile(3, 0);
      tileModifiers['3,0'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(`<line x1="${getTile(3,3).cx}" y1="${getTile(3,3).cy}" x2="${target.cx}" y2="${target.cy}" stroke="#D4AF37" stroke-width="2.2" stroke-linecap="round" />`);
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      break;
    }

    case 'bishop_color_shift': {
      // Step 1 sq on rank to change color (3,3 -> 2,3) then diagonal slide (2,3 -> 0,1)
      originC = 3; originR = 3;
      const shift = getTile(2, 3);
      const target = getTile(0, 1);
      tileModifiers['2,3'] = { fill: 'rgba(212, 175, 55, 0.25)', stroke: '#D4AF37', strokeWidth: '1.2' };
      tileModifiers['0,1'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(`<line x1="${getTile(3,3).cx}" y1="${getTile(3,3).cy}" x2="${shift.cx}" y2="${shift.cy}" stroke="#D4AF37" stroke-width="1.8" stroke-dasharray="2 1.5" />`);
      extraElements.push(renderPiercingBeam(shift, target, '#A855F7'));
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      break;
    }

    case 'bishop_aisle_step': {
      // Step 1 sq ortho onto empty tile, inverting color: 2,2 -> 2,3
      originC = 2; originR = 2;
      const target = getTile(2, 3);
      tileModifiers['2,3'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(`<line x1="${getTile(2,2).cx}" y1="${getTile(2,2).cy}" x2="${target.cx}" y2="${target.cy}" stroke="#D4AF37" stroke-width="2.2" stroke-linecap="round" />`);
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      break;
    }

    case 'bishop_heretic_s_gambit': {
      // Knight-jump evasion: Bishop leaps 3,3 -> 1,2
      originC = 3; originR = 3;
      const target = getTile(1, 2);
      tileModifiers['1,2'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(renderParabolicArc(getTile(3,3), target, 24));
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      break;
    }

    case 'bishop_royal_approach': {
      // Orthogonal advance toward King: 2,3 -> 2,1
      originC = 2; originR = 3;
      const target = getTile(2, 1);
      tileModifiers['2,1'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(`<line x1="${getTile(2,3).cx}" y1="${getTile(2,3).cy}" x2="${target.cx}" y2="${target.cy}" stroke="#D4AF37" stroke-width="2.2" stroke-linecap="round" />`);
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      break;
    }

    case 'bishop_vaulting_escape': {
      // Vault over 1 piece: 3,3 over 2,2 to 1,1
      originC = 3; originR = 3;
      const blocker = getTile(2, 2);
      const target = getTile(1, 1);
      tileModifiers['1,1'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(renderPawnPiece(blocker.cx, blocker.cy, 0.75, true, 0.7));
      extraElements.push(renderParabolicArc(getTile(3,3), target, 24));
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      break;
    }

    case 'bishop_skyward_check': {
      // Leap over screen to check king: 4,4 over 3,3 to 2,2
      originC = 4; originR = 4;
      const screen = getTile(3, 3);
      const target = getTile(2, 2);
      tileModifiers['2,2'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(renderPawnPiece(screen.cx, screen.cy, 0.75, true, 0.7));
      extraElements.push(renderParabolicArc(getTile(4,4), target, 26));
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      break;
    }

    case 'bishop_boomerang_grace': {
      // Capture at 1,1 and recoil back to 3,3
      originC = 3; originR = 3;
      const target = getTile(1, 1);
      tileModifiers['1,1'] = { fill: 'rgba(239, 68, 68, 0.35)', stroke: '#EF4444', strokeWidth: '1.6' };
      extraElements.push(renderPiercingBeam(getTile(3,3), target, '#A855F7'));
      extraElements.push(`<path d="M ${target.cx} ${target.cy - 4} Q ${getTile(2,2).cx - 8} ${getTile(2,2).cy - 12} ${getTile(3,3).cx} ${getTile(3,3).cy - 4}" fill="none" stroke="#D4AF37" stroke-width="1.4" stroke-dasharray="2 1.5" />`);
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      break;
    }

    case 'bishop_overpass_leap': {
      // Leap directly over high-value piece at 2,2 to 1,1
      originC = 3; originR = 3;
      const target = getTile(1, 1);
      tileModifiers['1,1'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(renderParabolicArc(getTile(3,3), target, 24));
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      break;
    }

    case 'bishop_horizon_wrap': {
      // Rim wrap around: Bishop at 0,4 wraps to 4,0
      originC = 0; originR = 4;
      const target = getTile(4, 0);
      tileModifiers['4,0'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(renderParabolicArc(getTile(0,4), target, 32));
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      break;
    }

    case 'bishop_cleric_s_ward': {
      // Ward adjacent ally at 3,2 with shield
      originC = 3; originR = 3;
      const ally = getTile(3, 2);
      tileModifiers['3,2'] = { stroke: '#A855F7', strokeWidth: '1.6' };
      extraElements.push(renderCathedralDome(ally.cx, ally.cy, 8.5, 12.0));
      extraElements.push(renderPawnPiece(ally.cx, ally.cy, 0.75, true, 0.8));
      break;
    }

    case 'bishop_stained_barrier': {
      // Prism wall placed on diagonal square 2,2
      originC = 3; originR = 3;
      const wallT = getTile(2, 2);
      tileModifiers['2,2'] = { fill: 'rgba(168, 85, 247, 0.25)', stroke: '#A855F7', strokeWidth: '1.4' };
      extraElements.push(renderWallSlab(wallT.cx, wallT.cy, 7.5, 9.5));
      break;
    }

    case 'bishop_cathedral_dome': {
      // Anti-ranged cathedral dome protecting Bishop at 2,2
      originC = 2; originR = 2;
      tileModifiers['2,2'] = { stroke: '#A855F7', strokeWidth: '1.8' };
      extraElements.push(renderCathedralDome(getTile(2,2).cx, getTile(2,2).cy, 11.5, 15.5));
      break;
    }

    case 'bishop_twin_sanctuary': {
      // Dual sanctuary walls at 1,1 and 3,1
      originC = 2; originR = 2;
      const w1 = getTile(1, 1);
      const w2 = getTile(3, 1);
      tileModifiers['1,1'] = { fill: 'rgba(168, 85, 247, 0.25)', stroke: '#A855F7', strokeWidth: '1.4' };
      tileModifiers['3,1'] = { fill: 'rgba(168, 85, 247, 0.25)', stroke: '#A855F7', strokeWidth: '1.4' };
      extraElements.push(renderWallSlab(w1.cx, w1.cy));
      extraElements.push(renderWallSlab(w2.cx, w2.cy));
      break;
    }

    case 'bishop_blessed_phalanx': {
      // Diagonal pawn chain aegis: front pawn at 1,1 gets shield
      originC = 3; originR = 3;
      const p1 = getTile(2, 2);
      const p2 = getTile(1, 1);
      tileModifiers['1,1'] = { stroke: '#A855F7', strokeWidth: '1.6' };
      extraElements.push(renderPawnPiece(p1.cx, p1.cy, 0.75, true, 0.8));
      extraElements.push(renderPawnPiece(p2.cx, p2.cy, 0.75, true, 0.8));
      extraElements.push(renderCathedralDome(p2.cx, p2.cy, 8.5, 12.0));
      break;
    }

    case 'bishop_belfry_acolyte': {
      // Spawn pawn at diagonal 3,1 from corner 4,0
      originC = 4; originR = 0;
      const spawnT = getTile(3, 1);
      tileModifiers['3,1'] = { fill: 'rgba(212, 175, 55, 0.35)', stroke: '#D4AF37', strokeWidth: '1.6' };
      extraElements.push(renderPawnPiece(spawnT.cx, spawnT.cy, 0.8, true, 0.95));
      extraElements.push(`<ellipse cx="${spawnT.cx}" cy="${spawnT.cy}" rx="6" ry="3.2" fill="none" stroke="#D4AF37" stroke-width="1.2" stroke-dasharray="2 1.5" />`);
      break;
    }

    case 'bishop_conclave_summon': {
      // Central dual spawn at 1,1 and 3,1
      originC = 2; originR = 2;
      const sp1 = getTile(1, 1);
      const sp2 = getTile(3, 1);
      tileModifiers['1,1'] = { fill: 'rgba(212, 175, 55, 0.3)', stroke: '#D4AF37', strokeWidth: '1.4' };
      tileModifiers['3,1'] = { fill: 'rgba(212, 175, 55, 0.3)', stroke: '#D4AF37', strokeWidth: '1.4' };
      extraElements.push(renderPawnPiece(sp1.cx, sp1.cy, 0.75, true, 0.9));
      extraElements.push(renderPawnPiece(sp2.cx, sp2.cy, 0.75, true, 0.9));
      break;
    }

    case 'bishop_altar_revival': {
      // Resurrect captured pawn at 2,2 from rank 1 (3,3)
      originC = 3; originR = 3;
      const resT = getTile(2, 2);
      tileModifiers['2,2'] = { fill: 'rgba(212, 175, 55, 0.4)', stroke: '#D4AF37', strokeWidth: '1.6' };
      extraElements.push(renderPawnPiece(resT.cx, resT.cy, 0.85, true, 1.0));
      extraElements.push(`<ellipse cx="${resT.cx}" cy="${resT.cy}" rx="6.5" ry="3.5" fill="none" stroke="#D4AF37" stroke-width="1.3" stroke-dasharray="2 1.5" />`);
      break;
    }

    case 'bishop_cloister_initiate': {
      // From rim 0,2 spawn pawn inward at 1,2
      originC = 0; originR = 2;
      const spawnT = getTile(1, 2);
      tileModifiers['1,2'] = { fill: 'rgba(212, 175, 55, 0.35)', stroke: '#D4AF37', strokeWidth: '1.6' };
      extraElements.push(renderPawnPiece(spawnT.cx, spawnT.cy, 0.8, true, 0.95));
      extraElements.push(`<ellipse cx="${spawnT.cx}" cy="${spawnT.cy}" rx="6" ry="3.2" fill="none" stroke="#D4AF37" stroke-width="1.2" stroke-dasharray="2 1.5" />`);
      break;
    }

    case 'bishop_zealot_convert': {
      // In enemy territory, resurrect pawn behind at 3,3 from 2,2
      originC = 2; originR = 2;
      const resT = getTile(3, 3);
      tileModifiers['3,3'] = { fill: 'rgba(212, 175, 55, 0.4)', stroke: '#D4AF37', strokeWidth: '1.6' };
      extraElements.push(renderPawnPiece(resT.cx, resT.cy, 0.85, true, 1.0));
      extraElements.push(`<ellipse cx="${resT.cx}" cy="${resT.cy}" rx="6.5" ry="3.5" fill="none" stroke="#D4AF37" stroke-width="1.3" stroke-dasharray="2 1.5" />`);
      break;
    }

    case 'bishop_part_the_crowd': {
      // Step blocking pawn 2,2 forward to 2,1 and slide bishop to 1,1
      originC = 3; originR = 3;
      const pawn = getTile(2, 2);
      const pawnNew = getTile(2, 1);
      const target = getTile(1, 1);
      tileModifiers['1,1'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(renderPawnPiece(pawn.cx, pawn.cy, 0.75, true, 0.7));
      extraElements.push(`<line x1="${pawn.cx}" y1="${pawn.cy}" x2="${pawnNew.cx}" y2="${pawnNew.cy}" stroke="#D4AF37" stroke-width="1.3" stroke-dasharray="2 1.5" />`);
      extraElements.push(renderPiercingBeam(getTile(3,3), target, '#A855F7'));
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      break;
    }

    case 'bishop_tractor_grace': {
      // Tractor pull ally at 0,0 along diagonal toward 3,3 (pull to 1,1)
      originC = 3; originR = 3;
      const ally = getTile(0, 0);
      const pulled = getTile(1, 1);
      tileModifiers['1,1'] = { fill: 'rgba(212, 175, 55, 0.35)', stroke: '#D4AF37', strokeWidth: '1.6' };
      extraElements.push(renderPawnPiece(ally.cx, ally.cy, 0.75, true, 0.7));
      extraElements.push(`<line x1="${ally.cx}" y1="${ally.cy}" x2="${pulled.cx}" y2="${pulled.cy}" stroke="#A855F7" stroke-width="2.2" stroke-dasharray="2.5 1.5" />`);
      extraElements.push(renderTargetReticle(pulled.cx, pulled.cy));
      break;
    }

    case 'bishop_astral_transpose': {
      // Transpose with same-color ally at 1,1
      originC = 3; originR = 3;
      const partner = getTile(1, 1);
      tileModifiers['1,1'] = { fill: 'rgba(212, 175, 55, 0.35)', stroke: '#D4AF37', strokeWidth: '1.5' };
      extraElements.push(renderSwapArrow(getTile(3,3), partner));
      extraElements.push(renderSwapArrow(partner, getTile(3,3)));
      extraElements.push(renderBishopPiece(partner.cx, partner.cy, 0.75, false, 0.6));
      break;
    }

    case 'bishop_fervor_push': {
      // Slide diagonally to 1,1 and push adjacent pawn at 1,2 forward to 1,3
      originC = 3; originR = 3;
      const dest = getTile(1, 1);
      const pawn = getTile(1, 2);
      const pawnPushed = getTile(1, 3);
      tileModifiers['1,1'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(renderPawnPiece(pawn.cx, pawn.cy, 0.75, true, 0.8));
      extraElements.push(`<line x1="${pawn.cx}" y1="${pawn.cy}" x2="${pawnPushed.cx}" y2="${pawnPushed.cy}" stroke="#D4AF37" stroke-width="1.4" stroke-dasharray="2 1.5" />`);
      extraElements.push(renderPiercingBeam(getTile(3,3), dest, '#A855F7'));
      extraElements.push(renderTargetReticle(dest.cx, dest.cy));
      break;
    }

    case 'bishop_pilgrim_escort': {
      // Carry adjacent pawn along parallel diagonal
      originC = 3; originR = 3;
      const dest = getTile(1, 1);
      const escortP = getTile(3, 2);
      tileModifiers['1,1'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(renderPawnPiece(escortP.cx, escortP.cy, 0.75, true, 0.85));
      extraElements.push(renderPiercingBeam(getTile(3,3), dest, '#A855F7'));
      extraElements.push(renderTargetReticle(dest.cx, dest.cy));
      break;
    }

    default: {
      originC = 3; originR = 3;
      const target = getTile(1, 1);
      tileModifiers['1,1'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(renderPiercingBeam(getTile(3,3), target, '#A855F7'));
      extraElements.push(renderTargetReticle(target.cx, target.cy));
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
    <linearGradient id="goldB_focus" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFDF7" />
      <stop offset="35%" stop-color="#F5D061" />
      <stop offset="80%" stop-color="#D4AF37" />
      <stop offset="100%" stop-color="#AA8A2A" />
    </linearGradient>
    <linearGradient id="goldB_base" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F5D061" />
      <stop offset="100%" stop-color="#7A6018" />
    </linearGradient>
    <linearGradient id="arcB_focus" x1="1" y1="1" x2="0" y2="0">
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

  <!-- STANDING STAUNTON BISHOP PIECE -->
  ${renderBishopPiece(originTile.cx, originTile.cy)}
</svg>`;
}

// Generate all 30 Bishop SVGs
console.log(`Generating ${bishopCards.length} Bishop vector SVG assets...`);
for (const card of bishopCards) {
  const artId = card.artId || card.id;
  const filePath = path.join(OUTPUT_DIR, `${artId}.svg`);
  const svgContent = generateCardSvg(card);
  fs.writeFileSync(filePath, svgContent.trim(), 'utf8');
  console.log(`✓ Generated ${artId}.svg`);
}

console.log(`\n🎉 Successfully generated all ${bishopCards.length} Bishop vector assets in public/assets/cards/bishop/`);
