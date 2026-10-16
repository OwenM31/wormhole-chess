import React from 'react';

export interface DeckBuilderLogoProps {
  size?: number;
  badged?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const DeckBuilderLogo: React.FC<DeckBuilderLogoProps> = ({
  size = 22,
  badged = false,
  className,
  style,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dbLogoGoldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFDF7" />
          <stop offset="25%" stopColor="#F5D061" />
          <stop offset="65%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#AA8A2A" />
        </linearGradient>
        <linearGradient id="dbLogoShieldBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#25292D" />
          <stop offset="100%" stopColor="#16181A" />
        </linearGradient>
        <radialGradient id="dbLogoCoreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25" />
          <stop offset="70%" stopColor="#D4AF37" stopOpacity="0" />
        </radialGradient>
        <filter id="dbLogoShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#000000" floodOpacity="0.65" />
        </filter>
      </defs>

      {badged && (
        <g id="badge-bg">
          <rect width="512" height="512" rx="112" fill="#191B1D" />
          <rect
            width="502"
            height="502"
            x="5"
            y="5"
            rx="107"
            fill="none"
            stroke="url(#dbLogoGoldGrad)"
            strokeWidth="3"
            strokeOpacity="0.35"
          />
          <circle cx="256" cy="256" r="230" fill="url(#dbLogoCoreGlow)" />
        </g>
      )}

      <g filter="url(#dbLogoShadow)">
        {/* Tactical Shield Card Silhouette */}
        <path
          d="M 120 70 L 392 70 C 404 70 414 80 414 92 L 414 290 C 414 360 274 444 256 454 C 238 444 98 360 98 290 L 98 92 C 98 80 108 70 120 70 Z"
          fill="url(#dbLogoShieldBg)"
          stroke="url(#dbLogoGoldGrad)"
          strokeWidth="12"
          strokeLinejoin="round"
        />

        {/* Inner Shield Inset Stroke */}
        <path
          d="M 132 86 L 380 86 C 390 86 398 94 398 104 L 398 284 C 398 344 270 422 256 430 C 242 422 114 344 114 284 L 114 104 C 114 94 122 86 132 86 Z"
          fill="none"
          stroke="#D4AF37"
          strokeWidth="2"
          strokeOpacity="0.35"
        />

        {/* 4x4 Chessboard Grid Pattern in Upper Half */}
        <g transform="translate(160, 96)" opacity="0.45">
          <rect x="0" y="0" width="48" height="30" fill="#D4AF37" />
          <rect x="48" y="0" width="48" height="30" fill="#3C493F" />
          <rect x="96" y="0" width="48" height="30" fill="#D4AF37" />
          <rect x="144" y="0" width="48" height="30" fill="#3C493F" />

          <rect x="0" y="30" width="48" height="30" fill="#3C493F" />
          <rect x="48" y="30" width="48" height="30" fill="#D4AF37" />
          <rect x="96" y="30" width="48" height="30" fill="#3C493F" />
          <rect x="144" y="30" width="48" height="30" fill="#D4AF37" />

          <rect x="0" y="60" width="48" height="30" fill="#D4AF37" />
          <rect x="48" y="60" width="48" height="30" fill="#3C493F" />
          <rect x="96" y="60" width="48" height="30" fill="#D4AF37" />
          <rect x="144" y="60" width="48" height="30" fill="#3C493F" />
        </g>

        {/* Flanking Twin Energy Lightning Bolts */}
        <path d="M 132 176 L 148 176 L 140 194 L 152 194 L 134 226 L 138 202 L 126 202 Z" fill="url(#dbLogoGoldGrad)" />
        <path d="M 380 176 L 364 176 L 372 194 L 360 194 L 378 226 L 374 202 L 386 202 Z" fill="url(#dbLogoGoldGrad)" />

        {/* Centered Regal Chess Knight in Solid Gleaming Gold */}
        <g transform="translate(6, 12)">
          <path d="M 194 330 L 306 330 C 306 322 298 316 288 312 L 212 312 C 202 316 194 322 194 330 Z" fill="url(#dbLogoGoldGrad)" />
          
          <path
            d="M 212 312 C 212 274 224 242 240 224 L 202 212 C 194 208 192 196 200 188 L 232 156 C 240 148 252 150 260 160 L 272 176 L 282 150 C 286 142 296 142 300 150 L 308 174 C 322 192 330 216 330 246 C 330 276 314 304 302 312 Z"
            fill="url(#dbLogoGoldGrad)"
            stroke="#16181A"
            strokeWidth="4"
            strokeLinejoin="round"
          />

          <circle cx="236" cy="180" r="5" fill="#16181A" />
          <circle cx="210" cy="198" r="3.5" fill="#16181A" />
          
          <path d="M 278 186 C 292 202 298 222 298 244" fill="none" stroke="#16181A" strokeWidth="5" strokeLinecap="round" />
          <path d="M 286 226 C 298 240 304 258 304 278" fill="none" stroke="#16181A" strokeWidth="5" strokeLinecap="round" />
        </g>

        {/* Bottom Shield Point Energy Pips */}
        <g fill="url(#dbLogoGoldGrad)" transform="translate(256, 386)">
          <circle cx="-34" cy="0" r="7.5" />
          <circle cx="0" cy="14" r="8.5" />
          <circle cx="34" cy="0" r="7.5" />
        </g>
      </g>
    </svg>
  );
};

export interface DeckBuilderBrandLockupProps {
  iconSize?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const DeckBuilderBrandLockup: React.FC<DeckBuilderBrandLockupProps> = ({
  iconSize = 22,
  className,
  style,
}) => {
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        userSelect: 'none',
        ...style,
      }}
    >
      <DeckBuilderLogo size={iconSize} />
      <span
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontWeight: 700,
          fontSize: `${iconSize * 0.9}px`,
          letterSpacing: '-0.02em',
          color: '#FAF9F6',
          lineHeight: 1,
        }}
      >
        DeckbuilderChess
      </span>
    </div>
  );
};

export default DeckBuilderLogo;
