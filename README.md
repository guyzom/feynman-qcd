# Feynman QCD — Path-Integral Animation

**▶ Live demo: https://guyzom.github.io/feynman-qcd/**

A lecture-edition animated explainer of the QCD path integral for the strong
interaction: an 82-second, 16:9 (1280×720) dark-mode piece narrated in Hebrew
(RTL) with English physics terms and real KaTeX equations. Implemented as a
Vite + React app, faithfully recreating the exported design in `project/`.

## Run it

```bash
npm install
npm run dev              # dev server (http://localhost:5173)
npm run build            # production build → dist/
npm run preview          # serve the production build
npm run build:standalone # single self-contained dist/index.html (offline, like the original export)
```

Fonts (Heebo, JetBrains Mono) and KaTeX are bundled locally — the app makes no
external requests. `build:standalone` additionally inlines all JS, CSS, and
fonts into one `index.html` you can open by double-clicking or hand to anyone.

**Transport:** `space` = play/pause · `←`/`→` = seek (hold `shift` for 1s steps)
· `0`/`Home` = reset · drag or click the scrub track to seek. The playhead is
persisted in `localStorage`.

## Deployment (GitHub Pages)

The live demo at **https://guyzom.github.io/feynman-qcd/** is published
automatically by GitHub Actions — there is nothing to deploy by hand.

How it's wired up:

1. **Workflow** — `.github/workflows/deploy.yml` runs on every push to `main`
   (and can be triggered manually via *Actions → Deploy to GitHub Pages →
   Run workflow*). It checks out the repo, runs `npm ci`, builds with
   `npm run build -- --base=/feynman-qcd/`, then uploads `dist/` and publishes
   it with the official `actions/deploy-pages` action.
2. **`--base=/feynman-qcd/`** — the site is served from a sub-path (the repo
   name), not the domain root, so Vite must emit asset URLs prefixed with
   `/feynman-qcd/`. Local `npm run dev`/`preview` use the default `/` base.
3. **Repo setting** — *Settings → Pages → Build and deployment → Source* is set
   to **GitHub Actions** (not "Deploy from a branch").

To ship a change: commit to `main` and push. The workflow rebuilds and the live
URL updates within a minute or two — hard-refresh (Ctrl/Cmd+Shift+R) to bypass
the browser cache.

## Structure

```
src/
  main.jsx                 # React entry; loads KaTeX CSS + Google fonts
  engine/                  # reusable timeline engine
    easing.js              # Easing, clamp, interpolate, animate
    timeline.jsx           # TimelineContext, Sprite, useTime/useSprite
    Stage.jsx              # auto-scaling 16:9 canvas + playback bar
  feynman/
    constants.js           # palette, fonts, section/path configs, runtime
    Tex.jsx                # cached KaTeX renderer
    FeynmanPath.jsx        # quark worldline + gluon arches/bubble renderer
    overlays.jsx           # section tags + narration bar
    FeynmanScenes.jsx      # root: composes the six timed scenes
    scenes/                # Title, SinglePath, GluonSplit, SumOverPaths,
                           #   TimeSlice, Climax, Phasor
```

The six sections: **01** One Path · **02** Gluon Self-Coupling · **03** Sum Over
Paths · **04** Superposition in Time · **05** Total Amplitude · **06**
Interference of Amplitudes (Feynman/Cornu phasor spiral).

The original design bundle is kept under `project/` and `chats/` for reference.

---

# CODING AGENTS: READ THIS FIRST

This is a **handoff bundle** from Claude Design (claude.ai/design).

A user mocked up designs in HTML/CSS/JS using an AI design tool, then exported this bundle so a coding agent can implement the designs for real.

## What you should do — IMPORTANT

**Read the chat transcripts first.** There are 1 chat transcript(s) in `chats/`. The transcripts show the full back-and-forth between the user and the design assistant — they tell you **what the user actually wants** and **where they landed** after iterating. Don't skip them. The final HTML files are the output, but the chat is where the intent lives.

**Read `project/Feynman QCD - standalone.html` in full.** The user had this file open when they triggered the handoff, so it's almost certainly the primary design they want built. Read it top to bottom — don't skim. Then **follow its imports**: open every file it pulls in (shared components, CSS, scripts) so you understand how the pieces fit together before you start implementing.

**If anything is ambiguous, ask the user to confirm before you start implementing.** It's much cheaper to clarify scope up front than to build the wrong thing.

## About the design files

The design medium is **HTML/CSS/JS** — these are prototypes, not production code. Your job is to **recreate them pixel-perfectly** in whatever technology makes sense for the target codebase (React, Vue, native, whatever fits). Match the visual output; don't copy the prototype's internal structure unless it happens to fit.

**Don't render these files in a browser or take screenshots unless the user asks you to.** Everything you need — dimensions, colors, layout rules — is spelled out in the source. Read the HTML and CSS directly; a screenshot won't tell you anything they don't.

## Bundle contents

- `README.md` — this file
- `chats/` — conversation transcripts (read these!)
- `project/` — the `אנימציה דיגרמת פיינמן (Copy)` project files (HTML prototypes, assets, components)
