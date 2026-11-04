import React from 'react';
import {C, FONT} from '../theme';
import {type Cam, type Item, type MAtom, type MBond, type V3, add, ball, bond, mul, norm, proj, sub} from './vbC';

// Utilitas grup D (kepolaran, getaran IR, gas rumah kaca, rangkuman):
// molekul 3D generik, mode getaran = pergeseran atom sinusoidal per frame,
// momen dipol dari muatan parsial (μ = Σ q·r → menunjuk dari δ− ke δ+, konvensi IUPAC).

export type Mol = {atoms: (MAtom & {q?: number; m?: number})[]; bonds: MBond[]};
/** Mode getaran: vektor pergeseran per atom (satuan dunia pada amplitudo 1). */
export type Mode = V3[];

const MASS: Record<string, number> = {H: 1, C: 12, N: 14, O: 16, F: 19, B: 11};

/* ------------------------------------------------------------------ */
/* Geometri (1 satuan ≈ 100 pm).                                         */
/* ------------------------------------------------------------------ */
const HOH = (104.5 / 2) * (Math.PI / 180);
const OH = 0.96;
/** H₂O di bidang xz; O di bawah, H di atas (sumbu C₂ = z). O δ−, H δ+. */
export const water = (): Mol => {
  const O: V3 = [0, 0, -0.22];
  return {
    atoms: [
      {pos: O, el: 'O', q: -0.66},
      {pos: add(O, [-OH * Math.sin(HOH), 0, OH * Math.cos(HOH)]), el: 'H', q: 0.33},
      {pos: add(O, [OH * Math.sin(HOH), 0, OH * Math.cos(HOH)]), el: 'H', q: 0.33},
    ],
    bonds: [
      {a: 0, b: 1},
      {a: 0, b: 2},
    ],
  };
};
/** CO₂ linear sepanjang x. O δ−, C δ+. */
export const co2 = (): Mol => ({
  atoms: [
    {pos: [0, 0, 0], el: 'C', q: 0.8},
    {pos: [-1.16, 0, 0], el: 'O', q: -0.4},
    {pos: [1.16, 0, 0], el: 'O', q: -0.4},
  ],
  bonds: [
    {a: 0, b: 1, order: 2},
    {a: 0, b: 2, order: 2},
  ],
});
/** BF₃ datar di bidang xy (σh), sumbu C₃ = z. F δ−, B δ+. */
export const bf3 = (): Mol => ({
  atoms: [
    {pos: [0, 0, 0], el: 'B', q: 0.9},
    ...[0, 1, 2].map((k) => ({pos: [1.31 * Math.cos((2 * Math.PI * k) / 3 + Math.PI / 2), 1.31 * Math.sin((2 * Math.PI * k) / 3 + Math.PI / 2), 0] as V3, el: 'F', q: -0.3})),
  ],
  bonds: [1, 2, 3].map((b) => ({a: 0, b})),
});
const TH = Math.acos(-1 / 3);
const TET: V3[] = [[0, 0, 1], ...[0, 1, 2].map((k) => [Math.sin(TH) * Math.cos((2 * Math.PI * k) / 3 + Math.PI / 2), Math.sin(TH) * Math.sin((2 * Math.PI * k) / 3 + Math.PI / 2), Math.cos(TH)] as V3)];
/** CH₄ (Td). C δ−, H δ+ (C lebih elektronegatif). */
export const ch4 = (): Mol => ({
  atoms: [{pos: [0, 0, 0], el: 'C', q: -0.4}, ...TET.map((v) => ({pos: mul(v, 1.09), el: 'H', q: 0.1}))],
  bonds: [1, 2, 3, 4].map((b) => ({a: 0, b})),
});
/** NH₃ (C₃v): N di atas, tiga H di bawah. */
export const nh3 = (): Mol => {
  const a = (107 * Math.PI) / 180;
  const s = Math.sqrt(Math.min(1, (1 - Math.cos(a)) / 1.5));
  const c = Math.sqrt(1 - s * s);
  return {
    atoms: [
      {pos: [0, 0, 0.25], el: 'N', q: -0.9},
      ...[0, 1, 2].map((k) => ({pos: add([0, 0, 0.25], mul([s * Math.cos((2 * Math.PI * k) / 3 + Math.PI / 2), s * Math.sin((2 * Math.PI * k) / 3 + Math.PI / 2), -c], 1.01)), el: 'H', q: 0.3})),
    ],
    bonds: [1, 2, 3].map((b) => ({a: 0, b})),
  };
};
/** Diatomik homonuklir sepanjang x (N₂ rangkap tiga, O₂ rangkap dua). */
export const diatomic = (el: 'N' | 'O'): Mol => {
  const d = el === 'N' ? 1.1 : 1.21;
  return {
    atoms: [
      {pos: [-d / 2, 0, 0], el, q: 0},
      {pos: [d / 2, 0, 0], el, q: 0},
    ],
    bonds: [{a: 0, b: 1, order: el === 'N' ? 3 : 2}],
  };
};

/* ------------------------------------------------------------------ */
/* Mode getaran (pusat massa tetap).                                    */
/* ------------------------------------------------------------------ */
const massOf = (a: {el: string; m?: number}) => a.m ?? MASS[a.el] ?? 12;
/** Tambahkan pergeseran atom pusat agar pusat massa diam. */
const balance = (mol: Mol, d: Mode, centre = 0): Mode => {
  const out = d.map((v) => [...v] as V3);
  let px = 0;
  let py = 0;
  let pz = 0;
  mol.atoms.forEach((a, i) => {
    if (i === centre) return;
    px += massOf(a) * d[i][0];
    py += massOf(a) * d[i][1];
    pz += massOf(a) * d[i][2];
  });
  const M = massOf(mol.atoms[centre]);
  out[centre] = [-px / M, -py / M, -pz / M];
  return out;
};

export type WaterMode = 'sym' | 'bend' | 'asym';
/** Tiga mode normal H₂O (skematis). */
export const waterMode = (kind: WaterMode): Mode => {
  const m = water();
  const u1 = norm(sub(m.atoms[1].pos, m.atoms[0].pos));
  const u2 = norm(sub(m.atoms[2].pos, m.atoms[0].pos));
  // tegak lurus ikatan di bidang molekul, menutup sudut HOH
  const p1: V3 = [u1[2], 0, -u1[0]];
  const p2: V3 = [-u2[2], 0, u2[0]];
  const d: Mode =
    kind === 'sym' ? [[0, 0, 0], u1, u2] : kind === 'asym' ? [[0, 0, 0], u1, mul(u2, -1)] : [[0, 0, 0], mul(p1, 1.4), mul(p2, 1.4)];
  return balance(m, d);
};

export type CO2Mode = 'sym' | 'asym' | 'bendZ' | 'bendY';
/** Empat mode normal CO₂: ν₁ simetris, ν₃ asimetris, ν₂ tekukan (dua arah, sama energi). */
export const co2Mode = (kind: CO2Mode): Mode => {
  const m = co2();
  if (kind === 'sym') return [[0, 0, 0], [-1, 0, 0], [1, 0, 0]];
  if (kind === 'asym') return balance(m, [[0, 0, 0], [-1, 0, 0], [-1, 0, 0]]);
  const dir: V3 = kind === 'bendZ' ? [0, 0, -1] : [0, -1, 0];
  return balance(m, [[0, 0, 0], mul(dir, 1.3), mul(dir, 1.3)]);
};

/** Molekul dengan atom bergeser sinusoidal: amplitudo `amp`, fase `ph` (radian). */
export const vibrate = (mol: Mol, mode: Mode, amp: number, ph: number): Mol => ({
  ...mol,
  atoms: mol.atoms.map((a, i) => ({...a, pos: add(a.pos, mul(mode[i] ?? [0, 0, 0], amp * Math.sin(ph)))})),
});

/** Momen dipol μ = Σ qᵢ rᵢ (menunjuk dari δ− ke δ+). */
export const dipole = (mol: Mol): V3 => mol.atoms.reduce<V3>((s, a) => add(s, mul(a.pos, a.q ?? 0)), [0, 0, 0]);

/** Transformasi kaku molekul (geser + putar dengan fungsi). */
export const place = (mol: Mol, f: (v: V3) => V3): Mol => ({...mol, atoms: mol.atoms.map((a) => ({...a, pos: f(a.pos)}))});

/** Item 3D bola-batang. */
export const molItems3 = (cam: Cam, mol: Mol, o: {opacity?: number; labels?: boolean; r?: number} = {}): Item[] => {
  const op = o.opacity ?? 1;
  const out: Item[] = [];
  for (const b of mol.bonds) {
    const it = bond(cam, {a: mol.atoms[b.a].pos, b: mol.atoms[b.b].pos, order: b.order, color: b.color, width: b.width, opacity: (b.opacity ?? 1) * op});
    if (it) out.push(it);
  }
  for (const a of mol.atoms) {
    const it = ball(cam, {pos: a.pos, el: a.el, r: a.r ?? o.r, label: o.labels === false ? null : a.label, opacity: (a.opacity ?? 1) * op});
    if (it) out.push(it);
  }
  return out;
};

/* ------------------------------------------------------------------ */
/* Panah & bidang.                                                      */
/* ------------------------------------------------------------------ */
/** Panah 2D dengan kepala yang mengecil mulus bila panahnya pendek (bisa melewati nol). */
export const Vec: React.FC<{x1: number; y1: number; x2: number; y2: number; color?: string; width?: number; opacity?: number; head?: number; halo?: boolean}> = ({
  x1,
  y1,
  x2,
  y2,
  color = C.amber,
  width = 6,
  opacity = 1,
  head = 22,
  halo = true,
}) => {
  const L = Math.hypot(x2 - x1, y2 - y1);
  if (L < 0.5 || opacity <= 0.003) return null;
  const ux = (x2 - x1) / L;
  const uy = (y2 - y1) / L;
  const hl = Math.min(head, L * 0.6);
  const hw = hl * 0.55;
  const bx = x2 - ux * hl * 0.85;
  const by = y2 - uy * hl * 0.85;
  const fade = Math.min(1, L / 10);
  return (
    <g opacity={opacity * fade}>
      {halo ? <line x1={x1} y1={y1} x2={bx} y2={by} stroke={color} strokeWidth={width * 3} strokeOpacity={0.16} strokeLinecap="round" /> : null}
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <path d={`M${x2},${y2} L${x2 - ux * hl - uy * hw},${y2 - uy * hl + ux * hw} L${x2 - ux * hl + uy * hw},${y2 - uy * hl - ux * hw} Z`} fill={color} />
    </g>
  );
};

/** Panah 3D (diproyeksikan) sebagai item yang tampil di atas molekul. */
export const arrow3 = (cam: Cam, o: {a: V3; b: V3; color?: string; width?: number; opacity?: number; head?: number; depth?: number}): Item | null => {
  if ((o.opacity ?? 1) <= 0.003) return null;
  const A = proj(o.a, cam);
  const B = proj(o.b, cam);
  return {depth: o.depth ?? -40, el: <Vec x1={A.X} y1={A.Y} x2={B.X} y2={B.Y} color={o.color} width={o.width} opacity={o.opacity} head={o.head} />};
};

/** Momen ikatan: panah sejajar ikatan dari atom δ− ke atom δ+, digeser sedikit ke samping (layar). */
export const bondMoment = (cam: Cam, o: {from: V3; to: V3; color?: string; opacity?: number; offset?: number; trim?: number; width?: number; p?: number}): Item | null => {
  if ((o.opacity ?? 1) <= 0.003) return null;
  const A = proj(o.from, cam);
  const B = proj(o.to, cam);
  const L = Math.hypot(B.X - A.X, B.Y - A.Y) || 1;
  const ux = (B.X - A.X) / L;
  const uy = (B.Y - A.Y) / L;
  const off = o.offset ?? 30;
  const tr = o.trim ?? 0.18;
  const x1 = A.X + ux * L * tr - uy * off;
  const y1 = A.Y + uy * L * tr + ux * off;
  const p = o.p ?? 1;
  const x2 = x1 + ux * L * (1 - 2 * tr) * p;
  const y2 = y1 + uy * L * (1 - 2 * tr) * p;
  return {depth: -30, el: <Vec x1={x1} y1={y1} x2={x2} y2={y2} color={o.color ?? C.amber} width={o.width ?? 5} head={18} opacity={o.opacity} />};
};

/** Bidang cermin transparan (sian) berpusat `c` dengan arah tepi u, v (setengah-lebar w, h). */
export const plane3 = (cam: Cam, o: {c: V3; u: V3; v: V3; w: number; h: number; color?: string; opacity?: number; depth?: number}): Item | null => {
  const op = o.opacity ?? 1;
  if (op <= 0.003) return null;
  const corners = [
    [1, 1],
    [-1, 1],
    [-1, -1],
    [1, -1],
  ].map(([a, b]) => proj(add(o.c, add(mul(o.u, a * o.w), mul(o.v, b * o.h))), cam));
  const d = corners.map((p, i) => `${i ? 'L' : 'M'}${p.X.toFixed(1)},${p.Y.toFixed(1)}`).join(' ') + ' Z';
  const col = o.color ?? C.cyan;
  return {
    depth: o.depth ?? 0.2,
    el: <path d={d} fill={col} fillOpacity={0.1 * op} stroke={col} strokeOpacity={0.55 * op} strokeWidth={2} strokeLinejoin="round" />,
  };
};

/** Sumbu putar (emas) dengan panah putar kecil di ujung atas. */
export const axis3 = (cam: Cam, o: {a: V3; b: V3; color?: string; opacity?: number; t?: number; label?: string; ring?: number}): Item | null => {
  const op = o.opacity ?? 1;
  if (op <= 0.003) return null;
  const A = proj(o.a, cam);
  const B = proj(o.b, cam);
  const col = o.color ?? C.gold;
  const ring = o.ring ?? 26;
  const sweep = ((o.t ?? 0) * 1.6) % (2 * Math.PI);
  const ry = ring * 0.32;
  const arc = (k: number) => {
    const th = 0.3 + sweep + k;
    return [B.X + ring * Math.cos(th), B.Y + 14 + ry * Math.sin(th)];
  };
  const pts = Array.from({length: 26}, (_, i) => arc((i / 25) * 4.4));
  const end = pts[pts.length - 1];
  const prev = pts[pts.length - 3];
  const ang = Math.atan2(end[1] - prev[1], end[0] - prev[0]);
  return {
    depth: -20,
    el: (
      <g opacity={op}>
        <line x1={A.X} y1={A.Y} x2={B.X} y2={B.Y} stroke={col} strokeWidth={3.5} strokeDasharray="12 8" strokeLinecap="round" />
        <g>
          <path d={pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')} fill="none" stroke={col} strokeWidth={3.5} strokeLinecap="round" />
          <path
            d={`M${end[0] + 10 * Math.cos(ang)},${end[1] + 10 * Math.sin(ang)} L${end[0] - 8 * Math.sin(ang)},${end[1] + 8 * Math.cos(ang)} L${end[0] + 8 * Math.sin(ang)},${end[1] - 8 * Math.cos(ang)} Z`}
            fill={col}
          />
        </g>
        {o.label ? (
          <text x={B.X + ring + 12} y={B.Y - 6} fontFamily={FONT.serif} fontStyle="italic" fontWeight={600} fontSize={34} fill={col} style={{paintOrder: 'stroke', stroke: 'rgba(4,6,12,0.85)', strokeWidth: 4}}>
            {o.label.slice(0, 1)}
            <tspan baselineShift="sub" fontSize={22}>
              {o.label.slice(1)}
            </tspan>
          </text>
        ) : null}
      </g>
    ),
  };
};

/* ------------------------------------------------------------------ */
/* Spektrum.                                                            */
/* ------------------------------------------------------------------ */
/** Teks satuan cm⁻¹ untuk SVG. */
export const CmInv: React.FC<{size?: number}> = ({size = 22}) => (
  <>
    cm
    <tspan baselineShift="super" fontSize={size * 0.65}>
      −1
    </tspan>
  </>
);

export type Peak = {nu: number; depth: number; width?: number; p: number; color?: string};
/**
 * Spektrum IR (transmitans): garis dasar di atas, pita serapan menukik ke bawah.
 * Sumbu ν̃ menurun ke kanan (konvensi IR). `draw` 0..1 = garis tergambar dari kiri.
 */
export const IRSpectrum: React.FC<{x: number; y: number; w: number; h: number; peaks: Peak[]; draw: number; nu0?: number; nu1?: number; t: number; opacity?: number; ticks?: number[]}> = ({
  x,
  y,
  w,
  h,
  peaks,
  draw,
  nu0 = 4000,
  nu1 = 1000,
  t,
  opacity = 1,
  ticks = [4000, 3500, 3000, 2500, 2000, 1500, 1000],
}) => {
  if (opacity <= 0.003) return null;
  const X = (nu: number) => x + ((nu0 - nu) / (nu0 - nu1)) * w;
  const N = 360;
  const nShow = Math.round(N * Math.max(0, Math.min(1, draw)));
  const pts: string[] = [];
  for (let k = 0; k <= nShow; k++) {
    const nu = nu0 + ((nu1 - nu0) * k) / N;
    let a = 0;
    for (const pk of peaks) a += pk.p * pk.depth * Math.exp(-(((nu - pk.nu) / (pk.width ?? 30)) ** 2));
    const yy = y + 14 + (h - 28) * Math.min(1, a) + 1.2 * Math.sin(nu * 0.09 + t * 3) * 0.6;
    pts.push(`${k ? 'L' : 'M'}${X(nu).toFixed(1)},${yy.toFixed(1)}`);
  }
  const head = nShow > 0 ? pts[pts.length - 1].slice(1).split(',').map(Number) : null;
  return (
    <g opacity={opacity}>
      <rect x={x - 10} y={y - 10} width={w + 20} height={h + 20} rx={14} fill="rgba(8,12,28,0.7)" stroke={C.faint} strokeWidth={1.5} />
      <line x1={x} y1={y + h} x2={x + w} y2={y + h} stroke={C.muted} strokeWidth={2} />
      {ticks.map((tk) => (
        <g key={tk}>
          <line x1={X(tk)} y1={y + h} x2={X(tk)} y2={y + h + 8} stroke={C.muted} strokeWidth={2} />
          <text x={X(tk)} y={y + h + 28} textAnchor="middle" fontFamily={FONT.mono} fontSize={19} fill={C.muted}>
            {tk}
          </text>
        </g>
      ))}
      {pts.length ? <path d={pts.join(' ')} fill="none" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" /> : null}
      {head ? <circle cx={head[0]} cy={head[1]} r={6} fill={C.gold} opacity={1 + (0.4 + 0.3 * Math.sin(t * 3) - 1) * Math.max(0, Math.min(1, (draw - 0.9) / 0.1))} /> : null}
    </g>
  );
};

/** Lencana grup titik bulat (SVG) — dipakai di rangkuman & penutup. */
export const PGBadge: React.FC<{x: number; y: number; main: string; sub?: string; r?: number; color?: string; opacity?: number; rot?: number}> = ({
  x,
  y,
  main,
  sub: s,
  r = 46,
  color = C.gold,
  opacity = 1,
  rot = 0,
}) => (
  <g opacity={opacity} transform={`rotate(${rot} ${x} ${y})`}>
    <circle cx={x} cy={y} r={r * 1.6} fill="url(#soft-gold)" opacity={0.35} />
    <circle cx={x} cy={y} r={r} fill="rgba(14,18,38,0.92)" stroke={color} strokeWidth={3} />
    <circle cx={x} cy={y} r={r - 7} fill="none" stroke={color} strokeWidth={1.2} strokeDasharray="3 5" opacity={0.7} />
    <text x={x} y={y + 2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.serif} fontStyle="italic" fontWeight={600} fontSize={r * 0.78} fill={color}>
      {main}
      {s ? (
        <tspan baselineShift="sub" fontSize={r * 0.48}>
          {s}
        </tspan>
      ) : null}
    </text>
  </g>
);

/** Centang (mint) / silang (merah) digambar sendiri (font tidak selalu punya ✓ ✗). */
export const Tick: React.FC<{x: number; y: number; ok: boolean; s?: number; opacity?: number; p?: number}> = ({x, y, ok, s = 26, opacity = 1, p = 1}) => {
  if (opacity <= 0.003 || p <= 0.003) return null;
  const col = ok ? C.mint : C.red;
  const len = 100;
  return (
    <g opacity={opacity} transform={`translate(${x} ${y}) scale(${s / 26})`}>
      <circle r={22} fill={col} fillOpacity={0.14} stroke={col} strokeOpacity={0.6} strokeWidth={2} />
      {ok ? (
        <path d="M-10,1 L-3,9 L11,-8" fill="none" stroke={col} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" pathLength={len} strokeDasharray={`${len} ${len}`} strokeDashoffset={len * (1 - p)} />
      ) : (
        <g strokeDasharray={`${len} ${len}`}>
          <path d="M-9,-9 L9,9" stroke={col} strokeWidth={5} strokeLinecap="round" pathLength={len} strokeDashoffset={len * (1 - Math.min(1, p * 2))} />
          <path d="M9,-9 L-9,9" stroke={col} strokeWidth={5} strokeLinecap="round" pathLength={len} strokeDashoffset={len * (1 - Math.max(0, p * 2 - 1))} />
        </g>
      )}
    </g>
  );
};

/** Riak cincin yang mengembang sekali (p 0..1). */
export const Ring: React.FC<{x: number; y: number; p: number; r?: number; color?: string}> = ({x, y, p, r = 70, color = C.mint}) =>
  p <= 0.001 || p >= 0.999 ? null : <circle cx={x} cy={y} r={r * (0.2 + 0.8 * p)} fill="none" stroke={color} strokeWidth={4 * (1 - p) + 1} opacity={(1 - p) * Math.min(1, p * 6)} />;
