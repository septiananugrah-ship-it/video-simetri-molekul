import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, mix, ramp, slot} from '../anim';
import {Formula, Glow, Label, Stage, Sub} from '../components/primitives';
import {lobeD, PhaseP, PhaseS, PoADefs} from '../components/poA';
import {Check} from '../components/moB';
import {SyText} from '../components/syC';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Bab 10: simetri & tumpang tindih. s + p_z (sama-sama a₁) → S ≠ 0; s + p_x (a₁ vs b₁) → bagian + dan − sama luas → S = 0.
// Paritas = simetri inversi: s genap (g), p ganjil (u); transisi diizinkan g ↔ u.

type P = [string, ('sub' | 'sup')?][];
const OY = 460;
const SR = 95;
const PL = 150;

const Pill: React.FC<{x: number; y: number; parts: P; color: string; p: number}> = ({x, y, parts, color, p}) =>
  p <= 0.001 ? null : (
    <g opacity={Math.min(1, p * 1.4)} transform={`translate(${x} ${y}) scale(${0.85 + 0.15 * p})`}>
      <rect x={-46} y={-26} width={92} height={52} rx={26} fill="rgba(10,14,30,0.9)" stroke={color} strokeWidth={2.5} />
      <SyText x={0} y={-2} parts={parts} size={34} color={color} font="serif" italic />
    </g>
  );

export const Overlap: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();
  const out = 1 - ramp(t, dur - 0.9, dur - 0.1, EASE_IN_OUT);

  // ---------- baris 0: dua orbital mendekat ----------
  const inA = ramp(t, -0.4, 1.0);
  const near = ramp(t, wordOf(0, 'kapan') - 0.4, wordOf(0, 'bergabung') + 0.4, EASE_IN_OUT);
  const ask = Math.min(ramp(t, wordOf(0, 'kapan') - 0.3, wordOf(0, 'kapan') + 0.5), 1 - ramp(t, cue(1) - 0.2, cue(1) + 0.4, EASE_IN_OUT));
  const panels = 1 - ramp(t, cue(3) - 0.5, cue(3) + 0.3, EASE_IN_OUT);

  // ---------- baris 1: simetri sama ----------
  const tSame = wordOf(1, 'tumpang');
  const ovA = ramp(t, tSame - 0.3, tSame + 0.6);
  const rowA = ramp(t, wordOf(1, 'baris') - 0.3, wordOf(1, 'baris') + 0.5, BACK);
  const titleA = ramp(t, cue(1) - 0.3, cue(1) + 0.4);
  // ---------- baris 2: simetri beda ----------
  const titleB = ramp(t, cue(2) - 0.3, cue(2) + 0.4);
  const rowB = ramp(t, wordOf(2, 'berbeda') - 0.3, wordOf(2, 'berbeda') + 0.5, BACK);
  const posP = ramp(t, wordOf(2, 'positif') - 0.3, wordOf(2, 'positif') + 0.5);
  const negP = ramp(t, wordOf(2, 'negatif') - 0.3, wordOf(2, 'negatif') + 0.5);
  const merge = ramp(t, wordOf(2, 'menghapus') - 0.2, wordOf(2, 'menghapus') + 0.9, EASE_IN_OUT);
  const zero = ramp(t, wordOf(2, 'nol') - 0.3, wordOf(2, 'nol') + 0.4, BACK);
  const dimA = 1 - 0.35 * ramp(t, cue(2) - 0.3, cue(2) + 0.5);

  // posisi panel
  const sAx = mix(330, 430, near);
  const pAx = mix(710, 610, near);
  const sBx = mix(1230, 1330, near);
  const pBx = mix(1520, 1420, near);
  const pulse = 0.75 + 0.25 * Math.sin(t * 2.6);

  // ---------- baris 3: paritas ----------
  const par = ramp(t, cue(3) - 0.2, cue(3) + 0.7);
  const tTr = wordOf(3, 'transisi');
  const trans = ramp(t, tTr - 0.3, tTr + 0.8);
  const tPar = wordOf(3, 'paritas', 0);
  const inv1 = ramp(t, tPar - 0.1, tPar + 1.5, EASE_IN_OUT);
  const tInv = wordOf(3, 'inversi');
  const inv2 = ramp(t, tInv - 0.3, tInv + 1.3, EASE_IN_OUT);
  const v = inv1 - inv2;
  const sq = 1 - 2 * v;
  const invShow = Math.max(Math.sin(Math.PI * inv1), Math.sin(Math.PI * inv2));
  const gu = ramp(t, tPar + 0.9, tPar + 1.6);
  const S3 = {x: 620, y: 450};
  const P3 = {x: 1300, y: 450};

  return (
    <AbsoluteFill style={{opacity: out}}>
      <Stage>
        <PoADefs />
        <defs>
          <clipPath id="ov-sa">
            <circle cx={sAx} cy={OY} r={SR} />
          </clipPath>
          <clipPath id="ov-sb">
            <circle cx={sBx} cy={OY} r={SR} />
          </clipPath>
        </defs>
        <Glow x={520} y={OY} r={380} color="mint" opacity={(0.04 + 0.05 * ovA) * panels} />
        <Glow x={1400} y={OY} r={380} color="red" opacity={(0.03 + 0.03 * Math.sin(t * 0.9)) * panels} />

        {/* ===== panel A: s + p_z (sama) ===== */}
        <g opacity={panels * inA * dimA}>
          <line x1={250} y1={OY} x2={800} y2={OY} stroke={C.faint} strokeWidth={2} strokeDasharray="6 10" />
          <PhaseS x={sAx} y={OY} r={SR} sign={1} t={t} />
          <PhaseP x={pAx} y={OY} L={PL} ang={Math.PI} t={t} />
          {ovA > 0.01 ? <path d={lobeD(pAx, OY, Math.PI, PL)} clipPath="url(#ov-sa)" fill={C.cyan} opacity={0.6 * ovA * pulse} stroke={C.cyan} strokeWidth={3} /> : null}
          <SyText x={sAx} y={OY + 135} parts={[['s']]} size={34} color={C.ink} font="serif" italic />
          <SyText x={pAx} y={OY + 135} parts={[['p'], ['z', 'sub']]} size={34} color={C.ink} font="serif" italic />
          <Label x={525} y={215} size={34} color={C.mint} weight={600} opacity={titleA}>
            simetri sama
          </Label>
          <Pill x={sAx} y={OY + 200} parts={[['a'], ['1', 'sub']]} color={C.mint} p={rowA} />
          <Pill x={pAx} y={OY + 200} parts={[['a'], ['1', 'sub']]} color={C.mint} p={rowA} />
          <SyText x={(sAx + pAx) / 2} y={OY + 200} parts={[['=']]} size={40} color={C.mint} opacity={rowA} />
          <SyText x={520} y={OY - 150} parts={[['S ≠ 0']]} size={46} color={C.cyan} font="serif" italic opacity={ovA} />
          <Check x={640} y={OY - 152} p={ramp(t, tSame + 0.2, tSame + 0.9)} r={18} />
        </g>

        {/* ===== panel B: s + p_x (beda) ===== */}
        <g opacity={panels * inA}>
          <line x1={1130} y1={OY} x2={1700} y2={OY} stroke={C.faint} strokeWidth={2} strokeDasharray="6 10" />
          <PhaseS x={sBx} y={OY} r={SR} sign={1} t={t} />
          <PhaseP x={pBx} y={OY} L={PL} ang={-Math.PI / 2} t={t} />
          {posP > 0.01 ? (
            <path d={lobeD(pBx, OY, -Math.PI / 2, PL)} clipPath="url(#ov-sb)" fill={C.gold} opacity={0.75 * posP * (1 - 0.5 * zero)} stroke="#fff3c4" strokeWidth={3} />
          ) : null}
          {negP > 0.01 ? (
            <path d={lobeD(pBx, OY, Math.PI / 2, PL)} clipPath="url(#ov-sb)" fill={C.violet} opacity={0.8 * negP * (1 - 0.5 * zero)} stroke="#e2d8ff" strokeWidth={3} />
          ) : null}
          <SyText x={sBx - 30} y={OY + 135} parts={[['s']]} size={34} color={C.ink} font="serif" italic />
          <SyText x={pBx + 60} y={OY + 135} parts={[['p'], ['x', 'sub']]} size={34} color={C.ink} font="serif" italic />
          <Label x={1400} y={215} size={34} color={C.red} weight={600} opacity={titleB}>
            simetri beda
          </Label>
          <Pill x={sBx - 30} y={OY + 200} parts={[['a'], ['1', 'sub']]} color={C.mint} p={rowB} />
          <Pill x={pBx + 60} y={OY + 200} parts={[['b'], ['1', 'sub']]} color={C.red} p={rowB} />
          <SyText x={(sBx + pBx) / 2 + 15} y={OY + 200} parts={[['≠']]} size={40} color={C.red} opacity={rowB} />
          {/* +0,5 dan −0,5 menyatu menjadi 0 */}
          <SyText x={mix(1600, 1620, merge)} y={mix(OY - 70, OY - 150, merge)} parts={[['+0,5']]} size={44} color={C.gold} font="serif" opacity={posP * (1 - merge)} weight={700} anchor="start" />
          <SyText x={mix(1600, 1620, merge)} y={mix(OY + 70, OY - 150, merge)} parts={[['−0,5']]} size={44} color={C.violet} font="serif" opacity={negP * (1 - merge)} weight={700} anchor="start" />
          {zero > 0.01 ? <circle cx={1460} cy={OY - 152} r={40 + 14 * (1 - zero)} fill="none" stroke={C.red} strokeWidth={3} opacity={zero * 0.7} /> : null}
          <SyText x={1400} y={OY - 150} parts={[['S = 0']]} size={46} color={C.red} font="serif" italic opacity={zero} />
        </g>

        {/* tanda tanya di baris pertama */}
        <SyText x={960} y={OY} parts={[['?']]} size={110} color={C.gold} font="serif" opacity={ask * (0.8 + 0.2 * Math.sin(t * 3))} weight={600} />

        {/* ===== paritas = simetri inversi ===== */}
        <g opacity={par}>
          {[S3, P3].map((c, j) => (
            <g key={j}>
              <line x1={c.x - 210} y1={c.y + 0} x2={c.x + 210} y2={c.y} stroke={C.faint} strokeWidth={2} strokeDasharray="6 10" />
              {/* titik r → −r melalui pusat */}
              <line x1={c.x + 150} y1={c.y - 95} x2={c.x - 150} y2={c.y + 95} stroke={C.pink} strokeWidth={3} strokeDasharray="10 10" opacity={0.25 + 0.7 * invShow} />
              <circle cx={c.x + 150} cy={c.y - 95} r={9} fill={C.pink} opacity={0.3 + 0.7 * invShow} />
              <circle cx={c.x - 150} cy={c.y + 95} r={9} fill="none" stroke={C.pink} strokeWidth={3} opacity={0.3 + 0.7 * invShow} />
            </g>
          ))}
          <g transform={`translate(${S3.x} ${S3.y}) scale(${sq} 1) translate(${-S3.x} ${-S3.y})`}>
            <PhaseS x={S3.x} y={S3.y} r={110} sign={1} t={t} />
          </g>
          <g transform={`translate(${P3.x} ${P3.y}) scale(${sq} 1) translate(${-P3.x} ${-P3.y})`}>
            <PhaseP x={P3.x} y={P3.y} L={170} ang={0} t={t} />
          </g>
          {[S3, P3].map((c, j) => (
            <g key={j}>
              <circle cx={c.x} cy={c.y} r={22 + 8 * invShow} fill={C.pink} opacity={0.18 + 0.2 * invShow} />
              <circle cx={c.x} cy={c.y} r={9} fill={C.pink} />
            </g>
          ))}
          <SyText x={S3.x - 150} y={S3.y - 150} parts={[['i']]} size={40} color={C.pink} font="serif" italic opacity={0.6 + 0.4 * invShow} />
          <SyText x={S3.x} y={S3.y + 175} parts={[['s → s']]} size={34} color={C.ink} font="serif" italic />
          <SyText x={P3.x} y={P3.y + 175} parts={[['p → −p']]} size={34} color={C.ink} font="serif" italic />
          <SyText x={S3.x} y={S3.y + 225} parts={[['genap · g']]} size={32} color={C.mint} opacity={gu} />
          <SyText x={P3.x} y={P3.y + 225} parts={[['ganjil · u']]} size={32} color={C.red} opacity={gu} />
          {/* transisi s → p diizinkan */}
          <g opacity={trans}>
            <path
              d={`M${S3.x + 150},${S3.y - 160} Q${(S3.x + P3.x) / 2},${S3.y - 290} ${P3.x - 230},${P3.y - 160}`}
              fill="none"
              stroke={C.gold}
              strokeWidth={4}
              strokeDasharray="900 900"
              strokeDashoffset={900 * (1 - trans)}
              strokeLinecap="round"
            />
            <path d={`M${P3.x - 230},${P3.y - 160} l-22,-4 l12,-18 Z`} fill={C.gold} opacity={ramp(trans, 0.8, 1, (x) => x)} />
            <SyText x={(S3.x + P3.x) / 2} y={S3.y - 262} parts={[['transisi g ↔ u diizinkan']]} size={30} color={C.gold} />
          </g>
        </g>
      </Stage>

      <Formula x={960} y={790} p={slot(t, wordOf(1, 'sama') - 0.3, cue(2) + 0.1)} accent={C.mint} size={58} caption="hanya bila baris simetri sama">
        <i>S</i> = ∫ ψ<Sub>A</Sub> ψ<Sub>B</Sub> d<i>τ</i> ≠ 0
      </Formula>
      <Formula x={960} y={790} p={slot(t, wordOf(2, 'menghapus') - 0.2, cue(3) - 0.1)} accent={C.red} size={58} caption="simetri beda → saling menghapus">
        <span style={{color: C.gold}}>+0,5</span> + <span style={{color: C.violet}}>(−0,5)</span> = <span style={{color: C.red}}>0</span>
      </Formula>
      <Formula x={960} y={790} p={slot(t, wordOf(3, 'paritas', 1) - 0.3, dur + 5)} accent={C.pink} size={58}>
        paritas = simetri inversi <span style={{color: C.pink, fontStyle: 'italic'}}>i</span>
      </Formula>
    </AbsoluteFill>
  );
};


