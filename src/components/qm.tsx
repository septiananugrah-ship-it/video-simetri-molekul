// Visual khusus Modul 2: warna fase bilangan kompleks, gelombang berwarna fase,
// paket gelombang bebas (analitik), dan titik hasil ukur.
import React from 'react';
import {rand} from '../anim';
import {C, FONT} from '../theme';

/** Warna untuk fase φ (radian): roda warna HSL, 0 = merah-emas. */
export const phaseColor = (phi: number, l = 60) => {
  const h = (((phi * 180) / Math.PI) % 360 + 360 + 40) % 360;
  return `hsl(${h.toFixed(0)},90%,${l}%)`;
};

export type Cx = [number, number]; // [re, im]
export const cabs = (z: Cx) => Math.hypot(z[0], z[1]);
export const carg = (z: Cx) => Math.atan2(z[1], z[0]);
export const cmul = (a: Cx, b: Cx): Cx => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
export const cexp = (phi: number): Cx => [Math.cos(phi), Math.sin(phi)];
export const cadd = (a: Cx, b: Cx): Cx => [a[0] + b[0], a[1] + b[1]];
export const cscale = (a: Cx, s: number): Cx => [a[0] * s, a[1] * s];

/** Paket Gauss bebas (ħ = m = 1): ψ(x,t) analitik, σ lebar awal, k0 momentum. */
export const freePacket = (x: number, t: number, x0 = 0, sigma = 1, k0 = 3): Cx => {
  // ψ = (1+iτ)^(-1/2) exp(-(x-x0-k0 t)²/(2σ²(1+iτ))) exp(i k0 (x - x0 - k0 t/2)), τ = t/σ²
  const tau = t / (sigma * sigma);
  const d = x - x0 - k0 * t;
  const den = 1 + tau * tau;
  // 1/(1+iτ) = (1 - iτ)/den
  const a = (-(d * d) / (2 * sigma * sigma)) / den; // bagian real eksponen
  const b = ((d * d) / (2 * sigma * sigma)) * (tau / den); // bagian imajiner eksponen
  const amp = Math.exp(a) / Math.pow(den, 0.25);
  const phase = b + k0 * (x - x0 - (k0 * t) / 2) - 0.5 * Math.atan(tau);
  return [amp * Math.cos(phase), amp * Math.sin(phase)];
};

/**
 * Gelombang kompleks berwarna fase: batang tipis dari sumbu setinggi |ψ|
 * (atau |ψ|² bila `density`), diwarnai menurut arg ψ.
 */
export const PhaseWave: React.FC<{
  f: (u: number) => Cx;
  x: number;
  y: number;
  w: number;
  sy: number;
  n?: number;
  density?: boolean;
  opacity?: number;
  outline?: boolean;
  mirror?: boolean;
}> = ({f, x, y, w, sy, n = 180, density = false, opacity = 1, outline = true, mirror = false}) => {
  const bw = w / n;
  const bars: React.ReactNode[] = [];
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const z = f(u);
    const m = density ? cabs(z) ** 2 : cabs(z);
    const h = m * sy;
    const px = x + u * w;
    if (i < n) bars.push(<rect key={i} x={px} y={mirror ? y - h : y - h} width={bw + 0.6} height={mirror ? 2 * h : h} fill={phaseColor(carg(z))} />);
    pts.push(`${i ? 'L' : 'M'}${px.toFixed(1)},${(y - h).toFixed(1)}`);
  }
  return (
    <g opacity={opacity}>
      <g opacity={0.85}>{bars}</g>
      {outline ? <path d={pts.join(' ')} fill="none" stroke="#fff" strokeWidth={2.2} opacity={0.8} /> : null}
    </g>
  );
};

/** Roda fase kecil sebagai legenda. */
export const PhaseWheel: React.FC<{x: number; y: number; r?: number; opacity?: number; label?: boolean}> = ({x, y, r = 46, opacity = 1, label = true}) => (
  <g opacity={opacity}>
    {Array.from({length: 36}, (_, k) => {
      const a0 = (k / 36) * Math.PI * 2;
      const a1 = ((k + 1) / 36) * Math.PI * 2 + 0.01;
      const p = (a: number, rr: number) => `${x + rr * Math.cos(a)},${y - rr * Math.sin(a)}`;
      return <path key={k} d={`M${p(a0, r * 0.55)} L${p(a0, r)} A${r},${r} 0 0 0 ${p(a1, r)} L${p(a1, r * 0.55)} A${r * 0.55},${r * 0.55} 0 0 1 ${p(a0, r * 0.55)} Z`} fill={phaseColor(a0 + Math.PI / 36)} />;
    })}
    {label ? (
      <text x={x} y={y + r + 30} textAnchor="middle" fontFamily={FONT.sans} fontSize={22} fill={C.muted}>
        warna = fase
      </text>
    ) : null}
  </g>
);

/** Panah fasor (jarum jam kompleks) di (x,y), panjang r, sudut φ. */
export const Phasor: React.FC<{x: number; y: number; r: number; phi: number; color?: string; opacity?: number; ring?: boolean; width?: number}> = ({
  x,
  y,
  r,
  phi,
  color,
  opacity = 1,
  ring = true,
  width = 4,
}) => {
  const ex = x + r * Math.cos(phi);
  const ey = y - r * Math.sin(phi);
  const col = color ?? phaseColor(phi);
  const hx = Math.cos(phi);
  const hy = -Math.sin(phi);
  const head = Math.min(14, r * 0.35);
  return (
    <g opacity={opacity}>
      {ring ? <circle cx={x} cy={y} r={r} fill="none" stroke={C.faint} strokeWidth={2} /> : null}
      <line x1={x} y1={y} x2={ex - hx * head * 0.6} y2={ey - hy * head * 0.6} stroke={col} strokeWidth={width} strokeLinecap="round" />
      <path
        d={`M${ex},${ey} L${ex - hx * head - hy * head * 0.5},${ey - hy * head + hx * head * 0.5} L${ex - hx * head + hy * head * 0.5},${ey - hy * head - hx * head * 0.5} Z`}
        fill={col}
      />
      <circle cx={x} cy={y} r={4} fill={C.ink} />
    </g>
  );
};

/** Sampel posisi dari rapat peluang ρ(u) pada [0,1] (metode tolak), deterministik. */
const SAMPLE_CACHE = new Map<string, number[]>();
export const sampleRho = (key: string, rho: (u: number) => number, count: number, max: number) => {
  const hit = SAMPLE_CACHE.get(key);
  if (hit && hit.length >= count) return hit;
  const out: number[] = [];
  let k = 0;
  while (out.length < count && k < count * 60) {
    const u = rand(k * 1.731 + key.length * 9.1 + 0.37);
    const q = rand(k * 2.917 + key.length * 3.3 + 0.81);
    k++;
    if (q * max < rho(u)) out.push(u);
  }
  SAMPLE_CACHE.set(key, out);
  return out;
};

/** Pola interferensi dua celah (ternormalisasi maks 1) pada u ∈ [0,1]. */
export const fringe = (u: number) => {
  const x = (u - 0.5) * 2; // -1..1
  const env = Math.exp(-((x / 0.62) ** 2));
  return env * Math.cos(x * Math.PI * 4.5) ** 2;
};
