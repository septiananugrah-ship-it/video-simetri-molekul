import React from 'react';
import {C, FONT} from '../theme';

// Komponen grup B (heitler, exchange, spinpair, ionic, overlap).

/** Kurva Morse (eV): nol di R → ∞, minimum −De di Re. */
export const morse = (R: number, De: number, Re: number, a: number) => De * (1 - Math.exp(-a * (R - Re))) ** 2 - De;

/** Elektron bernomor (bola sian bercahaya). */
export const EDot: React.FC<{x: number; y: number; n?: React.ReactNode; r?: number; color?: string; opacity?: number}> = ({x, y, n, r = 17, color = C.cyan, opacity = 1}) =>
  opacity <= 0.001 ? null : (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r * 2.6} fill="url(#soft-cyan)" opacity={0.55} />
      <circle cx={x} cy={y} r={r} fill={color} />
      <circle cx={x - r * 0.32} cy={y - r * 0.32} r={r * 0.32} fill="#fff" opacity={0.6} />
      {n !== undefined ? (
        <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.sans} fontWeight={800} fontSize={r * 1.15} fill="#03202c">
          {n}
        </text>
      ) : null}
    </g>
  );

/** Bingkai grafik sederhana: sumbu kiri & bawah dengan judul sumbu. */
export const PlotFrame: React.FC<{x: number; y: number; w: number; h: number; opacity?: number; xlabel?: React.ReactNode; ylabel?: React.ReactNode; zeroY?: number}> = ({
  x,
  y,
  w,
  h,
  opacity = 1,
  xlabel,
  ylabel,
  zeroY,
}) => (
  <g opacity={opacity}>
    <path d={`M${x},${y} L${x},${y + h} L${x + w},${y + h}`} fill="none" stroke={C.muted} strokeWidth={3} strokeLinecap="round" />
    <path d={`M${x - 9},${y + 14} L${x},${y} L${x + 9},${y + 14}`} fill="none" stroke={C.muted} strokeWidth={3} strokeLinejoin="round" />
    <path d={`M${x + w - 14},${y + h - 9} L${x + w},${y + h} L${x + w - 14},${y + h + 9}`} fill="none" stroke={C.muted} strokeWidth={3} strokeLinejoin="round" />
    {zeroY !== undefined ? <line x1={x} y1={zeroY} x2={x + w} y2={zeroY} stroke={C.faint} strokeWidth={2} strokeDasharray="8 8" /> : null}
    {xlabel ? (
      <text x={x + w} y={y + h + 34} textAnchor="end" dominantBaseline="central" fontFamily={FONT.sans} fontSize={24} fill={C.muted}>
        {xlabel}
      </text>
    ) : null}
    {ylabel ? (
      <text x={x + 16} y={y + 6} textAnchor="start" dominantBaseline="central" fontFamily={FONT.sans} fontSize={24} fill={C.muted}>
        {ylabel}
      </text>
    ) : null}
  </g>
);

/* ------------------------------------------------------------------ */
/* Peta kerapatan |1s_A ± 1s_B|² (canvas sekali → <image>)               */
/* ------------------------------------------------------------------ */

/** Kerapatan satu elektron dalam satuan a₀ (inti di ±R/2 pada sumbu x). */
export const rho1s = (x: number, y: number, R: number, sign: 1 | -1) => {
  const a = Math.exp(-Math.hypot(x + R / 2, y)) / Math.sqrt(Math.PI);
  const b = Math.exp(-Math.hypot(x - R / 2, y)) / Math.sqrt(Math.PI);
  const S = Math.exp(-R) * (1 + R + (R * R) / 3);
  return (a + sign * b) ** 2 / (2 * (1 + sign * S));
};
/** Kerapatan tanpa pertukaran: rata-rata dua atom terpisah. */
export const rhoAtoms = (x: number, y: number, R: number) => {
  const a = Math.exp(-2 * Math.hypot(x + R / 2, y)) / Math.PI;
  const b = Math.exp(-2 * Math.hypot(x - R / 2, y)) / Math.PI;
  return (a + b) / 2;
};

const DENS: Record<string, string> = {};
const cyanMap = (v: number): [number, number, number] => {
  const s = Math.max(0, Math.min(1, v));
  const stops: [number, [number, number, number]][] = [
    [0, [6, 9, 22]],
    [0.35, [28, 62, 150]],
    [0.7, [79, 214, 255]],
    [1, [240, 252, 255]],
  ];
  let i = 0;
  while (i < stops.length - 2 && s > stops[i + 1][0]) i++;
  const [p0, c0] = stops[i];
  const [p1, c1] = stops[i + 1];
  const f = (s - p0) / (p1 - p0);
  return c0.map((c, k) => Math.round(c + (c1[k] - c) * f)) as [number, number, number];
};

/** URL gambar peta kerapatan (domain x ∈ [−X, X], y ∈ [−Y, Y] dalam a₀). */
export const densityURL = (sign: 1 | -1, R: number, X: number, Y: number) => {
  const key = `${sign}-${R}-${X}-${Y}`;
  if (DENS[key]) return DENS[key];
  if (typeof document === 'undefined') return '';
  const W0 = 440;
  const H0 = Math.round((W0 * Y) / X);
  const cv = document.createElement('canvas');
  cv.width = W0;
  cv.height = H0;
  const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(W0, H0);
  let max = 0;
  const vals = new Float32Array(W0 * H0);
  for (let j = 0; j < H0; j++)
    for (let i = 0; i < W0; i++) {
      const x = -X + (2 * X * (i + 0.5)) / W0;
      const y = -Y + (2 * Y * (j + 0.5)) / H0;
      const v = rho1s(x, y, R, sign);
      vals[j * W0 + i] = v;
      if (v > max) max = v;
    }
  for (let j = 0; j < H0; j++)
    for (let i = 0; i < W0; i++) {
      const v = 0.92 * Math.pow(vals[j * W0 + i] / max, 0.8);
      const c = cyanMap(v);
      const u = (2 * (i + 0.5)) / W0 - 1;
      const w = (2 * (j + 0.5)) / H0 - 1;
      // tepi memudar (elips) agar tidak ada bingkai keras
      const e = Math.hypot(u, w * 0.9);
      const alpha = Math.max(0, Math.min(1, (1.02 - e) / 0.32));
      const o = (j * W0 + i) * 4;
      img.data[o] = c[0];
      img.data[o + 1] = c[1];
      img.data[o + 2] = c[2];
      img.data[o + 3] = Math.round(255 * alpha);
    }
  ctx.putImageData(img, 0, 0);
  DENS[key] = cv.toDataURL('image/png');
  return DENS[key];
};

/* ------------------------------------------------------------------ */
/* Orbital 2D: s (lingkaran) & p (dua lobus cos²θ)                        */
/* ------------------------------------------------------------------ */

export type Orb = {kind: 's' | 'p'; x: number; y: number; ang?: number; size: number};

/** Path satu lobus p (r = L cos²θ) dari inti ke arah sudut ang (rad). */
const lobePath = (x: number, y: number, ang: number, L: number) => {
  const pts: string[] = [];
  const n = 48;
  for (let i = 0; i <= n; i++) {
    const th = -Math.PI / 2 + (Math.PI * i) / n;
    const r = L * Math.cos(th) ** 2;
    const px = x + r * Math.cos(ang + th);
    const py = y + r * Math.sin(ang + th);
    pts.push(`${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`);
  }
  return pts.join(' ') + ' Z';
};

/** Path seluruh orbital (s: lingkaran; p: dua lobus). */
export const orbPath = (o: Orb) => {
  if (o.kind === 's') {
    const r = o.size;
    return `M${o.x - r},${o.y} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0 Z`;
  }
  const a = o.ang ?? 0;
  return `${lobePath(o.x, o.y, a, o.size)} ${lobePath(o.x, o.y, a + Math.PI, o.size)}`;
};

/** Apakah titik (px, py) di dalam orbital o. */
export const insideOrb = (o: Orb, px: number, py: number) => {
  const dx = px - o.x;
  const dy = py - o.y;
  const r = Math.hypot(dx, dy);
  if (o.kind === 's') return r <= o.size;
  const a = o.ang ?? 0;
  const c = (dx * Math.cos(a) + dy * Math.sin(a)) / (r || 1);
  return r <= o.size * c * c;
};

/** Luas irisan dua orbital (px²), sampel grid. */
export const overlapArea = (A: Orb, B: Orb, step = 4) => {
  const ext = (o: Orb) => o.size;
  const x0 = Math.max(A.x - ext(A), B.x - ext(B));
  const x1 = Math.min(A.x + ext(A), B.x + ext(B));
  const y0 = Math.max(A.y - ext(A), B.y - ext(B));
  const y1 = Math.min(A.y + ext(A), B.y + ext(B));
  if (x1 <= x0 || y1 <= y0) return 0;
  let n = 0;
  for (let x = x0 + step / 2; x < x1; x += step) for (let y = y0 + step / 2; y < y1; y += step) if (insideOrb(A, x, y) && insideOrb(B, x, y)) n++;
  return n * step * step;
};

/** Gambar orbital: s biru, p lobus emas (+) / ungu (−). flip menukar fase p. */
export const OrbShape: React.FC<{o: Orb; opacity?: number; flip?: boolean; t?: number}> = ({o, opacity = 1, flip, t = 0}) => {
  if (opacity <= 0.001) return null;
  const shimmer = 0.9 + 0.1 * Math.sin(t * 2.2 + o.x * 0.01);
  if (o.kind === 's') {
    return (
      <g opacity={opacity}>
        <circle cx={o.x} cy={o.y} r={o.size} fill={C.blue} fillOpacity={0.22 * shimmer} stroke={C.blue} strokeWidth={3} strokeOpacity={0.9} />
        <circle cx={o.x} cy={o.y} r={o.size * 0.62} fill={C.blue} fillOpacity={0.16} />
        <circle cx={o.x} cy={o.y} r={o.size * 0.3} fill={C.blue} fillOpacity={0.18} />
        <circle cx={o.x} cy={o.y} r={6} fill={C.ink} />
      </g>
    );
  }
  const a = o.ang ?? 0;
  const c1 = flip ? C.violet : C.gold;
  const c2 = flip ? C.gold : C.violet;
  return (
    <g opacity={opacity}>
      <path d={lobePath(o.x, o.y, a, o.size)} fill={c1} fillOpacity={0.24 * shimmer} stroke={c1} strokeWidth={3} strokeLinejoin="round" />
      <path d={lobePath(o.x, o.y, a, o.size * 0.62)} fill={c1} fillOpacity={0.16} />
      <path d={lobePath(o.x, o.y, a + Math.PI, o.size)} fill={c2} fillOpacity={0.24 * shimmer} stroke={c2} strokeWidth={3} strokeLinejoin="round" />
      <path d={lobePath(o.x, o.y, a + Math.PI, o.size * 0.62)} fill={c2} fillOpacity={0.16} />
      <circle cx={o.x} cy={o.y} r={6} fill={C.ink} />
    </g>
  );
};

/** Daerah irisan dua orbital yang menyala (clipPath orbital A, isi orbital B). */
export const OverlapGlow: React.FC<{id: string; A: Orb; B: Orb; color: string; opacity?: number; pulse?: number}> = ({id, A, B, color, opacity = 1, pulse = 1}) =>
  opacity <= 0.001 ? null : (
    <g opacity={opacity}>
      <clipPath id={id}>
        <path d={orbPath(A)} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <path d={orbPath(B)} fill={color} fillOpacity={0.55 + 0.3 * pulse} />
        <path d={orbPath(B)} fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={4} />
      </g>
    </g>
  );

/** Batang horizontal berlabel (0..1). */
export const HBar: React.FC<{x: number; y: number; w: number; v: number; color: string; h?: number; opacity?: number; label?: React.ReactNode; value?: React.ReactNode}> = ({
  x,
  y,
  w,
  v,
  color,
  h = 26,
  opacity = 1,
  label,
  value,
}) =>
  opacity <= 0.001 ? null : (
    <g opacity={opacity}>
      <rect x={x} y={y - h / 2} width={w} height={h} rx={h / 2} fill="rgba(20,28,56,0.9)" stroke={C.faint} strokeWidth={2} />
      <rect x={x} y={y - h / 2} width={Math.max(h, w * Math.max(0, Math.min(1, v)))} height={h} rx={h / 2} fill={color} opacity={0.9 * Math.min(1, v * 40)} />
      {label ? (
        <text x={x - 18} y={y} textAnchor="end" dominantBaseline="central" fontFamily={FONT.sans} fontSize={26} fill={C.ink}>
          {label}
        </text>
      ) : null}
      {value ? (
        <text x={x + w + 18} y={y} textAnchor="start" dominantBaseline="central" fontFamily={FONT.mono} fontSize={24} fill={color}>
          {value}
        </text>
      ) : null}
    </g>
  );
