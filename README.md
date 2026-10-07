# Feynman QCD

[![Verification](https://github.com/guyzom/feynman-qcd/actions/workflows/ci.yml/badge.svg)](https://github.com/guyzom/feynman-qcd/actions/workflows/ci.yml)

An interactive 82-second animation introducing color charge, gluon self-coupling, and interference of quantum amplitudes. React and SVG drive a shared timeline; Hebrew captions, English physics terms, and KaTeX equations remain synchronized during playback and seeking.

The animation uses a 1280 × 720 logical stage that scales to the available viewport. All fonts and runtime dependencies are bundled locally. A standalone build packages the application into one HTML file for offline playback.

## Local development

Node.js 24 or newer and npm are required.

```bash
npm ci
npm run dev
```

The development server defaults to `http://localhost:5173`. Production builds and local preview:

```bash
npm run build             # output: dist/
npm run preview
npm run build:standalone  # output: self-contained dist-standalone/index.html
```

The standalone HTML can be opened directly in a browser without a web server. The normal and standalone builds use separate output directories.

## Playback

| Control | Action |
| --- | --- |
| Space or playback button | Play / pause |
| Left / right arrow | Seek by 0.1 seconds |
| Shift + left / right arrow | Seek by 1 second |
| `0`, Home, or reset button | Return to the beginning |
| End | Seek to the end |
| Click or drag the timeline | Seek to a position |
| Hover over the timeline | Preview a position |

Playback loops by default. The playhead is saved in local storage when available.

## Verification

```bash
npx playwright install chromium
npm run build -- --base=/feynman-qcd/
npm run build:standalone
npm run test:browser
```

The browser suite uses Chromium and the production preview server at `http://127.0.0.1:4173/feynman-qcd/`. It covers scene and equation rendering, local asset loading, playback, keyboard controls, mouse and touch seeking, persisted state, unavailable storage, responsive layout, and standalone playback with network access disabled.

The **Verification** workflow runs these builds and checks on pushes and pull requests. The tests use the Pages subpath build shown above; `npm run build` without `--base` produces the default root-path build for local preview.

## Animation sections

| Section | Content |
| --- | --- |
| One Path | Quark color transitions and a quark–gluon vertex |
| Gluon Self-Coupling | A schematic gluon self-interaction and the QCD Lagrangian |
| Sum Over Paths | Several diagrammatic contributions displayed together |
| Superposition in Time | A shared time slice across illustrative histories |
| Total Amplitude | Addition of complex amplitudes before taking the squared magnitude |
| Interference of Amplitudes | Head-to-tail phasors illustrating constructive and destructive interference |

These are explanatory diagrams with prescribed motion and phases. The application does not calculate QCD scattering amplitudes or solve a field theory. [Physics scope](docs/PHYSICS.md) describes the approximations.

## Architecture

```text
src/
  main.jsx                 React entry and bundled font styles
  engine/
    Stage.jsx              Scaling, animation clock, transport, persistence
    timeline.jsx           Timeline context and timed scene activation
    easing.js              Interpolation and easing functions
  feynman/
    constants.js           Duration, palette, sections, and diagram definitions
    Tex.jsx                Cached KaTeX rendering
    FeynmanPath.jsx        SVG quark lines, gluon curves, and backgrounds
    overlays.jsx           Section titles and Hebrew captions
    FeynmanScenes.jsx      Scene composition
    scenes/                Individual animation sections
```

Every scene reads the shared playhead rather than maintaining an independent playback clock. This keeps diagrams, captions, and equations synchronized when the timeline is paused or scrubbed.

## GitHub Pages

The repository includes a manual deployment workflow. Once **Settings → Pages → Build and deployment → Source** is set to **GitHub Actions**, **Actions → Deploy to GitHub Pages → Run workflow** builds and publishes the site. Deployment is separate from the normal verification workflow.

The Pages build uses `--base=/feynman-qcd/` for the repository subpath. After a successful deployment, the site address is `https://guyzom.github.io/feynman-qcd/`.

Local development and the default build use `/`. Previewing the Pages build uses
`npm run preview -- --base=/feynman-qcd/`.

## Third-party components

React, KaTeX, Heebo, and JetBrains Mono are bundled with the application. Their applicable licenses and copyright notices appear in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and are embedded in both generated HTML builds.
