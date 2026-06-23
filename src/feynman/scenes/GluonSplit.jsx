import React from 'react';
import { Easing, clamp, interpolate } from '../../engine/easing.js';
import { useTime } from '../../engine/timeline.jsx';
import { HEB, GOLD } from '../constants.js';
import { FeynmanPath } from '../FeynmanPath.jsx';
import { Tex } from '../Tex.jsx';

// ── Scene 2 (02): gluon self-coupling, featured ───────────────────────────────
export function GluonSplitScene() {
  const t = useTime();
  const reveal = interpolate([22.0, 25.5, 29.0, 32.0], [0, 0.34, 0.66, 1.0], Easing.easeInOutSine)(t);
  const op = clamp((t - 20.7) / 0.6, 0, 1) * (t > 34.8 ? clamp((35.4 - t) / 0.6, 0, 1) : 1);
  const badgeOp = clamp((reveal - 0.5) / 0.2, 0, 1);
  const lagOp = clamp((t - 27.5) / 0.7, 0, 1) * (t > 34.8 ? clamp((35.4 - t) / 0.6, 0, 1) : 1);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: op }}>
      <div style={{ position: 'absolute', left: 0, top: 56, width: 1280, height: 392 }}>
        <FeynmanPath
          w={1280}
          h={392}
          states={['red', 'green', 'red']}
          gluons={[{ a: 0, b: 1, c: 'r', anti: 'g', split: true }]}
          reveal={reveal}
          showLabels
          big
        />
      </div>
      {/* 3-gluon vertex badge near the bubble apex */}
      <div
        style={{
          position: 'absolute',
          left: 640,
          top: 56 + 392 * 0.58 - 44 - 82 - 26,
          transform: 'translate(-50%,-100%)',
          opacity: badgeOp,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <div style={{ fontFamily: HEB, fontSize: 14, fontWeight: 600, color: GOLD, whiteSpace: 'nowrap' }}>
          צומת שלושה־גלואונים
        </div>
        <div
          style={{
            direction: 'ltr',
            padding: '4px 10px',
            borderRadius: 7,
            background: 'rgba(242,193,78,0.12)',
            border: '1px solid rgba(242,193,78,0.35)',
          }}
        >
          <Tex tex={'\\sim g_s\\,f^{abc}'} size={16} color={GOLD} />
        </div>
        <div
          style={{
            fontFamily: HEB,
            fontSize: 12.5,
            color: 'rgba(244,246,251,0.6)',
            direction: 'rtl',
            whiteSpace: 'nowrap',
          }}
        >
          8 גלואונים · <span style={{ color: 'rgba(242,193,78,0.85)' }}>אוקטֶט של SU(3)</span>
        </div>
      </div>
      {/* Lagrangian card */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 360,
          transform: `translateX(-50%) translateY(${(1 - lagOp) * 12}px)`,
          opacity: lagOp,
          width: 880,
          padding: '18px 26px',
          background: 'rgba(12,16,24,0.85)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          boxShadow: '0 14px 38px rgba(0,0,0,0.45)',
        }}
      >
        <div
          style={{
            fontFamily: HEB,
            fontSize: 15,
            fontWeight: 600,
            color: 'rgba(244,246,251,0.8)',
            direction: 'rtl',
            marginBottom: 12,
          }}
        >
          צפיפות הלגראנז'יאן של QCD
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <Tex
            tex={
              '\\mathcal{L}_{\\mathrm{QCD}}=-\\tfrac14\\,G^{a}_{\\mu\\nu}G^{a\\,\\mu\\nu}+\\bar{\\psi}\\,(i\\gamma^{\\mu}D_{\\mu}-m)\\,\\psi'
            }
            display
            size={21}
          />
          <Tex
            tex={
              'G^{a}_{\\mu\\nu}=\\partial_{\\mu}A^{a}_{\\nu}-\\partial_{\\nu}A^{a}_{\\mu}+\\textcolor{#f2c14e}{g_s\\,f^{abc}A^{b}_{\\mu}A^{c}_{\\nu}}'
            }
            display
            size={20}
          />
        </div>
        <div
          style={{
            fontFamily: HEB,
            fontSize: 14.5,
            color: 'rgba(244,246,251,0.74)',
            direction: 'rtl',
            textAlign: 'center',
            marginTop: 14,
          }}
        >
          האיבר המודגש הוא <span style={{ color: GOLD }}>הצימוד העצמי של הגלואונים</span> — תכונה לא־אבלית (SU(3)) שאין
          לה מקבילה בפוטון
        </div>
      </div>
    </div>
  );
}
