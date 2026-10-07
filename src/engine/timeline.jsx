import React from 'react';
import { clamp } from './easing.js';

// ── Timeline context ──────────────────────────────────────────────────────────
// The Stage provides { time, duration, playing }. Any descendant can read the
// current playhead with useTime() / useTimeline().

export const TimelineContext = React.createContext({ time: 0, duration: 10, playing: false });

export const useTime = () => React.useContext(TimelineContext).time;
export const useTimeline = () => React.useContext(TimelineContext);

// ── Sprite ────────────────────────────────────────────────────────────────────
// Renders children only when the playhead is inside [start, end]. Provides a
// sub-context with `localTime` (seconds since start) and `progress` (0..1).
//
//   <Sprite start={2} end={5}>
//     {({ localTime, progress }) => <Thing x={progress * 100} />}
//   </Sprite>
//
// Or as a plain wrapper — children can call useSprite() themselves.

export const SpriteContext = React.createContext({ localTime: 0, progress: 0, duration: 0 });
export const useSprite = () => React.useContext(SpriteContext);

export function Sprite({ start = 0, end = Infinity, children, keepMounted = false }) {
  const { time } = useTimeline();
  const visible = time >= start && time <= end;
  if (!visible && !keepMounted) return null;

  const duration = end - start;
  const localTime = Math.max(0, time - start);
  const progress = duration > 0 && isFinite(duration) ? clamp(localTime / duration, 0, 1) : 0;

  const value = { localTime, progress, duration, visible };

  return (
    <SpriteContext.Provider value={value}>
      {typeof children === 'function' ? children(value) : children}
    </SpriteContext.Provider>
  );
}
