// Komponen grup D (pes, singlet, nitrogen, recap, outro): diagram MO mini, spektrum PES, ikon kecil.
import React from 'react';
import {rand} from '../anim';
import {C} from '../theme';
import {RichLabel, Spin} from './vbD';

export type MOKind = 'sigma' | 'sigmaStar' | 'pi' | 'piStar';
export const MO_COL: Record<MOKind, string> = {sigma: C.cyan, sigmaStar: C.red, pi: C.amber, piStar: C.pink};

type Parts = [string, ('sub' | 'sup')?][];

/** Label MO bersubskrip, mis. σ*2s → [['σ*'],['2s','sub']] */
export const moParts = (kind: MOKind, sub: string): Parts => [[kind === 'sigma' ? 'σ' : kind === 'sigmaStar' ? 'σ*' : kind === 'pi' ? 'π' : 'π*'], [sub, 'sub']];

/**
 * Satu tingkat MO. π/π* = dua garis degenerat berdampingan.
 * elec: isi per garis ('u' | 'd' | 'ud' | ''), diisi bergiliran (↑ di semua garis dulu, lalu ↓ — Hund).
 * ep: jumlah elektron yang sudah tampil (pecahan = memudar masuk).
 */
export const MOLevel: React.FC<{
  x: number;
  y: number;
  kind: MOKind;
  sub: string;
  elec?: string[];
  ep?: number;
  w?: number;
  t?: number;
  lit?: number;
  opacity?: number;
  label?: 'left' | 'right' | 'none';
  size?: number;
  hl?: string;
}> = ({x, y, kind, sub, elec, ep = 99, w = 120, t = 0, lit = 0, opacity = 1, label = 'right', size = 28, hl}) => {
  const col = hl ?? MO_COL[kind];
  const deg = kind === 'pi' || kind === 'piStar';
  const gap = 18;
  const lw = deg ? (w - gap) / 2 : w;
  const segs = deg ? [x - w / 2, x + gap / 2] : [x - w / 2];
  const fill = elec ?? segs.map(() => '');
  // urutan pengisian: semua ↑ dulu, lalu ↓
  const order: {s: number; up: boolean}[] = [];
  fill.forEach((e, s) => e.includes('u') && order.push({s, up: true}));
  fill.forEach((e, s) => e.includes('d') && order.push({s, up: false}));
  if (opacity <= 0.001) return null;
  return (
    <g opacity={opacity}>
      {segs.map((x0, s) => (
        <g key={s}>
          <line x1={x0} y1={y} x2={x0 + lw} y2={y} stroke={col} strokeWidth={16} strokeOpacity={0.07 + 0.25 * lit} strokeLinecap="round" />
          <line x1={x0} y1={y} x2={x0 + lw} y2={y} stroke={col} strokeWidth={5} strokeLinecap="round" />
        </g>
      ))}
      {order.map((o, k) => {
        const op = Math.max(0, Math.min(1, ep - k));
        if (op <= 0) return null;
        const pair = fill[o.s] === 'ud';
        const cx = segs[o.s] + lw / 2 + (pair ? (o.up ? -9 : 9) : 0);
        const j = 2.2 * Math.sin(t * 3 + k * 1.7 + x * 0.01);
        return <Spin key={k} x={cx} y={y - 20 + j - (1 - op) * 14} up={o.up} len={38} width={4} opacity={op} />;
      })}
      {label !== 'none' ? (
        <RichLabel
          x={label === 'right' ? x + w / 2 + 16 : x - w / 2 - 16}
          y={y}
          parts={moParts(kind, sub)}
          size={size}
          color={col}
          anchor={label === 'right' ? 'start' : 'end'}
          font="serif"
        />
      ) : null}
    </g>
  );
};

export type MOSpec = {kind: MOKind; sub: string; dy: number; elec?: string[]};

/** Diagram MO valensi N₂ (pencampuran s–p: σ2p di atas π2p). dy = tinggi di atas σ2s. */
export const N2_MO: MOSpec[] = [
  {kind: 'sigma', sub: '2s', dy: 0, elec: ['ud']},
  {kind: 'sigmaStar', sub: '2s', dy: 80, elec: ['ud']},
  {kind: 'pi', sub: '2p', dy: 190, elec: ['ud', 'ud']},
  {kind: 'sigma', sub: '2p', dy: 250, elec: ['ud']},
  {kind: 'piStar', sub: '2p', dy: 340, elec: ['', '']},
  {kind: 'sigmaStar', sub: '2p', dy: 420, elec: ['']},
];

/** Diagram MO valensi O₂ (urutan normal; π* ↑ ↑). */
export const O2_MO: MOSpec[] = [
  {kind: 'sigma', sub: '2s', dy: 0, elec: ['ud']},
  {kind: 'sigmaStar', sub: '2s', dy: 80, elec: ['ud']},
  {kind: 'sigma', sub: '2p', dy: 180, elec: ['ud']},
  {kind: 'pi', sub: '2p', dy: 240, elec: ['ud', 'ud']},
  {kind: 'piStar', sub: '2p', dy: 330, elec: ['u', 'u']},
  {kind: 'sigmaStar', sub: '2p', dy: 420, elec: ['']},
];

/** Tumpukan MO (tanpa kolom AO), y = posisi σ2s; scale untuk dy. */
export const MOStack: React.FC<{
  x: number;
  y: number;
  levels: MOSpec[];
  scale?: number;
  w?: number;
  t?: number;
  ep?: number;
  lit?: (i: number) => number;
  opacity?: (i: number) => number;
  size?: number;
  ao?: {dy2s: number; dy2p: number; label: string; dx?: number; opacity?: number};
}> = ({x, y, levels, scale = 1, w = 120, t = 0, ep = 99, lit, opacity, size = 28, ao}) => {
  let used = 0;
  const dx = ao?.dx ?? 220;
  const aoOp = ao?.opacity ?? 1;
  return (
    <g>
      {ao && aoOp > 0.001 ? (
        <g opacity={aoOp}>
          {[-1, 1].map((sd) => {
            const ax = x + sd * dx;
            const y2s = y - ao.dy2s * scale;
            const y2p = y - ao.dy2p * scale;
            return (
              <g key={sd}>
                <line x1={ax - 40} y1={y2s} x2={ax + 40} y2={y2s} stroke={C.muted} strokeWidth={4} strokeLinecap="round" />
                {[-1, 0, 1].map((k) => (
                  <line key={k} x1={ax + k * 30 - 12} y1={y2p} x2={ax + k * 30 + 12} y2={y2p} stroke={C.muted} strokeWidth={4} strokeLinecap="round" />
                ))}
                <RichLabel x={ax + sd * 62} y={y2s} parts={[['2s']]} size={22} color={C.muted} anchor={sd < 0 ? 'end' : 'start'} />
                <RichLabel x={ax + sd * 62} y={y2p} parts={[['2p']]} size={22} color={C.muted} anchor={sd < 0 ? 'end' : 'start'} />
                <RichLabel x={ax} y={y + 50} parts={[[ao.label]]} size={26} color={C.blue} weight={700} />
                {levels.map((L, i) => {
                  const ly = y - L.dy * scale;
                  const from = L.sub === '2s' ? y2s : y2p;
                  const ex = x + sd * (w / 2 + 6);
                  return <line key={i} x1={ax - sd * 46} y1={from} x2={ex} y2={ly} stroke={C.muted} strokeWidth={1.6} strokeDasharray="5 6" opacity={0.5} />;
                })}
              </g>
            );
          })}
        </g>
      ) : null}
      {levels.map((L, i) => {
        const n = (L.elec ?? []).reduce((a, e) => a + e.length, 0);
        const start = used;
        used += n;
        return (
          <MOLevel
            key={i}
            x={x}
            y={y - L.dy * scale}
            kind={L.kind}
            sub={L.sub}
            elec={L.elec}
            ep={ep - start}
            w={w}
            t={t}
            lit={lit ? lit(i) : 0}
            opacity={opacity ? opacity(i) : 1}
            size={size}
          />
        );
      })}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Spektrum fotoelektron N₂ (He I) — bentuk skematis dari nilai AUDIT. */
/* ------------------------------------------------------------------ */
const PEAKS: [number, number][] = [
  // σ2p (3σg): sempit, hampir hanya pita 0–0
  [15.58, 1.0],
  [15.85, 0.09],
  // π2p (1πu): deret getaran lebar
  [16.69, 0.5],
  [16.87, 0.62],
  [17.05, 0.52],
  [17.22, 0.36],
  [17.39, 0.2],
  [17.56, 0.09],
  // σ*2s (2σu): sempit
  [18.75, 0.46],
  [18.97, 0.09],
];
export const pesSignal = (E: number) => PEAKS.reduce((a, [e0, h]) => a + h * Math.exp(-(((E - e0) / 0.035) ** 2)), 0);

/** Kurva spektrum dari E0 sampai Eupto (eV). */
export const pesPath = (box: {x: number; y: number; w: number; h: number; e0: number; e1: number}, eUpto: number) => {
  const pts: [number, number][] = [];
  const n = 700;
  for (let i = 0; i <= n; i++) {
    const E = box.e0 + ((box.e1 - box.e0) * i) / n;
    if (E > eUpto) break;
    pts.push([box.x + ((E - box.e0) / (box.e1 - box.e0)) * box.w, box.y - pesSignal(E) * box.h]);
  }
  return pts.length > 1 ? 'M' + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L') : '';
};

/* ------------------------------------------------------------------ */
/* Ikon kecil                                                          */
/* ------------------------------------------------------------------ */

/** Molekul diatomik datar (dua bola) dengan ikatan n garis. */
export const Diatomic: React.FC<{x: number; y: number; d?: number; r?: number; color?: string; order?: number; rot?: number; opacity?: number}> = ({
  x,
  y,
  d = 30,
  r = 14,
  color = C.blue,
  order = 1,
  rot = 0,
  opacity = 1,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={opacity}>
    {Array.from({length: order}, (_, k) => {
      const o = (k - (order - 1) / 2) * 6;
      return <rect key={k} x={-d / 2} y={o - 1.5} width={d} height={3} fill="#c9d2ea" />;
    })}
    <circle cx={-d / 2} cy={0} r={r} fill={color} />
    <circle cx={d / 2} cy={0} r={r} fill={color} />
    <circle cx={-d / 2 - r * 0.3} cy={-r * 0.35} r={r * 0.3} fill="#fff" opacity={0.45} />
    <circle cx={d / 2 - r * 0.3} cy={-r * 0.35} r={r * 0.3} fill="#fff" opacity={0.45} />
  </g>
);

/** Api kecil bergoyang (size 0..1). */
export const Flame: React.FC<{x: number; y: number; s: number; t: number; seed?: number}> = ({x, y, s, t, seed = 1}) => {
  if (s <= 0.01) return null;
  const tongue = (k: number, h: number, w: number, col: string, op: number) => {
    const sw = 6 * Math.sin(t * 7 + k * 2 + seed) * s;
    const hh = h * s * (0.9 + 0.1 * Math.sin(t * 11 + k + seed * 3));
    return (
      <path
        key={k}
        d={`M${x - w * s},${y} C${x - w * s},${y - hh * 0.45} ${x + sw - w * 0.3 * s},${y - hh * 0.7} ${x + sw},${y - hh} C${x + sw + w * 0.3 * s},${y - hh * 0.7} ${x + w * s},${y - hh * 0.45} ${x + w * s},${y} Z`}
        fill={col}
        opacity={op}
      />
    );
  };
  return (
    <g>
      <circle cx={x} cy={y - 40 * s} r={110 * s} fill="url(#soft-gold)" opacity={0.5} />
      {tongue(0, 120, 34, C.red, 0.85)}
      {tongue(1, 96, 26, C.amber, 0.95)}
      {tongue(2, 62, 16, '#ffe9a8', 1)}
    </g>
  );
};

/** Bakteri batang kecil yang menggeliat. */
export const Bacterium: React.FC<{x: number; y: number; t: number; seed: number; s?: number; color?: string}> = ({x, y, t, seed, s = 1, color = C.mint}) => {
  const a = 30 * Math.sin(t * 1.3 + seed * 2.1) + rand(seed) * 180;
  const dx = 4 * Math.sin(t * 2 + seed);
  return (
    <g transform={`translate(${x + dx} ${y}) rotate(${a}) scale(${s})`}>
      <rect x={-16} y={-6} width={32} height={12} rx={6} fill={color} opacity={0.85} />
      <path d={`M16,0 q8,${4 * Math.sin(t * 6 + seed)} 14,0`} fill="none" stroke={color} strokeWidth={2} opacity={0.7} />
    </g>
  );
};

/** Gelembung siklus kecil (dipakai untuk aliran molekul). ph 0..1 */
export const flowPt = (ph: number, pts: [number, number][]): [number, number] => {
  const n = pts.length - 1;
  const f = Math.max(0, Math.min(0.9999, ph)) * n;
  const i = Math.floor(f);
  const u = f - i;
  return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u];
};

