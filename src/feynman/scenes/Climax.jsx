import React from 'react';
import { clamp } from '../../engine/easing.js';
import { useTime } from '../../engine/timeline.jsx';
import { HEB, MON, QCOL, NAME, GOLD, PATHS } from '../constants.js';
import { FeynmanPath } from '../FeynmanPath.jsx';
import { Tex } from '../Tex.jsx';

// ── Scene 05: total amplitude / superposition climax ──────────────────────────
export function ClimaxScene() {
  const t = useTime();
  const op = clamp((t - 62.0) / 0.6, 0, 1) * (t > 69.9 ? clamp((70.6 - t) / 0.6, 0, 1) : 1);
  const rowOp = clamp((t - 62.3) / 0.8, 0, 1);
  const eq1 = clamp((t - 63.8) / 0.9, 0, 1);
  const eq2 = clamp((t - 66.0) / 0.9, 0, 1);
  const cell = { w: 254, h: 132 };
  const xs = [40, 334, 628, 922],
    plusX = [307, 601, 895];
  const sub = ['₁', '₂', '₃', '₄'];
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: op }}>
      {PATHS.map((cfg, i) => (
        <div
          key={cfg.id}
          style={{
            position: 'absolute',
            left: xs[i],
            top: 130,
            width: cell.w,
            height: cell.h,
            opacity: rowOp,
            transform: `translateY(${(1 - rowOp) * 12}px)`,
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 12,
              fontFamily: MON,
              fontSize: 11.5,
              fontWeight: 700,
              display: 'flex',
              gap: 2,
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.4)', marginRight: 4 }}>𝓜{sub[i]}</span>
            {cfg.title.map((c, k) => (
              <React.Fragment key={k}>
                <span style={{ color: QCOL[NAME[c]] }}>{c}</span>
                {k < cfg.title.length - 1 && <span style={{ color: 'rgba(255,255,255,0.3)' }}>→</span>}
              </React.Fragment>
            ))}
          </div>
          <div style={{ position: 'absolute', left: 10, top: 30, width: cell.w - 20, height: cell.h - 40 }}>
            <FeynmanPath w={cell.w - 20} h={cell.h - 40} states={cfg.states} gluons={cfg.gluons} reveal={1} showLabels={false} big={false} />
          </div>
        </div>
      ))}
      {plusX.map((x, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: 196,
            transform: 'translate(-50%,-50%)',
            fontFamily: MON,
            fontSize: 30,
            fontWeight: 300,
            color: 'rgba(255,255,255,0.5)',
            opacity: rowOp,
          }}
        >
          +
        </div>
      ))}

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 358,
          textAlign: 'center',
          opacity: eq1,
          transform: `translateY(${(1 - eq1) * 12}px)`,
        }}
      >
        <Tex tex={'\\mathcal{M}=\\sum_{i}\\mathcal{M}_{i}=\\mathcal{M}_1+\\mathcal{M}_2+\\mathcal{M}_3+\\mathcal{M}_4+\\cdots'} display size={36} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 470,
          textAlign: 'center',
          opacity: eq2,
          transform: `translateY(${(1 - eq2) * 12}px)`,
        }}
      >
        <Tex tex={'P\\;\\propto\\;|\\mathcal{M}|^{2}=\\Big|\\textstyle\\sum_i \\mathcal{M}_i\\Big|^{2}'} display size={30} color={GOLD} />
        <div style={{ fontFamily: HEB, fontSize: 16, color: 'rgba(244,246,251,0.6)', direction: 'rtl', marginTop: 14 }}>
          אבל המשרעות הן <span style={{ color: GOLD }}>מספרים מרוכבים</span> — איך בעצם מחברים אותן?
        </div>
      </div>
    </div>
  );
}
