import React from 'react';
import { Easing } from '../../engine/easing.js';
import { useSprite } from '../../engine/timeline.jsx';
import { HEB, MON, QCOL, QGLOW } from '../constants.js';

// ── Scene 1: title — pulsing red colour-charge ────────────────────────────────
export function TitleScene() {
  const { localTime, duration } = useSprite();
  let op = 1;
  if (localTime < 0.5) op = Easing.easeOutCubic(localTime / 0.5);
  else if (localTime > duration - 0.6) op = 1 - Easing.easeInCubic((localTime - (duration - 0.6)) / 0.6);
  const pulse = 1 + 0.09 * Math.sin(localTime * 3.4);
  const ph = (localTime * 0.8) % 1;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: op,
        gap: 30,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 90,
          height: 90,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 70,
            height: 70,
            borderRadius: '50%',
            border: `2px solid ${QCOL.red}`,
            transform: `scale(${1 + 0.5 * ph})`,
            opacity: 0.5 * (1 - ph),
          }}
        />
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: QCOL.red,
            transform: `scale(${pulse})`,
            boxShadow: `0 0 34px 10px ${QGLOW.red}`,
          }}
        />
      </div>
      <div style={{ textAlign: 'center', direction: 'rtl' }}>
        <div style={{ fontFamily: HEB, fontSize: 64, fontWeight: 800, color: '#f4f6fb', letterSpacing: '-0.01em' }}>
          האינטראקציה החזקה
        </div>
        <div style={{ fontFamily: HEB, fontSize: 27, fontWeight: 500, color: 'rgba(244,246,251,0.62)', marginTop: 10 }}>
          סכום על כל המסלולים
        </div>
      </div>
      <div
        style={{
          fontFamily: MON,
          fontSize: 15,
          color: 'rgba(242,193,78,0.85)',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
        }}
      >
        QCD · Feynman Path Integral
      </div>
    </div>
  );
}
