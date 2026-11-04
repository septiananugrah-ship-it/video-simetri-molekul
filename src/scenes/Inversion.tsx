import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, mix, ramp, slot, win} from '../anim';
import {Formula, Frac, Glow, Stage, Sub} from '../components/primitives';
import {Stamp} from '../components/grupD';
import {BENZENE, CH4_S4, CO2, H2O, Mark, NH3, SyDefs, atomB, axisB, invLines, invPoint, molB, molPos, planeB, rotAxis, scr, type SMol, type SymOp} from '../components/syB';
import {Render3D, VbDefs, type Cam, type Item, type V3} from '../components/vbC';
import {RichLabel} from '../components/vbD';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Bab 04: pusat inversi i (benzena & CO₂ punya; H₂O & NH₃ tidak) dan putaran tak wajar Sₙ:
// CH₄ — putar 90° (bukan C₄: H belum kembali) lalu cermin ⊥ → sama (S₄). σ = S₁, i = S₂.
const INV: SymOp = {k: 'i'};
const C4: SymOp = {k: 'C', axis: [0, 0, 1], angle: Math.PI / 2};
const SH: SymOp = {k: 's', normal: [0, 0, 1]};
const MX = 760;
const NX = 1480;

type Panel = {mol: SMol; x: number; s: number; pitch: number; name: [string, ('sub' | 'sup')?][]; ok: boolean; word: string; dur: number};
const PANELS: Panel[] = [
  {mol: BENZENE, x: 300, s: 72, pitch: -0.95, name: [['benzena']], ok: true, word: 'Benzena', dur: 1.4},
  {mol: CO2, x: 720, s: 125, pitch: -0.3, name: [['CO'], ['2', 'sub']], ok: true, word: 'karbon', dur: 1.3},
  {mol: H2O, x: 1140, s: 165, pitch: -0.2, name: [['H'], ['2', 'sub'], ['O']], ok: false, word: 'Air', dur: 1.0},
  {mol: NH3, x: 1560, s: 165, pitch: -0.28, name: [['NH'], ['3', 'sub']], ok: false, word: 'amonia', dur: 0.9},
];

export const Inversion: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();
  const out = 1 - ramp(t, dur - 0.9, dur - 0.1, EASE_IN_OUT);
  const bump = (p: number) => Math.sin(Math.PI * Math.max(0, Math.min(1, p)));

  // ---------- fase 1: benzena besar ----------
  const toPanel = ramp(t, cue(1) - 0.5, cue(1) + 0.5, EASE_IN_OUT);
  const ptIn = ramp(t, 0.2, 1.1, BACK);
  const lines = ramp(t, wordOf(0, 'tarik') - 0.3, wordOf(0, 'tarik') + 0.8);
  const inv1 = ramp(t, wordOf(0, 'tarik') + 0.4, wordOf(0, 'tarik') + 2.8, EASE_IN_OUT);

  // ---------- fase 2: panel ----------
  const tCH4 = wordOf(2, 'putaran');
  const panelsOut = 1 - ramp(t, tCH4 - 1.0, tCH4 - 0.2, EASE_IN_OUT);
  const panelItems: React.ReactNode[] = [];
  PANELS.forEach((P, k) => {
    const tw = wordOf(1, P.word);
    const app = k === 0 ? 1 : ramp(t, tw - 0.4, tw + 0.4, BACK);
    const ip = ramp(t, tw + 0.1, tw + 0.1 + P.dur, EASE_IN_OUT);
    const mk = ramp(t, tw + 0.1 + P.dur, tw + 0.5 + P.dur);
    if (k === 0) return; // benzena digambar terpisah (melanjutkan fase 1)
    const op = app * panelsOut;
    if (op <= 0.001) return;
    const cam: Cam = {cx: P.x, cy: 470 + (1 - app) * 30, s: P.s, yaw: 0.35 + 0.1 * Math.sin(0.4 * t + k), pitch: P.pitch};
    const items: Item[] = [
      ...(P.ok ? [] : molB(cam, P.mol, {ghost: true, opacity: ramp(t, tw, tw + 0.5)})),
      ...molB(cam, P.mol, {ops: [[INV, ip]]}),
      ...invLines(cam, molPos(P.mol), {opacity: Math.min(app, bump(ip) * 0.9 + 0.25 * ip)}),
      invPoint(cam, {t, opacity: app, r: 8}),
    ].filter((x): x is Item => !!x);
    panelItems.push(
      <g key={k} opacity={op}>
        <Render3D items={items} />
        <RichLabel x={P.x} y={690} parts={P.name} size={34} color={C.ink} />
        <Mark x={P.x} y={775} ok={P.ok} p={mk} size={34} />
      </g>,
    );
  });

  // benzena (besar → panel 1)
  const bWord = wordOf(1, 'Benzena');
  const bInv2 = ramp(t, bWord + 0.25, bWord + 1.65, EASE_IN_OUT);
  const bMark = ramp(t, bWord + 1.65, bWord + 2.15);
  const camBz: Cam = {cx: mix(MX, PANELS[0].x, toPanel), cy: mix(500, 470, toPanel), s: mix(150, PANELS[0].s, toPanel), yaw: 0.25 + 0.06 * t, pitch: -0.95};
  const bzOp = ramp(t, -0.4, 0.6) * (1 - toPanel + toPanel * panelsOut);
  const bz: Item[] = [
    ...molB(camBz, BENZENE, {
      ops: [
        [INV, inv1],
        [INV, bInv2],
      ],
    }),
    ...invLines(camBz, molPos(BENZENE).slice(0, 6), {p: lines, opacity: lines * (1 - 0.6 * toPanel) + 0.5 * bump(bInv2)}),
    invPoint(camBz, {t, opacity: ptIn, r: mix(13, 8, toPanel)}),
  ].filter((x): x is Item => !!x);
  const ip0 = scr(camBz, [0, 0, 0]);

  // ---------- fase 3: CH₄ dan S₄ ----------
  const chIn = ramp(t, tCH4 - 0.4, tCH4 + 0.6);
  const camC: Cam = {cx: MX, cy: 510, s: 205, yaw: 0.42 + 0.14 * Math.sin(0.3 * t), pitch: -0.3};
  const axP = ramp(t, tCH4, tCH4 + 0.9);
  const spinOn = ramp(t, wordOf(2, 'Putar', 1) - 0.2, wordOf(2, 'Putar', 1) + 0.6);
  const plIn = ramp(t, wordOf(2, 'pantulkan') - 0.3, wordOf(2, 'pantulkan') + 0.8);
  const ghost = ramp(t, cue(3) - 0.2, cue(3) + 0.6);
  const rot = ramp(t, wordOf(3, 'putar') - 0.1, wordOf(3, 'putar') + 1.6, EASE_IN_OUT);
  const refl = ramp(t, wordOf(3, 'cerminkan') - 0.1, wordOf(3, 'cerminkan') + 1.5, EASE_IN_OUT);
  const ch4: Item[] = [
    ...planeB(camC, {u: [1, 0, 0], v: [0, 1, 0], a: 1.45, b: 1.45, p: plIn, flash: bump(refl)}),
    ...axisB(camC, {dir: [0, 0, 1], len: 1.55, p: axP, color: C.violet, spin: 1.4 * t, arrow: spinOn, ringR: 0.3, ringAt: 0.86}),
    ...molB(camC, CH4_S4, {ghost: true, opacity: ghost * (1 - 0.6 * refl)}),
    ...molB(camC, CH4_S4, {
      ops: [
        [C4, rot],
        [SH, refl],
      ],
      tint: (i) => (i > 0 ? [C.red, 0.9 * Math.min(rot, 1 - refl)] : null),
    }),
  ].filter((x): x is Item => !!x);
  const s4Top = scr(camC, [0, 0, 1.55]);
  const shCorner = scr(camC, [1.45, -1.45, 0]);
  const st1 = ramp(t, wordOf(3, 'derajat') + 0.2, wordOf(3, 'derajat') + 0.8) * (1 - ramp(t, wordOf(3, 'cerminkan') - 0.1, wordOf(3, 'cerminkan') + 0.4, EASE_IN_OUT));
  const st2 = ramp(t, wordOf(3, 'kembali') - 0.1, wordOf(3, 'kembali') + 0.5) * (1 - ramp(t, cue(4) - 0.4, cue(4) + 0.1, EASE_IN_OUT));

  // demo kecil S₁ dan S₂ (satu atom P)
  const P0: V3 = [0.95, 0, 0.6];
  const mini = (x: number, n: 1 | 2, tw: number) => {
    const op = ramp(t, tw - 0.5, tw + 0.3) * out;
    const r = ramp(t, tw + 0.1, tw + 1.4, EASE_IN_OUT);
    const m = ramp(t, tw + 1.5, tw + 2.4, EASE_IN_OUT);
    const cam: Cam = {cx: x, cy: 640, s: 105, yaw: 0.3, pitch: -0.35};
    const ang = (2 * Math.PI * r) / n;
    const q1 = rotAxis(P0, [0, 0, 1], ang);
    const q = [q1[0], q1[1], q1[2] * (1 - 2 * m)] as V3;
    const fin: V3 = n === 1 ? [P0[0], P0[1], -P0[2]] : [-P0[0], -P0[1], -P0[2]];
    const items: Item[] = [
      ...planeB(cam, {u: [1, 0, 0], v: [0, 1, 0], a: 1.3, b: 1.0, opacity: 0.9, tiles: 2, flash: bump(m)}),
      ...axisB(cam, {dir: [0, 0, 1], len: 1.25, color: C.violet, width: 3, spin: 1.4 * t, arrow: 0.9, ringR: 0.22}),
      atomB(cam, {pos: P0, el: 'F', label: null, ghost: true, opacity: 0.9}),
      atomB(cam, {pos: q, el: 'F', label: null, r: 0.24}),
      n === 2 ? invPoint(cam, {t, r: 6, opacity: ramp(t, tw + 2.2, tw + 2.7)}) : null,
      ...(n === 2 ? invLines(cam, [P0], {opacity: ramp(t, tw + 2.2, tw + 2.7)}) : []),
      atomB(cam, {pos: fin, el: 'F', label: null, ghost: true, opacity: 0.7 * m}),
    ].filter((x): x is Item => !!x);
    return (
      <g opacity={op}>
        <Render3D items={items} />
        <RichLabel x={x} y={810} parts={n === 1 ? [['S'], ['1', 'sub'], [' = σ']] : [['S'], ['2', 'sub'], [' = i']]} size={34} color={n === 1 ? C.cyan : C.pink} opacity={ramp(t, tw + 2.0, tw + 2.6)} />
      </g>
    );
  };

  // ---------- kartu & catatan ----------
  const f0 = slot(t, cue(0) - 0.3, cue(1) - 0.3);
  const f2 = slot(t, tCH4, cue(3));
  const f3 = slot(t, cue(3), cue(4));
  const f4 = slot(t, cue(4), dur + 2);
  const n0 = win(t, wordOf(0, 'tarik') + 2.6, cue(1) - 0.9, 0.5, 0.35);

  return (
    <AbsoluteFill style={{opacity: out}}>
      <Stage>
        <VbDefs />
        <SyDefs />
        <Glow x={MX} y={510} r={420} color="violet" opacity={(0.06 + 0.02 * Math.sin(t)) * (1 - toPanel + chIn)} />

        <g opacity={bzOp}>
          <Render3D items={bz} />
          <RichLabel x={ip0[0] + 30} y={ip0[1] - 34} parts={[['i']]} size={44} color={C.pink} opacity={ptIn * (1 - toPanel)} font="serif" italic />
          <RichLabel x={PANELS[0].x} y={690} parts={PANELS[0].name} size={34} color={C.ink} opacity={toPanel} />
          <Mark x={PANELS[0].x} y={775} ok p={bMark} size={34} />
        </g>
        {panelItems}

        <g opacity={chIn}>
          <Render3D items={ch4} />
          <RichLabel x={s4Top[0] + 50} y={s4Top[1] - 4} parts={[['S'], ['4', 'sub']]} size={38} color={C.violet} opacity={axP} />
          <RichLabel x={shCorner[0] + 26} y={shCorner[1] + 24} parts={[['σ'], ['h', 'sub']]} size={36} color={C.cyan} opacity={plIn * (1 - ramp(t, cue(4) - 0.5, cue(4) + 0.2))} />
          <RichLabel x={MX} y={860} parts={[['CH'], ['4', 'sub']]} size={34} color={C.muted} />
        </g>

        <RichLabel x={NX} y={560} parts={[['C'], ['1', 'sub'], [' ↔ C'], ['4', 'sub'], ['   C'], ['2', 'sub'], [' ↔ C'], ['5', 'sub'], ['   C'], ['3', 'sub'], [' ↔ C'], ['6', 'sub']]} size={32} color={C.ink} opacity={n0} />
        <RichLabel x={NX} y={610} parts={[['benzena tampak sama']]} size={30} color={C.mint} opacity={n0} />

        {mini(1320, 1, wordOf(4, 'Bidang'))}
        {mini(1650, 2, wordOf(4, 'pusat'))}
      </Stage>

      <Formula x={NX} y={330} p={f0} accent={C.pink} caption="(x, y, z) → (−x, −y, −z)">
        <span style={{color: C.pink, fontStyle: 'italic'}}>i</span>
      </Formula>
      <Formula x={NX} y={330} p={f2} accent={C.violet} caption="putar, lalu cermin pada bidang ⊥ sumbu" size={56}>
        <span style={{color: C.violet}}>
          S<Sub>n</Sub>
        </span>
        {' : putar '}
        <Frac n="360°" d={<i>n</i>} />
        {' + σ'}
        <Sub>h</Sub>
      </Formula>
      <Formula x={NX} y={330} p={f3} accent={C.violet} caption="putar 90°, lalu cermin ⊥ → metana sama">
        <span style={{color: C.violet}}>
          S<Sub>4</Sub>
        </span>
      </Formula>
      <Formula x={NX} y={330} p={f4} accent={C.violet} caption="kasus khusus putaran tak wajar">
        <span style={{color: C.cyan}}>σ</span> = S<Sub>1</Sub>
        {'    '}
        <span style={{color: C.pink, fontStyle: 'italic'}}>i</span> = S<Sub>2</Sub>
      </Formula>

      <AbsoluteFill style={{opacity: st1}}>
        <Stamp x={NX} y={590} p={Math.max(st1, 0.001)} text="bukan C₄" sub="H belum kembali" color={C.red} />
      </AbsoluteFill>
      <AbsoluteFill style={{opacity: st2}}>
        <Stamp x={NX} y={590} p={Math.max(st2, 0.001)} text="S₄ ✓" sub="metana kembali sama" color={C.violet} rot={-5} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
