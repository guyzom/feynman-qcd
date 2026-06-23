import React from 'react';
import katex from 'katex';
import { MON } from './constants.js';

// ── KaTeX (cached renderToString) ─────────────────────────────────────────────
const _texCache = {};

function texHtml(tex, display) {
  const k = (display ? 'D|' : 'I|') + tex;
  if (_texCache[k] != null) return _texCache[k];
  let h = '';
  try {
    h = katex.renderToString(tex, { throwOnError: false, displayMode: display });
  } catch {
    h = '';
  }
  if (h) _texCache[k] = h;
  return h;
}

// Renders a TeX string with KaTeX; falls back to a monospace literal if KaTeX
// fails for any reason.
export function Tex({ tex, display = false, size = 18, color = '#eef2f9', style = {} }) {
  const html = texHtml(tex, display);
  if (!html) {
    return <span style={{ fontFamily: MON, fontSize: size * 0.9, color, ...style }}>{tex}</span>;
  }
  return (
    <span
      style={{ color, fontSize: size, lineHeight: 1.35, ...style }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
