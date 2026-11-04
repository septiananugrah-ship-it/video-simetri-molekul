import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {BACK, EASE_IN_OUT, mix, ramp} from '../anim';
import {Formula, Glow, Label, Stage, Sub} from '../components/primitives';
import {Render3D, rotZ, VbDefs, type Cam, type Item, type V3} from '../components/vbC';
import {axisItem, BENZENE, c60Items, CH4, CO2, HCL, molDraw, planeItem, SF6, spinArrow, SyDefs, SyText, type SMol} from '../components/syC';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Bab 07: diagram alir grup titik. Linear? → D∞h (i) / C∞v; kubik → Td / Oh / Ih; n C₂ ⊥ Cₙ → D / C; σh → h, σv/σd → v/d.
// Jalur benzena menyala sampai D₆h; benzena 3D di kanan menunjukkan C₆, enam C₂ ⊥, dan σh.

type P = [string, ('sub' | 'sup')?][];
const DEC = '#8fa6ff';

/** Simpul keputusan (segi enam memanjang) atau hasil (kapsul). */
const Node: React.FC<{
  x: number;
  y: number;
  w: number;
  h?: number;
  kind: 'q' | 'r';
  p: number;
  lit?: number;
  flash?: number;
  color?: string;
  lines: {parts: P; size?: number; color?: string; dy?: number; op?: number; font?: 'sans' | 'serif'; italic?: boolean}[];
  ghost?: number;
}> = ({x, y, w, h = 76, kind, p, lit = 0, flash = 0, color = DEC, lines, ghost = 0}) => {
  const col = interpolateColors(lit, [0, 1], [color, C.gold]);
  const hw = w / 2;
  const hh = h / 2;
  const shape =
    kind === 'q'
      ? `M${-hw},0 L${-hw + hh * 0.8},${-hh} L${hw - hh * 0.8},${-hh} L${hw},0 L${hw - hh * 0.8},${hh} L${-hw + hh * 0.8},${hh} Z`
      : `M${-hw + hh},${-hh} L${hw - hh},${-hh} A${hh},${hh} 0 0 1 ${hw - hh},${hh} L${-hw + hh},${hh} A${hh},${hh} 0 0 1 ${-hw + hh},${-hh} Z`;
  const k = 0.86 + 0.14 * p;
  return (
    <g transform={`translate(${x} ${y})`}>
      {ghost > 0.001 && p < 0.999 ? <path d={shape} fill="none" stroke={C.faint} strokeWidth={2} strokeDasharray="7 8" opacity={ghost * (1 - p)} /> : null}
      {p > 0.001 ? (
        <g opacity={Math.min(1, p * 1.5)} transform={`scale(${k})`}>
          <path d={shape} fill={col} opacity={0.06 + 0.1 * lit + 0.18 * flash} transform="scale(1.1 1.32)" />
          <path d={shape} fill="rgba(10,15,34,0.94)" stroke={col} strokeWidth={kind === 'q' ? 3 : 3.5} strokeLinejoin="round" />
          {lines.map((l, i) => (
            <SyText
              key={i}
              x={0}
              y={l.dy ?? -2}
              parts={l.parts}
              size={l.size ?? 28}
              color={l.color ?? (kind === 'q' ? C.ink : col)}
              weight={kind === 'q' ? 500 : 600}
              font={l.font ?? 'sans'}
              italic={l.italic}
              opacity={l.op ?? 1}
            />
          ))}
        </g>
      ) : null}
    </g>
  );
};

/** Panah alir (polyline) yang tergambar; lit = jalur benzena (emas + butir mengalir). */
const Edge: React.FC<{pts: [number, number][]; p: number; lit?: number; label?: string; lx?: number; ly?: number; t: number; anchor?: 'start' | 'middle' | 'end'}> = ({
  pts,
  p,
  lit = 0,
  label,
  lx,
  ly,
  t,
  anchor = 'middle',
}) => {
  if (p <= 0.001) return null;
  const segs = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
  const L = segs.reduce((a, b) => a + b, 0);
  const d = pts.map((q, i) => `${i ? 'L' : 'M'}${q[0]},${q[1]}`).join(' ');
  const col = interpolateColors(lit, [0, 1], ['#7d89b3', C.gold]);
  const e = pts[pts.length - 1];
  const e0 = pts[pts.length - 2];
  const ang = Math.atan2(e[1] - e0[1], e[0] - e0[0]);
  const hs = 13;
  const along = (s: number): [number, number] => {
    let r = s * L;
    for (let i = 0; i < segs.length; i++) {
      if (r <= segs[i] || i === segs.length - 1) {
        const u = Math.min(1, r / segs[i]);
        return [mix(pts[i][0], pts[i + 1][0], u), mix(pts[i][1], pts[i + 1][1], u)];
      }
      r -= segs[i];
    }
    return e;
  };
  return (
    <g>
      {lit > 0.01 ? <path d={d} fill="none" stroke={C.gold} strokeWidth={14} strokeOpacity={0.12 * lit} strokeLinecap="round" strokeLinejoin="round" /> : null}
      <path d={d} fill="none" stroke={col} strokeWidth={3 + 1.5 * lit} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${L} ${L}`} strokeDashoffset={L * (1 - p)} />
      <path
        d={`M${e[0]},${e[1]} L${e[0] - hs * Math.cos(ang - 0.45)},${e[1] - hs * Math.sin(ang - 0.45)} L${e[0] - hs * Math.cos(ang + 0.45)},${e[1] - hs * Math.sin(ang + 0.45)} Z`}
        fill={col}
        opacity={ramp(p, 0.8, 1, (x) => x)}
      />
      {lit > 0.01
        ? [0, 1, 2].map((k) => {
            const s = (t * 0.5 + k / 3) % 1;
            const [bx, by] = along(s);
            const a = Math.min(1, s * 6) * (1 - s);
            return <circle key={k} cx={bx} cy={by} r={5} fill="#fff6dc" opacity={Math.min(1, lit * a * 1.2)} />;
          })
        : null}
      {label ? (
        <Label x={lx ?? 0} y={ly ?? 0} size={22} color={col} anchor={anchor} weight={600} opacity={ramp(p, 0.4, 1, (x) => x)}>
          {label}
        </Label>
      ) : null}
    </g>
  );
};

// letak simpul
const N1 = {x: 300, y: 250};
const N1B = {x: 630, y: 250};
const N2 = {x: 300, y: 425};
const N3 = {x: 300, y: 610};
const N4 = {x: 300, y: 790};
const BZ = {x: 1530, y: 440};
const R = {
  Dinf: {x: 905, y: 200},
  Cinf: {x: 905, y: 300},
  Td: {x: 625, y: 425},
  Oh: {x: 795, y: 425},
  Ih: {x: 965, y: 425},
  D: {x: 640, y: 565},
  Cf: {x: 640, y: 655},
  h: {x: 660, y: 745},
  vd: {x: 700, y: 835},
};

export const Flowchart: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();
  const out = 1 - ramp(t, dur - 0.9, dur - 0.1, EASE_IN_OUT);
  const at = (a: number, d = 0.6) => ramp(t, a - 0.25, a + d);
  const fl = (a: number) => Math.sin(Math.PI * ramp(t, a - 0.25, a + 1.3, (x) => x));

  const ghost = ramp(t, wordOf(0, 'diagram') - 0.3, wordOf(0, 'diagram') + 1.2);
  // baris 1: linear
  const tN1 = wordOf(1, 'linear');
  const tYa = wordOf(1, 'Jika');
  const tN1b = wordOf(1, 'pusat', 0);
  const tDinf = wordOf(1, 'hingga', 0);
  const tCO2 = wordOf(1, 'karbon');
  const tNo = wordOf(1, 'Tanpa');
  const tCinf = wordOf(1, 'hingga', 1);
  const tHCl = wordOf(1, 'Cl');
  // baris 2: kubik
  const tN2 = wordOf(2, 'sangat');
  const tTd = wordOf(2, 'Tetrahedron');
  const tOh = wordOf(2, 'oktahedron');
  const tSF6 = wordOf(2, 'belerang');
  const tIh = wordOf(2, 'ikosahedron');
  const tC60 = wordOf(2, 'fulerena');
  // baris 3: keluarga
  const tN3 = wordOf(3, 'sumbu', 0);
  const tPerp = wordOf(3, 'tegak');
  const tD = wordOf(3, 'keluarga', 0);
  const tC = wordOf(3, 'keluarga', 1);
  // baris 4: cermin
  const tN4 = wordOf(4, 'cermin');
  const tH = wordOf(4, 'akhiran', 0);
  const tVD = wordOf(4, 'akhiran', 1);
  // baris 5: benzena
  const tBz = wordOf(5, 'benzena');
  const lit1 = at(wordOf(5, 'linear'), 0.7);
  const lit2 = at(wordOf(5, 'kubik'), 0.7);
  const tC6 = wordOf(5, 'enam', 0);
  const lit3 = at(wordOf(5, 'utama'), 0.7);
  const tC2 = wordOf(5, 'enam', 1);
  const lit4 = at(wordOf(5, 'tegak'), 0.7);
  const tSig = wordOf(5, 'sigma');
  const lit5 = at(tSig, 0.7);
  const tRes = wordOf(5, 'Jadi');
  const res = ramp(t, tRes - 0.2, tRes + 0.7, BACK);
  const dimMini = 1 - 0.55 * ramp(t, cue(5) - 0.4, cue(5) + 0.6);

  // ---------- benzena 3D ----------
  const bzIn = ramp(t, -0.4, 1.4);
  const spin60 = ramp(t, tC6 + 0.1, tC6 + 1.5, EASE_IN_OUT) * (Math.PI / 3);
  const c6 = ramp(t, tC6 - 0.3, tC6 + 0.5);
  const c2s = (k: number) => ramp(t, tC2 - 0.2 + k * 0.18, tC2 + 0.4 + k * 0.18);
  const sig = ramp(t, tSig - 0.3, tSig + 0.6);
  const focus = ramp(t, tBz - 0.5, tBz + 0.6);
  const cam: Cam = {cx: BZ.x, cy: BZ.y, s: mix(98, 106, focus), yaw: 0.25 + 0.13 * t, pitch: -0.56, persp: 9};
  const tf = (v: V3) => rotZ(v, spin60);
  const bzItems: Item[] = [
    ...molDraw(cam, BENZENE, {tf, opacity: bzIn * mix(0.75, 1, focus)}),
    axisItem(cam, {a: [0, 0, -2.0], b: [0, 0, 2.1], opacity: c6, p: c6, width: 5}),
    spinArrow(cam, {c: [0, 0, 1.55], n: [0, 0, 1], r: 0.45, ph: t * 1.4, opacity: c6}),
    ...[0, 1, 2, 3, 4, 5].map((k) => {
      const a = (k * 30 * Math.PI) / 180 + spin60;
      const RR = 2.8;
      return axisItem(cam, {a: [-RR * Math.cos(a), -RR * Math.sin(a), 0], b: [RR * Math.cos(a), RR * Math.sin(a), 0], opacity: c2s(k) * 0.9, p: c2s(k), width: 2.6});
    }),
    planeItem(cam, {
      corners: Array.from({length: 6}, (_, k) => {
        const a = ((k * 60 + 30) * Math.PI) / 180;
        return [2.95 * Math.cos(a), 2.95 * Math.sin(a), 0] as V3;
      }),
      opacity: sig,
      depthBias: 6,
    }),
  ].filter((x): x is Item => !!x);
  const topY = BZ.y - 2.1 * cam.s * Math.cos(0.56);

  // ---------- molekul mini ----------
  const mini = (mol: SMol, x: number, y: number, s: number, op: number, ph: number, pitch = -0.35, rs = 1.25): Item[] =>
    molDraw({cx: x, cy: y, s, yaw: ph + 0.5 * t, pitch, persp: 9}, mol, {opacity: op * dimMini, rs, bw: 0.15});

  return (
    <AbsoluteFill style={{opacity: out}}>
      <Stage>
        <VbDefs />
        <SyDefs />
        <Glow x={620} y={520} r={520} color="cyan" opacity={0.05 + 0.02 * Math.sin(t * 0.7)} />
        <Glow x={BZ.x} y={BZ.y} r={380} color="gold" opacity={(0.05 + 0.03 * Math.sin(t * 1.1)) * (0.6 + 0.8 * focus)} />

        {/* ===== panah ===== */}
        <Edge pts={[[N1.x + 125, N1.y], [N1B.x - 105, N1B.y]]} p={at(tYa, 0.5)} label="Ya" lx={478} ly={228} t={t} />
        <Edge pts={[[N1B.x + 100, N1B.y - 8], [R.Dinf.x - 80, R.Dinf.y + 6]]} p={at(tDinf - 0.2, 0.5)} label="Ya" lx={772} ly={203} t={t} />
        <Edge pts={[[N1B.x + 100, N1B.y + 8], [R.Cinf.x - 80, R.Cinf.y - 6]]} p={at(tNo, 0.5)} label="Tidak" lx={772} ly={300} t={t} />
        <Edge pts={[[N1.x, N1.y + 40], [N2.x, N2.y - 42]]} p={at(cue(2) - 0.2, 0.6)} lit={lit1} label="Tidak" lx={N1.x + 18} ly={338} anchor="start" t={t} />
        <Edge pts={[[N2.x + 165, N2.y], [R.Td.x - 72, R.Td.y]]} p={at(tTd - 0.2, 0.5)} label="Ya" lx={512} ly={403} t={t} />
        <Edge pts={[[N2.x, N2.y + 40], [N3.x, N3.y - 46]]} p={at(cue(3) - 0.2, 0.6)} lit={lit2} label="Tidak" lx={N2.x + 18} ly={518} anchor="start" t={t} />
        <Edge pts={[[N3.x + 150, N3.y - 8], [R.D.x - 112, R.D.y + 4]]} p={at(tD - 0.2, 0.5)} lit={lit4} label="Ya" lx={498} ly={568} t={t} />
        <Edge pts={[[N3.x + 150, N3.y + 8], [R.Cf.x - 112, R.Cf.y - 4]]} p={at(tC - 0.2, 0.5)} label="Tidak" lx={500} ly={656} t={t} />
        <Edge pts={[[N3.x, N3.y + 46], [N4.x, N4.y - 40]]} p={at(cue(4) - 0.2, 0.6)} lit={lit4} t={t} />
        <Edge pts={[[N4.x + 140, N4.y - 8], [R.h.x - 152, R.h.y + 4]]} p={at(tH - 0.2, 0.5)} lit={lit5} t={t} />
        <Edge pts={[[N4.x + 140, N4.y + 8], [R.vd.x - 192, R.vd.y - 4]]} p={at(tVD - 0.2, 0.5)} t={t} />

        {/* ===== simpul ===== */}
        <Node {...N1} w={250} kind="q" p={at(tN1)} lit={lit1} flash={fl(tN1)} ghost={ghost} lines={[{parts: [['Linear?']]}]} />
        <Node {...N1B} w={200} kind="q" p={at(tN1b)} flash={fl(tN1b)} ghost={ghost} lines={[{parts: [['Ada '], ['i'], ['?']]}]} />
        <Node {...R.Dinf} w={150} kind="r" p={at(tDinf)} flash={fl(tDinf)} ghost={ghost} color={C.gold} lines={[{parts: [['D'], ['∞h', 'sub']], size: 38, font: 'serif', italic: true}]} />
        <Node {...R.Cinf} w={150} kind="r" p={at(tCinf)} flash={fl(tCinf)} ghost={ghost} color={C.cyan} lines={[{parts: [['C'], ['∞v', 'sub']], size: 38, font: 'serif', italic: true}]} />

        <Node {...N2} w={340} kind="q" p={at(tN2)} lit={lit2} flash={fl(tN2)} ghost={ghost} lines={[{parts: [['Simetri sangat tinggi?']], size: 27}]} />
        <Node {...R.Td} w={128} kind="r" p={at(tTd)} flash={fl(tTd)} ghost={ghost} color={C.mint} lines={[{parts: [['T'], ['d', 'sub']], size: 38, font: 'serif', italic: true}]} />
        <Node {...R.Oh} w={128} kind="r" p={at(tOh)} flash={fl(tOh)} ghost={ghost} color={C.mint} lines={[{parts: [['O'], ['h', 'sub']], size: 38, font: 'serif', italic: true}]} />
        <Node {...R.Ih} w={128} kind="r" p={at(tIh)} flash={fl(tIh)} ghost={ghost} color={C.mint} lines={[{parts: [['I'], ['h', 'sub']], size: 38, font: 'serif', italic: true}]} />

        <Node
          {...N3}
          w={310}
          h={92}
          kind="q"
          p={at(tN3)}
          lit={lit3}
          flash={fl(tN3)}
          ghost={ghost}
          lines={[
            {parts: [['sumbu utama C'], ['n', 'sub']], size: 22, color: C.gold, dy: -19},
            {parts: [['ada '], ['n'], [' C'], ['2', 'sub'], [' ⊥ C'], ['n', 'sub'], ['?']], size: 28, dy: 17, op: ramp(t, tPerp - 0.3, tPerp + 0.5)},
          ]}
        />
        <Node {...R.D} w={216} kind="r" p={at(tD)} lit={lit4} flash={fl(tD)} ghost={ghost} color={C.gold} lines={[{parts: [['keluarga D']], size: 30}]} />
        <Node {...R.Cf} w={216} kind="r" p={at(tC)} flash={fl(tC)} ghost={ghost} color={C.cyan} lines={[{parts: [['keluarga C']], size: 30}]} />

        <Node {...N4} w={280} kind="q" p={at(tN4)} lit={lit5} flash={fl(tN4)} ghost={ghost} lines={[{parts: [['Bidang cermin?']]}]} />
        <Node {...R.h} w={300} kind="r" p={at(tH)} lit={lit5} flash={fl(tH)} ghost={ghost} color={C.cyan} lines={[{parts: [['σ'], ['h', 'sub'], ['  →  akhiran h']], size: 28}]} />
        <Node
          {...R.vd}
          w={380}
          kind="r"
          p={at(tVD)}
          flash={fl(tVD)}
          ghost={ghost}
          color={C.cyan}
          lines={[{parts: [['σ'], ['v', 'sub'], [' / σ'], ['d', 'sub'], ['  →  akhiran v / d']], size: 28}]}
        />

        {/* ===== molekul mini ===== */}
        <Render3D
          items={[
            ...mini(CO2, 1085, R.Dinf.y, 40, at(tCO2), 0.3),
            ...mini(HCL, 1085, R.Cinf.y, 44, at(tHCl), 1.2),
            ...mini(CH4, R.Td.x, 500, 30, at(tTd), 0.2, -0.3, 1.1),
            ...mini(SF6, R.Oh.x, 500, 24, at(tSF6), 0.6, -0.4, 1.1),
            ...c60Items({cx: R.Ih.x, cy: 500, s: 11.5, yaw: 0.4 * t, pitch: -0.4, persp: 9}, {opacity: at(tC60) * dimMini}),
          ]}
        />
        <Label x={1085} y={R.Dinf.y + 40} size={20} color={C.muted} opacity={at(tCO2) * dimMini}>
          CO₂ · ada i
        </Label>
        <Label x={1085} y={R.Cinf.y + 40} size={20} color={C.muted} opacity={at(tHCl) * dimMini}>
          HCl
        </Label>

        {/* ===== benzena ===== */}
        <Render3D items={bzItems} />
        <SyText x={BZ.x} y={topY - 62} parts={[['benzena']]} size={34} color={C.ink} opacity={bzIn} />
        <SyText x={BZ.x} y={topY - 26} parts={[['grup titik = ?']]} size={26} color={C.muted} opacity={bzIn * (1 - res)} />
        <SyText x={BZ.x + 72} y={topY + 22} parts={[['C'], ['6', 'sub']]} size={38} color={C.gold} anchor="start" font="serif" italic opacity={c6} />
        <SyText x={BZ.x + 215} y={BZ.y + 215} parts={[['6 C'], ['2', 'sub'], [' ⊥']]} size={32} color={C.gold} opacity={c2s(5)} />
        <SyText x={BZ.x - 215} y={BZ.y + 215} parts={[['σ'], ['h', 'sub']]} size={40} color={C.cyan} font="serif" italic opacity={sig} />
      </Stage>

      <Formula x={BZ.x} y={808} p={res} accent={C.gold} size={66}>
        <span style={{fontStyle: 'italic', color: C.gold}}>
          D<Sub>6h</Sub>
        </span>
      </Formula>
    </AbsoluteFill>
  );
};
