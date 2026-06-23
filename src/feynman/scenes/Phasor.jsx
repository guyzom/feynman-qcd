import React from 'react';
import { clamp } from '../../engine/easing.js';
import { useTime } from '../../engine/timeline.jsx';
import { HEB, MON, GOLD, fyLerp } from '../constants.js';
import { Tex } from '../Tex.jsx';

// ── small arrow (line + head) for the phasor sum ──────────────────────────────
function PArrow({ x1, y1, x2, y2, color, w = 2, head = 6, op = 1 }) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const h1x = x2 - head * Math.cos(ang - 0.45),
    h1y = y2 - head * Math.sin(ang - 0.45);
  const h2x = x2 - head * Math.cos(ang + 0.45),
    h2y = y2 - head * Math.sin(ang + 0.45);
  return (
    <g opacity={op}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={w} strokeLinecap="round" />
      <path
        d={`M ${x2} ${y2} L ${h1x} ${h1y} M ${x2} ${y2} L ${h2x} ${h2y}`}
        stroke={color}
        strokeWidth={w}
        strokeLinecap="round"
        fill="none"
      />
    </g>
  );
}

// ── Scene 06: interference / Feynman-arrow (Cornu) sum ─────────────────────────
export function PhasorScene() {
  const t = useTime();
  const op = clamp((t - 70.6) / 0.7, 0, 1) * (t > 81.3 ? clamp((82 - t) / 0.6, 0, 1) : 1);
  const O = { x: 612, y: 470 };
  const n = 26,
    L = 21,
    k0 = 12.5,
    c = 0.052,
    base = 0.62;
  const pts = [{ x: O.x, y: O.y }];
  for (let k = 0; k < n; k++) {
    const th = base + c * (k - k0) * (k - k0);
    const last = pts[pts.length - 1];
    pts.push({ x: last.x + L * Math.cos(th), y: last.y - L * Math.sin(th) });
  }
  const shown = clamp((t - 71.4) / 4.6, 0, 1) * n;
  const ni = Math.floor(shown),
    frac = shown - ni;
  const kMid = Math.round(k0);
  const arrows = [];
  for (let k = 0; k < Math.min(ni, n); k++) {
    const a = pts[k],
      b = pts[k + 1];
    const hue = k / n;
    const col = `hsl(${205 + hue * 60}, 70%, ${62 - hue * 6}%)`;
    arrows.push(<PArrow key={k} x1={a.x} y1={a.y} x2={b.x} y2={b.y} color={col} w={2} head={5} op={0.85} />);
  }
  if (ni < n && frac > 0) {
    const a = pts[ni],
      b = pts[ni + 1];
    const bx = a.x + (b.x - a.x) * frac,
      by = a.y + (b.y - a.y) * frac;
    arrows.push(<PArrow key="cur" x1={a.x} y1={a.y} x2={bx} y2={by} color="#cfe3ff" w={2.4} head={6} op={1} />);
  }
  const endIdx = Math.min(ni, n);
  const endP = pts[endIdx] || pts[n];
  const resOp = clamp((t - 76.2) / 0.8, 0, 1);
  const eqOp = (s) => clamp((t - s) / 0.8, 0, 1);
  // The four equations read as one connected derivation, linked by a glowing
  // spine with a node per step and all aligned on a common right-hand axis.
  const STEPS = [
    { tex: '\\mathcal{M}_i = A_i\\,e^{\\,iS_i/\\hbar}', he: 'כל מסלול תורם "חץ" מרוכב — משרעת ופאזה', s: 77.0 },
    { tex: '\\mathcal{M}=\\sum_i \\mathcal{M}_i', he: 'החצים מתחברים ראש־לזנב במישור המרוכב', s: 78.2 },
    { tex: 'P\\;\\propto\\;|\\mathcal{M}|^{2}', he: 'ההסתברות = אורך הסכום בריבוע', s: 79.2, gold: true },
    { tex: '\\langle f|i\\rangle=\\int\\!\\mathcal{D}\\phi\\;e^{\\,iS/\\hbar}', he: 'וזהו בדיוק אינטגרל המסלולים של פיינמן', s: 80.2 },
  ];
  const ROW = 80,
    railRight = 12,
    nodeY = 18;
  const revealed = STEPS.filter((st) => t >= st.s).length;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: op }}>
      {/* equations — a connected vertical derivation rail (RTL) */}
      <div style={{ position: 'absolute', right: 58, top: 142, width: 498, height: STEPS.length * ROW, direction: 'rtl' }}>
        {revealed > 1 && (
          <div
            style={{
              position: 'absolute',
              right: railRight,
              top: nodeY,
              width: 2,
              height: (revealed - 1) * ROW,
              background: 'linear-gradient(to bottom, rgba(242,193,78,0.55), rgba(207,227,255,0.28))',
              borderRadius: 2,
            }}
          />
        )}
        {STEPS.map((st, i) => {
          const o = eqOp(st.s);
          if (o <= 0) return null;
          const accent = st.gold ? GOLD : 'rgba(207,227,255,0.92)';
          return (
            <div
              key={i}
              style={{ position: 'absolute', top: i * ROW, right: 0, left: 0, opacity: o, transform: `translateY(${(1 - o) * 8}px)` }}
            >
              <div
                style={{
                  position: 'absolute',
                  right: railRight - 4.5,
                  top: nodeY - 5.5,
                  width: 11,
                  height: 11,
                  borderRadius: '50%',
                  background: accent,
                  boxShadow: `0 0 12px 2px ${st.gold ? 'rgba(242,193,78,0.75)' : 'rgba(207,227,255,0.5)'}`,
                }}
              />
              <div style={{ position: 'absolute', right: railRight + 24, left: 0 }}>
                <div style={{ direction: 'ltr', textAlign: 'right' }}>
                  <Tex
                    className="fy-eq-right"
                    tex={st.tex}
                    display
                    size={st.gold ? 23 : 20}
                    color={st.gold ? GOLD : '#eef2f9'}
                    style={{ display: 'block', textAlign: 'right' }}
                  />
                </div>
                <div style={{ direction: 'rtl', textAlign: 'right', fontFamily: HEB, fontSize: 14, color: 'rgba(244,246,251,0.62)', marginTop: 2 }}>
                  {st.he}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* complex-plane axes */}
      <svg width="1280" height="720" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <line x1={O.x - 60} y1={O.y} x2={O.x + 200} y2={O.y} stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
        <line x1={O.x} y1={O.y + 70} x2={O.x} y2={O.y - 280} stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
        <g style={{ filter: 'drop-shadow(0 0 3px rgba(120,170,255,0.55))' }}>{arrows}</g>
        {resOp > 0 && (
          <g style={{ filter: 'drop-shadow(0 0 7px rgba(242,193,78,0.85))' }}>
            <PArrow
              x1={O.x}
              y1={O.y}
              x2={fyLerp(O.x, endP.x, resOp)}
              y2={fyLerp(O.y, endP.y, resOp)}
              color={GOLD}
              w={4}
              head={13}
              op={1}
            />
          </g>
        )}
      </svg>
      <div style={{ position: 'absolute', left: O.x - 78, top: O.y + 10, fontFamily: MON, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
        Re
      </div>
      <div style={{ position: 'absolute', left: O.x + 8, top: O.y - 274, fontFamily: MON, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
        Im
      </div>
      {resOp > 0.6 && (
        <div
          style={{
            position: 'absolute',
            left: fyLerp(O.x, endP.x, 0.5) + 14,
            top: fyLerp(O.y, endP.y, 0.5) - 6,
            opacity: clamp((resOp - 0.6) / 0.4, 0, 1),
          }}
        >
          <Tex tex={'\\mathcal{M}'} size={24} color={GOLD} />
        </div>
      )}
      {/* annotations on the curve */}
      <div
        style={{
          position: 'absolute',
          left: pts[kMid].x - 6,
          top: pts[kMid].y - 64,
          transform: 'translateX(-50%)',
          opacity: clamp((t - 74.0) / 0.8, 0, 1) * (shown > k0 ? 1 : 0),
          textAlign: 'center',
          direction: 'rtl',
        }}
      >
        <div style={{ fontFamily: HEB, fontSize: 13.5, color: 'rgba(244,246,251,0.78)', whiteSpace: 'nowrap' }}>
          מסלולים סמוכים למסלול הקלאסי
        </div>
        <div style={{ fontFamily: MON, fontSize: 11, color: GOLD }}>stationary action — בונה</div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: pts[n].x + 14,
          top: pts[n].y - 8,
          opacity: clamp((t - 75.6) / 0.8, 0, 1),
          direction: 'rtl',
        }}
      >
        <div style={{ fontFamily: HEB, fontSize: 12.5, color: 'rgba(244,246,251,0.55)', whiteSpace: 'nowrap' }}>
          הקצוות מסתלסלים —<br />
          מסלולים "רחוקים" מתבטלים
        </div>
      </div>
      {/* closing tagline */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 64,
          textAlign: 'center',
          opacity: clamp((t - 80.8) / 0.9, 0, 1),
          direction: 'rtl',
        }}
      >
        <span style={{ fontFamily: HEB, fontSize: 20, fontWeight: 600, color: 'rgba(244,246,251,0.7)' }}>
          מתוך סכום אינסוף ההיסטוריות — צומחת ההסתברות הפיזיקלית
        </span>
      </div>
    </div>
  );
}
