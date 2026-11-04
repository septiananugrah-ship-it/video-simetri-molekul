// Komponen bersama adegan grup D video orbital poliatomik (catalyst, organic, recap, outro).
import React from 'react';
import {cyc, rand} from '../anim';
import {C, FONT} from '../theme';

/** Titik pada kurva Bézier kuadrat. */
export const qbez = (a: [number, number], c: [number, number], b: [number, number], u: number): [number, number] => {
  const v = 1 - u;
  return [v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]];
};
export const qpath = (a: [number, number], c: [number, number], b: [number, number]) => `M${a[0]},${a[1]} Q${c[0]},${c[1]} ${b[0]},${b[1]}`;

/** Bola atom logam (perak kebiruan) datar. */
export const MetalBall: React.FC<{x: number; y: number; r: number; opacity?: number; lit?: number}> = ({x, y, r, opacity = 1, lit = 0}) => (
  <g opacity={opacity}>
    {lit > 0.01 ? <circle cx={x} cy={y} r={r * 2} fill="url(#soft-cyan)" opacity={0.7 * lit} /> : null}
    <circle cx={x} cy={y} r={r} fill="url(#po-metal)" />
    <ellipse cx={x - r * 0.3} cy={y - r * 0.38} rx={r * 0.32} ry={r * 0.18} fill="#fff" opacity={0.45} transform={`rotate(-30 ${x - r * 0.3} ${y - r * 0.38})`} />
  </g>
);

export const PoDefs: React.FC = () => (
  <defs>
    <radialGradient id="po-metal" cx="36%" cy="32%" r="75%">
      <stop offset="0%" stopColor="#f2f5ff" />
      <stop offset="35%" stopColor="#a9b4d4" />
      <stop offset="80%" stopColor="#5a6688" />
      <stop offset="100%" stopColor="#2a3150" />
    </radialGradient>
    <linearGradient id="po-screen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#0c1838" />
      <stop offset="100%" stopColor="#050a1c" />
    </linearGradient>
  </defs>
);

/** Permukaan logam berperspektif: rows baris (belakang → depan). */
export const MetalSurface: React.FC<{cx: number; y: number; cols: number; rows: number; sp: number; r: number; t: number; opacity?: number; lit?: (i: number, j: number) => number}> = ({
  cx,
  y,
  cols,
  rows,
  sp,
  r,
  t,
  opacity = 1,
  lit,
}) => (
  <g opacity={opacity}>
    {Array.from({length: rows}, (_, j) => {
      const f = 0.72 + (0.28 * j) / Math.max(1, rows - 1);
      const off = j % 2 ? 0.5 : 0;
      return Array.from({length: cols}, (_, i) => {
        const x = cx + (i - (cols - 1) / 2 + off - 0.25) * sp * f;
        const yy = y + j * sp * 0.42 + 1.2 * Math.sin(t * 2 + i + j * 1.7);
        return <MetalBall key={`${i}-${j}`} x={x} y={yy} r={r * f} lit={lit ? lit(i, j) : 0} />;
      });
    })}
  </g>
);

/** Molekul diatomik datar (dua bola CPK) dengan sudut rot (derajat). */
export const Duo: React.FC<{x: number; y: number; d?: number; r?: number; col?: string; col2?: string; rot?: number; opacity?: number; split?: number}> = ({
  x,
  y,
  d = 34,
  r = 17,
  col = C.blue,
  col2,
  rot = 0,
  opacity = 1,
  split = 0,
}) => {
  const a = (rot * Math.PI) / 180;
  const h = d / 2 + split;
  const P = (s: number): [number, number] => [x + s * h * Math.cos(a), y + s * h * Math.sin(a)];
  const [x1, y1] = P(-1);
  const [x2, y2] = P(1);
  const ball = (bx: number, by: number, c: string) => (
    <g>
      <circle cx={bx} cy={by} r={r} fill={c} />
      <circle cx={bx} cy={by} r={r} fill="url(#soft-white)" opacity={0.25} />
      <ellipse cx={bx - r * 0.3} cy={by - r * 0.35} rx={r * 0.32} ry={r * 0.18} fill="#fff" opacity={0.5} />
    </g>
  );
  return (
    <g opacity={opacity}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#c9d3f2" strokeWidth={r * 0.5} strokeLinecap="round" opacity={Math.max(0, 1 - split / 14)} />
      {ball(x1, y1, col)}
      {ball(x2, y2, col2 ?? col)}
    </g>
  );
};

/** Lubang (h⁺): lingkaran kosong berbingkai. */
export const Hole: React.FC<{x: number; y: number; r?: number; opacity?: number; color?: string}> = ({x, y, r = 11, opacity = 1, color = C.gold}) => (
  <g opacity={opacity}>
    <circle cx={x} cy={y} r={r * 2.4} fill="url(#soft-gold)" opacity={0.35} />
    <circle cx={x} cy={y} r={r} fill="rgba(4,6,12,0.9)" stroke={color} strokeWidth={3} />
    <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.sans} fontWeight={800} fontSize={r * 1.3} fill={color}>
      +
    </text>
  </g>
);

/** Titik elektron kecil (sian) dengan halo. */
export const Dot: React.FC<{x: number; y: number; r?: number; color?: string; opacity?: number}> = ({x, y, r = 8, color = C.cyan, opacity = 1}) =>
  opacity <= 0.003 ? null : (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r * 2.6} fill={color} opacity={0.18} />
      <circle cx={x} cy={y} r={r} fill={color} />
      <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.35} fill="#fff" opacity={0.7} />
    </g>
  );

/** Rantai polien zig-zag (n atom C) dengan ikatan rangkap berselang (jingga). */
export const Polyene: React.FC<{x: number; y: number; n: number; bond?: number; t: number; opacity?: number; cloud?: number; color?: string}> = ({
  x,
  y,
  n,
  bond = 36,
  t,
  opacity = 1,
  cloud = 0,
  color = C.amber,
}) => {
  const dx = bond * Math.cos(Math.PI / 6);
  const dy = bond * Math.sin(Math.PI / 6);
  const w = (n - 1) * dx;
  const pts: [number, number][] = Array.from({length: n}, (_, i) => [x - w / 2 + i * dx, y + (i % 2 ? -dy / 2 : dy / 2)]);
  return (
    <g opacity={opacity}>
      {cloud > 0.01 ? (
        <rect x={x - w / 2 - 14} y={y - dy - 12} width={w + 28} height={dy * 2 + 24} rx={dy + 12} fill={color} opacity={(0.12 + 0.06 * Math.sin(t * 2.2)) * cloud} />
      ) : null}
      {pts.slice(0, -1).map((p, i) => {
        const q = pts[i + 1];
        const dbl = i % 2 === 0;
        return (
          <g key={i}>
            <line x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="#c9d3f2" strokeWidth={4} strokeLinecap="round" />
            {dbl ? (
              <line
                x1={p[0] + (q[0] - p[0]) * 0.18}
                y1={p[1] + (q[1] - p[1]) * 0.18 + (i % 4 === 0 ? 8 : 8)}
                x2={q[0] - (q[0] - p[0]) * 0.18}
                y2={q[1] - (q[1] - p[1]) * 0.18 + 8}
                stroke={color}
                strokeWidth={4}
                strokeLinecap="round"
              />
            ) : null}
          </g>
        );
      })}
      {cloud > 0.01
        ? Array.from({length: 3}, (_, k) => {
            const ph = (((t * 0.35 + k / 3) % 1) + 1) % 1;
            return <circle key={k} cx={x - w / 2 + ph * w} cy={y + 4 * Math.sin(ph * 12)} r={5} fill={C.cyan} opacity={cloud * cyc(ph)} />;
          })
        : null}
    </g>
  );
};

/** Bintik debu cahaya acak (untuk latar kartu). */
export const Sparkles: React.FC<{x: number; y: number; w: number; h: number; t: number; n?: number; color?: string; seed?: number}> = ({x, y, w, h, t, n = 10, color = C.gold, seed = 1}) => (
  <g>
    {Array.from({length: n}, (_, k) => {
      const ph = (((t * (0.2 + 0.1 * rand(seed + k)) + rand(seed * 5 + k)) % 1) + 1) % 1;
      return <circle key={k} cx={x + rand(seed * 3 + k * 7.7) * w} cy={y + rand(seed * 9 + k * 3.3) * h} r={2.2} fill={color} opacity={0.6 * cyc(ph)} />;
    })}
  </g>
);
