import React from 'react';
import {C, FONT} from '../theme';
import {add, bond, dot, lerp3, mul, norm, proj, sub, type Cam, type Item, type V3} from './vbC';

// Utilitas simetri grup B (cermin, inversi, kiral, grup titik):
// molekul 3D generik, operasi simetri yang bisa diinterpolasi 0→1, bidang cermin, sumbu, titik inversi.
// Sumbu dunia sama dengan vbC: x kanan, y menjauh, z atas. Pitch negatif = kamera dari atas.

/* ------------------------------------------------------------------ */
/* Atom & molekul                                                        */
/* ------------------------------------------------------------------ */
export type SAtom = {el: string; pos: V3; n?: number | string; r?: number; label?: string | null};
export type SBond = [number, number] | [number, number, number];
export type SMol = {atoms: SAtom[]; bonds: SBond[]};

const COL: Record<string, string> = {
  H: '#f2f5ff',
  C: '#5d6680',
  N: '#4f7dff',
  O: '#ff4d63',
  F: '#8fe36a',
  Cl: '#2f9e55',
  Br: '#a3343c',
  B: '#ffab8a',
  Pt: '#c7cbd8',
  S: '#ffd84a',
};
const RAD: Record<string, number> = {H: 0.27, C: 0.36, N: 0.36, O: 0.36, F: 0.34, Cl: 0.44, Br: 0.48, B: 0.36, Pt: 0.5, S: 0.44};
const MASS: Record<string, number> = {H: 1, C: 12, N: 14, O: 16, F: 19, Cl: 35.5, Br: 80, B: 11, Pt: 195, S: 32};

const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v + (amt > 0 ? (255 - v) * amt : v * amt))));
  return `rgb(${ch((n >> 16) & 255)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
};

/** Gradien atom (pasang sekali di dalam <Stage>). */
export const SyDefs: React.FC = () => (
  <defs>
    {Object.entries(COL).map(([k, col]) => (
      <radialGradient key={k} id={`syb-${k}`} cx="36%" cy="32%" r="72%">
        <stop offset="0%" stopColor={shade(col, 0.8)} />
        <stop offset="30%" stopColor={shade(col, 0.2)} />
        <stop offset="72%" stopColor={col} />
        <stop offset="100%" stopColor={shade(col, -0.65)} />
      </radialGradient>
    ))}
    <radialGradient id="syb-pink">
      <stop offset="0%" stopColor={C.pink} stopOpacity="0.85" />
      <stop offset="40%" stopColor={C.pink} stopOpacity="0.3" />
      <stop offset="100%" stopColor={C.pink} stopOpacity="0" />
    </radialGradient>
    <radialGradient id="syb-white">
      <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
      <stop offset="40%" stopColor="#fff" stopOpacity="0.3" />
      <stop offset="100%" stopColor="#fff" stopOpacity="0" />
    </radialGradient>
  </defs>
);

/** Geser molekul agar pusat massanya di titik asal (sumbu & bidang menempel ke pusat massa). */
export const centerCOM = (m: SMol): SMol => {
  let M = 0;
  let c: V3 = [0, 0, 0];
  for (const a of m.atoms) {
    const w = MASS[a.el] ?? 12;
    M += w;
    c = add(c, mul(a.pos, w));
  }
  c = mul(c, 1 / M);
  return {...m, atoms: m.atoms.map((a) => ({...a, pos: sub(a.pos, c)}))};
};

/* ------------------------------------------------------------------ */
/* Operasi simetri                                                       */
/* ------------------------------------------------------------------ */
/** Putar v di sekitar sumbu u sebesar a radian (Rodrigues). */
export const rotAxis = (v: V3, u0: V3, a: number): V3 => {
  const u = norm(u0);
  const c = Math.cos(a);
  const s = Math.sin(a);
  const k = dot(u, v) * (1 - c);
  return [
    v[0] * c + (u[1] * v[2] - u[2] * v[1]) * s + u[0] * k,
    v[1] * c + (u[2] * v[0] - u[0] * v[2]) * s + u[1] * k,
    v[2] * c + (u[0] * v[1] - u[1] * v[0]) * s + u[2] * k,
  ];
};
export const reflect = (v: V3, n0: V3): V3 => {
  const n = norm(n0);
  return sub(v, mul(n, 2 * dot(v, n)));
};

export type SymOp = {k: 'E'} | {k: 'C'; axis: V3; angle: number} | {k: 's'; normal: V3} | {k: 'i'};

/**
 * Terapkan operasi dengan kemajuan p (0..1).
 * Putaran: sudut bertahap. Pantulan & inversi: atom bergerak LURUS menembus bidang/titik.
 */
export const applyOp = (v: V3, op: SymOp, p: number): V3 => {
  if (p <= 0) return v;
  switch (op.k) {
    case 'E':
      return v;
    case 'C':
      return rotAxis(v, op.axis, op.angle * p);
    case 's':
      return lerp3(v, reflect(v, op.normal), p);
    case 'i':
      return lerp3(v, mul(v, -1), p);
  }
};
export const applyOps = (v: V3, ops: [SymOp, number][]) => ops.reduce((q, [op, p]) => applyOp(q, op, p), v);

/* ------------------------------------------------------------------ */
/* Render                                                                */
/* ------------------------------------------------------------------ */
/** Lencana nomor kecil di pojok kanan atas atom. */
const NumTag: React.FC<{x: number; y: number; n: string | number; size: number; opacity: number}> = ({x, y, n, size, opacity}) =>
  opacity <= 0.01 ? null : (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={size * 0.78} fill="#0b1022" stroke={C.ink} strokeOpacity={0.85} strokeWidth={2} />
      <text x={x} y={y + size * 0.04} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.mono} fontWeight={600} fontSize={size} fill={C.ink}>
        {n}
      </text>
    </g>
  );

/** Atom bola bergradasi + label unsur + nomor opsional. */
export const atomB = (
  cam: Cam,
  o: {pos: V3; el: string; r?: number; label?: string | null; n?: number | string; numOp?: number; opacity?: number; tint?: string; tintOp?: number; ghost?: boolean},
): Item | null => {
  const op = o.opacity ?? 1;
  if (op <= 0.005) return null;
  const p = proj(o.pos, cam);
  const rr = o.r ?? RAD[o.el] ?? 0.36;
  const R = rr * cam.s * p.f;
  const el = o.el in COL ? o.el : 'C';
  const text = o.label === undefined ? o.el : o.label;
  const dark = el === 'H' || el === 'F' || el === 'B' || el === 'S';
  if (o.ghost) {
    return {
      depth: p.depth + 5,
      el: <circle cx={p.X} cy={p.Y} r={R} fill={COL[el]} fillOpacity={0.08} stroke={C.ink} strokeOpacity={0.6} strokeWidth={2} strokeDasharray="6 6" opacity={op} />,
    };
  }
  const ns = Math.max(14, Math.min(22, R * 0.62));
  return {
    depth: p.depth - rr * 0.2,
    el: (
      <g opacity={op}>
        <circle cx={p.X} cy={p.Y} r={R} fill={`url(#syb-${el})`} />
        <ellipse cx={p.X - R * 0.32} cy={p.Y - R * 0.38} rx={R * 0.3} ry={R * 0.18} fill="#fff" opacity={0.4} transform={`rotate(-30 ${p.X - R * 0.32} ${p.Y - R * 0.38})`} />
        {o.tint && (o.tintOp ?? 0) > 0.01 ? <circle cx={p.X} cy={p.Y} r={R + 5} fill="none" stroke={o.tint} strokeWidth={5} opacity={o.tintOp} /> : null}
        {text ? (
          <text x={p.X} y={p.Y + R * 0.03} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.sans} fontWeight={700} fontSize={R * (text.length > 1 ? 0.62 : 0.78)} fill={dark ? '#1d2440' : '#fff'} opacity={0.92}>
            {text}
          </text>
        ) : null}
        {o.n !== undefined ? <NumTag x={p.X + R * 0.8} y={p.Y - R * 0.8} n={o.n} size={ns} opacity={o.numOp ?? 1} /> : null}
      </g>
    ),
  };
};

export type MolOpts = {
  ops?: [SymOp, number][];
  /** rotasi tampilan (setelah operasi), mis. putaran pelan seluruh molekul */
  view?: (v: V3) => V3;
  center?: V3;
  scale?: number;
  opacity?: number;
  numOp?: number;
  ghost?: boolean;
  labels?: boolean;
  bondColor?: string;
  tint?: (i: number) => [string, number] | null;
};

/** Posisi atom setelah operasi + rotasi tampilan + translasi. */
export const molPos = (m: SMol, o: MolOpts = {}): V3[] =>
  m.atoms.map((a) => {
    let q = mul(a.pos, o.scale ?? 1);
    if (o.ops) q = applyOps(q, o.ops);
    if (o.view) q = o.view(q);
    return add(q, o.center ?? [0, 0, 0]);
  });

export const molB = (cam: Cam, m: SMol, o: MolOpts = {}): Item[] => {
  const op = o.opacity ?? 1;
  if (op <= 0.005) return [];
  const P = molPos(m, o);
  const out: Item[] = [];
  if (!o.ghost) {
    for (const b of m.bonds) {
      const ra = (m.atoms[b[0]].r ?? RAD[m.atoms[b[0]].el] ?? 0.36) * 0.8;
      const rb = (m.atoms[b[1]].r ?? RAD[m.atoms[b[1]].el] ?? 0.36) * 0.8;
      const it = bond(cam, {a: P[b[0]], b: P[b[1]], order: b[2] ?? 1, color: o.bondColor, opacity: op, width: 0.11, trimA: ra, trimB: rb});
      if (it) out.push(it);
    }
  }
  m.atoms.forEach((a, i) => {
    const tn = o.tint?.(i);
    const it = atomB(cam, {
      pos: P[i],
      el: a.el,
      r: a.r,
      label: o.labels === false ? null : a.label,
      n: a.n,
      numOp: o.numOp ?? 1,
      opacity: op,
      ghost: o.ghost,
      tint: tn?.[0],
      tintOp: tn?.[1],
    });
    if (it) out.push(it);
  });
  return out;
};

/* ------------------------------------------------------------------ */
/* Unsur simetri                                                         */
/* ------------------------------------------------------------------ */
/**
 * Bidang cermin: jajaran genjang sian transparan (dipecah menjadi ubin agar urutan kedalaman benar).
 * u, v = arah di bidang; a, b = setengah panjang. p = tumbuh dari pusat.
 */
export const planeB = (
  cam: Cam,
  o: {center?: V3; u: V3; v: V3; a: number; b: number; opacity?: number; p?: number; color?: string; flash?: number; tiles?: number},
): Item[] => {
  const op = (o.opacity ?? 1) * Math.min(1, (o.p ?? 1) * 1.6);
  if (op <= 0.005) return [];
  const c = o.center ?? [0, 0, 0];
  const g = 0.35 + 0.65 * Math.min(1, o.p ?? 1);
  const u = mul(norm(o.u), o.a * g);
  const v = mul(norm(o.v), o.b * g);
  const col = o.color ?? C.cyan;
  const N = o.tiles ?? 4;
  const pt = (s: number, r: number) => add(c, add(mul(u, s), mul(v, r)));
  const out: Item[] = [];
  const fillOp = (0.12 + 0.16 * (o.flash ?? 0)) * op;
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) {
      const s0 = -1 + (2 * i) / N;
      const s1 = -1 + (2 * (i + 1)) / N;
      const r0 = -1 + (2 * j) / N;
      const r1 = -1 + (2 * (j + 1)) / N;
      const Q = [pt(s0, r0), pt(s1, r0), pt(s1, r1), pt(s0, r1)].map((q) => proj(q, cam));
      const mid = proj(pt((s0 + s1) / 2, (r0 + r1) / 2), cam);
      out.push({
        depth: mid.depth,
        el: <path d={`M${Q.map((q) => `${q.X.toFixed(1)},${q.Y.toFixed(1)}`).join(' L')} Z`} fill={col} fillOpacity={fillOp} />,
      });
    }
  const corners: [number, number][] = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];
  for (let k = 0; k < 4; k++) {
    const A = pt(...corners[k]);
    const B = pt(...corners[(k + 1) % 4]);
    for (let h = 0; h < 2; h++) {
      const PA = proj(lerp3(A, B, h / 2), cam);
      const PB = proj(lerp3(A, B, (h + 1) / 2), cam);
      out.push({
        depth: (PA.depth + PB.depth) / 2,
        el: <line x1={PA.X} y1={PA.Y} x2={PB.X} y2={PB.Y} stroke={col} strokeWidth={3} strokeOpacity={(0.7 + 0.3 * (o.flash ?? 0)) * op} strokeLinecap="round" />,
      });
    }
  }
  return out;
};

/** Titik layar dari posisi 3D (untuk menaruh label). */
export const scr = (cam: Cam, q: V3) => {
  const p = proj(q, cam);
  return [p.X, p.Y] as [number, number];
};

const basis = (u: V3): [V3, V3] => {
  const a: V3 = Math.abs(u[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const e1 = norm([u[1] * a[2] - u[2] * a[1], u[2] * a[0] - u[0] * a[2], u[0] * a[1] - u[1] * a[0]]);
  const e2: V3 = [u[1] * e1[2] - u[2] * e1[1], u[2] * e1[0] - u[0] * e1[2], u[0] * e1[1] - u[1] * e1[0]];
  return [e1, e2];
};

/**
 * Sumbu putar: garis melalui pusat + panah putar melingkar di dekat ujung atas.
 * spin = fase panah (radian, naik terus agar bergerak); arrow = opasitas panah putar.
 */
export const axisB = (
  cam: Cam,
  o: {dir: V3; len: number; center?: V3; p?: number; opacity?: number; color?: string; width?: number; spin?: number; arrow?: number; ringR?: number; ringAt?: number; dash?: boolean},
): Item[] => {
  const op = o.opacity ?? 1;
  const p = o.p ?? 1;
  if (op <= 0.005 || p <= 0.005) return [];
  const u = norm(o.dir);
  const c = o.center ?? [0, 0, 0];
  const col = o.color ?? C.gold;
  const L = o.len * p;
  const out: Item[] = [];
  const segs = 6;
  for (let k = 0; k < segs; k++) {
    const PA = proj(add(c, mul(u, -L + (2 * L * k) / segs)), cam);
    const PB = proj(add(c, mul(u, -L + (2 * L * (k + 1)) / segs)), cam);
    out.push({
      depth: (PA.depth + PB.depth) / 2 - 0.02,
      el: (
        <g opacity={op}>
          <line x1={PA.X} y1={PA.Y} x2={PB.X} y2={PB.Y} stroke="#05070e" strokeWidth={(o.width ?? 4) + 4} strokeLinecap="round" opacity={0.6} />
          <line x1={PA.X} y1={PA.Y} x2={PB.X} y2={PB.Y} stroke={col} strokeWidth={o.width ?? 4} strokeLinecap="round" strokeDasharray={o.dash ? '14 10' : undefined} />
        </g>
      ),
    });
  }
  const ar = (o.arrow ?? 0) * op;
  if (ar > 0.01) {
    const [e1, e2] = basis(u);
    const rr = o.ringR ?? 0.34;
    const at = add(c, mul(u, L * (o.ringAt ?? 0.82)));
    const ph = o.spin ?? 0;
    const n = 40;
    const sweep = 1.55 * Math.PI;
    const pts = Array.from({length: n + 1}, (_, i) => {
      const th = ph + (sweep * i) / n;
      return proj(add(at, add(mul(e1, rr * Math.cos(th)), mul(e2, rr * Math.sin(th)))), cam);
    });
    const d = pts.map((q, i) => `${i ? 'L' : 'M'}${q.X.toFixed(1)},${q.Y.toFixed(1)}`).join(' ');
    const e = pts[n];
    const e0 = pts[n - 3];
    const ang = Math.atan2(e.Y - e0.Y, e.X - e0.X);
    const hs = 14;
    const tip = `M${(e.X + Math.cos(ang) * hs).toFixed(1)},${(e.Y + Math.sin(ang) * hs).toFixed(1)} L${(e.X + Math.cos(ang + 2.4) * hs).toFixed(1)},${(e.Y + Math.sin(ang + 2.4) * hs).toFixed(1)} L${(e.X + Math.cos(ang - 2.4) * hs).toFixed(1)},${(e.Y + Math.sin(ang - 2.4) * hs).toFixed(1)} Z`;
    out.push({
      depth: proj(at, cam).depth - 0.5,
      el: (
        <g opacity={ar}>
          <path d={d} fill="none" stroke={col} strokeWidth={4} strokeLinecap="round" />
          <path d={tip} fill={col} />
        </g>
      ),
    });
  }
  return out;
};

/** Titik inversi (merah muda, berdenyut). Selalu digambar di depan. */
export const invPoint = (cam: Cam, o: {center?: V3; opacity?: number; t: number; r?: number}): Item | null => {
  const op = o.opacity ?? 1;
  if (op <= 0.005) return null;
  const P = proj(o.center ?? [0, 0, 0], cam);
  const r = o.r ?? 11;
  const pulse = 1 + 0.18 * Math.sin(o.t * 4);
  return {
    depth: -1000,
    el: (
      <g opacity={op}>
        <circle cx={P.X} cy={P.Y} r={r * 3.2 * pulse} fill="url(#syb-pink)" />
        <circle cx={P.X} cy={P.Y} r={r} fill={C.pink} stroke="#fff" strokeWidth={2.5} />
      </g>
    ),
  };
};

/** Garis putus merah muda dari setiap posisi ke bayangan inversinya (melalui pusat). */
export const invLines = (cam: Cam, pts: V3[], o: {center?: V3; opacity?: number; p?: number}): Item[] => {
  const op = o.opacity ?? 1;
  if (op <= 0.005) return [];
  const c = o.center ?? [0, 0, 0];
  const p = o.p ?? 1;
  return pts.map((q) => {
    const rel = sub(q, c);
    const A = proj(add(c, mul(rel, p)), cam);
    const B = proj(add(c, mul(rel, -p)), cam);
    return {
      depth: -900,
      el: <line x1={A.X} y1={A.Y} x2={B.X} y2={B.Y} stroke={C.pink} strokeWidth={2.5} strokeDasharray="9 8" opacity={0.75 * op} strokeLinecap="round" />,
    };
  });
};

/** Cincin riak 3D di bidang (u, v) berjari-jari r (pantulan menyapu bidang). */
export const ringB = (cam: Cam, o: {center?: V3; u: V3; v: V3; r: number; opacity?: number; color?: string; width?: number}): Item | null => {
  const op = o.opacity ?? 1;
  if (op <= 0.005 || o.r <= 0.01) return null;
  const c = o.center ?? [0, 0, 0];
  const u = norm(o.u);
  const v = norm(o.v);
  const n = 48;
  const P = Array.from({length: n + 1}, (_, i) => {
    const th = (2 * Math.PI * i) / n;
    return proj(add(c, add(mul(u, o.r * Math.cos(th)), mul(v, o.r * Math.sin(th)))), cam);
  });
  return {
    depth: -800,
    el: <path d={P.map((q, i) => `${i ? 'L' : 'M'}${q.X.toFixed(1)},${q.Y.toFixed(1)}`).join(' ')} fill="none" stroke={o.color ?? C.cyan} strokeWidth={o.width ?? 3} opacity={op} />,
  };
};

/** Tanda ✓ / ✗ (SVG). */
export const Mark: React.FC<{x: number; y: number; ok: boolean; p: number; size?: number; color?: string}> = ({x, y, ok, p, size = 44, color}) => {
  if (p <= 0.005) return null;
  const col = color ?? (ok ? C.mint : C.red);
  const s = size;
  const len = 200;
  const q = Math.min(1, p);
  return (
    <g opacity={Math.min(1, p * 2)} transform={`translate(${x} ${y}) scale(${0.7 + 0.3 * q})`}>
      <circle r={s} fill={col} fillOpacity={0.13} stroke={col} strokeWidth={4} />
      {ok ? (
        <path
          d={`M${-s * 0.45},${s * 0.02} L${-s * 0.1},${s * 0.36} L${s * 0.5},${-s * 0.34}`}
          fill="none"
          stroke={col}
          strokeWidth={s * 0.16}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={len}
          strokeDasharray={`${len} ${len}`}
          strokeDashoffset={len * (1 - q)}
        />
      ) : (
        <g stroke={col} strokeWidth={s * 0.16} strokeLinecap="round">
          <line x1={-s * 0.38} y1={-s * 0.38} x2={-s * 0.38 + s * 0.76 * Math.min(1, q * 2)} y2={-s * 0.38 + s * 0.76 * Math.min(1, q * 2)} />
          {q > 0.5 ? <line x1={s * 0.38} y1={-s * 0.38} x2={s * 0.38 - s * 0.76 * (q * 2 - 1)} y2={-s * 0.38 + s * 0.76 * (q * 2 - 1)} /> : null}
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Molekul contoh (geometri benar, satuan ≈ 100 pm, pusat massa di asal)  */
/* ------------------------------------------------------------------ */
const deg = Math.PI / 180;
const az = (k: number) => Math.PI / 2 + (2 * Math.PI * k) / 3;

/** H₂O di bidang xz, sumbu C₂ = z. O–H 0,96 Å, sudut 104,5°. */
export const H2O: SMol = centerCOM({
  atoms: [
    {el: 'O', pos: [0, 0, 0]},
    {el: 'H', pos: [-0.96 * Math.sin(52.25 * deg), 0, -0.96 * Math.cos(52.25 * deg)], n: 1},
    {el: 'H', pos: [0.96 * Math.sin(52.25 * deg), 0, -0.96 * Math.cos(52.25 * deg)], n: 2},
  ],
  bonds: [
    [0, 1],
    [0, 2],
  ],
});

/** NH₃ piramida, C₃ = z. N–H 1,01 Å, sudut H–N–H 107°. */
export const NH3: SMol = (() => {
  const s2 = (1 - Math.cos(107 * deg)) / 1.5;
  const s = Math.sqrt(s2);
  const c = Math.sqrt(1 - s2);
  return centerCOM({
    atoms: [{el: 'N', pos: [0, 0, 0]}, ...[0, 1, 2].map((k) => ({el: 'H', pos: mul([s * Math.cos(az(k)), s * Math.sin(az(k)), -c] as V3, 1.01), n: k + 1}))],
    bonds: [
      [0, 1],
      [0, 2],
      [0, 3],
    ],
  });
})();

/** BF₃ datar di bidang xy, C₃ = z. B–F 1,31 Å. */
export const BF3: SMol = {
  atoms: [{el: 'B', pos: [0, 0, 0]}, ...[0, 1, 2].map((k) => ({el: 'F', pos: [1.31 * Math.cos(az(k)), 1.31 * Math.sin(az(k)), 0] as V3, n: k + 1}))],
  bonds: [
    [0, 1],
    [0, 2],
    [0, 3],
  ],
};

/** CH₄ dengan H di sudut kubus berselang-seling → sumbu S₄ = z (membelah sudut H–C–H). C–H 1,09 Å. */
export const CH4_S4: SMol = (() => {
  const k = 1.09 / Math.sqrt(3);
  const H: V3[] = [
    [1, 1, 1],
    [-1, -1, 1],
    [1, -1, -1],
    [-1, 1, -1],
  ];
  return {
    atoms: [{el: 'C', pos: [0, 0, 0]}, ...H.map((h, i) => ({el: 'H', pos: mul(h, k), n: i + 1}))],
    bonds: [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
    ],
  };
})();

/** CH₄ dengan satu C–H tegak (sumbu C₃ = z). */
export const CH4_C3: SMol = (() => {
  const TH = Math.acos(-1 / 3);
  const dirs: V3[] = [[0, 0, 1], ...[0, 1, 2].map((k) => [Math.sin(TH) * Math.cos(az(k)), Math.sin(TH) * Math.sin(az(k)), Math.cos(TH)] as V3)];
  return {
    atoms: [{el: 'C', pos: [0, 0, 0]}, ...dirs.map((d) => ({el: 'H', pos: mul(d, 1.09)}))],
    bonds: [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
    ],
  };
})();

/** Benzena di bidang xy (C–C 1,39 Å, C–H 1,09 Å); karbon bernomor 1–6. */
export const BENZENE: SMol = {
  atoms: [
    ...[0, 1, 2, 3, 4, 5].map((k) => ({el: 'C', pos: [1.39 * Math.cos(Math.PI / 2 - (k * Math.PI) / 3), 1.39 * Math.sin(Math.PI / 2 - (k * Math.PI) / 3), 0] as V3, n: k + 1})),
    ...[0, 1, 2, 3, 4, 5].map((k) => ({el: 'H', pos: [2.48 * Math.cos(Math.PI / 2 - (k * Math.PI) / 3), 2.48 * Math.sin(Math.PI / 2 - (k * Math.PI) / 3), 0] as V3, label: null})),
  ],
  bonds: [
    [0, 1, 2],
    [1, 2],
    [2, 3, 2],
    [3, 4],
    [4, 5, 2],
    [5, 0],
    ...[0, 1, 2, 3, 4, 5].map((k) => [k, k + 6] as SBond),
  ],
};

/** CO₂ linear di sumbu x (C=O 1,16 Å). */
export const CO2: SMol = {
  atoms: [
    {el: 'C', pos: [0, 0, 0]},
    {el: 'O', pos: [-1.16, 0, 0], n: 1},
    {el: 'O', pos: [1.16, 0, 0], n: 2},
  ],
  bonds: [
    [0, 1, 2],
    [0, 2, 2],
  ],
};

/** H₂CO (formaldehida), C₂v: C=O 1,21 Å, C–H 1,11 Å, H–C–H 116,5°. */
export const H2CO: SMol = centerCOM({
  atoms: [
    {el: 'C', pos: [0, 0, 0]},
    {el: 'O', pos: [0, 0, 1.21]},
    {el: 'H', pos: [-1.11 * Math.sin(58.25 * deg), 0, -1.11 * Math.cos(58.25 * deg)], n: 1},
    {el: 'H', pos: [1.11 * Math.sin(58.25 * deg), 0, -1.11 * Math.cos(58.25 * deg)], n: 2},
  ],
  bonds: [
    [0, 1, 2],
    [0, 2],
    [0, 3],
  ],
});

/** [PtCl₄]²⁻ persegi datar di bidang xy (Pt–Cl ≈ 2,3 Å, digambar diperkecil). Cl bernomor 1–4. */
export const PTCL4: SMol = {
  atoms: [
    {el: 'Pt', pos: [0, 0, 0]},
    {el: 'Cl', pos: [1.6, 0, 0], n: 1},
    {el: 'Cl', pos: [0, 1.6, 0], n: 2},
    {el: 'Cl', pos: [-1.6, 0, 0], n: 3},
    {el: 'Cl', pos: [0, -1.6, 0], n: 4},
  ],
  bonds: [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
  ],
};

/** CHFClBr: H tegak; F, Cl, Br berselang 120° (azimut 90°, 210°, 330°). Ikatan digambar diperkecil. */
export const CHFCLBR: SMol = (() => {
  const TH = Math.acos(-1 / 3);
  const dir = (k: number): V3 => [Math.sin(TH) * Math.cos(az(k)), Math.sin(TH) * Math.sin(az(k)), Math.cos(TH)];
  return {
    atoms: [
      {el: 'C', pos: [0, 0, 0]},
      {el: 'H', pos: [0, 0, 1.0]},
      {el: 'F', pos: mul(dir(0), 1.2)},
      {el: 'Cl', pos: mul(dir(1), 1.4)},
      {el: 'Br', pos: mul(dir(2), 1.5)},
    ],
    bonds: [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
    ],
  };
})();
