import React from 'react';
import { clamp } from '../engine/easing.js';
import { QCOL, QGLOW, NAME, GOLD, MON } from './constants.js';

// ── colour–anticolour gluon label (each letter tinted; anti gets a bar) ───────
export function GLabel({ c, anti, size = 14 }) {
  return (
    <span
      style={{
        fontFamily: MON,
        fontSize: size,
        fontWeight: 700,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ color: QCOL[NAME[c]] }}>{c}</span>
      <span style={{ color: QCOL[NAME[anti]], textDecoration: 'overline', marginLeft: 1 }}>{anti}</span>
    </span>
  );
}

// ── coil segment from (x0,y0) to (x1,y1), bowing `bow` perpendicular ──────────
function coilSeg(x0, y0, x1, y1, bow, coils, amp, rev) {
  const dx = x1 - x0,
    dy = y1 - y0,
    len = Math.hypot(dx, dy) || 1;
  const px = -dy / len,
    py = dx / len;
  const N = Math.max(10, Math.round(len / 2.2));
  const last = Math.max(1, Math.floor(N * clamp(rev, 0, 1)));
  let d = '';
  for (let i = 0; i <= last; i++) {
    const t = i / N;
    const off = bow * 4 * t * (1 - t) + amp * Math.sin(t * coils * Math.PI * 2);
    const x = x0 + dx * t + px * off;
    const y = y0 + dy * t + py * off;
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
  }
  return d;
}

function gluonArch(x1, x2, baseY, archH, coils, amp, rev) {
  const N = 150,
    last = Math.max(1, Math.floor(N * clamp(rev, 0, 1)));
  let d = '';
  for (let i = 0; i <= last; i++) {
    const t = i / N,
      x = x1 + (x2 - x1) * t;
    const y = baseY - archH * 4 * t * (1 - t) + amp * Math.sin(t * coils * Math.PI * 2);
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
  }
  return d;
}

// Vertex fractions along the worldline, evenly spread between the endpoints.
const fpVerts = (states) => {
  const vc = states.length - 1;
  return vc <= 1 ? [0.5] : Array.from({ length: vc }, (_, i) => 0.26 + 0.48 * (i / (vc - 1)));
};

// Colour state of the worldline at fractional position f ∈ [0,1].
export function fpColorAt(states, f) {
  const b = [0, ...fpVerts(states), 1];
  let ci = 0;
  for (let i = 0; i < b.length - 1; i++) if (f >= b[i]) ci = i;
  return states[Math.min(ci, states.length - 1)];
}

// ── one Feynman quark worldline + gluon arches, revealed by `reveal` ──────────
export function FeynmanPath({ w, h, states, gluons, reveal, showLabels = true, big = false }) {
  // All geometry is a pure function of these inputs. The Stage re-renders every
  // descendant on the 60fps playhead tick, but a path whose `reveal` (and shape)
  // is unchanged — e.g. the finished panels in the grid/time-slice/climax scenes
  // — would otherwise rebuild every SVG path string each frame for nothing.
  // Memoize on a value key so those static instances pay the cost only once.
  const memoKey = `${w}|${h}|${reveal}|${showLabels}|${big}|${JSON.stringify(states)}|${JSON.stringify(gluons)}`;
  return React.useMemo(() => {
  const lineY = h * 0.58;
  const x0 = w * 0.07,
    xe = w * 0.93;
  const vxs = fpVerts(states).map((f) => x0 + (xe - x0) * f);
  const bounds = [x0, ...vxs, xe];
  const leadX = x0 + (xe - x0) * clamp(reveal, 0, 1);
  const lw = big ? 5 : 3;
  const glowR = big ? 7 : 4;
  // Flowing-energy overlays only on the featured (big) worldlines — small
  // multiples (grid/climax) stay calm so the eye isn't pulled everywhere.
  const flow = big;
  const segs = [],
    arrows = [],
    flows = [],
    verts = [],
    gls = [],
    glabels = [];

  for (let i = 0; i < states.length; i++) {
    const s = bounds[i],
      e = bounds[i + 1];
    if (leadX <= s) break;
    segs.push(
      <line
        key={'s' + i}
        x1={s}
        y1={lineY}
        x2={Math.min(e, leadX)}
        y2={lineY}
        stroke={QCOL[states[i]]}
        strokeWidth={lw}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 ${glowR}px ${QGLOW[states[i]]})` }}
      />
    );
    if (flow)
      flows.push(
        <line
          key={'sf' + i}
          className="fy-flow"
          x1={s}
          y1={lineY}
          x2={Math.min(e, leadX)}
          y2={lineY}
          stroke="rgba(255,255,255,0.92)"
          strokeWidth={Math.max(1.4, lw * 0.42)}
          strokeLinecap="round"
          strokeDasharray="9 151"
          style={{ filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.85))' }}
        />
      );
    const mid = (s + e) / 2;
    if (leadX > mid + 6) {
      const a = big ? 7 : 5;
      arrows.push(
        <path
          key={'a' + i}
          d={`M ${mid - a} ${lineY - a} L ${mid + a} ${lineY} L ${mid - a} ${lineY + a}`}
          fill="none"
          stroke={QCOL[states[i]]}
          strokeWidth={big ? 2.4 : 1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.95 }}
        />
      );
    }
  }
  vxs.forEach((vx, i) => {
    if (leadX > vx - 2) {
      if (flow)
        verts.push(
          <circle
            key={'vp' + i}
            className="fy-vertex-pulse"
            cx={vx}
            cy={lineY}
            r={big ? 10 : 7}
            fill="none"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth={big ? 1.6 : 1.2}
          />
        );
      verts.push(
        <circle
          key={'v' + i}
          cx={vx}
          cy={lineY}
          r={big ? 5 : 3.4}
          fill="#fff"
          style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.9))' }}
        />
      );
    }
  });

  const stroke = {
    stroke: GOLD,
    strokeWidth: big ? 2.6 : 1.7,
    strokeLinecap: 'round',
    fill: 'none',
    style: { filter: `drop-shadow(0 0 ${big ? 6 : 3}px rgba(242,193,78,0.6))` },
  };

  // A bright dash that streams along a gluon coil (energy in transit).
  const coilFlow = (d, key) => (
    <path
      key={key}
      className="fy-coil-flow"
      d={d}
      fill="none"
      stroke="rgba(255,236,179,0.95)"
      strokeWidth={big ? 1.7 : 1.1}
      strokeLinecap="round"
      strokeDasharray="6 114"
      style={{ filter: 'drop-shadow(0 0 5px rgba(242,193,78,0.95))' }}
    />
  );

  gluons.forEach((g, i) => {
    const xa = vxs[g.a],
      xb = vxs[g.b],
      span = Math.abs(xb - xa);
    const grev = clamp((leadX - Math.min(xa, xb)) / Math.max(1, span), 0, 1);
    if (grev <= 0) return;
    const amp = big ? 4 : 2.5;

    if (g.split) {
      // gluon self-coupling bubble
      const midX = (xa + xb) / 2,
        H1 = big ? 44 : 22,
        Hb = big ? 82 : 40,
        bow = big ? 24 : 13;
      const Ay = lineY - H1,
        By = Ay - Hb;
      const r1 = clamp(grev / 0.34, 0, 1),
        r2 = clamp((grev - 0.34) / 0.32, 0, 1),
        r3 = clamp((grev - 0.66) / 0.34, 0, 1);
      const sc1 = Math.max(6, Math.round(Math.hypot(midX - xa, H1) / (big ? 20 : 14)));
      const sbc = Math.max(4, Math.round(Hb / (big ? 15 : 11)));
      const sc2 = Math.max(6, Math.round(Math.hypot(xb - midX, H1) / (big ? 20 : 14)));
      const dA = coilSeg(xa, lineY, midX, Ay, 0, sc1, amp, r1);
      gls.push(<path key={'g' + i + 'a'} d={dA} {...stroke} />);
      if (flow) gls.push(coilFlow(dA, 'gf' + i + 'a'));
      if (r2 > 0) {
        const dL = coilSeg(midX, Ay, midX, By, bow, sbc, amp, r2);
        const dR = coilSeg(midX, Ay, midX, By, -bow, sbc, amp, r2);
        gls.push(<path key={'g' + i + 'l'} d={dL} {...stroke} />);
        gls.push(<path key={'g' + i + 'r'} d={dR} {...stroke} />);
        if (flow) {
          gls.push(coilFlow(dL, 'gf' + i + 'l'));
          gls.push(coilFlow(dR, 'gf' + i + 'r'));
        }
      }
      if (r3 > 0) {
        const dC = coilSeg(midX, By, xb, lineY, 0, sc2, amp, r3);
        gls.push(<path key={'g' + i + 'c'} d={dC} {...stroke} />);
        if (flow) gls.push(coilFlow(dC, 'gf' + i + 'c'));
      }
      const dia = (cx, cy, k) => (
        <rect
          key={k}
          x={cx - 4}
          y={cy - 4}
          width="8"
          height="8"
          fill={GOLD}
          transform={`rotate(45 ${cx} ${cy})`}
          style={{ filter: 'drop-shadow(0 0 6px rgba(242,193,78,0.9))' }}
        />
      );
      if (r1 >= 0.98) verts.push(dia(midX, Ay, 'd' + i + 'a'));
      if (r2 >= 0.98) verts.push(dia(midX, By, 'd' + i + 'b'));
      if (showLabels && r1 > 0.6)
        glabels.push(
          <div
            key={'gl' + i}
            style={{
              position: 'absolute',
              left: (xa + midX) / 2 - 14,
              top: (lineY + Ay) / 2 - 8,
              transform: 'translate(-50%,-100%)',
              padding: big ? '3px 8px' : '2px 6px',
              borderRadius: 6,
              background: 'rgba(8,11,18,0.82)',
              border: '1px solid rgba(242,193,78,0.35)',
              whiteSpace: 'nowrap',
              display: 'flex',
              gap: 4,
              alignItems: 'center',
              opacity: clamp((r1 - 0.6) / 0.3, 0, 1),
            }}
          >
            <span style={{ fontFamily: MON, fontSize: big ? 11 : 8.5, color: 'rgba(242,193,78,0.8)' }}>g</span>
            <GLabel c={g.c} anti={g.anti} size={big ? 13 : 9.5} />
          </div>
        );
      return;
    }

    const archH = Math.min(h * 0.42, span * 0.5 + (big ? 26 : 14));
    const coils = Math.max(5, Math.round(span / (big ? 22 : 15)));
    const dArch = gluonArch(xa, xb, lineY, archH, coils, amp, grev);
    gls.push(<path key={'g' + i} d={dArch} {...stroke} />);
    if (flow) gls.push(coilFlow(dArch, 'gf' + i));
    if (showLabels && grev > 0.5) {
      glabels.push(
        <div
          key={'gl' + i}
          style={{
            position: 'absolute',
            left: (xa + xb) / 2,
            top: lineY - archH - (big ? 16 : 9),
            transform: 'translate(-50%,-100%)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: big ? '3px 8px' : '2px 6px',
            borderRadius: 6,
            background: 'rgba(8,11,18,0.82)',
            border: '1px solid rgba(242,193,78,0.35)',
            whiteSpace: 'nowrap',
            opacity: clamp((grev - 0.5) / 0.3, 0, 1),
          }}
        >
          <span
            style={{
              fontFamily: MON,
              fontSize: big ? 11 : 8.5,
              color: 'rgba(242,193,78,0.8)',
              letterSpacing: '0.08em',
            }}
          >
            g
          </span>
          <GLabel c={g.c} anti={g.anti} size={big ? 13 : 9.5} />
        </div>
      );
    }
  });

  let charge = null;
  if (reveal > 0.001 && reveal < 0.992) {
    let ci = 0;
    for (let i = 0; i < bounds.length - 1; i++) if (leadX >= bounds[i]) ci = i;
    const col = states[Math.min(ci, states.length - 1)],
      r = big ? 13 : 7.5;
    charge = (
      <div
        style={{
          position: 'absolute',
          left: leadX,
          top: lineY,
          transform: 'translate(-50%,-50%)',
          width: r * 2,
          height: r * 2,
          borderRadius: '50%',
          background: QCOL[col],
          boxShadow: `0 0 ${big ? 26 : 15}px ${big ? 8 : 4}px ${QGLOW[col]}`,
          zIndex: 3,
        }}
      />
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <svg width={w} height={h} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {segs}
        {flows}
        {arrows}
        {gls}
        {verts}
      </svg>
      {glabels}
      {charge}
    </div>
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoKey]);
}

// ── faint dot grid backdrop ───────────────────────────────────────────────────
// Static and time-independent: memoized so it never re-renders on the 60fps
// playhead tick, and its (≈230-node) dot array is built only once. The slow
// "breathe" comes from a compositor-only CSS opacity animation, not JS.
export const GridGlow = React.memo(function GridGlow() {
  const dots = React.useMemo(() => {
    const out = [];
    for (let x = 0; x <= 1280; x += 64)
      for (let y = 0; y <= 720; y += 64)
        out.push(<circle key={x + '_' + y} cx={x} cy={y} r="1" fill="rgba(255,255,255,0.05)" />);
    return out;
  }, []);
  return (
    <svg width="1280" height="720" className="fy-grid-breathe" style={{ position: 'absolute', inset: 0 }}>
      {dots}
    </svg>
  );
});

// ── ambient aurora ────────────────────────────────────────────────────────────
// Two slow-drifting, low-opacity colour blobs behind the dot grid so the
// backdrop has depth and motion instead of a flat gradient. Compositor-only.
export const Aurora = React.memo(function Aurora() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div
        className="fy-aurora"
        style={{
          position: 'absolute',
          left: '-10%',
          top: '-25%',
          width: '70%',
          height: '90%',
          background: 'radial-gradient(circle at 50% 50%, rgba(91,155,255,0.18), transparent 62%)',
          filter: 'blur(36px)',
        }}
      />
      <div
        className="fy-aurora"
        style={{
          position: 'absolute',
          right: '-12%',
          bottom: '-28%',
          width: '72%',
          height: '92%',
          background: 'radial-gradient(circle at 50% 50%, rgba(52,211,153,0.13), transparent 62%)',
          filter: 'blur(40px)',
          animationDelay: '-12s',
          animationDuration: '30s',
        }}
      />
    </div>
  );
});

// ── cinematic edge vignette ───────────────────────────────────────────────────
// Topmost, pointer-transparent layer that gently darkens only the outer ~40%,
// adding depth without touching the central region where text/equations live.
export const Vignette = React.memo(function Vignette() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(135% 120% at 50% 44%, transparent 58%, rgba(2,4,8,0.5) 100%)',
        zIndex: 5,
      }}
    />
  );
});
