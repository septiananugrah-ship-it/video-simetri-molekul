// Komponen kecil adegan grup A (hook, title, roadmap, salc, beh2).
import React from 'react';
import {rand} from '../anim';
import {C, FONT} from '../theme';

const PH_COL = {1: C.gold, [-1]: C.violet} as const;

/** Gradien fase (pasang sekali di dalam <Stage>). */
export const PoADefs: React.FC = () => (
  <defs>
    {(
      [
        ['gold', C.gold],
        ['violet', C.violet],
        ['blue', C.blue],
        ['cyan', C.cyan],
      ] as const
    ).map(([k, col]) => (
      <radialGradient key={k} id={`poA-${k}`} cx="40%" cy="36%" r="70%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
        <stop offset="28%" stopColor={col} stopOpacity="0.62" />
        <stop offset="100%" stopColor={col} stopOpacity="0.12" />
      </radialGradient>
    ))}
    <radialGradient id="poA-cloud">
      <stop offset="0%" stopColor={C.cyan} stopOpacity="0.42" />
      <stop offset="45%" stopColor={C.cyan} stopOpacity="0.18" />
      <stop offset="80%" stopColor={C.cyan} stopOpacity="0.05" />
      <stop offset="100%" stopColor={C.cyan} stopOpacity="0" />
    </radialGradient>
  </defs>
);

/**
 * Orbital s 2D berfase. sign: 1 (+, emas), −1 (−, ungu), 0 (belum berfase, biru).
 * `ph` 0..1 = seberapa jauh warna fase sudah muncul (silang-pudar dari biru).
 */
export const PhaseS: React.FC<{x: number; y: number; r: number; sign: 1 | -1; ph?: number; t?: number; opacity?: number; glyph?: number; nucleus?: boolean}> = ({
  x,
  y,
  r,
  sign,
  ph = 1,
  t = 0,
  opacity = 1,
  glyph = 1,
  nucleus = true,
}) => {
  if (opacity <= 0.001) return null;
  const col = PH_COL[sign];
  const br = 1 + 0.025 * Math.sin(t * 2.1 + x * 0.013 + y * 0.007);
  return (
    <g opacity={opacity}>
      {/* biru (belum berfase) */}
      <g opacity={1 - ph}>
        <circle cx={x} cy={y} r={r * br} fill="url(#poA-blue)" stroke={C.blue} strokeWidth={3} strokeOpacity={0.85} />
      </g>
      {/* berfase */}
      <g opacity={ph}>
        <circle cx={x} cy={y} r={r * br + 8} fill="none" stroke={col} strokeWidth={14} strokeOpacity={0.12} />
        <circle cx={x} cy={y} r={r * br} fill={`url(#poA-${sign > 0 ? 'gold' : 'violet'})`} stroke={col} strokeWidth={3} />
        <text
          x={x + r * 0.42}
          y={y - r * 0.42}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily={FONT.sans}
          fontWeight={800}
          fontSize={Math.max(18, r * 0.5)}
          fill={col}
          opacity={glyph}
          style={{paintOrder: 'stroke', stroke: 'rgba(4,6,12,0.85)', strokeWidth: 4}}
        >
          {sign > 0 ? '+' : '−'}
        </text>
      </g>
      {nucleus ? <circle cx={x} cy={y} r={Math.max(4, r * 0.09)} fill={C.ink} /> : null}
    </g>
  );
};

/** Lobus p (r = L cos²θ) dari (x, y) ke arah ang (rad). */
export const lobeD = (x: number, y: number, ang: number, L: number) => {
  const n = 44;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const th = -Math.PI / 2 + (Math.PI * i) / n;
    const r = L * Math.cos(th) ** 2;
    pts.push(`${i ? 'L' : 'M'}${(x + r * Math.cos(ang + th)).toFixed(1)},${(y + r * Math.sin(ang + th)).toFixed(1)}`);
  }
  return pts.join(' ') + ' Z';
};

/** Orbital p 2D berfase: lobus ke arah `ang` = + (emas), lawannya − (ungu). */
export const PhaseP: React.FC<{x: number; y: number; L: number; ang: number; t?: number; opacity?: number; glyph?: number}> = ({x, y, L, ang, t = 0, opacity = 1, glyph = 1}) => {
  if (opacity <= 0.001) return null;
  const br = 1 + 0.025 * Math.sin(t * 2.1 + x * 0.01);
  return (
    <g opacity={opacity}>
      {([1, -1] as const).map((s) => {
        const a = s > 0 ? ang : ang + Math.PI;
        const col = PH_COL[s];
        const gx = x + L * 0.55 * Math.cos(a);
        const gy = y + L * 0.55 * Math.sin(a);
        return (
          <g key={s}>
            <path d={lobeD(x, y, a, L * br)} fill={`url(#poA-${s > 0 ? 'gold' : 'violet'})`} stroke={col} strokeWidth={3} strokeLinejoin="round" />
            <text
              x={gx}
              y={gy}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily={FONT.sans}
              fontWeight={800}
              fontSize={Math.max(18, L * 0.24)}
              fill="#0b0f1c"
              opacity={0.75 * glyph}
            >
              {s > 0 ? '+' : '−'}
            </text>
          </g>
        );
      })}
      <circle cx={x} cy={y} r={5} fill={C.ink} />
    </g>
  );
};

/** Kapsul langkah bernomor (HTML). */
export const StepPill: React.FC<{x: number; y: number; n: string; text: React.ReactNode; color: string; p: number; lit: number; w?: number}> = ({x, y, n, text, color, p, lit, w = 470}) =>
  p <= 0.001 ? null : (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        transform: `translate(0, -50%) translateX(${(1 - p) * -24}px)`,
        opacity: p * (0.5 + 0.5 * lit),
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '14px 22px',
        borderRadius: 20,
        background: 'linear-gradient(160deg, rgba(22,30,58,0.86), rgba(8,11,24,0.86))',
        border: `2px solid ${color}${lit > 0.5 ? 'cc' : '55'}`,
        boxShadow: `0 0 ${10 + 30 * lit}px ${color}33`,
        fontFamily: FONT.sans,
        color: C.ink,
      }}
    >
      <span
        style={{
          flex: '0 0 auto',
          width: 52,
          height: 52,
          borderRadius: 26,
          border: `3px solid ${color}`,
          color,
          fontFamily: FONT.mono,
          fontWeight: 600,
          fontSize: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `${color}${lit > 0.5 ? '33' : '11'}`,
        }}
      >
        {n}
      </span>
      <span style={{fontSize: 27, lineHeight: 1.25}}>{text}</span>
    </div>
  );

/** Awan elektron yang membungkus seluruh molekul (titik-titik berkeliaran + selubung lembut). */
export const MolCloud: React.FC<{cx: number; cy: number; rx: number; ry: number; t: number; p: number; n?: number; color?: string; opacity?: number}> = ({
  cx,
  cy,
  rx,
  ry,
  t,
  p,
  n = 120,
  color = C.cyan,
  opacity = 1,
}) => {
  if (opacity * p <= 0.001) return null;
  const br = 1 + 0.03 * Math.sin(t * 1.4);
  return (
    <g opacity={opacity}>
      <ellipse cx={cx} cy={cy} rx={rx * br * (0.55 + 0.45 * p)} ry={ry * br * (0.55 + 0.45 * p)} fill="url(#poA-cloud)" opacity={p} />
      {Array.from({length: n}, (_, i) => {
        const a0 = rand(i * 3.1) * Math.PI * 2;
        const w = (0.15 + rand(i * 1.7) * 0.4) * (rand(i * 9.3) > 0.5 ? 1 : -1);
        const rr = Math.sqrt(rand(i * 5.9 + 1)) * (0.25 + 0.75 * p);
        const a = a0 + t * w;
        const x = cx + rr * rx * Math.cos(a) * br;
        const y = cy + rr * ry * Math.sin(a) * br;
        const d = rand(i * 7.3);
        const on = Math.max(0, Math.min(1, p * 1.6 - d * 0.6));
        return <circle key={i} cx={x} cy={y} r={1.6 + rand(i * 2.2) * 2.2} fill={color} opacity={(0.3 + 0.3 * Math.sin(t * 2 + i)) * on} />;
      })}
    </g>
  );
};

/** Sinyal PES metana (valensi): pita t₂ ≈ 14 eV (6 e⁻) dan a₁ ≈ 23 eV (2 e⁻); luas ∝ 3 : 1. */
export const CH4_BANDS = [
  {e: 14, s: 0.8, h: 1},
  {e: 23, s: 0.5, h: (1 / 3) * (0.8 / 0.5)},
];
export const ch4Signal = (E: number) => CH4_BANDS.reduce((a, b) => a + b.h * Math.exp(-(((E - b.e) / b.s) ** 2)), 0);
