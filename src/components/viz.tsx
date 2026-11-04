import React from 'react';
import {mix, rand, sample, smoothPath} from '../anim';
import {C, FONT} from '../theme';

/* ------------------------------------------------------------------ */
/* Partikel dalam kotak: fungsi gelombang, energi, warna.               */
/* ------------------------------------------------------------------ */
/** E₁ elektron untuk L dalam nm (eV): E = 0,376030 n²/L². */
export const E1_EV = 0.37603;
/** hc dalam eV·nm. */
export const HC = 1239.842;
/** ψₙ(u) dengan u = x/L ∈ [0,1], satuan 1/√L. */
export const psi = (n: number, u: number) => (u < 0 || u > 1 ? 0 : Math.SQRT2 * Math.sin(n * Math.PI * u));
/** Warna per bilangan kuantum. */
export const NCOL = [C.gold, C.cyan, C.violet, C.mint, C.pink, C.blue, C.amber];
export const ncol = (n: number) => NCOL[(n - 1) % NCOL.length];
/** Format angka gaya Indonesia. */
export const id = (v: number, d = 2) => v.toFixed(d).replace('.', ',').replace('-', '−');

/** Warna kira-kira untuk panjang gelombang (nm); UV → ungu redup, IR → merah tua. */
export const wlColor = (nm: number) => {
  let r = 0;
  let g = 0;
  let b = 0;
  if (nm < 380) return '#7a5cff';
  if (nm > 750) return '#8a1a1a';
  if (nm < 440) [r, g, b] = [(440 - nm) / 60, 0, 1];
  else if (nm < 490) [r, g, b] = [0, (nm - 440) / 50, 1];
  else if (nm < 510) [r, g, b] = [0, 1, (510 - nm) / 20];
  else if (nm < 580) [r, g, b] = [(nm - 510) / 70, 1, 0];
  else if (nm < 645) [r, g, b] = [1, (645 - nm) / 65, 0];
  else [r, g, b] = [1, 0, 0];
  const f = nm < 420 ? 0.45 + (0.55 * (nm - 380)) / 40 : nm > 700 ? 0.45 + (0.55 * (750 - nm)) / 50 : 1;
  const c = (v: number) => Math.round(255 * Math.pow(v * f, 0.8));
  return `rgb(${Math.min(255, c(r) + 30)},${Math.min(255, c(g) + 30)},${Math.min(255, c(b) + 30)})`;
};

/** Kurva fungsi pada kotak plot: x dalam [x0,x1] → piksel, y skala sy. */
export const plotPath = (f: (u: number) => number, x0: number, x1: number, box: {x: number; y: number; w: number; sy: number}, n = 260) =>
  smoothPath(sample(f, x0, x1, n).map(([u, v]) => [box.x + ((u - x0) / (x1 - x0)) * box.w, box.y - v * box.sy]));

/** Path tertutup area di bawah kurva (untuk |ψ|²). */
export const areaPath = (f: (u: number) => number, x0: number, x1: number, box: {x: number; y: number; w: number; sy: number}, n = 200) => {
  const pts = sample(f, x0, x1, n).map(([u, v]) => `${(box.x + ((u - x0) / (x1 - x0)) * box.w).toFixed(1)},${(box.y - v * box.sy).toFixed(1)}`);
  return `M${box.x},${box.y} L${pts.join(' L')} L${box.x + box.w},${box.y} Z`;
};

/* ------------------------------------------------------------------ */
/* Foton: paket gelombang sinus dengan selubung Gauss.                 */
/* ------------------------------------------------------------------ */
export const PhotonPacket: React.FC<{
  x: number;
  y: number;
  wavelength: number;
  color: string;
  amp?: number;
  len?: number;
  opacity?: number;
  phase?: number;
  angle?: number;
}> = ({x, y, wavelength, color, amp = 28, len = 300, opacity = 1, phase = 0, angle = 0}) => {
  if (opacity <= 0) return null;
  const pts = sample((u) => amp * Math.exp(-((u / (len * 0.32)) ** 2)) * Math.sin((2 * Math.PI * u) / wavelength + phase), -len / 2, len / 2, 160);
  const d = smoothPath(pts);
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`} opacity={opacity}>
      <path d={d} fill="none" stroke={color} strokeWidth={10} opacity={0.25} filter="url(#glow-strong)" />
      <path d={d} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#fff" strokeWidth={1.3} opacity={0.7} />
    </g>
  );
};

/** Elektron kecil berwarna biru. */
export const Electron: React.FC<{x: number; y: number; r?: number; opacity?: number; label?: boolean; color?: string}> = ({x, y, r = 10, opacity = 1, label, color = C.cyan}) => (
  <g opacity={opacity}>
    <circle cx={x} cy={y} r={r * 3} fill="url(#soft-cyan)" opacity={0.6} />
    <circle cx={x} cy={y} r={r} fill={color} />
    <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.35} fill="#fff" opacity={0.7} />
    {label ? (
      <text x={x} y={y + 0.5} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.sans} fontWeight={700} fontSize={r * 1.2} fill="#04212e">
        e
      </text>
    ) : null}
  </g>
);

/** Kotak potensial tak hingga: dinding bercahaya + arsir di luar. p = 0..1 (dinding turun dari atas). */
export const Walls: React.FC<{x0: number; x1: number; top: number; bottom: number; p?: number; outside?: number; color?: string; hatch?: number}> = ({
  x0,
  x1,
  top,
  bottom,
  p = 1,
  outside = 120,
  color = C.ink,
  hatch = 1,
}) => {
  if (p <= 0) return null;
  const drop = (1 - p) * (bottom - top + 200);
  const h = bottom - top;
  return (
    <g opacity={Math.min(1, p * 2)}>
      <defs>
        <pattern id="hatch-wall" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="18" stroke={C.red} strokeWidth="3" strokeOpacity="0.35" />
        </pattern>
      </defs>
      <g transform={`translate(0 ${-drop})`}>
        <rect x={x0 - outside} y={top} width={outside} height={h} fill="url(#hatch-wall)" opacity={hatch} />
        <rect x={x1} y={top} width={outside} height={h} fill="url(#hatch-wall)" opacity={hatch} />
        {[x0, x1].map((x) => (
          <g key={x}>
            <line x1={x} y1={top} x2={x} y2={bottom} stroke={color} strokeWidth={10} opacity={0.18} />
            <line x1={x} y1={top} x2={x} y2={bottom} stroke={color} strokeWidth={5} strokeLinecap="round" />
          </g>
        ))}
      </g>
      <line x1={x0} y1={bottom} x2={x1} y2={bottom} stroke={C.muted} strokeWidth={2} opacity={0.7} />
    </g>
  );
};

/** Peta warna rapat peluang (0..1) → gelap-ungu-emas-putih. */
export const heat = (v: number) => {
  const s = Math.max(0, Math.min(1, v));
  const stops: [number, [number, number, number]][] = [
    [0, [6, 9, 22]],
    [0.3, [70, 30, 120]],
    [0.6, [230, 110, 60]],
    [0.85, [255, 194, 74]],
    [1, [255, 248, 225]],
  ];
  let i = 0;
  while (i < stops.length - 2 && s > stops[i + 1][0]) i++;
  const [a, ca] = stops[i];
  const [b, cb] = stops[i + 1];
  const f = (s - a) / (b - a);
  const c = ca.map((x, k) => Math.round(x + (cb[k] - x) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

const HEAT_URL: Record<string, string> = {};
/** Gambar peta panas halus (dibuat sekali lewat canvas di browser render). */
const heatURL = (nx: number, ny: number, ar: number) => {
  const key = `${nx}-${ny}-${ar.toFixed(2)}`;
  if (HEAT_URL[key]) return HEAT_URL[key];
  if (typeof document === 'undefined') return '';
  const W0 = 160;
  const H0 = Math.round(160 * ar);
  const cv = document.createElement('canvas');
  cv.width = W0;
  cv.height = H0;
  const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(W0, H0);
  for (let j = 0; j < H0; j++)
    for (let i = 0; i < W0; i++) {
      const u = (i + 0.5) / W0;
      const v = 1 - (j + 0.5) / H0;
      const d = Math.sin(nx * Math.PI * u) ** 2 * Math.sin(ny * Math.PI * v) ** 2;
      const m = heat(d).match(/\d+/g)!.map(Number);
      const o = (j * W0 + i) * 4;
      img.data[o] = m[0];
      img.data[o + 1] = m[1];
      img.data[o + 2] = m[2];
      img.data[o + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  HEAT_URL[key] = cv.toDataURL('image/png');
  return HEAT_URL[key];
};

/** Rapat peluang kotak 2D sebagai peta panas halus. */
export const Heatmap2D: React.FC<{x: number; y: number; w: number; h: number; nx: number; ny: number; cells?: number; opacity?: number; nodes?: number; label?: string}> = ({
  x,
  y,
  w,
  h,
  nx,
  ny,
  opacity = 1,
  nodes = 0,
  label,
}) => {
  if (opacity <= 0) return null;
  return (
    <g opacity={opacity}>
      <image href={heatURL(nx, ny, 1)} x={x} y={y} width={w} height={h} preserveAspectRatio="none" />
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={C.ink} strokeWidth={3} />
      {nodes > 0
        ? [
            ...Array.from({length: nx - 1}, (_, k) => <line key={`vx${k}`} x1={x + ((k + 1) * w) / nx} y1={y} x2={x + ((k + 1) * w) / nx} y2={y + h} stroke={C.cyan} strokeWidth={3} strokeDasharray="8 7" opacity={nodes} />),
            ...Array.from({length: ny - 1}, (_, k) => <line key={`hy${k}`} x1={x} y1={y + h - ((k + 1) * h) / ny} x2={x + w} y2={y + h - ((k + 1) * h) / ny} stroke={C.cyan} strokeWidth={3} strokeDasharray="8 7" opacity={nodes} />),
          ]
        : null}
      {label ? (
        <text x={x + w / 2} y={y - 24} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.serif} fontStyle="italic" fontSize={30} fill={C.ink}>
          {label}
        </text>
      ) : null}
    </g>
  );
};

/** Titik-titik sampel deterministik berdistribusi |ψ|² kotak 3D (kubus satuan, koordinat −1..1). */
const CLOUD: Record<string, {x: number; y: number; z: number; s: number}[]> = {};
export const boxCloud = (nx: number, ny: number, nz: number, count = 1600) => {
  const key = `${nx}${ny}${nz}-${count}`;
  if (CLOUD[key]) return CLOUD[key];
  const pts: {x: number; y: number; z: number; s: number}[] = [];
  let tries = 0;
  const seed = nx * 100 + ny * 10 + nz;
  while (pts.length < count && tries < 400000) {
    const u = rand(seed + tries * 3.7);
    const v = rand(seed + tries * 3.7 + 1.1);
    const w = rand(seed + tries * 3.7 + 2.3);
    const q = rand(seed + tries * 3.7 + 3.1);
    tries++;
    const f = Math.sin(nx * Math.PI * u) * Math.sin(ny * Math.PI * v) * Math.sin(nz * Math.PI * w);
    if (q < f * f) pts.push({x: u * 2 - 1, y: v * 2 - 1, z: w * 2 - 1, s: Math.sign(f)});
  }
  CLOUD[key] = pts;
  return pts;
};

/** Proyeksi titik 3D (yaw di sekitar sumbu tegak z, lalu pitch). */
export const project = (q: {x: number; y: number; z: number}, cx: number, cy: number, size: number, yaw: number, pitch: number) => {
  const x1 = q.x * Math.cos(yaw) - q.y * Math.sin(yaw);
  const d1 = q.x * Math.sin(yaw) + q.y * Math.cos(yaw);
  const z2 = q.z * Math.cos(pitch) - d1 * Math.sin(pitch);
  const d2 = q.z * Math.sin(pitch) + d1 * Math.cos(pitch);
  return {X: cx + x1 * size, Y: cy - z2 * size, depth: d2};
};

/** Kubus kawat + awan |ψ|². */
export const BoxCube: React.FC<{cx: number; cy: number; size: number; yaw: number; pitch?: number; n?: [number, number, number] | null; cloud?: number; opacity?: number; edge?: string}> = ({
  cx,
  cy,
  size,
  yaw,
  pitch = 0.42,
  n,
  cloud = 1,
  opacity = 1,
  edge = C.ink,
}) => {
  if (opacity <= 0) return null;
  const V = [-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => ({x, y, z}))));
  const P = V.map((v) => project(v, cx, cy, size, yaw, pitch));
  const E: [number, number][] = [];
  for (let i = 0; i < 8; i++)
    for (let j = i + 1; j < 8; j++) {
      const a = V[i];
      const b = V[j];
      if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z) === 2) E.push([i, j]);
    }
  const pts = n && cloud > 0 ? boxCloud(n[0], n[1], n[2]) : [];
  return (
    <g opacity={opacity}>
      {E.map(([i, j], k) => {
        const back = (P[i].depth + P[j].depth) / 2 > 0.4;
        return <line key={k} x1={P[i].X} y1={P[i].Y} x2={P[j].X} y2={P[j].Y} stroke={edge} strokeWidth={back ? 2 : 3.5} opacity={back ? 0.35 : 0.85} strokeDasharray={back ? '8 8' : undefined} />;
      })}
      <g opacity={cloud}>
        {pts.map((q, i) => {
          const p = project(q, cx, cy, size, yaw, pitch);
          const dd = 0.55 + 0.45 * (1 - (p.depth + 1.6) / 3.2);
          return <circle key={i} cx={p.X} cy={p.Y} r={2.6 * (0.7 + 0.5 * dd)} fill={q.s >= 0 ? C.gold : C.cyan} opacity={0.2 + 0.55 * dd} />;
        })}
      </g>
    </g>
  );
};

/** Botol kecil berisi larutan titik kuantum. glow 0..1 = berpendar; t > 0 menghidupkan percikan foton. */
export const Vial: React.FC<{x: number; y: number; w?: number; h?: number; color: string; glow?: number; opacity?: number; t?: number}> = ({x, y, w = 150, h = 330, color, glow = 0, opacity = 1, t}) => {
  const top = y - h / 2;
  const liquidTop = top + h * 0.3;
  const gid = `vial-${color.replace('#', '')}`;
  const body = `M${x - w / 2},${top + 30} L${x - w / 2},${y + h / 2 - 24} Q${x - w / 2},${y + h / 2} ${x - w / 2 + 24},${y + h / 2} L${x + w / 2 - 24},${y + h / 2} Q${x + w / 2},${y + h / 2} ${x + w / 2},${y + h / 2 - 24} L${x + w / 2},${top + 30} Z`;
  const lh = y + h / 2 - liquidTop - 8;
  return (
    <g opacity={opacity}>
      <defs>
        <radialGradient id={gid} cx="50%" cy="58%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.9} />
          <stop offset="22%" stopColor={color} stopOpacity={1} />
          <stop offset="100%" stopColor={color} stopOpacity={0.55} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y + h * 0.15} r={w * 1.15} fill={color} opacity={0.2 * glow} filter="url(#blur-soft)" />
      <rect x={x - w / 2 + 8} y={liquidTop} width={w - 16} height={lh} rx={18} fill={color} opacity={0.15 * (1 - glow)} />
      <rect x={x - w / 2 + 8} y={liquidTop} width={w - 16} height={lh} rx={18} fill={`url(#${gid})`} opacity={0.95 * glow} />
      <ellipse cx={x} cy={liquidTop + 4} rx={w / 2 - 10} ry={8} fill="#fff" opacity={0.25 * glow + 0.08} />
      {t !== undefined && glow > 0
        ? Array.from({length: 14}, (_, k) => {
            const ph = (t * (0.25 + 0.1 * rand(k * 3.1)) + rand(k * 7.7)) % 1;
            const px = x - w / 2 + 16 + rand(k * 5.3) * (w - 32) + 6 * Math.sin(t * 2 + k);
            const py = mix(y + h / 2 - 20, top - h * 0.35, ph);
            const a = Math.sin(Math.PI * ph) * glow;
            return <circle key={k} cx={px} cy={py} r={2 + 2.5 * rand(k * 1.9)} fill={color} opacity={a} filter="url(#glow)" />;
          })
        : null}
      <path d={body} fill="rgba(200,215,255,0.06)" stroke="#c8d6ff" strokeOpacity={0.6} strokeWidth={3} />
      <rect x={x - w / 2 + 14} y={top + 40} width={10} height={h - 90} rx={5} fill="#fff" opacity={0.22} />
      <rect x={x + w / 2 - 22} y={top + 60} width={5} height={h - 140} rx={3} fill="#fff" opacity={0.1} />
      <rect x={x - w / 2 - 6} y={top} width={w + 12} height={36} rx={8} fill="#2a3352" stroke="#4a5680" strokeWidth={2} />
    </g>
  );
};
