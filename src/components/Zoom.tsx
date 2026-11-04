import React from 'react';
import {interpolate} from 'remotion';
import {C, FONT, H, W} from '../theme';

// Bahasa visual intro SCIENTIAN: HUD skala 10ⁿ m + kisi milimeter yang ikut membesar.

/** HUD skala (HTML — letakkan di luar <Stage>). level = posisi pecahan di antara tingkat. */
export const ScaleHud: React.FC<{level: number; exps: number[]; names: string[]; colors: string[]; alpha: number}> = ({level, exps, names, colors, alpha}) => {
  if (alpha <= 0) return null;
  const top = exps.length - 1;
  const l = Math.min(top, Math.max(0, level));
  const exp = Math.round(interpolate(l, exps.map((_, i) => i), exps));
  const idx = Math.round(l);
  const labelO = 1 - Math.min(1, Math.max(0, (Math.abs(l - idx) - 0.3) / 0.2));
  const col = colors[idx];
  const phase = (level % 1) * 36;
  return (
    <div style={{position: 'absolute', left: 96, top: 640, opacity: alpha, color: C.ink}}>
      <svg width={260} height={22} style={{display: 'block', overflow: 'visible'}}>
        <line x1={0} y1={14} x2={240} y2={14} stroke={C.ink} strokeWidth={1.5} opacity={0.7} />
        {Array.from({length: 8}, (_, i) => {
          const x = (i * 36 - phase + 288) % 288;
          return x <= 240 ? <line key={i} x1={x} y1={14} x2={x} y2={i % 2 ? 8 : 2} stroke={C.ink} strokeWidth={1.2} opacity={0.6} /> : null;
        })}
        <line x1={0} y1={2} x2={0} y2={20} stroke={col} strokeWidth={2.5} />
        <line x1={240} y1={2} x2={240} y2={20} stroke={col} strokeWidth={2.5} />
      </svg>
      <div style={{fontFamily: FONT.mono, fontSize: 40, marginTop: 12, letterSpacing: 1}}>
        ≈ 10
        <sup style={{fontSize: 24, marginLeft: 3, color: col}}>{exp < 0 ? `−${-exp}` : exp}</sup>
        <span style={{fontSize: 30, marginLeft: 12, opacity: 0.8}}>m</span>
      </div>
      <div style={{opacity: labelO, fontFamily: FONT.sans, fontWeight: 700, fontSize: 26, letterSpacing: 6, marginTop: 6, color: col}}>{names[idx]}</div>
    </div>
  );
};

/** Kisi milimeter (SVG) yang terus membesar: k = faktor zoom (≥ 1). */
export const ZoomGrid: React.FC<{k: number; alpha: number; cx?: number; cy?: number}> = ({k, alpha, cx = W / 2, cy = H / 2}) => {
  if (alpha <= 0) return null;
  const m = Math.floor(Math.log10(k));
  const sp = 26 * (k / 10 ** m); // 26–260 px
  const fine: string[] = [];
  const bold: string[] = [];
  const ox = cx % sp;
  const oy = cy % sp;
  let n = 0;
  for (let x = ox - sp * 20; x <= W; x += sp, n++) if (x >= 0) (Math.round((x - cx) / sp) % 10 === 0 ? bold : fine).push(`M${x.toFixed(1)},0V${H}`);
  for (let y = oy - sp * 20; y <= H; y += sp) if (y >= 0) (Math.round((y - cy) / sp) % 10 === 0 ? bold : fine).push(`M0,${y.toFixed(1)}H${W}`);
  void n;
  return (
    <g opacity={alpha}>
      <path d={fine.join('')} stroke="#8fb0ff" strokeWidth={1} opacity={0.06 * Math.min(1, (sp - 26) / 60 + 0.3)} />
      <path d={bold.join('')} stroke="#8fb0ff" strokeWidth={1.2} opacity={0.1} />
    </g>
  );
};

/**
 * Tingkat zoom berurutan (gaya "powers of ten"): tingkat i tampil penuh saat level = i,
 * membesar R× menuju tingkat berikutnya lalu memudar, sementara tingkat berikutnya
 * tumbuh dari titik fokus di tengah.
 */
export const zoomLayer = (level: number, i: number, R = 9) => {
  const d = level - i;
  const scale = Math.pow(R, d);
  const op = d < -0.75 ? 0 : d < -0.35 ? (d + 0.75) / 0.4 : d < 0.45 ? 1 : d < 0.8 ? 1 - (d - 0.45) / 0.35 : 0;
  return {scale, op};
};
