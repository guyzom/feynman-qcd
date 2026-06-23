import React from 'react';
import { clamp } from '../engine/easing.js';
import { useTime } from '../engine/timeline.jsx';
import { HEB, MON, GOLD, SECTIONS } from './constants.js';
import { GLabel } from './FeynmanPath.jsx';

// ── section tags (top-left, persistent per scene) ─────────────────────────────
export function Sections() {
  const t = useTime();
  return SECTIONS.map((s, i) => {
    const op = clamp((t - s.s) / 0.5, 0, 1) * clamp((s.e - t) / 0.5, 0, 1);
    if (op <= 0) return null;
    return (
      <div
        key={i}
        style={{ position: 'absolute', top: 32, left: 48, opacity: op, display: 'flex', alignItems: 'center', gap: 11 }}
      >
        <span style={{ fontFamily: MON, fontSize: 13, color: GOLD, letterSpacing: '0.12em', fontWeight: 700 }}>
          {s.n}
        </span>
        <span style={{ width: 22, height: 1, background: 'rgba(255,255,255,0.22)', display: 'inline-block' }} />
        <span
          style={{ fontFamily: HEB, fontSize: 16, fontWeight: 600, color: 'rgba(244,246,251,0.72)', direction: 'rtl' }}
        >
          {s.he}
        </span>
        <span style={{ fontFamily: MON, fontSize: 11, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.06em' }}>
          · {s.en}
        </span>
      </div>
    );
  });
}

// ── narration bar (RTL pill, bottom) ──────────────────────────────────────────
const CAPS = [
  { s: 5.9, e: 8.8, he: 'קווארק עם מטען צבע אדום מתחיל את מסעו' },
  { s: 8.9, e: 12.0, he: 'פולט גלואון — והמטען מתחלף לירוק', glu: { c: 'r', anti: 'g' } },
  { s: 12.1, e: 14.6, he: 'נע במצב צבע ירוק' },
  { s: 14.7, e: 17.3, he: 'בולע את הגלואון — וחוזר לאדום', glu: { c: 'r', anti: 'g' } },
  { s: 17.4, e: 19.9, he: 'בכל צומת הצבע נשמר — דרך מחוללי SU(3)' },
  { s: 21.0, e: 25.3, he: 'אך הגלואון עצמו נושא מטען צבע' },
  { s: 25.4, e: 30.0, he: 'ולכן הוא יכול להתפצל לשני גלואונים' },
  { s: 39.0, e: 44.0, he: 'כל היסטוריה אפשרית מתרחשת — עם רצף צבעים וצימודים שונה' },
  { s: 44.2, e: 50.0, he: 'לכל אחת משרעת משלה, התלויה בקבוע הצימוד gₛ' },
];

export function NarrationBar() {
  const t = useTime();
  const cap = CAPS.find((c) => t >= c.s && t <= c.e);
  if (!cap) return null;
  const op = clamp((t - cap.s) / 0.4, 0, 1) * clamp((cap.e - t) / 0.4, 0, 1);
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 36,
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 26px',
        borderRadius: 999,
        background: 'rgba(8,11,18,0.8)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(6px)',
        opacity: op,
        direction: 'rtl',
        maxWidth: 1060,
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
      }}
    >
      <span style={{ fontFamily: HEB, fontSize: 24, fontWeight: 600, color: '#f4f6fb', whiteSpace: 'nowrap' }}>
        {cap.he}
      </span>
      {cap.glu && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 9px',
            borderRadius: 7,
            background: 'rgba(242,193,78,0.12)',
            border: '1px solid rgba(242,193,78,0.3)',
            direction: 'ltr',
          }}
        >
          <span style={{ fontFamily: MON, fontSize: 11, color: 'rgba(242,193,78,0.8)' }}>g</span>
          <GLabel c={cap.glu.c} anti={cap.glu.anti} size={15} />
        </span>
      )}
    </div>
  );
}
