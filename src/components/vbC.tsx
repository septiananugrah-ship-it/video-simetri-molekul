import React from 'react';
import {C, FONT} from '../theme';

// Komponen 3D sederhana untuk adegan grup C (promosi, hibridisasi, pasangan bebas, bentuk molekul).
// Sumbu dunia: x kanan, y menjauh (ke dalam layar saat yaw = 0), z atas. 1 satuan ≈ 100 pm.

export type V3 = [number, number, number];
export type Cam = {cx: number; cy: number; s: number; yaw: number; pitch: number; persp?: number};

export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
export const lerp3 = (a: V3, b: V3, p: number): V3 => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p];
/** Putar vektor di sekitar sumbu x / y / z (radian). */
export const rotX = (v: V3, a: number): V3 => [v[0], v[1] * Math.cos(a) - v[2] * Math.sin(a), v[1] * Math.sin(a) + v[2] * Math.cos(a)];
export const rotY = (v: V3, a: number): V3 => [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)];
export const rotZ = (v: V3, a: number): V3 => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a), v[2]];

/** Proyeksi perspektif: yaw di sekitar z, lalu pitch (kamera menunduk). */
export const proj = (q: V3, cam: Cam) => {
  const {yaw, pitch} = cam;
  const x1 = q[0] * Math.cos(yaw) - q[1] * Math.sin(yaw);
  const d1 = q[0] * Math.sin(yaw) + q[1] * Math.cos(yaw);
  const z2 = q[2] * Math.cos(pitch) - d1 * Math.sin(pitch);
  const d2 = q[2] * Math.sin(pitch) + d1 * Math.cos(pitch);
  const P = cam.persp ?? 7;
  const f = P / (P + d2);
  return {X: cam.cx + x1 * cam.s * f, Y: cam.cy - z2 * cam.s * f, depth: d2, f};
};

/* ------------------------------------------------------------------ */
/* Arah geometri yang benar.                                            */
/* ------------------------------------------------------------------ */
const TH = Math.acos(-1 / 3); // 109,47°
/** Empat arah tetrahedral; satu tegak ke atas. */
export const TETRA: V3[] = [
  [0, 0, 1],
  ...[0, 1, 2].map((k) => [Math.sin(TH) * Math.cos((2 * Math.PI * k) / 3 + Math.PI / 2), Math.sin(TH) * Math.sin((2 * Math.PI * k) / 3 + Math.PI / 2), Math.cos(TH)] as V3),
];
/** Tiga arah ke bawah yang saling bersudut `deg` (piramida), dengan sumbu −z. */
export const pyramid = (deg: number, phase = Math.PI / 2): V3[] => {
  const s2 = Math.min(1, (1 - Math.cos((deg * Math.PI) / 180)) / 1.5);
  const s = Math.sqrt(s2);
  const c = Math.sqrt(1 - s2);
  return [0, 1, 2].map((k) => [s * Math.cos((2 * Math.PI * k) / 3 + phase), s * Math.sin((2 * Math.PI * k) / 3 + phase), -c] as V3);
};
/** Dua arah bengkok di bidang xz, sudut `deg`, simetris terhadap −z. */
export const bent = (deg: number): V3[] => {
  const h = ((deg / 2) * Math.PI) / 180;
  return [
    [-Math.sin(h), 0, -Math.cos(h)],
    [Math.sin(h), 0, -Math.cos(h)],
  ];
};

/* ------------------------------------------------------------------ */
/* Gradien bersama (pasang sekali di dalam <Stage>).                     */
/* ------------------------------------------------------------------ */
const LOBE_COL: Record<string, string> = {mint: C.mint, gold: C.gold, violet: C.violet, blue: C.blue, amber: C.amber, cyan: C.cyan, pink: C.pink, red: C.red};
const BALL_COL: Record<string, string> = {H: '#f2f5ff', C: '#59627a', N: '#4f7dff', O: '#ff4d63', F: '#8fe36a', B: '#ffab8a', Me: '#6b7590'};
const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v + (amt > 0 ? (255 - v) * amt : v * amt))));
  return `rgb(${ch((n >> 16) & 255)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
};
export type LobeColor = keyof typeof LOBE_COL;

export const VbDefs: React.FC = () => (
  <defs>
    {Object.entries(LOBE_COL).map(([k, col]) => (
      <radialGradient key={k} id={`vb-lobe-${k}`} cx="40%" cy="34%" r="75%">
        <stop offset="0%" stopColor={shade(col, 0.7)} />
        <stop offset="35%" stopColor={col} />
        <stop offset="100%" stopColor={shade(col, -0.55)} />
      </radialGradient>
    ))}
    {Object.entries(BALL_COL).map(([k, col]) => (
      <radialGradient key={k} id={`vb-ball-${k}`} cx="36%" cy="32%" r="72%">
        <stop offset="0%" stopColor={shade(col, 0.8)} />
        <stop offset="30%" stopColor={shade(col, 0.2)} />
        <stop offset="72%" stopColor={col} />
        <stop offset="100%" stopColor={shade(col, -0.65)} />
      </radialGradient>
    ))}
    <radialGradient id="vb-shadow">
      <stop offset="0%" stopColor="#000" stopOpacity="0.55" />
      <stop offset="100%" stopColor="#000" stopOpacity="0" />
    </radialGradient>
  </defs>
);

/* ------------------------------------------------------------------ */
/* Benda 3D sebagai "item" yang diurutkan menurut kedalaman.             */
/* ------------------------------------------------------------------ */
export type Item = {depth: number; el: React.ReactNode};

/** Gambar item dari yang terjauh ke terdekat. */
export const Render3D: React.FC<{items: (Item | null | false)[]; opacity?: number}> = ({items, opacity = 1}) => {
  if (opacity <= 0.001) return null;
  const list = items.filter((x): x is Item => !!x).sort((a, b) => b.depth - a.depth);
  return (
    <g opacity={opacity}>
      {list.map((it, i) => (
        <React.Fragment key={i}>{it.el}</React.Fragment>
      ))}
    </g>
  );
};

/** Profil lobus: hibrida (tetesan, ujung membulat), p (agak lebih ramping di inti). */
const PROFILE = {
  hybrid: (u: number) => Math.pow(Math.sin(Math.PI * Math.pow(u, 0.62)), 0.75),
  p: (u: number) => Math.pow(Math.sin(Math.PI * Math.pow(u, 0.8)), 0.85),
  cloud: (u: number) => Math.pow(Math.sin(Math.PI * u), 0.6),
};

/** Garis luar lobus = selubung (convex hull) proyeksi rangkaian bola sepanjang sumbu. */
const lobeOutline = (cam: Cam, origin: V3, dir: V3, len: number, wid: number, profile: keyof typeof PROFILE) => {
  const d = norm(dir);
  const N = 16;
  const circ = Array.from({length: N}, (_, i) => {
    const u = (i + 0.5) / N;
    const p = proj(add(origin, mul(d, u * len)), cam);
    return {x: p.X, y: p.Y, r: wid * PROFILE[profile](u) * cam.s * p.f};
  });
  const M = 56;
  const pts: string[] = [];
  for (let k = 0; k < M; k++) {
    const th = (2 * Math.PI * k) / M;
    const nx = Math.cos(th);
    const ny = Math.sin(th);
    let best = circ[0];
    let bv = -1e9;
    for (const c of circ) {
      const v = c.x * nx + c.y * ny + c.r;
      if (v > bv) {
        bv = v;
        best = c;
      }
    }
    pts.push(`${(best.x + best.r * nx).toFixed(1)},${(best.y + best.r * ny).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
};

/** Lobus orbital menghadap vektor 3D `dir` dari `origin`. */
export const lobe = (
  cam: Cam,
  o: {origin: V3; dir: V3; len: number; wid: number; color: LobeColor; opacity?: number; profile?: keyof typeof PROFILE; glow?: number; stroke?: string},
): Item | null => {
  const op = o.opacity ?? 0.9;
  if (op <= 0.005 || o.len <= 0.01) return null;
  const d = norm(o.dir);
  const mid = proj(add(o.origin, mul(d, o.len * 0.55)), cam);
  const path = lobeOutline(cam, o.origin, d, o.len, o.wid, o.profile ?? 'hybrid');
  const col = LOBE_COL[o.color];
  return {
    depth: mid.depth,
    el: (
      <g opacity={op}>
        {o.glow ? <path d={path} fill="none" stroke={col} strokeWidth={22} strokeOpacity={0.14 * o.glow} strokeLinejoin="round" /> : null}
        <path d={path} fill={`url(#vb-lobe-${o.color})`} stroke={o.stroke ?? shade(col, 0.45)} strokeWidth={2} strokeOpacity={0.8} strokeLinejoin="round" />
      </g>
    ),
  };
};

/** Orbital hibrida: lobus besar ke arah dir + lobus kecil di belakang. */
export const hybrid = (cam: Cam, o: {origin: V3; dir: V3; len: number; wid: number; color?: LobeColor; opacity?: number; glow?: number; small?: number}): Item[] => {
  const d = norm(o.dir);
  const k = o.small ?? 0.32;
  return [
    lobe(cam, {origin: o.origin, dir: d, len: o.len, wid: o.wid, color: o.color ?? 'mint', opacity: o.opacity, glow: o.glow}),
    k > 0 ? lobe(cam, {origin: o.origin, dir: mul(d, -1), len: o.len * k, wid: o.wid * 0.62, color: o.color ?? 'mint', opacity: (o.opacity ?? 0.9) * 0.75}) : null,
  ].filter((x): x is Item => !!x);
};

/** Orbital p (dua lobus, fase + emas / − ungu). */
export const pOrb = (cam: Cam, o: {origin: V3; dir: V3; len: number; wid: number; opacity?: number; glow?: number}): Item[] =>
  [
    lobe(cam, {origin: o.origin, dir: o.dir, len: o.len, wid: o.wid, color: 'gold', opacity: o.opacity, profile: 'p', glow: o.glow}),
    lobe(cam, {origin: o.origin, dir: mul(norm(o.dir), -1), len: o.len, wid: o.wid, color: 'violet', opacity: o.opacity, profile: 'p', glow: o.glow}),
  ].filter((x): x is Item => !!x);

/** Elipsoid putaran (awan π, kerapatan) dengan sumbu panjang `axis`. */
export const cloud = (cam: Cam, o: {center: V3; axis: V3; a: number; b: number; color: LobeColor; opacity?: number; glow?: number}): Item | null => {
  const op = o.opacity ?? 0.8;
  if (op <= 0.005) return null;
  const u = norm(o.axis);
  const c = proj(o.center, cam);
  const e = proj(add(o.center, mul(u, o.a)), cam);
  const dx = e.X - c.X;
  const dy = e.Y - c.Y;
  const la = Math.hypot(dx, dy);
  const A = o.a * cam.s * c.f;
  const B = o.b * cam.s * c.f;
  const sinG = Math.min(1, la / Math.max(A, 1e-6));
  const rx = Math.sqrt(A * A * sinG * sinG + B * B * (1 - sinG * sinG));
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  const col = LOBE_COL[o.color];
  return {
    depth: c.depth,
    el: (
      <g opacity={op} transform={`translate(${c.X.toFixed(1)} ${c.Y.toFixed(1)}) rotate(${ang.toFixed(2)})`}>
        {o.glow ? <ellipse rx={rx + 10} ry={B + 10} fill="none" stroke={col} strokeWidth={20} strokeOpacity={0.12 * o.glow} /> : null}
        <ellipse rx={rx} ry={B} fill={`url(#vb-lobe-${o.color})`} stroke={shade(col, 0.45)} strokeWidth={2} strokeOpacity={0.7} />
      </g>
    ),
  };
};

/** Bola orbital s. */
export const sphere = (cam: Cam, o: {center: V3; r: number; color: LobeColor; opacity?: number; glow?: number}): Item | null => {
  const op = o.opacity ?? 0.85;
  if (op <= 0.005) return null;
  const c = proj(o.center, cam);
  const R = o.r * cam.s * c.f;
  const col = LOBE_COL[o.color];
  return {
    depth: c.depth,
    el: (
      <g opacity={op}>
        {o.glow ? <circle cx={c.X} cy={c.Y} r={R + 12} fill="none" stroke={col} strokeWidth={22} strokeOpacity={0.14 * o.glow} /> : null}
        <circle cx={c.X} cy={c.Y} r={R} fill={`url(#vb-lobe-${o.color})`} stroke={shade(col, 0.45)} strokeWidth={2} strokeOpacity={0.8} />
      </g>
    ),
  };
};

/** Atom bola bergradasi (warna CPK). r dalam satuan dunia. */
export const ball = (cam: Cam, o: {pos: V3; el: keyof typeof BALL_COL | string; r?: number; label?: string | null; opacity?: number}): Item | null => {
  const op = o.opacity ?? 1;
  if (op <= 0.005) return null;
  const p = proj(o.pos, cam);
  const rr = o.r ?? (o.el === 'H' ? 0.3 : o.el === 'Me' ? 0.42 : 0.4);
  const R = rr * cam.s * p.f;
  const el = o.el in BALL_COL ? o.el : 'C';
  const text = o.label === undefined ? (o.el === 'Me' ? 'CH₃' : o.el) : o.label;
  const dark = el === 'H' || el === 'F' || el === 'B';
  return {
    depth: p.depth - rr * 0.2,
    el: (
      <g opacity={op}>
        <circle cx={p.X} cy={p.Y} r={R} fill={`url(#vb-ball-${el})`} />
        <ellipse cx={p.X - R * 0.32} cy={p.Y - R * 0.38} rx={R * 0.3} ry={R * 0.18} fill="#fff" opacity={0.4} transform={`rotate(-30 ${p.X - R * 0.32} ${p.Y - R * 0.38})`} />
        {text ? (
          <text x={p.X} y={p.Y + R * 0.03} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.sans} fontWeight={700} fontSize={R * (text.length > 2 ? 0.55 : 0.78)} fill={dark ? '#1d2440' : '#fff'} opacity={0.92}>
            {text}
          </text>
        ) : null}
      </g>
    ),
  };
};

/** Ikatan silinder (garis tebal bergradasi). order 2/3 → batang sejajar. */
export const bond = (cam: Cam, o: {a: V3; b: V3; width?: number; color?: string; opacity?: number; order?: number; trimA?: number; trimB?: number}): Item | null => {
  const op = o.opacity ?? 1;
  if (op <= 0.005) return null;
  const dir = norm(sub(o.b, o.a));
  const a3 = add(o.a, mul(dir, o.trimA ?? 0));
  const b3 = sub(o.b, mul(dir, o.trimB ?? 0));
  const A = proj(a3, cam);
  const B = proj(b3, cam);
  const f = (A.f + B.f) / 2;
  const w = (o.width ?? 0.13) * cam.s * f;
  const len = Math.hypot(B.X - A.X, B.Y - A.Y) || 1;
  const nx = -(B.Y - A.Y) / len;
  const ny = (B.X - A.X) / len;
  const order = o.order ?? 1;
  const gap = w * 1.25;
  const offs = order === 1 ? [0] : order === 2 ? [-gap / 2, gap / 2] : [-gap, 0, gap];
  const ww = order === 1 ? w : w * 0.66;
  const col = o.color ?? '#9aa6c6';
  return {
    depth: (A.depth + B.depth) / 2 + 0.05,
    el: (
      <g opacity={op}>
        {offs.map((off, i) => {
          const x1 = A.X + nx * off;
          const y1 = A.Y + ny * off;
          const x2 = B.X + nx * off;
          const y2 = B.Y + ny * off;
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#070a14" strokeWidth={ww + 4} strokeLinecap="round" />
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={shade(col.startsWith('#') ? col : '#9aa6c6', -0.35)} strokeWidth={ww} strokeLinecap="round" />
              <line x1={x1 - nx * ww * 0.1} y1={y1 - ny * ww * 0.1} x2={x2 - nx * ww * 0.1} y2={y2 - ny * ww * 0.1} stroke={col} strokeWidth={ww * 0.6} strokeLinecap="round" />
              <line x1={x1 - nx * ww * 0.22} y1={y1 - ny * ww * 0.22} x2={x2 - nx * ww * 0.22} y2={y2 - ny * ww * 0.22} stroke="#fff" strokeOpacity={0.4} strokeWidth={ww * 0.18} strokeLinecap="round" />
            </g>
          );
        })}
      </g>
    ),
  };
};

/** Titik 3D di sepanjang busur antara dua arah (untuk busur sudut). */
export const arcPts = (center: V3, u: V3, v: V3, r: number, n = 28): V3[] => {
  const a = norm(u);
  const b = norm(v);
  const om = Math.acos(Math.max(-1, Math.min(1, dot(a, b))));
  const so = Math.sin(om) || 1e-6;
  return Array.from({length: n + 1}, (_, i) => {
    const s = i / n;
    const k1 = Math.sin((1 - s) * om) / so;
    const k2 = Math.sin(s * om) / so;
    return add(center, mul(add(mul(a, k1), mul(b, k2)), r));
  });
};

/** Busur sudut 3D + label. Label dipasang di luar busur. */
export const angleArc = (
  cam: Cam,
  o: {center: V3; u: V3; v: V3; r: number; color?: string; opacity?: number; label?: string; size?: number; labelR?: number; p?: number; width?: number},
): Item | null => {
  const op = o.opacity ?? 1;
  if (op <= 0.005) return null;
  const pts = arcPts(o.center, o.u, o.v, o.r, 32);
  const nShow = Math.max(1, Math.round(32 * (o.p ?? 1)));
  const P = pts.slice(0, nShow + 1).map((q) => proj(q, cam));
  const d = P.map((p, i) => `${i ? 'L' : 'M'}${p.X.toFixed(1)},${p.Y.toFixed(1)}`).join(' ');
  const mid = arcPts(o.center, o.u, o.v, o.labelR ?? o.r * 1.6, 2)[1];
  const m = proj(mid, cam);
  const col = o.color ?? C.gold;
  const size = o.size ?? 40;
  return {
    depth: -50,
    el: (
      <g opacity={op}>
        <path d={d} fill="none" stroke={col} strokeWidth={o.width ?? 4} strokeLinecap="round" strokeLinejoin="round" />
        {o.label ? (
          <text
            x={m.X}
            y={m.Y}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={FONT.sans}
            fontWeight={700}
            fontSize={size}
            fill={col}
            style={{paintOrder: 'stroke', stroke: 'rgba(4,6,12,0.9)', strokeWidth: size * 0.16}}
            opacity={Math.min(1, (o.p ?? 1) * 1.5)}
          >
            {o.label}
          </text>
        ) : null}
      </g>
    ),
  };
};

/** Garis 3D tipis (kerangka kubus / tetrahedron); garis belakang putus-putus. */
export const wire = (cam: Cam, o: {a: V3; b: V3; color?: string; opacity?: number; width?: number; dashBack?: boolean}): Item | null => {
  const op = o.opacity ?? 1;
  if (op <= 0.005) return null;
  const A = proj(o.a, cam);
  const B = proj(o.b, cam);
  const dep = (A.depth + B.depth) / 2;
  const back = o.dashBack && dep > 0;
  return {
    depth: dep + 0.6,
    el: (
      <line
        x1={A.X}
        y1={A.Y}
        x2={B.X}
        y2={B.Y}
        stroke={o.color ?? C.muted}
        strokeWidth={(o.width ?? 2.5) * (back ? 0.75 : 1)}
        strokeDasharray={back ? '8 8' : undefined}
        opacity={op * (back ? 0.5 : 0.9)}
        strokeLinecap="round"
      />
    ),
  };
};

/** Bayangan lembut di "lantai" di bawah molekul (tanpa filter). */
export const Shadow: React.FC<{x: number; y: number; rx: number; ry?: number; opacity?: number}> = ({x, y, rx, ry, opacity = 1}) => (
  <ellipse cx={x} cy={y} rx={rx} ry={ry ?? rx * 0.22} fill="url(#vb-shadow)" opacity={0.8 * opacity} />
);

/** Elektron kecil (titik sian) di posisi 3D. */
export const dot3 = (cam: Cam, o: {pos: V3; r?: number; color?: string; opacity?: number}): Item | null => {
  const op = o.opacity ?? 1;
  if (op <= 0.005) return null;
  const p = proj(o.pos, cam);
  const R = (o.r ?? 7) * p.f;
  return {
    depth: p.depth - 0.3,
    el: (
      <g opacity={op}>
        <circle cx={p.X} cy={p.Y} r={R * 2.4} fill="url(#soft-cyan)" opacity={0.55} />
        <circle cx={p.X} cy={p.Y} r={R} fill={o.color ?? C.cyan} />
      </g>
    ),
  };
};

/** Label HTML-bebas di SVG dengan subskrip/superskrip (tspan). parts: [teks, 'sub'|'sup'|undefined][] */
export const SvgChem: React.FC<{
  x: number;
  y: number;
  parts: [string, ('sub' | 'sup')?][];
  size?: number;
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
  weight?: number;
  opacity?: number;
  font?: 'sans' | 'serif' | 'mono';
}> = ({x, y, parts, size = 40, color = C.ink, anchor = 'middle', weight = 600, opacity = 1, font = 'sans'}) => (
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
    style={{paintOrder: 'stroke', stroke: 'rgba(4,6,12,0.85)', strokeWidth: size * 0.12}}
  >
    {parts.map(([s, k], i) =>
      k ? (
        <tspan key={i} baselineShift={k === 'sub' ? 'sub' : 'super'} fontSize={size * 0.65}>
          {s}
        </tspan>
      ) : (
        <tspan key={i}>{s}</tspan>
      ),
    )}
  </text>
);

/* ------------------------------------------------------------------ */
/* Molekul bola-batang.                                                 */
/* ------------------------------------------------------------------ */
export type MAtom = {pos: V3; el: string; r?: number; label?: string | null; opacity?: number};
export type MBond = {a: number; b: number; order?: number; color?: string; opacity?: number; width?: number};

export const molItems = (cam: Cam, atoms: MAtom[], bonds: MBond[], opacity = 1): Item[] => {
  const out: Item[] = [];
  for (const b of bonds) {
    const it = bond(cam, {a: atoms[b.a].pos, b: atoms[b.b].pos, order: b.order, color: b.color, width: b.width, opacity: (b.opacity ?? 1) * opacity});
    if (it) out.push(it);
  }
  for (const a of atoms) {
    const it = ball(cam, {pos: a.pos, el: a.el, r: a.r, label: a.label, opacity: (a.opacity ?? 1) * opacity});
    if (it) out.push(it);
  }
  return out;
};

/** Metana: C di origin, H pada arah tetrahedral (jarak 1,09 → 109 pm). */
export const methane = (cam: Cam, o: {center?: V3; opacity?: number; bondColor?: string; hOpacity?: number; dist?: number} = {}): Item[] => {
  const c = o.center ?? [0, 0, 0];
  const d = o.dist ?? 1.09;
  const atoms: MAtom[] = [{pos: c, el: 'C'}, ...TETRA.map((v) => ({pos: add(c, mul(v, d)), el: 'H', opacity: o.hOpacity ?? 1}))];
  const bonds: MBond[] = [1, 2, 3, 4].map((i) => ({a: 0, b: i, color: o.bondColor, opacity: o.hOpacity ?? 1}));
  return molItems(cam, atoms, bonds, o.opacity ?? 1);
};
