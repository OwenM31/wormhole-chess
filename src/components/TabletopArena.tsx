import React from 'react';

export interface TabletopArenaProps {
  children: React.ReactNode;
  evalBar?: React.ReactNode;
  maxWidth?: string | number;
  className?: string;
}

/**
 * TabletopArena
 * 
 * Frames the 8x8 chessboard inside the hand-drawn tavern tabletop artwork (tabletop-arena.jpg).
 * Inscribed coordinates:
 * - Tabletop art dimensions: 1024 x 572
 * - Center carved square: 424 x 424 at x: 300..724, y: 64..488
 *   - left: 29.296875%
 *   - top: 11.188811%
 *   - width: 41.40625%
 *   - height: 74.125874%
 * - Side Evaluation Bar: left: 26.1%, top: 11.188811%, width: 2.35%, height: 74.125874%
 * 
 * Responsive behavior:
 * - Tablet / Desktop (>600px): Preserves exact 1024:572 aspect ratio showing peripheral table props
 *   (scroll & coins top-left, candle top-right, mug bottom-right, inkwell & quill bottom-left).
 * - Mobile (<=600px): Adapts to side-by-side view with slim 16px eval bar and 1:1 chessboard
 *   to ensure maximum chessboard touch target comfort with zero horizontal overflow.
 */
export const TabletopArena: React.FC<TabletopArenaProps> = ({
  children,
  evalBar,
  maxWidth = '920px',
  className = '',
}) => {
  return (
    <div
      className={`tabletop-arena-root ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth,
        margin: '0 auto',
      }}
    >
      <style>{`
        .tabletop-arena-stage {
          position: relative;
          width: 100%;
          aspect-ratio: 1024 / 572;
          background-image: url(/assets/backgrounds/tabletop-arena.jpg);
          background-size: 100% 100%;
          background-repeat: no-repeat;
          border-radius: 10px;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(140, 109, 83, 0.35);
          overflow: hidden;
        }
        .tabletop-arena-stage::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 48%, rgba(0, 0, 0, 0) 30%, rgba(26, 18, 12, 0.35) 80%, rgba(10, 8, 6, 0.65) 100%);
          pointer-events: none;
          border-radius: 10px;
        }
        .tabletop-eval-slot {
          position: absolute;
          left: 26.1%;
          top: 11.188811%;
          width: 2.35%;
          min-width: 18px;
          max-width: 24px;
          height: 74.125874%;
          z-index: 2;
          display: flex;
        }
        .tabletop-board-inscribed {
          position: absolute;
          left: 29.296875%;
          top: 11.188811%;
          width: 41.40625%;
          height: 74.125874%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
        }
        @media (max-width: 600px) {
          .tabletop-arena-stage {
            aspect-ratio: 1 / 1;
            background-size: cover;
            background-position: center 30%;
            padding: 6px;
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            align-items: stretch;
            justify-content: center;
            gap: 6px;
          }
          .tabletop-eval-slot {
            position: relative;
            left: auto;
            top: auto;
            width: 16px;
            flex-shrink: 0;
            height: 100%;
          }
          .tabletop-board-inscribed {
            position: relative;
            left: auto;
            top: auto;
            flex: 1;
            min-width: 0;
            aspect-ratio: 1 / 1;
            height: auto;
          }
        }
      `}</style>
      <div className="tabletop-arena-stage" data-testid="tabletop-arena-stage">
        {evalBar && (
          <div className="tabletop-eval-slot" data-testid="tabletop-eval-slot">
            {evalBar}
          </div>
        )}
        <div className="tabletop-board-inscribed" data-testid="tabletop-board-inscribed">
          {children}
        </div>
      </div>
    </div>
  );
};

export default TabletopArena;
