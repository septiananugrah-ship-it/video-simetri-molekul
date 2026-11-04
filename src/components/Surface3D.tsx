import React from 'react';
import {C} from '../theme';

/** Fungsi Bessel J₀ (deret pangkat; cukup akurat untuk x ≲ 14). */
export const J0 = (x: number) => {
  const q = (x * x) / 4;
  let term = 1;
  let sum = 1;
  for (let m = 1; m < 45; m++) {
    term *= -q / (m * m);
    sum += term;
    if (Math.abs(term) < 1e-12) break;
  }
  return sum;
};

type HMap = {rows: number; cols: number; h: Float32Array};
const CACHE: Record<string, HMap> = {};
/** Peta tinggi pada kisi u,v ∈ [−1, 1] (di-cache per kunci). */
export const heightMap = (key: string, rows: number, cols: number, f: (u: number, v: number) => number): HMap => {
  const k = `${key}-${rows}-${cols}`;
  if (CACHE[k]) return CACHE[k];
  const h = new Float32Array(rows * cols);
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) h[r * cols + c] = f(-1 + (2 * c) / (cols - 1), -1 + (2 * r) / (rows - 1));
  CACHE[k] = {rows, cols, h};
  return CACHE[k];
};

/**
 * Permukaan 3D bergaya pita baris (hidden-line): baris belakang digambar dulu, tiap pita
 * diisi warna gelap sehingga menutupi baris di belakangnya.
 * reveal: 0..1 — baris yang sudah "dipindai" (dari belakang ke depan); sisanya datar & redup.
 */
export const Surface3D: React.FC<{
  map: HMap;
  cx: number;
  cy: number;
  w: number;
  depth: number;
  hz: number;
  tilt?: number;
  reveal?: number;
  opacity?: number;
  pulse?: (u: number, v: number) => number;
  gradId: string;
  colors?: [string, string, string];
  base?: number;
  stroke?: number;
}> = ({map, cx, cy, w, depth, hz, tilt = 0.18, reveal = 1, opacity = 1, pulse, gradId, colors = [C.violet, C.amber, '#fff2c8'], base = -0.15, stroke = 2.2}) => {
  if (opacity <= 0) return null;
  const {rows, cols, h} = map;
  const out: React.ReactNode[] = [];
  const nRev = reveal * rows;
  const proj = (u: number, v: number, z: number): [number, number] => {
    // v = −1 di belakang (atas layar), v = +1 di depan; perspektif ringan
    const s = 0.78 + 0.22 * ((v + 1) / 2);
    return [cx + u * (w / 2) * s + v * w * tilt * 0.15, cy + v * (depth / 2) - z * hz * s];
  };
  for (let r = 0; r < rows; r++) {
    const v = -1 + (2 * r) / (rows - 1);
    const done = rows - 1 - r < nRev; // pindai dari belakang (r kecil) — r besar = depan
    const k = done ? 1 : 0;
    const pts: string[] = [];
    for (let c = 0; c < cols; c++) {
      const u = -1 + (2 * c) / (cols - 1);
      const z = (h[r * cols + c] + (pulse ? pulse(u, v) : 0)) * k;
      const [X, Y] = proj(u, v, z);
      pts.push(`${X.toFixed(1)},${Y.toFixed(1)}`);
    }
    const [bx0, by0] = proj(-1, v, base);
    const [bx1, by1] = proj(1, v, base);
    const d = `M${pts.join(' L')} L${bx1.toFixed(1)},${by1.toFixed(1)} L${bx0.toFixed(1)},${by0.toFixed(1)} Z`;
    out.push(<path key={r} d={d} fill="#060914" stroke={done ? `url(#${gradId})` : C.faint} strokeWidth={done ? stroke : 1} strokeOpacity={done ? 1 : 0.4} />);
  }
  const [, yTop] = proj(0, -1, Math.sign(hz || 1) * 1.2);
  const [, yBot] = proj(0, 1, Math.sign(hz || 1) * base);
  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1={0} y1={yBot} x2={0} y2={yTop}>
          <stop offset="0%" stopColor={colors[0]} />
          <stop offset="55%" stopColor={colors[1]} />
          <stop offset="100%" stopColor={colors[2]} />
        </linearGradient>
      </defs>
      {out}
    </g>
  );
};

/** Warna permukaan menurut tinggi: biru (−) → gelap (0) → emas (+). */
const meshColor = (z: number) => {
  const a = Math.max(-1, Math.min(1, z));
  const lerp = (p: number[], q: number[], f: number) => p.map((x, i) => Math.round(x + (q[i] - x) * f));
  const c = a >= 0 ? lerp([24, 30, 64], [255, 194, 74], a) : lerp([24, 30, 64], [79, 214, 255], -a);
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

/**
 * Permukaan 3D z = f(u, v)·amp berupa mesh segiempat terisi warna (algoritme pelukis:
 * baris belakang lebih dulu). yaw memutar kisi di bidang u-v.
 */
export const Mesh3D: React.FC<{
  f: (u: number, v: number) => number;
  n?: number;
  cx: number;
  cy: number;
  size: number;
  amp: number;
  yaw?: number;
  pitch?: number;
  opacity?: number;
}> = ({f, n = 30, cx, cy, size, amp, yaw = 0.6, pitch = 0.95, opacity = 1}) => {
  if (opacity <= 0) return null;
  const cyw = Math.cos(yaw);
  const syw = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const P: {X: number; Y: number; d: number; z: number}[] = [];
  for (let j = 0; j <= n; j++)
    for (let i = 0; i <= n; i++) {
      const u = -1 + (2 * i) / n;
      const v = -1 + (2 * j) / n;
      const z = f(u, v);
      const x1 = u * cyw - v * syw;
      const y1 = u * syw + v * cyw; // kedalaman di bidang
      const Y = -(z * amp) / size * cp + y1 * sp; // kemiringan kamera
      const d = y1 * cp + ((z * amp) / size) * sp;
      P.push({X: cx + x1 * size, Y: cy + Y * size, d, z});
    }
  const quads: {d: number; path: string; z: number}[] = [];
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const a = P[j * (n + 1) + i];
      const b = P[j * (n + 1) + i + 1];
      const c = P[(j + 1) * (n + 1) + i + 1];
      const e = P[(j + 1) * (n + 1) + i];
      quads.push({
        d: (a.d + b.d + c.d + e.d) / 4,
        z: (a.z + b.z + c.z + e.z) / 4,
        path: `M${a.X.toFixed(1)},${a.Y.toFixed(1)}L${b.X.toFixed(1)},${b.Y.toFixed(1)}L${c.X.toFixed(1)},${c.Y.toFixed(1)}L${e.X.toFixed(1)},${e.Y.toFixed(1)}Z`,
      });
    }
  quads.sort((p, q) => p.d - q.d);
  return (
    <g opacity={opacity}>
      {quads.map((q, k) => (
        <path key={k} d={q.path} fill={meshColor(q.z)} stroke="#0b1022" strokeWidth={0.8} strokeOpacity={0.55} />
      ))}
    </g>
  );
};
