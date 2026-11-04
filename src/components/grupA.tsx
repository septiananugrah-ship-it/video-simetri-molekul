import React from 'react';
import {rand} from '../anim';
import {C, FONT} from '../theme';
import {wlColor} from './viz';

// Komponen kecil bersama untuk adegan grup A (hook, title, roadmap, spin, pauli, singlet).

/** Kuning natrium (≈ 589 nm). */
export const NA_YELLOW = wlColor(589);

/** Panah spin: sian (naik/α) atau merah muda (turun/β); kepala panah digambar sendiri. */
export const SpinVec: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width?: number;
  head?: number;
  opacity?: number;
}> = ({x1, y1, x2, y2, color, width = 7, head, opacity = 1}) => {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 2 || opacity <= 0.001) return null;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const h = head ?? Math.max(16, width * 3.2);
  const bx = x2 - ux * h;
  const by = y2 - uy * h;
  const nx = -uy * h * 0.55;
  const ny = ux * h * 0.55;
  return (
    <g opacity={opacity}>
      <line x1={x1} y1={y1} x2={bx + ux * 2} y2={by + uy * 2} stroke={color} strokeWidth={width * 2.6} strokeLinecap="round" opacity={0.16} />
      <line x1={x1} y1={y1} x2={bx + ux * 2} y2={by + uy * 2} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <path d={`M${x2},${y2} L${bx + nx},${by + ny} L${bx - nx},${by - ny} Z`} fill={color} strokeLinejoin="round" stroke={color} strokeWidth={2} />
    </g>
  );
};

/** Panah spin tegak di titik (x, y): up = naik (sian), down = turun (merah muda). */
export const SpinUD: React.FC<{x: number; y: number; up: boolean; len?: number; opacity?: number; width?: number}> = ({x, y, up, len = 80, opacity = 1, width = 6}) => (
  <SpinVec x1={x} y1={y + (up ? len / 2 : -len / 2)} x2={x} y2={y + (up ? -len / 2 : len / 2)} color={up ? C.cyan : C.pink} opacity={opacity} width={width} />
);

/** Kotak orbital (spin-orbital / orbital ruang). */
export const OrbBox: React.FC<{x: number; y: number; w?: number; h?: number; color?: string; opacity?: number; label?: React.ReactNode; dash?: string}> = ({
  x,
  y,
  w = 150,
  h = 120,
  color = C.violet,
  opacity = 1,
  label,
  dash,
}) => (
  <g opacity={opacity}>
    <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={12} fill="rgba(12,18,40,0.88)" stroke={color} strokeWidth={3.5} strokeDasharray={dash} />
    {label ? (
      <text x={x} y={y + h / 2 + 34} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.serif} fontStyle="italic" fontSize={34} fill={color}>
        {label}
      </text>
    ) : null}
  </g>
);

/** Tanda silang merah (dua garis diagonal) yang tergambar progresif. */
export const Cross: React.FC<{x: number; y: number; r: number; p: number; width?: number}> = ({x, y, r, p, width = 12}) => {
  if (p <= 0) return null;
  const a = Math.min(1, p * 2);
  const b = Math.max(0, p * 2 - 1);
  return (
    <g>
      <line x1={x - r} y1={y - r} x2={x - r + 2 * r * a} y2={y - r + 2 * r * a} stroke={C.red} strokeWidth={width} strokeLinecap="round" />
      {b > 0 ? <line x1={x + r} y1={y - r} x2={x + r - 2 * r * b} y2={y - r + 2 * r * b} stroke={C.red} strokeWidth={width} strokeLinecap="round" /> : null}
    </g>
  );
};

/** Bintang kecil berkelip (malam). */
export const Stars: React.FC<{t: number; n?: number; opacity?: number; y1?: number}> = ({t, n = 60, opacity = 1, y1 = 520}) => (
  <g opacity={opacity}>
    {Array.from({length: n}, (_, i) => {
      const x = 90 + rand(i * 4.17 + 0.3) * 1740;
      const y = 60 + rand(i * 7.31 + 1.1) * (y1 - 60);
      const tw = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * (0.8 + rand(i) * 1.6) + i));
      return <circle key={i} cx={x} cy={y} r={1 + rand(i * 2.9) * 1.8} fill="#e6ecff" opacity={0.55 * tw} />;
    })}
  </g>
);

const CIPHER = 'ΣΔΞΩΦΨ#%&§¶01234567892PDSFGJLΛΓ';
/** Satu karakter "teks rahasia": glif acak berkedip (pudar keluar–masuk), lalu terkuak menjadi `ch` pada waktu `at`. */
export const CipherChar: React.FC<{ch: string; t: number; at: number; seed: number; color: string; start?: number}> = ({ch, t, at, seed, color, start = -99}) => {
  const rate = 7;
  const u = t * rate + rand(seed) * 3;
  const k = Math.floor(u);
  const f = u - k;
  const blink = Math.pow(Math.sin(Math.PI * f), 0.6);
  const show = Math.min(1, Math.max(0, (t - start) / 0.4));
  const reveal = Math.min(1, Math.max(0, (t - at) / 0.45));
  const glyph = CIPHER[Math.floor(rand(seed * 13.7 + k * 1.91) * CIPHER.length)];
  return (
    <span style={{position: 'relative', display: 'inline-block', textAlign: 'center'}}>
      <span style={{opacity: 0}}>{ch}</span>
      <span style={{position: 'absolute', left: 0, right: 0, top: 0, opacity: show * blink * (1 - reveal) * 0.85, color: C.mint, fontFamily: FONT.mono}}>{glyph}</span>
      <span style={{position: 'absolute', left: 0, right: 0, top: 0, opacity: reveal, color}}>{ch}</span>
    </span>
  );
};
