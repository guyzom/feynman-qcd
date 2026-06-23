// Shared constants for the Feynman QCD path-integral animation.

export const FY_DUR = 82; // total runtime, seconds

export const HEB = "'Heebo', system-ui, sans-serif";
export const MON = "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace";

// Colour-charge palette
export const QCOL = { red: '#ff5563', green: '#34d399', blue: '#5b9bff' };
export const QGLOW = {
  red: 'rgba(255,85,99,0.65)',
  green: 'rgba(52,211,153,0.6)',
  blue: 'rgba(91,155,255,0.65)',
};
export const QLET = { red: 'r', green: 'g', blue: 'b' };
export const NAME = { r: 'red', g: 'green', b: 'blue' };
export const GOLD = '#f2c14e';

export const fyLerp = (a, b, t) => a + (b - a) * t;

// ── Section tags (top-left, persistent per scene) ─────────────────────────────
export const SECTIONS = [
  { n: '01', he: 'מסלול יחיד', en: 'One Path', s: 5.3, e: 20.3 },
  { n: '02', he: 'צימוד עצמי של גלואון', en: 'Gluon Self-Coupling', s: 20.6, e: 35.3 },
  { n: '03', he: 'סכום על כל המסלולים', en: 'Sum Over Paths', s: 35.6, e: 50.8 },
  { n: '04', he: 'סופרפוזיציה בזמן', en: 'Superposition in Time', s: 51.0, e: 61.9 },
  { n: '05', he: 'המשרעת הכוללת', en: 'Total Amplitude', s: 62.2, e: 70.5 },
  { n: '06', he: 'התאבכות המשרעות', en: 'Interference of Amplitudes', s: 70.7, e: FY_DUR },
];

// ── Path configs (used by the grid, time-slice, and climax scenes) ────────────
export const PATHS = [
  { id: 1, title: ['r', 'g', 'r'], states: ['red', 'green', 'red'], gluons: [{ a: 0, b: 1, c: 'r', anti: 'g' }] },
  { id: 2, title: ['r', 'b', 'r'], states: ['red', 'blue', 'red'], gluons: [{ a: 0, b: 1, c: 'r', anti: 'b' }] },
  {
    id: 3,
    title: ['r', 'g', 'r', 'b', 'r'],
    states: ['red', 'green', 'red', 'blue', 'red'],
    gluons: [
      { a: 0, b: 1, c: 'r', anti: 'g' },
      { a: 2, b: 3, c: 'r', anti: 'b' },
    ],
  },
  {
    id: 4,
    title: ['r', 'g', 'r'],
    badge: 'g→gg',
    states: ['red', 'green', 'red'],
    gluons: [{ a: 0, b: 1, c: 'r', anti: 'g', split: true }],
  },
];

export const GRID = [
  { x: 52, y: 116, w: 556, h: 240 },
  { x: 672, y: 116, w: 556, h: 240 },
  { x: 52, y: 378, w: 556, h: 240 },
  { x: 672, y: 378, w: 556, h: 240 },
];
