import React, { useState } from 'react';
import { PieceAnchor } from '../types/deckChess';
import { PIECE_COLOR_THEMES } from '../engine/cardGraph';

export interface CardArtProps {
  anchor: PieceAnchor;
  artId?: string;
  cardName?: string;
  className?: string;
  alt?: string;
}

/**
 * CardArt Component
 *
 * Renders high-craft bespoke vector illustration for canonical cards.
 * Seamlessly resolves from /assets/cards/{anchor}/{artId}.svg.
 * If an asset is loading or missing, falls back to the piece theme glyph
 * with identical aspect ratio and zero layout shift.
 */
export const CardArt: React.FC<CardArtProps> = ({
  anchor,
  artId,
  cardName,
  className = '',
  alt
}) => {
  const [hasError, setHasError] = useState(false);
  const theme = PIECE_COLOR_THEMES[anchor] || PIECE_COLOR_THEMES.pawn;

  // Resolve SVG asset path
  const assetSrc = artId ? `/assets/cards/${anchor}/${artId}.svg` : null;

  if (!assetSrc || hasError) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center bg-transparent rounded select-none ${className}`}
        title={cardName || anchor}
      >
        <span
          className="text-xl opacity-75 transform transition-transform group-hover:scale-110"
          style={{ color: theme.hex }}
        >
          {theme.badgeIcon}
        </span>
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex items-center justify-center overflow-hidden bg-transparent rounded ${className}`}>
      <img
        src={assetSrc}
        alt={alt || cardName || `${anchor} card illustration`}
        onError={() => setHasError(true)}
        className="w-full h-full object-contain pointer-events-none select-none"
        loading="lazy"
      />
    </div>
  );
};

export default CardArt;
