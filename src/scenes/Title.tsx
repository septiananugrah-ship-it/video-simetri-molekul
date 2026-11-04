import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, mix, rand, ramp} from '../anim';
import {Glow, Stage} from '../components/primitives';
import {VbDefs as VbADefs} from '../components/vbA';
import {Render3D, VbDefs, type Cam} from '../components/vbC';
import {BENZENE, H2O, NH3, axis3D, plane3D, rotArrow3D, symMol} from '../components/syA';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

const Letters: React.FC<{text: string; t: number; start: number; step: number; style: React.CSSProperties}> = ({text, t, start, step, style}) => (
  <div style={{display: 'flex', justifyContent: 'center', ...style}}>
    {text.split('').map((ch, i) => {
      const p = ramp(t, start + i * step, start + i * step + 0.9);
      return (
        <span key={i} style={{display: 'inline-block', whiteSpace: 'pre', opacity: p, translate: `0px ${(1 - p) * 40}px`, scale: String(0.92 + 0.08 * p)}}>
          {ch}
        </span>
      );
    })}
  </div>
);

// Simbol simetri yang melayang samar di latar.
const sb = (s: number, v: string, col?: string) => (
  <tspan fontSize={s * 0.6} baselineShift="sub" fill={col}>
    {v}
  </tspan>
);
const FLOATS: ((s: number) => React.ReactNode)[] = [
  (s) => (
    <>
      <tspan fill={C.gold}>C</tspan>
      {sb(s, '2v', C.gold)}
    </>
  ),
  (s) => (
    <>
      <tspan fill={C.cyan}>D</tspan>
      {sb(s, '6h', C.cyan)}
    </>
  ),
  (s) => (
    <>
      <tspan fill={C.ink}>T</tspan>
      {sb(s, 'd', C.ink)}
    </>
  ),
  () => <tspan fill={C.cyan}>σ</tspan>,
  () => <tspan fill={C.pink}>i</tspan>,
  (s) => (
    <>
      <tspan fill={C.violet}>S</tspan>
      {sb(s, '4', C.violet)}
    </>
  ),
  (s) => (
    <>
      <tspan fill={C.gold}>C</tspan>
      {sb(s, '3', C.gold)}
    </>
  ),
  (s) => (
    <>
      <tspan fill={C.cyan}>σ</tspan>
      {sb(s, 'h', C.cyan)}
    </>
  ),
  () => <tspan fill={C.ink}>E</tspan>,
  (s) => (
    <>
      <tspan fill={C.mint}>O</tspan>
      {sb(s, 'h', C.mint)}
    </>
  ),
  (s) => (
    <>
      <tspan fill={C.gold}>C</tspan>
      {sb(s, '3v', C.gold)}
    </>
  ),
  (s) => (
    <>
      <tspan fill={C.violet}>S</tspan>
      {sb(s, '6', C.violet)}
    </>
  ),
];

const NH3M = NH3();
const H2OM = H2O();
const BZ = BENZENE(1.39, 2.47, false);

export const Title: React.FC = () => {
  const {t} = useScene();
  const bg = ramp(t, 0.1, 2.0, EASE_IN_OUT);
  const sub = ramp(t, 2.6, 3.6);
  const line = ramp(t, 1.8, 3.2, EASE_IN_OUT);
  const meet = ramp(t, 0.2, 4.0, EASE_IN_OUT);
  const flashP = ramp(t, 3.6, 5.2);
  // NH₃ kiri: putaran C₃ bertahap berulang (120° tiap 2,4 dtk), sumbu emas + panah putar
  const step = Math.max(0, t) / 2.4;
  const k3 = Math.floor(step);
  const f3 = EASE_IN_OUT(Math.min(1, (step - k3) / 0.55));
  const camL: Cam = {cx: 250, cy: 540, s: 130, yaw: 0.5, pitch: -0.42};
  const leftItems = [
    ...axis3D(camL, {dir: [0, 0, 1], len: 1.75, center: [0, 0, 0.1], width: 4, glow: 0.6}),
    ...rotArrow3D(camL, {at: [0, 0, 1.2], dir: [0, 0, 1], r: 0.5, from: -0.6 + (k3 + f3) * 2.094, sweep: 4.4, width: 3.5}),
    ...symMol(camL, NH3M, {op: {kind: 'C', axis: [0, 0, 1], deg: 120 * (k3 + f3)}, p: 1, labels: false}),
  ];
  // H₂O kanan: bidang cermin sian (yz) dan molekul yang berputar pelan
  const camR: Cam = {cx: 1680, cy: 540, s: 140, yaw: 0.65 + 0.35 * Math.sin(t * 0.5), pitch: -0.3};
  const rightItems = [
    ...plane3D(camR, {u: [0, 1, 0], v: [0, 0, 1], w: 1.2, h: 1.25, center: [0, 0, -0.15], p: ramp(t, 0.4, 2.2, EASE_IN_OUT)}),
    ...symMol(camR, H2OM, {labels: false}),
  ];
  // benzena besar samar di belakang judul (D₆h)
  const camC: Cam = {cx: 960, cy: 470, s: mix(70, 92, meet), yaw: t * 0.12, pitch: -1.05};
  const centerItems = [...axis3D(camC, {dir: [0, 0, 1], len: 3.0, width: 3}), ...symMol(camC, BZ, {labels: false, hR: 0.24})];
  return (
    <AbsoluteFill>
      <Stage>
        <VbDefs />
        <VbADefs />
        <Glow x={960} y={470} r={640} color="gold" opacity={0.12 * bg} />
        <Render3D items={centerItems} opacity={0.2 * ramp(t, 0.6, 4.6, EASE_IN_OUT)} />
        <Render3D items={leftItems} opacity={0.42 * bg * (0.85 + 0.15 * Math.sin(t * 0.9))} />
        <Render3D items={rightItems} opacity={0.4 * bg} />
        <circle cx={960} cy={470} r={420 * flashP + 80} fill="url(#vbA-flash)" opacity={0.35 * Math.max(0, 1 - Math.abs(t - 4.0) / 1.2) * bg} />
        {FLOATS.map((f, i) => {
          const x = 140 + ((rand(i * 3.3) * 1640 + t * (14 + rand(i) * 18)) % 1640);
          const y = 150 + rand(i * 5.1 + 2) * 680;
          const edge = Math.min(1, (x - 140) / 120, (1780 - x) / 120);
          const s = 40 + rand(i * 7.7) * 26;
          return (
            <text key={i} x={x} y={y} fontFamily={FONT.serif} fontStyle="italic" fontSize={s} fill={C.ink} opacity={0.2 * bg * Math.max(0, edge)} textAnchor="middle">
              {f(s)}
            </text>
          );
        })}
      </Stage>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column', paddingBottom: 120}}>
        <Letters
          text="BAHASA SIMETRI"
          t={t}
          start={0.6}
          step={0.05}
          style={{fontFamily: FONT.sans, fontWeight: 800, fontSize: 120, letterSpacing: 4, lineHeight: 1.08, color: C.gold, textShadow: '0 0 60px rgba(255,194,74,0.45)'}}
        />
        <div style={{width: 700 * line, height: 2, margin: '30px 0 24px', background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`}} />
        <div style={{fontFamily: FONT.sans, fontSize: 36, color: C.muted, letterSpacing: 1, opacity: sub, translate: `0px ${(1 - sub) * 16}px`}}>
          Kimia Kuantum · Simetri Molekul &amp; Grup Titik
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
