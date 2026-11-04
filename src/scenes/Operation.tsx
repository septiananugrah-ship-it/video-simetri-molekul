import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, mix, ramp, slot} from '../anim';
import {Card, Formula, Glow, Label, Stage} from '../components/primitives';
import {Stamp} from '../components/grupD';
import {Render3D, SvgChem, VbDefs, type Cam} from '../components/vbC';
import {BENZENE, CH4, H2O, NH3, OP_COLOR, OpIcon, OpSym, at2D, axis3D, plane3D, rotArrow3D, symMol, type OpKind} from '../components/syA';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Bab 01: operasi simetri (putar air 180°, H1 ⇄ H2, tampak sama) → unsur simetri (sumbu) → identitas E
// → lima jenis unsur (E, Cₙ, σ, i, Sₙ) sebagai teaser.
const W2 = H2O();
const MINIS = [
  {m: H2O(), name: [['H'], ['2', 'sub'], ['O']] as [string, ('sub' | 'sup')?][], s: 62},
  {m: NH3(), name: [['NH'], ['3', 'sub']] as [string, ('sub' | 'sup')?][], s: 60},
  {m: CH4(), name: [['CH'], ['4', 'sub']] as [string, ('sub' | 'sup')?][], s: 56},
  {m: BENZENE(1.39, 2.47, false), name: [['C'], ['6', 'sub'], ['H'], ['6', 'sub']] as [string, ('sub' | 'sup')?][], s: 34},
];
const TILES: {k: OpKind; n?: string; cap: string}[] = [
  {k: 'E', cap: 'identitas'},
  {k: 'C', cap: 'sumbu putar'},
  {k: 'sigma', cap: 'bidang cermin'},
  {k: 'i', cap: 'pusat inversi'},
  {k: 'S', cap: 'putaran tak wajar'},
];

export const Operation: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();
  const out = 1 - ramp(t, dur - 0.9, dur - 0.1, EASE_IN_OUT);

  // ---------- waktu ----------
  const molIn = ramp(t, -0.3, 1.2, BACK);
  const defCard = slot(t, wordOf(0, 'Operasi') - 0.2, cue(2) + 0.2);
  const ghost = ramp(t, wordOf(0, 'sama') - 0.3, wordOf(0, 'sama') + 0.4) * (1 - ramp(t, cue(1) - 0.4, cue(1) + 0.3, EASE_IN_OUT));
  const axIn = ramp(t, wordOf(1, 'Putar') - 0.3, wordOf(1, 'Putar') + 0.9, EASE_IN_OUT);
  const tRot = wordOf(1, 'seratus');
  const rotP = ramp(t, tRot - 0.1, Math.max(tRot + 2.2, wordOf(1, 'mengelilingi')), EASE_IN_OUT);
  const swap = ramp(t, wordOf(1, 'bertukar') - 0.3, wordOf(1, 'bertukar') + 0.4) * (1 - ramp(t, wordOf(1, 'Hasilnya') - 0.2, wordOf(1, 'Hasilnya') + 0.3, EASE_IN_OUT));
  const tHas = wordOf(1, 'Hasilnya');
  const hideNum = ramp(t, tHas - 0.2, tHas + 0.4, EASE_IN_OUT) * (1 - ramp(t, cue(2) + 0.2, cue(2) + 0.9, EASE_IN_OUT));
  const same = ramp(t, wordOf(1, 'dibedakan') - 0.3, wordOf(1, 'dibedakan') + 0.4, BACK) * (1 - ramp(t, cue(2) - 0.1, cue(2) + 0.4, EASE_IN_OUT));
  const opLab = ramp(t, tRot - 0.1, tRot + 0.6) * (1 - ramp(t, cue(3) - 0.3, cue(3) + 0.4, EASE_IN_OUT));
  const unsurCard = slot(t, cue(2) + 0.2, cue(3) + 0.4);
  const garis = ramp(t, wordOf(2, 'Garis') - 0.2, wordOf(2, 'Garis') + 0.4) * (1 - ramp(t, wordOf(2, 'bidang') - 0.1, wordOf(2, 'bidang') + 0.5));
  const bidang = ramp(t, wordOf(2, 'bidang') - 0.3, wordOf(2, 'bidang') + 0.5, EASE_IN_OUT) * (1 - ramp(t, wordOf(2, 'disebut') - 0.2, wordOf(2, 'disebut') + 0.5, EASE_IN_OUT));
  const unsurLab = ramp(t, wordOf(2, 'unsur') - 0.3, wordOf(2, 'unsur') + 0.5) * (1 - ramp(t, cue(3) - 0.3, cue(3) + 0.4, EASE_IN_OUT));
  const axOut = 1 - ramp(t, cue(3) - 0.2, cue(3) + 0.6, EASE_IN_OUT);
  const zero = ramp(t, wordOf(3, 'tidak') - 0.3, wordOf(3, 'tidak') + 0.5) * (1 - ramp(t, cue(4) - 0.4, cue(4) + 0.3, EASE_IN_OUT));
  const eCard = slot(t, wordOf(3, 'identitas') - 0.3, cue(4) + 0.2);
  const minis = ramp(t, wordOf(3, 'Setiap') - 0.4, wordOf(3, 'Setiap') + 0.6) * (1 - ramp(t, cue(4) - 0.2, cue(4) + 0.4, EASE_IN_OUT));
  const toTeaser = ramp(t, cue(4) - 0.4, cue(4) + 0.9, EASE_IN_OUT);
  const tLima = wordOf(4, 'lima');

  // ---------- kamera ----------
  const cam: Cam = {
    cx: mix(700, 960, toTeaser),
    cy: mix(490, 360, toTeaser) + 5 * Math.sin(t * 0.8),
    s: mix(210, 135, toTeaser),
    yaw: 0.38 + 0.26 * Math.sin(t * 0.33),
    pitch: -0.3,
  };
  const numOp = 1 - hideNum;
  const items = [
    ...axis3D(cam, {dir: [0, 0, 1], len: 1.5, p: axIn, opacity: axOut, width: 5 + 3 * garis, glow: 0.5 + garis + 0.5 * rotP * (1 - rotP) * 4}),
    ...rotArrow3D(cam, {at: [0, 0, 1.08], dir: [0, 0, 1], r: 0.5, from: -0.5 + rotP * Math.PI, sweep: 4.6, p: axIn, opacity: axOut}),
    ...plane3D(cam, {u: [0, 1, 0], v: [0, 0, 1], w: 1.25, h: 1.3, p: bidang, opacity: bidang, center: [0, 0, -0.05]}),
    ...symMol(cam, W2, {op: {kind: 'C', axis: [0, 0, 1], deg: 180}, p: rotP, opacity: molIn, numbers: ramp(t, 0.6, 1.6) * numOp, numColor: C.gold}),
  ];
  // bayangan "sebelumnya" saat kata "sama"
  const ghostItems = symMol(cam, W2, {opacity: 1, labels: false});
  const top = at2D(cam, [0, 0, 1.5]);
  const arr = at2D(cam, [0.5, 0, 1.08]);
  const hA = at2D(cam, W2.atoms[1].pos);
  const hB = at2D(cam, W2.atoms[2].pos);
  const hy = Math.max(hA.y, hB.y);

  return (
    <AbsoluteFill style={{opacity: out}}>
      <Stage>
        <VbDefs />
        <Glow x={cam.cx} y={cam.cy} r={360} color="gold" opacity={0.1 + 0.12 * axIn * axOut} />
        <g transform={`translate(${-34 * ghost} ${10 * ghost})`}>
          <Render3D items={ghostItems} opacity={0.25 * ghost} />
        </g>
        <Render3D items={items} />

        {/* label operasi & unsur pada sumbu */}
        <Label x={arr.x + 40} y={arr.y + 6} size={30} color={C.gold} weight={600} anchor="start" opacity={opLab}>
          operasi: putar 180°
        </Label>
        <g opacity={unsurLab}>
          <SvgChem x={top.x + 26} y={top.y - 6} size={34} color={C.gold} anchor="start" parts={[['unsur simetri: sumbu C'], ['2', 'sub']]} />
        </g>
        <Label x={cam.cx + 260} y={cam.cy + 150} size={30} color={C.cyan} weight={600} anchor="start" opacity={bidang}>
          … atau bidang
        </Label>
        {/* tukar tempat H1 ⇄ H2 */}
        <g opacity={swap}>
          <path d={`M${hA.x},${hy + 55} Q${(hA.x + hB.x) / 2},${hy + 150} ${hB.x},${hy + 55}`} fill="none" stroke={C.gold} strokeWidth={3.5} strokeDasharray="8 7" strokeDashoffset={-t * 20} markerEnd="url(#arrow-gold)" markerStart="url(#arrow-gold)" />
          <Label x={(hA.x + hB.x) / 2} y={hy + 135} size={30} color={C.gold} weight={600}>
            H1 ⇄ H2
          </Label>
        </g>
        {/* identitas: putar 0° */}
        <g opacity={zero}>
          <circle cx={cam.cx} cy={cam.cy} r={250} fill="none" stroke={C.ink} strokeOpacity={0.35} strokeWidth={2.5} strokeDasharray="10 12" strokeDashoffset={-t * 6} />
          <Label x={cam.cx} y={cam.cy - 280} size={34} color={C.ink} weight={600}>
            putar 0° · tetap diam
          </Label>
        </g>

        {/* setiap molekul memiliki E */}
        {MINIS.map((mm, k) => {
          const p = ramp(t, wordOf(3, 'Setiap') - 0.3 + k * 0.18, wordOf(3, 'Setiap') + 0.5 + k * 0.18, BACK) * minis;
          const x = 1180 + k * 170;
          const c: Cam = {cx: x, cy: 640, s: mm.s, yaw: t * 0.4 + k, pitch: -0.4};
          return (
            <g key={k} opacity={p}>
              <Render3D items={symMol(c, mm.m, {labels: false})} />
              <SvgChem x={x} y={745} size={28} color={C.muted} parts={mm.name} />
              <text x={x} y={790} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.serif} fontStyle="italic" fontSize={34} fontWeight={600} fill={C.mint}>
                E ✓
              </text>
            </g>
          );
        })}

        {/* lima jenis unsur simetri */}
        {TILES.map((tl, k) => {
          const p = ramp(t, tLima - 0.3 + k * 0.28, tLima + 0.5 + k * 0.28, BACK) * toTeaser;
          const x = 960 + (k - 2) * 250;
          const col = OP_COLOR[tl.k];
          const fl = 4 * Math.sin(t * 1.1 + k);
          return (
            <g key={k} opacity={p} transform={`translate(0 ${(1 - p) * 30 + fl})`}>
              <rect x={x - 105} y={628} width={210} height={222} rx={22} fill="rgba(12,18,40,0.85)" stroke={col} strokeOpacity={0.55} strokeWidth={2.5} />
              <OpIcon kind={tl.k} x={x} y={692} t={t} s={0.85} />
              <OpSym kind={tl.k} x={x} y={772} size={50} />
              <Label x={x} y={823} size={22} color={C.muted}>
                {tl.cap}
              </Label>
            </g>
          );
        })}
      </Stage>

      {/* kartu definisi (satu per momen) */}
      <Card x={1420} y={300} opacity={defCard} scale={0.94 + 0.06 * defCard} accent={C.gold} style={{padding: '24px 34px', width: 560, whiteSpace: 'normal'}}>
        <div style={{fontFamily: FONT.mono, fontSize: 20, letterSpacing: 4, color: C.gold}}>OPERASI SIMETRI</div>
        <div style={{fontSize: 34, lineHeight: 1.3, marginTop: 10}}>
          gerakan yang membuat molekul tampak <span style={{color: C.gold, fontWeight: 700}}>persis sama</span> seperti sebelumnya
        </div>
      </Card>
      <Card x={1420} y={300} opacity={unsurCard} scale={0.94 + 0.06 * unsurCard} accent={C.gold} style={{padding: '24px 34px', width: 560, whiteSpace: 'normal'}}>
        <div style={{fontFamily: FONT.mono, fontSize: 20, letterSpacing: 4, color: C.gold}}>UNSUR SIMETRI</div>
        <div style={{fontSize: 34, lineHeight: 1.3, marginTop: 10}}>
          <span style={{color: C.gold, fontWeight: 700}}>garis</span> atau <span style={{color: C.cyan, fontWeight: 700}}>bidang</span> tempat operasi itu dilakukan
        </div>
      </Card>
      <Formula x={1420} y={300} p={eCard} accent={C.ink} caption="identitas · dimiliki setiap molekul">
        <span style={{fontStyle: 'italic', fontWeight: 600}}>E</span>
        <span style={{fontFamily: FONT.sans, fontSize: '0.62em', color: C.muted}}> : tidak melakukan apa-apa</span>
      </Formula>
      <Stamp x={330} y={720} p={same} color={C.mint} rot={-4} text="TAMPAK SAMA ✓" />
    </AbsoluteFill>
  );
};
