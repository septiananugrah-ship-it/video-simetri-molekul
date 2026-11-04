import React from 'react';
import {rand} from '../anim';
import {C, FONT} from '../theme';
import {SpinVec} from './grupA';

// Komponen kecil untuk adegan grup A (hook, title, roadmap, lewis, curve).

/** Gradien awan elektron. Pasang sekali di dalam <Stage>. */
export const VbDefs: React.FC = () => (
  <defs>
    <radialGradient id="vbA-cloud">
      <stop offset="0%" stopColor={C.cyan} stopOpacity="0.62" />
      <stop offset="38%" stopColor={C.cyan} stopOpacity="0.26" />
      <stop offset="72%" stopColor={C.cyan} stopOpacity="0.08" />
      <stop offset="100%" stopColor={C.cyan} stopOpacity="0" />
    </radialGradient>
    <radialGradient id="vbA-nuc" cx="38%" cy="34%" r="70%">
      <stop offset="0%" stopColor="#ffffff" />
      <stop offset="45%" stopColor="#f6d9a8" />
      <stop offset="100%" stopColor="#b8742a" />
    </radialGradient>
    <radialGradient id="vbA-flash">
      <stop offset="0%" stopColor="#fff6dc" stopOpacity="0.95" />
      <stop offset="30%" stopColor={C.gold} stopOpacity="0.5" />
      <stop offset="100%" stopColor={C.gold} stopOpacity="0" />
    </radialGradient>
  </defs>
);

/** Inti H (proton) kecil bercahaya. */
export const Nucleus: React.FC<{x: number; y: number; r?: number; opacity?: number}> = ({x, y, r = 11, opacity = 1}) => (
  <g opacity={opacity}>
    <circle cx={x} cy={y} r={r * 2.6} fill="url(#soft-gold)" opacity={0.45} />
    <circle cx={x} cy={y} r={r} fill="url(#vbA-nuc)" />
  </g>
);

/** Titik-titik awan 1s yang berputar pelan (kerapatan ∝ e^(−2r)). */
const cloudDots = (seed: number, n: number) =>
  Array.from({length: n}, (_, i) => {
    const u = 0.04 + 0.92 * rand(seed * 31.7 + i * 2.13);
    const v = 0.04 + 0.92 * rand(seed * 17.3 + i * 5.71);
    const r = -0.5 * Math.log(u * v); // distribusi gamma(2) ≈ r² e^(−2r)
    return {r, a: rand(seed * 7.1 + i * 3.3) * Math.PI * 2, w: 0.15 + rand(i * 1.7 + seed) * 0.35, s: 1.4 + rand(i * 9.1 + seed) * 1.8};
  });
const DOTS_A = cloudDots(1, 70);
const DOTS_B = cloudDots(2, 70);
const DOTS_M = cloudDots(3, 46);

/**
 * Atom H dengan awan elektron sian. R = jari-jari awan (px), spin = 'up' | 'down' | null.
 */
export const HAtom: React.FC<{
  x: number;
  y: number;
  t: number;
  R?: number;
  spin?: 'up' | 'down' | null;
  spinP?: number;
  opacity?: number;
  seed?: 1 | 2;
  label?: string;
}> = ({x, y, t, R = 120, spin = null, spinP = 1, opacity = 1, seed = 1, label}) => {
  const dots = seed === 1 ? DOTS_A : DOTS_B;
  const breathe = 1 + 0.03 * Math.sin(t * 1.7 + seed);
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={R * breathe} fill="url(#vbA-cloud)" />
      {dots.map((d, i) => {
        const a = d.a + t * d.w * (seed === 1 ? 1 : -1);
        const rr = Math.min(1, d.r * 0.42) * R * breathe;
        return <circle key={i} cx={x + rr * Math.cos(a)} cy={y + rr * Math.sin(a)} r={d.s} fill={C.cyan} opacity={0.35 + 0.3 * Math.sin(t * 2 + i)} />;
      })}
      <Nucleus x={x} y={y} />
      {spin ? <SpinVec x1={x + R * 0.42} y1={y + (spin === 'up' ? 34 : -34)} x2={x + R * 0.42} y2={y + (spin === 'up' ? -34 : 34)} color={spin === 'up' ? C.cyan : C.pink} width={5} opacity={spinP} /> : null}
      {label ? (
        <text x={x} y={y - R - 18} textAnchor="middle" fontFamily={FONT.sans} fontWeight={600} fontSize={26} fill={C.muted}>
          {label}
        </text>
      ) : null}
    </g>
  );
};

/**
 * Dua atom H yang mendekat dan awannya menyatu (merge 0..1).
 * x1, x2 = posisi inti; jarak kecil + merge → awan berbentuk kacang (kerapatan menumpuk di antara inti).
 */
export const H2Pair: React.FC<{
  x1: number;
  x2: number;
  y: number;
  t: number;
  R?: number;
  merge: number;
  spinP?: number;
  opacity?: number;
  scale?: number;
}> = ({x1, x2, y, t, R = 120, merge, spinP = 1, opacity = 1, scale = 1}) => {
  const cx = (x1 + x2) / 2;
  const half = Math.abs(x2 - x1) / 2;
  const breathe = 1 + 0.03 * Math.sin(t * 1.7);
  // panah spin: dari samping masing-masing inti → berpasangan di tengah
  const sA = {x: x1 + R * 0.42 * (1 - merge) + (cx - 16 - x1) * merge};
  const sB = {x: x2 + R * 0.42 * (1 - merge) + (cx + 16 - x2) * merge};
  return (
    <g opacity={opacity} transform={`translate(${cx} ${y}) scale(${scale}) translate(${-cx} ${-y})`}>
      {[x1, x2].map((x, k) => (
        <circle key={k} cx={x} cy={y} r={R * breathe} fill="url(#vbA-cloud)" />
      ))}
      {/* kerapatan tambahan di antara inti */}
      <ellipse cx={cx} cy={y} rx={(half + R * 0.55) * breathe} ry={R * 0.62 * breathe} fill="url(#vbA-cloud)" opacity={merge} />
      {[DOTS_A, DOTS_B].map((dots, k) =>
        dots.map((d, i) => {
          const a = d.a + t * d.w * (k ? -1 : 1);
          const rr = Math.min(1, d.r * 0.42) * R * breathe;
          const x = (k ? x2 : x1) + rr * Math.cos(a);
          return <circle key={`${k}-${i}`} cx={x} cy={y + rr * Math.sin(a)} r={d.s} fill={C.cyan} opacity={0.35 + 0.3 * Math.sin(t * 2 + i + k)} />;
        }),
      )}
      {DOTS_M.map((d, i) => {
        const a = d.a + t * d.w;
        const rr = Math.min(1, d.r * 0.5);
        return (
          <circle
            key={`m${i}`}
            cx={cx + rr * (half + R * 0.3) * Math.cos(a)}
            cy={y + rr * R * 0.45 * Math.sin(a)}
            r={d.s}
            fill={C.cyan}
            opacity={merge * (0.45 + 0.3 * Math.sin(t * 2.3 + i))}
          />
        );
      })}
      <Nucleus x={x1} y={y} />
      <Nucleus x={x2} y={y} />
      <SpinVec x1={sA.x} y1={y + 34} x2={sA.x} y2={y - 34} color={C.cyan} width={5} opacity={spinP} />
      <SpinVec x1={sB.x} y1={y - 34} x2={sB.x} y2={y + 34} color={C.pink} width={5} opacity={spinP} />
    </g>
  );
};

/** Potensial Morse H₂ (eV) sebagai fungsi R (pm): Dₑ = 4,75 eV, Rₑ = 74 pm, a = 1,94 Å⁻¹. */
export const DE = 4.75;
export const RE = 74;
export const A_M = 0.0194; // pm⁻¹
export const morse = (R: number) => DE * (1 - Math.exp(-A_M * (R - RE))) ** 2 - DE;

/**
 * Teks yang "ditulis tangan": garis tepi tergambar (dash) lalu isi memudar masuk.
 * p = 0..1.
 */
export const WriteText: React.FC<{
  x: number;
  y: number;
  p: number;
  children: React.ReactNode;
  size?: number;
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
  font?: 'sans' | 'serif' | 'mono';
  weight?: number;
  opacity?: number;
}> = ({x, y, p, children, size = 90, color = C.ink, anchor = 'middle', font = 'sans', weight = 500, opacity = 1}) => {
  if (p <= 0) return null;
  const L = 600;
  const stroke = Math.min(1, p / 0.75);
  const fill = Math.max(0, (p - 0.45) / 0.55);
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="central"
      fontFamily={FONT[font]}
      fontWeight={weight}
      fontSize={size}
      fill={color}
      fillOpacity={fill}
      stroke={color}
      strokeWidth={2.2}
      strokeOpacity={0.9 * (1 - 0.6 * fill)}
      strokeDasharray={`${L} ${L}`}
      strokeDashoffset={L * (1 - stroke)}
      opacity={opacity}
    >
      {children}
    </text>
  );
};
