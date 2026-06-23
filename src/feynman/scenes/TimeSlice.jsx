import React from 'react';
import { Easing, clamp, interpolate } from '../../engine/easing.js';
import { useTime } from '../../engine/timeline.jsx';
import { HEB, MON, QCOL, QGLOW, QLET, NAME, GOLD } from '../constants.js';
import { FeynmanPath, fpColorAt } from '../FeynmanPath.jsx';
import { Tex } from '../Tex.jsx';

// path rows used by the vertical time-slice
const TS = [
  { states: ['red', 'green', 'red'], gluons: [{ a: 0, b: 1, c: 'r', anti: 'g' }], title: ['r', 'g', 'r'] },
  { states: ['red', 'blue', 'red'], gluons: [{ a: 0, b: 1, c: 'r', anti: 'b' }], title: ['r', 'b', 'r'] },
  {
    states: ['red', 'green', 'red', 'blue', 'red'],
    gluons: [
      { a: 0, b: 1, c: 'r', anti: 'g' },
      { a: 2, b: 3, c: 'r', anti: 'b' },
    ],
    title: ['r', 'g', 'r', 'b', 'r'],
  },
  { states: ['red', 'green', 'red'], gluons: [{ a: 0, b: 1, c: 'r', anti: 'g', split: true }], title: ['r', 'g', 'r'], badge: 'g→gg' },
];

// ── Scene 04: vertical time-slice — superposition at one instant ──────────────
export function TimeSliceScene() {
  const t = useTime();
  const op = clamp((t - 51.0) / 0.6, 0, 1) * (t > 61.0 ? clamp((61.9 - t) / 0.7, 0, 1) : 1);
  const LX = 96,
    RW = 720,
    rowH = 80,
    x0 = LX + 0.07 * RW,
    xe = LX + 0.93 * RW;
  const rowsTop = [176, 268, 360, 452];
  const f = interpolate([52.5, 57.2, 59.2, 61.9], [0.04, 0.94, 0.47, 0.47], Easing.easeInOutSine)(t);
  const sweepX = x0 + (xe - x0) * f;
  const started = t > 52.3;

  const present = [];
  const markers = rowsTop.map((rt, i) => {
    const col = fpColorAt(TS[i].states, f),
      my = rt + rowH * 0.58;
    if (!present.includes(col)) present.push(col);
    return { x: sweepX, y: my, col };
  });
  const order = ['red', 'green', 'blue'].filter((c) => present.includes(c));

  return (
    <div style={{ position: 'absolute', inset: 0, opacity: op }}>
      <div style={{ position: 'absolute', top: 86, left: 0, width: 1280, textAlign: 'center', direction: 'rtl' }}>
        <div style={{ fontFamily: HEB, fontSize: 30, fontWeight: 700, color: '#f4f6fb' }}>
          באותה נקודת זמן — החלקיק הוא <span style={{ color: GOLD }}>"גם, וגם, וגם"</span>
        </div>
      </div>
      {TS.map((cfg, i) => (
        <React.Fragment key={i}>
          <div style={{ position: 'absolute', left: LX - 66, top: rowsTop[i] + rowH * 0.5 - 10, width: 60, textAlign: 'right' }}>
            <span style={{ fontFamily: MON, fontSize: 12.5, fontWeight: 700, letterSpacing: '0.03em' }}>
              {cfg.title.map((c, k) => (
                <React.Fragment key={k}>
                  <span style={{ color: QCOL[NAME[c]] }}>{c}</span>
                  {k < cfg.title.length - 1 && <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>}
                </React.Fragment>
              ))}
            </span>
          </div>
          <div style={{ position: 'absolute', left: LX, top: rowsTop[i], width: RW, height: rowH }}>
            <FeynmanPath w={RW} h={rowH} states={cfg.states} gluons={cfg.gluons} reveal={1} showLabels={false} big={false} />
          </div>
        </React.Fragment>
      ))}
      {/* sweep line */}
      {started && (
        <React.Fragment>
          <div
            style={{
              position: 'absolute',
              left: sweepX,
              top: 150,
              width: 2,
              height: 384,
              background:
                'linear-gradient(to bottom, rgba(242,193,78,0), rgba(242,193,78,0.85), rgba(242,193,78,0))',
              boxShadow: '0 0 12px 2px rgba(242,193,78,0.5)',
              transform: 'translateX(-50%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: sweepX,
              top: 138,
              transform: 'translateX(-50%)',
              fontFamily: MON,
              fontSize: 13,
              color: GOLD,
            }}
          >
            t = t₀
          </div>
          {markers.map((m, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: m.x,
                top: m.y,
                transform: 'translate(-50%,-50%)',
                width: 22,
                height: 22,
                borderRadius: '50%',
                border: `2px solid ${QCOL[m.col]}`,
                boxShadow: `0 0 16px 4px ${QGLOW[m.col]}`,
                background: 'rgba(0,0,0,0.2)',
              }}
            />
          ))}
        </React.Fragment>
      )}
      {/* callout */}
      <div
        style={{
          position: 'absolute',
          left: 872,
          top: 232,
          width: 348,
          padding: '20px 22px',
          background: 'rgba(12,16,24,0.85)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          boxShadow: '0 14px 38px rgba(0,0,0,0.45)',
          direction: 'rtl',
          opacity: clamp((t - 53.2) / 0.6, 0, 1),
        }}
      >
        <div style={{ fontFamily: HEB, fontSize: 16, fontWeight: 600, color: 'rgba(244,246,251,0.85)', marginBottom: 12 }}>
          ברגע זמן זה, החלקיק הוא בו-זמנית:
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            direction: 'ltr',
            marginBottom: 16,
          }}
        >
          {order.map((c, i) => (
            <React.Fragment key={c}>
              {i > 0 && <span style={{ fontFamily: MON, fontSize: 24, color: 'rgba(255,255,255,0.45)' }}>+</span>}
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: QCOL[c],
                  boxShadow: `0 0 14px 3px ${QGLOW[c]}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: MON,
                  fontWeight: 700,
                  fontSize: 16,
                  color: 'rgba(0,0,0,0.55)',
                }}
              >
                {QLET[c]}
              </span>
            </React.Fragment>
          ))}
        </div>
        <div style={{ direction: 'ltr', textAlign: 'center' }}>
          <Tex
            tex={'|\\psi\\rangle=\\alpha\\,\\textcolor{#ff5563}{|r\\rangle}+\\beta\\,\\textcolor{#34d399}{|g\\rangle}+\\gamma\\,\\textcolor{#5b9bff}{|b\\rangle}'}
            display
            size={18}
          />
        </div>
        <div style={{ fontFamily: HEB, fontSize: 13.5, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 10 }}>
          סופרפוזיציה של מצבי הצבע
        </div>
      </div>
    </div>
  );
}
