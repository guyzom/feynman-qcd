import React from 'react';
import { Easing, clamp } from '../../engine/easing.js';
import { useTime, useSprite } from '../../engine/timeline.jsx';
import { HEB, MON, QCOL, NAME, GOLD, fyLerp, PATHS, GRID } from '../constants.js';
import { FeynmanPath } from '../FeynmanPath.jsx';

// ── Scene 03a: announce — the grid frames fly out from a single point ─────────
export function AnnounceScene() {
  const { localTime, duration } = useSprite();
  const p = Easing.easeInOutCubic(clamp(localTime / 1.3, 0, 1));
  const txtOp =
    clamp(localTime / 0.5, 0, 1) * (localTime > duration - 0.5 ? clamp((duration - localTime) / 0.5, 0, 1) : 1);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {GRID.map((g, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: fyLerp(610, g.x, p),
            top: fyLerp(344, g.y, p),
            width: fyLerp(60, g.w, p),
            height: fyLerp(32, g.h, p),
            border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: 14,
            opacity: 0.16 * p,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: txtOp,
          direction: 'rtl',
          gap: 12,
        }}
      >
        <div
          style={{
            fontFamily: HEB,
            fontSize: 44,
            fontWeight: 800,
            color: '#f4f6fb',
            textAlign: 'center',
            maxWidth: 1000,
            lineHeight: 1.25,
          }}
        >
          בעולם הקוונטי — כל ההיסטוריות האפשריות קורות בו-זמנית
        </div>
        <div style={{ fontFamily: MON, fontSize: 16, color: 'rgba(242,193,78,0.85)', letterSpacing: '0.14em' }}>
          every possible path happens at once
        </div>
      </div>
    </div>
  );
}

// ── Scene 03b: 2×2 grid of paths ──────────────────────────────────────────────
function PanelCard({ cfg, box, reveal }) {
  const innerW = box.w - 36,
    innerH = box.h - 56;
  return (
    <div
      style={{
        position: 'absolute',
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 14,
        boxShadow: '0 12px 34px rgba(0,0,0,0.38)',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 13, left: 16, display: 'flex', alignItems: 'center', gap: 8, zIndex: 4 }}>
        <span style={{ fontFamily: MON, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>#{cfg.id}</span>
        <span
          style={{
            fontFamily: MON,
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          {cfg.title.map((c, k) => (
            <React.Fragment key={k}>
              <span style={{ color: QCOL[NAME[c]] }}>{c}</span>
              {k < cfg.title.length - 1 && <span style={{ color: 'rgba(255,255,255,0.32)' }}>→</span>}
            </React.Fragment>
          ))}
        </span>
        {cfg.badge && (
          <span
            style={{
              fontFamily: MON,
              fontSize: 11,
              color: GOLD,
              padding: '2px 7px',
              borderRadius: 6,
              background: 'rgba(242,193,78,0.12)',
              border: '1px solid rgba(242,193,78,0.3)',
            }}
          >
            {cfg.badge}
          </span>
        )}
      </div>
      <div style={{ position: 'absolute', left: 18, top: 44, width: innerW, height: innerH }}>
        <FeynmanPath w={innerW} h={innerH} states={cfg.states} gluons={cfg.gluons} reveal={reveal} showLabels big={false} />
      </div>
    </div>
  );
}

const REVEAL_WIN = [
  [39.0, 43.5],
  [40.0, 44.8],
  [41.2, 46.4],
  [42.4, 47.8],
];

export function GridScene() {
  const t = useTime();
  const op = clamp((t - 38.3) / 0.6, 0, 1) * (t > 50.0 ? clamp((50.8 - t) / 0.8, 0, 1) : 1);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: op }}>
      {PATHS.map((cfg, i) => {
        const win = REVEAL_WIN[i];
        const rev = Easing.easeInOutSine(clamp((t - win[0]) / (win[1] - win[0]), 0, 1));
        return <PanelCard key={cfg.id} cfg={cfg} box={GRID[i]} reveal={rev} />;
      })}
    </div>
  );
}
