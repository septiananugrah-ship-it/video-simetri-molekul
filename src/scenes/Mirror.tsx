import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, ramp, slot, win} from '../anim';
import {Formula, Glow, Stage, Sub} from '../components/primitives';
import {BF3, H2O, PTCL4, SyDefs, axisB, molB, planeB, ringB, scr, type SymOp} from '../components/syB';
import {Render3D, VbDefs, angleArc, type Cam, type Item} from '../components/vbC';
import {RichLabel} from '../components/vbD';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Bab 03: bidang cermin σ — definisi (H₂O, H₁↔H₂), σv (dua bidang air), σh (BF₃: atom tetap di tempat),
// σd ([PtCl₄]²⁻: bidang vertikal diagonal yang membelah sudut 90° antara dua C₂ → 45° / 45°).
const S_YZ: SymOp = {k: 's', normal: [1, 0, 0]}; // bidang ⊥ bidang molekul air (menukar H₁↔H₂)
const S_XZ: SymOp = {k: 's', normal: [0, 1, 0]}; // bidang molekul air
const S_H: SymOp = {k: 's', normal: [0, 0, 1]};
const S_D: SymOp = {k: 's', normal: [Math.SQRT1_2, -Math.SQRT1_2, 0]};
const MX = 760;

export const Mirror: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();
  const out = 1 - ramp(t, dur - 0.9, dur - 0.1, EASE_IN_OUT);
  const bump = (p: number) => Math.sin(Math.PI * Math.max(0, Math.min(1, p)));

  // ---------- fase air ----------
  const phW = ramp(t, -0.4, 0.8) * (1 - ramp(t, cue(2) - 0.7, cue(2) + 0.1, EASE_IN_OUT));
  const camW: Cam = {cx: MX, cy: 520, s: 230, yaw: 0.62 + 0.16 * Math.sin(0.3 * t), pitch: -0.26};
  const pYZ = ramp(t, wordOf(0, 'Bidang') - 0.3, wordOf(0, 'Bidang') + 0.9);
  const r1 = ramp(t, wordOf(0, 'pantulkan') + 0.1, wordOf(0, 'pantulkan') + 2.0, EASE_IN_OUT);
  const ax = ramp(t, wordOf(1, 'sumbu') - 0.3, wordOf(1, 'sumbu') + 0.7);
  const pXZ = ramp(t, wordOf(1, 'molekul') - 0.3, wordOf(1, 'molekul') + 0.7);
  const r2 = ramp(t, wordOf(1, 'molekul') + 0.5, wordOf(1, 'molekul') + 2.1, EASE_IN_OUT);
  const r3 = ramp(t, wordOf(1, 'tegak') + 0.1, wordOf(1, 'tegak') + 2.0, EASE_IN_OUT);
  const vLab = ramp(t, wordOf(1, 'vertikal') - 0.3, wordOf(1, 'vertikal') + 0.5);
  const flYZ = Math.max(bump(r1), bump(r3));
  const water: Item[] = [
    ...planeB(camW, {u: [0, 1, 0], v: [0, 0, 1], a: 1.25, b: 1.2, p: pYZ, flash: flYZ, opacity: 1 - 0.45 * pXZ * (1 - ramp(t, wordOf(1, 'tegak') - 0.4, wordOf(1, 'tegak') + 0.2))}),
    ...planeB(camW, {u: [1, 0, 0], v: [0, 0, 1], a: 1.45, b: 1.2, p: pXZ, flash: bump(r2), opacity: 1 - 0.5 * ramp(t, wordOf(1, 'tegak') - 0.4, wordOf(1, 'tegak') + 0.2)}),
    ...axisB(camW, {dir: [0, 0, 1], len: 1.38, p: ax, spin: 1.3 * t, arrow: ax, ringR: 0.28}),
    ...molB(camW, H2O, {
      ops: [
        [S_YZ, r1],
        [S_XZ, r2],
        [S_YZ, r3],
      ],
      tint: () => [C.cyan, bump(r2)],
    }),
    ringB(camW, {u: [1, 0, 0], v: [0, 0, 1], r: 0.2 + 1.3 * r2, opacity: 0.8 * bump(r2)}),
  ].filter((x): x is Item => !!x);
  const yzTop = scr(camW, [0, 1.25, 1.2]);
  const xzTop = scr(camW, [1.45, 0, 1.2]);
  const c2Top = scr(camW, [0, 0, 1.38]);

  // ---------- fase BF₃ ----------
  const phB = ramp(t, cue(2) - 0.2, cue(2) + 0.8) * (1 - ramp(t, cue(3) - 0.7, cue(3) + 0.1, EASE_IN_OUT));
  const camB: Cam = {cx: MX, cy: 520, s: 205, yaw: 0.3 + 0.16 * t, pitch: -0.5};
  const bAx = ramp(t, cue(2) + 0.1, cue(2) + 1.0);
  const pH = ramp(t, wordOf(2, 'tegak') - 0.3, wordOf(2, 'tegak') + 0.8);
  const rB = ramp(t, wordOf(2, 'molekulnya') - 0.4, wordOf(2, 'molekulnya') + 1.6, EASE_IN_OUT);
  const bf3: Item[] = [
    ...planeB(camB, {u: [1, 0, 0], v: [0, 1, 0], a: 1.95, b: 1.95, p: pH, flash: bump(rB)}),
    ...axisB(camB, {dir: [0, 0, 1], len: 1.45, p: bAx, spin: 1.3 * t, arrow: bAx, ringR: 0.3}),
    ...molB(camB, BF3, {ops: [[S_H, rB]], tint: (i) => (i > 0 ? [C.cyan, bump(rB)] : null)}),
    ringB(camB, {u: [1, 0, 0], v: [0, 1, 0], r: 0.2 + 1.8 * rB, opacity: 0.85 * bump(rB)}),
  ].filter((x): x is Item => !!x);
  const c3Top = scr(camB, [0, 0, 1.45]);
  const hCorner = scr(camB, [1.95, -1.95, 0]);

  // ---------- fase [PtCl₄]²⁻ ----------
  const phP = ramp(t, cue(3) - 0.2, cue(3) + 0.8);
  const camP: Cam = {cx: MX, cy: 530, s: 168, yaw: -0.5 + 0.1 * Math.sin(0.35 * t), pitch: -0.55};
  const c2s = ramp(t, cue(3) + 0.2, cue(3) + 1.2);
  const pD = ramp(t, wordOf(3, 'diagonal') - 0.3, wordOf(3, 'diagonal') + 0.8);
  const rD = ramp(t, wordOf(3, 'membelah') + 0.1, wordOf(3, 'membelah') + 1.9, EASE_IN_OUT);
  const arcs = ramp(t, wordOf(3, 'sudut') - 0.2, wordOf(3, 'sudut') + 0.9);
  const D: [number, number, number] = [Math.SQRT1_2, Math.SQRT1_2, 0];
  const ptcl: Item[] = [
    ...axisB(camP, {dir: [0, 0, 1], len: 1.3, p: c2s, spin: 1.3 * t, arrow: c2s * 0.9, ringR: 0.28}),
    ...axisB(camP, {dir: [1, 0, 0], len: 2.25, p: c2s, width: 3, dash: true, opacity: 0.85}),
    ...axisB(camP, {dir: [0, 1, 0], len: 2.25, p: c2s, width: 3, dash: true, opacity: 0.85}),
    ...planeB(camP, {u: D, v: [0, 0, 1], a: 2.2, b: 1.15, p: pD, flash: bump(rD)}),
    ...molB(camP, PTCL4, {ops: [[S_D, rD]]}),
    angleArc(camP, {center: [0, 0, 0], u: [1, 0, 0], v: D, r: 0.95, labelR: 1.32, label: '45°', size: 30, p: arcs, opacity: arcs, color: C.cyan}),
    angleArc(camP, {center: [0, 0, 0], u: D, v: [0, 1, 0], r: 0.95, labelR: 1.32, label: '45°', size: 30, p: arcs, opacity: arcs, color: C.cyan}),
  ].filter((x): x is Item => !!x);
  const c2x = scr(camP, [2.45, 0, 0]);
  const c2y = scr(camP, [0, -2.45, 0]);
  const dTop = scr(camP, [D[0] * 2.2, D[1] * 2.2, 1.15]);
  const c4Top = scr(camP, [0, 0, 1.3]);

  // ---------- kartu & catatan ----------
  const f0 = slot(t, cue(0) - 0.3, cue(1));
  const f1 = slot(t, cue(1), cue(2));
  const f2 = slot(t, cue(2), cue(3));
  const f3 = slot(t, cue(3), dur + 2);
  const n0 = win(t, wordOf(0, 'tetap') - 0.2, cue(1) - 0.4);
  const n1a = win(t, wordOf(1, 'molekul') + 1.0, wordOf(1, 'tegak') - 0.1);
  const n1b = win(t, wordOf(1, 'tegak') + 1.2, cue(2) - 0.6);
  const n2 = win(t, wordOf(2, 'molekulnya') + 0.6, cue(3) - 0.6);
  const n3 = win(t, wordOf(3, 'membelah') + 1.4, dur);
  const NX = 1480;
  const NY = 560;

  return (
    <AbsoluteFill style={{opacity: out}}>
      <Stage>
        <VbDefs />
        <SyDefs />
        <Glow x={MX} y={520} r={430} color="cyan" opacity={0.07 + 0.025 * Math.sin(t * 0.9)} />

        <g opacity={phW}>
          <Render3D items={water} />
          <RichLabel x={yzTop[0] + 10} y={yzTop[1] - 30} parts={[['σ']]} size={40} color={C.cyan} opacity={pYZ * (1 - vLab)} />
          <RichLabel x={yzTop[0] + 10} y={yzTop[1] - 30} parts={[['σ'], ['v', 'sub'], ['′']]} size={40} color={C.cyan} opacity={pYZ * vLab} />
          <RichLabel x={xzTop[0] + 34} y={xzTop[1] - 22} parts={[['σ'], ['v', 'sub']]} size={40} color={C.cyan} opacity={pXZ} />
          <RichLabel x={c2Top[0] + 48} y={c2Top[1] - 6} parts={[['C'], ['2', 'sub']]} size={36} color={C.gold} opacity={ax} />
          <RichLabel x={MX} y={850} parts={[['H'], ['2', 'sub'], ['O']]} size={34} color={C.muted} opacity={ramp(t, 0.2, 1.2)} />
        </g>

        <g opacity={phB}>
          <Render3D items={bf3} />
          <RichLabel x={c3Top[0] - 46} y={c3Top[1] - 6} parts={[['C'], ['3', 'sub']]} size={36} color={C.gold} opacity={bAx} />
          <RichLabel x={hCorner[0] + 20} y={hCorner[1] + 26} parts={[['σ'], ['h', 'sub']]} size={40} color={C.cyan} opacity={pH} />
          <RichLabel x={MX} y={860} parts={[['BF'], ['3', 'sub'], [' · datar']]} size={34} color={C.muted} />
        </g>

        <g opacity={phP}>
          <Render3D items={ptcl} />
          <RichLabel x={c2x[0] + 28} y={c2x[1]} parts={[['C'], ['2', 'sub']]} size={32} color={C.gold} opacity={c2s} anchor="start" />
          <RichLabel x={c2y[0] - 24} y={c2y[1] + 10} parts={[['C'], ['2', 'sub']]} size={32} color={C.gold} opacity={c2s} anchor="end" />
          <RichLabel x={c4Top[0] - 46} y={c4Top[1] - 6} parts={[['C'], ['4', 'sub']]} size={34} color={C.gold} opacity={c2s} />
          <RichLabel x={dTop[0] + 14} y={dTop[1] - 28} parts={[['σ'], ['d', 'sub']]} size={40} color={C.cyan} opacity={pD} />
          <RichLabel x={MX} y={860} parts={[['[PtCl'], ['4', 'sub'], [']'], ['2−', 'sup'], [' · persegi datar']]} size={34} color={C.muted} />
        </g>

        {/* catatan di bawah kartu */}
        <RichLabel x={NX} y={NY} parts={[['H'], ['1', 'sub'], [' ↔ H'], ['2', 'sub'], [' bertukar']]} size={34} color={C.ink} opacity={n0} />
        <RichLabel x={NX} y={NY + 50} parts={[['molekul tampak sama']]} size={30} color={C.mint} opacity={n0} />
        <RichLabel x={NX} y={NY} parts={[['bidang molekul:']]} size={32} color={C.cyan} opacity={n1a} />
        <RichLabel x={NX} y={NY + 48} parts={[['semua atom tetap di tempat']]} size={30} color={C.ink} opacity={n1a} />
        <RichLabel x={NX} y={NY} parts={[['bidang ⊥ :  H'], ['1', 'sub'], [' ↔ H'], ['2', 'sub']]} size={32} color={C.cyan} opacity={n1b} />
        <RichLabel x={NX} y={NY + 48} parts={[['dua σ'], ['v', 'sub'], [' pada air']]} size={30} color={C.ink} opacity={n1b} />
        <RichLabel x={NX} y={NY} parts={[['z → −z']]} size={34} color={C.cyan} opacity={n2} />
        <RichLabel x={NX} y={NY + 48} parts={[['atom F tetap di tempat']]} size={30} color={C.ink} opacity={n2} />
        <RichLabel x={NX} y={NY} parts={[['Cl'], ['1', 'sub'], [' ↔ Cl'], ['2', 'sub'], ['   Cl'], ['3', 'sub'], [' ↔ Cl'], ['4', 'sub']]} size={32} color={C.ink} opacity={n3} />
        <RichLabel x={NX} y={NY + 48} parts={[['90° antara dua C'], ['2', 'sub'], [' → 45° + 45°']]} size={30} color={C.cyan} opacity={n3} />
      </Stage>

      <Formula x={NX} y={330} p={f0} accent={C.cyan} caption="bidang cermin">
        σ
      </Formula>
      <Formula x={NX} y={330} p={f1} accent={C.cyan} caption="memuat sumbu utama · vertikal">
        σ<Sub>v</Sub>
      </Formula>
      <Formula x={NX} y={330} p={f2} accent={C.cyan} caption="⊥ sumbu utama · horizontal">
        σ<Sub>h</Sub>
      </Formula>
      <Formula
        x={NX}
        y={330}
        p={f3}
        accent={C.cyan}
        caption={
          <>
            membelah sudut antara dua C<Sub>2</Sub>
          </>
        }
      >
        σ<Sub>d</Sub>
      </Formula>
    </AbsoluteFill>
  );
};
