import React from 'react';
import {AbsoluteFill} from 'remotion';
import {smoothPath} from '../anim';
import {ATOM, C, FONT, H, W} from '../theme';

const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v + (amt > 0 ? (255 - v) * amt : v * amt))));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `rgb(${r},${g},${b})`;
};

const RAINBOW: Record<number, string> = {
  390: '#6a3cff', 420: '#7b3dff', 450: '#3d5bff', 470: '#2f8cff', 490: '#2ce0ff', 510: '#3dff7a',
  540: '#9dff3a', 570: '#f2ff3a', 600: '#ffb030', 650: '#ff3a2a', 700: '#c41818',
};

/** Definisi gradien & filter bersama. Pasang sekali di setiap <Stage>. */
export const Defs: React.FC = () => (
  <defs>
    {Object.entries(ATOM).map(([el, a]) => (
      <React.Fragment key={el}>
        <radialGradient id={`atom-${el}`} cx="36%" cy="32%" r="72%">
          <stop offset="0%" stopColor={shade(a.fill, 0.75)} />
          <stop offset="28%" stopColor={shade(a.fill, 0.2)} />
          <stop offset="70%" stopColor={a.fill} />
          <stop offset="100%" stopColor={shade(a.fill, -0.6)} />
        </radialGradient>
        <radialGradient id={`glow-${el}`}>
          <stop offset="0%" stopColor={a.glow} stopOpacity="0.55" />
          <stop offset="45%" stopColor={a.glow} stopOpacity="0.16" />
          <stop offset="100%" stopColor={a.glow} stopOpacity="0" />
        </radialGradient>
      </React.Fragment>
    ))}
    {[
      ['gold', C.gold],
      ['cyan', C.cyan],
      ['violet', C.violet],
      ['red', C.red],
      ['mint', C.mint],
      ['white', '#ffffff'],
    ].map(([k, col]) => (
      <radialGradient key={k} id={`soft-${k}`}>
        <stop offset="0%" stopColor={col} stopOpacity="0.9" />
        <stop offset="35%" stopColor={col} stopOpacity="0.35" />
        <stop offset="100%" stopColor={col} stopOpacity="0" />
      </radialGradient>
    ))}
    <linearGradient id="spring-metal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#fff6dc" />
      <stop offset="50%" stopColor={C.gold} />
      <stop offset="100%" stopColor="#8a5a10" />
    </linearGradient>
    <linearGradient id="bond-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#c8d3ef" />
      <stop offset="55%" stopColor="#7b87a8" />
      <stop offset="100%" stopColor="#2b3247" />
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="14" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <linearGradient id="rainbow-v" x1="0" y1="0" x2="0" y2="1">
      {[700, 650, 600, 570, 540, 510, 490, 470, 450, 420, 390].map((nm, i) => (
        <stop key={nm} offset={`${i * 10}%`} stopColor={RAINBOW[nm]} />
      ))}
    </linearGradient>
    <linearGradient id="rainbow-h" x1="0" y1="0" x2="1" y2="0">
      {[390, 420, 450, 470, 490, 510, 540, 570, 600, 650, 700].map((nm, i) => (
        <stop key={nm} offset={`${i * 10}%`} stopColor={RAINBOW[nm]} />
      ))}
    </linearGradient>
    <filter id="blur-soft">
      <feGaussianBlur stdDeviation="18" />
    </filter>
    {[
      ['ink', C.ink],
      ['gold', C.gold],
      ['cyan', C.cyan],
      ['red', C.red],
      ['mint', C.mint],
      ['violet', C.violet],
      ['muted', C.muted],
    ].map(([k, col]) => (
      <marker key={k} id={`arrow-${k}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 L2.5,5 Z" fill={col} />
      </marker>
    ))}
  </defs>
);

/** Kanvas SVG penuh 1920×1080 untuk sebuah scene. */
export const Stage: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <AbsoluteFill style={style}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <Defs />
      {children}
    </svg>
  </AbsoluteFill>
);

export const Atom: React.FC<{
  x: number;
  y: number;
  el: keyof typeof ATOM | string;
  r?: number;
  label?: string | null;
  opacity?: number;
  glow?: number;
  charge?: string;
}> = ({x, y, el, r, label, opacity = 1, glow = 1, charge}) => {
  const a = ATOM[el] ?? ATOM.C;
  const R = r ?? a.r;
  const text = label === undefined ? el : label;
  return (
    <g opacity={opacity}>
      {glow > 0 ? <circle cx={x} cy={y} r={R * 2.3} fill={`url(#glow-${el in ATOM ? el : 'C'})`} opacity={glow} /> : null}
      <circle cx={x} cy={y} r={R} fill={`url(#atom-${el in ATOM ? el : 'C'})`} />
      <ellipse cx={x - R * 0.32} cy={y - R * 0.38} rx={R * 0.3} ry={R * 0.18} fill="#fff" opacity={0.45} transform={`rotate(-30 ${x - R * 0.32} ${y - R * 0.38})`} />
      {text ? (
        <text
          x={x}
          y={y + R * 0.02}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily={FONT.sans}
          fontWeight={700}
          fontSize={R * 0.78}
          fill={el === 'H' ? '#1d2440' : '#ffffff'}
          opacity={0.92}
        >
          {text}
        </text>
      ) : null}
      {charge ? (
        <text x={x + R * 0.85} y={y - R * 0.9} textAnchor="middle" fontFamily={FONT.serif} fontStyle="italic" fontSize={R * 0.75} fill={C.ink}>
          {charge}
        </text>
      ) : null}
    </g>
  );
};

/** Pegas zig-zag halus antara dua titik. */
export const Spring: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  coils?: number;
  amp?: number;
  width?: number;
  opacity?: number;
  color?: string;
}> = ({x1, y1, x2, y2, coils = 9, amp = 18, width = 6, opacity = 1, color}) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;
  const lead = Math.min(26, len * 0.12);
  const pts: [number, number][] = [[x1, y1]];
  pts.push([x1 + ux * lead, y1 + uy * lead]);
  const n = coils * 2;
  for (let i = 1; i < n; i++) {
    const s = lead + ((len - 2 * lead) * i) / n;
    const side = i % 2 ? 1 : -1;
    pts.push([x1 + ux * s + nx * amp * side, y1 + uy * s + ny * amp * side]);
  }
  pts.push([x2 - ux * lead, y2 - uy * lead]);
  pts.push([x2, y2]);
  const d = smoothPath(pts);
  return (
    <g opacity={opacity}>
      <path d={d} fill="none" stroke="#000" strokeOpacity={0.45} strokeWidth={width + 4} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={color ?? 'url(#spring-metal)'} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={width * 0.3} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

/** Ikatan kimia (tunggal/rangkap) berbentuk batang. */
export const Bond: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  order?: number;
  width?: number;
  opacity?: number;
  color?: string;
}> = ({x1, y1, x2, y2, order = 1, width = 12, opacity = 1, color}) => {
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = -(y2 - y1) / len;
  const ny = (x2 - x1) / len;
  const gap = width * 1.15;
  const offsets = order === 1 ? [0] : order === 2 ? [-gap / 2, gap / 2] : [-gap, 0, gap];
  const w = order === 1 ? width : width * 0.62;
  return (
    <g opacity={opacity}>
      {offsets.map((o, i) => (
        <g key={i}>
          <line x1={x1 + nx * o} y1={y1 + ny * o} x2={x2 + nx * o} y2={y2 + ny * o} stroke="#0b0f1c" strokeWidth={w + 3} strokeLinecap="round" />
          <line x1={x1 + nx * o} y1={y1 + ny * o} x2={x2 + nx * o} y2={y2 + ny * o} stroke={color ?? '#8b97b8'} strokeWidth={w} strokeLinecap="round" />
          <line
            x1={x1 + nx * (o - w * 0.18)}
            y1={y1 + ny * (o - w * 0.18)}
            x2={x2 + nx * (o - w * 0.18)}
            y2={y2 + ny * (o - w * 0.18)}
            stroke="#fff"
            strokeOpacity={0.35}
            strokeWidth={w * 0.25}
            strokeLinecap="round"
          />
        </g>
      ))}
    </g>
  );
};

export const Arrow: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: 'ink' | 'gold' | 'cyan' | 'red' | 'mint' | 'violet' | 'muted';
  width?: number;
  opacity?: number;
  dash?: string;
  both?: boolean;
}> = ({x1, y1, x2, y2, color = 'ink', width = 4, opacity = 1, dash, both}) => {
  const col = color === 'muted' ? C.muted : C[color === 'ink' ? 'ink' : color];
  if (Math.hypot(x2 - x1, y2 - y1) < 2) return null;
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={col}
      strokeWidth={width}
      strokeLinecap="round"
      strokeDasharray={dash}
      opacity={opacity}
      markerEnd={`url(#arrow-${color})`}
      markerStart={both ? `url(#arrow-${color})` : undefined}
    />
  );
};

/** Teks SVG dengan gaya konsisten. */
export const Label: React.FC<{
  x: number;
  y: number;
  children: React.ReactNode;
  size?: number;
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
  weight?: number;
  opacity?: number;
  font?: 'sans' | 'mono' | 'serif';
  italic?: boolean;
  spacing?: number;
}> = ({x, y, children, size = 30, color = C.ink, anchor = 'middle', weight = 500, opacity = 1, font = 'sans', italic, spacing}) => (
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
    letterSpacing={spacing}
    style={{paintOrder: 'stroke', stroke: 'rgba(4,6,12,0.85)', strokeWidth: size * 0.12}}
  >
    {children}
  </text>
);

/** Kartu HTML (untuk rumus & catatan) yang diposisikan absolut. */
export const Card: React.FC<{
  x: number;
  y: number;
  children: React.ReactNode;
  opacity?: number;
  scale?: number;
  anchor?: 'center' | 'left' | 'right';
  accent?: string;
  style?: React.CSSProperties;
  plain?: boolean;
}> = ({x, y, children, opacity = 1, scale = 1, anchor = 'center', accent = C.gold, style, plain}) => {
  const tx = anchor === 'center' ? '-50%' : anchor === 'right' ? '-100%' : '0%';
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(${tx}, -50%) scale(${scale})`,
        transformOrigin: anchor === 'center' ? '50% 50%' : anchor === 'left' ? '0% 50%' : '100% 50%',
        opacity,
        padding: plain ? 0 : '18px 30px',
        borderRadius: 18,
        background: plain ? undefined : 'linear-gradient(160deg, rgba(22,30,58,0.82), rgba(8,11,24,0.82))',
        border: plain ? undefined : `1px solid ${accent}55`,
        boxShadow: plain ? undefined : `0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 40px ${accent}18`,
        color: C.ink,
        fontFamily: FONT.sans,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Variabel matematika bergaya miring. */
export const V: React.FC<{children: React.ReactNode; color?: string}> = ({children, color}) => (
  <span style={{fontFamily: FONT.serif, fontStyle: 'italic', color}}>{children}</span>
);

export const Badge: React.FC<{
  x: number;
  y: number;
  text: string;
  color: string;
  opacity?: number;
  scale?: number;
  icon?: string;
}> = ({x, y, text, color, opacity = 1, scale = 1, icon}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: `translate(-50%, -50%) scale(${scale})`,
      opacity,
      padding: '10px 22px',
      borderRadius: 999,
      background: `${color}22`,
      border: `2px solid ${color}`,
      color,
      fontFamily: FONT.sans,
      fontWeight: 700,
      fontSize: 26,
      letterSpacing: 1.5,
      whiteSpace: 'nowrap',
      boxShadow: `0 0 30px ${color}44`,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}
  >
    {icon ? <span style={{fontSize: 24}}>{icon}</span> : null}
    {text}
  </div>
);

/** Lingkaran cahaya lembut. */
export const Glow: React.FC<{x: number; y: number; r: number; color?: 'gold' | 'cyan' | 'violet' | 'red' | 'mint' | 'white'; opacity?: number}> = ({
  x,
  y,
  r,
  color = 'gold',
  opacity = 1,
}) => <circle cx={x} cy={y} r={r} fill={`url(#soft-${color})`} opacity={opacity} />;

/** Path yang tergambar progresif (0..1). */
export const DrawPath: React.FC<{
  d: string;
  p: number;
  stroke: string;
  width?: number;
  opacity?: number;
  len?: number;
  glow?: boolean;
  dash?: string;
  fill?: string;
}> = ({d, p, stroke, width = 4, opacity = 1, len = 4000, glow, dash, fill = 'none'}) => {
  if (p <= 0) return null;
  return (
    <path
      d={d}
      fill={fill}
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
      filter={glow ? 'url(#glow)' : undefined}
      strokeDasharray={dash ?? `${len} ${len}`}
      strokeDashoffset={dash ? undefined : len * (1 - p)}
      pathLength={dash ? undefined : len}
    />
  );
};

/* ------------------------------------------------------------------ */
/* Tipografi rumus (HTML): pecahan bertumpuk, subskrip & superskrip.     */
/* ------------------------------------------------------------------ */

/** Pecahan bertumpuk — jangan pakai garis miring untuk pecahan di rumus. */
export const Frac: React.FC<{n: React.ReactNode; d: React.ReactNode; size?: number}> = ({n, d, size = 0.84}) => (
  <span
    style={{
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      verticalAlign: 'middle',
      margin: '0 0.14em',
      fontSize: `${size}em`,
      lineHeight: 1.12,
      position: 'relative',
      top: '-0.08em',
    }}
  >
    <span style={{padding: '0 0.2em 0.08em', whiteSpace: 'nowrap'}}>{n}</span>
    <span style={{alignSelf: 'stretch', height: 3, borderRadius: 2, background: 'currentColor', opacity: 0.85}} />
    <span style={{padding: '0.08em 0.2em 0', whiteSpace: 'nowrap'}}>{d}</span>
  </span>
);

export const Sub: React.FC<{children: React.ReactNode; color?: string}> = ({children, color}) => (
  <sub style={{fontSize: '0.62em', verticalAlign: '-0.32em', lineHeight: 0, color, fontStyle: 'normal'}}>{children}</sub>
);

export const Sup: React.FC<{children: React.ReactNode; color?: string}> = ({children, color}) => (
  <sup style={{fontSize: '0.62em', verticalAlign: '0.55em', lineHeight: 0, color}}>{children}</sup>
);

/** Bagian rumus yang muncul bertahap (p: 0..1) mengikuti narasi. */
export const Part: React.FC<{p: number; children: React.ReactNode; color?: string}> = ({p, children, color}) => (
  <span style={{opacity: p, color}}>{children}</span>
);

/** Kartu rumus utama: ≥ 56 px, satu per momen. */
export const Formula: React.FC<{
  x: number;
  y: number;
  p: number;
  children: React.ReactNode;
  accent?: string;
  size?: number;
  anchor?: 'center' | 'left' | 'right';
  caption?: React.ReactNode;
}> = ({x, y, p, children, accent = C.gold, size = 58, anchor = 'center', caption}) =>
  p <= 0.001 ? null : (
    <Card x={x} y={y} opacity={Math.min(1, p * 1.4)} scale={0.9 + 0.1 * p} accent={accent} anchor={anchor} style={{padding: '22px 38px'}}>
      <div style={{fontSize: size, lineHeight: 1.25, textAlign: 'center', fontFamily: FONT.serif, whiteSpace: 'nowrap'}}>{children}</div>
      {caption ? <div style={{fontSize: 26, color: C.muted, textAlign: 'center', marginTop: 10, fontFamily: FONT.sans}}>{caption}</div> : null}
    </Card>
  );

/** ν̃ (bilangan gelombang) — tilde digambar sendiri karena tanda gabungan tidak menempel di font serif. */
export const NuTilde: React.FC<{color?: string}> = ({color}) => (
  <span style={{position: 'relative', display: 'inline-block', fontFamily: FONT.serif, fontStyle: 'italic', color}}>
    ν
    <span style={{position: 'absolute', left: '0.12em', top: '-0.48em', fontSize: '0.85em', fontStyle: 'normal'}}>~</span>
  </span>
);

/** Tanda akar: SVG + inline-block (borderTop pada span inline membuat garis melayang). */
export const Sqrt: React.FC<{children: React.ReactNode}> = ({children}) => (
  <span style={{display: 'inline-block', position: 'relative', paddingLeft: '0.6em', whiteSpace: 'nowrap', lineHeight: 1.05}}>
    <svg viewBox="0 0 60 100" preserveAspectRatio="none" style={{position: 'absolute', left: 0, top: 0, width: '0.62em', height: '100%', overflow: 'visible'}}>
      <path d="M4,60 L16,53 L33,97 L60,1.5" fill="none" stroke="currentColor" strokeWidth="0.055em" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
    <span style={{display: 'inline-block', borderTop: '0.055em solid currentColor', padding: '0.1em 0.06em 0 0.08em', lineHeight: 1.05}}>{children}</span>
  </span>
);

/** Operator bertopi (Ĥ, p̂): topi digambar sendiri agar menempel rapi di huruf miring. */
export const Op: React.FC<{children: React.ReactNode; color?: string}> = ({children, color}) => (
  <span style={{position: 'relative', display: 'inline-block', fontFamily: FONT.serif, fontStyle: 'italic', color}}>
    {children}
    <span style={{position: 'absolute', left: '50%', top: '-0.5em', transform: 'translateX(-38%)', fontSize: '0.8em', fontStyle: 'normal'}}>^</span>
  </span>
);

/** ħ (h bar) dari font serif. */
export const Hbar: React.FC = () => <span style={{fontFamily: FONT.serif, fontStyle: 'italic'}}>ħ</span>;
