// Komponen bersama adegan grup D (hydrogen, mercury, glow, manganese, laser, recap, outro).
import React from 'react';
import {interpolateColors} from 'remotion';
import {cyc, rand} from '../anim';
import {C, FONT} from '../theme';
import {Sub, Sup} from './primitives';
import {wlColor} from './viz';

const STROKE = {paintOrder: 'stroke' as const, stroke: 'rgba(4,6,12,0.85)'};

/** Simbol term di SVG: ²ˢ⁺¹L_J dengan tspan baselineShift (S ungu, L emas, J mint). */
export const TermSVG: React.FC<{
  x: number;
  y: number;
  mult: string | number;
  L: string;
  J?: string;
  size?: number;
  anchor?: 'start' | 'middle' | 'end';
  opacity?: number;
  mono?: string; // satu warna untuk semua bagian
  odd?: boolean;
}> = ({x, y, mult, L, J, size = 44, anchor = 'middle', opacity = 1, mono, odd}) => (
  <text
    x={x}
    y={y}
    textAnchor={anchor}
    dominantBaseline="central"
    fontFamily={FONT.serif}
    fontSize={size}
    fill={mono ?? C.gold}
    opacity={opacity}
    style={{...STROKE, strokeWidth: size * 0.1}}
  >
    <tspan fontSize={size * 0.62} baselineShift="45%" fill={mono ?? C.violet}>
      {mult}
    </tspan>
    <tspan fill={mono ?? C.gold}>{L}</tspan>
    {odd ? (
      <tspan fontSize={size * 0.62} baselineShift="45%" fill={mono ?? C.amber}>
        °
      </tspan>
    ) : null}
    {J ? (
      <tspan fontSize={size * 0.62} baselineShift="-28%" dx={odd ? -size * 0.24 : 0} fill={mono ?? C.mint}>
        {J}
      </tspan>
    ) : null}
  </text>
);

/** Simbol term HTML (di dalam Formula/Card). */
export const TermH: React.FC<{mult: React.ReactNode; L: React.ReactNode; J?: React.ReactNode; mono?: boolean; odd?: boolean}> = ({mult, L, J, mono, odd}) => (
  <span style={{whiteSpace: 'nowrap'}}>
    <Sup color={mono ? undefined : C.violet}>{mult}</Sup>
    <span style={{color: mono ? undefined : C.gold}}>{L}</span>
    {odd ? (
      <span style={{display: 'inline-block', verticalAlign: '-0.32em', fontSize: '0.62em', lineHeight: 1.05, textAlign: 'left', fontStyle: 'normal'}}>
        <span style={{display: 'block', color: mono ? undefined : C.amber}}>°</span>
        <span style={{display: 'block', color: mono ? undefined : C.mint}}>{J ?? '\u00a0'}</span>
      </span>
    ) : J !== undefined ? (
      <Sub color={mono ? undefined : C.mint}>{J}</Sub>
    ) : null}
  </span>
);

/** Panah spin: angle 0 = naik, 180 = turun (putar halus untuk membalik). Warna silang-pudar sian → merah muda. */
export const SpinArrow: React.FC<{x: number; y: number; angle?: number; len?: number; opacity?: number; color?: string; width?: number}> = ({
  x,
  y,
  angle = 0,
  len = 56,
  opacity = 1,
  color,
  width = 6,
}) => {
  const down = (1 - Math.cos((angle * Math.PI) / 180)) / 2;
  const col = color ?? interpolateColors(down, [0, 1], [C.cyan, C.pink]);
  const h = len / 2;
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`} opacity={opacity}>
      <path d={`M0,${h} L0,${-h + 14}`} stroke={col} strokeWidth={width} strokeLinecap="round" />
      <path d={`M0,${-h - 4} L${-11},${-h + 16} L${11},${-h + 16} Z`} fill={col} />
    </g>
  );
};

/** Kotak orbital (persegi berbingkai). */
export const OrbBox: React.FC<{x: number; y: number; s?: number; opacity?: number; color?: string; lit?: number}> = ({x, y, s = 96, opacity = 1, color = C.ink, lit = 0}) => (
  <g opacity={opacity}>
    <rect x={x - s / 2} y={y - s / 2} width={s} height={s} rx={8} fill={`rgba(20,28,56,${0.65 + 0.2 * lit})`} stroke={color} strokeWidth={3} strokeOpacity={0.55 + 0.45 * lit} />
  </g>
);

/** Garis tingkat energi: garis tebal + pita cahaya lebar transparan (tanpa filter). */
export const Level: React.FC<{x1: number; x2: number; y: number; color?: string; opacity?: number; lit?: number; width?: number}> = ({
  x1,
  x2,
  y,
  color = C.ink,
  opacity = 1,
  lit = 0,
  width = 5,
}) => (
  <g opacity={opacity}>
    <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth={18} strokeOpacity={0.08 + 0.18 * lit} strokeLinecap="round" />
    <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth={width} strokeLinecap="round" />
  </g>
);

/** Panah transisi berwarna bebas (garis + kepala segitiga), p = 0..1 tergambar. */
export const TArrow: React.FC<{x1: number; y1: number; x2: number; y2: number; p?: number; color: string; width?: number; opacity?: number; dash?: string}> = ({
  x1,
  y1,
  x2,
  y2,
  p = 1,
  color,
  width = 6,
  opacity = 1,
  dash,
}) => {
  if (p <= 0.001) return null;
  const ex = x1 + (x2 - x1) * p;
  const ey = y1 + (y2 - y1) * p;
  const L = Math.hypot(x2 - x1, y2 - y1) || 1;
  const ux = (x2 - x1) / L;
  const uy = (y2 - y1) / L;
  const hl = 22;
  const bx = ex - ux * hl;
  const by = ey - uy * hl;
  return (
    <g opacity={opacity}>
      <line x1={x1} y1={y1} x2={x1 + (bx - x1) * Math.min(1, p * 1.05)} y2={y1 + (by - y1) * Math.min(1, p * 1.05)} stroke={color} strokeWidth={width * 3} strokeOpacity={0.16} strokeLinecap="round" />
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dash} />
      <path d={`M${ex},${ey} L${bx - uy * 12},${by + ux * 12} L${bx + uy * 12},${by - ux * 12} Z`} fill={color} />
    </g>
  );
};

/** Stempel HTML miring ("TERLARANG"). p 0..1: jatuh dari besar ke ukuran normal. */
export const Stamp: React.FC<{x: number; y: number; p: number; text: React.ReactNode; color?: string; rot?: number; size?: number; sub?: React.ReactNode}> = ({
  x,
  y,
  p,
  text,
  color = C.red,
  rot = -8,
  size = 34,
  sub,
}) =>
  p <= 0.001 ? null : (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${1.5 - 0.5 * p})`,
        opacity: Math.min(1, p * 1.6),
        border: `4px solid ${color}`,
        borderRadius: 12,
        padding: '8px 22px',
        color,
        fontFamily: FONT.sans,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: 3,
        background: 'rgba(30,6,14,0.72)',
        boxShadow: `0 0 34px ${color}55`,
        whiteSpace: 'nowrap',
        textAlign: 'center',
      }}
    >
      {text}
      {sub ? <div style={{fontSize: size * 0.62, fontWeight: 600, letterSpacing: 1, marginTop: 2}}>{sub}</div> : null}
    </div>
  );

/** Tabung reaksi berisi larutan. */
export const TestTube: React.FC<{x: number; y: number; w?: number; h?: number; color: string; fill?: number; opacity?: number; t?: number; seed?: number}> = ({
  x,
  y,
  w = 90,
  h = 300,
  color,
  fill = 0.85,
  opacity = 1,
  t = 0,
  seed = 1,
}) => {
  const top = y - h / 2;
  const bot = y + h / 2;
  const r = w / 2;
  const lt = top + 40 + (h - 40 - r) * (1 - 0.82) + 6 * Math.sin(t * 1.3 + seed);
  const body = `M${x - r},${top + 20} L${x - r},${bot - r} A${r},${r} 0 0 0 ${x + r},${bot - r} L${x + r},${top + 20}`;
  const liquid = `M${x - r + 6},${lt} L${x - r + 6},${bot - r} A${r - 6},${r - 6} 0 0 0 ${x + r - 6},${bot - r} L${x + r - 6},${lt + 3 * Math.sin(t * 2 + seed)} Z`;
  return (
    <g opacity={opacity}>
      <ellipse cx={x} cy={bot - r * 0.6} rx={w * 0.9} ry={w * 0.5} fill={color} opacity={0.12 * fill} />
      <path d={liquid} fill={color} opacity={fill} />
      <path d={liquid} fill="url(#soft-white)" opacity={0.18 * fill} />
      {Array.from({length: 4}, (_, k) => {
        const ph = (t * (0.18 + 0.05 * rand(seed * 7 + k)) + rand(seed * 3 + k)) % 1;
        return <circle key={k} cx={x - r * 0.5 + r * rand(seed * 11 + k)} cy={bot - r - ph * (bot - r - lt - 10)} r={3 + 2 * rand(k + seed)} fill="#fff" opacity={0.35 * cyc(ph) * Math.min(1, fill * 3)} />;
      })}
      <path d={body} fill="rgba(200,215,255,0.05)" stroke="#c8d6ff" strokeOpacity={0.65} strokeWidth={3} />
      <rect x={x - r - 8} y={top + 8} width={w + 16} height={16} rx={6} fill="#2a3352" stroke="#4a5680" strokeWidth={2} />
      <rect x={x - r + 10} y={top + 40} width={7} height={h - 120} rx={3} fill="#fff" opacity={0.18} />
    </g>
  );
};

/** Stopwatch kecil: jarum berputar dengan laju rate (putaran/detik). */
export const Stopwatch: React.FC<{x: number; y: number; r?: number; t: number; rate: number; color: string; opacity?: number; fillFrac?: number}> = ({x, y, r = 54, t, rate, color, opacity = 1, fillFrac}) => {
  const a = t * rate * Math.PI * 2;
  const frac = fillFrac ?? 0;
  const arc = (f: number) => {
    const ang = f * Math.PI * 2 - Math.PI / 2;
    return `M${x},${y} L${x},${y - r + 6} A${r - 6},${r - 6} 0 ${f > 0.5 ? 1 : 0} 1 ${x + (r - 6) * Math.cos(ang)},${y + (r - 6) * Math.sin(ang)} Z`;
  };
  return (
    <g opacity={opacity}>
      <rect x={x - 10} y={y - r - 20} width={20} height={14} rx={4} fill={color} />
      <circle cx={x} cy={y} r={r} fill="rgba(10,16,34,0.9)" stroke={color} strokeWidth={4} />
      {frac > 0.002 ? <path d={arc(Math.min(0.999, frac))} fill={color} opacity={0.28} /> : null}
      {Array.from({length: 12}, (_, k) => {
        const g = (k / 12) * Math.PI * 2;
        return <line key={k} x1={x + Math.cos(g) * (r - 6)} y1={y + Math.sin(g) * (r - 6)} x2={x + Math.cos(g) * (r - 14)} y2={y + Math.sin(g) * (r - 14)} stroke={C.muted} strokeWidth={2} />;
      })}
      <line x1={x} y1={y} x2={x + Math.sin(a) * (r - 14)} y2={y - Math.cos(a) * (r - 14)} stroke={color} strokeWidth={4} strokeLinecap="round" />
      <circle cx={x} cy={y} r={5} fill={color} />
    </g>
  );
};

/** Gradien spektrum tampak 380–760 nm (pasang di dalam <Stage>). */
export const SpectrumDefs: React.FC<{id?: string}> = ({id = 'spec-vis'}) => (
  <defs>
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
      {Array.from({length: 39}, (_, k) => {
        const nm = 380 + k * 10;
        const edge = nm < 410 ? (nm - 370) / 40 : nm > 720 ? Math.max(0.15, (770 - nm) / 50) : 1;
        return <stop key={k} offset={`${(k / 38) * 100}%`} stopColor={wlColor(Math.min(749, Math.max(381, nm)))} stopOpacity={edge} />;
      })}
    </linearGradient>
  </defs>
);

/** Garis Fraunhofer utama (nm). */
export const FRAUNHOFER: {nm: number; k: string; w: number}[] = [
  {nm: 759.4, k: 'A', w: 4},
  {nm: 686.7, k: 'B', w: 3},
  {nm: 656.3, k: 'C', w: 4},
  {nm: 588.995, k: 'D', w: 3},
  {nm: 589.592, k: 'D', w: 3},
  {nm: 527.0, k: 'E', w: 3},
  {nm: 517.3, k: 'b', w: 3},
  {nm: 486.1, k: 'F', w: 4},
  {nm: 430.8, k: 'G', w: 3},
  {nm: 410.2, k: 'h', w: 2},
  {nm: 396.8, k: 'H', w: 5},
  {nm: 393.4, k: 'K', w: 5},
];

/** Ikon bintang berkilau (8 sinar). */
export const StarIcon: React.FC<{x: number; y: number; r?: number; t: number; color?: string; opacity?: number}> = ({x, y, r = 40, t, color = '#ffe9a8', opacity = 1}) => {
  const s = 1 + 0.08 * Math.sin(t * 3);
  const pts = Array.from({length: 16}, (_, k) => {
    const a = (k / 16) * Math.PI * 2 + t * 0.2;
    const rr = (k % 2 ? r * 0.32 : k % 4 ? r * 0.7 : r) * s;
    return `${(x + rr * Math.cos(a)).toFixed(1)},${(y + rr * Math.sin(a)).toFixed(1)}`;
  });
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r * 2.2} fill="url(#soft-gold)" opacity={0.5} />
      <polygon points={pts.join(' ')} fill={color} />
      <circle cx={x} cy={y} r={r * 0.3} fill="#fff" />
    </g>
  );
};

/** Lampu jalan natrium (tiang + kepala lampu kuning). */
export const StreetLamp: React.FC<{x: number; y: number; h?: number; t: number; on?: number; opacity?: number}> = ({x, y, h = 220, t, on = 1, opacity = 1}) => {
  const top = y - h;
  const flick = 0.9 + 0.1 * Math.sin(t * 7.3) * Math.sin(t * 2.1);
  return (
    <g opacity={opacity}>
      <path d={`M${x},${y} L${x},${top + 20} Q${x},${top} ${x + 30},${top} L${x + 70},${top}`} fill="none" stroke="#5a6488" strokeWidth={9} strokeLinecap="round" />
      <rect x={x - 22} y={y - 6} width={44} height={10} rx={4} fill="#5a6488" />
      <circle cx={x + 78} cy={top + 22} r={90} fill="url(#soft-gold)" opacity={0.55 * on * flick} />
      <path d={`M${x + 50},${top - 6} L${x + 106},${top - 6} L${x + 96},${top + 14} L${x + 60},${top + 14} Z`} fill="#3a4466" />
      <ellipse cx={x + 78} cy={top + 16} rx={20} ry={8} fill={wlColor(589)} opacity={0.4 + 0.6 * on * flick} />
    </g>
  );
};
