import React from 'react';

export interface EvalBarProps {
  whiteCp: number;
  whiteWinPct: number; // 0 to 100
  displayLabel: string; // e.g. "+1.4", "0.0", "-0.8", "M2"
  orientation?: 'w' | 'b';
  className?: string;
}

export const EvalBar: React.FC<EvalBarProps> = ({
  whiteCp,
  whiteWinPct,
  displayLabel,
  orientation = 'w',
  className = '',
}) => {
  // Clamped percentage 0 to 100
  const clampedPct = Math.min(100, Math.max(0, whiteWinPct));

  // Determine which side is currently ahead or equal from the viewing perspective
  const isWhiteView = orientation === 'w';
  // If White view: bottom is White (clampedPct), top is Black (100 - clampedPct)
  // If Black view: bottom is Black (100 - clampedPct), top is White (clampedPct)
  const bottomPct = isWhiteView ? clampedPct : 100 - clampedPct;
  const isBottomAdvantage = bottomPct >= 50;

  // Text color based on which section the score label sits on
  // If bottom has >= 50% fill:
  //   In White view: bottom is White (#FAF9F6), label text should be dark (#191B1D)
  //   In Black view: bottom is Black (#1E2022), label text should be light (#FAF9F6)
  // If top has > 50% fill:
  //   In White view: top is Black (#1E2022), label text should be light (#FAF9F6)
  //   In Black view: top is White (#FAF9F6), label text should be dark (#191B1D)
  let textColor = '#FAF9F6';
  if (isBottomAdvantage) {
    textColor = isWhiteView ? '#191B1D' : '#FAF9F6';
  } else {
    textColor = isWhiteView ? '#FAF9F6' : '#191B1D';
  }

  const tooltipTitle = `Position Evaluation: ${displayLabel} (${
    whiteCp > 0 ? 'White advantage' : whiteCp < 0 ? 'Black advantage' : 'Even'
  })`;

  return (
    <div
      data-testid="eval-bar"
      title={tooltipTitle}
      className={`w-full h-full rounded-sm overflow-hidden border border-[rgba(139,126,116,0.45)] bg-[#1E2022] relative select-none shadow-md ${className}`}
    >
      {/* White Fill Layer */}
      <div
        className="absolute left-0 right-0 bg-[#FAF9F6] transition-all duration-300 ease-out"
        style={
          isWhiteView
            ? { bottom: 0, height: `${clampedPct}%` }
            : { top: 0, height: `${clampedPct}%` }
        }
      />

      {/* Center 50% tick marker */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-[rgba(139,126,116,0.4)] pointer-events-none z-10" />

      {/* Numeric Evaluation Score Readout */}
      <div
        data-testid="eval-bar-score"
        className={`absolute left-0 right-0 flex items-center justify-center pointer-events-none z-20 px-0.5 text-[9px] sm:text-[10px] font-mono font-extrabold tracking-tighter leading-none ${
          isBottomAdvantage ? 'bottom-1' : 'top-1'
        }`}
        style={{ color: textColor }}
      >
        {displayLabel}
      </div>
    </div>
  );
};
