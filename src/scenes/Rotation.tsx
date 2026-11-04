import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, ramp, slot} from '../anim';
import {Formula, Frac, Glow, Label, Stage, Sub} from '../components/primitives';
import {Render3D, SvgChem, VbDefs, type Cam, type V3} from '../components/vbC';
import {BENZENE, H2O, NH3, at2D, axis3D, rotArrow3D, symMol} from '../components/syA';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Bab 02: sumbu putar Cₙ (360°/n) — H₂O C₂, NH₃ C₃ (tiga langkah 120°), benzena C₆ + enam C₂ di bidang cincin,
// sumbu utama → z.
const W2 = H2O();
const AM = NH3();
const BZ = BENZENE();
const PY = 560;
const PX = [380, 960, 1500];
const DIAL_N = [2, 3, 4, 6];

/** Piringan 360°/n: n jari-jari, satu sektor emas, penunjuk yang menyapu sektor itu berulang. */
const Dial: React.FC<{x: number; y: number; r: number; t: number; p: number}> = ({x, y, r, t, p}) => {
  const per = 2.0;
  const u = Math.max(0, t) / per;
  return (
    <g opacity={p}>
      <circle cx={x} cy={y} r={r} fill="rgba(12,18,40,0.6)" stroke={C.faint} strokeWidth={3} />
      <circle cx={x} cy={y} r={r + 14} fill="none" stroke={C.gold} strokeOpacity={0.25} strokeWidth={2} strokeDasharray="4 10" strokeDashoffset={-t * 12} />
      {DIAL_N.map((n, k) => {
        const d = Math.abs(((((u - k) % 4) + 4 + 2) % 4) - 2);
        const w = Math.max(0, Math.min(1, 1.6 - 1.6 * d));
        if (w <= 0.005) return null;
        const ang = (2 * Math.PI) / n;
        const loc = (((u - k) % 4) + 4) % 4;
        const sweep = ang * EASE_IN_OUT(Math.max(0, Math.min(1, (loc + 0.45) / 0.9)));
        const a0 = -Math.PI / 2;
        const pt = (a: number, rr: number) => `${(x + rr * Math.cos(a)).toFixed(1)},${(y + rr * Math.sin(a)).toFixed(1)}`;
        return (
          <g key={n} opacity={w}>
            <path d={`M${x},${y} L${pt(a0, r)} A${r},${r} 0 ${ang > Math.PI ? 1 : 0} 1 ${pt(a0 + ang, r)} Z`} fill={C.gold} fillOpacity={0.16} />
            {Array.from({length: n}, (_, j) => (
              <line key={j} x1={x} y1={y} x2={x + r * Math.cos(a0 + j * ang)} y2={y + r * Math.sin(a0 + j * ang)} stroke={C.muted} strokeWidth={2.5} />
            ))}
            {Array.from({length: n}, (_, j) => (
              <circle key={j} cx={x + r * Math.cos(a0 + j * ang)} cy={y + r * Math.sin(a0 + j * ang)} r={11} fill="#f2f5ff" stroke="#0b1022" strokeWidth={2} />
            ))}
            <line x1={x} y1={y} x2={x + r * 0.86 * Math.cos(a0 + sweep)} y2={y + r * 0.86 * Math.sin(a0 + sweep)} stroke={C.gold} strokeWidth={5} strokeLinecap="round" />
            <text x={x} y={y + r + 62} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.sans} fontSize={40} fontWeight={600} fill={C.ink}>
              <tspan fontFamily={FONT.serif} fontStyle="italic">n</tspan> = {n}
              <tspan fill={C.gold}> → {360 / n}°</tspan>
            </text>
          </g>
        );
      })}
      <circle cx={x} cy={y} r={9} fill={C.gold} />
    </g>
  );
};

export const Rotation: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();
  const out = 1 - ramp(t, dur - 0.9, dur - 0.1, EASE_IN_OUT);

  // ---------- kartu rumus (satu slot) ----------
  const f0 = slot(t, 0.2, cue(1));
  const f1 = slot(t, cue(1), cue(2));
  const f2 = slot(t, cue(2), cue(3));
  const f3 = slot(t, cue(3), cue(4));
  const f4 = slot(t, cue(4), dur + 1);

  // ---------- piringan ----------
  const dial = ramp(t, 0.4, 1.4) * (1 - ramp(t, cue(1) - 0.5, cue(1) + 0.2, EASE_IN_OUT));

  // ---------- H₂O C₂ ----------
  const wIn = ramp(t, cue(1) - 0.2, cue(1) + 0.8, BACK);
  const tW = wordOf(1, 'seratus');
  const wRot = ramp(t, tW - 0.1, tW + 2.0, EASE_IN_OUT);
  // ---------- NH₃ C₃: tiga langkah 120° ----------
  const aIn = ramp(t, cue(2) - 0.2, cue(2) + 0.8, BACK);
  const tA = wordOf(2, 'seratus') - 0.1;
  const stepP = (k: number) => ramp(t, tA + k * 1.75, tA + k * 1.75 + 1.15, EASE_IN_OUT);
  const aRot = stepP(0) + stepP(1) + stepP(2);
  const cnt = [0, 1, 2].map((k) => ramp(t, tA + k * 1.75 + 0.9, tA + k * 1.75 + 1.3) * (k < 2 ? 1 - ramp(t, tA + (k + 1) * 1.75 + 0.9, tA + (k + 1) * 1.75 + 1.3) : 1));
  const back = ramp(t, tA + 2 * 1.75 + 1.2, tA + 2 * 1.75 + 1.8);
  // ---------- benzena C₆ + 6 C₂ ----------
  const bIn = ramp(t, cue(3) - 0.2, cue(3) + 0.8, BACK);
  const tB = wordOf(3, 'enam', 0);
  const bRot = ramp(t, tB - 0.1, tB + 1.4, EASE_IN_OUT);
  const tB2 = wordOf(3, 'enam', 1);
  const c2s = [0, 1, 2, 3, 4, 5].map((k) => ramp(t, tB2 - 0.3 + k * 0.15, tB2 + 0.4 + k * 0.15, EASE_IN_OUT));
  // ---------- sumbu utama ----------
  const main = ramp(t, wordOf(4, 'utama') - 0.4, wordOf(4, 'utama') + 0.5);
  const zLab = ramp(t, wordOf(4, 'z') - 0.4, wordOf(4, 'z') + 0.4, BACK);

  // panel aktif lebih terang
  const act = (i: number) => {
    const on = [wIn, aIn, bIn][i];
    const off = i < 2 ? ramp(t, cue(i + 2) - 0.2, cue(i + 2) + 0.6, EASE_IN_OUT) : 0;
    return on * (1 - 0.45 * off) * (i < 2 ? 1 - 0.25 * main : 1);
  };

  const camW: Cam = {cx: PX[0], cy: PY + 4 * Math.sin(t * 0.8), s: 150, yaw: 0.4 + 0.2 * Math.sin(t * 0.3), pitch: -0.3};
  const camA: Cam = {cx: PX[1], cy: PY + 30 + 4 * Math.sin(t * 0.8 + 1), s: 150, yaw: 0.3 + 0.2 * Math.sin(t * 0.3 + 1), pitch: -0.38};
  const camB: Cam = {cx: PX[2], cy: PY + 40 + 4 * Math.sin(t * 0.8 + 2), s: 80, yaw: 0.25 + t * 0.05, pitch: -0.72};

  const glowAx = (p: number) => 0.4 + 2.4 * p * (1 - p);
  const wItems = [
    ...axis3D(camW, {dir: [0, 0, 1], len: 1.55, p: wIn, glow: glowAx(wRot) + main}),
    ...rotArrow3D(camW, {at: [0, 0, 1.12], dir: [0, 0, 1], r: 0.48, from: -0.4 + wRot * Math.PI, sweep: Math.PI, p: wIn}),
    ...symMol(camW, W2, {op: {kind: 'C', axis: [0, 0, 1], deg: 180}, p: wRot, numbers: wIn}),
  ];
  const aItems = [
    ...axis3D(camA, {dir: [0, 0, 1], len: 1.55, p: aIn, glow: glowAx(aRot % 1) + main}),
    ...rotArrow3D(camA, {at: [0, 0, 1.12], dir: [0, 0, 1], r: 0.48, from: -0.4 + aRot * 2.094, sweep: 2.094, p: aIn}),
    ...symMol(camA, AM, {op: {kind: 'C', axis: [0, 0, 1], deg: 120}, p: aRot, numbers: aIn}),
  ];
  const bItems = [
    ...axis3D(camB, {dir: [0, 0, 1], len: 2.7, p: bIn, width: 5 + 2 * main, glow: glowAx(bRot) + 0.5 * main}),
    ...rotArrow3D(camB, {at: [0, 0, 1.9], dir: [0, 0, 1], r: 0.8, from: -0.4 + bRot * 1.047, sweep: 1.047 * 1.6, p: bIn}),
    ...c2s.flatMap((p, k) => {
      const a = (k * Math.PI) / 6;
      return axis3D(camB, {dir: [Math.cos(a), Math.sin(a), 0], len: 3.05, p, width: 2.5, opacity: 0.75 * (1 - 0.5 * main)});
    }),
    ...symMol(camB, BZ, {op: {kind: 'C', axis: [0, 0, 1], deg: 60}, p: bRot, numbers: bIn, hR: 0.25}),
  ];

  const topOf = (cam: Cam, len: number) => at2D(cam, [0, 0, len] as V3);
  const tW2 = topOf(camW, 1.55);
  const tA2 = topOf(camA, 1.55);
  const tB2p = topOf(camB, 2.7);

  return (
    <AbsoluteFill style={{opacity: out}}>
      <Stage>
        <VbDefs />
        <Dial x={960} y={545} r={175} t={t} p={dial} />
        {[0, 1, 2].map((i) => (
          <Glow key={i} x={PX[i]} y={PY} r={300} color="gold" opacity={0.1 * act(i) + (i === 2 ? 0.12 * main : 0)} />
        ))}
        <Render3D items={wItems} opacity={act(0)} />
        <Render3D items={aItems} opacity={act(1)} />
        <Render3D items={bItems} opacity={act(2)} />

        {/* keterangan panel */}
        <g opacity={act(0)}>
          <SvgChem x={PX[0]} y={845} size={36} parts={[['H'], ['2', 'sub'], ['O  ·  '], ['C'], ['2', 'sub'], ['  180°']]} color={C.ink} />
        </g>
        <g opacity={act(1)}>
          <SvgChem x={PX[1]} y={845} size={36} parts={[['NH'], ['3', 'sub'], ['  ·  C'], ['3', 'sub'], ['  120°']]} color={C.ink} />
          {['1/3', '2/3', '3/3'].map((s, k) => (
            <Label key={k} x={PX[1] + 170} y={420} size={44} color={C.gold} weight={700} font="mono" opacity={cnt[k]}>
              {s}
            </Label>
          ))}
          <Label x={PX[1] + 170} y={470} size={26} color={C.mint} weight={600} opacity={back * (1 - 0.6 * main)}>
            kembali ke awal
          </Label>
        </g>
        <g opacity={act(2)}>
          <SvgChem x={PX[2]} y={845} size={36} parts={[['C'], ['6', 'sub'], ['H'], ['6', 'sub'], ['  ·  C'], ['6', 'sub'], ['  +  6 C'], ['2', 'sub']]} color={C.ink} />
        </g>
        {/* z di ujung sumbu utama */}
        {[tW2, tA2, tB2p].map((p, i) => (
          <text key={i} x={p.x + 22} y={p.y - 14} fontFamily={FONT.serif} fontStyle="italic" fontWeight={600} fontSize={i === 2 ? 52 : 40} fill={C.gold} opacity={zLab * act(i)} dominantBaseline="central">
            z
          </text>
        ))}
        <Label x={tB2p.x - 30} y={tB2p.y - 4} size={30} color={C.gold} weight={700} anchor="end" opacity={main}>
          sumbu utama
        </Label>
      </Stage>

      <Formula x={960} y={190} p={f0} caption="putaran yang mengembalikan bentuk molekul">
        C<Sub>n</Sub> : putar{' '}
        <Frac n="360°" d={<i>n</i>} />
      </Formula>
      <Formula x={960} y={190} p={f1}>
        C<Sub>2</Sub> : <Frac n="360°" d="2" /> = 180°
      </Formula>
      <Formula x={960} y={190} p={f2}>
        C<Sub>3</Sub> : <Frac n="360°" d="3" /> = 120°
      </Formula>
      <Formula x={960} y={190} p={f3}>
        C<Sub>6</Sub> : 60° <span style={{color: C.muted}}>+</span> 6 C<Sub>2</Sub> <span style={{fontSize: '0.62em', color: C.muted, fontFamily: FONT.sans}}>⊥ C<Sub>6</Sub></span>
      </Formula>
      <Formula x={960} y={190} p={f4} caption={<>sumbu dengan <i>n</i> terbesar</>}>
        sumbu utama <span style={{color: C.gold}}>→</span> <i>z</i>
      </Formula>
    </AbsoluteFill>
  );
};
