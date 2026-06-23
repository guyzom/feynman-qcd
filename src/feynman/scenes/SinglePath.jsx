import React from 'react';
import { Easing, clamp, interpolate } from '../../engine/easing.js';
import { useTime } from '../../engine/timeline.jsx';
import { HEB, MON, QCOL } from '../constants.js';
import { FeynmanPath } from '../FeynmanPath.jsx';
import { Tex } from '../Tex.jsx';

// time/space axes for the single-path scene
function Axes({ w, h }) {
  const bx = 72,
    by = h - 64,
    tx = w - 56,
    ty = 70;
  return (
    <React.Fragment>
      <svg width={w} height={h} style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
        <line x1={bx} y1={by} x2={tx} y2={by} stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
        <path d={`M ${tx} ${by} l -11 -5.5 l 0 11 z`} fill="rgba(255,255,255,0.32)" />
        <line x1={bx} y1={by} x2={bx} y2={ty} stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
        <path d={`M ${bx} ${ty} l -5.5 11 l 11 0 z`} fill="rgba(255,255,255,0.32)" />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: tx - 8,
          top: by + 12,
          transform: 'translateX(-100%)',
          fontFamily: MON,
          fontSize: 13,
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '0.08em',
          direction: 'rtl',
        }}
      >
        זמן · time →
      </div>
      <div
        style={{
          position: 'absolute',
          left: bx - 16,
          top: ty + 6,
          transform: 'rotate(-90deg)',
          transformOrigin: 'top left',
          fontFamily: MON,
          fontSize: 13,
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '0.08em',
          direction: 'rtl',
        }}
      >
        מרחב · space →
      </div>
    </React.Fragment>
  );
}

function EqCard({ children, x, y, w, op = 1, align = 'right' }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        opacity: op,
        padding: '14px 18px',
        background: 'rgba(12,16,24,0.82)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        boxShadow: '0 12px 34px rgba(0,0,0,0.4)',
        direction: 'rtl',
        textAlign: align,
        transform: `translateY(${(1 - op) * 10}px)`,
      }}
    >
      {children}
    </div>
  );
}

// ── Scene 2 (01): single path with axes + vertex equations ────────────────────
export function SinglePathScene() {
  const t = useTime();
  const reveal = interpolate([6.6, 9.3, 12.4, 15.0, 17.8], [0, 0.26, 0.52, 0.74, 1.0], Easing.easeInOutSine)(t);
  const glow = clamp((t - 18) / 1.2, 0, 1);
  const op = clamp((t - 5.5) / 0.6, 0, 1) * (t > 19.8 ? clamp((20.4 - t) / 0.6, 0, 1) : 1);
  const vCardOp = clamp((t - 9.6) / 0.5, 0, 1) * (t > 19.8 ? clamp((20.4 - t) / 0.5, 0, 1) : 1);
  const mCardOp = clamp((t - 17.6) / 0.5, 0, 1) * (t > 19.8 ? clamp((20.4 - t) / 0.5, 0, 1) : 1);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: op }}>
      <Axes w={1280} h={720} />
      <div
        style={{
          position: 'absolute',
          left: 1280 * 0.07,
          top: 720 * 0.58,
          transform: 'translate(-50%,-180%)',
          fontFamily: MON,
          fontSize: 15,
          color: 'rgba(255,255,255,0.6)',
          opacity: clamp(reveal * 8, 0, 1),
        }}
      >
        quark
      </div>
      <div style={{ filter: glow > 0 ? `brightness(${1 + glow * 0.1})` : 'none' }}>
        <FeynmanPath
          w={1280}
          h={720}
          states={['red', 'green', 'red']}
          gluons={[{ a: 0, b: 1, c: 'r', anti: 'g' }]}
          reveal={reveal}
          showLabels
          big
        />
      </div>
      <EqCard x={946} y={470} w={300} op={vCardOp}>
        <div style={{ fontFamily: HEB, fontSize: 15, fontWeight: 600, color: 'rgba(244,246,251,0.85)', marginBottom: 8 }}>
          צומת קווארק–גלואון
        </div>
        <div style={{ direction: 'ltr', textAlign: 'center' }}>
          <Tex tex={'-\\,i\\,g_s\\,\\gamma^{\\mu}\\,(T^{a})_{ij}'} display size={22} />
        </div>
        <div
          style={{
            fontFamily: MON,
            fontSize: 13,
            color: 'rgba(255,255,255,0.6)',
            marginTop: 8,
            direction: 'ltr',
            textAlign: 'center',
          }}
        >
          i = <span style={{ color: QCOL.red }}>r</span> &nbsp;→&nbsp; j = <span style={{ color: QCOL.green }}>g</span>
        </div>
      </EqCard>
      <EqCard x={946} y={622} w={300} op={mCardOp} align="center">
        <div style={{ direction: 'ltr' }}>
          <Tex tex={'\\mathcal{M}_1 \\;\\propto\\; g_s^{2}'} size={20} />
        </div>
        <div style={{ fontFamily: HEB, fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
          שני צמתים → המשרעת ∝ gₛ²
        </div>
      </EqCard>
    </div>
  );
}
