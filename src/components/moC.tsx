// Komponen diagram orbital molekul grup C (mixing, period2, ions, hetero, frontier).
// Gaya sama dengan diagram MO grup lain: kolom orbital atom kiri & kanan, MO di tengah,
// garis tingkat (σ sian, σ* merah, π jingga ganda, π* merah muda ganda), garis putus-putus penghubung,
// elektron panah ↑ sian / ↓ merah muda (Hund: semua ↑ dulu pada orbital degenerat). Energi kualitatif.
import React from 'react';
import {mix} from '../anim';
import {C, FONT} from '../theme';
import {RichLabel, Spin, lobePath} from './vbD';

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export type MOKind = 's' | 's*' | 'p' | 'p*' | 'ao';
export const KIND_COL: Record<MOKind, string> = {s: C.cyan, 's*': C.red, p: C.amber, 'p*': C.pink, ao: C.muted};

/** Posisi x pusat garis-garis degenerat. */
export const levelXs = (x: number, n: number, w: number, gap: number) => Array.from({length: n}, (_, i) => x + (i - (n - 1) / 2) * (w + gap));

/**
 * Garis tingkat energi: n garis degenerat (lebar w masing-masing) + elektron.
 * e = jumlah elektron (boleh pecahan → elektron ke-k muncul dengan opasitas e − k), urutan Hund.
 */
export const MOLevel: React.FC<{
  x: number;
  y: number;
  w?: number;
  n?: number;
  gap?: number;
  e?: number;
  color: string;
  opacity?: number;
  lit?: number;
  litColor?: string;
  t?: number;
  spin?: number;
  width?: number;
  draw?: number;
}> = ({x, y, w = 80, n = 1, gap = 16, e = 0, color, opacity = 1, lit = 0, litColor, t = 0, spin = 40, width = 5, draw = 1}) => {
  if (opacity <= 0.001) return null;
  const xs = levelXs(x, n, w, gap);
  const lc = litColor ?? color;
  return (
    <g opacity={opacity}>
      {lit > 0.001
        ? xs.map((cx, i) => (
            <rect key={`l${i}`} x={cx - w / 2 - 10} y={y - 30} width={w + 20} height={60} rx={14} fill={lc} opacity={(0.12 + 0.05 * Math.sin(t * 3)) * lit} />
          ))
        : null}
      {xs.map((cx, i) => (
        <line
          key={i}
          x1={cx - (w / 2) * draw}
          y1={y}
          x2={cx + (w / 2) * draw}
          y2={y}
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
          opacity={Math.min(1, draw * 12)}
        />
      ))}
      {Array.from({length: 2 * n}, (_, k) => {
        const p = clamp01(e - k);
        if (p <= 0.001) return null;
        const up = k < n;
        const cx = xs[k % n] + (up ? -spin * 0.22 : spin * 0.22);
        const bob = 2.2 * Math.sin(t * 2.1 + k * 1.7);
        return <Spin key={`e${k}`} x={cx} y={y - 2 + bob - (1 - p) * 26} up={up} len={spin} width={Math.max(3, spin * 0.11)} opacity={p} />;
      })}
    </g>
  );
};

/** Garis putus-putus penghubung (bergerak pelan). */
export const Dash: React.FC<{x1: number; y1: number; x2: number; y2: number; t?: number; opacity?: number; color?: string; width?: number}> = ({
  x1,
  y1,
  x2,
  y2,
  t = 0,
  opacity = 1,
  color = C.muted,
  width = 2,
}) =>
  opacity <= 0.001 ? null : (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={width} strokeDasharray="7 9" strokeDashoffset={-t * 14} opacity={0.55 * opacity} />
  );

/** Isi elektron berurutan (Aufbau) ke daftar kapasitas; e boleh pecahan. */
export const fillSeq = (e: number, caps: number[]) => {
  let left = e;
  return caps.map((c) => {
    const v = Math.max(0, Math.min(c, left));
    left -= v;
    return v;
  });
};

/* ------------------------------------------------------------------ */
/* Diagram valensi homonuklir periode 2 (2s + 2p).                      */
/* ------------------------------------------------------------------ */
export type HomoLevels = {s2: number; s2s: number; p: number; sp: number; ps: number; sps: number};

/**
 * mixP: 0 = urutan normal (σ2p di bawah π2p), 1 = tercampur (σ2p di atas π2p).
 * gap: tambahan celah 2s–2p (px, + = 2s lebih rendah).
 */
export const homoGeom = (mixP: number, gap = 0) => ({
  ao2s: 200 + gap,
  ao2p: -40,
  s2: 262 + gap + 14 * mixP,
  s2s: 140 + gap + 10 * mixP,
  p: 0,
  sp: mix(46, -56, mixP),
  ps: -96,
  sps: -172,
});

export const HomoDiagram: React.FC<{
  cx: number;
  cy: number;
  sc?: number;
  t: number;
  mixP?: number;
  gap?: number;
  e?: number;
  aoE?: number;
  mixedFill?: boolean;
  opacity?: number;
  atomL?: string;
  atomR?: string;
  colorAtom?: string;
  show?: {ao?: number; mo?: number; dash?: number; labels?: number};
  lit?: Partial<Record<keyof HomoLevels, number>>;
}> = ({cx, cy, sc = 1, t, mixP = 0, gap = 0, e = 0, aoE = 0, mixedFill, opacity = 1, atomL, atomR, colorAtom = C.ink, show = {}, lit = {}}) => {
  if (opacity <= 0.001) return null;
  const g = homoGeom(mixP, gap);
  const Y = (v: number) => cy + v * sc;
  const AX = 280 * sc;
  const ao = show.ao ?? 1;
  const mo = show.mo ?? 1;
  const dash = show.dash ?? 1;
  const lab = show.labels ?? 1;
  const wS = 80 * sc;
  const wP = 58 * sc;
  const gP = 18 * sc;
  const wA = 46 * sc;
  const gA = 12 * sc;
  const spin = 40 * sc;
  // urutan isi: tercampur → π sebelum σ2p
  const mixed = mixedFill ?? mixP > 0.5;
  const caps = mixed ? [2, 2, 4, 2, 4, 2] : [2, 2, 2, 4, 4, 2];
  const f = fillSeq(e, caps);
  const occ = mixed
    ? {s2: f[0], s2s: f[1], p: f[2], sp: f[3], ps: f[4], sps: f[5]}
    : {s2: f[0], s2s: f[1], sp: f[2], p: f[3], ps: f[4], sps: f[5]};
  const aoF = fillSeq(aoE, [2, 6]);
  const aoPhalf = 1.5 * wA + gA;
  const pHalf = wP + gP / 2;
  const levels: {k: keyof HomoLevels; kind: MOKind; n: number; lab: [string, ('sub' | 'sup')?][]}[] = [
    {k: 's2', kind: 's', n: 1, lab: [['σ'], ['2s']]},
    {k: 's2s', kind: 's*', n: 1, lab: [['σ*'], ['2s']]},
    {k: 'p', kind: 'p', n: 2, lab: [['π'], ['2p']]},
    {k: 'sp', kind: 's', n: 1, lab: [['σ'], ['2p']]},
    {k: 'ps', kind: 'p*', n: 2, lab: [['π*'], ['2p']]},
    {k: 'sps', kind: 's*', n: 1, lab: [['σ*'], ['2p']]},
  ];
  const half = (n: number) => (n === 2 ? pHalf : wS / 2);
  return (
    <g opacity={opacity}>
      {/* penghubung */}
      {levels.map((L) => {
        const from2s = L.k === 's2' || L.k === 's2s';
        const ya = Y(from2s ? g.ao2s : g.ao2p);
        const h = half(L.n);
        const aw = from2s ? wA / 2 : aoPhalf;
        return (
          <g key={`d${L.k}`}>
            <Dash x1={cx - AX + aw + 6 * sc} y1={ya} x2={cx - h - 8 * sc} y2={Y(g[L.k])} t={t} opacity={dash * mo} />
            <Dash x1={cx + AX - aw - 6 * sc} y1={ya} x2={cx + h + 8 * sc} y2={Y(g[L.k])} t={t} opacity={dash * mo} />
          </g>
        );
      })}
      {/* orbital atom */}
      {[-1, 1].map((s) => (
        <g key={s} opacity={ao}>
          <MOLevel x={cx + s * AX} y={Y(g.ao2s)} w={wA} color={C.muted} e={aoF[0]} t={t + s} spin={spin} width={4} />
          <MOLevel x={cx + s * AX} y={Y(g.ao2p)} w={wA} n={3} gap={gA} color={C.muted} e={aoF[1]} t={t + s} spin={spin} width={4} />
          <Label2 x={cx + s * (AX + aoPhalf + 14 * sc)} y={Y(g.ao2p)} anchor={s < 0 ? 'end' : 'start'} size={26 * sc} opacity={lab} color={C.muted}>
            2p
          </Label2>
          <Label2 x={cx + s * (AX + wA / 2 + 14 * sc)} y={Y(g.ao2s)} anchor={s < 0 ? 'end' : 'start'} size={26 * sc} opacity={lab} color={C.muted}>
            2s
          </Label2>
          {(s < 0 ? atomL : atomR) ? (
            <Label2 x={cx + s * AX} y={Y(g.sps) - 40 * sc} size={34 * sc} weight={700} color={colorAtom} opacity={lab}>
              {(s < 0 ? atomL : atomR) as string}
            </Label2>
          ) : null}
        </g>
      ))}
      {/* orbital molekul */}
      {levels.map((L) => (
        <g key={L.k} opacity={mo}>
          <MOLevel
            x={cx}
            y={Y(g[L.k])}
            w={L.n === 2 ? wP : wS}
            n={L.n}
            gap={gP}
            color={KIND_COL[L.kind]}
            e={occ[L.k]}
            t={t}
            spin={spin}
            lit={lit[L.k] ?? 0}
          />
          <RichLabel x={cx + half(L.n) + 14 * sc} y={Y(g[L.k])} parts={L.lab} size={24 * sc} color={KIND_COL[L.kind]} anchor="start" opacity={lab} font="serif" weight={600} />
        </g>
      ))}
    </g>
  );
};

/** Label SVG kecil dengan latar gelap. */
export const Label2: React.FC<{
  x: number;
  y: number;
  children: React.ReactNode;
  size?: number;
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
  weight?: number;
  opacity?: number;
  font?: 'sans' | 'mono' | 'serif';
}> = ({x, y, children, size = 26, color = C.ink, anchor = 'middle', weight = 600, opacity = 1, font = 'sans'}) =>
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
      style={{paintOrder: 'stroke', stroke: 'rgba(4,6,12,0.88)', strokeWidth: size * 0.14}}
    >
      {children}
    </text>
  );

/** Lobus orbital dua pusat: ukuran lobus = kontribusi tiap atom. ph: tanda fase kanan (1 sefase, −1 berlawanan). */
export const TwoLobe: React.FC<{x: number; y: number; d: number; rL: number; rR: number; ph?: 1 | -1; opacity?: number; t?: number; axis?: 'h' | 'v'}> = ({
  x,
  y,
  d,
  rL,
  rR,
  ph = 1,
  opacity = 1,
  t = 0,
}) => {
  if (opacity <= 0.001) return null;
  const br = 1 + 0.03 * Math.sin(t * 2.4);
  const colR = ph > 0 ? C.gold : C.violet;
  return (
    <g opacity={opacity}>
      <ellipse cx={x - d / 2} cy={y} rx={rL * br} ry={rL * 0.86 * br} fill={C.gold} fillOpacity={0.3} stroke={C.gold} strokeWidth={3} />
      <ellipse cx={x + d / 2} cy={y} rx={rR * br} ry={rR * 0.86 * br} fill={colR} fillOpacity={0.3} stroke={colR} strokeWidth={3} />
    </g>
  );
};

/** Lobus π (dua tetes atas–bawah per atom); sL, sR = skala kontribusi; ph = fase atom kanan. */
export const PiLobes: React.FC<{x: number; y: number; d: number; sL: number; sR: number; ph?: 1 | -1; opacity?: number; t?: number}> = ({
  x,
  y,
  d,
  sL,
  sR,
  ph = 1,
  opacity = 1,
  t = 0,
}) => {
  if (opacity <= 0.001) return null;
  const br = 1 + 0.035 * Math.sin(t * 2.2);
  const lobe = (cx: number, s: number, up: boolean, col: string, k: string) => (
    <path key={k} d={lobePath(cx, y, 92 * s * br, 54 * s * br, up ? 0 : 180)} fill={col} fillOpacity={0.32} stroke={col} strokeWidth={3} />
  );
  const top = (c: 1 | -1) => (c > 0 ? C.gold : C.violet);
  return (
    <g opacity={opacity}>
      {lobe(x - d / 2, sL, true, top(1), 'a')}
      {lobe(x - d / 2, sL, false, top(-1), 'b')}
      {lobe(x + d / 2, sR, true, top(ph), 'c')}
      {lobe(x + d / 2, sR, false, top(ph > 0 ? -1 : 1), 'd')}
    </g>
  );
};
