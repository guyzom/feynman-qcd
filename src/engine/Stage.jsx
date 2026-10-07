import React from 'react';
import { clamp } from './easing.js';
import { TimelineContext } from './timeline.jsx';

// Stage — auto-scaling 16:9 canvas with a transport (play/pause, scrub,
// ←/→ seek, space, 0-to-reset) and a persisted playhead.

export function Stage({
  width = 1280,
  height = 720,
  duration = 10,
  background = '#f6f4ef',
  loop = true,
  autoplay = true,
  persistKey = 'animstage',
  children,
}) {
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new RangeError('Stage duration must be a finite positive number.');
  }

  const [time, setTimeState] = React.useState(() => {
    try {
      const v = Number(localStorage.getItem(persistKey + ':t') || '0');
      return Number.isFinite(v) ? clamp(v, 0, duration) : 0;
    } catch {
      return 0;
    }
  });
  const [playing, setPlaying] = React.useState(autoplay);
  const [hoverTime, setHoverTime] = React.useState(null);
  const [scale, setScale] = React.useState(1);

  const stageRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const lastTsRef = React.useRef(null);
  const timeRef = React.useRef(time);
  const persistedRef = React.useRef(null);
  timeRef.current = time;

  const seek = React.useCallback((value) => {
    setHoverTime(null);
    setTimeState((current) => {
      const next = typeof value === 'function' ? value(current) : value;
      return Number.isFinite(next) ? clamp(next, 0, duration) : current;
    });
  }, [duration]);

  const togglePlayback = React.useCallback(() => {
    setHoverTime(null);
    if (!playing && timeRef.current >= duration) seek(0);
    setPlaying((current) => !current);
  }, [playing, duration, seek]);

  const persist = React.useCallback(() => {
    const key = persistKey + ':t';
    const value = String(timeRef.current);
    if (persistedRef.current?.key === key && persistedRef.current?.value === value) return;
    try {
      localStorage.setItem(key, value);
      persistedRef.current = { key, value };
    } catch {
      // Playback remains available when browser storage is disabled.
    }
  }, [persistKey]);

  // Store at most once per second during playback and flush on pause or exit.
  React.useEffect(() => {
    const interval = window.setInterval(persist, 1000);
    window.addEventListener('pagehide', persist);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('pagehide', persist);
      persist();
    };
  }, [persist]);

  React.useEffect(() => {
    if (!playing) persist();
  }, [time, playing, persist]);

  React.useEffect(() => {
    seek((current) => current);
  }, [seek]);

  // Auto-scale to fit viewport
  React.useEffect(() => {
    if (!stageRef.current) return;
    const el = stageRef.current;
    const measure = () => {
      const barH = 44; // playback bar height
      const s = Math.min(el.clientWidth / width, (el.clientHeight - barH) / height);
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
      const dt = Math.max(0, (ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;
      let next = timeRef.current + dt;
      if (next >= duration) {
        if (loop) next %= duration;
        else {
          timeRef.current = duration;
          setTimeState(duration);
          setPlaying(false);
          rafRef.current = null;
          return;
        }
      }
      timeRef.current = next;
      setTimeState(next);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };
  }, [playing, duration, loop]);

  // Dev-only hook so a headless screenshot harness can freeze an exact frame.
  React.useEffect(() => {
    if (import.meta.env && import.meta.env.DEV) {
      const freeze = (t) => {
        setPlaying(false);
        seek(t);
      };
      window.__seek = freeze;
      return () => {
        if (window.__seek === freeze) delete window.__seek;
      };
    }
  }, [seek]);

  // Keyboard: space = play/pause, ← → = seek, 0/Home = reset
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest('input, textarea, select') || target?.isContentEditable) return;
      if (e.code === 'Space') {
        if (target?.closest('button, a, [role="button"]')) return;
        e.preventDefault();
        if (!e.repeat) togglePlayback();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seek((t) => t - (e.shiftKey ? 1 : 0.1));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seek((t) => t + (e.shiftKey ? 1 : 0.1));
      } else if (e.key === '0' || e.code === 'Home') {
        e.preventDefault();
        seek(0);
      } else if (e.code === 'End') {
        e.preventDefault();
        seek(duration);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [duration, seek, togglePlayback]);

  const displayTime = hoverTime != null ? hoverTime : time;

  const ctxValue = React.useMemo(
    () => ({ time: displayTime, duration, playing, setTime: seek, setPlaying }),
    [displayTime, duration, playing, seek]
  );

  return (
    <div
      ref={stageRef}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: '#0a0a0a',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Canvas area — vertically centered in remaining space */}
      <div
        style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        <div
          style={{
            width,
            height,
            background,
            position: 'relative',
            transform: `scale(${scale})`,
            transformOrigin: 'center',
            flexShrink: 0,
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}
        >
          <TimelineContext.Provider value={ctxValue}>{children}</TimelineContext.Provider>
        </div>
      </div>

      {/* Playback bar — stacked below canvas, never overlapping */}
      <PlaybackBar
        time={displayTime}
        playheadTime={time}
        duration={duration}
        playing={playing}
        onPlayPause={togglePlayback}
        onReset={() => seek(0)}
        onSeek={seek}
        onHover={(t) => setHoverTime(t)}
      />
    </div>
  );
}

// ── Playback bar ──────────────────────────────────────────────────────────────
// Play/pause, return-to-begin, scrub track, time display.
// Uses fixed-width time fields so layout doesn't thrash.

function PlaybackBar({ time, playheadTime, duration, playing, onPlayPause, onReset, onSeek, onHover }) {
  const trackRef = React.useRef(null);
  const dragPointerRef = React.useRef(null);

  const timeFromEvent = React.useCallback(
    (e) => {
      const rect = trackRef.current.getBoundingClientRect();
      if (rect.width <= 0 || !Number.isFinite(e.clientX)) return null;
      const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      return x * duration;
    },
    [duration]
  );

  const onTrackMove = (e) => {
    if (!trackRef.current) return;
    const t = timeFromEvent(e);
    if (t == null) return;
    if (e.pointerId === dragPointerRef.current) onSeek(t);
    else if (e.pointerType === 'mouse' && e.buttons === 0) onHover(t);
  };

  const onTrackLeave = () => {
    if (dragPointerRef.current == null) onHover(null);
  };

  const onTrackDown = (e) => {
    if (e.button !== 0 || dragPointerRef.current != null) return;
    const t = timeFromEvent(e);
    if (t == null) return;
    e.preventDefault();
    e.currentTarget.focus({ preventScroll: true });
    dragPointerRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    onSeek(t);
    onHover(null);
  };

  const onTrackUp = (e) => {
    if (e.pointerId === dragPointerRef.current) {
      const t = timeFromEvent(e);
      if (t != null) onSeek(t);
      dragPointerRef.current = null;
      onHover(null);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    }
  };

  const onTrackCancel = (e) => {
    if (e.pointerId === dragPointerRef.current) {
      dragPointerRef.current = null;
      onHover(null);
    }
  };

  const onTrackKey = (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    let next;
    const step = e.shiftKey ? 1 : 0.1;
    if (e.code === 'ArrowLeft' || e.code === 'ArrowDown') next = playheadTime - step;
    else if (e.code === 'ArrowRight' || e.code === 'ArrowUp') next = playheadTime + step;
    else if (e.code === 'Home') next = 0;
    else if (e.code === 'End') next = duration;
    else return;
    e.preventDefault();
    e.stopPropagation();
    onSeek(next);
  };

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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
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
      }}
    >
      <IconButton onClick={onReset} label="Return to start" title="Return to start (0/Home)">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M3 2v10M12 2L5 7l7 5V2z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </IconButton>
      <IconButton onClick={onPlayPause} label={playing ? 'Pause' : 'Play'} title={playing ? 'Pause (space)' : 'Play (space)'}>
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="3" y="2" width="3" height="10" fill="currentColor" />
            <rect x="8" y="2" width="3" height="10" fill="currentColor" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 2l9 5-9 5V2z" fill="currentColor" />
          </svg>
        )}
      </IconButton>

      {/* Current time: fixed width so it doesn't thrash */}
      <div
        style={{
          fontFamily: mono,
          fontSize: 12,
          fontVariantNumeric: 'tabular-nums',
          width: 64,
          textAlign: 'right',
          color: '#f6f4ef',
        }}
      >
        {fmt(time)}
      </div>

      {/* Scrub track */}
      <div
        ref={trackRef}
        role="slider"
        aria-label="Timeline"
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={playheadTime}
        aria-valuetext={`${fmt(playheadTime)} of ${fmt(duration)}`}
        tabIndex={0}
        onKeyDown={onTrackKey}
        onPointerMove={onTrackMove}
        onPointerLeave={onTrackLeave}
        onPointerDown={onTrackDown}
        onPointerUp={onTrackUp}
        onPointerCancel={onTrackCancel}
        onLostPointerCapture={onTrackCancel}
        style={{
          flex: 1,
          height: 22,
          position: 'relative',
          cursor: 'pointer',
          touchAction: 'none',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 4,
            background: 'rgba(255,255,255,0.12)',
            borderRadius: 2,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: `${pct}%`,
            height: 4,
            background: 'oklch(72% 0.12 250)',
            borderRadius: 2,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `${pct}%`,
            top: '50%',
            width: 12,
            height: 12,
            marginLeft: -6,
            marginTop: -6,
            background: '#fff',
            borderRadius: 6,
            boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
          }}
        />
      </div>

      {/* Duration: fixed width */}
      <div
        style={{
          fontFamily: mono,
          fontSize: 12,
          fontVariantNumeric: 'tabular-nums',
          width: 64,
          textAlign: 'left',
          color: 'rgba(246,244,239,0.55)',
        }}
      >
        {fmt(duration)}
      </div>
    </div>
  );
}

function IconButton({ children, onClick, title, label }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={label}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 28,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
