// "Mesin operator": kotak bercahaya yang menerima fungsi di kiri dan mengeluarkan fungsi di kanan.
import React from 'react';
import {C, FONT} from '../theme';

export const fnPath = (f: (u: number) => number, x: number, y: number, w: number, sy: number, n = 160) =>
  Array.from({length: n + 1}, (_, k) => `${k ? 'L' : 'M'}${(x + (k / n) * w).toFixed(1)},${(y - f(k / n) * sy).toFixed(1)}`).join(' ');

export const Machine: React.FC<{
  x: number;
  y: number;
  w?: number;
  h?: number;
  label: React.ReactNode;
  t: number;
  active?: number; // 0..1 lampu menyala saat memproses
  color?: string;
  opacity?: number;
}> = ({x, y, w = 300, h = 190, label, t, active = 0, color = C.gold, opacity = 1}) => (
  <g opacity={opacity}>
    <rect x={x - w / 2 - 8} y={y - h / 2 - 8} width={w + 16} height={h + 16} rx={30} fill={color} opacity={0.08 + 0.18 * active} />
    <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={24} fill="rgba(14,20,44,0.95)" stroke={color} strokeWidth={3} />
    {/* corong masuk & keluar */}
    <path d={`M${x - w / 2 - 40},${y - 50} L${x - w / 2},${y - 30} L${x - w / 2},${y + 30} L${x - w / 2 - 40},${y + 50} Z`} fill="rgba(14,20,44,0.95)" stroke={color} strokeWidth={2} />
    <path d={`M${x + w / 2 + 40},${y - 50} L${x + w / 2},${y - 30} L${x + w / 2},${y + 30} L${x + w / 2 + 40},${y + 50} Z`} fill="rgba(14,20,44,0.95)" stroke={color} strokeWidth={2} />
    {/* roda gigi kecil */}
    {[-1, 1].map((s) => (
      <g key={s} transform={`translate(${x + s * (w / 2 - 34)} ${y + h / 2 - 32}) rotate(${(t * 90 * s * (0.2 + active)) % 360})`}>
        <circle r={14} fill="none" stroke={color} strokeWidth={3} opacity={0.6} />
        {Array.from({length: 8}, (_, k) => (
          <line key={k} x1={0} y1={-14} x2={0} y2={-20} stroke={color} strokeWidth={4} opacity={0.6} transform={`rotate(${k * 45})`} />
        ))}
      </g>
    ))}
    <foreignObject x={x - w / 2} y={y - h / 2 + 10} width={w} height={h - 60}>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT.serif,
          fontSize: 64,
          color: C.ink,
          whiteSpace: 'nowrap',
        }}
      >
        <span>{label}</span>
      </div>
    </foreignObject>
  </g>
);

/** Panel kecil berisi grafik fungsi dengan sumbu. */
export const FnPanel: React.FC<{
  x: number;
  y: number;
  w: number;
  f: (u: number) => number;
  sy: number;
  color: string;
  label?: React.ReactNode;
  opacity?: number;
  draw?: number;
}> = ({x, y, w, f, sy, color, label, opacity = 1, draw = 1}) => (
  <g opacity={opacity}>
    <line x1={x} y1={y} x2={x + w} y2={y} stroke={C.faint} strokeWidth={2} />
    <path d={fnPath(f, x, y, w, sy)} fill="none" stroke={color} strokeWidth={5} strokeDasharray={`${2400 * draw} 2400`} pathLength={2400} />
    {label ? (
      <text x={x + w / 2} y={y + sy + 46} textAnchor="middle" fontFamily={FONT.serif} fontStyle="italic" fontSize={30} fill={color}>
        {label}
      </text>
    ) : null}
  </g>
);
