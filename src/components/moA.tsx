// Komponen bersama adegan grup A video orbital molekul (hook, title, roadmap, lcao, bonding).
import React from 'react';
import {rand} from '../anim';
import {C, FONT} from '../theme';
import {rho1s} from './vbB';

/* ------------------------------------------------------------------ */
/* Peta kerapatan |1s_A ± 1s_B|² berwarna (sian = ikatan, merah = antiikatan) */
/* ------------------------------------------------------------------ */

type RGB = [number, number, number];
const MAPS: Record<'cyan' | 'red', [number, RGB][]> = {
  cyan: [
    [0, [6, 9, 22]],
    [0.35, [28, 62, 150]],
    [0.7, [79, 214, 255]],
    [1, [240, 252, 255]],
  ],
  red: [
    [0, [12, 6, 16]],
    [0.35, [120, 24, 52]],
    [0.7, [255, 84, 112]],
    [1, [255, 236, 240]],
  ],
};
const colorAt = (stops: [number, RGB][], v: number): RGB => {
  const s = Math.max(0, Math.min(1, v));
  let i = 0;
  while (i < stops.length - 2 && s > stops[i + 1][0]) i++;
  const [p0, c0] = stops[i];
  const [p1, c1] = stops[i + 1];
  const f = (s - p0) / (p1 - p0);
  return c0.map((c, k) => Math.round(c + (c1[k] - c) * f)) as RGB;
};

const CACHE: Record<string, string> = {};
/** URL gambar kerapatan (x ∈ [−X, X], y ∈ [−Y, Y] dalam a₀), dibuat sekali lewat canvas. */
export const moDensityURL = (sign: 1 | -1, R: number, X: number, Y: number, map: 'cyan' | 'red') => {
  const key = `${sign}-${R}-${X}-${Y}-${map}`;
  if (CACHE[key]) return CACHE[key];
  if (typeof document === 'undefined') return '';
  const W0 = 420;
  const H0 = Math.round((W0 * Y) / X);
  const cv = document.createElement('canvas');
  cv.width = W0;
  cv.height = H0;
  const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(W0, H0);
  const vals = new Float32Array(W0 * H0);
  let max = 0;
  for (let j = 0; j < H0; j++)
    for (let i = 0; i < W0; i++) {
      const v = rho1s(-X + (2 * X * (i + 0.5)) / W0, -Y + (2 * Y * (j + 0.5)) / H0, R, sign);
      vals[j * W0 + i] = v;
      if (v > max) max = v;
    }
  for (let j = 0; j < H0; j++)
    for (let i = 0; i < W0; i++) {
      const c = colorAt(MAPS[map], 0.92 * Math.pow(vals[j * W0 + i] / max, 0.75));
      const u = (2 * (i + 0.5)) / W0 - 1;
      const w = (2 * (j + 0.5)) / H0 - 1;
      const alpha = Math.max(0, Math.min(1, (1.02 - Math.hypot(u, w * 0.9)) / 0.32));
      const o = (j * W0 + i) * 4;
      img.data[o] = c[0];
      img.data[o + 1] = c[1];
      img.data[o + 2] = c[2];
      img.data[o + 3] = Math.round(255 * alpha);
    }
  ctx.putImageData(img, 0, 0);
  CACHE[key] = cv.toDataURL('image/png');
  return CACHE[key];
};

/** Peta kerapatan di (x, y) berukuran w×h, inti bercahaya di ±R/2. */
export const DensityMap: React.FC<{x: number; y: number; w: number; h: number; sign: 1 | -1; opacity?: number; t?: number; R?: number}> = ({x, y, w, h, sign, opacity = 1, t = 0, R = 2}) => {
  if (opacity <= 0.001) return null;
  const X = 4.2;
  const Y = (X * h) / w;
  const url = moDensityURL(sign, R, X, Y, sign > 0 ? 'cyan' : 'red');
  const sx = w / (2 * X);
  const br = 0.92 + 0.08 * Math.sin(t * 1.8);
  return (
    <g opacity={opacity}>
      <image href={url} x={x - (w / 2) * br} y={y - (h / 2) * br} width={w * br} height={h * br} preserveAspectRatio="none" />
      {[-1, 1].map((s) => (
        <g key={s}>
          <circle cx={x + (s * R * sx) / 2} cy={y} r={22} fill="url(#soft-gold)" opacity={0.5} />
          <circle cx={x + (s * R * sx) / 2} cy={y} r={9} fill="#fff1d0" />
        </g>
      ))}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Profil gelombang 1D                                                   */
/* ------------------------------------------------------------------ */

/** Path y = base − amp·f(x) untuk x dari x0 ke x1 (piksel). */
export const wavePath = (f: (x: number) => number, x0: number, x1: number, base: number, amp: number, n = 220) => {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    d += `${i ? 'L' : 'M'}${x.toFixed(1)},${(base - amp * f(x)).toFixed(1)}`;
  }
  return d;
};

/** Daerah terisi antara kurva dan garis dasar. */
export const waveArea = (f: (x: number) => number, x0: number, x1: number, base: number, amp: number, n = 160) =>
  `${wavePath(f, x0, x1, base, amp, n)} L${x1},${base} L${x0},${base} Z`;

/* ------------------------------------------------------------------ */
/* Awan elektron yang terkurung lalu menyebar ke seluruh molekul          */
/* ------------------------------------------------------------------ */

const DOTS = Array.from({length: 110}, (_, i) => {
  const u = 0.04 + 0.92 * rand(i * 2.13 + 0.7);
  const v = 0.04 + 0.92 * rand(i * 5.71 + 1.9);
  return {
    k: i % 2,
    r: -0.5 * Math.log(u * v),
    a: rand(i * 3.3 + 0.2) * Math.PI * 2,
    w: (0.2 + rand(i * 1.7) * 0.45) * (rand(i * 9.9) > 0.5 ? 1 : -1),
    s: 1.6 + rand(i * 9.1) * 2,
    d: rand(i * 4.4 + 3),
    bx: rand(i * 6.6 + 1) * 2 - 1,
    by: rand(i * 8.2 + 5) * 2 - 1,
    f: 0.6 + rand(i * 2.9) * 1.1,
  };
});

/**
 * Awan elektron molekul diatomik. spread 0 = titik terkurung di antara dua inti (sepanjang ikatan),
 * 1 = menyebar membungkus seluruh molekul.
 */
export const SpreadCloud: React.FC<{cx: number; cy: number; half: number; t: number; spread: number; R?: number; opacity?: number; n?: number; color?: string}> = ({
  cx,
  cy,
  half,
  t,
  spread,
  R = 150,
  opacity = 1,
  n = 110,
  color = C.cyan,
}) => {
  if (opacity <= 0.001) return null;
  const br = 1 + 0.03 * Math.sin(t * 1.6);
  return (
    <g opacity={opacity}>
      <ellipse cx={cx} cy={cy} rx={(half + R) * br} ry={R * 0.92 * br} fill="url(#moA-cloud)" opacity={spread} />
      {[-1, 1].map((s) => (
        <circle key={s} cx={cx + s * half} cy={cy} r={R * 0.8 * br} fill="url(#moA-cloud)" opacity={0.7 * spread} />
      ))}
      {DOTS.slice(0, n).map((d, i) => {
        const p = Math.max(0, Math.min(1, (spread * 1.5 - d.d * 0.5) / 1));
        const e = p * p * (3 - 2 * p);
        // terkurung: bolak-balik sepanjang ikatan
        const tx = cx + half * 0.62 * Math.sin(t * d.f + d.a) * (0.4 + 0.6 * Math.abs(d.bx));
        const ty = cy + 14 * d.by + 4 * Math.sin(t * 2.3 + i);
        // bebas: awan di sekitar kedua inti
        const a = d.a + t * d.w;
        const rr = Math.min(1.25, d.r * 0.55) * R * br;
        const fx = cx + (d.k ? half : -half) * 0.85 + rr * Math.cos(a);
        const fy = cy + rr * 0.85 * Math.sin(a);
        const op = (0.35 + 0.3 * Math.sin(t * 2 + i)) * (0.45 + 0.55 * e) * (i < 26 ? 1 : e);
        return <circle key={i} cx={tx + (fx - tx) * e} cy={ty + (fy - ty) * e} r={d.s} fill={color} opacity={op} />;
      })}
    </g>
  );
};

/** Gradien awan (pasang sekali di dalam <Stage>). */
export const MoADefs: React.FC = () => (
  <defs>
    <radialGradient id="moA-cloud">
      <stop offset="0%" stopColor={C.cyan} stopOpacity="0.5" />
      <stop offset="40%" stopColor={C.cyan} stopOpacity="0.2" />
      <stop offset="75%" stopColor={C.cyan} stopOpacity="0.06" />
      <stop offset="100%" stopColor={C.cyan} stopOpacity="0" />
    </radialGradient>
    <radialGradient id="moA-blue">
      <stop offset="0%" stopColor={C.blue} stopOpacity="0.85" />
      <stop offset="45%" stopColor={C.blue} stopOpacity="0.36" />
      <stop offset="100%" stopColor={C.blue} stopOpacity="0" />
    </radialGradient>
    <radialGradient id="moA-nuc" cx="38%" cy="34%" r="70%">
      <stop offset="0%" stopColor="#ffffff" />
      <stop offset="45%" stopColor="#f6d9a8" />
      <stop offset="100%" stopColor="#b8742a" />
    </radialGradient>
  </defs>
);

/** Proton (inti H) bercahaya dengan tanda +. */
export const Proton: React.FC<{x: number; y: number; r?: number; opacity?: number; label?: string}> = ({x, y, r = 16, opacity = 1, label}) => (
  <g opacity={opacity}>
    <circle cx={x} cy={y} r={r * 2.8} fill="url(#soft-gold)" opacity={0.45} />
    <circle cx={x} cy={y} r={r} fill="url(#moA-nuc)" />
    <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.sans} fontWeight={800} fontSize={r * 1.3} fill="#5a3410">
      +
    </text>
    {label ? (
      <text x={x} y={y + r + 34} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.sans} fontWeight={700} fontSize={30} fill={C.gold} style={{paintOrder: 'stroke', stroke: 'rgba(4,6,12,0.85)', strokeWidth: 4}}>
        {label}
      </text>
    ) : null}
  </g>
);

/** Garis putus-putus penghubung pada diagram MO (bergeser pelan). */
export const Connector: React.FC<{x1: number; y1: number; x2: number; y2: number; t: number; opacity?: number; color?: string}> = ({x1, y1, x2, y2, t, opacity = 1, color = C.muted}) =>
  opacity <= 0.001 ? null : (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2.5} strokeDasharray="9 9" strokeDashoffset={-t * 14} opacity={0.75 * opacity} strokeLinecap="round" />
  );
