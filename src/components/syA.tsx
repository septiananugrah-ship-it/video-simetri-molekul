import React from 'react';
import {C, FONT} from '../theme';
import {add, ball, bent, bond, lerp3, mul, norm, proj, pyramid, sub, type Cam, type Item, type MBond, type V3} from './vbC';

// Komponen bersama grup A (operasi & sumbu putar): molekul 3D generik, operasi simetri sebagai
// matriks 3×3 yang bisa diinterpolasi 0→1, sumbu Cₙ emas + panah putar, bidang cermin sian, nomor atom.
// Sumbu dunia sama dengan vbC: x kanan, y menjauh, z atas.

/* ------------------------------------------------------------------ */
/* Aljabar 3×3                                                          */
/* ------------------------------------------------------------------ */
export type Mat = [number, number, number, number, number, number, number, number, number];
export const apply = (m: Mat, v: V3): V3 => [
  m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
  m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
  m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Rotasi sudut `ang` (radian, berlawanan jarum jam dilihat dari ujung sumbu) — rumus Rodrigues. */
export const rotM = (axis: V3, ang: number): Mat => {
  const [x, y, z] = norm(axis);
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const k = 1 - c;
  return [c + x * x * k, x * y * k - z * s, x * z * k + y * s, y * x * k + z * s, c + y * y * k, y * z * k - x * s, z * x * k - y * s, z * y * k + x * s, c + z * z * k];
};
/** Pantulan pada bidang dengan normal n (melalui titik asal): I − 2nnᵀ. */
export const reflM = (normal: V3): Mat => {
  const [x, y, z] = norm(normal);
  return [1 - 2 * x * x, -2 * x * y, -2 * x * z, -2 * y * x, 1 - 2 * y * y, -2 * y * z, -2 * z * x, -2 * z * y, 1 - 2 * z * z];
};
export const INV: Mat = [-1, 0, 0, 0, -1, 0, 0, 0, -1];
export const IDENT: Mat = [1, 0, 0, 0, 1, 0, 0, 0, 1];
export const matMul = (a: Mat, b: Mat): Mat => {
  const r = new Array(9).fill(0) as Mat;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
  return r;
};

/* ------------------------------------------------------------------ */
/* Operasi simetri                                                      */
/* ------------------------------------------------------------------ */
export type SymOp =
  | {kind: 'E'}
  | {kind: 'C'; axis: V3; deg: number; center?: V3}
  | {kind: 'sigma'; normal: V3; center?: V3}
  | {kind: 'i'; center?: V3}
  | {kind: 'S'; axis: V3; deg: number; center?: V3};

/** Matriks operasi penuh (p = 1). */
export const opMatrix = (op: SymOp): Mat => {
  switch (op.kind) {
    case 'E':
      return IDENT;
    case 'C':
      return rotM(op.axis, (op.deg * Math.PI) / 180);
    case 'sigma':
      return reflM(op.normal);
    case 'i':
      return INV;
    case 'S':
      return matMul(reflM(op.axis), rotM(op.axis, (op.deg * Math.PI) / 180));
  }
};

/**
 * Posisi titik v selama operasi berlangsung (p: 0→1).
 * Rotasi: sudut bertahap. Pantulan/inversi: atom bergerak lurus menembus bidang/titik.
 * Sₙ: putar dulu (p 0→0,5), lalu pantul (p 0,5→1).
 */
export const opAt = (op: SymOp, v: V3, p: number): V3 => {
  if (op.kind === 'E' || p <= 0) return v;
  const c: V3 = ('center' in op && op.center) || [0, 0, 0];
  const r = sub(v, c);
  let out: V3;
  if (op.kind === 'C') out = apply(rotM(op.axis, (op.deg * Math.PI * Math.min(1, p)) / 180), r);
  else if (op.kind === 'sigma') out = lerp3(r, apply(reflM(op.normal), r), Math.min(1, p));
  else if (op.kind === 'i') out = lerp3(r, mul(r, -1), Math.min(1, p));
  else {
    const p1 = Math.min(1, p * 2);
    const p2 = Math.max(0, Math.min(1, p * 2 - 1));
    const rr = apply(rotM(op.axis, (op.deg * Math.PI * p1) / 180), r);
    out = lerp3(rr, apply(reflM(op.axis), rr), p2);
  }
  return add(out, c);
};

/* ------------------------------------------------------------------ */
/* Molekul generik                                                      */
/* ------------------------------------------------------------------ */
export type SAtom = {el: string; pos: V3; n?: number; r?: number; label?: string | null};
export type SMol = {atoms: SAtom[]; bonds: MBond[]};

export const mapMol = (m: SMol, f: (v: V3) => V3): SMol => ({atoms: m.atoms.map((a) => ({...a, pos: f(a.pos)})), bonds: m.bonds});

/** Tanda nomor kecil (lingkaran gelap berbingkai emas) di samping atom. */
export const numTag = (cam: Cam, pos: V3, n: number | string, r: number, opacity = 1, color: string = C.gold): Item | null => {
  if (opacity <= 0.005) return null;
  const p = proj(pos, cam);
  const R = r * cam.s * p.f;
  const s = Math.max(11, R * 0.48);
  const x = p.X + R * 0.78;
  const y = p.Y - R * 0.78;
  return {
    depth: p.depth - r - 0.3,
    el: (
      <g opacity={opacity}>
        <circle cx={x} cy={y} r={s} fill="#0b1022" stroke={color} strokeWidth={2} />
        <text x={x} y={y + 0.5} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.mono} fontWeight={600} fontSize={s * 1.2} fill={color}>
          {n}
        </text>
      </g>
    ),
  };
};

/** Molekul bola-batang yang sedang menjalani operasi `op` (p 0→1). numbers = opasitas nomor atom. */
export const symMol = (
  cam: Cam,
  mol: SMol,
  o: {op?: SymOp; p?: number; opacity?: number; numbers?: number; numColor?: string; hR?: number; labels?: boolean; bondW?: number} = {},
): Item[] => {
  const op = o.opacity ?? 1;
  if (op <= 0.005) return [];
  const pos = mol.atoms.map((a) => (o.op ? opAt(o.op, a.pos, o.p ?? 0) : a.pos));
  const out: (Item | null)[] = [];
  for (const b of mol.bonds) {
    const it = bond(cam, {a: pos[b.a], b: pos[b.b], order: b.order, color: b.color, width: b.width ?? o.bondW, opacity: (b.opacity ?? 1) * op});
    // ikatan selalu di belakang kedua atomnya (bola tidak tertutup batang)
    if (it) out.push({...it, depth: Math.max(proj(pos[b.a], cam).depth, proj(pos[b.b], cam).depth) + 0.05});
  }
  mol.atoms.forEach((a, i) => {
    const r = a.r ?? (a.el === 'H' ? (o.hR ?? 0.27) : a.el === 'Me' ? 0.4 : 0.38);
    out.push(ball(cam, {pos: pos[i], el: a.el, r, label: o.labels === false ? null : a.label, opacity: op}));
    if (a.n !== undefined && (o.numbers ?? 0) > 0.005) out.push(numTag(cam, pos[i], a.n, r, op * (o.numbers ?? 0), o.numColor));
  });
  return out.filter((x): x is Item => !!x);
};

/* ------------------------------------------------------------------ */
/* Molekul dengan geometri benar                                         */
/* ------------------------------------------------------------------ */
/** H₂O: bidang xz, sudut 104,5°, sumbu C₂ = z melalui O. */
export const H2O = (d = 1.0): SMol => {
  const O: V3 = [0, 0, 0.22];
  const [a, b] = bent(104.5);
  return {
    atoms: [
      {el: 'O', pos: O},
      {el: 'H', pos: add(O, mul(a, d)), n: 1},
      {el: 'H', pos: add(O, mul(b, d)), n: 2},
    ],
    bonds: [
      {a: 0, b: 1},
      {a: 0, b: 2},
    ],
  };
};

/** NH₃: piramida trigonal, H–N–H 106,7°, sumbu C₃ = z melalui N. */
export const NH3 = (d = 1.05): SMol => {
  const N: V3 = [0, 0, 0.3];
  const hs = pyramid(106.7, -Math.PI / 2);
  return {
    atoms: [{el: 'N', pos: N}, ...hs.map((h, k) => ({el: 'H', pos: add(N, mul(h, d)), n: k + 1}))],
    bonds: [1, 2, 3].map((b) => ({a: 0, b})),
  };
};

/** Benzena: heksagon datar di bidang xy (C–C 1,39; C–H 1,08), sumbu C₆ = z. */
export const BENZENE = (rc = 1.39, rh = 2.47, numbered = true): SMol => {
  const atoms: SAtom[] = [];
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3;
    atoms.push({el: 'C', pos: [rc * Math.cos(a), rc * Math.sin(a), 0], label: null});
  }
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3;
    atoms.push({el: 'H', pos: [rh * Math.cos(a), rh * Math.sin(a), 0], n: numbered ? k + 1 : undefined, label: null});
  }
  const bonds: MBond[] = [];
  for (let k = 0; k < 6; k++) bonds.push({a: k, b: (k + 1) % 6, order: k % 2 ? 1 : 2});
  for (let k = 0; k < 6; k++) bonds.push({a: k, b: k + 6});
  return {atoms, bonds};
};

/** CH₄: tetrahedral, satu H ke atas. */
export const CH4 = (d = 1.09): SMol => {
  const TH = Math.acos(-1 / 3);
  const dirs: V3[] = [[0, 0, 1], ...[0, 1, 2].map((k) => [Math.sin(TH) * Math.cos((2 * Math.PI * k) / 3), Math.sin(TH) * Math.sin((2 * Math.PI * k) / 3), Math.cos(TH)] as V3)];
  return {atoms: [{el: 'C', pos: [0, 0, 0]}, ...dirs.map((v, k) => ({el: 'H', pos: mul(v, d), n: k + 1}))], bonds: [1, 2, 3, 4].map((b) => ({a: 0, b}))};
};

/**
 * Karvon (2-metil-5-isopropenil-sikloheks-2-en-1-on), skematis: cincin di bidang xy,
 * C=O, metil, isopropenil pada pusat kiral C5 (atas bidang) dan H-nya (bawah bidang).
 */
const carvoneRaw = (): {mol: SMol; chiral: number; sub: number[]} => {
  const R = 1.4;
  const ang = [90, 30, -30, -90, -150, 150].map((d) => (d * Math.PI) / 180);
  const ring: V3[] = ang.map((a, k) => [R * Math.cos(a), R * Math.sin(a), k === 4 ? 0.12 : k === 3 ? -0.12 : 0]);
  const rad = (k: number): V3 => [Math.cos(ang[k]), Math.sin(ang[k]), 0];
  const zU: V3 = [0, 0, 1];
  const O = add(ring[0], mul(rad(0), 1.23));
  const Me = add(ring[1], mul(rad(1), 1.5));
  const H3 = add(ring[2], mul(rad(2), 1.08));
  const dIso = norm(add(mul(rad(4), 0.72), mul(zU, 0.7)));
  const C7 = add(ring[4], mul(dIso, 1.5));
  const H5 = add(ring[4], mul(norm(add(mul(rad(4), 0.45), mul(zU, -0.9))), 1.08));
  const pp = norm(cross(dIso, zU));
  const C8 = add(C7, mul(add(mul(dIso, 0.5), mul(pp, 0.866)), 1.34));
  const C9 = add(C7, mul(add(mul(dIso, 0.5), mul(pp, -0.866)), 1.5));
  const atoms: SAtom[] = [
    ...ring.map((p) => ({el: 'C', pos: p, label: null as string | null})),
    {el: 'O', pos: O},
    {el: 'Me', pos: Me},
    {el: 'H', pos: H3, label: null},
    {el: 'C', pos: C7, label: null},
    {el: 'C', pos: C8, label: 'CH₂', r: 0.4},
    {el: 'Me', pos: C9},
    {el: 'H', pos: H5, label: null},
  ];
  const bonds: MBond[] = [
    {a: 0, b: 1},
    {a: 1, b: 2, order: 2},
    {a: 2, b: 3},
    {a: 3, b: 4},
    {a: 4, b: 5},
    {a: 5, b: 0},
    {a: 0, b: 6, order: 2},
    {a: 1, b: 7},
    {a: 2, b: 8},
    {a: 4, b: 9},
    {a: 9, b: 10, order: 2},
    {a: 9, b: 11},
    {a: 4, b: 12},
  ];
  // prioritas CIP di C5: isopropenil C7 > C6 (menuju C=O) > C4 > H
  return {mol: {atoms, bonds}, chiral: 4, sub: [9, 5, 3]};
};

const centerMol = (m: SMol): SMol => {
  const n = m.atoms.length;
  const c = m.atoms.reduce<V3>((s, a) => add(s, a.pos), [0, 0, 0]);
  const cc = mul(c, 1 / n);
  return mapMol(m, (v) => sub(v, cc));
};

const carvonePair = () => {
  const {mol, chiral, sub: s} = carvoneRaw();
  const P = mol.atoms;
  const v = s.map((i) => sub(P[i].pos, P[chiral].pos));
  // R ⇔ (v1 × v2) · v3 < 0 (urutan 1→2→3 searah jarum jam saat H menjauhi pengamat)
  const isR = dot(cross(v[0], v[1]), v[2]) < 0;
  const flip = (m: SMol) => mapMol(m, (p) => [-p[0], p[1], p[2]]);
  const R = centerMol(isR ? mol : flip(mol));
  return {R, S: flip(R)};
};
const CARV = carvonePair();
/** (R)-karvon (bau mint) dan bayangan cerminnya (S)-karvon (bau jintan): S = pantulan x → −x. */
export const CARVONE_R = CARV.R;
export const CARVONE_S = CARV.S;

/* ------------------------------------------------------------------ */
/* Unsur simetri 3D                                                     */
/* ------------------------------------------------------------------ */
const basis = (d: V3): [V3, V3] => {
  const n = norm(d);
  const ref: V3 = Math.abs(n[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const u = norm(cross(n, ref));
  return [u, cross(n, u)];
};

/** Sumbu putar: garis emas dari center − len·dir sampai center + len·dir, tergambar dari tengah (p). */
export const axis3D = (
  cam: Cam,
  o: {center?: V3; dir: V3; len: number; p?: number; opacity?: number; color?: string; width?: number; glow?: number},
): Item[] => {
  const op = o.opacity ?? 1;
  const p = o.p ?? 1;
  if (op <= 0.005 || p <= 0.005) return [];
  const c = o.center ?? [0, 0, 0];
  const d = norm(o.dir);
  const col = o.color ?? C.gold;
  const w = o.width ?? 5;
  const N = 10;
  const out: Item[] = [];
  for (let s = -1; s <= 1; s += 2) {
    for (let k = 0; k < N; k++) {
      const a = mul(d, (s * o.len * p * k) / N);
      const b = mul(d, (s * o.len * p * (k + 1)) / N);
      const A = proj(add(c, a), cam);
      const B = proj(add(c, b), cam);
      out.push({
        depth: (A.depth + B.depth) / 2 + 0.02,
        el: (
          <g opacity={op}>
            {o.glow ? <line x1={A.X} y1={A.Y} x2={B.X} y2={B.Y} stroke={col} strokeOpacity={0.18 * o.glow} strokeWidth={w * 4} strokeLinecap="round" /> : null}
            <line x1={A.X} y1={A.Y} x2={B.X} y2={B.Y} stroke={col} strokeWidth={w} strokeLinecap="round" />
          </g>
        ),
      });
    }
    const E = proj(add(c, mul(d, s * o.len * p)), cam);
    out.push({depth: E.depth - 0.05, el: <circle cx={E.X} cy={E.Y} r={w * 1.3} fill={col} opacity={op} />});
  }
  return out;
};

/** Panah putar melengkung mengelilingi sumbu (di titik `at`), menyapu `sweep` radian mulai `from`. */
export const rotArrow3D = (
  cam: Cam,
  o: {at: V3; dir: V3; r: number; from?: number; sweep?: number; p?: number; opacity?: number; color?: string; width?: number; dir2?: 1 | -1},
): Item[] => {
  const op = o.opacity ?? 1;
  const p = o.p ?? 1;
  if (op <= 0.005 || p <= 0.005) return [];
  const [u, v] = basis(o.dir);
  const from = o.from ?? 0;
  const sweep = (o.sweep ?? Math.PI * 1.5) * p * (o.dir2 ?? 1);
  const col = o.color ?? C.gold;
  const w = o.width ?? 4.5;
  const N = 24;
  const pt = (a: number) => proj(add(o.at, add(mul(u, o.r * Math.cos(a)), mul(v, o.r * Math.sin(a)))), cam);
  const out: Item[] = [];
  for (let k = 0; k < N; k++) {
    const A = pt(from + (sweep * k) / N);
    const B = pt(from + (sweep * (k + 1)) / N);
    out.push({
      depth: (A.depth + B.depth) / 2 - 0.02,
      el: <line x1={A.X} y1={A.Y} x2={B.X} y2={B.Y} stroke={col} strokeWidth={w} strokeLinecap="round" opacity={op * (0.35 + 0.65 * ((k + 1) / N))} />,
    });
  }
  const E = pt(from + sweep);
  const Pv = pt(from + sweep - 0.08 * Math.sign(sweep || 1));
  const tx = E.X - Pv.X;
  const ty = E.Y - Pv.Y;
  const L = Math.hypot(tx, ty) || 1;
  const ux = tx / L;
  const uy = ty / L;
  const hs = w * 3.6;
  out.push({
    depth: E.depth - 0.05,
    el: (
      <path
        d={`M${E.X + ux * hs * 0.6},${E.Y + uy * hs * 0.6} L${E.X - ux * hs * 0.6 - uy * hs * 0.65},${E.Y - uy * hs * 0.6 + ux * hs * 0.65} L${E.X - ux * hs * 0.6 + uy * hs * 0.65},${E.Y - uy * hs * 0.6 - ux * hs * 0.65} Z`}
        fill={col}
        opacity={op}
      />
    ),
  });
  return out;
};

/** Bidang cermin: jajaran genjang sian transparan (dipecah 3×3 agar terurut kedalaman dengan atom). */
export const plane3D = (
  cam: Cam,
  o: {center?: V3; u: V3; v: V3; w: number; h: number; color?: string; opacity?: number; p?: number; fill?: number},
): Item[] => {
  const op = o.opacity ?? 1;
  const p = o.p ?? 1;
  if (op <= 0.005 || p <= 0.005) return [];
  const c = o.center ?? [0, 0, 0];
  const u = norm(o.u);
  const v = norm(o.v);
  const col = o.color ?? C.cyan;
  const W = o.w * p;
  const Hh = o.h * p;
  const at = (a: number, b: number) => proj(add(c, add(mul(u, a * W), mul(v, b * Hh))), cam);
  const out: Item[] = [];
  const N = 3;
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) {
      const a0 = -1 + (2 * i) / N;
      const a1 = -1 + (2 * (i + 1)) / N;
      const b0 = -1 + (2 * j) / N;
      const b1 = -1 + (2 * (j + 1)) / N;
      const q = [at(a0, b0), at(a1, b0), at(a1, b1), at(a0, b1)];
      const m = at((a0 + a1) / 2, (b0 + b1) / 2);
      out.push({
        depth: m.depth + 0.01,
        el: <path d={`M${q.map((x) => `${x.X.toFixed(1)},${x.Y.toFixed(1)}`).join(' L')} Z`} fill={col} fillOpacity={(o.fill ?? 0.13) * op} stroke={col} strokeOpacity={0.05 * op} strokeWidth={1} />,
      });
    }
  const corners: [number, number][] = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];
  corners.forEach(([a, b], k) => {
    const [a2, b2] = corners[(k + 1) % 4];
    for (let s = 0; s < 3; s++) {
      const A = at(a + ((a2 - a) * s) / 3, b + ((b2 - b) * s) / 3);
      const B = at(a + ((a2 - a) * (s + 1)) / 3, b + ((b2 - b) * (s + 1)) / 3);
      out.push({depth: (A.depth + B.depth) / 2, el: <line x1={A.X} y1={A.Y} x2={B.X} y2={B.Y} stroke={col} strokeWidth={2.5} strokeOpacity={0.75 * op} strokeLinecap="round" />});
    }
  });
  return out;
};

/** Pusat inversi: titik merah muda. */
export const invPoint3D = (cam: Cam, o: {at?: V3; opacity?: number; r?: number; t?: number}): Item | null => {
  const op = o.opacity ?? 1;
  if (op <= 0.005) return null;
  const P = proj(o.at ?? [0, 0, 0], cam);
  const r = (o.r ?? 10) * (1 + 0.08 * Math.sin((o.t ?? 0) * 3));
  return {
    depth: P.depth - 0.4,
    el: (
      <g opacity={op}>
        <circle cx={P.X} cy={P.Y} r={r * 2.6} fill="url(#soft-white)" opacity={0.25} />
        <circle cx={P.X} cy={P.Y} r={r} fill={C.pink} stroke="#fff" strokeWidth={2} />
      </g>
    ),
  };
};

/** Titik layar dari posisi 3D (untuk menaruh label). */
export const at2D = (cam: Cam, v: V3) => {
  const p = proj(v, cam);
  return {x: p.X, y: p.Y};
};

/* ------------------------------------------------------------------ */
/* Ikon unsur simetri 2D (E, Cₙ, σ, i, Sₙ)                               */
/* ------------------------------------------------------------------ */
export type OpKind = 'E' | 'C' | 'sigma' | 'i' | 'S';
export const OP_COLOR: Record<OpKind, string> = {E: C.ink, C: C.gold, sigma: C.cyan, i: C.pink, S: C.violet};

export const OpIcon: React.FC<{kind: OpKind; x: number; y: number; s?: number; t: number; opacity?: number}> = ({kind, x, y, s = 1, t, opacity = 1}) => {
  const col = OP_COLOR[kind];
  const dotP = (dx: number, dy: number, r: number, fill: string, k = 0) => <circle key={k} cx={dx} cy={dy} r={r} fill={fill} stroke="#0b1022" strokeWidth={1.5} />;
  let g: React.ReactNode = null;
  if (kind === 'E') {
    const b = 3 * Math.sin(t * 1.4);
    g = (
      <g>
        <circle r={46} fill="none" stroke={C.muted} strokeWidth={2} strokeDasharray="4 7" strokeDashoffset={-t * 8} />
        <line x1={0} y1={-6 + b} x2={-24} y2={16 + b} stroke="#9aa6c6" strokeWidth={5} />
        <line x1={0} y1={-6 + b} x2={24} y2={16 + b} stroke="#9aa6c6" strokeWidth={5} />
        {dotP(0, -6 + b, 13, '#ff4d63', 1)}
        {dotP(-24, 16 + b, 8, '#f2f5ff', 2)}
        {dotP(24, 16 + b, 8, '#f2f5ff', 3)}
      </g>
    );
  } else if (kind === 'C') {
    const a = t * 2.2;
    g = (
      <g>
        <line x1={0} y1={-50} x2={0} y2={50} stroke={col} strokeWidth={4} strokeLinecap="round" />
        <ellipse cx={0} cy={-26} rx={30} ry={9} fill="none" stroke={col} strokeWidth={3} strokeDasharray="70 200" strokeDashoffset={-a * 30} />
        {[0, 1].map((k) => {
          const ph = a + k * Math.PI;
          return <circle key={k} cx={30 * Math.cos(ph)} cy={14 + 9 * Math.sin(ph)} r={7} fill="#f2f5ff" opacity={0.6 + 0.4 * Math.sin(ph)} />;
        })}
      </g>
    );
  } else if (kind === 'sigma') {
    const m = Math.sin(t * 1.6);
    g = (
      <g>
        <path d="M-12,-50 L14,-34 L14,50 L-12,34 Z" fill={col} fillOpacity={0.18} stroke={col} strokeWidth={2.5} />
        <circle cx={-34 + 6 * m} cy={-2} r={8} fill="#f2f5ff" />
        <circle cx={34 - 6 * m} cy={-2} r={8} fill="#f2f5ff" opacity={0.85} />
        <line x1={-24 + 6 * m} y1={-2} x2={24 - 6 * m} y2={-2} stroke={col} strokeWidth={1.5} strokeDasharray="3 4" />
      </g>
    );
  } else if (kind === 'i') {
    const a = t * 0.9;
    g = (
      <g>
        <line x1={-36 * Math.cos(a)} y1={-36 * Math.sin(a)} x2={36 * Math.cos(a)} y2={36 * Math.sin(a)} stroke={col} strokeWidth={2} strokeDasharray="4 5" />
        <circle cx={-36 * Math.cos(a)} cy={-36 * Math.sin(a)} r={8} fill="#f2f5ff" />
        <circle cx={36 * Math.cos(a)} cy={36 * Math.sin(a)} r={8} fill="#f2f5ff" />
        <circle r={7} fill={col} stroke="#fff" strokeWidth={1.5} />
      </g>
    );
  } else {
    const a = t * 1.8;
    g = (
      <g>
        <line x1={0} y1={-50} x2={0} y2={50} stroke={col} strokeWidth={4} strokeLinecap="round" />
        <path d="M-46,8 L30,8 L46,-8 L-30,-8 Z" fill={col} fillOpacity={0.16} stroke={col} strokeWidth={2} />
        <ellipse cx={0} cy={-32} rx={26} ry={8} fill="none" stroke={col} strokeWidth={3} strokeDasharray="60 200" strokeDashoffset={-a * 30} />
        <circle cx={28 * Math.cos(a)} cy={-32 + 8 * Math.sin(a)} r={6} fill="#f2f5ff" />
        <circle cx={-28 * Math.cos(a)} cy={32 - 8 * Math.sin(a)} r={6} fill="#f2f5ff" opacity={0.8} />
      </g>
    );
  }
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
      {g}
    </g>
  );
};

/** Simbol unsur dalam SVG dengan subskrip (mis. C + n). */
export const OpSym: React.FC<{x: number; y: number; kind: OpKind; size?: number; opacity?: number; n?: string}> = ({x, y, kind, size = 44, opacity = 1, n}) => {
  const col = OP_COLOR[kind];
  const base = kind === 'sigma' ? 'σ' : kind === 'C' ? 'C' : kind === 'S' ? 'S' : kind;
  const s = n ?? (kind === 'C' || kind === 'S' ? 'n' : undefined);
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.serif} fontStyle="italic" fontWeight={600} fontSize={size} fill={col} opacity={opacity} style={{paintOrder: 'stroke', stroke: 'rgba(4,6,12,0.85)', strokeWidth: size * 0.1}}>
      {base}
      {s ? (
        <tspan baselineShift="sub" fontSize={size * 0.62}>
          {s}
        </tspan>
      ) : null}
    </text>
  );
};
