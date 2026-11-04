// Komponen bersama adegan grup D video ikatan valensi (benzene, carbon, polymer, oxygen, recap, outro).
import React from 'react';
import {cyc, rand} from '../anim';
import {C, FONT} from '../theme';

const STROKE = {paintOrder: 'stroke' as const, stroke: 'rgba(4,6,12,0.85)'};

/** Satu lobus orbital (tetes) dari (x, y) ke arah sudut ang (derajat, 0 = ke atas). */
export const lobePath = (x: number, y: number, L: number, w: number, ang = 0) => {
  const a = (ang * Math.PI) / 180;
  const ux = Math.sin(a);
  const uy = -Math.cos(a);
  const nx = -uy;
  const ny = ux;
  const P = (s: number, n: number) => `${(x + ux * s + nx * n).toFixed(1)},${(y + uy * s + ny * n).toFixed(1)}`;
  return `M${x.toFixed(1)},${y.toFixed(1)} C${P(L * 0.3, -w)} ${P(L, -w * 0.95)} ${P(L, 0)} C${P(L, w * 0.95)} ${P(L * 0.3, w)} ${x.toFixed(1)},${y.toFixed(1)} Z`;
};

/** Orbital p (dua lobus): fase + emas, fase − ungu. ang 0 = tegak. */
export const POrb: React.FC<{x: number; y: number; L?: number; w?: number; ang?: number; opacity?: number; glow?: number}> = ({
  x,
  y,
  L = 70,
  w = 24,
  ang = 0,
  opacity = 1,
  glow = 0,
}) =>
  opacity <= 0.001 ? null : (
    <g opacity={opacity}>
      {glow > 0 ? (
        <>
          <path d={lobePath(x, y, L * 1.12, w * 1.5, ang)} fill={C.gold} opacity={0.18 * glow} />
          <path d={lobePath(x, y, L * 1.12, w * 1.5, ang + 180)} fill={C.violet} opacity={0.18 * glow} />
        </>
      ) : null}
      <path d={lobePath(x, y, L, w, ang)} fill={C.gold} fillOpacity={0.55} stroke={C.gold} strokeWidth={2} />
      <path d={lobePath(x, y, L, w, ang + 180)} fill={C.violet} fillOpacity={0.55} stroke={C.violet} strokeWidth={2} />
    </g>
  );

/** Titik sudut heksagon datar (rot dalam radian, 0 = titik di kanan). */
export const hexPts = (cx: number, cy: number, r: number, rot = -Math.PI / 2, sy = 1): [number, number][] =>
  Array.from({length: 6}, (_, k) => {
    const a = rot + (k * Math.PI) / 3;
    return [cx + r * Math.cos(a), cy + r * sy * Math.sin(a)];
  });

/** Struktur garis benzena datar: kekule 0 = rangkap di sisi 0,2,4; 1 = sisi 1,3,5; 'ring' = lingkaran (hibrida). */
export const HexIcon: React.FC<{x: number; y: number; r: number; mode: 0 | 1 | 'ring'; color?: string; opacity?: number; width?: number; rot?: number}> = ({
  x,
  y,
  r,
  mode,
  color = C.ink,
  opacity = 1,
  width = 4,
  rot = -Math.PI / 2,
}) => {
  const P = hexPts(x, y, r, rot);
  const Q = hexPts(x, y, r * 0.74, rot);
  return (
    <g opacity={opacity}>
      <polygon points={P.map((p) => p.join(',')).join(' ')} fill="none" stroke={color} strokeWidth={width} strokeLinejoin="round" />
      {mode === 'ring' ? (
        <circle cx={x} cy={y} r={r * 0.55} fill="none" stroke={C.amber} strokeWidth={width} />
      ) : (
        [0, 2, 4].map((k0) => {
          const k = (k0 + mode) % 6;
          const a = Q[k];
          const b = Q[(k + 1) % 6];
          const s = 0.14;
          return (
            <line
              key={k}
              x1={a[0] + (b[0] - a[0]) * s}
              y1={a[1] + (b[1] - a[1]) * s}
              x2={b[0] - (b[0] - a[0]) * s}
              y2={b[1] - (b[1] - a[1]) * s}
              stroke={C.amber}
              strokeWidth={width}
              strokeLinecap="round"
            />
          );
        })
      )}
    </g>
  );
};

/** Panah resonansi ↔ (dua kepala). */
export const ResArrow: React.FC<{x: number; y: number; w?: number; color?: string; opacity?: number}> = ({x, y, w = 90, color = C.ink, opacity = 1}) => (
  <g opacity={opacity}>
    <line x1={x - w / 2 + 14} y1={y} x2={x + w / 2 - 14} y2={y} stroke={color} strokeWidth={5} strokeLinecap="round" />
    <path d={`M${x + w / 2},${y} L${x + w / 2 - 20},${y - 12} L${x + w / 2 - 20},${y + 12} Z`} fill={color} />
    <path d={`M${x - w / 2},${y} L${x - w / 2 + 20},${y - 12} L${x - w / 2 + 20},${y + 12} Z`} fill={color} />
  </g>
);

/** Panah spin tegak kecil (sian naik / merah muda turun). */
export const Spin: React.FC<{x: number; y: number; up: boolean; len?: number; width?: number; opacity?: number}> = ({x, y, up, len = 44, width = 5, opacity = 1}) => {
  const col = up ? C.cyan : C.pink;
  const h = len / 2;
  const s = up ? 1 : -1;
  return (
    <g opacity={opacity}>
      <line x1={x} y1={y + s * h} x2={x} y2={y - s * (h - 12)} stroke={col} strokeWidth={width} strokeLinecap="round" />
      <path d={`M${x},${y - s * (h + 3)} L${x - 9},${y - s * (h - 14)} L${x + 9},${y - s * (h - 14)} Z`} fill={col} />
    </g>
  );
};

/** Kotak orbital kecil. */
export const Box: React.FC<{x: number; y: number; s?: number; color?: string; opacity?: number; lit?: number}> = ({x, y, s = 64, color = C.ink, opacity = 1, lit = 0}) => (
  <g opacity={opacity}>
    {lit > 0 ? <rect x={x - s / 2 - 8} y={y - s / 2 - 8} width={s + 16} height={s + 16} rx={12} fill={color} opacity={0.14 * lit} /> : null}
    <rect x={x - s / 2} y={y - s / 2} width={s} height={s} rx={8} fill="rgba(14,20,44,0.9)" stroke={color} strokeWidth={3} strokeOpacity={0.55 + 0.45 * lit} />
  </g>
);

/** Teks SVG kecil dengan subskrip/superskrip lewat tspan. parts: [teks, 'sub'|'sup'|undefined][] */
export const RichLabel: React.FC<{
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
}> = ({x, y, parts, size = 30, color = C.ink, anchor = 'middle', weight = 600, opacity = 1, font = 'sans', italic}) => (
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
    style={{...STROKE, strokeWidth: size * 0.12}}
  >
    {parts.map(([s, k], i) => (
      <tspan key={i} fontSize={k ? size * 0.64 : undefined} baselineShift={k === 'sub' ? '-25%' : k === 'sup' ? '45%' : undefined}>
        {s}
      </tspan>
    ))}
  </text>
);

/** Magnet tapal kuda terbalik (kutub di atas, celah di tengah). Mengembalikan geometri celah. */
export const HORSESHOE = (cx: number, top: number) => ({gapL: cx - 26, gapR: cx + 26, gapTop: top, gapBot: top + 74});
export const Horseshoe: React.FC<{cx: number; top: number; opacity?: number; t: number; field?: number}> = ({cx, top, opacity = 1, t, field = 0}) => {
  const armW = 84;
  const outer = 200;
  const bottom = top + 330;
  const g = HORSESHOE(cx, top);
  // badan U: path luar & dalam
  const ro = outer;
  const ri = outer - armW;
  const yc = bottom - ro;
  const body = `M${cx - ro},${top + 74} L${cx - ro},${yc} A${ro},${ro} 0 0 0 ${cx + ro},${yc} L${cx + ro},${top + 74} L${cx + ri},${top + 74} L${cx + ri},${yc} A${ri},${ri} 0 0 1 ${cx - ri},${yc} L${cx - ri},${top + 74} Z`;
  const poleL = `M${cx - ro},${top} L${g.gapL},${top + 14} L${g.gapL},${g.gapBot - 14} L${cx - ro},${g.gapBot} Z`;
  const poleR = `M${cx + ro},${top} L${g.gapR},${top + 14} L${g.gapR},${g.gapBot - 14} L${cx + ro},${g.gapBot} Z`;
  return (
    <g opacity={opacity}>
      <path d={body} fill="#7d879f" stroke="#c9d2ea" strokeOpacity={0.4} strokeWidth={2} />
      <path d={body} fill="url(#bond-grad)" opacity={0.5} />
      <path d={poleL} fill={C.red} stroke="#ffd0d8" strokeOpacity={0.4} strokeWidth={2} />
      <path d={poleR} fill={C.blue} stroke="#d0dcff" strokeOpacity={0.4} strokeWidth={2} />
      <text x={cx - ro + 40} y={top + 40} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.sans} fontWeight={800} fontSize={34} fill="#fff">
        U
      </text>
      <text x={cx + ro - 40} y={top + 40} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.sans} fontWeight={800} fontSize={34} fill="#fff">
        S
      </text>
      {/* garis medan tipis di celah (lengkung, bukan garis lurus berfilter) */}
      {field > 0
        ? [0, 1, 2].map((k) => {
            const y = g.gapTop + 20 + k * 17;
            const ph = (t * 0.8 + k * 0.33) % 1;
            return (
              <path
                key={k}
                d={`M${g.gapL - 2},${y} Q${cx},${y - 6 + k * 6} ${g.gapR + 2},${y}`}
                fill="none"
                stroke={C.violet}
                strokeWidth={2}
                strokeDasharray="6 6"
                strokeDashoffset={-ph * 12}
                opacity={0.7 * field}
              />
            );
          })
        : null}
    </g>
  );
};

/** Lampu kecil: on 0..1. */
export const Bulb: React.FC<{x: number; y: number; on: number; t: number; opacity?: number; r?: number}> = ({x, y, on, t, opacity = 1, r = 34}) => {
  const fl = 0.92 + 0.08 * Math.sin(t * 9) * Math.sin(t * 2.3);
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r * 3.4} fill="url(#soft-gold)" opacity={0.6 * on * fl} />
      <circle cx={x} cy={y} r={r} fill={on > 0 ? `rgba(255,214,120,${0.12 + 0.8 * on})` : 'rgba(255,214,120,0.12)'} stroke="#e8ecff" strokeOpacity={0.7} strokeWidth={3} />
      <path d={`M${x - 12},${y + 6} l6,-14 l6,14 l6,-14 l6,14`} transform={`translate(-6 0)`} fill="none" stroke={on > 0.3 ? '#fff6d0' : '#8c96bb'} strokeWidth={2.5} />
      <rect x={x - r * 0.5} y={y + r * 0.85} width={r} height={r * 0.55} rx={4} fill="#6a7494" />
      <line x1={x - r * 0.5} y1={y + r * 1.05} x2={x + r * 0.5} y2={y + r * 1.05} stroke="#3a4466" strokeWidth={2} />
    </g>
  );
};

/** Ikon kantong plastik. */
export const BagIcon: React.FC<{x: number; y: number; s?: number; t: number; opacity?: number}> = ({x, y, s = 1, t, opacity = 1}) => {
  const sway = 3 * Math.sin(t * 1.4);
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${sway})`} opacity={opacity}>
      <path d="M-70,-40 L70,-40 L84,100 Q0,118 -84,100 Z" fill="rgba(220,232,255,0.16)" stroke="#dfe7ff" strokeWidth={3} strokeLinejoin="round" />
      <path d="M-44,-40 Q-44,-100 -12,-100 Q12,-100 12,-60" fill="none" stroke="#dfe7ff" strokeWidth={6} strokeLinecap="round" />
      <path d="M44,-40 Q44,-100 12,-100" fill="none" stroke="#dfe7ff" strokeWidth={6} strokeLinecap="round" />
      <path d="M-50,-20 Q-40,40 -56,90" fill="none" stroke="#fff" strokeOpacity={0.25} strokeWidth={4} />
      <path d="M30,-10 Q46,40 36,92" fill="none" stroke="#fff" strokeOpacity={0.18} strokeWidth={3} />
    </g>
  );
};

/** Baterai kecil (+ panjang, − pendek) di garis datar. */
export const Battery: React.FC<{x: number; y: number; opacity?: number}> = ({x, y, opacity = 1}) => (
  <g opacity={opacity}>
    <rect x={x - 26} y={y - 30} width={52} height={60} fill="#04060c" />
    <line x1={x - 10} y1={y - 30} x2={x - 10} y2={y + 30} stroke={C.ink} strokeWidth={5} />
    <line x1={x + 10} y1={y - 16} x2={x + 10} y2={y + 16} stroke={C.ink} strokeWidth={9} />
    <text x={x - 24} y={y - 44} textAnchor="middle" fontFamily={FONT.sans} fontSize={26} fontWeight={700} fill={C.red}>
      +
    </text>
    <text x={x + 26} y={y - 44} textAnchor="middle" fontFamily={FONT.sans} fontSize={26} fontWeight={700} fill={C.blue}>
      −
    </text>
  </g>
);

/** Debu cahaya berkelip di sekitar titik (siklus halus). */
export const Motes: React.FC<{x: number; y: number; w: number; h: number; t: number; n?: number; color?: string; opacity?: number; seed?: number}> = ({
  x,
  y,
  w,
  h,
  t,
  n = 18,
  color = C.cyan,
  opacity = 1,
  seed = 1,
}) => (
  <g opacity={opacity}>
    {Array.from({length: n}, (_, k) => {
      const ph = (((t * (0.08 + 0.06 * rand(seed + k)) + rand(seed * 3 + k * 1.7)) % 1) + 1) % 1;
      return <circle key={k} cx={x - w / 2 + rand(seed * 7 + k * 5.1) * w} cy={y + h / 2 - ph * h} r={1.6 + 2 * rand(seed + k * 2.3)} fill={color} opacity={0.5 * cyc(ph)} />;
    })}
  </g>
);
