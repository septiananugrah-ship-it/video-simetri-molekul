import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, mix, ramp, slot} from '../anim';
import {Formula, Glow, Stage, Sub} from '../components/primitives';
import {BF3, CH4_C3, H2CO, H2O, NH3, SyDefs, axisB, molB, planeB, ringB, scr, type SMol, type SymOp} from '../components/syB';
import {Render3D, VbDefs, type Cam, type Item} from '../components/vbC';
import {RichLabel} from '../components/vbD';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Bab 06: grup titik — operasi H₂O {E, C₂, σv, σv′} berkumpul menjadi lencana C₂v; semua unsur melewati satu titik tetap;
// NH₃ C₃v, BF₃ D₃h, CH₄ Td; grup sama (H₂O & H₂CO, C₂v) → banyak sifat sama.
const C2: SymOp = {k: 'C', axis: [0, 0, 1], angle: Math.PI};
const SV: SymOp = {k: 's', normal: [0, 1, 0]}; // bidang molekul
const SV2: SymOp = {k: 's', normal: [1, 0, 0]}; // bidang ⊥

const OPS: {sym: React.ReactNode; cap: string}[] = [
  {sym: <i style={{fontFamily: FONT.serif}}>E</i>, cap: 'identitas'},
  {
    sym: (
      <span style={{color: C.gold}}>
        C<Sub>2</Sub>
      </span>
    ),
    cap: 'putar 180°',
  },
  {
    sym: (
      <span style={{color: C.cyan}}>
        σ<Sub>v</Sub>
      </span>
    ),
    cap: 'cermin: bidang molekul',
  },
  {
    sym: (
      <span style={{color: C.cyan}}>
        σ<Sub>v</Sub>′
      </span>
    ),
    cap: 'cermin: bidang ⊥',
  },
];
const CARD_XY: [number, number][] = [
  [1250, 330],
  [1570, 330],
  [1250, 560],
  [1570, 560],
];
const BADGE_XY: [number, number] = [1410, 445];

const Lencana: React.FC<{x: number; y: number; p: number; scale?: number; children: React.ReactNode; color?: string; t: number}> = ({x, y, p, scale = 1, children, color = C.gold, t}) =>
  p <= 0.001 ? null : (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%,-50%) scale(${scale * (0.6 + 0.4 * p)})`,
        opacity: Math.min(1, p * 1.5),
        width: 230,
        height: 230,
        borderRadius: 999,
        border: `6px solid ${color}`,
        background: 'radial-gradient(circle at 40% 35%, rgba(60,48,20,0.95), rgba(10,10,20,0.95))',
        boxShadow: `0 0 ${40 + 14 * Math.sin(t * 2)}px ${color}66, inset 0 0 30px ${color}33`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT.sans,
        fontWeight: 700,
        fontSize: 92,
        color: C.ink,
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{position: 'absolute', inset: 12, borderRadius: 999, border: `2px dashed ${color}88`, transform: `rotate(${t * 12}deg)`}} />
      <span style={{lineHeight: 1}}>{children}</span>
    </div>
  );

type Pan = {mol: SMol; x: number; s: number; pitch: number; word: string; badge: React.ReactNode; axis?: boolean; plane?: boolean; name: [string, ('sub' | 'sup')?][]};
const PANS: Pan[] = [
  {
    mol: NH3,
    x: 760,
    s: 150,
    pitch: -0.25,
    word: 'Amonia',
    badge: (
      <>
        C<Sub>3v</Sub>
      </>
    ),
    axis: true,
    name: [['NH'], ['3', 'sub']],
  },
  {
    mol: BF3,
    x: 1180,
    s: 105,
    pitch: -0.5,
    word: 'Boron',
    badge: (
      <>
        D<Sub>3h</Sub>
      </>
    ),
    axis: true,
    plane: true,
    name: [['BF'], ['3', 'sub']],
  },
  {
    mol: CH4_C3,
    x: 1600,
    s: 125,
    pitch: -0.3,
    word: 'Metana',
    badge: (
      <>
        T<Sub>d</Sub>
      </>
    ),
    name: [['CH'], ['4', 'sub']],
  },
];

export const Group: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();
  const out = 1 - ramp(t, dur - 0.9, dur - 0.1, EASE_IN_OUT);
  const bump = (p: number) => Math.sin(Math.PI * Math.max(0, Math.min(1, p)));

  // ---------- operasi pada H₂O ----------
  const t0 = wordOf(0, 'operasi') + 0.3;
  const oE = ramp(t, t0, t0 + 1.0);
  const oC = ramp(t, t0 + 1.0, t0 + 2.3, EASE_IN_OUT);
  const oS = ramp(t, t0 + 2.4, t0 + 3.4, EASE_IN_OUT);
  const oS2 = ramp(t, t0 + 3.5, t0 + 4.7, EASE_IN_OUT);
  const opLit = [bump(oE), bump(oC), bump(oS), bump(oS2)];
  const allEl = ramp(t, wordOf(1, 'melewati') - 0.3, wordOf(1, 'melewati') + 0.6);
  const ctr = ramp(t, wordOf(1, 'titik', 0) - 0.3, wordOf(1, 'titik', 0) + 0.5, BACK);
  const tetap = ramp(t, wordOf(1, 'tetap') - 0.2, wordOf(1, 'tetap') + 0.5);
  const gtit = ramp(t, wordOf(1, 'grup') - 0.2, wordOf(1, 'grup') + 0.6);

  // tata letak: tunggal → panel (baris 3) → pasangan (baris 4)
  const toPan = ramp(t, cue(3) - 0.5, cue(3) + 0.5, EASE_IN_OUT);
  const toPair = ramp(t, cue(4) - 0.5, cue(4) + 0.6, EASE_IN_OUT);
  const wx = mix(mix(620, 340, toPan), 560, toPair);
  const ws = mix(mix(235, 150, toPan), 165, toPair);
  const wy = mix(mix(500, 450, toPan), 505, toPair);
  const camW: Cam = {cx: wx, cy: wy, s: ws, yaw: 0.6 + 0.16 * Math.sin(0.3 * t), pitch: -0.24};
  const elOp = Math.max(allEl * (1 - 0.6 * toPan), 0);
  const water: Item[] = [
    ...planeB(camW, {u: [0, 1, 0], v: [0, 0, 1], a: 1.2, b: 1.15, opacity: Math.max(bump(oS2), elOp), flash: bump(oS2)}),
    ...planeB(camW, {u: [1, 0, 0], v: [0, 0, 1], a: 1.4, b: 1.15, opacity: Math.max(bump(oS), elOp), flash: bump(oS)}),
    ...axisB(camW, {dir: [0, 0, 1], len: 1.35, opacity: Math.max(bump(oC), elOp), spin: 1.4 * t, arrow: 1, ringR: 0.26}),
    ...molB(camW, H2O, {
      ops: [
        [C2, oC],
        [SV, oS],
        [SV2, oS2],
      ],
      tint: () => [C.cyan, Math.max(bump(oE), bump(oS))],
    }),
    ringB(camW, {u: [1, 0, 0], v: [0, 0, 1], r: 0.2 + 1.2 * oS, opacity: 0.8 * bump(oS)}),
  ].filter((x): x is Item => !!x);
  const cP = scr(camW, [0, 0, 0]);

  // kartu operasi → lencana
  const tE = wordOf(2, 'E,');
  const tC = wordOf(2, 'dua,');
  const tSg = wordOf(2, 'sigma');
  const tN = wordOf(2, 'nama');
  const merge = ramp(t, tN - 0.2, tN + 0.9, EASE_IN_OUT);
  const nameLit = [tE, tC, tSg, tSg + 0.3].map((w) => bump(ramp(t, w - 0.2, w + 1.0)));
  const braces = ramp(t, wordOf(0, 'grup') - 0.3, wordOf(0, 'grup') + 0.5) * (1 - merge);
  const badgeP = ramp(t, tN + 0.5, tN + 1.2, BACK);
  const bx = mix(mix(BADGE_XY[0], 340, toPan), 560, toPair);
  const by = mix(mix(BADGE_XY[1], 690, toPan), 755, toPair);
  const bsc = mix(mix(1, 0.52, toPan), 0.52, toPair);

  // panel lain
  const panOut = 1 - ramp(t, cue(4) - 0.6, cue(4) + 0.2, EASE_IN_OUT);
  // H₂CO (baris 4)
  const hcIn = ramp(t, wordOf(4, 'berbeda') - 0.3, wordOf(4, 'berbeda') + 0.6);
  const camF: Cam = {cx: 1360, cy: 505, s: 150, yaw: 0.6 + 0.16 * Math.sin(0.3 * t + 1), pitch: -0.24};
  const fSame = slot(t, cue(4), dur + 2);
  const props = [
    {w: 'kepolaran', txt: 'kepolaran', x: 600},
    {w: 'getaran', txt: 'getaran aktif IR', x: 960},
    {w: 'orbitalnya', txt: 'pola orbital', x: 1320},
  ];

  return (
    <AbsoluteFill style={{opacity: out}}>
      <Stage>
        <VbDefs />
        <SyDefs />
        <Glow x={camW.cx} y={camW.cy} r={400} color="violet" opacity={0.07 + 0.02 * Math.sin(t)} />

        <g opacity={ramp(t, -0.3, 0.8)}>
          <Render3D items={water} />
          {/* titik tetap */}
          <g opacity={ctr * (1 - toPan)}>
            <circle cx={cP[0]} cy={cP[1]} r={44 * (1 + 0.15 * Math.sin(t * 3))} fill="url(#syb-white)" />
            <circle cx={cP[0]} cy={cP[1]} r={9} fill="#fff" />
          </g>
          <g opacity={tetap * (1 - toPan)}>
            <line x1={cP[0] - 16} y1={cP[1] - 8} x2={cP[0] - 190} y2={cP[1] - 100} stroke={C.ink} strokeWidth={2} opacity={0.7} />
            <RichLabel x={cP[0] - 200} y={cP[1] - 122} parts={[['titik tetap']]} size={32} color={C.ink} anchor="end" />
          </g>
          <RichLabel x={wx} y={mix(850, 860, toPan)} parts={[['grup titik']]} size={40} color={C.gold} opacity={gtit * (1 - toPan)} weight={700} />
          <RichLabel x={wx} y={782} parts={[['H'], ['2', 'sub'], ['O']]} size={32} color={C.muted} opacity={toPan * (1 - toPair)} />
          <RichLabel x={wx - 90} y={755} parts={[['H'], ['2', 'sub'], ['O']]} size={34} color={C.muted} opacity={toPair} anchor="end" />
        </g>

        {/* kurung kurawal kumpulan */}
        <g opacity={braces} fill="none" stroke={C.gold} strokeWidth={5} strokeLinecap="round">
          <path d="M1090,200 q-34,0 -34,40 v170 q0,30 -30,35 q30,5 30,35 v170 q0,40 34,40" />
          <path d="M1730,200 q34,0 34,40 v170 q0,30 30,35 q-30,5 -30,35 v170 q0,40 -34,40" />
        </g>
        <RichLabel x={1410} y={182} parts={[['grup']]} size={38} color={C.gold} opacity={braces} weight={700} />

        {PANS.map((P, k) => {
          const tw = wordOf(3, P.word);
          const app = ramp(t, tw - 0.4, tw + 0.4, BACK);
          const op = app * panOut;
          if (op <= 0.001) return null;
          const cam: Cam = {cx: P.x, cy: 450 + (1 - app) * 30, s: P.s, yaw: 0.4 + 0.25 * t + k, pitch: P.pitch};
          const items: Item[] = [
            ...(P.plane ? planeB(cam, {u: [1, 0, 0], v: [0, 1, 0], a: 1.8, b: 1.8, opacity: 0.8, tiles: 3}) : []),
            ...(P.axis ? axisB(cam, {dir: [0, 0, 1], len: 1.35, spin: 1.4 * t, arrow: 1, ringR: 0.26, width: 3}) : []),
            ...molB(cam, P.mol, {numOp: 0}),
          ];
          return (
            <g key={k} opacity={op}>
              <Render3D items={items} />
              <RichLabel x={P.x} y={782} parts={P.name} size={32} color={C.muted} />
            </g>
          );
        })}

        <g opacity={hcIn}>
          <Render3D items={[...planeB(camF, {u: [1, 0, 0], v: [0, 0, 1], a: 1.4, b: 1.1, opacity: 0.5}), ...axisB(camF, {dir: [0, 0, 1], len: 1.4, opacity: 0.8, spin: 1.4 * t, arrow: 1, ringR: 0.26}), ...molB(camF, H2CO, {numOp: 0})]} />
          <RichLabel x={1450} y={755} parts={[['H'], ['2', 'sub'], ['CO']]} size={34} color={C.muted} anchor="start" />
          <RichLabel x={960} y={505} parts={[['=']]} size={80} color={C.gold} weight={700} />
        </g>

        {props.map((q, k) => {
          const p = ramp(t, wordOf(4, q.w) - 0.3, wordOf(4, q.w) + 0.4, BACK);
          if (p <= 0.001) return null;
          return (
            <g key={k} opacity={Math.min(1, p * 1.5)} transform={`translate(${q.x} ${852 + (1 - p) * 16})`}>
              <rect x={-150} y={-30} width={300} height={60} rx={30} fill={C.mint} fillOpacity={0.14} stroke={C.mint} strokeWidth={2.5} />
              <text x={0} y={2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.sans} fontWeight={600} fontSize={28} fill={C.ink}>
                {q.txt}
              </text>
            </g>
          );
        })}
      </Stage>

      {/* kartu operasi */}
      {OPS.map((o, k) => {
        const app = ramp(t, t0 - 0.6 + k * 0.45, t0 - 0.1 + k * 0.45, BACK);
        if (app <= 0.001) return null;
        const lit = Math.max(opLit[k], nameLit[k]);
        const [x0, y0] = CARD_XY[k];
        const x = mix(x0, BADGE_XY[0], merge);
        const y = mix(y0, BADGE_XY[1], merge);
        return (
          <div
            key={k}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              transform: `translate(-50%,-50%) scale(${(0.85 + 0.15 * app) * (1 - 0.6 * merge) * (1 + 0.06 * lit)})`,
              opacity: Math.min(1, app * 1.4) * (1 - ramp(t, tN + 0.5, tN + 1.0)),
              width: 280,
              padding: '16px 10px 14px',
              borderRadius: 18,
              background: 'linear-gradient(160deg, rgba(22,30,58,0.9), rgba(8,11,24,0.9))',
              border: `2px solid rgba(255,194,74,${0.3 + 0.7 * lit})`,
              boxShadow: `0 16px 40px rgba(0,0,0,0.5), 0 0 ${10 + 40 * lit}px rgba(255,194,74,${0.15 + 0.4 * lit})`,
              textAlign: 'center',
              color: C.ink,
              fontFamily: FONT.sans,
            }}
          >
            <div style={{fontSize: 60, lineHeight: 1.15, fontWeight: 600}}>{o.sym}</div>
            <div style={{fontSize: 24, color: C.muted, marginTop: 4}}>{o.cap}</div>
          </div>
        );
      })}

      <Lencana x={bx} y={by} p={badgeP} scale={bsc} t={t}>
        C<Sub>2v</Sub>
      </Lencana>
      {PANS.map((P, k) => (
        <Lencana key={k} x={P.x} y={690} p={ramp(t, wordOf(3, P.word) + 0.1, wordOf(3, P.word) + 0.8, BACK) * panOut} scale={0.52} t={t}>
          {P.badge}
        </Lencana>
      ))}
      <Lencana x={1360} y={755} p={ramp(t, wordOf(4, 'sama') - 0.2, wordOf(4, 'sama') + 0.5, BACK)} scale={0.52} t={t}>
        C<Sub>2v</Sub>
      </Lencana>

      <Formula x={960} y={212} p={fSame} accent={C.gold} size={56}>
        grup sama <span style={{color: C.gold}}>⇒</span> banyak sifat sama
      </Formula>
    </AbsoluteFill>
  );
};
