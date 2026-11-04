import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {BACK, EASE_IN_OUT, ramp, slot} from '../anim';
import {Formula, Glow, Label, Stage, Sub} from '../components/primitives';
import {EAxis} from '../components/moB';
import {Lvl, Pair} from '../components/poB';
import {pOrb, proj, Render3D, rotZ, VbDefs, type Cam, type Item, type V3} from '../components/vbC';
import {axisItem, H2O, molDraw, planeItem, SyDefs, SyText, type SMol} from '../components/syC';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Bab 09: tabel karakter C₂v (molekul di bidang yz → σv′(yz) = bidang molekul).
// p_z O: semua +1 → A₁. p_x (⊥ bidang): C₂ −1, σv(xz) +1, σv′(yz) −1 → B₁ (= HOMO 1b₁).
// Label MO air: 2a₁, 1b₂, 3a₁, 1b₁ (video sebelumnya).

type P = [string, ('sub' | 'sup')?][];
const X0 = 100;
const CW = [150, 110, 110, 172, 172, 196];
const CX = CW.map((w, i) => X0 + CW.slice(0, i).reduce((a, b) => a + b, 0) + w / 2);
const XE = X0 + CW.reduce((a, b) => a + b, 0);
const Y0 = 232;
const HH = 84;
const RH = 78;
const RY = [0, 1, 2, 3].map((r) => Y0 + HH + RH * r + RH / 2);

const ROWS: {lab: P; ch: number[]; fn: P}[] = [
  {lab: [['A'], ['1', 'sub']], ch: [1, 1, 1, 1], fn: [['z']]},
  {lab: [['A'], ['2', 'sub']], ch: [1, 1, -1, -1], fn: [['R'], ['z', 'sub']]},
  {lab: [['B'], ['1', 'sub']], ch: [1, -1, 1, -1], fn: [['x, R'], ['y', 'sub']]},
  {lab: [['B'], ['2', 'sub']], ch: [1, -1, -1, 1], fn: [['y, R'], ['x', 'sub']]},
];
const HEAD: {parts: P; color: string}[] = [
  {parts: [['E']], color: C.ink},
  {parts: [['C'], ['2', 'sub']], color: C.gold},
  {parts: [['σ'], ['v', 'sub'], ['(xz)']], color: C.cyan},
  {parts: [['σ'], ['v', 'sub'], ['′(yz)']], color: C.cyan},
];

// air bernomor H agar perpindahan terlihat
const WATER: SMol = {...H2O, atoms: H2O.atoms.map((a, i) => ({...a, label: i === 0 ? 'O' : String(i)}))};
const O: V3 = WATER.atoms[0].pos;
const opC2 = (v: V3, u: number) => rotZ(v, Math.PI * u);
const opXZ = (v: V3, u: number): V3 => [v[0], v[1] * (1 - 2 * u), v[2]];
const opYZ = (v: V3, u: number): V3 => [v[0] * (1 - 2 * u), v[1], v[2]];

/** Urutan operasi E → C₂ → σv(xz) → σv′(yz) mulai detik s. Mengembalikan progres tiap operasi. */
const seq = (t: number, s: number, d: [number, number, number, number]) => {
  const st = [s, s + d[0], s + d[0] + d[1], s + d[0] + d[1] + d[2]];
  const en = st.map((a, k) => a + d[k]);
  const u = st.map((a, k) => ramp(t, a, en[k], EASE_IN_OUT));
  return {st, en, u};
};

export const CharTable: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();
  const out = 1 - ramp(t, dur - 0.9, dur - 0.1, EASE_IN_OUT);

  // ---------- tabel ----------
  const tTab = wordOf(0, 'tabel');
  const frame = ramp(t, tTab - 0.5, tTab + 0.8);
  const headP = (k: number) => ramp(t, tTab + 0.3 + k * 0.45, tTab + 0.9 + k * 0.45, BACK);
  const corner = ramp(t, cue(1) - 0.3, wordOf(1, 'dua', 0) + 0.4, BACK);
  const rowT = [wordOf(1, 'satu', 0), wordOf(1, 'dua', 1), wordOf(1, 'satu', 1), wordOf(1, 'dua', 2)];
  const rowP = (r: number) => ramp(t, rowT[r] - 0.25, rowT[r] + 0.4, BACK);
  const chP = (r: number, c: number) => ramp(t, rowT[r] + 0.1 + c * 0.1, rowT[r] + 0.5 + c * 0.1);
  const plus = ramp(t, wordOf(2, 'tidak') - 0.3, wordOf(2, 'tidak') + 0.6);
  const minus = ramp(t, wordOf(2, 'berganti') - 0.3, wordOf(2, 'berganti') + 0.6);
  const plusPulse = Math.sin(Math.PI * ramp(t, wordOf(2, 'tidak') - 0.3, wordOf(2, 'tidak') + 1.6, (x) => x));
  const minusPulse = Math.sin(Math.PI * ramp(t, wordOf(2, 'berganti') - 0.3, wordOf(2, 'berganti') + 1.6, (x) => x));
  const fnP = (r: number) => ramp(t, cue(3) - 0.9 + r * 0.15, cue(3) - 0.3 + r * 0.15);

  // ---------- operasi pada orbital ----------
  const tPz = wordOf(3, 'oksigen');
  const tPx = wordOf(3, 'Orbital', 1);
  const A = seq(t, wordOf(3, 'tidak') - 0.1, [0.4, 1.0, 0.7, 0.7]);
  const B = seq(t, wordOf(3, 'berganti') - 0.25, [0.3, 1.1, 0.6, 0.6]);
  const pzOn = ramp(t, tPz - 0.6, tPz + 0.3) * (1 - ramp(t, tPx - 0.4, tPx + 0.2, EASE_IN_OUT));
  const pxOn = ramp(t, tPx - 0.1, tPx + 0.6);
  const inB = ramp(t, tPx - 0.3, tPx + 0.1, (x) => x);
  const S = inB > 0.5 ? B : A; // dua urutan tidak pernah tumpang tindih: urutan A sudah selesai (identitas) sebelum p_x muncul
  const tf = (v: V3) => opYZ(opXZ(opC2(v, S.u[1]), S.u[2]), S.u[3]);
  const opWin = (k: number) => Math.min(ramp(t, S.st[k] - 0.15, S.st[k] + 0.15), 1 - ramp(t, S.en[k] + 0.15, S.en[k] + 0.45));
  const cellA = (c: number) => ramp(t, A.en[c] - 0.1, A.en[c] + 0.3) * (1 - ramp(t, tPx - 0.3, tPx + 0.3));
  const cellB = (c: number) => ramp(t, B.en[c] - 0.1, B.en[c] + 0.3) * (1 - ramp(t, cue(4) - 0.2, cue(4) + 0.4));
  const tA1 = wordOf(3, 'satu', 0);
  const tB1 = wordOf(3, 'satu', 1);

  // ---------- baris 4: diagram MO ----------
  const mo = ramp(t, cue(4) - 0.3, cue(4) + 0.8);
  const waterOut = 1 - ramp(t, cue(4) - 0.6, cue(4) + 0.2, EASE_IN_OUT);
  const tMO = [wordOf(4, 'dua', 0), wordOf(4, 'satu', 1), wordOf(4, 'tiga'), wordOf(4, 'satu', 3)];
  const moLit = (k: number) => ramp(t, tMO[k] - 0.25, tMO[k] + 0.4);
  const moPulse = (k: number) => Math.sin(Math.PI * ramp(t, tMO[k] - 0.25, tMO[k] + 1.6, (x) => x));
  const prev = ramp(t, wordOf(4, 'video') - 0.3, wordOf(4, 'video') + 0.6, BACK);

  const rowLit = [
    Math.max(ramp(t, tA1 - 0.3, tA1 + 0.4) * (1 - ramp(t, tPx - 0.3, tPx + 0.3)), moPulse(0), moPulse(2)),
    0,
    Math.max(ramp(t, tB1 - 0.3, tB1 + 0.4) * (1 - ramp(t, cue(4) - 0.2, cue(4) + 0.5)), moPulse(3)),
    moPulse(1),
  ];
  const rowCol = [C.mint, C.ink, C.red, C.red];

  // ---------- kamera & air ----------
  const wIn = ramp(t, -0.3, 1.2) * waterOut;
  const cam: Cam = {cx: 1440, cy: 500, s: 165, yaw: 0.78 + 0.22 * Math.sin(t * 0.33), pitch: -0.3, persp: 9};
  // unsur simetri berkedip saat kolomnya muncul
  const elFlash = (k: number) => Math.sin(Math.PI * ramp(t, tTab + 0.3 + k * 0.45, tTab + 1.9 + k * 0.45, (x) => x));
  const c2Vis = Math.max(0.25 * ramp(t, tTab, tTab + 1), elFlash(1), opWin(1));
  const xzVis = Math.max(elFlash(2), opWin(2));
  const yzVis = Math.max(elFlash(3), opWin(3));
  const eRing = Math.max(elFlash(0), Math.sin(Math.PI * S.u[0]));
  const pd = (d: V3) => {
    const v = tf(d);
    return {dir: v, len: Math.hypot(v[0], v[1], v[2])};
  };
  const pz = pd([0, 0, 1]);
  const px = pd([1, 0, 0]);
  const items: Item[] = [
    ...molDraw(cam, WATER, {tf, opacity: wIn, rs: 1.15}),
    ...(pzOn > 0.01 && pz.len > 0.04 ? pOrb(cam, {origin: tf(O), dir: pz.dir, len: 1.05 * pz.len, wid: 0.3, opacity: 0.82 * pzOn * waterOut, glow: 0.5 + 0.3 * Math.sin(t * 2.2)}) : []),
    ...(pxOn > 0.01 && px.len > 0.04 ? pOrb(cam, {origin: tf(O), dir: px.dir, len: 1.05 * px.len, wid: 0.3, opacity: 0.82 * pxOn * waterOut, glow: 0.5 + 0.3 * Math.sin(t * 2.2)}) : []),
    axisItem(cam, {a: [0, 0, -1.25], b: [0, 0, 1.75], opacity: c2Vis * wIn, width: 4}),
    planeItem(cam, {corners: [[-1.5, 0, -1.2], [1.5, 0, -1.2], [1.5, 0, 1.6], [-1.5, 0, 1.6]], opacity: xzVis * wIn, depthBias: 3}),
    planeItem(cam, {corners: [[0, -1.5, -1.2], [0, 1.5, -1.2], [0, 1.5, 1.6], [0, -1.5, 1.6]], opacity: yzVis * wIn, depthBias: 3}),
  ].filter((x): x is Item => !!x);
  // sumbu koordinat kecil
  const AO: V3 = [-1.25, 1.2, -1.15];
  const axes: [V3, string][] = [
    [[0.55, 0, 0], 'x'],
    [[0, 0.55, 0], 'y'],
    [[0, 0, 0.55], 'z'],
  ];
  const pO = proj(AO, cam);
  const oP = proj(O, cam);
  const opNames: P[] = [[['E']], [['C'], ['2', 'sub']], [['σ'], ['v', 'sub'], ['(xz)']], [['σ'], ['v', 'sub'], ['′(yz)']]];
  const curCh = inB > 0.5 ? ROWS[2].ch : ROWS[0].ch;

  return (
    <AbsoluteFill style={{opacity: out}}>
      <Stage>
        <VbDefs />
        <SyDefs />
        <Glow x={540} y={430} r={480} color="violet" opacity={0.05 + 0.02 * Math.sin(t * 0.7)} />
        <Glow x={1440} y={480} r={380} color="gold" opacity={(0.05 + 0.03 * Math.sin(t * 1.1)) * Math.max(wIn, mo)} />

        {/* ===== tabel karakter ===== */}
        <g opacity={frame}>
          <rect x={X0 - 14} y={Y0 - 10} width={XE - X0 + 28} height={HH + RH * 4 + 20} rx={20} fill="rgba(14,20,44,0.78)" stroke={C.violet} strokeOpacity={0.45} strokeWidth={2} />
          <line x1={X0} y1={Y0 + HH} x2={XE} y2={Y0 + HH} stroke={C.muted} strokeOpacity={0.6} strokeWidth={2.5} />
          <line x1={X0 + CW[0]} y1={Y0 + 8} x2={X0 + CW[0]} y2={Y0 + HH + RH * 4 - 6} stroke={C.muted} strokeOpacity={0.6} strokeWidth={2.5} />
          <line x1={XE - CW[5]} y1={Y0 + 8} x2={XE - CW[5]} y2={Y0 + HH + RH * 4 - 6} stroke={C.muted} strokeOpacity={0.35} strokeWidth={2} />
        </g>
        {/* sorotan baris */}
        {rowLit.map((l, r) =>
          l > 0.01 ? (
            <rect key={r} x={X0 - 4} y={RY[r] - RH / 2 + 5} width={XE - X0 + 8} height={RH - 10} rx={14} fill={rowCol[r]} opacity={0.14 * l} stroke={rowCol[r]} strokeOpacity={0.7 * l} strokeWidth={2.5} />
          ) : null,
        )}
        <SyText x={CX[0]} y={Y0 + HH / 2} parts={[['C'], ['2v', 'sub']]} size={50} color={C.gold} font="serif" italic opacity={corner} />
        {HEAD.map((h, k) => (
          <SyText key={k} x={CX[k + 1]} y={Y0 + HH / 2 - (1 - headP(k)) * 14} parts={h.parts} size={k < 2 ? 40 : 32} color={h.color} font="serif" italic={k < 2} opacity={Math.min(1, headP(k))} />
        ))}
        <Label x={CX[5]} y={Y0 + HH / 2} size={24} color={C.muted} opacity={fnP(0)}>
          fungsi
        </Label>
        {ROWS.map((row, r) => (
          <g key={r}>
            <SyText x={CX[0]} y={RY[r]} parts={row.lab} size={42} color={C.ink} font="serif" italic opacity={Math.min(1, rowP(r))} />
            {row.ch.map((v, c) => {
              const col = interpolateColors(v > 0 ? plus : minus, [0, 1], [C.ink, v > 0 ? C.mint : C.red]);
              const pulse = v > 0 ? plusPulse : minusPulse;
              const ring = r === 0 ? cellA(c) : r === 2 ? cellB(c) : 0;
              return (
                <g key={c}>
                  {pulse > 0.01 ? <circle cx={CX[c + 1]} cy={RY[r]} r={30} fill={v > 0 ? C.mint : C.red} opacity={0.18 * pulse} /> : null}
                  {ring > 0.01 ? <circle cx={CX[c + 1]} cy={RY[r]} r={30 + 6 * (1 - ring)} fill="none" stroke={v > 0 ? C.mint : C.red} strokeWidth={4} opacity={ring} /> : null}
                  <SyText x={CX[c + 1]} y={RY[r] + (1 - chP(r, c)) * 10} parts={[[v > 0 ? '1' : '−1']]} size={40} color={col} font="serif" opacity={chP(r, c)} weight={600} />
                </g>
              );
            })}
            <SyText x={CX[5]} y={RY[r]} parts={row.fn} size={32} color={r === 0 || r === 2 ? C.ink : C.muted} font="serif" italic opacity={fnP(r)} weight={500} />
          </g>
        ))}

        {/* ===== air 3D + orbital ===== */}
        <Render3D items={items} />
        <g opacity={wIn}>
          {axes.map(([d, s]) => {
            const e = proj([AO[0] + d[0], AO[1] + d[1], AO[2] + d[2]], cam);
            const ex = e.X + (e.X - pO.X) * 0.35;
            const ey = e.Y + (e.Y - pO.Y) * 0.35;
            return (
              <g key={s}>
                <line x1={pO.X} y1={pO.Y} x2={e.X} y2={e.Y} stroke={C.muted} strokeWidth={3} strokeLinecap="round" />
                <circle cx={e.X} cy={e.Y} r={4} fill={C.muted} />
                <Label x={ex} y={ey} size={26} color={C.muted} font="serif" italic>
                  {s}
                </Label>
              </g>
            );
          })}
        </g>
        {/* nama orbital */}
        <SyText x={oP.X + 120} y={oP.Y - 150} parts={[['p'], ['z', 'sub']]} size={40} color={C.gold} font="serif" italic opacity={pzOn * waterOut} anchor="start" />
        <SyText x={oP.X + 150} y={oP.Y - 150} parts={[['p'], ['x', 'sub']]} size={40} color={C.gold} font="serif" italic opacity={pxOn * waterOut} anchor="start" />
        {/* operasi yang sedang diterapkan + karakternya */}
        {[0, 1, 2, 3].map((k) => {
          const w = opWin(k) * waterOut * Math.min(1, Math.max(pzOn, pxOn) * 4);
          if (w <= 0.01) return null;
          const done = ramp(t, S.en[k] - 0.1, S.en[k] + 0.2);
          const v = curCh[k];
          return (
            <g key={k} opacity={w}>
              <SyText x={1440 - 30} y={800} parts={opNames[k]} size={40} color={k === 0 ? C.ink : k === 1 ? C.gold : C.cyan} font="serif" italic anchor="end" />
              <SyText x={1440 + 10} y={800} parts={[['→ ']]} size={36} color={C.muted} anchor="start" />
              <SyText x={1440 + 60} y={800} parts={[[v > 0 ? '+1' : '−1']]} size={44} color={v > 0 ? C.mint : C.red} font="serif" anchor="start" opacity={done} weight={700} />
            </g>
          );
        })}
        {eRing > 0.01 ? <circle cx={oP.X} cy={oP.Y + 30} r={190 + 20 * eRing} fill="none" stroke={C.ink} strokeOpacity={0.35 * eRing * wIn} strokeWidth={3} strokeDasharray="6 10" /> : null}

        {/* ===== diagram MO air (video sebelumnya) ===== */}
        <g opacity={mo}>
          <EAxis x={1235} y0={830} y1={236} />
          <Lvl x={1500} y={262} w={170} color={C.red} t={t} opacity={0.45} />
          <Lvl x={1500} y={302} w={170} color={C.red} t={t} opacity={0.45} />
          <Label x={1600} y={282} size={22} color={C.red} anchor="start" opacity={0.6}>
            kosong
          </Label>
          {(
            [
              {y: 400, lab: [['1b'], ['1', 'sub']], k: 3, col: C.gold, note: 'HOMO'},
              {y: 482, lab: [['3a'], ['1', 'sub']], k: 2, col: C.cyan},
              {y: 584, lab: [['1b'], ['2', 'sub']], k: 1, col: C.cyan},
              {y: 770, lab: [['2a'], ['1', 'sub']], k: 0, col: C.cyan},
            ] as {y: number; lab: P; k: number; col: string; note?: string}[]
          ).map((m, j) => {
            const lit = moLit(m.k);
            const lc = interpolateColors(lit, [0, 1], [C.muted, C.gold]);
            const e = ramp(t, cue(4) + 0.1 + j * 0.15, cue(4) + 0.6 + j * 0.15);
            return (
              <g key={j}>
                <Lvl x={1500} y={m.y} w={170} color={m.col} t={t} lit={moPulse(m.k)} />
                <Pair x={1500} y={m.y} a={e} b={e} t={t} />
                <SyText x={1395} y={m.y} parts={m.lab} size={36 + 6 * lit} color={lc} font="serif" italic anchor="end" weight={600} />
                {m.note ? (
                  <Label x={1610} y={m.y} size={22} color={C.gold} anchor="start" opacity={0.8}>
                    {m.note}
                  </Label>
                ) : null}
              </g>
            );
          })}
          <SyText x={1500} y={206} parts={[['orbital molekul H'], ['2', 'sub'], ['O']]} size={28} color={C.muted} />
        </g>
        <g opacity={prev} transform={`translate(1500 852) scale(${0.85 + 0.15 * prev})`}>
          <rect x={-170} y={-26} width={340} height={52} rx={26} fill="rgba(10,14,30,0.9)" stroke={C.gold} strokeWidth={2.5} />
          <Label x={0} y={0} size={24} color={C.gold} weight={600}>
            ← dari video sebelumnya
          </Label>
        </g>
      </Stage>

      <Formula x={X0 + (XE - X0) / 2} y={745} p={slot(t, tA1 - 0.3, tPx + 0.2)} accent={C.mint} size={58}>
        p<Sub>z</Sub> <span style={{color: C.muted}}>→</span> <span style={{color: C.mint}}>A<Sub>1</Sub></span>
      </Formula>
      <Formula x={X0 + (XE - X0) / 2} y={745} p={slot(t, tB1 - 0.3, cue(4) + 0.3)} accent={C.red} size={58}>
        p<Sub>x</Sub> <span style={{color: C.muted}}>→</span> <span style={{color: C.red}}>B<Sub>1</Sub></span>
      </Formula>
      <Formula
        x={X0 + (XE - X0) / 2}
        y={745}
        p={slot(t, cue(4) + 0.3, dur + 5)}
        accent={C.gold}
        size={56}
        caption="label orbital = nama baris tabel (huruf kecil)"
      >
        1b<Sub>1</Sub> <span style={{color: C.muted}}>∈</span> B<Sub>1</Sub>
        <span style={{color: C.muted}}>{'  ·  '}</span>
        3a<Sub>1</Sub> <span style={{color: C.muted}}>∈</span> A<Sub>1</Sub>
      </Formula>
    </AbsoluteFill>
  );
};


