// Komponen grup C video orbital poliatomik (aromatic, color, metalco):
// lingkaran Frost, termometer, wortel, daun, mata, bola logam, orbital d semanggi.
import React from 'react';
import {cyc, rand} from '../anim';
import {C} from '../theme';
import {lobePath, Spin} from './vbD';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Titik sudut poligon Frost (satu sudut di bawah). Energi naik ke atas layar. */
export const frostPts = (cx: number, cy: number, R: number, n: number): [number, number][] =>
  Array.from({length: n}, (_, k) => [cx + R * Math.sin((2 * Math.PI * k) / n), cy + R * Math.cos((2 * Math.PI * k) / n)]);

/**
 * Lingkaran Frost: poligon ber-sudut-bawah di dalam lingkaran, tingkat energi di setiap sudut
 * (sian = ikatan, abu = nonikatan di garis α, merah = antiikatan). e = elektron (boleh pecahan),
 * diisi dari bawah; tingkat degenerat diisi ↑ dulu (Hund).
 */
export const FrostCircle: React.FC<{
  cx: number;
  cy: number;
  R: number;
  n: number;
  e?: number;
  t: number;
  opacity?: number;
  lw?: number;
  spin?: number;
  alpha?: number;
  draw?: number;
}> = ({cx, cy, R, n, e = 0, t, opacity = 1, lw = 56, spin = 34, alpha = 1, draw = 1}) => {
  if (opacity <= 0.001) return null;
  const pts = frostPts(cx, cy, R, n);
  // kelompok energi (y sama)
  const groups: number[][] = [];
  pts
    .map((p, k) => ({k, y: p[1]}))
    .sort((a, b) => b.y - a.y)
    .forEach(({k, y}) => {
      const g = groups.find((gr) => Math.abs(pts[gr[0]][1] - y) < 0.5);
      if (g) g.push(k);
      else groups.push([k]);
    });
  // urutan pengisian elektron: per kelompok, ↑ semua lalu ↓ semua
  const seq: {k: number; up: boolean}[] = [];
  groups.forEach((g) => {
    g.forEach((k) => seq.push({k, up: true}));
    g.forEach((k) => seq.push({k, up: false}));
  });
  const poly = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const per = 2 * Math.PI * R;
  return (
    <g opacity={opacity}>
      <circle cx={cx} cy={cy} r={R} fill="rgba(79,214,255,0.03)" stroke={C.muted} strokeOpacity={0.45} strokeWidth={2} strokeDasharray={`${per} ${per}`} strokeDashoffset={per * (1 - draw)} />
      <polygon points={poly} fill="rgba(160,131,255,0.05)" stroke={C.violet} strokeOpacity={0.55 * draw} strokeWidth={2.5} strokeLinejoin="round" />
      {alpha > 0.001 ? (
        <line x1={cx - R - 26} y1={cy} x2={cx + R + 26} y2={cy} stroke={C.muted} strokeWidth={1.6} strokeDasharray="6 8" strokeDashoffset={-t * 12} opacity={0.6 * alpha} />
      ) : null}
      {pts.map(([x, y], k) => {
        const col = y > cy + 0.5 ? C.cyan : y < cy - 0.5 ? C.red : C.muted;
        const dw = lw * clamp01(draw * 1.4 - (k / n) * 0.4);
        return <line key={k} x1={x - dw / 2} y1={y} x2={x + dw / 2} y2={y} stroke={col} strokeWidth={5} strokeLinecap="round" />;
      })}
      {seq.map(({k, up}, j) => {
        const p = clamp01(e - j);
        if (p <= 0.001) return null;
        const [x, y] = pts[k];
        const bob = 1.8 * Math.sin(t * 2.1 + j * 1.3);
        return <Spin key={j} x={x + (up ? -spin * 0.24 : spin * 0.24)} y={y - 2 + bob - (1 - p) * 24} up={up} len={spin} width={Math.max(3, spin * 0.12)} opacity={p} />;
      })}
    </g>
  );
};

/** Termometer dingin (air raksa rendah, biru) dengan kepingan salju kecil. */
export const Thermometer: React.FC<{x: number; y: number; h?: number; level?: number; t: number; opacity?: number}> = ({x, y, h = 220, level = 0.15, t, opacity = 1}) => {
  if (opacity <= 0.001) return null;
  const top = y - h / 2;
  const bulbY = y + h / 2 - 22;
  const tubeBot = bulbY - 18;
  const lv = tubeBot - (tubeBot - top - 14) * level;
  return (
    <g opacity={opacity}>
      <rect x={x - 16} y={top} width={32} height={h - 30} rx={16} fill="rgba(200,215,255,0.06)" stroke="#c8d6ff" strokeOpacity={0.7} strokeWidth={3} />
      <circle cx={x} cy={bulbY} r={28} fill="rgba(200,215,255,0.06)" stroke="#c8d6ff" strokeOpacity={0.7} strokeWidth={3} />
      <circle cx={x} cy={bulbY} r={19} fill={C.blue} />
      <rect x={x - 7} y={lv} width={14} height={bulbY - lv} rx={7} fill={C.blue} />
      {Array.from({length: 5}, (_, k) => (
        <line key={k} x1={x + 18} y1={top + 24 + k * 30} x2={x + 30} y2={top + 24 + k * 30} stroke="#c8d6ff" strokeOpacity={0.5} strokeWidth={2} />
      ))}
      {Array.from({length: 6}, (_, k) => {
        const ph = (t * 0.16 + rand(k * 3.3)) % 1;
        const sx = x - 90 + rand(k * 7.1) * 180 + 10 * Math.sin(t * 1.2 + k);
        const sy = top - 20 + ph * (h + 20);
        const s = 7 + 4 * rand(k);
        return (
          <g key={k} opacity={0.75 * cyc(ph)} transform={`translate(${sx} ${sy}) rotate(${t * 30 + k * 20})`}>
            {[0, 60, 120].map((a) => (
              <line key={a} x1={-s} y1={0} x2={s} y2={0} stroke="#cfe6ff" strokeWidth={2} strokeLinecap="round" transform={`rotate(${a})`} />
            ))}
          </g>
        );
      })}
    </g>
  );
};

/** Wortel (jingga) dengan daun hijau yang bergoyang. */
export const Carrot: React.FC<{x: number; y: number; s?: number; t: number; opacity?: number}> = ({x, y, s = 1, t, opacity = 1}) =>
  opacity <= 0.001 ? null : (
    <g opacity={opacity} transform={`translate(${x} ${y}) rotate(-30) scale(${s})`}>
      {[-1, 0, 1].map((k) => (
        <path
          key={k}
          d={lobePath(k * 12, -96, 70, 14, k * 22 + 4 * Math.sin(t * 1.6 + k))}
          fill={C.mint}
          fillOpacity={0.75}
          stroke="#2fae73"
          strokeWidth={2}
        />
      ))}
      <path d="M-34,-96 Q-38,-40 -6,110 Q0,124 6,110 Q38,-40 34,-96 Q0,-110 -34,-96 Z" fill="#ff8a2a" stroke="#c85a10" strokeWidth={3} />
      <path d="M-22,-90 Q-20,-30 -4,80" fill="none" stroke="#ffd0a0" strokeOpacity={0.5} strokeWidth={4} strokeLinecap="round" />
      {[-50, -10, 30, 64].map((yy, k) => (
        <path key={k} d={`M${k % 2 ? 6 : -24},${yy} q12,4 18,0`} fill="none" stroke="#c85a10" strokeWidth={2.5} strokeLinecap="round" />
      ))}
    </g>
  );

/** Daun hijau dengan urat. */
export const Leaf: React.FC<{x: number; y: number; s?: number; t: number; opacity?: number}> = ({x, y, s = 1, t, opacity = 1}) =>
  opacity <= 0.001 ? null : (
    <g opacity={opacity} transform={`translate(${x} ${y}) rotate(${-35 + 4 * Math.sin(t * 1.3)}) scale(${s})`}>
      <path d="M0,80 Q-70,10 0,-90 Q70,10 0,80 Z" fill="#2fbf6e" fillOpacity={0.85} stroke="#1f8a4c" strokeWidth={3} />
      <line x1={0} y1={95} x2={0} y2={-70} stroke="#bff5d4" strokeWidth={3} strokeLinecap="round" opacity={0.8} />
      {[-40, -10, 20, 45].map((yy, k) => (
        <g key={k} opacity={0.7}>
          <path d={`M0,${yy} q-22,-10 -32,-24`} fill="none" stroke="#bff5d4" strokeWidth={2} strokeLinecap="round" />
          <path d={`M0,${yy} q22,-10 32,-24`} fill="none" stroke="#bff5d4" strokeWidth={2} strokeLinecap="round" />
        </g>
      ))}
    </g>
  );

/** Ikon mata (iris berwarna, berkedip pelan). */
export const Eye: React.FC<{x: number; y: number; s?: number; t: number; iris?: string; opacity?: number}> = ({x, y, s = 1, t, iris = C.amber, opacity = 1}) => {
  if (opacity <= 0.001) return null;
  // kedipan halus: sin(π·u) pada 8% akhir siklus (kontinu, bukan ambang)
  const ph = (t * 0.22 + 0.3) % 1;
  const open = 1 - 0.85 * Math.sin(Math.PI * clamp01((ph - 0.92) / 0.08));
  return (
    <g opacity={opacity} transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={`M-70,0 Q0,${-58 * open} 70,0 Q0,${58 * open} -70,0 Z`} fill="#f4f6ff" stroke={C.ink} strokeWidth={3} />
      <circle cx={6 * Math.sin(t * 0.7)} cy={0} r={26 * Math.min(1, open * 1.3)} fill={iris} />
      <circle cx={6 * Math.sin(t * 0.7)} cy={0} r={11 * Math.min(1, open * 1.3)} fill="#0a0d18" />
      <circle cx={6 * Math.sin(t * 0.7) - 8} cy={-8} r={5 * open} fill="#fff" opacity={0.8} />
    </g>
  );
};

/** Bola atom logam (perak) dengan kilau. */
export const MetalBall: React.FC<{x: number; y: number; r?: number; label?: string; opacity?: number; glow?: number}> = ({x, y, r = 60, label = 'M', opacity = 1, glow = 1}) =>
  opacity <= 0.001 ? null : (
    <g opacity={opacity}>
      <defs>
        <radialGradient id="poC-metal" cx="36%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="30%" stopColor="#c9d2e6" />
          <stop offset="72%" stopColor="#7d8aa8" />
          <stop offset="100%" stopColor="#2c3348" />
        </radialGradient>
      </defs>
      {glow > 0 ? <circle cx={x} cy={y} r={r * 2.1} fill="url(#soft-white)" opacity={0.18 * glow} /> : null}
      <circle cx={x} cy={y} r={r} fill="url(#poC-metal)" />
      {label ? (
        <text x={x} y={y + 2} textAnchor="middle" dominantBaseline="central" fontFamily="Outfit, sans-serif" fontWeight={700} fontSize={r * 0.72} fill="#1d2440" opacity={0.9}>
          {label}
        </text>
      ) : null}
    </g>
  );

/** Orbital d semanggi (dxz): empat lobus diagonal, fase bergantian (kanan-atas emas). */
export const DClover: React.FC<{x: number; y: number; L?: number; w?: number; opacity?: number; t?: number; rot?: number}> = ({x, y, L = 120, w = 36, opacity = 1, t = 0, rot = 0}) => {
  if (opacity <= 0.001) return null;
  const br = 1 + 0.03 * Math.sin(t * 2.3);
  return (
    <g opacity={opacity}>
      {[45, 135, 225, 315].map((a, k) => {
        const col = k % 2 === 0 ? C.gold : C.violet;
        return <path key={a} d={lobePath(x, y, L * br, w * br, a + rot)} fill={col} fillOpacity={0.4} stroke={col} strokeWidth={2.5} />;
      })}
    </g>
  );
};
