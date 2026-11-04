// Komponen grup C (flowchart, gallery, table, overlap): molekul 3D generik + geometri galeri grup titik.
// Sumbu dunia mengikuti vbC: x kanan, y menjauh, z atas; 1 satuan ≈ 100 pm. Pitch negatif = kamera dari atas.
import React from 'react';
import {C, FONT} from '../theme';
import {add, bond, mul, norm, proj, pyramid, sub, TETRA, type Cam, type Item, type V3} from './vbC';

/* ------------------------------------------------------------------ */
/* Warna atom (CPK) dan gradien.                                        */
/* ------------------------------------------------------------------ */
const EL_COL: Record<string, string> = {
  H: '#f2f5ff',
  C: '#59627a',
  N: '#4f7dff',
  O: '#ff4d63',
  F: '#a8ec6a',
  S: '#ffd84a',
  Cl: '#2fc46e',
  Br: '#b0343f',
  B: '#ffab8a',
};
const EL_R: Record<string, number> = {H: 0.24, C: 0.34, N: 0.34, O: 0.34, F: 0.32, S: 0.42, Cl: 0.4, Br: 0.43, B: 0.34};
const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v + (amt > 0 ? (255 - v) * amt : v * amt))));
  return `rgb(${ch((n >> 16) & 255)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
};

/** Gradien atom grup C (pasang sekali di dalam <Stage>). */
export const SyDefs: React.FC = () => (
  <defs>
    {Object.entries(EL_COL).map(([k, col]) => (
      <radialGradient key={k} id={`sy-ball-${k}`} cx="36%" cy="32%" r="72%">
        <stop offset="0%" stopColor={shade(col, 0.8)} />
        <stop offset="30%" stopColor={shade(col, 0.2)} />
        <stop offset="72%" stopColor={col} />
        <stop offset="100%" stopColor={shade(col, -0.65)} />
      </radialGradient>
    ))}
  </defs>
);

/** Atom bola (warna CPK grup C). */
export const sBall = (cam: Cam, o: {pos: V3; el: string; rs?: number; label?: string | null; opacity?: number; ring?: string; ringP?: number}): Item | null => {
  const op = o.opacity ?? 1;
  if (op <= 0.005) return null;
  const p = proj(o.pos, cam);
  const rr = (EL_R[o.el] ?? 0.34) * (o.rs ?? 1);
  const R = rr * cam.s * p.f;
  const el = o.el in EL_COL ? o.el : 'C';
  const text = o.label === undefined ? (el === 'C' || el === 'H' ? null : el) : o.label;
  const dark = el === 'H' || el === 'F' || el === 'S' || el === 'B';
  return {
    depth: p.depth - rr * 0.2,
    el: (
      <g opacity={op}>
        {o.ring && (o.ringP ?? 0) > 0.01 ? <circle cx={p.X} cy={p.Y} r={R + 7} fill="none" stroke={o.ring} strokeWidth={4} opacity={o.ringP} /> : null}
        <circle cx={p.X} cy={p.Y} r={R} fill={`url(#sy-ball-${el})`} />
        <ellipse cx={p.X - R * 0.32} cy={p.Y - R * 0.38} rx={R * 0.3} ry={R * 0.18} fill="#fff" opacity={0.4} transform={`rotate(-30 ${p.X - R * 0.32} ${p.Y - R * 0.38})`} />
        {text && R > 9 ? (
          <text
            x={p.X}
            y={p.Y + R * 0.03}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={FONT.sans}
            fontWeight={700}
            fontSize={R * (text.length > 1 ? 0.62 : 0.8)}
            fill={dark ? '#1d2440' : '#fff'}
            opacity={0.92}
          >
            {text}
          </text>
        ) : null}
      </g>
    ),
  };
};

/* ------------------------------------------------------------------ */
/* Molekul generik.                                                     */
/* ------------------------------------------------------------------ */
export type SAtom = {el: string; pos: V3; label?: string | null};
export type SMol = {atoms: SAtom[]; bonds: [number, number, number?][]; rings?: {c: V3; n: V3; r: number}[]};

/** Lingkaran aromatik putus-putus (3D) di bidang ⊥ n. */
const ringItem = (cam: Cam, o: {c: V3; n: V3; r: number; opacity: number; tf: (v: V3) => V3}): Item | null => {
  if (o.opacity <= 0.005) return null;
  const n = norm(o.n);
  const a = norm(Math.abs(n[2]) < 0.9 ? [n[1], -n[0], 0] : [1, 0, 0]);
  const b: V3 = [n[1] * a[2] - n[2] * a[1], n[2] * a[0] - n[0] * a[2], n[0] * a[1] - n[1] * a[0]];
  const N = 40;
  const pts = Array.from({length: N + 1}, (_, i) => {
    const th = (2 * Math.PI * i) / N;
    return proj(o.tf(add(o.c, add(mul(a, o.r * Math.cos(th)), mul(b, o.r * Math.sin(th))))), cam);
  });
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p.X.toFixed(1)},${p.Y.toFixed(1)}`).join(' ');
  const c = proj(o.tf(o.c), cam);
  return {
    depth: c.depth - 0.02,
    el: <path d={d} fill="none" stroke="#b9c4e6" strokeWidth={Math.max(1.5, 0.05 * cam.s)} strokeDasharray={`${0.12 * cam.s} ${0.08 * cam.s}`} opacity={0.75 * o.opacity} />,
  };
};

/** Item 3D untuk sebuah molekul. tf = transformasi titik (putaran / operasi simetri). */
export const molDraw = (
  cam: Cam,
  mol: SMol,
  o: {tf?: (v: V3) => V3; opacity?: number; rs?: number; bw?: number; labels?: boolean; bondColor?: string; ring?: (i: number) => [string, number] | null} = {},
): Item[] => {
  const tf = o.tf ?? ((v: V3) => v);
  const op = o.opacity ?? 1;
  if (op <= 0.005) return [];
  const P = mol.atoms.map((a) => tf(a.pos));
  const out: (Item | null)[] = [];
  for (const [a, b, ord] of mol.bonds) {
    const ra = (EL_R[mol.atoms[a].el] ?? 0.34) * (o.rs ?? 1) * 0.6;
    const rb = (EL_R[mol.atoms[b].el] ?? 0.34) * (o.rs ?? 1) * 0.6;
    out.push(bond(cam, {a: P[a], b: P[b], order: ord ?? 1, width: o.bw ?? 0.12, opacity: op, color: o.bondColor, trimA: ra * 0.4, trimB: rb * 0.4}));
  }
  mol.atoms.forEach((a, i) => {
    const r = o.ring?.(i) ?? null;
    out.push(sBall(cam, {pos: P[i], el: a.el, rs: o.rs, opacity: op, label: o.labels === false ? null : a.label, ring: r?.[0], ringP: r?.[1]}));
  });
  for (const rg of mol.rings ?? []) out.push(ringItem(cam, {c: rg.c, n: rg.n, r: rg.r, opacity: op, tf}));
  return out.filter((x): x is Item => !!x);
};

/** Pusatkan molekul (rata-rata posisi atom berat). */
const center = (m: SMol): SMol => {
  const heavy = m.atoms.filter((a) => a.el !== 'H');
  const c = mul(heavy.reduce<V3>((s, a) => add(s, a.pos), [0, 0, 0]), 1 / Math.max(1, heavy.length));
  return {...m, atoms: m.atoms.map((a) => ({...a, pos: sub(a.pos, c)})), rings: m.rings?.map((r) => ({...r, c: sub(r.c, c)}))};
};

/* ------------------------------------------------------------------ */
/* Geometri (Å ≈ satuan). Sumbu utama = z bila ada.                      */
/* ------------------------------------------------------------------ */
const deg = Math.PI / 180;

/** H₂O di bidang yz, C₂ = z. */
export const H2O: SMol = {
  atoms: [
    {el: 'O', pos: [0, 0, 0.2]},
    {el: 'H', pos: [0, -0.958 * Math.sin(52.25 * deg), 0.2 - 0.958 * Math.cos(52.25 * deg)]},
    {el: 'H', pos: [0, 0.958 * Math.sin(52.25 * deg), 0.2 - 0.958 * Math.cos(52.25 * deg)]},
  ],
  bonds: [
    [0, 1],
    [0, 2],
  ],
};

/** H₂CO di bidang yz, C=O sepanjang z. */
export const H2CO: SMol = center({
  atoms: [
    {el: 'C', pos: [0, 0, 0]},
    {el: 'O', pos: [0, 0, 1.21]},
    {el: 'H', pos: [0, -1.11 * Math.sin(58.25 * deg), -1.11 * Math.cos(58.25 * deg)]},
    {el: 'H', pos: [0, 1.11 * Math.sin(58.25 * deg), -1.11 * Math.cos(58.25 * deg)]},
  ],
  bonds: [
    [0, 1, 2],
    [0, 2],
    [0, 3],
  ],
});

/** NH₃: C₃ = z. */
export const NH3: SMol = {
  atoms: [{el: 'N', pos: [0, 0, 0.3]}, ...pyramid(106.7).map((d) => ({el: 'H', pos: add([0, 0, 0.3], mul(d, 1.01))}))],
  bonds: [
    [0, 1],
    [0, 2],
    [0, 3],
  ],
};

/** C₂H₄ di bidang xy, C=C sepanjang x. */
export const C2H4: SMol = {
  atoms: [
    {el: 'C', pos: [-0.667, 0, 0]},
    {el: 'C', pos: [0.667, 0, 0]},
    {el: 'H', pos: [-1.232, 0.929, 0]},
    {el: 'H', pos: [-1.232, -0.929, 0]},
    {el: 'H', pos: [1.232, 0.929, 0]},
    {el: 'H', pos: [1.232, -0.929, 0]},
  ],
  bonds: [
    [0, 1, 2],
    [0, 2],
    [0, 3],
    [1, 4],
    [1, 5],
  ],
};

/** Benzena di bidang xy, C₆ = z. Atom 0..5 = C, 6..11 = H. */
export const BENZENE: SMol = {
  atoms: [
    ...[0, 1, 2, 3, 4, 5].map((k) => ({el: 'C', pos: [1.39 * Math.cos(k * 60 * deg), 1.39 * Math.sin(k * 60 * deg), 0] as V3})),
    ...[0, 1, 2, 3, 4, 5].map((k) => ({el: 'H', pos: [2.47 * Math.cos(k * 60 * deg), 2.47 * Math.sin(k * 60 * deg), 0] as V3})),
  ],
  bonds: [...[0, 1, 2, 3, 4, 5].map((k) => [k, (k + 1) % 6] as [number, number]), ...[0, 1, 2, 3, 4, 5].map((k) => [k, k + 6] as [number, number])],
  rings: [{c: [0, 0, 0], n: [0, 0, 1], r: 0.86}],
};

/** Naftalena di bidang xy, dua cincin berbagi ikatan di x = 0. */
export const NAPHTHALENE: SMol = (() => {
  const atoms: SAtom[] = [];
  const key = (p: V3) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
  const idx = new Map<string, number>();
  const bonds: [number, number][] = [];
  const cs = [-1.212, 1.212];
  for (const cx of cs) {
    const ids: number[] = [];
    for (let k = 0; k < 6; k++) {
      const th = (30 + 60 * k) * deg;
      const p: V3 = [cx + 1.4 * Math.cos(th), 1.4 * Math.sin(th), 0];
      const kk = key([Math.abs(p[0]) < 0.01 ? 0 : p[0], p[1], 0]);
      if (!idx.has(kk)) {
        idx.set(kk, atoms.length);
        atoms.push({el: 'C', pos: [Math.abs(p[0]) < 0.01 ? 0 : p[0], p[1], 0]});
        if (Math.abs(p[0]) > 0.01) atoms.push({el: 'H', pos: [cx + 2.48 * Math.cos(th), 2.48 * Math.sin(th), 0]});
      }
      ids.push(idx.get(kk)!);
    }
    for (let k = 0; k < 6; k++) {
      const a = ids[k];
      const b = ids[(k + 1) % 6];
      if (!bonds.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) bonds.push([a, b]);
    }
  }
  // ikatan C–H: tiap H tepat setelah C-nya
  atoms.forEach((a, i) => {
    if (a.el === 'H') bonds.push([i - 1, i]);
  });
  return {atoms, bonds, rings: cs.map((cx) => ({c: [cx, 0, 0] as V3, n: [0, 0, 1] as V3, r: 0.86}))};
})();

/** CH₄ (C₃ ke atas). */
export const CH4: SMol = {
  atoms: [{el: 'C', pos: [0, 0, 0]}, ...TETRA.map((d) => ({el: 'H', pos: mul(d, 1.09)}))],
  bonds: [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
  ],
};

/** SF₆ oktahedral. */
export const SF6: SMol = {
  atoms: [
    {el: 'S', pos: [0, 0, 0]},
    ...([
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1],
    ] as V3[]).map((d) => ({el: 'F', pos: mul(d, 1.56)})),
  ],
  bonds: [1, 2, 3, 4, 5, 6].map((i) => [0, i] as [number, number]),
};

/** CO₂ linear sepanjang x. */
export const CO2: SMol = {
  atoms: [
    {el: 'O', pos: [-1.16, 0, 0]},
    {el: 'C', pos: [0, 0, 0]},
    {el: 'O', pos: [1.16, 0, 0]},
  ],
  bonds: [
    [0, 1, 2],
    [1, 2, 2],
  ],
};

/** HCl linear sepanjang x. */
export const HCL: SMol = {
  atoms: [
    {el: 'H', pos: [-0.85, 0, 0]},
    {el: 'Cl', pos: [0.42, 0, 0]},
  ],
  bonds: [[0, 1]],
};

/** CHFClBr (kiral, C₁). */
export const CHFCLBR: SMol = center({
  atoms: [
    {el: 'C', pos: [0, 0, 0]},
    {el: 'H', pos: mul(TETRA[0], 1.09)},
    {el: 'F', pos: mul(TETRA[1], 1.35)},
    {el: 'Cl', pos: mul(TETRA[2], 1.77)},
    {el: 'Br', pos: mul(TETRA[3], 1.94)},
  ],
  bonds: [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
  ],
});

/* ------------------------------------------------------------------ */
/* C₆₀: ikosahedron terpancung (60 titik, 90 ikatan, 12 segilima).        */
/* ------------------------------------------------------------------ */
const PHI = (1 + Math.sqrt(5)) / 2;
const cyclic = (v: V3): V3[] => [v, [v[2], v[0], v[1]], [v[1], v[2], v[0]]];
const signs = (v: V3): V3[] => {
  const out: V3[] = [];
  for (const sx of v[0] ? [1, -1] : [1]) for (const sy of v[1] ? [1, -1] : [1]) for (const sz of v[2] ? [1, -1] : [1]) out.push([v[0] * sx, v[1] * sy, v[2] * sz]);
  return out;
};
const C60_RAW: V3[] = [
  ...cyclic([0, 1, 3 * PHI]).flatMap(signs),
  ...cyclic([1, 2 + PHI, 2 * PHI]).flatMap(signs),
  ...cyclic([PHI, 2, 2 * PHI + 1]).flatMap(signs),
];
const K60 = 0.7; // tepi 2 → 1,4 Å
export const C60_PTS: V3[] = C60_RAW.map((v) => mul(v, K60));
export const C60_BONDS: [number, number][] = (() => {
  const b: [number, number][] = [];
  for (let i = 0; i < 60; i++)
    for (let j = i + 1; j < 60; j++) {
      const d = Math.hypot(C60_RAW[i][0] - C60_RAW[j][0], C60_RAW[i][1] - C60_RAW[j][1], C60_RAW[i][2] - C60_RAW[j][2]);
      if (Math.abs(d - 2) < 0.05) b.push([i, j]);
    }
  return b;
})();
/** 12 segilima = 5 titik terdekat ke tiap titik sudut ikosahedron (0, ±1, ±φ). */
export const C60_PENTS: number[][] = cyclic([0, 1, PHI])
  .flatMap(signs)
  .map((dir) => {
    const u = norm(dir);
    const idx = C60_RAW.map((v, i) => [i, v[0] * u[0] + v[1] * u[1] + v[2] * u[2]] as [number, number])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((x) => x[0]);
    // urutkan melingkar di sekitar u
    const a = norm(Math.abs(u[2]) < 0.9 ? [u[1], -u[0], 0] : [1, 0, 0]);
    const bb: V3 = [u[1] * a[2] - u[2] * a[1], u[2] * a[0] - u[0] * a[2], u[0] * a[1] - u[1] * a[0]];
    return idx.sort((i, j) => {
      const vi = C60_RAW[i];
      const vj = C60_RAW[j];
      return Math.atan2(vi[0] * bb[0] + vi[1] * bb[1] + vi[2] * bb[2], vi[0] * a[0] + vi[1] * a[1] + vi[2] * a[2]) - Math.atan2(vj[0] * bb[0] + vj[1] * bb[1] + vj[2] * bb[2], vj[0] * a[0] + vj[1] * a[1] + vj[2] * a[2]);
    });
  });

/** Sangkar C₆₀: segilima emas di depan, ikatan tipis, atom kecil. */
export const c60Items = (cam: Cam, o: {tf?: (v: V3) => V3; opacity?: number; pent?: number} = {}): Item[] => {
  const op = o.opacity ?? 1;
  if (op <= 0.005) return [];
  const tf = o.tf ?? ((v: V3) => v);
  const P = C60_PTS.map((v) => proj(tf(v), cam));
  const out: Item[] = [];
  const pent = o.pent ?? 1;
  for (const f of C60_PENTS) {
    const dep = f.reduce((s, i) => s + P[i].depth, 0) / 5;
    const pts = f.map((i) => `${P[i].X.toFixed(1)},${P[i].Y.toFixed(1)}`).join(' ');
    out.push({depth: dep + 0.15, el: <polygon points={pts} fill={C.gold} fillOpacity={(dep < 0 ? 0.42 : 0.16) * pent * op} stroke="none" />});
  }
  for (const [a, b] of C60_BONDS) {
    const dep = (P[a].depth + P[b].depth) / 2;
    const back = dep > 0;
    out.push({
      depth: dep + 0.05,
      el: <line x1={P[a].X} y1={P[a].Y} x2={P[b].X} y2={P[b].Y} stroke={back ? '#5f6a8c' : '#c3cbe6'} strokeWidth={Math.max(1.2, 0.07 * cam.s * P[a].f)} strokeLinecap="round" opacity={(back ? 0.45 : 0.95) * op} />,
    });
  }
  for (let i = 0; i < 60; i++) {
    const it = sBall(cam, {pos: tf(C60_PTS[i]), el: 'C', rs: 0.42, opacity: op * (P[i].depth > 0 ? 0.55 : 1)});
    if (it) out.push(it);
  }
  return out;
};

/* ------------------------------------------------------------------ */
/* Galeri grup titik.                                                   */
/* ------------------------------------------------------------------ */
export type Family = 'Cv' | 'Dh' | 'cubic' | 'C1';
export const FAMILY_COL: Record<Family, string> = {Cv: C.cyan, Dh: C.gold, cubic: C.mint, C1: C.red};
export type GalleryEntry = {
  key: string;
  name: [string, ('sub' | 'sup')?][];
  group: [string, ('sub' | 'sup')?][];
  family: Family;
  mol?: SMol;
  c60?: boolean;
  /** skala px per Å agar muat di sel */
  s: number;
  pitch: number;
  tilt?: number;
};
export const GALLERY: GalleryEntry[] = [
  {key: 'h2o', name: [['H'], ['2', 'sub'], ['O']], group: [['C'], ['2v', 'sub']], family: 'Cv', mol: H2O, s: 105, pitch: -0.3},
  {key: 'h2co', name: [['H'], ['2', 'sub'], ['CO']], group: [['C'], ['2v', 'sub']], family: 'Cv', mol: H2CO, s: 70, pitch: -0.3},
  {key: 'nh3', name: [['NH'], ['3', 'sub']], group: [['C'], ['3v', 'sub']], family: 'Cv', mol: NH3, s: 100, pitch: -0.45},
  {key: 'c2h4', name: [['C'], ['2', 'sub'], ['H'], ['4', 'sub']], group: [['D'], ['2h', 'sub']], family: 'Dh', mol: C2H4, s: 74, pitch: -0.75},
  {key: 'naph', name: [['naftalena']], group: [['D'], ['2h', 'sub']], family: 'Dh', mol: NAPHTHALENE, s: 35, pitch: -0.8},
  {key: 'benz', name: [['benzena']], group: [['D'], ['6h', 'sub']], family: 'Dh', mol: BENZENE, s: 44, pitch: -0.8},
  {key: 'ch4', name: [['CH'], ['4', 'sub']], group: [['T'], ['d', 'sub']], family: 'cubic', mol: CH4, s: 82, pitch: -0.35},
  {key: 'sf6', name: [['SF'], ['6', 'sub']], group: [['O'], ['h', 'sub']], family: 'cubic', mol: SF6, s: 52, pitch: -0.4},
  {key: 'c60', name: [['C'], ['60', 'sub']], group: [['I'], ['h', 'sub']], family: 'cubic', c60: true, s: 25, pitch: -0.4},
  {key: 'chfclbr', name: [['CHFClBr']], group: [['C'], ['1', 'sub']], family: 'C1', mol: CHFCLBR, s: 56, pitch: -0.3},
];

/** Gambar satu molekul galeri (atau C₆₀) di pusat (cx, cy). */
export const galleryItems = (e: GalleryEntry, o: {cx: number; cy: number; yaw: number; scale?: number; opacity?: number; tf?: (v: V3) => V3}): Item[] => {
  const cam: Cam = {cx: o.cx, cy: o.cy, s: e.s * (o.scale ?? 1), yaw: o.yaw, pitch: e.pitch, persp: 10};
  if (e.c60) return c60Items(cam, {opacity: o.opacity, tf: o.tf});
  return molDraw(cam, e.mol!, {opacity: o.opacity, tf: o.tf, rs: e.s < 50 ? 1.2 : 1.05});
};

/* ------------------------------------------------------------------ */
/* Unsur simetri 3D.                                                    */
/* ------------------------------------------------------------------ */
/** Sumbu putar (garis emas lurus, tanpa filter) dari a ke b. */
export const axisItem = (cam: Cam, o: {a: V3; b: V3; color?: string; width?: number; opacity?: number; p?: number}): Item | null => {
  const op = o.opacity ?? 1;
  if (op <= 0.005 || (o.p ?? 1) <= 0.005) return null;
  const pp = o.p ?? 1;
  const m = mul(add(o.a, o.b), 0.5);
  const A = proj(add(m, mul(sub(o.a, m), pp)), cam);
  const B = proj(add(m, mul(sub(o.b, m), pp)), cam);
  const col = o.color ?? C.gold;
  const w = o.width ?? 4;
  return {
    depth: (A.depth + B.depth) / 2 + 0.3,
    el: (
      <g opacity={op}>
        <line x1={A.X} y1={A.Y} x2={B.X} y2={B.Y} stroke={col} strokeWidth={w * 3.5} strokeOpacity={0.14} strokeLinecap="round" />
        <line x1={A.X} y1={A.Y} x2={B.X} y2={B.Y} stroke={col} strokeWidth={w} strokeLinecap="round" />
      </g>
    ),
  };
};

/** Bidang cermin (poligon sian transparan) dari titik sudut 3D. */
export const planeItem = (cam: Cam, o: {corners: V3[]; color?: string; opacity?: number; depthBias?: number}): Item | null => {
  const op = o.opacity ?? 1;
  if (op <= 0.005) return null;
  const P = o.corners.map((q) => proj(q, cam));
  const col = o.color ?? C.cyan;
  return {
    depth: P.reduce((s, p) => s + p.depth, 0) / P.length + (o.depthBias ?? 0.8),
    el: <polygon points={P.map((p) => `${p.X.toFixed(1)},${p.Y.toFixed(1)}`).join(' ')} fill={col} fillOpacity={0.16 * op} stroke={col} strokeOpacity={0.7 * op} strokeWidth={2.5} strokeLinejoin="round" />,
  };
};

/** Panah putar (busur emas) mengelilingi sumbu n di titik c. */
export const spinArrow = (cam: Cam, o: {c: V3; n: V3; r: number; ph: number; color?: string; opacity?: number; sweep?: number}): Item | null => {
  const op = o.opacity ?? 1;
  if (op <= 0.005) return null;
  const n = norm(o.n);
  const a = norm(Math.abs(n[2]) < 0.9 ? [n[1], -n[0], 0] : [1, 0, 0]);
  const b: V3 = [n[1] * a[2] - n[2] * a[1], n[2] * a[0] - n[0] * a[2], n[0] * a[1] - n[1] * a[0]];
  const sw = o.sweep ?? 1.5 * Math.PI;
  const N = 36;
  const P = Array.from({length: N + 1}, (_, i) => {
    const th = o.ph + (sw * i) / N;
    return proj(add(o.c, add(mul(a, o.r * Math.cos(th)), mul(b, o.r * Math.sin(th)))), cam);
  });
  const d = P.map((p, i) => `${i ? 'L' : 'M'}${p.X.toFixed(1)},${p.Y.toFixed(1)}`).join(' ');
  const e = P[N];
  const e0 = P[N - 3];
  const ang = Math.atan2(e.Y - e0.Y, e.X - e0.X);
  const col = o.color ?? C.gold;
  const hs = 14;
  return {
    depth: -20,
    el: (
      <g opacity={op}>
        <path d={d} fill="none" stroke={col} strokeWidth={4} strokeLinecap="round" />
        <path
          d={`M${e.X + hs * Math.cos(ang)},${e.Y + hs * Math.sin(ang)} L${e.X + hs * Math.cos(ang + 2.5)},${e.Y + hs * Math.sin(ang + 2.5)} L${e.X + hs * Math.cos(ang - 2.5)},${e.Y + hs * Math.sin(ang - 2.5)} Z`}
          fill={col}
        />
      </g>
    ),
  };
};

/** Teks berlabel subskrip untuk SVG (tanpa bergantung pada komponen lain). */
export const SyText: React.FC<{
  x: number;
  y: number;
  parts: [string, ('sub' | 'sup')?][];
  size?: number;
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
  weight?: number;
  opacity?: number;
  font?: 'sans' | 'serif' | 'mono';
  italic?: boolean;
}> = ({x, y, parts, size = 30, color = C.ink, anchor = 'middle', weight = 600, opacity = 1, font = 'sans', italic}) =>
  opacity <= 0.001 ? null : (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="central"
      fontFamily={FONT[font]}
      fontSize={size}
      fontWeight={weight}
      fill={color}
      opacity={opacity}
      fontStyle={italic ? 'italic' : undefined}
      style={{paintOrder: 'stroke', stroke: 'rgba(4,6,12,0.88)', strokeWidth: size * 0.12}}
    >
      {parts.map(([s, k], i) =>
        k ? (
          <tspan key={i} baselineShift={k === 'sub' ? 'sub' : 'super'} fontSize={size * 0.64}>
            {s}
          </tspan>
        ) : (
          <tspan key={i}>{s}</tspan>
        ),
      )}
    </text>
  );

/** Lencana grup titik (SVG): kapsul berwarna + teks bersubskrip. */
export const GroupBadge: React.FC<{x: number; y: number; parts: [string, ('sub' | 'sup')?][]; color: string; p: number; size?: number; w?: number; t?: number}> = ({
  x,
  y,
  parts,
  color,
  p,
  size = 44,
  w = 150,
  t = 0,
}) => {
  if (p <= 0.001) return null;
  const k = 0.7 + 0.3 * Math.min(1, p);
  const h = size * 1.45;
  const br = 0.5 + 0.5 * Math.sin(t * 2 + x * 0.01);
  return (
    <g opacity={Math.min(1, p * 1.6)} transform={`translate(${x} ${y}) scale(${k})`}>
      <rect x={-w / 2 - 8} y={-h / 2 - 8} width={w + 16} height={h + 16} rx={(h + 16) / 2} fill={color} opacity={0.08 + 0.06 * br} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill="rgba(10,14,30,0.92)" stroke={color} strokeWidth={3} />
      <SyText x={0} y={-2} parts={parts} size={size} color={color} font="serif" italic weight={600} />
    </g>
  );
};
