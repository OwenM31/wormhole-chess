import React from 'react';

export interface WormholeLogoProps {
  size?: number;
  badged?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const WormholeLogo: React.FC<WormholeLogoProps> = ({
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
        <linearGradient id="whLogoGoldRim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFDF7" />
          <stop offset="25%" stopColor="#E5C158" />
          <stop offset="60%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#997D25" />
        </linearGradient>
        <linearGradient id="whLogoGoldGleam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FAF9F6" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#AA8A2A" />
        </linearGradient>
        <linearGradient id="whLogoBody3D" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#191B1E" />
          <stop offset="20%" stopColor="#2A2E35" />
          <stop offset="50%" stopColor="#181A1D" />
          <stop offset="80%" stopColor="#2A2E35" />
          <stop offset="100%" stopColor="#191B1E" />
        </linearGradient>
        <radialGradient id="whLogoPortalVoid" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#08090A" />
          <stop offset="65%" stopColor="#121417" />
          <stop offset="88%" stopColor="#202328" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.35" />
        </radialGradient>
        <radialGradient id="whLogoCoreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25" />
          <stop offset="70%" stopColor="#D4AF37" stopOpacity="0" />
        </radialGradient>
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
            stroke="url(#whLogoGoldRim)"
            strokeWidth="3"
            strokeOpacity="0.35"
          />
          <circle cx="256" cy="256" r="230" fill="url(#whLogoCoreGlow)" />
        </g>
      )}

      <g id="wormhole-group">
        <path
          d="M 88 410 C 88 456 424 456 424 410 C 424 365 352 300 326 265 C 290 215 390 155 418 120 C 418 80 94 80 94 120 C 122 155 222 215 186 265 C 160 300 88 365 88 410 Z"
          fill="url(#whLogoBody3D)"
        />
        <path d="M 98 400 C 145 446 367 446 414 400" fill="none" stroke="#D4AF37" strokeWidth="5" strokeOpacity="0.8" />
        <path d="M 124 355 C 165 400 347 400 388 355" fill="none" stroke="#D4AF37" strokeWidth="4.5" strokeOpacity="0.7" />
        <path d="M 154 310 C 188 350 324 350 358 310" fill="none" stroke="#D4AF37" strokeWidth="4" strokeOpacity="0.65" />
        <path d="M 180 265 C 205 295 307 295 332 265" fill="none" stroke="#D4AF37" strokeWidth="4.5" strokeOpacity="0.9" />
        <path d="M 160 215 C 190 185 322 185 352 215" fill="none" stroke="#D4AF37" strokeWidth="4" strokeOpacity="0.65" />
        <path d="M 130 165 C 170 135 342 135 382 165" fill="none" stroke="#D4AF37" strokeWidth="4.5" strokeOpacity="0.75" />

        <path d="M 256 182 L 256 428" fill="none" stroke="#D4AF37" strokeWidth="3.5" strokeOpacity="0.8" />
        <path d="M 218 180 C 230 220 230 300 214 425" fill="none" stroke="#D4AF37" strokeWidth="3.5" strokeOpacity="0.7" />
        <path d="M 294 180 C 282 220 282 300 298 425" fill="none" stroke="#D4AF37" strokeWidth="3.5" strokeOpacity="0.7" />
        <path d="M 176 172 C 202 220 202 300 172 416" fill="none" stroke="#D4AF37" strokeWidth="4" strokeOpacity="0.8" />
        <path d="M 336 172 C 310 220 310 300 340 416" fill="none" stroke="#D4AF37" strokeWidth="4" strokeOpacity="0.8" />
        <path d="M 132 158 C 174 215 174 300 126 400" fill="none" stroke="#D4AF37" strokeWidth="4.5" strokeOpacity="0.85" />
        <path d="M 380 158 C 338 215 338 300 386 400" fill="none" stroke="#D4AF37" strokeWidth="4.5" strokeOpacity="0.85" />

        <path d="M 94 120 C 122 155 222 215 186 265 C 160 300 88 365 88 410" fill="none" stroke="url(#whLogoGoldRim)" strokeWidth="6" />
        <path d="M 418 120 C 390 155 290 215 326 265 C 352 300 424 365 424 410" fill="none" stroke="url(#whLogoGoldRim)" strokeWidth="6" />

        <ellipse cx="256" cy="410" rx="168" ry="24" fill="none" stroke="url(#whLogoGoldRim)" strokeWidth="7" />

        <ellipse cx="256" cy="120" rx="162" ry="58" fill="#1F2226" stroke="url(#whLogoGoldRim)" strokeWidth="9" />
        <ellipse cx="256" cy="120" rx="136" ry="44" fill="url(#whLogoPortalVoid)" stroke="#D4AF37" strokeWidth="3" strokeOpacity="0.9" />

        <ellipse cx="256" cy="120" rx="42" ry="14" fill="#050607" stroke="#FAF9F6" strokeWidth="2" strokeOpacity="0.8" />
        <circle cx="256" cy="120" r="4.5" fill="#FAF9F6" />

        <g transform="translate(256, 116) scale(0.9)">
          <path d="M -16 10 L -22 -6 L -7 2 L 0 -12 L 7 2 L 22 -6 L 16 10 Z" fill="url(#whLogoGoldGleam)" stroke="#191B1D" strokeWidth="1.5" />
          <circle cx="-22" cy="-6" r="2.5" fill="#FAF9F6" />
          <circle cx="0" cy="-12" r="3" fill="#FAF9F6" />
          <circle cx="22" cy="-6" r="2.5" fill="#FAF9F6" />
        </g>
      </g>
    </svg>
  );
};

export default WormholeLogo;
