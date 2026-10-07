import React from 'react';
import { createRoot } from 'react-dom/client';
import 'katex/dist/katex.min.css';
// Self-hosted fonts (embedded in the bundle — no external requests).
import '@fontsource/heebo/400.css';
import '@fontsource/heebo/500.css';
import '@fontsource/heebo/600.css';
import '@fontsource/heebo/700.css';
import '@fontsource/heebo/800.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import './index.css';
import FeynmanScenes from './feynman/FeynmanScenes.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FeynmanScenes />
  </React.StrictMode>
);
