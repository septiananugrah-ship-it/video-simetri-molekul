import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, mix, ramp, win} from '../anim';
import {Card, Glow, Stage, Sub} from '../components/primitives';
import {Leaf} from '../components/poC';
import {CHFCLBR, Mark, SyDefs, axisB, invLines, invPoint, molB, molPos, planeB, reflect, scr} from '../components/syB';
import {Render3D, VbDefs, proj, rotX, rotZ, type Cam, type Item, type V3} from '../components/vbC';
import {RichLabel} from '../components/vbD';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Bab 05: kiral ⇔ tanpa Sₙ (tanpa σ, tanpa i, tanpa Sₙ). CHFClBr & bayangannya tak bisa ditumpuk (F/Cl tertukar);
// tangan kiri vs sarung tangan kanan; (R)-karvon mint & (S)-karvon jintan + reseptor kiral; obat satu bentuk cermin.
const MIRX = (v: V3): V3 => [-v[0], v[1], v[2]];

/* ---------- tangan / sarung tangan (telapak menghadap penonton; tangan kiri: ibu jari di kanan) ---------- */
const HAND_SHAPES = (
  <>
    <rect x={-42} y={-20} width={84} height={82} rx={24} />
    <rect x={-43} y={-70} width={20} height={70} rx={10} />
    <rect x={-20} y={-96} width={20} height={96} rx={10} />
    <rect x={3} y={-102} width={20} height={102} rx={10} />
    <rect x={26} y={-90} width={20} height={90} rx={10} />
    <rect x={36} y={-14} width={24} height={66} rx={12} transform="rotate(28 48 48)" />
  </>
);
const Hand: React.FC<{x: number; y: number; s?: number; right?: boolean; glove?: boolean; opacity?: number; rot?: number}> = ({x, y, s = 1, right, glove, opacity = 1, rot = 0}) =>
  opacity <= 0.001 ? null : (
    <g opacity={opacity} transform={`translate(${x} ${y}) rotate(${rot}) scale(${right ? -s : s} ${s})`}>
      <g fill={glove ? C.violet : '#f0c9a8'} stroke={glove ? '#e2d8ff' : '#7a4f36'} strokeWidth={9} strokeLinejoin="round">
        {HAND_SHAPES}
      </g>
      <g fill={glove ? '#3b2a7a' : '#f3d2b6'}>{HAND_SHAPES}</g>
      {glove ? <rect x={-44} y={52} width={88} height={20} rx={8} fill="#5a44b0" /> : null}
    </g>
  );

/* ---------- karvon: rumus kerangka dengan baji (geometri benar untuk R) ---------- */
// koordinat bidang (x kanan, y atas); kedalaman d (negatif = ke arah penonton)
const CV: Record<string, [number, number, number]> = {
  C1: [0, 1, 0],
  C2: [0.866, 0.5, 0],
  C3: [0.866, -0.5, 0],
  C4: [0, -1, 0],
  C5: [-0.866, -0.5, 0],
  C6: [-0.866, 0.5, 0],
  O: [0, 2, 0],
  Me: [1.732, 1.0, 0],
  Ci: [-1.732, -1.0, -0.6],
  Cm: [-2.598, -0.5, -0.6],
  Cn: [-1.732, -2.0, -0.6],
};
const CB: [string, string, number][] = [
  ['C1', 'C2', 1],
  ['C2', 'C3', 2],
  ['C3', 'C4', 1],
  ['C4', 'C5', 1],
  ['C5', 'C6', 1],
  ['C6', 'C1', 1],
  ['C1', 'O', 2],
  ['C2', 'Me', 1],
  ['Ci', 'Cm', 2],
  ['Ci', 'Cn', 1],
];
const Carvone: React.FC<{cam: Cam; mirror?: boolean; color: string; opacity?: number}> = ({cam, mirror, color, opacity = 1}) => {
  if (opacity <= 0.001) return null;
  const P = (k: string) => {
    const [x, y, d] = CV[k];
    return proj([mirror ? -x : x, d, y], cam);
  };
  const RING = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'].map(P);
  const ring: [number, number] = [RING.reduce((a, q) => a + q.X, 0) / 6, RING.reduce((a, q) => a + q.Y, 0) / 6];
  const w = 6;
  const lines: React.ReactNode[] = [];
  CB.forEach(([a, b, o], i) => {
    const A = P(a);
    const B = P(b);
    let ax = A.X;
    let ay = A.Y;
    let bx = B.X;
    let by = B.Y;
    if (b === 'O') {
      const L = Math.hypot(bx - ax, by - ay);
      bx -= ((bx - ax) / L) * 22;
      by -= ((by - ay) / L) * 22;
    }
    lines.push(<line key={`a${i}`} x1={ax} y1={ay} x2={bx} y2={by} stroke={C.ink} strokeWidth={w} strokeLinecap="round" />);
    if (o === 2) {
      // garis kedua: ke arah pusat cincin (atau sejajar untuk ikatan luar cincin)
      const L = Math.hypot(bx - ax, by - ay);
      let nx = -(by - ay) / L;
      let ny = (bx - ax) / L;
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      if ((ring[0] - mx) * nx + (ring[1] - my) * ny < 0) {
        nx = -nx;
        ny = -ny;
      }
      const off = 13;
      const sh = a === 'C1' && b === 'O' ? 0 : 0.14;
      const x1 = ax + (bx - ax) * sh + nx * off;
      const y1 = ay + (by - ay) * sh + ny * off;
      const x2 = bx - (bx - ax) * sh + nx * off;
      const y2 = by - (by - ay) * sh + ny * off;
      lines.push(<line key={`b${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.ink} strokeWidth={w * 0.8} strokeLinecap="round" />);
    }
  });
  // baji C5 → Ci (gugus isopropenil ke arah penonton)
  const A = P('C5');
  const B = P('Ci');
  const L = Math.hypot(B.X - A.X, B.Y - A.Y);
  const nx = -(B.Y - A.Y) / L;
  const ny = (B.X - A.X) / L;
  const wedge = `M${A.X},${A.Y} L${B.X + nx * 13},${B.Y + ny * 13} L${B.X - nx * 13},${B.Y - ny * 13} Z`;
  const Op = P('O');
  const c5 = P('C5');
  return (
    <g opacity={opacity}>
      <circle cx={c5.X} cy={c5.Y} r={30} fill={color} opacity={0.22} />
      {lines}
      <path d={wedge} fill={color} stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <text x={Op.X} y={Op.Y} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.sans} fontWeight={700} fontSize={40} fill={C.red}>
        O
      </text>
      <circle cx={c5.X} cy={c5.Y} r={6} fill={color} />
    </g>
  );
};

/* ---------- token kiral & reseptor (satuan u) ---------- */
const TOKEN: [number, number][] = [
  [-1.3, -0.7],
  [1.3, -0.7],
  [1.3, 0],
  [0.8, 0],
  [0.8, 0.85],
  [0.2, 0.85],
  [0.2, 0],
  [-0.6, 0],
  [-0.6, -0.3],
  [-1.1, -0.3],
  [-1.1, 0],
  [-1.3, 0],
];
const RECEPTOR: [number, number][] = [
  [-1.8, 0],
  [-1.05, 0],
  [-1.05, -0.28],
  [-0.65, -0.28],
  [-0.65, 0],
  [0.15, 0],
  [0.15, 0.92],
  [0.85, 0.92],
  [0.85, 0],
  [1.8, 0],
  [1.8, 1.55],
  [-1.8, 1.55],
];
const polyD = (pts: [number, number][], x: number, y: number, u: number, flip = false) => `M${pts.map(([a, b]) => `${(x + (flip ? -a : a) * u).toFixed(1)},${(y + b * u).toFixed(1)}`).join(' L')} Z`;
const Token: React.FC<{x: number; y: number; u: number; flip?: boolean; color: string; label: string; opacity?: number; glow?: number}> = ({x, y, u, flip, color, label, opacity = 1, glow = 0}) =>
  opacity <= 0.001 ? null : (
    <g opacity={opacity}>
      {glow > 0.01 ? <path d={polyD(TOKEN, x, y, u, flip)} fill="none" stroke={color} strokeWidth={16} strokeOpacity={0.3 * glow} strokeLinejoin="round" /> : null}
      <path d={polyD(TOKEN, x, y, u, flip)} fill={color} fillOpacity={0.85} stroke="#fff" strokeOpacity={0.7} strokeWidth={2.5} strokeLinejoin="round" />
      <text x={x} y={y - 0.36 * u} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.sans} fontWeight={800} fontSize={u * 0.55} fill="#0b1022">
        {label}
      </text>
    </g>
  );
const Receptor: React.FC<{x: number; y: number; u: number; t: number; opacity?: number; glow?: number}> = ({x, y, u, t, opacity = 1, glow = 0}) =>
  opacity <= 0.001 ? null : (
    <g opacity={opacity}>
      <path d={polyD(RECEPTOR, x, y, u)} fill="#2a2152" stroke={C.violet} strokeWidth={3} strokeLinejoin="round" />
      {[0, 1, 2, 3, 4].map((k) => (
        <circle key={k} cx={x + (-1.4 + 0.7 * k) * u} cy={y + (1.05 + 0.12 * Math.sin(t * 1.6 + k)) * u} r={u * 0.13} fill={C.violet} opacity={0.35} />
      ))}
      {glow > 0.01 ? <path d={polyD(RECEPTOR, x, y, u)} fill="none" stroke={C.mint} strokeWidth={10} strokeOpacity={0.35 * glow} strokeLinejoin="round" /> : null}
    </g>
  );

const Seeds: React.FC<{x: number; y: number; t: number; opacity?: number}> = ({x, y, t, opacity = 1}) =>
  opacity <= 0.001 ? null : (
    <g opacity={opacity}>
      {[
        [-18, 0, -25],
        [14, -6, 18],
        [0, 14, 70],
      ].map(([dx, dy, r], k) => (
        <g key={k} transform={`translate(${x + dx} ${y + dy}) rotate(${r + 5 * Math.sin(t + k)})`}>
          <ellipse rx={9} ry={24} fill="#c98a3a" stroke="#7a4f1e" strokeWidth={2} />
          <line x1={0} y1={-20} x2={0} y2={20} stroke="#f1c27d" strokeWidth={2} opacity={0.8} />
          <line x1={-4.5} y1={-16} x2={-4.5} y2={16} stroke="#7a4f1e" strokeWidth={1.5} opacity={0.7} />
          <line x1={4.5} y1={-16} x2={4.5} y2={16} stroke="#7a4f1e" strokeWidth={1.5} opacity={0.7} />
        </g>
      ))}
    </g>
  );

const Pill: React.FC<{x: number; y: number; t: number; opacity?: number}> = ({x, y, t, opacity = 1}) =>
  opacity <= 0.001 ? null : (
    <g opacity={opacity} transform={`translate(${x} ${y + 8 * Math.sin(t * 1.4)}) rotate(${-24 + 3 * Math.sin(t * 0.9)})`}>
      <ellipse cx={0} cy={92} rx={150} ry={18} fill="#000" opacity={0.3} />
      <path d="M-150,0 a62,62 0 0 1 62,-62 L0,-62 L0,62 L-88,62 a62,62 0 0 1 -62,-62 Z" fill={C.mint} />
      <path d="M0,-62 L88,-62 a62,62 0 0 1 0,124 L0,62 Z" fill="#eef2ff" />
      <path d="M-120,-30 Q-60,-52 60,-48" fill="none" stroke="#fff" strokeWidth={10} strokeLinecap="round" opacity={0.55} />
      <line x1={0} y1={-62} x2={0} y2={62} stroke="#0b1022" strokeWidth={3} opacity={0.4} />
    </g>
  );

export const Chiral: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();
  const out = 1 - ramp(t, dur - 0.9, dur - 0.1, EASE_IN_OUT);
  const bump = (p: number) => Math.sin(Math.PI * Math.max(0, Math.min(1, p)));

  // ---------- molekul CHFClBr (fase 1–2) ----------
  const molIn = ramp(t, -0.3, 0.9);
  const pairT = ramp(t, cue(2) - 0.6, cue(2) + 0.6, EASE_IN_OUT);
  const phM = molIn * (1 - ramp(t, cue(3) - 0.6, cue(3) + 0.1, EASE_IN_OUT));
  const yaw = 0.35 * t;
  const view = (v: V3) => rotZ(v, yaw);
  const cam: Cam = {cx: mix(760, 960, pairT), cy: mix(490, 590, pairT), s: mix(185, 160, pairT), yaw: 0.32, pitch: -0.24};
  const cO: V3 = [mix(0, -1.95, pairT), 0, 0];

  // percobaan unsur simetri (baris 1)
  const tS = wordOf(1, 'tanpa', 0);
  const tI = wordOf(1, 'tanpa', 1);
  const tN = wordOf(1, 'tanpa', 2);
  const aS = win(t, tS, tS + 1.5, 0.4, 0.5);
  const aI = win(t, tI, tI + 1.5, 0.4, 0.5);
  const aN = win(t, tN, tN + 1.6, 0.4, 0.5);
  const oriP = molPos(CHFCLBR, {view, center: cO});
  const items: Item[] = [
    ...molB(cam, CHFCLBR, {
      view,
      center: cO,
      tint: (i) => (i >= 2 ? [C.red, Math.max(aS * (i === 3 || i === 4 ? 1 : 0), aI, aN)] : null),
    }),
    ...planeB(cam, {center: cO, u: view([0, 1, 0]), v: [0, 0, 1], a: 1.5, b: 1.3, opacity: aS, p: aS, color: C.cyan}),
    ...molB(cam, CHFCLBR, {view: (v) => reflect(view(v), view([1, 0, 0])), center: cO, ghost: true, opacity: aS}),
    invPoint(cam, {center: cO, t, opacity: aI, r: 10}),
    ...invLines(cam, oriP, {center: cO, opacity: aI}),
    ...molB(cam, CHFCLBR, {view: (v) => [-view(v)[0], -view(v)[1], -view(v)[2]], center: cO, ghost: true, opacity: aI}),
    ...axisB(cam, {center: cO, dir: view([0.6, -0.5, 0.62]), len: 1.6, color: C.violet, opacity: aN, spin: 1.5 * t, arrow: 1}),
  ].filter((x): x is Item => !!x);

  // bayangan cermin + usaha menumpuk (baris 2)
  const imgIn = ramp(t, cue(2) - 0.2, cue(2) + 0.8);
  const tD = wordOf(2, 'ditumpuk');
  const sOv = ramp(t, tD + 0.1, tD + 2.3, EASE_IN_OUT) * (1 - ramp(t, wordOf(2, 'tangan', 0) - 0.2, wordOf(2, 'tangan', 0) + 1.4, EASE_IN_OUT));
  const tumble = bump(ramp(t, tD + 0.3, tD + 2.3));
  const miss = ramp(t, tD + 2.2, tD + 2.7) * (1 - ramp(t, wordOf(2, 'tangan', 0) - 0.2, wordOf(2, 'tangan', 0) + 0.4, EASE_IN_OUT));
  const psi = mix(-yaw, yaw + (2 * Math.PI) / 3, sOv) + 0.9 * tumble;
  const cI: V3 = [mix(1.95, -1.95, sOv), 0, mix(0, 0.0, sOv)];
  const imgView = (v: V3) => rotX(rotZ(MIRX(v), psi), 0.55 * tumble);
  const imgItems: Item[] = [
    ...planeB(cam, {center: [0, 0, 0.1], u: [0, 1, 0], v: [0, 0, 1], a: 1.25, b: 1.45, p: imgIn, opacity: imgIn * (1 - 0.5 * sOv)}),
    ...molB(cam, CHFCLBR, {view: imgView, center: cI, opacity: imgIn * (1 - 0.3 * sOv), tint: (i) => (i === 2 || i === 3 ? [C.red, miss] : null)}),
  ];
  const all: Item[] = [...items, ...(pairT > 0.01 ? imgItems : [])];
  const markPos = scr(cam, [cO[0], 0, 1.7]);
  const mirLab = scr(cam, [0, 0, -1.45]);

  // tangan
  const hIn = ramp(t, wordOf(2, 'tangan', 0) - 0.3, wordOf(2, 'tangan', 0) + 0.5) * (1 - ramp(t, cue(3) - 0.6, cue(3) + 0.1, EASE_IN_OUT));
  const hMove = ramp(t, wordOf(2, 'cocok') - 0.2, wordOf(2, 'cocok') + 1.4, EASE_IN_OUT);
  const hMiss = ramp(t, wordOf(2, 'cocok') + 1.2, wordOf(2, 'cocok') + 1.7);

  // ---------- karvon (baris 3) ----------
  const tK = wordOf(3, 'Karvon');
  const kIn = ramp(t, tK - 0.4, tK + 0.6) * (1 - ramp(t, wordOf(4, 'satu') - 0.8, wordOf(4, 'satu') - 0.1, EASE_IN_OUT));
  const tR = wordOf(3, 'reseptor');
  const shrink = ramp(t, tR - 0.6, tR + 0.4, EASE_IN_OUT);
  const rock = 0.22 * Math.sin(0.55 * t);
  const kCam = (cx: number): Cam => ({cx: mix(cx, cx + (cx < 960 ? 40 : -40), shrink), cy: mix(420, 300, shrink), s: mix(108, 70, shrink), yaw: rock, pitch: 0.05});
  const labY = mix(645, 470, shrink);
  const mintL = ramp(t, wordOf(3, 'mint') - 0.3, wordOf(3, 'mint') + 0.5);
  const jinL = ramp(t, wordOf(3, 'jintan') - 0.3, wordOf(3, 'jintan') + 0.5);
  const recIn = ramp(t, tR - 0.3, tR + 0.5, BACK);
  const tokGo = ramp(t, tR + 0.3, tR + 1.9, EASE_IN_OUT);
  const tokIn = ramp(t, tR - 0.1, tR + 0.4);
  const U = 64;
  const SEAT = 770;
  const RX = [760, 1160];
  // R turun pas sampai dudukan; S terhenti oleh tonjolan (tab menabrak) → bergoyang
  const rY = mix(560, SEAT, tokGo);
  const sStop = SEAT - 1.13 * U;
  const sY = Math.min(mix(560, SEAT, tokGo), sStop) - (tokGo > 0 ? 6 * Math.sin(t * 9) * ramp(t, tR + 1.4, tR + 1.8) * (1 - ramp(t, tR + 2.6, tR + 3.2)) : 0);
  const fitOk = ramp(t, tR + 1.8, tR + 2.3);
  const kOut = 1 - ramp(t, wordOf(4, 'satu') - 0.8, wordOf(4, 'satu') - 0.1, EASE_IN_OUT);

  // ---------- obat (baris 4) ----------
  const pIn = ramp(t, wordOf(4, 'satu') - 0.5, wordOf(4, 'satu') + 0.4, BACK);
  const hands2 = ramp(t, wordOf(4, 'tubuh') - 0.3, wordOf(4, 'tubuh') + 0.5);

  // ---------- daftar periksa ----------
  const chk = ramp(t, cue(0) - 0.2, cue(0) + 0.6) * (1 - ramp(t, cue(2) - 0.6, cue(2) + 0.0, EASE_IN_OUT));
  const rows: {txt: React.ReactNode; tw: number}[] = [
    {
      txt: (
        <>
          tanpa bidang cermin <span style={{color: C.cyan}}>σ</span>
        </>
      ),
      tw: tS,
    },
    {
      txt: (
        <>
          tanpa pusat inversi <span style={{color: C.pink, fontStyle: 'italic', fontFamily: FONT.serif}}>i</span>
        </>
      ),
      tw: tI,
    },
    {
      txt: (
        <>
          tanpa sumbu{' '}
          <span style={{color: C.violet}}>
            S<Sub>n</Sub>
          </span>{' '}
          apa pun
        </>
      ),
      tw: tN,
    },
  ];

  return (
    <AbsoluteFill style={{opacity: out}}>
      <Stage>
        <VbDefs />
        <SyDefs />
        <Glow x={cam.cx} y={cam.cy} r={430} color="mint" opacity={(0.05 + 0.02 * Math.sin(t)) * phM} />

        <g opacity={phM}>
          <Render3D items={all} />
          <RichLabel x={cam.cx + mix(0, -312, pairT)} y={mix(850, 860, pairT)} parts={[['CHFClBr']]} size={34} color={C.muted} opacity={1 - hIn * 0} />
          <RichLabel x={mix(1272, 1272, pairT)} y={860} parts={[['bayangan cermin']]} size={30} color={C.muted} opacity={imgIn * (1 - sOv)} />
          <RichLabel x={mirLab[0]} y={mirLab[1] + 34} parts={[['cermin']]} size={30} color={C.cyan} opacity={imgIn * (1 - sOv)} />
          <Mark x={markPos[0] + 250} y={markPos[1] + 40} ok={false} p={miss} size={40} />
          <RichLabel x={markPos[0] + 250} y={markPos[1] + 108} parts={[['F & Cl tertukar']]} size={32} color={C.red} opacity={miss} />
        </g>

        <g opacity={hIn}>
          <Hand x={1160} y={235} s={0.9} right glove opacity={0.9} />
          <Hand x={mix(760, 1150, hMove)} y={235} s={0.8} opacity={0.88} />
          <RichLabel x={760} y={338} parts={[['tangan kiri']]} size={26} color={C.muted} opacity={1 - hMove} />
          <RichLabel x={1160} y={338} parts={[['sarung tangan kanan']]} size={26} color={C.muted} />
          <Mark x={1300} y={215} ok={false} p={hMiss} size={32} />
        </g>

        {/* karvon */}
        <g opacity={kIn}>
          <line x1={960} y1={mix(250, 190, shrink)} x2={960} y2={mix(610, 440, shrink)} stroke={C.cyan} strokeWidth={3} strokeDasharray="12 10" opacity={0.7} />
          <Carvone cam={kCam(620)} color={C.mint} />
          <Carvone cam={kCam(1300)} mirror color={C.amber} />
          <RichLabel x={mix(620, 660, shrink)} y={labY} parts={[['(R)-karvon']]} size={34} color={C.mint} />
          <RichLabel x={mix(1300, 1260, shrink)} y={labY} parts={[['(S)-karvon']]} size={34} color={C.amber} />
          <g opacity={1 - shrink}>
            <Leaf x={450} y={720} s={0.42} t={t} opacity={mintL} />
            <RichLabel x={560} y={725} parts={[['bau mint']]} size={32} color={C.mint} opacity={mintL} anchor="start" />
            <Seeds x={1150} y={722} t={t} opacity={jinL} />
            <RichLabel x={1200} y={725} parts={[['bau jintan']]} size={32} color={C.amber} opacity={jinL} anchor="start" />
          </g>
        </g>
        <g opacity={kOut}>
          <Receptor x={RX[0]} y={SEAT} u={U} t={t} opacity={recIn} glow={fitOk} />
          <Receptor x={RX[1]} y={SEAT} u={U} t={t} opacity={recIn} />
          <Token x={mix(660, RX[0], tokGo)} y={rY} u={U} color={C.mint} label="R" opacity={tokIn} glow={fitOk} />
          <Token x={mix(1260, RX[1], tokGo)} y={sY} u={U} flip color={C.amber} label="S" opacity={tokIn} />
          <Mark x={RX[0] - 170} y={SEAT - 30} ok p={fitOk} size={30} />
          <Mark x={RX[1] + 170} y={SEAT - 30} ok={false} p={fitOk} size={30} />
          <RichLabel x={960} y={SEAT + 110} parts={[['reseptor penciuman (kiral)']]} size={26} color={C.violet} opacity={recIn} />
        </g>

        {/* obat */}
        <g opacity={pIn}>
          <Pill x={700} y={500} t={t} />
          <Token x={1300} y={760} u={44} color={C.mint} label="" glow={0.6 + 0.4 * Math.sin(t * 2)} />
          <Token x={1600} y={760} u={44} flip color={C.muted} label="" opacity={0.45} />
          <Mark x={1300} y={650} ok p={ramp(t, wordOf(4, 'satu') + 0.2, wordOf(4, 'satu') + 0.7)} size={30} />
          <RichLabel x={1300} y={835} parts={[['bentuk yang dipakai']]} size={26} color={C.mint} />
          <RichLabel x={1600} y={835} parts={[['bayangan cerminnya']]} size={26} color={C.muted} />
          <Mark x={1600} y={650} ok={false} p={ramp(t, wordOf(4, 'satu') + 0.4, wordOf(4, 'satu') + 0.9)} size={30} />
          <Hand x={560} y={790} s={0.5} opacity={hands2} />
          <Hand x={840} y={790} s={0.5} right opacity={hands2} />
          <RichLabel x={700} y={870} parts={[['kiri ≠ kanan']]} size={28} color={C.muted} opacity={hands2} />
        </g>
      </Stage>

      {/* daftar periksa kiral */}
      <Card x={1470} y={460} opacity={chk} accent={C.red} style={{padding: '26px 36px'}}>
        <div style={{fontSize: 44, fontWeight: 700, marginBottom: 14, fontFamily: FONT.sans}}>
          kiral ⇔ tanpa{' '}
          <span style={{color: C.violet}}>
            S<Sub>n</Sub>
          </span>
        </div>
        {rows.map((r, k) => {
          const p = ramp(t, r.tw - 0.1, r.tw + 0.5);
          return (
            <div key={k} style={{display: 'flex', alignItems: 'center', gap: 18, fontSize: 35, margin: '12px 0', opacity: 0.45 + 0.55 * ramp(t, r.tw - 0.4, r.tw + 0.2)}}>
              <div style={{width: 40, height: 40, borderRadius: 8, border: `3px solid ${C.red}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.red, fontWeight: 800, fontSize: 30}}>
                <span style={{opacity: p, transform: `scale(${0.6 + 0.4 * p})`}}>✗</span>
              </div>
              <div>{r.txt}</div>
            </div>
          );
        })}
      </Card>

      <Card x={1460} y={420} opacity={pIn} accent={C.mint} style={{padding: '24px 40px', textAlign: 'center'}}>
        <div style={{fontSize: 58, fontWeight: 700}}>satu bentuk cermin</div>
        <div style={{fontSize: 28, color: C.muted, marginTop: 8}}>tubuh membedakan kiri dan kanan</div>
      </Card>
    </AbsoluteFill>
  );
};
