import React from 'react';

export interface WormholeSpacetimeIllustrationProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export const WormholeSpacetimeIllustration: React.FC<WormholeSpacetimeIllustrationProps> = ({
  width = 140,
  height = 105,
  className,
  style,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 240"
      width={width}
      height={height}
      className={className}
      style={{ display: 'inline-block', flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      <defs>
        {/* Metallic Gold Rim Gradient */}
        <linearGradient id="heroV2GoldRim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFDF7" />
          <stop offset="20%" stopColor="#F5E396" />
          <stop offset="55%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#997D25" />
        </linearGradient>

        {/* Translucent 3D Volumetric Wormhole Funnel Body */}
        <linearGradient id="heroV2ThroatBody" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.10" />
          <stop offset="25%" stopColor="#D4AF37" stopOpacity="0.28" />
          <stop offset="50%" stopColor="#FAF9F6" stopOpacity="0.16" />
          <stop offset="75%" stopColor="#D4AF37" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.10" />
        </linearGradient>

        {/* Radial Singularity Core Glow */}
        <radialGradient id="heroV2CoreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFDF7" stopOpacity="0.95" />
          <stop offset="25%" stopColor="#D4AF37" stopOpacity="0.75" />
          <stop offset="60%" stopColor="#D4AF37" stopOpacity="0.20" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
        </radialGradient>

        {/* Ambient Cosmic Backdrop */}
        <radialGradient id="heroV2Backdrop" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.22" />
          <stop offset="55%" stopColor="#D4AF37" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#191B1D" stopOpacity="0" />
        </radialGradient>

        <filter id="heroV2DropShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="7" stdDeviation="7" floodColor="#000000" floodOpacity="0.6" />
        </filter>

        <filter id="heroV2Glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="glow" />
          <feComposite in="SourceGraphic" in2="glow" operator="over" />
        </filter>
      </defs>

      {/* Ambient Backdrop Glow */}
      <circle cx="160" cy="120" r="118" fill="url(#heroV2Backdrop)" />

      {/* LOWER BOARD (BOARD 2) */}
      <g id="hero-lower-board" transform="translate(160, 178)" filter="url(#heroV2DropShadow)">
        <path d="M -98 0 L 0 48 L 0 57 L -98 9 Z" fill="#181A1D" stroke="url(#heroV2GoldRim)" strokeWidth="1.2" />
        <path d="M 0 48 L 98 0 L 98 9 L 0 57 Z" fill="#121315" stroke="url(#heroV2GoldRim)" strokeWidth="1.2" />
        <path d="M 0 -48 L 98 0 L 0 48 L -98 0 Z" fill="#1C1E23" stroke="url(#heroV2GoldRim)" strokeWidth="2.8" />

        <path d="M -49 -24 L 0 -48 L 49 -24 L 0 0 Z" fill="#D4AF37" fillOpacity="0.20" />
        <path d="M -98 0 L -49 -24 L 0 0 L -49 24 Z" fill="#FAF9F6" fillOpacity="0.09" />
        <path d="M 0 0 L 49 -24 L 98 0 L 49 24 Z" fill="#FAF9F6" fillOpacity="0.09" />
        <path d="M -49 24 L 0 0 L 49 24 L 0 48 Z" fill="#D4AF37" fillOpacity="0.20" />

        <line x1="-49" y1="-24" x2="49" y2="24" stroke="#D4AF37" strokeWidth="1.2" strokeOpacity="0.45" />
        <line x1="-49" y1="24" x2="49" y2="-24" stroke="#D4AF37" strokeWidth="1.2" strokeOpacity="0.45" />

        <ellipse cx="0" cy="0" rx="40" ry="19" fill="#090A0C" stroke="url(#heroV2GoldRim)" strokeWidth="2.8" />
        <ellipse cx="0" cy="0" rx="28" ry="13" fill="#040506" stroke="#D4AF37" strokeWidth="1.2" strokeOpacity="0.75" />
      </g>

      {/* VOLUMETRIC 3D WORMHOLE THROAT */}
      <g id="hero-wormhole-conduit">
        <path
          d="M 120 62 C 140 95 144 114 144 120 C 144 126 140 145 120 178 L 200 178 C 180 145 176 126 176 120 C 176 114 180 95 200 62 Z"
          fill="url(#heroV2ThroatBody)"
        />

        <path d="M 128 80 C 142 94 178 94 192 80" fill="none" stroke="#D4AF37" strokeWidth="2" strokeOpacity="0.65" />
        <path d="M 137 99 C 146 110 174 110 183 99" fill="none" stroke="#D4AF37" strokeWidth="1.8" strokeOpacity="0.75" />
        <ellipse cx="160" cy="120" rx="16" ry="6" fill="none" stroke="#FAF9F6" strokeWidth="2.5" strokeOpacity="0.95" />
        <path d="M 137 141 C 146 130 174 130 183 141" fill="none" stroke="#D4AF37" strokeWidth="1.8" strokeOpacity="0.75" />
        <path d="M 128 160 C 142 146 178 146 192 160" fill="none" stroke="#D4AF37" strokeWidth="2" strokeOpacity="0.65" />

        <path d="M 120 62 C 140 95 144 114 144 120 C 144 126 140 145 120 178" fill="none" stroke="url(#heroV2GoldRim)" strokeWidth="2.4" />
        <path d="M 200 62 C 180 95 176 114 176 120 C 176 126 180 145 200 178" fill="none" stroke="url(#heroV2GoldRim)" strokeWidth="2.4" />
        <path d="M 142 62 C 151 92 151 114 151 120 C 151 126 151 148 142 178" fill="none" stroke="#D4AF37" strokeWidth="1.4" strokeOpacity="0.8" />
        <path d="M 178 62 C 169 92 169 114 169 120 C 169 126 169 148 178 178" fill="none" stroke="#D4AF37" strokeWidth="1.4" strokeOpacity="0.8" />

        <circle cx="160" cy="120" r="20" fill="url(#heroV2CoreGlow)" filter="url(#heroV2Glow)" />
        <line x1="160" y1="62" x2="160" y2="178" stroke="#FAF9F6" strokeWidth="2.8" strokeOpacity="0.95" filter="url(#heroV2Glow)" />
        <line x1="160" y1="44" x2="160" y2="196" stroke="#D4AF37" strokeWidth="1.2" strokeDasharray="3 3" strokeOpacity="0.85" />
      </g>

      {/* UPPER BOARD (BOARD 1) */}
      <g id="hero-upper-board" transform="translate(160, 62)" filter="url(#heroV2DropShadow)">
        <path d="M -98 0 L 0 48 L 0 57 L -98 9 Z" fill="#181A1D" stroke="url(#heroV2GoldRim)" strokeWidth="1.2" />
        <path d="M 0 48 L 98 0 L 98 9 L 0 57 Z" fill="#121315" stroke="url(#heroV2GoldRim)" strokeWidth="1.2" />
        <path d="M 0 -48 L 98 0 L 0 48 L -98 0 Z" fill="#1E2127" stroke="url(#heroV2GoldRim)" strokeWidth="2.8" />

        <path d="M -49 -24 L 0 -48 L 49 -24 L 0 0 Z" fill="#FAF9F6" fillOpacity="0.10" />
        <path d="M -98 0 L -49 -24 L 0 0 L -49 24 Z" fill="#D4AF37" fillOpacity="0.24" />
        <path d="M 0 0 L 49 -24 L 98 0 L 49 24 Z" fill="#D4AF37" fillOpacity="0.24" />
        <path d="M -49 24 L 0 0 L 49 24 L 0 48 Z" fill="#FAF9F6" fillOpacity="0.10" />

        <line x1="-49" y1="-24" x2="49" y2="24" stroke="#D4AF37" strokeWidth="1.2" strokeOpacity="0.45" />
        <line x1="-49" y1="24" x2="49" y2="-24" stroke="#D4AF37" strokeWidth="1.2" strokeOpacity="0.45" />

        <ellipse cx="0" cy="0" rx="40" ry="19" fill="#0A0B0E" stroke="url(#heroV2GoldRim)" strokeWidth="2.8" />
        <ellipse cx="0" cy="0" rx="28" ry="13" fill="#040506" stroke="#D4AF37" strokeWidth="1.2" strokeOpacity="0.75" />
        <path d="M -20 -4 Q 0 -14 20 -4 Q 12 9 -9 7 Q -14 0 0 0" fill="none" stroke="#D4AF37" strokeWidth="1.2" strokeOpacity="0.75" />
      </g>

      {/* 3D CHESS PIECES */}
      {/* Knight on Upper Board */}
      <g id="hero-knight-3d" transform="translate(100, 42)">
        <ellipse cx="2" cy="18" rx="16" ry="6" fill="#050607" opacity="0.65" />
        <ellipse cx="2" cy="16" rx="13" ry="4.2" fill="#1C1E23" stroke="url(#heroV2GoldRim)" strokeWidth="1.4" />
        <path
          d="M -9 15 L 14 15 C 13 10 11 7 13 1 C 14 -5 12 -11 9 -14 C 5 -18 -2 -17 -6 -13 C -9 -11 -13 -10 -17 -10 C -19 -5 -17 0 -13 2 C -16 6 -14 12 -8 15 Z"
          fill="#FAF9F6"
          stroke="#191B1D"
          strokeWidth="1.6"
        />
        <path
          d="M -3 -15 C 2 -15 7 -12 8 -7 C 9 -2 7 4 9 9 L 14 15 L 4 15 C 3 10 1 6 2 0 C 2 -6 0 -10 -3 -13 Z"
          fill="#D4AF37"
          fillOpacity="0.45"
        />
        <path d="M -6 -13 C -3 -15 2 -15 5 -12 C 7 -9 6 -4 8 1" fill="none" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="1" cy="-8" r="1.4" fill="#191B1D" />
      </g>

      {/* King Emerging from Lower Board Portal */}
      <g id="hero-king-3d" transform="translate(216, 168)">
        <ellipse cx="0" cy="14" rx="18" ry="6.5" fill="#D4AF37" fillOpacity="0.35" filter="url(#heroV2Glow)" />
        <path d="M -13 15 C -14 8 -15 1 -11 -4 L 11 -4 C 15 1 14 8 13 15 Z" fill="#24272E" stroke="url(#heroV2GoldRim)" strokeWidth="1.6" />
        <path d="M -11 -4 C -12 -9 -9 -13 -5 -15 L 5 -15 C 9 -13 12 -9 11 -4 Z" fill="url(#heroV2GoldRim)" stroke="#191B1D" strokeWidth="1.4" />
        <path d="M 0 -25 L 0 -16 M -5 -21 L 5 -21" stroke="#FAF9F6" strokeWidth="2.4" strokeLinecap="round" filter="url(#heroV2Glow)" />
        <circle cx="0" cy="-21" r="1" fill="#FFFFFF" />
        <line x1="0" y1="-15" x2="0" y2="15" stroke="#FAF9F6" strokeWidth="1.4" strokeOpacity="0.85" />
      </g>

      {/* Energy Sparks */}
      <g id="hero-sparks" opacity="0.9">
        <circle cx="146" cy="110" r="1.6" fill="#FAF9F6" filter="url(#heroV2Glow)" />
        <circle cx="176" cy="130" r="1.4" fill="#D4AF37" filter="url(#heroV2Glow)" />
        <circle cx="160" cy="92" r="1.8" fill="#FAF9F6" />
        <circle cx="160" cy="148" r="1.8" fill="#D4AF37" />
        <circle cx="88" cy="85" r="1.2" fill="#FAF9F6" opacity="0.6" />
        <circle cx="240" cy="145" r="1.2" fill="#D4AF37" opacity="0.6" />
      </g>
    </svg>
  );
};

export default WormholeSpacetimeIllustration;
