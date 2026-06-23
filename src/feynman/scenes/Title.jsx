import React from 'react';
import { Easing } from '../../engine/easing.js';
import { useSprite } from '../../engine/timeline.jsx';
import { HEB, MON, QCOL, QGLOW } from '../constants.js';

// One orbiting colour charge; depth (z) gives a subtle near/far scale + glow.
function OrbitCharge({ q }) {
  const depth = 0.78 + 0.22 * (q.z + 1) / 2; // 0.78 (far) → 1.0 (near)
  const size = 15 * depth;
  return (
    <div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        background: QCOL[q.c],
        transform: `translate(${q.x}px, ${q.y}px)`,
        boxShadow: `0 0 ${14 * depth}px ${5 * depth}px ${QGLOW[q.c]}`,
        opacity: 0.55 + 0.45 * depth,
        zIndex: q.z >= 0 ? 2 : 0,
      }}
    />
  );
}

// ── Scene 1: title — pulsing red colour-charge ────────────────────────────────
export function TitleScene() {
  const { localTime, duration } = useSprite();
  let op = 1;
  if (localTime < 0.5) op = Easing.easeOutCubic(localTime / 0.5);
  else if (localTime > duration - 0.6) op = 1 - Easing.easeInCubic((localTime - (duration - 0.6)) / 0.6);
  const pulse = 1 + 0.09 * Math.sin(localTime * 3.4);
  const ph = (localTime * 0.8) % 1;
  // Three colour charges orbit the core, foreshadowing colour charge (r/g/b).
  const orbitR = 86;
  const charges = ['red', 'green', 'blue'].map((c, k) => {
    const ang = localTime * 0.85 + (k * 2 * Math.PI) / 3;
    return { c, x: Math.cos(ang) * orbitR, y: Math.sin(ang) * orbitR, z: Math.sin(ang) };
  });
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
          width: 220,
          height: 220,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* faint orbit guide ring */}
        <div
          style={{
            position: 'absolute',
            width: orbitR * 2,
            height: orbitR * 2,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        />
        {/* expanding emission ring */}
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
        {/* orbiting colour charges behind the core (z < 0) */}
        {charges
          .filter((q) => q.z < 0)
          .map((q) => (
            <OrbitCharge key={q.c} q={q} />
          ))}
        {/* pulsing colour-charge core */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: QCOL.red,
            transform: `scale(${pulse})`,
            boxShadow: `0 0 34px 10px ${QGLOW.red}`,
            zIndex: 1,
          }}
        />
        {/* orbiting colour charges in front of the core (z ≥ 0) */}
        {charges
          .filter((q) => q.z >= 0)
          .map((q) => (
            <OrbitCharge key={q.c} q={q} />
          ))}
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
