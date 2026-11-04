// Komponen grup B (methane, water, huckel, butadiene, benzene): tingkat energi sederhana, pasangan elektron,
// spektrum fotoelektron tegak, rantai orbital p berkoefisien Hückel, lencana tanpa wajah.
import React from 'react';
import {C, FONT} from '../theme';
import {POrb, Spin} from './vbD';
import type {V3} from './vbC';

/** Garis tingkat energi dengan pendar napas (tanpa filter). */
export const Lvl: React.FC<{x: number; y: number; w?: number; color: string; p?: number; lit?: number; t: number; opacity?: number; width?: number}> = ({
  x,
  y,
  w = 130,
  color,
  p = 1,
  lit = 0,
  t,
  opacity = 1,
  width = 5,
}) => {
  if (p <= 0.001 || opacity <= 0.001) return null;
  const hw = (w / 2) * p;
  const br = 0.5 + 0.5 * Math.sin(t * 2.3 + y * 0.03 + x * 0.01);
  return (
    <g opacity={opacity}>
      {lit > 0.01 ? <ellipse cx={x} cy={y} rx={hw + 26} ry={26} fill={color} opacity={0.13 * lit * (0.7 + 0.3 * br)} /> : null}
      <line x1={x - hw} y1={y} x2={x + hw} y2={y} stroke={color} strokeWidth={18} strokeOpacity={0.07 + 0.05 * br + 0.28 * lit} strokeLinecap="round" />
      <line x1={x - hw} y1={y} x2={x + hw} y2={y} stroke={color} strokeWidth={width} strokeLinecap="round" />
    </g>
  );
};

/** Pasangan elektron di satu orbital: ↑ di kiri, ↓ di kanan (posisi tetap, tidak meloncat). a, b = 0..1 kedatangan. */
export const Pair: React.FC<{x: number; y: number; a: number; b: number; t: number; sp?: number; len?: number; drop?: number; opacity?: number}> = ({
  x,
  y,
  a,
  b,
  t,
  sp = 12,
  len = 38,
  drop = 70,
  opacity = 1,
}) => (
  <g opacity={opacity}>
    {[
      {p: a, up: true, dx: -sp},
      {p: b, up: false, dx: sp},
    ].map((e, i) => {
      if (e.p <= 0.001) return null;
      const j = 2.3 * Math.sin(t * 3 + i * 1.9 + x * 0.013);
      const flash = Math.sin(Math.PI * Math.min(1, e.p));
      const yy = y - (1 - e.p) * drop + (e.up ? j : -j);
      return (
        <g key={i} opacity={Math.min(1, e.p * 2.5)}>
          {flash > 0.02 ? <circle cx={x + e.dx} cy={yy} r={26} fill={e.up ? 'url(#soft-cyan)' : 'url(#soft-white)'} opacity={0.6 * flash} /> : null}
          <Spin x={x + e.dx} y={yy} up={e.up} len={len} width={4.5} />
        </g>
      );
    })}
  </g>
);

/** Spektrum fotoelektron tegak: energi ionisasi ke bawah (sejajar dengan tingkat MO), sinyal ke kanan. */
export type PesBox = {x: number; y0: number; y1: number; e0: number; e1: number; w: number};
export type Peak = [number, number, number]; // E (eV), tinggi, lebar σ
export const pesY = (b: PesBox, E: number) => b.y0 + ((E - b.e0) / (b.e1 - b.e0)) * (b.y1 - b.y0);
export const pesSig = (peaks: Peak[], E: number) => peaks.reduce((s, [e, h, w]) => s + h * Math.exp(-(((E - e) / w) ** 2)), 0);
export const PesV: React.FC<{b: PesBox; peaks: Peak[]; upto: number; t: number; opacity?: number; ticks?: number[]; color?: string}> = ({
  b,
  peaks,
  upto,
  t,
  opacity = 1,
  ticks = [],
  color = C.ink,
}) => {
  if (opacity <= 0.001) return null;
  const pts: [number, number][] = [];
  const n = 520;
  for (let i = 0; i <= n; i++) {
    const E = b.e0 + ((b.e1 - b.e0) * i) / n;
    if (E > upto) break;
    pts.push([b.x + pesSig(peaks, E) * b.w, pesY(b, E)]);
  }
  const d = pts.length > 1 ? 'M' + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L') : '';
  const area = pts.length > 1 ? `${d} L${b.x},${pts[pts.length - 1][1].toFixed(1)} L${b.x},${pts[0][1].toFixed(1)} Z` : '';
  const head = pts[pts.length - 1];
  return (
    <g opacity={opacity}>
      <line x1={b.x} y1={b.y0 - 10} x2={b.x} y2={b.y1 + 10} stroke={C.muted} strokeWidth={3} strokeLinecap="round" />
      <path d={`M${b.x - 10},${b.y1 - 6} L${b.x},${b.y1 + 14} L${b.x + 10},${b.y1 - 6}`} fill="none" stroke={C.muted} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
      {ticks.map((E) => (
        <g key={E}>
          <line x1={b.x - 8} y1={pesY(b, E)} x2={b.x} y2={pesY(b, E)} stroke={C.muted} strokeWidth={2.5} />
          <text x={b.x - 14} y={pesY(b, E)} textAnchor="end" dominantBaseline="central" fontFamily={FONT.mono} fontSize={19} fill={C.muted}>
            {E}
          </text>
        </g>
      ))}
      {area ? <path d={area} fill={C.cyan} opacity={0.1} /> : null}
      {d ? <path d={d} fill="none" stroke={color} strokeWidth={3.5} strokeLinejoin="round" /> : null}
      {head && upto < b.e1 - 0.01 ? <circle cx={head[0]} cy={head[1]} r={7 + 1.5 * Math.sin(t * 9)} fill={C.gold} /> : null}
    </g>
  );
};

/** Rantai orbital p tegak dengan koefisien c (ukuran lobus ∝ |c|, tanda → fase emas/ungu di atas). */
export const PChain: React.FC<{x0: number; y: number; dx: number; c: number[]; L?: number; opacity?: number; glow?: (k: number) => number}> = ({
  x0,
  y,
  dx,
  c,
  L = 105,
  opacity = 1,
  glow,
}) =>
  opacity <= 0.001 ? null : (
    <g opacity={opacity}>
      {c.map((v, k) => {
        const a = Math.abs(v);
        if (a < 0.01) return <circle key={k} cx={x0 + k * dx} cy={y} r={4} fill={C.muted} />;
        const len = L * a;
        return (
          <g key={k}>
            <POrb x={x0 + k * dx} y={y} L={len} w={len * 0.36 + 4} ang={v >= 0 ? 0 : 180} glow={glow ? glow(k) : 0} />
            <circle cx={x0 + k * dx} cy={y} r={5} fill="#c9d2ec" />
          </g>
        );
      })}
    </g>
  );

/** Posisi simpul (tanda koefisien berganti) di antara atom bertetangga, interpolasi linear. */
export const nodeXs = (x0: number, dx: number, c: number[]) => {
  const out: number[] = [];
  for (let k = 0; k < c.length - 1; k++) {
    if (c[k] * c[k + 1] < 0) out.push(x0 + dx * (k + Math.abs(c[k]) / (Math.abs(c[k]) + Math.abs(c[k + 1]))));
  }
  return out;
};

/** Garis simpul putus-putus merah (tegak). */
export const NodeLine: React.FC<{x: number; y: number; h?: number; p: number; t: number}> = ({x, y, h = 56, p, t}) =>
  p <= 0.001 ? null : (
    <line
      x1={x}
      y1={y - h * p}
      x2={x}
      y2={y + h * p}
      stroke={C.red}
      strokeWidth={3.5}
      strokeDasharray="7 7"
      strokeDashoffset={-t * 14}
      strokeLinecap="round"
      opacity={0.95 * p}
    />
  );

/** Lencana sejarah tanpa wajah: cincin titik berputar, ikon heksagon, nama & tahun. */
export const Medallion: React.FC<{x: number; y: number; r: number; t: number; opacity?: number; name: string; year: string}> = ({x, y, r, t, opacity = 1, name, year}) => {
  if (opacity <= 0.001) return null;
  const hex = Array.from({length: 6}, (_, k) => {
    const a = -Math.PI / 2 + (k * Math.PI) / 3 + 0.15 * Math.sin(t * 0.4);
    return `${(x + r * 0.34 * Math.cos(a)).toFixed(1)},${(y - r * 0.18 + r * 0.34 * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r * 1.5} fill="url(#soft-gold)" opacity={0.35 + 0.1 * Math.sin(t * 1.3)} />
      <circle cx={x} cy={y} r={r} fill="rgba(18,22,44,0.92)" stroke={C.gold} strokeWidth={Math.max(2, r * 0.035)} />
      <circle cx={x} cy={y} r={r * 0.86} fill="none" stroke={C.gold} strokeOpacity={0.45} strokeWidth={Math.max(1, r * 0.012)} />
      {Array.from({length: 36}, (_, k) => {
        const a = (k / 36) * 2 * Math.PI + t * 0.15;
        return <circle key={k} cx={x + r * 0.93 * Math.cos(a)} cy={y + r * 0.93 * Math.sin(a)} r={Math.max(1.2, r * 0.014)} fill={C.gold} opacity={0.5 + 0.5 * Math.sin(k * 0.9 + t * 2)} />;
      })}
      <polygon points={hex} fill="none" stroke={C.amber} strokeWidth={Math.max(2, r * 0.03)} strokeLinejoin="round" />
      <circle cx={x} cy={y - r * 0.18} r={r * 0.2} fill="none" stroke={C.amber} strokeWidth={Math.max(1.5, r * 0.022)} opacity={0.8} />
      <text x={x} y={y + r * 0.36} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.sans} fontWeight={700} fontSize={r * 0.2} fill={C.ink}>
        {name}
      </text>
      <text x={x} y={y + r * 0.6} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.mono} fontWeight={600} fontSize={r * 0.17} fill={C.gold}>
        {year}
      </text>
    </g>
  );
};

/** Busur lengkung (kuadratik) di layar dengan titik ujung; untuk interaksi β antar-orbital. */
export const ArcLink: React.FC<{x1: number; y1: number; x2: number; y2: number; lift: number; color: string; p: number; t: number; dash?: string; width?: number}> = ({
  x1,
  y1,
  x2,
  y2,
  lift,
  color,
  p,
  t,
  dash,
  width = 4,
}) => {
  if (p <= 0.001) return null;
  const mx = (x1 + x2) / 2;
  const my = Math.min(y1, y2) - lift;
  const d = `M${x1.toFixed(1)},${y1.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
  return (
    <g opacity={p}>
      <path d={d} fill="none" stroke={color} strokeWidth={width + 8} strokeOpacity={0.15} strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dash} strokeDashoffset={dash ? -t * 16 : undefined} />
      <circle cx={x1} cy={y1} r={6} fill={color} />
      <circle cx={x2} cy={y2} r={6} fill={color} />
    </g>
  );
};

/** Titik tengah busur ArcLink (untuk label). */
export const arcMid = (x1: number, y1: number, x2: number, y2: number, lift: number): [number, number] => [(x1 + x2) / 2, (y1 + y2) / 4 + (Math.min(y1, y2) - lift) / 2];

/** Empat arah tetrahedral sudut-kubus (dua H di atas, dua di bawah): pola t₂ = tanda koordinat x, y, z. */
const S3 = 1 / Math.sqrt(3);
export const CUBE_TETRA: V3[] = [
  [S3, S3, S3],
  [S3, -S3, -S3],
  [-S3, S3, -S3],
  [-S3, -S3, S3],
];

/** Lingkaran berbentuk parametrik di layar (untuk lingkaran Frost tergambar). */
export const circlePath = (cx: number, cy: number, r: number, start = Math.PI / 2) =>
  `M${(cx + r * Math.cos(start)).toFixed(1)},${(cy + r * Math.sin(start)).toFixed(1)} ` +
  `A${r},${r} 0 1 1 ${(cx + r * Math.cos(start + Math.PI)).toFixed(1)},${(cy + r * Math.sin(start + Math.PI)).toFixed(1)} ` +
  `A${r},${r} 0 1 1 ${(cx + r * Math.cos(start)).toFixed(1)},${(cy + r * Math.sin(start)).toFixed(1)}`;
