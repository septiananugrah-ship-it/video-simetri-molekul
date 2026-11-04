import React from 'react';
import {AbsoluteFill, interpolateColors, useCurrentFrame, useVideoConfig} from 'remotion';
import {rand} from '../anim';
import {C, H, MOOD_TINT, W} from '../theme';
import {TIMELINE} from '../timeline.ts';

const BOKEH = Array.from({length: 46}, (_, i) => ({
  x: rand(i * 3.1) * W,
  y: rand(i * 7.7 + 1) * H,
  r: 2 + rand(i * 1.3) * 7,
  depth: 0.2 + rand(i * 5.9) * 0.8,
  speed: 0.15 + rand(i * 2.2) * 0.5,
  phase: rand(i * 9.4) * Math.PI * 2,
  hue: rand(i * 4.4) > 0.72 ? C.gold : C.cyan,
}));

const tintAt = (t: number) => {
  const scenes = TIMELINE.scenes;
  const stops: number[] = [];
  const colors: string[] = [];
  scenes.forEach((s) => {
    stops.push(s.start + 0.01, Math.max(s.start + 0.02, s.end - 1.5));
    colors.push(MOOD_TINT[s.mood], MOOD_TINT[s.mood]);
  });
  return interpolateColors(t, stops, colors);
};

const hexPath = (cx: number, cy: number, r: number) =>
  Array.from({length: 6}, (_, k) => {
    const a = (Math.PI / 3) * k + Math.PI / 6;
    return `${k === 0 ? 'M' : 'L'}${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ') + 'Z';

// Kisi heksagonal halus — penghormatan untuk referensi sarang lebah, dan juga cincin benzena.
const HEX_GRID = (() => {
  const r = 46;
  const dx = Math.sqrt(3) * r;
  const dy = 1.5 * r;
  const parts: string[] = [];
  for (let row = -1; row < H / dy + 2; row++) {
    for (let col = -1; col < W / dx + 2; col++) {
      parts.push(hexPath(col * dx + (row % 2 ? dx / 2 : 0), row * dy, r));
    }
  }
  return parts.join(' ');
})();

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const tint = tintAt(t);
  return (
    <AbsoluteFill style={{backgroundColor: C.bg, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 60% at ${50 + 8 * Math.sin(t * 0.05)}% ${42 + 6 * Math.cos(t * 0.04)}%, ${tint} 0%, ${C.bg2} 45%, ${C.bg} 100%)`,
        }}
      />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="hexfade" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id="hexmask">
            <rect width={W} height={H} fill="url(#hexfade)" />
          </mask>
        </defs>
        <g mask="url(#hexmask)" style={{translate: `${(t * 4) % 80}px ${(t * 2.3) % 69}px`}}>
          <path d={HEX_GRID} fill="none" stroke="#8fb4ff" strokeOpacity={0.045} strokeWidth={1.2} />
        </g>
        {BOKEH.map((b, i) => {
          const x = (b.x + t * 10 * b.speed * b.depth) % (W + 40);
          const y = b.y + Math.sin(t * 0.3 * b.speed + b.phase) * 30 * b.depth;
          const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 0.8 * b.speed + b.phase));
          return <circle key={i} cx={x} cy={y} r={b.r * b.depth} fill={b.hue} opacity={0.05 + 0.18 * b.depth * tw} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

export const Vignette: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 75% at 50% 48%, transparent 55%, rgba(0,0,0,0.72) 100%)'}} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: 0.07, mixBlendMode: 'overlay'}}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 12} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={W} height={H} filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};
