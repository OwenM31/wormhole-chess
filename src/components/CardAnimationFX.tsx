import React from 'react';
import { CardAnimationArchetype, PieceColor } from '../types/deckChess';
import { CANONICAL_36_CARDS, PIECE_COLOR_THEMES } from '../engine/cards/releaseRoster36';

export interface CardFxData {
  cardId: string;
  from: string;
  to: string;
  extraSquare?: string;
}

export interface CardAnimationFXProps {
  fx: CardFxData | null;
  orientation?: PieceColor;
}

export function getSquareCenterPct(sq: string, orientation: PieceColor = 'w'): { x: number; y: number } {
  const f = sq.charCodeAt(0) - 'a'.charCodeAt(0);
  const r = parseInt(sq[1], 10) - 1;
  const col = orientation === 'w' ? f : 7 - f;
  const row = orientation === 'w' ? 7 - r : r;
  return {
    x: (col + 0.5) * 12.5,
    y: (row + 0.5) * 12.5,
  };
}

export const CardAnimationFX: React.FC<CardAnimationFXProps> = ({
  fx,
  orientation = 'w',
}) => {
  if (!fx) return null;

  const card = CANONICAL_36_CARDS.find((c) => c.id === fx.cardId);
  if (!card) return null;

  const archetype: CardAnimationArchetype = card.animationArchetype || 'charge';
  const theme = PIECE_COLOR_THEMES[card.anchor] || PIECE_COLOR_THEMES.pawn;
  const themeHex = theme.hex;

  const fromPt = getSquareCenterPct(fx.from, orientation);
  const toPt = getSquareCenterPct(fx.to, orientation);
  const extraPt = fx.extraSquare ? getSquareCenterPct(fx.extraSquare, orientation) : null;

  return (
    <div
      data-testid="card-animation-fx-container"
      className="absolute inset-0 z-30 pointer-events-none overflow-hidden"
    >
      {/* Theatrical Card Manifestation Banner */}
      <div
        data-testid="card-manifestation-banner"
        className="absolute top-2 left-1/2 -translate-x-1/2 z-[35] flex items-center gap-2 px-3 py-1 rounded-full shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 border"
        style={{
          backgroundColor: '#161B22f0',
          borderColor: themeHex,
          boxShadow: `0 4px 20px rgba(0,0,0,0.8), 0 0 16px ${themeHex}66`,
        }}
      >
        <span className="text-xs">⚡</span>
        <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-[#FAF9F6]">
          FLASH PLAY: <span style={{ color: themeHex }}>{card.name}</span>
        </span>
        <span
          className="text-[9px] font-mono px-1 py-0.2 rounded font-bold"
          style={{ backgroundColor: `${themeHex}25`, color: themeHex }}
        >
          [{card.code}]
        </span>
      </div>

      {/* SVG Theatrical FX Overlay */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full absolute inset-0 z-30"
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          <radialGradient id={`glow-${card.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={themeHex} stopOpacity="0.8" />
            <stop offset="100%" stopColor={themeHex} stopOpacity="0" />
          </radialGradient>

          <linearGradient id={`trail-${card.id}`} x1={`${fromPt.x}%`} y1={`${fromPt.y}%`} x2={`${toPt.x}%`} y2={`${toPt.y}%`}>
            <stop offset="0%" stopColor={themeHex} stopOpacity="0.2" />
            <stop offset="100%" stopColor={themeHex} stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* 1. CHARGE Archetype (Linear high-speed streak) */}
        {archetype === 'charge' && (
          <g data-testid="fx-archetype-charge">
            {/* Motion trail line */}
            <line
              x1={fromPt.x}
              y1={fromPt.y}
              x2={toPt.x}
              y2={toPt.y}
              stroke={`url(#trail-${card.id})`}
              strokeWidth="4"
              strokeLinecap="round"
              className="animate-in fade-in duration-150"
            />
            {/* Core energy beam */}
            <line
              x1={fromPt.x}
              y1={fromPt.y}
              x2={toPt.x}
              y2={toPt.y}
              stroke="#FAF9F6"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Impact burst ring */}
            <circle
              cx={toPt.x}
              cy={toPt.y}
              r="4"
              fill="none"
              stroke={themeHex}
              strokeWidth="1.5"
              className="animate-ping"
            />
          </g>
        )}

        {/* 2. LEAP Archetype (Parabolic arc trajectory + landing ring) */}
        {archetype === 'leap' && (
          <g data-testid="fx-archetype-leap">
            {/* Parabolic arc */}
            <path
              d={`M ${fromPt.x} ${fromPt.y} Q ${(fromPt.x + toPt.x) / 2} ${
                Math.min(fromPt.y, toPt.y) - 12
              } ${toPt.x} ${toPt.y}`}
              fill="none"
              stroke={themeHex}
              strokeWidth="3"
              strokeDasharray="4 3"
              strokeLinecap="round"
            />
            {/* Landing Impact Shockwave */}
            <circle
              cx={toPt.x}
              cy={toPt.y}
              r="5"
              fill={themeHex}
              fillOpacity="0.2"
              stroke={themeHex}
              strokeWidth="2"
              className="animate-ping"
            />
          </g>
        )}

        {/* 3. TELEPORT Archetype (Rift particle collapse & expand) */}
        {archetype === 'teleport' && (
          <g data-testid="fx-archetype-teleport">
            {/* Origin collapse ripple */}
            <circle
              cx={fromPt.x}
              cy={fromPt.y}
              r="4.5"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="2"
              strokeDasharray="3 2"
              className="animate-spin"
            />
            {/* Destination rift opening */}
            <circle
              cx={toPt.x}
              cy={toPt.y}
              r="6"
              fill={`url(#glow-${card.id})`}
              stroke={themeHex}
              strokeWidth="2"
              className="animate-ping"
            />
          </g>
        )}

        {/* 4. BEAM Archetype (Radiant line-of-sight laser trace) */}
        {archetype === 'beam' && (
          <g data-testid="fx-archetype-beam">
            {/* Wide radiant aura */}
            <line
              x1={fromPt.x}
              y1={fromPt.y}
              x2={toPt.x}
              y2={toPt.y}
              stroke={themeHex}
              strokeWidth="6"
              strokeOpacity="0.4"
              strokeLinecap="round"
            />
            {/* Intense core ray */}
            <line
              x1={fromPt.x}
              y1={fromPt.y}
              x2={toPt.x}
              y2={toPt.y}
              stroke="#FAF9F6"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx={toPt.x} cy={toPt.y} r="3" fill="#FAF9F6" />
          </g>
        )}

        {/* 5. DISPLACE Archetype (Twin trajectories for anchor + displaced unit) */}
        {archetype === 'displace' && (
          <g data-testid="fx-archetype-displace">
            {/* Anchor path */}
            <line
              x1={fromPt.x}
              y1={fromPt.y}
              x2={toPt.x}
              y2={toPt.y}
              stroke={themeHex}
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Displaced unit path (if extraSquare present) */}
            {extraPt && (
              <path
                d={`M ${(fromPt.x + toPt.x) / 2} ${(fromPt.y + toPt.y) / 2} Q ${
                  (extraPt.x + toPt.x) / 2
                } ${(extraPt.y + toPt.y) / 2} ${extraPt.x} ${extraPt.y}`}
                fill="none"
                stroke="#D4AF37"
                strokeWidth="2.5"
                strokeDasharray="3 2"
                strokeLinecap="round"
              />
            )}
            <circle cx={toPt.x} cy={toPt.y} r="3.5" fill={themeHex} />
          </g>
        )}

        {/* 6. SHOCKWAVE Archetype (Expanding radial blast ring) */}
        {archetype === 'shockwave' && (
          <g data-testid="fx-archetype-shockwave">
            {/* Dual expanding shockwaves */}
            <circle
              cx={toPt.x}
              cy={toPt.y}
              r="5.5"
              fill={themeHex}
              fillOpacity="0.15"
              stroke={themeHex}
              strokeWidth="2"
              className="animate-ping"
            />
            <circle
              cx={toPt.x}
              cy={toPt.y}
              r="3.5"
              fill="none"
              stroke="#FAF9F6"
              strokeWidth="1.5"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
