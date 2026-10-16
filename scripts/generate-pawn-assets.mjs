import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const CATALOG_PATH = path.join(ROOT, 'src/engine/cards/cardCatalog90.json');
const OUTPUT_DIR = path.join(ROOT, 'public/assets/cards/pawn');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
const pawnCards = catalog.filter(c => c.anchor === 'pawn');

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

// Staunton Pawn Silhouette (Height 16px, Base rx=5.0, ry=2.75 centered squarely on tile)
function renderPawnPiece(cx, cy, scale = 1.0, isAllied = true, opacity = 1.0) {
  const baseGrad = isAllied ? 'url(#goldP_base)' : '#4A5568';
  const focusGrad = isAllied ? 'url(#goldP_focus)' : '#718096';
  return `
  <g class="pawn-piece" transform="translate(${cx}, ${cy}) scale(${scale})" opacity="${opacity}">
    <!-- Ground drop shadow -->
    <ellipse cx="0" cy="1.0" rx="5.4" ry="2.8" fill="#0A0B0C" opacity="0.65" />
    <!-- Turned circular plinth base -->
    <ellipse cx="0" cy="0.2" rx="5.0" ry="2.75" fill="${baseGrad}" stroke="#16181A" stroke-width="0.6" />
    <ellipse cx="0" cy="-0.8" rx="4.0" ry="2.2" fill="${focusGrad}" stroke="#16181A" stroke-width="0.4" />
    <ellipse cx="0" cy="-1.8" rx="3.0" ry="1.6" fill="${baseGrad}" />
    <!-- Pedestal trunk with concave neck and waist collar -->
    <path d="
      M -2.6 -1.8
      C -2.6 -5.2 -1.4 -9.0 -1.1 -11.4
      L 1.1 -11.4
      C 1.4 -9.0 2.6 -5.2 2.6 -1.8
      Z
    " fill="${focusGrad}" stroke="#16181A" stroke-width="0.6" />
    <!-- Waist fillet collar -->
    <ellipse cx="0" cy="-11.4" rx="2.4" ry="1.2" fill="${baseGrad}" stroke="#16181A" stroke-width="0.5" />
    <!-- Spherical cap -->
    <circle cx="0" cy="-14.5" r="2.8" fill="${focusGrad}" stroke="#16181A" stroke-width="0.6" />
    <!-- Specular highlight -->
    <circle cx="-0.8" cy="-15.3" r="0.9" fill="#FFFDF7" opacity="0.9" />
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
function renderParabolicArc(fromTile, toTile, peakHeight = 22, strokeWidth = 2.4, color = 'url(#arcP_focus)') {
  const launchX = fromTile.cx - 2.5;
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

// Generate specific SVG for each Pawn card
function generateCardSvg(card) {
  const artId = card.artId || card.id;

  // Derive condition badge text
  let condText = `COND: ${card.condition_exact.toUpperCase()}`;
  if (condText.length > 25) {
    if (card.condition_type === 'Blocked') condText = `COND: ${card.condition_exact.toUpperCase()}`.replace(' (<= 2 MOVES)', '');
    else if (card.condition_type === 'Threat') condText = `COND: ${card.condition_exact.toUpperCase()}`.replace(' (CROSSFIRE)', '');
    else if (card.condition_type === 'Position') condText = `COND: ${card.condition_exact.toUpperCase()}`.replace(' / EDGE', '');
    else if (card.condition_type === 'Lines') condText = `COND: ${card.condition_exact.toUpperCase()}`.replace(' (SAME CLASS)', '');
  }
  if (condText.length > 24) condText = condText.slice(0, 24);

  // Setup default tile highlights
  let originC = 2, originR = 3; // Standard frontline pawn position (rank 2)
  let extraElements = [];
  let tileModifiers = {}; // key: `c,r` -> { fill, stroke, strokeWidth, extra }

  switch (card.id) {
    case 'pawn_hold_the_line': {
      // In-place diagonal capture under pin: King at 3,4, Pawn at 2,3, Attacker at 0,1, Enemy at 1,2
      originC = 2; originR = 3;
      const enemy = getTile(1, 2);
      tileModifiers['2,3'] = { stroke: '#EF4444', strokeWidth: '1.6' };
      tileModifiers['1,2'] = { fill: 'rgba(239, 68, 68, 0.35)', stroke: '#EF4444', strokeWidth: '1.6' };
      // Pin ray
      extraElements.push(`<line x1="${getTile(3,4).cx}" y1="${getTile(3,4).cy}" x2="${getTile(0,1).cx}" y2="${getTile(0,1).cy}" stroke="#EF4444" stroke-width="1.4" stroke-dasharray="3 2" opacity="0.8" />`);
      // In-place destruction blade
      extraElements.push(`<line x1="${getTile(2,3).cx}" y1="${getTile(2,3).cy - 8}" x2="${enemy.cx}" y2="${enemy.cy - 4}" stroke="#D4AF37" stroke-width="2.2" stroke-linecap="round" />`);
      extraElements.push(`<polygon points="${enemy.cx},${enemy.cy - 4} ${enemy.cx + 2},${enemy.cy - 7} ${enemy.cx + 4},${enemy.cy - 2}" fill="#D4AF37" />`);
      extraElements.push(`<circle cx="${enemy.cx}" cy="${enemy.cy}" r="4" fill="none" stroke="#EF4444" stroke-width="1.3" />`);
      break;
    }

    case 'pawn_bayonet_charge': {
      // Straight forward capture: Pawn at 2,3 captures enemy straight ahead at 2,2
      originC = 2; originR = 3;
      const enemy = getTile(2, 2);
      tileModifiers['2,2'] = { fill: 'rgba(239, 68, 68, 0.38)', stroke: '#EF4444', strokeWidth: '1.8' };
      // Piercing forward thrust
      extraElements.push(`<line x1="${getTile(2,3).cx}" y1="${getTile(2,3).cy - 8}" x2="${enemy.cx}" y2="${enemy.cy - 4}" stroke="#D4AF37" stroke-width="2.6" stroke-linecap="round" />`);
      extraElements.push(`<polygon points="${enemy.cx},${enemy.cy - 4} ${enemy.cx - 2.5},${enemy.cy + 1} ${enemy.cx + 2.5},${enemy.cy + 1}" fill="#D4AF37" />`);
      extraElements.push(renderTargetReticle(enemy.cx, enemy.cy, 6.0));
      break;
    }

    case 'pawn_sweeping_halberd': {
      // Advance to 2,2 and cleave sideways to 1,2
      originC = 2; originR = 3;
      const adv = getTile(2, 2);
      const enemy = getTile(1, 2);
      tileModifiers['2,2'] = { fill: 'rgba(212, 175, 55, 0.35)', stroke: '#D4AF37', strokeWidth: '1.5' };
      tileModifiers['1,2'] = { fill: 'rgba(239, 68, 68, 0.35)', stroke: '#EF4444', strokeWidth: '1.5' };
      extraElements.push(`<line x1="${getTile(2,3).cx}" y1="${getTile(2,3).cy}" x2="${adv.cx}" y2="${adv.cy}" stroke="#D4AF37" stroke-width="1.8" stroke-dasharray="2 1.5" />`);
      extraElements.push(`<path d="M ${adv.cx} ${adv.cy - 6} Q ${adv.cx - 6} ${adv.cy - 12} ${enemy.cx} ${enemy.cy - 4}" fill="none" stroke="#D4AF37" stroke-width="2.2" stroke-linecap="round" />`);
      extraElements.push(`<circle cx="${enemy.cx}" cy="${enemy.cy}" r="4" fill="none" stroke="#EF4444" stroke-width="1.3" />`);
      break;
    }

    case 'pawn_sniper_shot': {
      // Ranged diagonal strike: Pawn at 2,3 strikes enemy at 0,1 from range
      originC = 2; originR = 3;
      const enemy = getTile(0, 1);
      tileModifiers['0,1'] = { fill: 'rgba(239, 68, 68, 0.38)', stroke: '#EF4444', strokeWidth: '1.8' };
      extraElements.push(`<line x1="${getTile(2,3).cx}" y1="${getTile(2,3).cy - 8}" x2="${enemy.cx}" y2="${enemy.cy - 4}" stroke="#D4AF37" stroke-width="2.0" stroke-dasharray="3 1.5" />`);
      extraElements.push(renderTargetReticle(enemy.cx, enemy.cy, 6.5));
      break;
    }

    case 'pawn_pike_thrust': {
      // Two-square piercing capture over forward ally: Pawn at 2,3 over ally at 2,2 to enemy at 2,1
      originC = 2; originR = 3;
      const ally = getTile(2, 2);
      const enemy = getTile(2, 1);
      tileModifiers['2,1'] = { fill: 'rgba(239, 68, 68, 0.38)', stroke: '#EF4444', strokeWidth: '1.8' };
      extraElements.push(renderPawnPiece(ally.cx, ally.cy, 0.75, true, 0.7));
      extraElements.push(renderParabolicArc(getTile(2,3), enemy, 22));
      extraElements.push(renderTargetReticle(enemy.cx, enemy.cy, 6.0));
      break;
    }

    case 'pawn_close_the_gap': {
      // Slide along pin ray: 2,3 -> 1,2
      originC = 2; originR = 3;
      const target = getTile(1, 2);
      tileModifiers['1,2'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(`<line x1="${getTile(3,4).cx}" y1="${getTile(3,4).cy}" x2="${getTile(0,1).cx}" y2="${getTile(0,1).cy}" stroke="#EF4444" stroke-width="1.3" stroke-dasharray="3 2" opacity="0.7" />`);
      extraElements.push(`<line x1="${getTile(2,3).cx}" y1="${getTile(2,3).cy - 4}" x2="${target.cx}" y2="${target.cy - 4}" stroke="#D4AF37" stroke-width="2.2" stroke-linecap="round" />`);
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      break;
    }

    case 'pawn_sidestep': {
      // Orthogonal sidestep: 2,3 -> 1,3
      originC = 2; originR = 3;
      const target = getTile(1, 3);
      tileModifiers['1,3'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(`<line x1="${getTile(2,3).cx}" y1="${getTile(2,3).cy}" x2="${target.cx}" y2="${target.cy}" stroke="#D4AF37" stroke-width="2.2" stroke-linecap="round" />`);
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      break;
    }

    case 'pawn_tactical_retreat': {
      // Backward step: 2,2 -> 2,3
      originC = 2; originR = 2;
      const target = getTile(2, 3);
      tileModifiers['2,3'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(`<line x1="${getTile(2,2).cx}" y1="${getTile(2,2).cy}" x2="${target.cx}" y2="${target.cy}" stroke="#D4AF37" stroke-width="2.2" stroke-dasharray="2.5 1.5" />`);
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      break;
    }

    case 'pawn_feint_step': {
      // Empty diagonal step: 2,3 -> 3,2
      originC = 2; originR = 3;
      const target = getTile(3, 2);
      tileModifiers['3,2'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(`<line x1="${getTile(2,3).cx}" y1="${getTile(2,3).cy}" x2="${target.cx}" y2="${target.cy}" stroke="#D4AF37" stroke-width="2.2" stroke-linecap="round" />`);
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      break;
    }

    case 'pawn_flank_march': {
      // Bypass diagonal step: 2,3 -> 1,2 around blocker at 2,2
      originC = 2; originR = 3;
      const blocker = getTile(2, 2);
      const target = getTile(1, 2);
      tileModifiers['1,2'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(renderPawnPiece(blocker.cx, blocker.cy, 0.75, true, 0.6));
      extraElements.push(`<path d="M ${getTile(2,3).cx} ${getTile(2,3).cy} Q ${getTile(2,3).cx - 8} ${getTile(2,3).cy - 4} ${target.cx} ${target.cy}" fill="none" stroke="#D4AF37" stroke-width="1.8" stroke-dasharray="2 1.5" />`);
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      break;
    }

    case 'pawn_call_reserves': {
      // Spawn rear recruit directly behind at 2,4
      originC = 2; originR = 3;
      const spawnT = getTile(2, 4);
      tileModifiers['2,4'] = { fill: 'rgba(212, 175, 55, 0.35)', stroke: '#D4AF37', strokeWidth: '1.6' };
      extraElements.push(renderPawnPiece(spawnT.cx, spawnT.cy, 0.8, true, 0.95));
      extraElements.push(`<ellipse cx="${spawnT.cx}" cy="${spawnT.cy}" rx="6" ry="3.2" fill="none" stroke="#D4AF37" stroke-width="1.2" stroke-dasharray="2 1.5" />`);
      break;
    }

    case 'pawn_reinforce_chain': {
      // Extend pawn chain: Pawn at 2,2, ally at 1,1, spawn behind at 1,2
      originC = 2; originR = 2;
      const ally = getTile(1, 1);
      const spawnT = getTile(1, 2);
      tileModifiers['1,2'] = { fill: 'rgba(212, 175, 55, 0.35)', stroke: '#D4AF37', strokeWidth: '1.6' };
      extraElements.push(renderPawnPiece(ally.cx, ally.cy, 0.75, true, 0.8));
      extraElements.push(renderPawnPiece(spawnT.cx, spawnT.cy, 0.8, true, 0.95));
      extraElements.push(`<ellipse cx="${spawnT.cx}" cy="${spawnT.cy}" rx="6" ry="3.2" fill="none" stroke="#D4AF37" stroke-width="1.2" stroke-dasharray="2 1.5" />`);
      break;
    }

    case 'pawn_royal_levy': {
      // King's bodyguard spawn at 3,3
      originC = 2; originR = 3;
      const spawnT = getTile(3, 3);
      tileModifiers['3,3'] = { fill: 'rgba(212, 175, 55, 0.35)', stroke: '#D4AF37', strokeWidth: '1.6' };
      extraElements.push(renderPawnPiece(spawnT.cx, spawnT.cy, 0.8, true, 0.95));
      extraElements.push(`<ellipse cx="${spawnT.cx}" cy="${spawnT.cy}" rx="6" ry="3.2" fill="none" stroke="#D4AF37" stroke-width="1.2" stroke-dasharray="2 1.5" />`);
      break;
    }

    case 'pawn_second_wave': {
      // Resurrect captured pawn at 2,4
      originC = 2; originR = 3;
      const partner = getTile(3, 3);
      const resT = getTile(2, 4);
      tileModifiers['2,4'] = { fill: 'rgba(212, 175, 55, 0.35)', stroke: '#D4AF37', strokeWidth: '1.6' };
      extraElements.push(renderPawnPiece(partner.cx, partner.cy, 0.75, true, 0.8));
      extraElements.push(renderPawnPiece(resT.cx, resT.cy, 0.85, true, 1.0));
      extraElements.push(`<ellipse cx="${resT.cx}" cy="${resT.cy}" rx="6" ry="3.2" fill="none" stroke="#D4AF37" stroke-width="1.2" stroke-dasharray="2 1.5" />`);
      break;
    }

    case 'pawn_militia_muster': {
      // Trio muster: 3 pawns in formation; resurrect on rank 2
      originC = 2; originR = 3;
      const p1 = getTile(1, 3);
      const p2 = getTile(3, 3);
      const res = getTile(2, 4);
      tileModifiers['2,4'] = { fill: 'rgba(212, 175, 55, 0.4)', stroke: '#D4AF37', strokeWidth: '1.6' };
      extraElements.push(renderPawnPiece(p1.cx, p1.cy, 0.75, true, 0.8));
      extraElements.push(renderPawnPiece(p2.cx, p2.cy, 0.75, true, 0.8));
      extraElements.push(renderPawnPiece(res.cx, res.cy, 0.85, true, 1.0));
      extraElements.push(`<ellipse cx="${res.cx}" cy="${res.cy}" rx="6" ry="3.2" fill="none" stroke="#D4AF37" stroke-width="1.2" stroke-dasharray="2 1.5" />`);
      break;
    }

    case 'pawn_raise_buckler': {
      // Kinetic shield bubble
      originC = 2; originR = 3;
      tileModifiers['2,3'] = { stroke: '#38BDF8', strokeWidth: '1.8' };
      extraElements.push(renderShieldDome(getTile(2,3).cx, getTile(2,3).cy));
      break;
    }

    case 'pawn_king_s_duel': {
      // Royal duel shield checking enemy king
      originC = 2; originR = 2;
      tileModifiers['2,2'] = { stroke: '#38BDF8', strokeWidth: '1.8' };
      extraElements.push(renderShieldDome(getTile(2,2).cx, getTile(2,2).cy));
      break;
    }

    case 'pawn_iron_wedge': {
      // Forking shield against 2 targets
      originC = 2; originR = 2;
      const t1 = getTile(1, 1);
      const t2 = getTile(3, 1);
      tileModifiers['1,1'] = { fill: 'rgba(239, 68, 68, 0.3)', stroke: '#EF4444', strokeWidth: '1.4' };
      tileModifiers['3,1'] = { fill: 'rgba(239, 68, 68, 0.3)', stroke: '#EF4444', strokeWidth: '1.4' };
      extraElements.push(renderShieldDome(getTile(2,2).cx, getTile(2,2).cy));
      break;
    }

    case 'pawn_corner_the_prey': {
      // Wall placed adjacent to high-value target
      originC = 2; originR = 3;
      const wallT = getTile(2, 2);
      tileModifiers['2,2'] = { fill: 'rgba(56, 189, 248, 0.25)', stroke: '#38BDF8', strokeWidth: '1.4' };
      extraElements.push(renderWallSlab(wallT.cx, wallT.cy));
      break;
    }

    case 'pawn_trench_barricade': {
      // Impassable wall directly ahead at 2,2
      originC = 2; originR = 3;
      const wallT = getTile(2, 2);
      tileModifiers['2,2'] = { fill: 'rgba(56, 189, 248, 0.25)', stroke: '#38BDF8', strokeWidth: '1.4' };
      extraElements.push(renderWallSlab(wallT.cx, wallT.cy, 7.5, 9.5));
      break;
    }

    case 'pawn_flank_tunnel': {
      // Rim file wrap around: 0,3 -> 4,3
      originC = 0; originR = 3;
      const target = getTile(4, 3);
      tileModifiers['4,3'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(renderParabolicArc(getTile(0,3), target, 28));
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      break;
    }

    case 'pawn_vaulting_advance': {
      // Forward knight vault: 2,3 -> 1,1
      originC = 2; originR = 3;
      const target = getTile(1, 1);
      tileModifiers['1,1'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(renderParabolicArc(getTile(2,3), target, 24));
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      break;
    }

    case 'pawn_catapult_launch': {
      // 3 sq forward leap: 2,4 -> 2,1
      originC = 2; originR = 4;
      const target = getTile(2, 1);
      tileModifiers['2,1'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(renderParabolicArc(getTile(2,4), target, 28));
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      break;
    }

    case 'pawn_inward_bound': {
      // 2 files inward: 0,3 -> 2,3
      originC = 0; originR = 3;
      const target = getTile(2, 3);
      tileModifiers['2,3'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(renderParabolicArc(getTile(0,3), target, 22));
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      break;
    }

    case 'pawn_hit_and_run': {
      // Capture and recoil: leap 2,2 -> 1,1 and recoil back
      originC = 2; originR = 2;
      const target = getTile(1, 1);
      tileModifiers['1,1'] = { fill: 'rgba(239, 68, 68, 0.35)', stroke: '#EF4444', strokeWidth: '1.6' };
      extraElements.push(renderParabolicArc(getTile(2,2), target, 22));
      extraElements.push(`<path d="M ${target.cx} ${target.cy - 4} Q ${getTile(2,2).cx - 6} ${getTile(2,2).cy - 10} ${getTile(2,2).cx} ${getTile(2,2).cy - 4}" fill="none" stroke="#D4AF37" stroke-width="1.3" stroke-dasharray="2 1.5" />`);
      extraElements.push(renderTargetReticle(target.cx, target.cy));
      break;
    }

    case 'pawn_vanguard_tow': {
      // Tandem forward tow: advance to 2,2 and pull 2,4 to 2,3
      originC = 2; originR = 3;
      const adv = getTile(2, 2);
      const follower = getTile(2, 4);
      tileModifiers['2,2'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(renderPawnPiece(follower.cx, follower.cy, 0.75, true, 0.7));
      extraElements.push(`<line x1="${getTile(2,3).cx}" y1="${getTile(2,3).cy}" x2="${adv.cx}" y2="${adv.cy}" stroke="#D4AF37" stroke-width="1.8" stroke-dasharray="2 1.5" />`);
      extraElements.push(`<line x1="${follower.cx}" y1="${follower.cy}" x2="${getTile(2,3).cx}" y2="${getTile(2,3).cy}" stroke="#D4AF37" stroke-width="1.4" stroke-dasharray="2 1.5" />`);
      extraElements.push(renderTargetReticle(adv.cx, adv.cy));
      break;
    }

    case 'pawn_signal_swap': {
      // Same-rank coordinate swap: Pawn at 1,3 and ally at 3,3
      originC = 1; originR = 3;
      const partner = getTile(3, 3);
      tileModifiers['3,3'] = { fill: 'rgba(212, 175, 55, 0.35)', stroke: '#D4AF37', strokeWidth: '1.5' };
      extraElements.push(renderSwapArrow(getTile(1,3), partner));
      extraElements.push(renderSwapArrow(partner, getTile(1,3)));
      extraElements.push(renderPawnPiece(partner.cx, partner.cy, 0.8, true, 0.7));
      break;
    }

    case 'pawn_clear_sightline': {
      // Slingshot diagonal slider: Pawn at 2,2, slider at 3,3 slides to 0,0
      originC = 2; originR = 2;
      const start = getTile(3, 3);
      const end = getTile(0, 0);
      tileModifiers['0,0'] = { fill: 'rgba(212, 175, 55, 0.4)', stroke: '#D4AF37', strokeWidth: '1.6' };
      extraElements.push(renderParabolicArc(start, end, 26));
      extraElements.push(renderTargetReticle(end.cx, end.cy));
      break;
    }

    case 'pawn_taunting_beckon': {
      // Pull enemy pawn forward: Pawn at 2,3 pulls enemy at 2,0 forward to 2,2
      originC = 2; originR = 3;
      const enemy = getTile(2, 0);
      const pulled = getTile(2, 2);
      tileModifiers['2,2'] = { fill: 'rgba(239, 68, 68, 0.35)', stroke: '#EF4444', strokeWidth: '1.6' };
      extraElements.push(renderPawnPiece(enemy.cx, enemy.cy, 0.75, false, 0.8));
      extraElements.push(`<line x1="${enemy.cx}" y1="${enemy.cy}" x2="${pulled.cx}" y2="${pulled.cy}" stroke="#EF4444" stroke-width="1.8" stroke-dasharray="2 1.5" />`);
      extraElements.push(renderTargetReticle(pulled.cx, pulled.cy));
      break;
    }

    case 'pawn_ambush_switch': {
      // Royal ambush swap: Pawn at 2,1 swaps with major piece at 2,4
      originC = 2; originR = 1;
      const partner = getTile(2, 4);
      tileModifiers['2,4'] = { fill: 'rgba(212, 175, 55, 0.35)', stroke: '#D4AF37', strokeWidth: '1.5' };
      extraElements.push(renderSwapArrow(getTile(2,1), partner));
      extraElements.push(renderSwapArrow(partner, getTile(2,1)));
      break;
    }

    default: {
      originC = 2; originR = 3;
      const target = getTile(2, 2);
      tileModifiers['2,2'] = { fill: 'rgba(212, 175, 55, 0.42)', stroke: '#D4AF37', strokeWidth: '1.8' };
      extraElements.push(`<line x1="${getTile(2,3).cx}" y1="${getTile(2,3).cy}" x2="${target.cx}" y2="${target.cy}" stroke="#D4AF37" stroke-width="2.2" stroke-linecap="round" />`);
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
    <linearGradient id="goldP_focus" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFDF7" />
      <stop offset="35%" stop-color="#F5D061" />
      <stop offset="80%" stop-color="#D4AF37" />
      <stop offset="100%" stop-color="#AA8A2A" />
    </linearGradient>
    <linearGradient id="goldP_base" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F5D061" />
      <stop offset="100%" stop-color="#7A6018" />
    </linearGradient>
    <linearGradient id="arcP_focus" x1="1" y1="1" x2="0" y2="0">
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

  <!-- STANDING STAUNTON PAWN PIECE -->
  ${renderPawnPiece(originTile.cx, originTile.cy)}
</svg>`;
}

// Generate all 30 Pawn SVGs
console.log(`Generating ${pawnCards.length} Pawn vector SVG assets...`);
for (const card of pawnCards) {
  const artId = card.artId || card.id;
  const filePath = path.join(OUTPUT_DIR, `${artId}.svg`);
  const svgContent = generateCardSvg(card);
  fs.writeFileSync(filePath, svgContent.trim(), 'utf8');
  console.log(`✓ Generated ${artId}.svg`);
}

console.log(`\n🎉 Successfully generated all ${pawnCards.length} Pawn vector assets in public/assets/cards/pawn/`);
