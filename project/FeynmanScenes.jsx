// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// animations.jsx
// Reusable animation starter: Stage, Timeline, Sprite, easing helpers.
// Exports (to window): Stage, Sprite, PlaybackBar, TextSprite, ImageSprite, RectSprite,
//   useTime, useTimeline, useSprite, Easing, interpolate, animate, clamp.
//
// Usage (in an HTML file that loads React + Babel):
//
//   <Stage width={1280} height={720} duration={10} background="#f6f4ef">
//     <MyScene />
//   </Stage>
//
// <Stage> auto-scales to the viewport and provides the scrubber, play/pause,
// ←/→ seek, space, and 0-to-reset controls, and persists the playhead.
// Inside <Stage>, any child can call useTime() to read the current
// playhead (seconds). Or wrap content in <Sprite start={1} end={4}>...</Sprite>
// to only render during that window -- children receive a `localTime` and
// `progress` via the useSprite() hook. Use Easing + interpolate()/animate()
// for tweens; TextSprite / ImageSprite / RectSprite have built-in entry/exit.
// Build YOUR scenes by composing Sprites inside a Stage.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

// ── Easing functions (hand-rolled, Popmotion-style) ─────────────────────────
// All easings take t ∈ [0,1] and return eased t ∈ [0,1] (may overshoot for back/elastic).
const Easing = {
  linear: (t) => t,

  // Quad
  easeInQuad:    (t) => t * t,
  easeOutQuad:   (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  // Cubic
  easeInCubic:    (t) => t * t * t,
  easeOutCubic:   (t) => (--t) * t * t + 1,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),

  // Quart
  easeInQuart:    (t) => t * t * t * t,
  easeOutQuart:   (t) => 1 - (--t) * t * t * t,
  easeInOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t),

  // Expo
  easeInExpo:  (t) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  easeOutExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOutExpo: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return 0.5 * Math.pow(2, 20 * t - 10);
    return 1 - 0.5 * Math.pow(2, -20 * t + 10);
  },

  // Sine
  easeInSine:    (t) => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine:   (t) => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,

  // Back (overshoot)
  easeOutBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeInOutBack: (t) => {
    const c1 = 1.70158, c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },

  // Elastic
  easeOutElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

// ── Core interpolation helpers ──────────────────────────────────────────────

// Clamp a value to [min, max]
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// interpolate([0, 0.5, 1], [0, 100, 50], ease?) -> fn(t)
// Popmotion-style: linearly maps t across input keyframes to output values,
// with optional easing per segment (single fn or array of fns).
function interpolate(input, output, ease = Easing.linear) {
  return (t) => {
    if (t <= input[0]) return output[0];
    if (t >= input[input.length - 1]) return output[output.length - 1];
    for (let i = 0; i < input.length - 1; i++) {
      if (t >= input[i] && t <= input[i + 1]) {
        const span = input[i + 1] - input[i];
        const local = span === 0 ? 0 : (t - input[i]) / span;
        const easeFn = Array.isArray(ease) ? (ease[i] || Easing.linear) : ease;
        const eased = easeFn(local);
        return output[i] + (output[i + 1] - output[i]) * eased;
      }
    }
    return output[output.length - 1];
  };
}

// animate({from, to, start, end, ease})(t) — simpler single-segment tween.
// Returns `from` before `start`, `to` after `end`.
function animate({ from = 0, to = 1, start = 0, end = 1, ease = Easing.easeInOutCubic }) {
  return (t) => {
    if (t <= start) return from;
    if (t >= end) return to;
    const local = (t - start) / (end - start);
    return from + (to - from) * ease(local);
  };
}

// ── Timeline context ────────────────────────────────────────────────────────

const TimelineContext = React.createContext({ time: 0, duration: 10, playing: false });

const useTime = () => React.useContext(TimelineContext).time;
const useTimeline = () => React.useContext(TimelineContext);

// ── Sprite ──────────────────────────────────────────────────────────────────
// Renders children only when the playhead is inside [start, end]. Provides
// a sub-context with `localTime` (seconds since start) and `progress` (0..1).
//
//   <Sprite start={2} end={5}>
//     {({ localTime, progress }) => <Thing x={progress * 100} />}
//   </Sprite>
//
// Or as a plain wrapper — children can call useSprite() themselves.

const SpriteContext = React.createContext({ localTime: 0, progress: 0, duration: 0 });
const useSprite = () => React.useContext(SpriteContext);

function Sprite({ start = 0, end = Infinity, children, keepMounted = false }) {
  const { time } = useTimeline();
  const visible = time >= start && time <= end;
  if (!visible && !keepMounted) return null;

  const duration = end - start;
  const localTime = Math.max(0, time - start);
  const progress = duration > 0 && isFinite(duration)
    ? clamp(localTime / duration, 0, 1)
    : 0;

  const value = { localTime, progress, duration, visible };

  return (
    <SpriteContext.Provider value={value}>
      {typeof children === 'function' ? children(value) : children}
    </SpriteContext.Provider>
  );
}

// ── Sample sprite components ────────────────────────────────────────────────

// TextSprite: fades/slides text in on entry, holds, then fades out on exit.
// Props: text, x, y, size, color, font, entryDur, exitDur, align
function TextSprite({
  text,
  x = 0, y = 0,
  size = 48,
  color = '#111',
  font = 'Inter, system-ui, sans-serif',
  weight = 600,
  entryDur = 0.45,
  exitDur = 0.35,
  entryEase = Easing.easeOutBack,
  exitEase = Easing.easeInCubic,
  align = 'left',
  letterSpacing = '-0.01em',
}) {
  const { localTime, duration } = useSprite();
  const exitStart = Math.max(0, duration - exitDur);

  let opacity = 1;
  let ty = 0;

  if (localTime < entryDur) {
    const t = entryEase(clamp(localTime / entryDur, 0, 1));
    opacity = t;
    ty = (1 - t) * 16;
  } else if (localTime > exitStart) {
    const t = exitEase(clamp((localTime - exitStart) / exitDur, 0, 1));
    opacity = 1 - t;
    ty = -t * 8;
  }

  const translateX = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';

  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      transform: `translate(${translateX}, ${ty}px)`,
      opacity,
      fontFamily: font,
      fontSize: size,
      fontWeight: weight,
      color,
      letterSpacing,
      whiteSpace: 'pre',
      lineHeight: 1.1,
      willChange: 'transform, opacity',
    }}>
      {text}
    </div>
  );
}

// ImageSprite: scales + fades in; optional Ken Burns drift during hold.
function ImageSprite({
  src,
  x = 0, y = 0,
  width = 400, height = 300,
  entryDur = 0.6,
  exitDur = 0.4,
  kenBurns = false,
  kenBurnsScale = 1.08,
  radius = 12,
  fit = 'cover',
  placeholder = null, // {label: string} for striped placeholder
}) {
  const { localTime, duration } = useSprite();
  const exitStart = Math.max(0, duration - exitDur);

  let opacity = 1;
  let scale = 1;

  if (localTime < entryDur) {
    const t = Easing.easeOutCubic(clamp(localTime / entryDur, 0, 1));
    opacity = t;
    scale = 0.96 + 0.04 * t;
  } else if (localTime > exitStart) {
    const t = Easing.easeInCubic(clamp((localTime - exitStart) / exitDur, 0, 1));
    opacity = 1 - t;
    scale = (kenBurns ? kenBurnsScale : 1) + 0.02 * t;
  } else if (kenBurns) {
    const holdSpan = exitStart - entryDur;
    const holdT = holdSpan > 0 ? (localTime - entryDur) / holdSpan : 0;
    scale = 1 + (kenBurnsScale - 1) * holdT;
  }

  const content = placeholder ? (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'repeating-linear-gradient(135deg, #e9e6df 0 10px, #dcd8cf 10px 20px)',
      color: '#6b6458',
      fontFamily: 'JetBrains Mono, ui-monospace, monospace',
      fontSize: 13,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}>
      {placeholder.label || 'image'}
    </div>
  ) : (
    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: fit, display: 'block' }} />
  );

  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      width, height,
      opacity,
      transform: `scale(${scale})`,
      transformOrigin: 'center',
      borderRadius: radius,
      overflow: 'hidden',
      willChange: 'transform, opacity',
    }}>
      {content}
    </div>
  );
}

// RectSprite: simple rectangle that animates position/size/color via props.
// Useful demo primitive — takes a `render` fn for per-frame customization.
function RectSprite({
  x = 0, y = 0,
  width = 100, height = 100,
  color = '#111',
  radius = 8,
  entryDur = 0.4,
  exitDur = 0.3,
  render, // optional: (ctx) => style overrides
}) {
  const spriteCtx = useSprite();
  const { localTime, duration } = spriteCtx;
  const exitStart = Math.max(0, duration - exitDur);

  let opacity = 1;
  let scale = 1;

  if (localTime < entryDur) {
    const t = Easing.easeOutBack(clamp(localTime / entryDur, 0, 1));
    opacity = clamp(localTime / entryDur, 0, 1);
    scale = 0.4 + 0.6 * t;
  } else if (localTime > exitStart) {
    const t = Easing.easeInQuad(clamp((localTime - exitStart) / exitDur, 0, 1));
    opacity = 1 - t;
    scale = 1 - 0.15 * t;
  }

  const overrides = render ? render(spriteCtx) : {};

  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      width, height,
      background: color,
      borderRadius: radius,
      opacity,
      transform: `scale(${scale})`,
      transformOrigin: 'center',
      willChange: 'transform, opacity',
      ...overrides,
    }} />
  );
}


function Stage({
  width = 1280,
  height = 720,
  duration = 10,
  background = '#f6f4ef',
  fps = 60,
  loop = true,
  autoplay = true,
  persistKey = 'animstage',
  children,
}) {
  const [time, setTime] = React.useState(() => {
    try {
      const v = parseFloat(localStorage.getItem(persistKey + ':t') || '0');
      return isFinite(v) ? clamp(v, 0, duration) : 0;
    } catch { return 0; }
  });
  const [playing, setPlaying] = React.useState(autoplay);
  const [hoverTime, setHoverTime] = React.useState(null);
  const [scale, setScale] = React.useState(1);

  const stageRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const lastTsRef = React.useRef(null);

  // Persist playhead
  React.useEffect(() => {
    try { localStorage.setItem(persistKey + ':t', String(time)); } catch {}
  }, [time, persistKey]);

  // Auto-scale to fit viewport
  React.useEffect(() => {
    if (!stageRef.current) return;
    const el = stageRef.current;
    const measure = () => {
      const barH = 44; // playback bar height
      const s = Math.min(
        el.clientWidth / width,
        (el.clientHeight - barH) / height
      );
      setScale(Math.max(0.05, s));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [width, height]);

  // Animation loop
  React.useEffect(() => {
    if (!playing) {
      lastTsRef.current = null;
      return;
    }
    const step = (ts) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      setTime((t) => {
        let next = t + dt;
        if (next >= duration) {
          if (loop) next = next % duration;
          else { next = duration; setPlaying(false); }
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [playing, duration, loop]);

  // Keyboard: space = play/pause, ← → = seek
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setPlaying(p => !p);
      } else if (e.code === 'ArrowLeft') {
        setTime(t => clamp(t - (e.shiftKey ? 1 : 0.1), 0, duration));
      } else if (e.code === 'ArrowRight') {
        setTime(t => clamp(t + (e.shiftKey ? 1 : 0.1), 0, duration));
      } else if (e.key === '0' || e.code === 'Home') {
        setTime(0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [duration]);

  const displayTime = hoverTime != null ? hoverTime : time;

  const ctxValue = React.useMemo(
    () => ({ time: displayTime, duration, playing, setTime, setPlaying }),
    [displayTime, duration, playing]
  );

  return (
    <div
      ref={stageRef}
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        background: '#0a0a0a',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Canvas area — vertically centered in remaining space */}
      <div style={{
        flex: 1,
        width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        <div
          ref={canvasRef}
          style={{
            width, height,
            background,
            position: 'relative',
            transform: `scale(${scale})`,
            transformOrigin: 'center',
            flexShrink: 0,
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}
        >
          <TimelineContext.Provider value={ctxValue}>
            {children}
          </TimelineContext.Provider>
        </div>
      </div>

      {/* Playback bar — stacked below canvas, never overlapping */}
      <PlaybackBar
        time={displayTime}
        actualTime={time}
        duration={duration}
        playing={playing}
        onPlayPause={() => setPlaying(p => !p)}
        onReset={() => { setTime(0); }}
        onSeek={(t) => setTime(t)}
        onHover={(t) => setHoverTime(t)}
      />
    </div>
  );
}

// ── Playback bar ────────────────────────────────────────────────────────────
// Play/pause, return-to-begin, scrub track, time display.
// Uses fixed-width time fields so layout doesn't thrash.

function PlaybackBar({ time, duration, playing, onPlayPause, onReset, onSeek, onHover }) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);

  const timeFromEvent = React.useCallback((e) => {
    const rect = trackRef.current.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    return x * duration;
  }, [duration]);

  const onTrackMove = (e) => {
    if (!trackRef.current) return;
    const t = timeFromEvent(e);
    if (dragging) {
      onSeek(t);
    } else {
      onHover(t);
    }
  };

  const onTrackLeave = () => {
    if (!dragging) onHover(null);
  };

  const onTrackDown = (e) => {
    setDragging(true);
    const t = timeFromEvent(e);
    onSeek(t);
    onHover(null);
  };

  React.useEffect(() => {
    if (!dragging) return;
    const onUp = () => setDragging(false);
    const onMove = (e) => {
      if (!trackRef.current) return;
      const t = timeFromEvent(e);
      onSeek(t);
    };
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
    };
  }, [dragging, timeFromEvent, onSeek]);

  const pct = duration > 0 ? (time / duration) * 100 : 0;
  const fmt = (t) => {
    const total = Math.max(0, t);
    const m = Math.floor(total / 60);
    const s = Math.floor(total % 60);
    const cs = Math.floor((total * 100) % 100);
    return `${String(m).padStart(1, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };

  const mono = 'JetBrains Mono, ui-monospace, SFMono-Regular, monospace';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 16px',
      background: 'rgba(20,20,20,0.92)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      width: '100%',
      maxWidth: 680,
      alignSelf: 'center',

      borderRadius: 8,
      color: '#f6f4ef',
      fontFamily: 'Inter, system-ui, sans-serif',
      userSelect: 'none',
      flexShrink: 0,
    }}>
      <IconButton onClick={onReset} title="Return to start (0)">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 2v10M12 2L5 7l7 5V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
        </svg>
      </IconButton>
      <IconButton onClick={onPlayPause} title="Play/pause (space)">
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="3" y="2" width="3" height="10" fill="currentColor"/>
            <rect x="8" y="2" width="3" height="10" fill="currentColor"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 2l9 5-9 5V2z" fill="currentColor"/>
          </svg>
        )}
      </IconButton>

      {/* Current time: fixed width so it doesn't thrash */}
      <div style={{
        fontFamily: mono,
        fontSize: 12,
        fontVariantNumeric: 'tabular-nums',
        width: 64, textAlign: 'right',
        color: '#f6f4ef',
      }}>
        {fmt(time)}
      </div>

      {/* Scrub track */}
      <div
        ref={trackRef}
        onMouseMove={onTrackMove}
        onMouseLeave={onTrackLeave}
        onMouseDown={onTrackDown}
        style={{
          flex: 1,
          height: 22,
          position: 'relative',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center',
        }}
      >
        <div style={{
          position: 'absolute',
          left: 0, right: 0, height: 4,
          background: 'rgba(255,255,255,0.12)',
          borderRadius: 2,
        }}/>
        <div style={{
          position: 'absolute',
          left: 0, width: `${pct}%`, height: 4,
          background: 'oklch(72% 0.12 250)',
          borderRadius: 2,
        }}/>
        <div style={{
          position: 'absolute',
          left: `${pct}%`, top: '50%',
          width: 12, height: 12,
          marginLeft: -6, marginTop: -6,
          background: '#fff',
          borderRadius: 6,
          boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
        }}/>
      </div>

      {/* Duration: fixed width */}
      <div style={{
        fontFamily: mono,
        fontSize: 12,
        fontVariantNumeric: 'tabular-nums',
        width: 64, textAlign: 'left',
        color: 'rgba(246,244,239,0.55)',
      }}>
        {fmt(duration)}
      </div>
    </div>
  );
}

function IconButton({ children, onClick, title }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 28, height: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: hover ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 6,
        color: '#f6f4ef',
        cursor: 'pointer',
        padding: 0,
        transition: 'background 120ms',
      }}
    >
      {children}
    </button>
  );
}


Object.assign(window, {
  Easing, interpolate, animate, clamp,
  TimelineContext, useTime, useTimeline,
  Sprite, SpriteContext, useSprite,
  TextSprite, ImageSprite, RectSprite,
  Stage, PlaybackBar,
});



/* ===================================================================
   Feynman path-integral animation — Strong Interaction (QCD)
   Lecture edition. Shares the engine's module scope (Stage, Sprite,
   useTime, useSprite, Easing, interpolate, clamp, React).
   =================================================================== */

const FY_DUR = 82;
const HEB = "'Heebo', system-ui, sans-serif";
const MON = "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace";

const QCOL  = { red:'#ff5563', green:'#34d399', blue:'#5b9bff' };
const QGLOW = { red:'rgba(255,85,99,0.65)', green:'rgba(52,211,153,0.6)', blue:'rgba(91,155,255,0.65)' };
const QLET  = { red:'r', green:'g', blue:'b' };
const NAME  = { r:'red', g:'green', b:'blue' };
const GOLD  = '#f2c14e';
const fyLerp = (a, b, t) => a + (b - a) * t;

// ── KaTeX (cached renderToString) ───────────────────────────────────
const _texCache = {};
function texHtml(tex, display) {
  const k = (display ? 'D|' : 'I|') + tex;
  if (_texCache[k] != null) return _texCache[k];
  let h = '';
  try { if (window.katex) h = window.katex.renderToString(tex, { throwOnError: false, displayMode: display }); }
  catch (e) { h = ''; }
  if (h) _texCache[k] = h;
  return h;
}
function Tex({ tex, display = false, size = 18, color = '#eef2f9', style = {} }) {
  const html = texHtml(tex, display);
  if (!html) return <span style={{ fontFamily: MON, fontSize: size * 0.9, color, ...style }}>{tex}</span>;
  return <span style={{ color, fontSize: size, lineHeight: 1.35, ...style }} dangerouslySetInnerHTML={{ __html: html }} />;
}

// ── colour-anticolour gluon label (each letter tinted; anti gets a bar)
function GLabel({ c, anti, size = 14 }) {
  return (
    <span style={{ fontFamily: MON, fontSize: size, fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
      <span style={{ color: QCOL[NAME[c]] }}>{c}</span>
      <span style={{ color: QCOL[NAME[anti]], textDecoration: 'overline', marginLeft: 1 }}>{anti}</span>
    </span>
  );
}

// ── coil segment from (x0,y0) to (x1,y1), bowing `bow` perpendicular
function coilSeg(x0, y0, x1, y1, bow, coils, amp, rev) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len, px = -uy, py = ux;
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
  const N = 150, last = Math.max(1, Math.floor(N * clamp(rev, 0, 1)));
  let d = '';
  for (let i = 0; i <= last; i++) {
    const t = i / N, x = x1 + (x2 - x1) * t;
    const y = baseY - archH * 4 * t * (1 - t) + amp * Math.sin(t * coils * Math.PI * 2);
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
  }
  return d;
}

const fpVerts = (states) => {
  const vc = states.length - 1;
  return vc <= 1 ? [0.5] : Array.from({ length: vc }, (_, i) => 0.26 + 0.48 * (i / (vc - 1)));
};
function fpColorAt(states, f) {
  const b = [0, ...fpVerts(states), 1];
  let ci = 0;
  for (let i = 0; i < b.length - 1; i++) if (f >= b[i]) ci = i;
  return states[Math.min(ci, states.length - 1)];
}

// ── one Feynman quark worldline + gluon arches, revealed by `reveal`
function FeynmanPath({ w, h, states, gluons, reveal, showLabels = true, big = false }) {
  const lineY = h * 0.58;
  const x0 = w * 0.07, xe = w * 0.93;
  const vxs = fpVerts(states).map(f => x0 + (xe - x0) * f);
  const bounds = [x0, ...vxs, xe];
  const leadX = x0 + (xe - x0) * clamp(reveal, 0, 1);
  const lw = big ? 5 : 3;
  const glowR = big ? 7 : 4;
  const segs = [], arrows = [], verts = [], gls = [], glabels = [];

  for (let i = 0; i < states.length; i++) {
    const s = bounds[i], e = bounds[i + 1];
    if (leadX <= s) break;
    segs.push(<line key={'s' + i} x1={s} y1={lineY} x2={Math.min(e, leadX)} y2={lineY}
      stroke={QCOL[states[i]]} strokeWidth={lw} strokeLinecap="round"
      style={{ filter: `drop-shadow(0 0 ${glowR}px ${QGLOW[states[i]]})` }} />);
    const mid = (s + e) / 2;
    if (leadX > mid + 6) {
      const a = big ? 7 : 5;
      arrows.push(<path key={'a' + i} d={`M ${mid - a} ${lineY - a} L ${mid + a} ${lineY} L ${mid - a} ${lineY + a}`}
        fill="none" stroke={QCOL[states[i]]} strokeWidth={big ? 2.4 : 1.6} strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.95 }} />);
    }
  }
  vxs.forEach((vx, i) => {
    if (leadX > vx - 2) verts.push(<circle key={'v' + i} cx={vx} cy={lineY} r={big ? 5 : 3.4} fill="#fff"
      style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.9))' }} />);
  });

  const stroke = { stroke: GOLD, strokeWidth: big ? 2.6 : 1.7, strokeLinecap: 'round', fill: 'none',
    style: { filter: `drop-shadow(0 0 ${big ? 6 : 3}px rgba(242,193,78,0.6))` } };

  gluons.forEach((g, i) => {
    const xa = vxs[g.a], xb = vxs[g.b], span = Math.abs(xb - xa);
    const grev = clamp((leadX - Math.min(xa, xb)) / Math.max(1, span), 0, 1);
    if (grev <= 0) return;
    const amp = big ? 4 : 2.5;

    if (g.split) {                                   // gluon self-coupling bubble
      const midX = (xa + xb) / 2, H1 = big ? 44 : 22, Hb = big ? 82 : 40, bow = big ? 24 : 13;
      const Ay = lineY - H1, By = Ay - Hb;
      const r1 = clamp(grev / 0.34, 0, 1), r2 = clamp((grev - 0.34) / 0.32, 0, 1), r3 = clamp((grev - 0.66) / 0.34, 0, 1);
      const sc1 = Math.max(6, Math.round(Math.hypot(midX - xa, H1) / (big ? 20 : 14)));
      const sbc = Math.max(4, Math.round(Hb / (big ? 15 : 11)));
      const sc2 = Math.max(6, Math.round(Math.hypot(xb - midX, H1) / (big ? 20 : 14)));
      gls.push(<path key={'g' + i + 'a'} d={coilSeg(xa, lineY, midX, Ay, 0, sc1, amp, r1)} {...stroke} />);
      if (r2 > 0) {
        gls.push(<path key={'g' + i + 'l'} d={coilSeg(midX, Ay, midX, By, bow, sbc, amp, r2)} {...stroke} />);
        gls.push(<path key={'g' + i + 'r'} d={coilSeg(midX, Ay, midX, By, -bow, sbc, amp, r2)} {...stroke} />);
      }
      if (r3 > 0) gls.push(<path key={'g' + i + 'c'} d={coilSeg(midX, By, xb, lineY, 0, sc2, amp, r3)} {...stroke} />);
      const dia = (cx, cy, k) => <rect key={k} x={cx - 4} y={cy - 4} width="8" height="8" fill={GOLD}
        transform={`rotate(45 ${cx} ${cy})`} style={{ filter: 'drop-shadow(0 0 6px rgba(242,193,78,0.9))' }} />;
      if (r1 >= 0.98) verts.push(dia(midX, Ay, 'd' + i + 'a'));
      if (r2 >= 0.98) verts.push(dia(midX, By, 'd' + i + 'b'));
      if (showLabels && r1 > 0.6)
        glabels.push(<div key={'gl' + i} style={{ position: 'absolute', left: (xa + midX) / 2 - 14, top: (lineY + Ay) / 2 - 8,
          transform: 'translate(-50%,-100%)', padding: big ? '3px 8px' : '2px 6px', borderRadius: 6,
          background: 'rgba(8,11,18,0.82)', border: '1px solid rgba(242,193,78,0.35)', whiteSpace: 'nowrap',
          display: 'flex', gap: 4, alignItems: 'center', opacity: clamp((r1 - 0.6) / 0.3, 0, 1) }}>
          <span style={{ fontFamily: MON, fontSize: big ? 11 : 8.5, color: 'rgba(242,193,78,0.8)' }}>g</span>
          <GLabel c={g.c} anti={g.anti} size={big ? 13 : 9.5} /></div>);
      return;
    }

    const archH = Math.min(h * 0.42, span * 0.5 + (big ? 26 : 14));
    const coils = Math.max(5, Math.round(span / (big ? 22 : 15)));
    gls.push(<path key={'g' + i} d={gluonArch(xa, xb, lineY, archH, coils, amp, grev)} {...stroke} />);
    if (showLabels && grev > 0.5) {
      glabels.push(<div key={'gl' + i} style={{ position: 'absolute', left: (xa + xb) / 2, top: lineY - archH - (big ? 16 : 9),
        transform: 'translate(-50%,-100%)', display: 'flex', alignItems: 'center', gap: 4, padding: big ? '3px 8px' : '2px 6px',
        borderRadius: 6, background: 'rgba(8,11,18,0.82)', border: '1px solid rgba(242,193,78,0.35)', whiteSpace: 'nowrap',
        opacity: clamp((grev - 0.5) / 0.3, 0, 1) }}>
        <span style={{ fontFamily: MON, fontSize: big ? 11 : 8.5, color: 'rgba(242,193,78,0.8)', letterSpacing: '0.08em' }}>g</span>
        <GLabel c={g.c} anti={g.anti} size={big ? 13 : 9.5} /></div>);
    }
  });

  let charge = null;
  if (reveal > 0.001 && reveal < 0.992) {
    let ci = 0; for (let i = 0; i < bounds.length - 1; i++) if (leadX >= bounds[i]) ci = i;
    const col = states[Math.min(ci, states.length - 1)], r = big ? 13 : 7.5;
    charge = <div style={{ position: 'absolute', left: leadX, top: lineY, transform: 'translate(-50%,-50%)',
      width: r * 2, height: r * 2, borderRadius: '50%', background: QCOL[col],
      boxShadow: `0 0 ${big ? 26 : 15}px ${big ? 8 : 4}px ${QGLOW[col]}`, zIndex: 3 }} />;
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <svg width={w} height={h} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>{segs}{arrows}{gls}{verts}</svg>
      {glabels}{charge}
    </div>
  );
}

// ── faint dot grid
function GridGlow() {
  const dots = [];
  for (let x = 0; x <= 1280; x += 64) for (let y = 0; y <= 720; y += 64)
    dots.push(<circle key={x + '_' + y} cx={x} cy={y} r="1" fill="rgba(255,255,255,0.05)" />);
  return <svg width="1280" height="720" style={{ position: 'absolute', inset: 0 }}>{dots}</svg>;
}

// ── section tags (top-left, persistent per scene)
const SECTIONS = [
  { n: '01', he: 'מסלול יחיד', en: 'One Path', s: 5.3, e: 20.3 },
  { n: '02', he: 'צימוד עצמי של גלואון', en: 'Gluon Self-Coupling', s: 20.6, e: 35.3 },
  { n: '03', he: 'סכום על כל המסלולים', en: 'Sum Over Paths', s: 35.6, e: 50.8 },
  { n: '04', he: 'סופרפוזיציה בזמן', en: 'Superposition in Time', s: 51.0, e: 61.9 },
  { n: '05', he: 'המשרעת הכוללת', en: 'Total Amplitude', s: 62.2, e: 70.5 },
  { n: '06', he: 'התאבכות המשרעות', en: 'Interference of Amplitudes', s: 70.7, e: FY_DUR },
];
function Sections() {
  const t = useTime();
  return SECTIONS.map((s, i) => {
    const op = clamp((t - s.s) / 0.5, 0, 1) * clamp((s.e - t) / 0.5, 0, 1);
    if (op <= 0) return null;
    return <div key={i} style={{ position: 'absolute', top: 32, left: 48, opacity: op, display: 'flex', alignItems: 'center', gap: 11 }}>
      <span style={{ fontFamily: MON, fontSize: 13, color: GOLD, letterSpacing: '0.12em', fontWeight: 700 }}>{s.n}</span>
      <span style={{ width: 22, height: 1, background: 'rgba(255,255,255,0.22)', display: 'inline-block' }} />
      <span style={{ fontFamily: HEB, fontSize: 16, fontWeight: 600, color: 'rgba(244,246,251,0.72)', direction: 'rtl' }}>{s.he}</span>
      <span style={{ fontFamily: MON, fontSize: 11, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.06em' }}>· {s.en}</span>
    </div>;
  });
}

// ── Scene 1: title
function TitleScene() {
  const { localTime, duration } = useSprite();
  let op = 1;
  if (localTime < 0.5) op = Easing.easeOutCubic(localTime / 0.5);
  else if (localTime > duration - 0.6) op = 1 - Easing.easeInCubic((localTime - (duration - 0.6)) / 0.6);
  const pulse = 1 + 0.09 * Math.sin(localTime * 3.4);
  const ph = (localTime * 0.8) % 1;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: op, gap: 30 }}>
      <div style={{ position: 'relative', width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', width: 70, height: 70, borderRadius: '50%', border: `2px solid ${QCOL.red}`, transform: `scale(${1 + 0.5 * ph})`, opacity: 0.5 * (1 - ph) }} />
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: QCOL.red, transform: `scale(${pulse})`, boxShadow: `0 0 34px 10px ${QGLOW.red}` }} />
      </div>
      <div style={{ textAlign: 'center', direction: 'rtl' }}>
        <div style={{ fontFamily: HEB, fontSize: 64, fontWeight: 800, color: '#f4f6fb', letterSpacing: '-0.01em' }}>האינטראקציה החזקה</div>
        <div style={{ fontFamily: HEB, fontSize: 27, fontWeight: 500, color: 'rgba(244,246,251,0.62)', marginTop: 10 }}>סכום על כל המסלולים</div>
      </div>
      <div style={{ fontFamily: MON, fontSize: 15, color: 'rgba(242,193,78,0.85)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>QCD · Feynman Path Integral</div>
    </div>
  );
}

// ── Scene 2: single path with axes + vertex equations
function Axes({ w, h }) {
  const bx = 72, by = h - 64, tx = w - 56, ty = 70;
  return (
    <React.Fragment>
      <svg width={w} height={h} style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
        <line x1={bx} y1={by} x2={tx} y2={by} stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
        <path d={`M ${tx} ${by} l -11 -5.5 l 0 11 z`} fill="rgba(255,255,255,0.32)" />
        <line x1={bx} y1={by} x2={bx} y2={ty} stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
        <path d={`M ${bx} ${ty} l -5.5 11 l 11 0 z`} fill="rgba(255,255,255,0.32)" />
      </svg>
      <div style={{ position: 'absolute', left: tx - 8, top: by + 12, transform: 'translateX(-100%)', fontFamily: MON, fontSize: 13, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', direction: 'rtl' }}>זמן · time →</div>
      <div style={{ position: 'absolute', left: bx - 16, top: ty + 6, transform: 'rotate(-90deg)', transformOrigin: 'top left', fontFamily: MON, fontSize: 13, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', direction: 'rtl' }}>מרחב · space →</div>
    </React.Fragment>
  );
}
function EqCard({ children, x, y, w, op = 1, align = 'right' }) {
  return <div style={{ position: 'absolute', left: x, top: y, width: w, opacity: op, padding: '14px 18px',
    background: 'rgba(12,16,24,0.82)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
    boxShadow: '0 12px 34px rgba(0,0,0,0.4)', direction: 'rtl', textAlign: align,
    transform: `translateY(${(1 - op) * 10}px)` }}>{children}</div>;
}
function SinglePathScene() {
  const t = useTime();
  const reveal = interpolate([6.6, 9.3, 12.4, 15.0, 17.8], [0, 0.26, 0.52, 0.74, 1.0], Easing.easeInOutSine)(t);
  const glow = clamp((t - 18) / 1.2, 0, 1);
  const op = clamp((t - 5.5) / 0.6, 0, 1) * (t > 19.8 ? clamp((20.4 - t) / 0.6, 0, 1) : 1);
  const vCardOp = clamp((t - 9.6) / 0.5, 0, 1) * (t > 19.8 ? clamp((20.4 - t) / 0.5, 0, 1) : 1);
  const mCardOp = clamp((t - 17.6) / 0.5, 0, 1) * (t > 19.8 ? clamp((20.4 - t) / 0.5, 0, 1) : 1);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: op }}>
      <Axes w={1280} h={720} />
      <div style={{ position: 'absolute', left: 1280 * 0.07, top: 720 * 0.58, transform: 'translate(-50%,-180%)', fontFamily: MON, fontSize: 15, color: 'rgba(255,255,255,0.6)', opacity: clamp(reveal * 8, 0, 1) }}>quark</div>
      <div style={{ filter: glow > 0 ? `brightness(${1 + glow * 0.1})` : 'none' }}>
        <FeynmanPath w={1280} h={720} states={['red', 'green', 'red']} gluons={[{ a: 0, b: 1, c: 'r', anti: 'g' }]} reveal={reveal} showLabels big />
      </div>
      <EqCard x={946} y={470} w={300} op={vCardOp}>
        <div style={{ fontFamily: HEB, fontSize: 15, fontWeight: 600, color: 'rgba(244,246,251,0.85)', marginBottom: 8 }}>צומת קווארק–גלואון</div>
        <div style={{ direction: 'ltr', textAlign: 'center' }}><Tex tex={"-\\,i\\,g_s\\,\\gamma^{\\mu}\\,(T^{a})_{ij}"} display size={22} /></div>
        <div style={{ fontFamily: MON, fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 8, direction: 'ltr', textAlign: 'center' }}>
          i = <span style={{ color: QCOL.red }}>r</span> &nbsp;→&nbsp; j = <span style={{ color: QCOL.green }}>g</span>
        </div>
      </EqCard>
      <EqCard x={946} y={622} w={300} op={mCardOp} align="center">
        <div style={{ direction: 'ltr' }}><Tex tex={"\\mathcal{M}_1 \\;\\propto\\; g_s^{2}"} size={20} /></div>
        <div style={{ fontFamily: HEB, fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>שני צמתים → המשרעת ∝ gₛ²</div>
      </EqCard>
    </div>
  );
}

// ── Scene 2 (02): gluon self-coupling, featured
function GluonSplitScene() {
  const t = useTime();
  const reveal = interpolate([22.0, 25.5, 29.0, 32.0], [0, 0.34, 0.66, 1.0], Easing.easeInOutSine)(t);
  const op = clamp((t - 20.7) / 0.6, 0, 1) * (t > 34.8 ? clamp((35.4 - t) / 0.6, 0, 1) : 1);
  const badgeOp = clamp((reveal - 0.5) / 0.2, 0, 1);
  const lagOp = clamp((t - 27.5) / 0.7, 0, 1) * (t > 34.8 ? clamp((35.4 - t) / 0.6, 0, 1) : 1);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: op }}>
      <div style={{ position: 'absolute', left: 0, top: 56, width: 1280, height: 392 }}>
        <FeynmanPath w={1280} h={392} states={['red', 'green', 'red']} gluons={[{ a: 0, b: 1, c: 'r', anti: 'g', split: true }]} reveal={reveal} showLabels big />
      </div>
      {/* 3-gluon vertex badge near the bubble apex */}
      <div style={{ position: 'absolute', left: 640, top: 56 + (392 * 0.58) - 44 - 82 - 26, transform: 'translate(-50%,-100%)', opacity: badgeOp,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
        <div style={{ fontFamily: HEB, fontSize: 14, fontWeight: 600, color: GOLD, whiteSpace: 'nowrap' }}>צומת שלושה־גלואונים</div>
        <div style={{ direction: 'ltr', padding: '4px 10px', borderRadius: 7, background: 'rgba(242,193,78,0.12)', border: '1px solid rgba(242,193,78,0.35)' }}>
          <Tex tex={"\\sim g_s\\,f^{abc}"} size={16} color={GOLD} />
        </div>
      </div>
      {/* Lagrangian card */}
      <div style={{ position: 'absolute', left: '50%', top: 360, transform: `translateX(-50%) translateY(${(1 - lagOp) * 12}px)`, opacity: lagOp,
        width: 880, padding: '18px 26px', background: 'rgba(12,16,24,0.85)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 14, boxShadow: '0 14px 38px rgba(0,0,0,0.45)' }}>
        <div style={{ fontFamily: HEB, fontSize: 15, fontWeight: 600, color: 'rgba(244,246,251,0.8)', direction: 'rtl', marginBottom: 12 }}>צפיפות הלגראנז'יאן של QCD</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <Tex tex={"\\mathcal{L}_{\\mathrm{QCD}}=-\\tfrac14\\,G^{a}_{\\mu\\nu}G^{a\\,\\mu\\nu}+\\bar{\\psi}\\,(i\\gamma^{\\mu}D_{\\mu}-m)\\,\\psi"} display size={21} />
          <Tex tex={"G^{a}_{\\mu\\nu}=\\partial_{\\mu}A^{a}_{\\nu}-\\partial_{\\nu}A^{a}_{\\mu}+\\textcolor{#f2c14e}{g_s\\,f^{abc}A^{b}_{\\mu}A^{c}_{\\nu}}"} display size={20} />
        </div>
        <div style={{ fontFamily: HEB, fontSize: 14.5, color: 'rgba(244,246,251,0.74)', direction: 'rtl', textAlign: 'center', marginTop: 14 }}>
          האיבר המודגש הוא <span style={{ color: GOLD }}>הצימוד העצמי של הגלואונים</span> — תכונה לא־אבלית (SU(3)) שאין לה מקבילה בפוטון
        </div>
      </div>
    </div>
  );
}

// ── path configs
const PATHS = [
  { id: 1, title: ['r', 'g', 'r'], states: ['red', 'green', 'red'], gluons: [{ a: 0, b: 1, c: 'r', anti: 'g' }] },
  { id: 2, title: ['r', 'b', 'r'], states: ['red', 'blue', 'red'], gluons: [{ a: 0, b: 1, c: 'r', anti: 'b' }] },
  { id: 3, title: ['r', 'g', 'r', 'b', 'r'], states: ['red', 'green', 'red', 'blue', 'red'], gluons: [{ a: 0, b: 1, c: 'r', anti: 'g' }, { a: 2, b: 3, c: 'r', anti: 'b' }] },
  { id: 4, title: ['r', 'g', 'r'], badge: 'g→gg', states: ['red', 'green', 'red'], gluons: [{ a: 0, b: 1, c: 'r', anti: 'g', split: true }] },
];
const GRID = [
  { x: 52, y: 116, w: 556, h: 240 }, { x: 672, y: 116, w: 556, h: 240 },
  { x: 52, y: 378, w: 556, h: 240 }, { x: 672, y: 378, w: 556, h: 240 },
];

// ── Scene 03a: announce
function AnnounceScene() {
  const { localTime, duration } = useSprite();
  const p = Easing.easeInOutCubic(clamp(localTime / 1.3, 0, 1));
  const txtOp = clamp(localTime / 0.5, 0, 1) * (localTime > duration - 0.5 ? clamp((duration - localTime) / 0.5, 0, 1) : 1);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {GRID.map((g, i) => (
        <div key={i} style={{ position: 'absolute', left: fyLerp(610, g.x, p), top: fyLerp(344, g.y, p), width: fyLerp(60, g.w, p), height: fyLerp(32, g.h, p), border: '1px solid rgba(255,255,255,0.16)', borderRadius: 14, opacity: 0.16 * p }} />
      ))}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: txtOp, direction: 'rtl', gap: 12 }}>
        <div style={{ fontFamily: HEB, fontSize: 44, fontWeight: 800, color: '#f4f6fb', textAlign: 'center', maxWidth: 1000, lineHeight: 1.25 }}>בעולם הקוונטי — כל ההיסטוריות האפשריות קורות בו-זמנית</div>
        <div style={{ fontFamily: MON, fontSize: 16, color: 'rgba(242,193,78,0.85)', letterSpacing: '0.14em' }}>every possible path happens at once</div>
      </div>
    </div>
  );
}

// ── Scene 03b: 2×2 grid of paths
function PanelCard({ cfg, box, reveal }) {
  const innerW = box.w - 36, innerH = box.h - 56;
  return (
    <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h,
      background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14,
      boxShadow: '0 12px 34px rgba(0,0,0,0.38)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 13, left: 16, display: 'flex', alignItems: 'center', gap: 8, zIndex: 4 }}>
        <span style={{ fontFamily: MON, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>#{cfg.id}</span>
        <span style={{ fontFamily: MON, fontSize: 15, fontWeight: 700, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 3 }}>
          {cfg.title.map((c, k) => <React.Fragment key={k}><span style={{ color: QCOL[NAME[c]] }}>{c}</span>{k < cfg.title.length - 1 && <span style={{ color: 'rgba(255,255,255,0.32)' }}>→</span>}</React.Fragment>)}
        </span>
        {cfg.badge && <span style={{ fontFamily: MON, fontSize: 11, color: GOLD, padding: '2px 7px', borderRadius: 6, background: 'rgba(242,193,78,0.12)', border: '1px solid rgba(242,193,78,0.3)' }}>{cfg.badge}</span>}
      </div>
      <div style={{ position: 'absolute', left: 18, top: 44, width: innerW, height: innerH }}>
        <FeynmanPath w={innerW} h={innerH} states={cfg.states} gluons={cfg.gluons} reveal={reveal} showLabels big={false} />
      </div>
    </div>
  );
}
const REVEAL_WIN = [[39.0, 43.5], [40.0, 44.8], [41.2, 46.4], [42.4, 47.8]];
function GridScene() {
  const t = useTime();
  const op = clamp((t - 38.3) / 0.6, 0, 1) * (t > 50.0 ? clamp((50.8 - t) / 0.8, 0, 1) : 1);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: op }}>
      {PATHS.map((cfg, i) => {
        const win = REVEAL_WIN[i];
        const rev = Easing.easeInOutSine(clamp((t - win[0]) / (win[1] - win[0]), 0, 1));
        return <PanelCard key={cfg.id} cfg={cfg} box={GRID[i]} reveal={rev} />;
      })}
    </div>
  );
}

// ── Scene 04: vertical time-slice — superposition at one instant
const TS = [
  { states: ['red', 'green', 'red'], gluons: [{ a: 0, b: 1, c: 'r', anti: 'g' }], title: ['r', 'g', 'r'] },
  { states: ['red', 'blue', 'red'], gluons: [{ a: 0, b: 1, c: 'r', anti: 'b' }], title: ['r', 'b', 'r'] },
  { states: ['red', 'green', 'red', 'blue', 'red'], gluons: [{ a: 0, b: 1, c: 'r', anti: 'g' }, { a: 2, b: 3, c: 'r', anti: 'b' }], title: ['r', 'g', 'r', 'b', 'r'] },
  { states: ['red', 'green', 'red'], gluons: [{ a: 0, b: 1, c: 'r', anti: 'g', split: true }], title: ['r', 'g', 'r'], badge: 'g→gg' },
];
function TimeSliceScene() {
  const t = useTime();
  const op = clamp((t - 51.0) / 0.6, 0, 1) * (t > 61.0 ? clamp((61.9 - t) / 0.7, 0, 1) : 1);
  const LX = 96, RW = 720, rowH = 80, x0 = LX + 0.07 * RW, xe = LX + 0.93 * RW;
  const rowsTop = [176, 268, 360, 452];
  const f = interpolate([52.5, 57.2, 59.2, 61.9], [0.04, 0.94, 0.47, 0.47], Easing.easeInOutSine)(t);
  const sweepX = x0 + (xe - x0) * f;
  const started = t > 52.3;

  const present = [];
  const markers = rowsTop.map((rt, i) => {
    const col = fpColorAt(TS[i].states, f), my = rt + rowH * 0.58;
    if (!present.includes(col)) present.push(col);
    return { x: sweepX, y: my, col };
  });
  const order = ['red', 'green', 'blue'].filter(c => present.includes(c));

  return (
    <div style={{ position: 'absolute', inset: 0, opacity: op }}>
      <div style={{ position: 'absolute', top: 86, left: 0, width: 1280, textAlign: 'center', direction: 'rtl' }}>
        <div style={{ fontFamily: HEB, fontSize: 30, fontWeight: 700, color: '#f4f6fb' }}>באותה נקודת זמן — החלקיק הוא <span style={{ color: GOLD }}>"גם, וגם, וגם"</span></div>
      </div>
      {TS.map((cfg, i) => (
        <React.Fragment key={i}>
          <div style={{ position: 'absolute', left: LX - 66, top: rowsTop[i] + rowH * 0.5 - 10, width: 60, textAlign: 'right' }}>
            <span style={{ fontFamily: MON, fontSize: 12.5, fontWeight: 700, letterSpacing: '0.03em' }}>
              {cfg.title.map((c, k) => <React.Fragment key={k}><span style={{ color: QCOL[NAME[c]] }}>{c}</span>{k < cfg.title.length - 1 && <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>}</React.Fragment>)}
            </span>
          </div>
          <div style={{ position: 'absolute', left: LX, top: rowsTop[i], width: RW, height: rowH }}>
            <FeynmanPath w={RW} h={rowH} states={cfg.states} gluons={cfg.gluons} reveal={1} showLabels={false} big={false} />
          </div>
        </React.Fragment>
      ))}
      {/* sweep line */}
      {started && <React.Fragment>
        <div style={{ position: 'absolute', left: sweepX, top: 150, width: 2, height: 384, background: 'linear-gradient(to bottom, rgba(242,193,78,0), rgba(242,193,78,0.85), rgba(242,193,78,0))', boxShadow: '0 0 12px 2px rgba(242,193,78,0.5)', transform: 'translateX(-50%)' }} />
        <div style={{ position: 'absolute', left: sweepX, top: 138, transform: 'translateX(-50%)', fontFamily: MON, fontSize: 13, color: GOLD }}>t = t₀</div>
        {markers.map((m, i) => (
          <div key={i} style={{ position: 'absolute', left: m.x, top: m.y, transform: 'translate(-50%,-50%)', width: 22, height: 22, borderRadius: '50%', border: `2px solid ${QCOL[m.col]}`, boxShadow: `0 0 16px 4px ${QGLOW[m.col]}`, background: 'rgba(0,0,0,0.2)' }} />
        ))}
      </React.Fragment>}
      {/* callout */}
      <div style={{ position: 'absolute', left: 872, top: 232, width: 348, padding: '20px 22px', background: 'rgba(12,16,24,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, boxShadow: '0 14px 38px rgba(0,0,0,0.45)', direction: 'rtl', opacity: clamp((t - 53.2) / 0.6, 0, 1) }}>
        <div style={{ fontFamily: HEB, fontSize: 16, fontWeight: 600, color: 'rgba(244,246,251,0.85)', marginBottom: 12 }}>ברגע זמן זה, החלקיק הוא בו-זמנית:</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, direction: 'ltr', marginBottom: 16 }}>
          {order.map((c, i) => <React.Fragment key={c}>
            {i > 0 && <span style={{ fontFamily: MON, fontSize: 24, color: 'rgba(255,255,255,0.45)' }}>+</span>}
            <span style={{ width: 30, height: 30, borderRadius: '50%', background: QCOL[c], boxShadow: `0 0 14px 3px ${QGLOW[c]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MON, fontWeight: 700, fontSize: 16, color: 'rgba(0,0,0,0.55)' }}>{QLET[c]}</span>
          </React.Fragment>)}
        </div>
        <div style={{ direction: 'ltr', textAlign: 'center' }}>
          <Tex tex={"|\\psi\\rangle=\\alpha\\,\\textcolor{#ff5563}{|r\\rangle}+\\beta\\,\\textcolor{#34d399}{|g\\rangle}+\\gamma\\,\\textcolor{#5b9bff}{|b\\rangle}"} display size={18} />
        </div>
        <div style={{ fontFamily: HEB, fontSize: 13.5, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 10 }}>סופרפוזיציה של מצבי הצבע</div>
      </div>
    </div>
  );
}

// ── Scene 05: total amplitude / superposition climax
function ClimaxScene() {
  const t = useTime();
  const op = clamp((t - 62.0) / 0.6, 0, 1) * (t > 69.9 ? clamp((70.6 - t) / 0.6, 0, 1) : 1);
  const rowOp = clamp((t - 62.3) / 0.8, 0, 1);
  const eq1 = clamp((t - 63.8) / 0.9, 0, 1);
  const eq2 = clamp((t - 66.0) / 0.9, 0, 1);
  const cell = { w: 254, h: 132 };
  const xs = [40, 334, 628, 922], plusX = [307, 601, 895];
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: op }}>
      {PATHS.map((cfg, i) => (
        <div key={cfg.id} style={{ position: 'absolute', left: xs[i], top: 130, width: cell.w, height: cell.h, opacity: rowOp, transform: `translateY(${(1 - rowOp) * 12}px)`, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 8, left: 12, fontFamily: MON, fontSize: 11.5, fontWeight: 700, display: 'flex', gap: 2 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', marginRight: 4 }}>𝓜{['₁', '₂', '₃', '₄'][i]}</span>
            {cfg.title.map((c, k) => <React.Fragment key={k}><span style={{ color: QCOL[NAME[c]] }}>{c}</span>{k < cfg.title.length - 1 && <span style={{ color: 'rgba(255,255,255,0.3)' }}>→</span>}</React.Fragment>)}
          </div>
          <div style={{ position: 'absolute', left: 10, top: 30, width: cell.w - 20, height: cell.h - 40 }}>
            <FeynmanPath w={cell.w - 20} h={cell.h - 40} states={cfg.states} gluons={cfg.gluons} reveal={1} showLabels={false} big={false} />
          </div>
        </div>
      ))}
      {plusX.map((x, i) => <div key={i} style={{ position: 'absolute', left: x, top: 196, transform: 'translate(-50%,-50%)', fontFamily: MON, fontSize: 30, fontWeight: 300, color: 'rgba(255,255,255,0.5)', opacity: rowOp }}>+</div>)}

      <div style={{ position: 'absolute', left: 0, right: 0, top: 358, textAlign: 'center', opacity: eq1, transform: `translateY(${(1 - eq1) * 12}px)` }}>
        <Tex tex={"\\mathcal{M}=\\sum_{i}\\mathcal{M}_{i}=\\mathcal{M}_1+\\mathcal{M}_2+\\mathcal{M}_3+\\mathcal{M}_4+\\cdots"} display size={36} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 470, textAlign: 'center', opacity: eq2, transform: `translateY(${(1 - eq2) * 12}px)` }}>
        <Tex tex={"P\\;\\propto\\;|\\mathcal{M}|^{2}=\\Big|\\textstyle\\sum_i \\mathcal{M}_i\\Big|^{2}"} display size={30} color={GOLD} />
        <div style={{ fontFamily: HEB, fontSize: 16, color: 'rgba(244,246,251,0.6)', direction: 'rtl', marginTop: 14 }}>אבל המשרעות הן <span style={{ color: GOLD }}>מספרים מרוכבים</span> — איך בעצם מחברים אותן?</div>
      </div>
    </div>
  );
}

// ── small arrow (line + head) for the phasor sum
function PArrow({ x1, y1, x2, y2, color, w = 2, head = 6, op = 1 }) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const h1x = x2 - head * Math.cos(ang - 0.45), h1y = y2 - head * Math.sin(ang - 0.45);
  const h2x = x2 - head * Math.cos(ang + 0.45), h2y = y2 - head * Math.sin(ang + 0.45);
  return (
    <g opacity={op}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={w} strokeLinecap="round" />
      <path d={`M ${x2} ${y2} L ${h1x} ${h1y} M ${x2} ${y2} L ${h2x} ${h2y}`} stroke={color} strokeWidth={w} strokeLinecap="round" fill="none" />
    </g>
  );
}

// ── Scene 06: interference / Feynman-arrow (Cornu) sum
function PhasorScene() {
  const t = useTime();
  const op = clamp((t - 70.6) / 0.7, 0, 1) * (t > 81.3 ? clamp((82 - t) / 0.6, 0, 1) : 1);
  const O = { x: 612, y: 470 };
  const n = 26, L = 21, k0 = 12.5, c = 0.052, base = 0.62;
  const pts = [{ x: O.x, y: O.y }];
  for (let k = 0; k < n; k++) {
    const th = base + c * (k - k0) * (k - k0);
    const last = pts[pts.length - 1];
    pts.push({ x: last.x + L * Math.cos(th), y: last.y - L * Math.sin(th) });
  }
  const shown = clamp((t - 71.4) / 4.6, 0, 1) * n;
  const ni = Math.floor(shown), frac = shown - ni;
  const kMid = Math.round(k0);
  const arrows = [];
  for (let k = 0; k < Math.min(ni, n); k++) {
    const a = pts[k], b = pts[k + 1];
    const hue = k / n;
    const col = `hsl(${205 + hue * 60}, 70%, ${62 - hue * 6}%)`;
    arrows.push(<PArrow key={k} x1={a.x} y1={a.y} x2={b.x} y2={b.y} color={col} w={2} head={5} op={0.85} />);
  }
  if (ni < n && frac > 0) {
    const a = pts[ni], b = pts[ni + 1];
    const bx = a.x + (b.x - a.x) * frac, by = a.y + (b.y - a.y) * frac;
    arrows.push(<PArrow key="cur" x1={a.x} y1={a.y} x2={bx} y2={by} color="#cfe3ff" w={2.4} head={6} op={1} />);
  }
  const endIdx = Math.min(ni, n);
  const endP = pts[endIdx] || pts[n];
  const resOp = clamp((t - 76.2) / 0.8, 0, 1);
  const eqOp = (s) => clamp((t - s) / 0.8, 0, 1);
  const Eq = ({ tex, he, size = 20, s, gold }) => (
    <div style={{ opacity: eqOp(s), transform: `translateY(${(1 - eqOp(s)) * 10}px)`, marginBottom: 20 }}>
      <div style={{ direction: 'ltr' }}><Tex tex={tex} display size={size} color={gold ? GOLD : '#eef2f9'} /></div>
      <div style={{ fontFamily: HEB, fontSize: 14.5, color: 'rgba(244,246,251,0.6)', direction: 'rtl', marginTop: 5 }}>{he}</div>
    </div>
  );
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: op }}>
      {/* equations column (right, RTL reading) */}
      <div style={{ position: 'absolute', right: 70, top: 150, width: 470, direction: 'rtl', textAlign: 'right' }}>
        <Eq tex={"\\mathcal{M}_i = A_i\\,e^{\\,iS_i/\\hbar}"} he={'כל מסלול תורם "חץ" מרוכב — משרעת ופאזה'} s={77.0} />
        <Eq tex={"\\mathcal{M}=\\sum_i \\mathcal{M}_i"} he={'החצים מתחברים ראש־לזנב במישור המרוכב'} s={78.2} />
        <Eq tex={"P\\;\\propto\\;|\\mathcal{M}|^{2}"} he={'ההסתברות = אורך הסכום בריבוע'} s={79.2} gold />
        <Eq tex={"\\langle f|i\\rangle=\\int\\!\\mathcal{D}\\phi\\;e^{\\,iS/\\hbar}"} he={'וזהו בדיוק אינטגרל המסלולים של פיינמן'} s={80.2} />
      </div>
      {/* complex-plane axes */}
      <svg width="1280" height="720" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <line x1={O.x - 60} y1={O.y} x2={O.x + 200} y2={O.y} stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
        <line x1={O.x} y1={O.y + 70} x2={O.x} y2={O.y - 280} stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
        {arrows}
        {resOp > 0 && <PArrow x1={O.x} y1={O.y} x2={fyLerp(O.x, endP.x, resOp)} y2={fyLerp(O.y, endP.y, resOp)} color={GOLD} w={4} head={13} op={1} />}
      </svg>
      <div style={{ position: 'absolute', left: O.x - 78, top: O.y + 10, fontFamily: MON, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Re</div>
      <div style={{ position: 'absolute', left: O.x + 8, top: O.y - 274, fontFamily: MON, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Im</div>
      {resOp > 0.6 && <div style={{ position: 'absolute', left: fyLerp(O.x, endP.x, 0.5) + 14, top: fyLerp(O.y, endP.y, 0.5) - 6, opacity: clamp((resOp - 0.6) / 0.4, 0, 1) }}>
        <Tex tex={"\\mathcal{M}"} size={24} color={GOLD} />
      </div>}
      {/* annotations on the curve */}
      <div style={{ position: 'absolute', left: pts[kMid].x - 6, top: pts[kMid].y - 64, transform: 'translateX(-50%)', opacity: clamp((t - 74.0) / 0.8, 0, 1) * (shown > k0 ? 1 : 0), textAlign: 'center', direction: 'rtl' }}>
        <div style={{ fontFamily: HEB, fontSize: 13.5, color: 'rgba(244,246,251,0.78)', whiteSpace: 'nowrap' }}>מסלולים סמוכים למסלול הקלאסי</div>
        <div style={{ fontFamily: MON, fontSize: 11, color: GOLD }}>stationary action — בונה</div>
      </div>
      <div style={{ position: 'absolute', left: pts[n].x + 14, top: pts[n].y - 8, opacity: clamp((t - 75.6) / 0.8, 0, 1), direction: 'rtl' }}>
        <div style={{ fontFamily: HEB, fontSize: 12.5, color: 'rgba(244,246,251,0.55)', whiteSpace: 'nowrap' }}>הקצוות מסתלסלים —<br />מסלולים "רחוקים" מתבטלים</div>
      </div>
      {/* closing tagline */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 64, textAlign: 'center', opacity: clamp((t - 80.8) / 0.9, 0, 1), direction: 'rtl' }}>
        <span style={{ fontFamily: HEB, fontSize: 20, fontWeight: 600, color: 'rgba(244,246,251,0.7)' }}>מתוך סכום אינסוף ההיסטוריות — צומחת ההסתברות הפיזיקלית</span>
      </div>
    </div>
  );
}

// ── narration bar (RTL pill, bottom)
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
function NarrationBar() {
  const t = useTime();
  const cap = CAPS.find(c => t >= c.s && t <= c.e);
  if (!cap) return null;
  const op = clamp((t - cap.s) / 0.4, 0, 1) * clamp((cap.e - t) / 0.4, 0, 1);
  return (
    <div style={{ position: 'absolute', left: '50%', bottom: 36, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 26px', borderRadius: 999, background: 'rgba(8,11,18,0.8)', border: '1px solid rgba(255,255,255,0.1)',
      backdropFilter: 'blur(6px)', opacity: op, direction: 'rtl', maxWidth: 1060, boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
      <span style={{ fontFamily: HEB, fontSize: 24, fontWeight: 600, color: '#f4f6fb', whiteSpace: 'nowrap' }}>{cap.he}</span>
      {cap.glu && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 7, background: 'rgba(242,193,78,0.12)', border: '1px solid rgba(242,193,78,0.3)', direction: 'ltr' }}>
        <span style={{ fontFamily: MON, fontSize: 11, color: 'rgba(242,193,78,0.8)' }}>g</span><GLabel c={cap.glu.c} anti={cap.glu.anti} size={15} /></span>}
    </div>
  );
}

// ── root
function FeynmanScenes() {
  return (
    <Stage width={1280} height={720} duration={FY_DUR} persistKey="feynman-qcd"
      background="radial-gradient(120% 100% at 50% 0%, #141c2c 0%, #0a0e16 55%, #06090f 100%)">
      <GridGlow />
      <Sections />
      <Sprite start={0} end={5.4}><TitleScene /></Sprite>
      <Sprite start={5.3} end={20.4}><SinglePathScene /></Sprite>
      <Sprite start={20.5} end={35.4}><GluonSplitScene /></Sprite>
      <Sprite start={35.4} end={38.4}><AnnounceScene /></Sprite>
      <Sprite start={38.2} end={50.9}><GridScene /></Sprite>
      <Sprite start={50.8} end={62.0}><TimeSliceScene /></Sprite>
      <Sprite start={61.8} end={70.7}><ClimaxScene /></Sprite>
      <Sprite start={70.5} end={FY_DUR}><PhasorScene /></Sprite>
      <NarrationBar />
    </Stage>
  );
}
window.FeynmanScenes = FeynmanScenes;
