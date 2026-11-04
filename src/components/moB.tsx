// Diagram orbital molekul (grup B: h2, rules, p2, oxygen) — boleh dipakai adegan lain.
// Kolom orbital atom kiri/kanan, MO di tengah, garis putus-putus penghubung, elektron ↑↓ yang masuk bergiliran.
// Energi kualitatif (tidak berskala): posisi y diberikan langsung oleh adegan.
import React from 'react';
import {C, FONT} from '../theme';
import {RichLabel, Spin} from './vbD';

export type Parts = [string, ('sub' | 'sup')?][];
export type MOKind = 'sg' | 'sgs' | 'pi' | 'pis' | 'ao';

/** Warna tingkat: σ sian, σ* merah, π jingga, π* merah muda, orbital atom abu-biru. */
export const MO_COLOR: Record<MOKind, string> = {sg: C.cyan, sgs: C.red, pi: C.amber, pis: C.pink, ao: '#9fb3e6'};

/** Label orbital dengan subskrip: moLab('σ', '2s', true) → σ*₂ₛ. */
export const moLab = (g: string, sub: string, star = false): Parts => (star ? [[g], ['*', 'sup'], [sub, 'sub']] : [[g], [sub, 'sub']]);

export type MOLevel = {
  id: string;
  kind: MOKind;
  y: number;
  /** jumlah orbital degenerat (1, 2 untuk π, 3 untuk 2p atom) */
  n?: number;
  /** orbital atom: kolom kiri / kanan */
  side?: 'L' | 'R';
  label?: Parts;
  /** 0..1 garis tergambar */
  p?: number;
  /** 0..1 menyala */
  lit?: number;
  labelP?: number;
};
export type MOLink = {a: string; b: string; p: number};
export type MOElec = {
  at: string;
  k?: number;
  up: boolean;
  /** 0..1 kedatangan (jatuh dari atas, atau terbang dari orbital asal `src`) */
  p: number;
  o?: number;
  src?: string;
  sk?: number;
};
export type MOGeo = {cx: number; D: number; lw?: number; aw?: number; gap?: number; agap?: number; fs?: number; spin?: number; sp?: number; drop?: number};

/** Geometri satu tingkat: pusat tiap orbital degenerat dan ujung kiri/kanan kelompoknya. */
export const levelGeo = (g: MOGeo, lv: MOLevel) => {
  const ao = lv.kind === 'ao';
  const w = ao ? (g.aw ?? 70) : (g.lw ?? 120);
  const gap = ao ? (g.agap ?? 12) : (g.gap ?? 28);
  const n = lv.n ?? 1;
  const c = lv.side === 'L' ? g.cx - g.D : lv.side === 'R' ? g.cx + g.D : g.cx;
  const tot = n * w + (n - 1) * gap;
  const xs = Array.from({length: n}, (_, k) => c - tot / 2 + w / 2 + k * (w + gap));
  return {c, w, xs, x0: c - tot / 2, x1: c + tot / 2};
};

/** Posisi elektron di orbital (pasangan: ↑ kiri, ↓ kanan; sendiri: di tengah — tetap, tidak meloncat). */
const slotXY = (g: MOGeo, lv: MOLevel, k: number, up: boolean, count: number): [number, number] => {
  const {xs} = levelGeo(g, lv);
  const sp = g.sp ?? 12;
  const x = xs[Math.min(k, xs.length - 1)] + (count >= 2 ? (up ? -sp : sp) : 0);
  return [x, lv.y];
};

export const MODiagram: React.FC<{g: MOGeo; levels: MOLevel[]; links?: MOLink[]; elec?: MOElec[]; t: number; opacity?: number}> = ({
  g,
  levels,
  links = [],
  elec = [],
  t,
  opacity = 1,
}) => {
  if (opacity <= 0.001) return null;
  const byId = Object.fromEntries(levels.map((l) => [l.id, l]));
  const fs = g.fs ?? 26;
  const spin = g.spin ?? 38;
  const drop = g.drop ?? 90;
  const occ = (id: string, k: number) => elec.filter((e) => e.at === id && (e.k ?? 0) === k).length;
  const occSrc = (id: string, k: number) => elec.filter((e) => e.src === id && (e.sk ?? 0) === k).length;
  return (
    <g opacity={opacity}>
      {/* garis putus-putus penghubung (lurus, tanpa filter) */}
      {links.map((L, i) => {
        const a = byId[L.a];
        const b = byId[L.b];
        if (!a || !b || L.p <= 0.001) return null;
        const ga = levelGeo(g, a);
        const gb = levelGeo(g, b);
        const left = a.side === 'L';
        const xa = left ? ga.x1 + 4 : ga.x0 - 4;
        const xb = left ? gb.x0 - 4 : gb.x1 + 4;
        const xe = xa + (xb - xa) * L.p;
        const ye = a.y + (b.y - a.y) * L.p;
        return <line key={i} x1={xa} y1={a.y} x2={xe} y2={ye} stroke={C.muted} strokeOpacity={0.55} strokeWidth={2.2} strokeDasharray="7 7" />;
      })}
      {/* garis tingkat energi */}
      {levels.map((lv) => {
        const p = lv.p ?? 1;
        if (p <= 0.001) return null;
        const col = MO_COLOR[lv.kind];
        const {xs, w, c, x0, x1} = levelGeo(g, lv);
        const lit = lv.lit ?? 0;
        const breathe = 0.5 + 0.5 * Math.sin(t * 2.4 + lv.y * 0.05);
        const lp = lv.labelP ?? p;
        return (
          <g key={lv.id}>
            {xs.map((x, k) => {
              const hw = (w / 2) * p;
              return (
                <g key={k}>
                  <line x1={x - hw} y1={lv.y} x2={x + hw} y2={lv.y} stroke={col} strokeWidth={18} strokeOpacity={(0.07 + 0.05 * breathe + 0.3 * lit) * p} strokeLinecap="round" />
                  <line x1={x - hw} y1={lv.y} x2={x + hw} y2={lv.y} stroke={col} strokeWidth={lv.kind === 'ao' ? 4 : 5} strokeLinecap="round" />
                </g>
              );
            })}
            {lit > 0.01 ? <ellipse cx={c} cy={lv.y} rx={(x1 - x0) / 2 + 30} ry={30} fill={col} opacity={0.12 * lit * (0.7 + 0.3 * breathe)} /> : null}
            {lv.label && lp > 0.001 ? <RichLabel x={c} y={lv.y + fs * 1.5} parts={lv.label} size={fs} color={col} opacity={lp} font="serif" italic weight={600} /> : null}
          </g>
        );
      })}
      {/* elektron */}
      {elec.map((e, i) => {
        const lv = byId[e.at];
        if (!lv) return null;
        const o = (e.o ?? 1) * Math.min(1, e.src ? 1 : e.p * 2.5);
        if (o <= 0.001) return null;
        const k = e.k ?? 0;
        const [tx, ty] = slotXY(g, lv, k, e.up, occ(e.at, k));
        let x = tx;
        let y = ty - (1 - e.p) * drop;
        if (e.src && byId[e.src]) {
          const sk = e.sk ?? 0;
          const [sx, sy] = slotXY(g, byId[e.src], sk, e.up, occSrc(e.src, sk));
          const u = e.p;
          const mx = (sx + tx) / 2;
          const my = Math.min(sy, ty) - 50;
          x = (1 - u) * (1 - u) * sx + 2 * (1 - u) * u * mx + u * u * tx;
          y = (1 - u) * (1 - u) * sy + 2 * (1 - u) * u * my + u * u * ty;
        }
        const j = 2.4 * Math.sin(t * 3 + i * 1.7);
        const flash = Math.sin(Math.PI * Math.min(1, Math.max(0, e.p)));
        return (
          <g key={i} opacity={o}>
            {flash > 0.02 ? <circle cx={x} cy={y} r={30} fill={e.up ? 'url(#soft-cyan)' : 'url(#soft-white)'} opacity={0.6 * flash} /> : null}
            <Spin x={x} y={y + (e.up ? j : -j)} up={e.up} len={spin} width={4.5} />
          </g>
        );
      })}
    </g>
  );
};

/** Sumbu energi tegak dengan panah dan huruf E. */
export const EAxis: React.FC<{x: number; y0: number; y1: number; opacity?: number; label?: string}> = ({x, y0, y1, opacity = 1, label = 'E'}) =>
  opacity <= 0.001 ? null : (
    <g opacity={opacity}>
      <line x1={x} y1={y0} x2={x} y2={y1 + 12} stroke={C.muted} strokeWidth={3} strokeLinecap="round" />
      <path d={`M${x - 10},${y1 + 16} L${x},${y1} L${x + 10},${y1 + 16}`} fill="none" stroke={C.muted} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
      <text x={x} y={y1 - 22} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.serif} fontStyle="italic" fontSize={32} fill={C.muted}>
        {label}
      </text>
    </g>
  );

/** Tanda silang merah yang tergambar progresif (p 0..1). */
export const XMark: React.FC<{x: number; y: number; r?: number; p: number; width?: number; color?: string}> = ({x, y, r = 20, p, width = 7, color = C.red}) => {
  if (p <= 0.001) return null;
  const a = Math.min(1, p * 2);
  const b = Math.max(0, p * 2 - 1);
  return (
    <g>
      <line x1={x - r} y1={y - r} x2={x - r + 2 * r * a} y2={y - r + 2 * r * a} stroke={color} strokeWidth={width} strokeLinecap="round" />
      {b > 0 ? <line x1={x + r} y1={y - r} x2={x + r - 2 * r * b} y2={y - r + 2 * r * b} stroke={color} strokeWidth={width} strokeLinecap="round" /> : null}
    </g>
  );
};

/** Tanda centang (p 0..1). */
export const Check: React.FC<{x: number; y: number; r?: number; p: number; width?: number; color?: string}> = ({x, y, r = 22, p, width = 7, color = C.mint}) => {
  if (p <= 0.001) return null;
  const d = `M${x - r},${y} L${x - r * 0.3},${y + r * 0.7} L${x + r},${y - r * 0.7}`;
  return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="200 200" strokeDashoffset={200 * (1 - p)} pathLength={200} />;
};

/** Angka yang bergulir mulus (odometer) — tidak berganti mendadak. v boleh pecahan. */
export const Odometer: React.FC<{v: number; color?: string; size?: number}> = ({v, color = C.ink, size = 64}) => {
  const n = Math.floor(v + 1e-6);
  const f = v - n;
  return (
    <span style={{display: 'inline-block', height: size * 1.1, overflow: 'hidden', verticalAlign: 'middle', lineHeight: `${size * 1.1}px`, fontSize: size, color, fontVariantNumeric: 'tabular-nums'}}>
      <span style={{display: 'block', transform: `translateY(${-f * size * 1.1}px)`}}>
        <span style={{display: 'block', textAlign: 'center'}}>{n}</span>
        <span style={{display: 'block', textAlign: 'center'}}>{n + 1}</span>
      </span>
    </span>
  );
};

/** Satu lobus orbital p (r = L cos²θ) dari (x, y) ke arah ang (rad). */
export const pLobePath = (x: number, y: number, ang: number, L: number) => {
  const pts: string[] = [];
  const n = 48;
  for (let i = 0; i <= n; i++) {
    const th = -Math.PI / 2 + (Math.PI * i) / n;
    const r = L * Math.cos(th) ** 2;
    pts.push(`${i ? 'L' : 'M'}${(x + r * Math.cos(ang + th)).toFixed(1)},${(y + r * Math.sin(ang + th)).toFixed(1)}`);
  }
  return pts.join(' ') + ' Z';
};

/** Fase orbital p di titik (px, py): +1 di lobus `ang`, −1 di lobus berlawanan, 0 di luar. */
export const pPhase = (x: number, y: number, ang: number, L: number, px: number, py: number) => {
  const dx = px - x;
  const dy = py - y;
  const r = Math.hypot(dx, dy) || 1e-6;
  const c = (dx * Math.cos(ang) + dy * Math.sin(ang)) / r;
  return r <= L * c * c ? Math.sign(c) : 0;
};
