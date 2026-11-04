import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, ramp, slot} from '../anim';
import {Card, Formula, Glow, Label, Stage, Sub, V} from '../components/primitives';
import {type Cam, type V3, Render3D, SvgChem, VbDefs, proj} from '../components/vbC';
import {Stamp} from '../components/grupD';
import {type Mol, Ring, Tick, Vec, arrow3, axis3, bf3, bondMoment, ch4, co2, dipole, molItems3, plane3, water} from '../components/syD';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Bab 11: kepolaran dari simetri. Momen ikatan (amber) dan dipol (emas-amber tebal) selalu dari δ− ke δ+ (IUPAC).
const DIP = '#ffb066';

/** Pasangan (dari δ−, ke δ+) untuk setiap ikatan. */
const moments = (m: Mol): [V3, V3][] =>
  m.bonds.map((b) => {
    const A = m.atoms[b.a];
    const B = m.atoms[b.b];
    return (A.q ?? 0) < (B.q ?? 0) ? [A.pos, B.pos] : [B.pos, A.pos];
  });

/** Garam yang larut: kisi Na⁺/Cl⁻, ion lepas dikelilingi air yang berorientasi. */
const Salt: React.FC<{x: number; y: number; t: number; p: number}> = ({x, y, t, p}) => {
  const sp = 64;
  return (
    <g opacity={p}>
      <Glow x={x} y={y} r={220} color="cyan" opacity={0.12} />
      {Array.from({length: 16}, (_, k) => {
        const i = k % 4;
        const j = Math.floor(k / 4);
        const na = (i + j) % 2 === 0;
        const free = i === 3 && j % 2 === 0;
        const ph = (((t * 0.16 + j * 0.37) % 1) + 1) % 1;
        const dx = free ? 190 * ph : 0;
        const dy = free ? -60 * ph * (j - 1.5) * 0.5 : 0;
        const op = free ? cyc(ph) : 1;
        const cx = x - 150 + i * sp + dx;
        const cy = y - 96 + j * sp + dy;
        return (
          <g key={k} opacity={op}>
            <circle cx={cx} cy={cy} r={na ? 17 : 25} fill={na ? C.violet : '#4fdc7a'} />
            <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.sans} fontWeight={700} fontSize={na ? 20 : 24} fill="#0b1022">
              {na ? '+' : '−'}
            </text>
            {free
              ? [0, 1, 2, 3].map((w) => {
                  const a = (w * Math.PI) / 2 + t * 0.6;
                  const wx = cx + 46 * Math.cos(a);
                  const wy = cy + 46 * Math.sin(a);
                  // O (δ−) menghadap Na⁺, H (δ+) menghadap Cl⁻
                  const face = na ? a + Math.PI : a;
                  const hx = Math.cos(face + Math.PI);
                  const hy = Math.sin(face + Math.PI);
                  return (
                    <g key={w} opacity={ramp(ph, 0.15, 0.4)}>
                      <circle cx={wx + hx * 10 - hy * 8} cy={wy + hy * 10 + hx * 8} r={4.5} fill="#f2f5ff" />
                      <circle cx={wx + hx * 10 + hy * 8} cy={wy + hy * 10 - hx * 8} r={4.5} fill="#f2f5ff" />
                      <circle cx={wx} cy={wy} r={7.5} fill="#ff4d63" />
                    </g>
                  );
                })
              : null}
          </g>
        );
      })}
      <Label x={x} y={y + 200} size={34} color={C.cyan}>
        melarutkan garam
      </Label>
    </g>
  );
};

/** Pipa kapiler: air naik dengan meniskus cekung. */
const Capillary: React.FC<{x: number; y: number; t: number; p: number; rise: number}> = ({x, y, t, p, rise}) => {
  const surf = y + 120;
  const top = surf - 300 * rise;
  const w = 16;
  return (
    <g opacity={p}>
      <Glow x={x} y={y} r={220} color="cyan" opacity={0.12} />
      <rect x={x - 170} y={surf} width={340} height={80} rx={10} fill={C.cyan} fillOpacity={0.18} />
      <path d={`M${x - 180},${y} L${x - 180},${surf + 90} L${x + 180},${surf + 90} L${x + 180},${y}`} fill="none" stroke="#c9d3f2" strokeWidth={3} opacity={0.6} />
      <path d={`M${x - 170},${surf} Q${x},${surf + 3 * Math.sin(t * 2)} ${x + 170},${surf}`} fill="none" stroke={C.cyan} strokeWidth={2.5} />
      <rect x={x - w} y={top} width={2 * w} height={surf + 60 - top} fill={C.cyan} fillOpacity={0.45} />
      <path d={`M${x - w},${top - 8} Q${x},${top + 8} ${x + w},${top - 8}`} fill="none" stroke={C.cyan} strokeWidth={3} />
      <rect x={x - w - 4} y={y - 230} width={2 * w + 8} height={surf + 60 - (y - 230)} rx={4} fill="none" stroke="#dfe6ff" strokeWidth={3} opacity={0.75} />
      {[0, 1, 2].map((k) => {
        const ph = (((t * 0.35 + k / 3) % 1) + 1) % 1;
        return <circle key={k} cx={x + 3 * Math.sin(k * 2 + t)} cy={surf + 40 - ph * (surf + 40 - top)} r={3} fill="#fff" opacity={0.5 * cyc(ph) * rise} />;
      })}
      <Label x={x} y={y + 250} size={34} color={C.cyan}>
        naik di pipa kapiler
      </Label>
    </g>
  );
};

export const Polar: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();
  const out = 1 - ramp(t, dur - 0.9, dur - 0.1, EASE_IN_OUT);

  // ---- baris 0–1: air (kiri) & BF₃ (kanan) ----
  const partA = ramp(t, cue(0) - 0.6, cue(0) + 0.6) * (1 - ramp(t, cue(2) - 0.3, cue(2) + 0.5, EASE_IN_OUT));
  const delta = ramp(t, wordOf(0, 'dipol') - 0.2, wordOf(0, 'dipol') + 0.6);
  const muGrow = ramp(t, wordOf(0, 'dipol'), wordOf(0, 'dipol') + 1.2, BACK);
  const card0 = slot(t, wordOf(0, 'permanen') - 0.2, cue(1));
  const noCalc = ramp(t, wordOf(0, 'tanpa') - 0.2, wordOf(0, 'tanpa') + 0.5);
  const tAx = wordOf(1, 'sumbu');
  const tPl = wordOf(1, 'bidang');
  const tSk = wordOf(1, 'sekaligus');
  const ax = ramp(t, tAx - 0.3, tAx + 0.6);
  const pl = ramp(t, tPl - 0.3, tPl + 0.6);
  const bfIn = ramp(t, cue(1) + 0.2, cue(1) + 1.0);
  const trial = ramp(t, tAx, tAx + 0.8, BACK);
  const refl = ramp(t, tPl + 0.4, tPl + 1.4);
  const collapse = ramp(t, tSk, tSk + 1.0, EASE_IN_OUT);

  const camW: Cam = {cx: 560, cy: 500, s: 185, yaw: 0.35 + 0.22 * Math.sin(t * 0.35), pitch: -0.12, persp: 9};
  const w0 = water();
  const mu = dipole(w0);
  const muEnd: V3 = [0, 0, w0.atoms[0].pos[2] + mu[2] * 3 * muGrow];
  const camB: Cam = {cx: 1380, cy: 480, s: 150, yaw: t * 0.25, pitch: -0.5, persp: 9};
  const muB = 1.15 * trial * (1 - collapse);

  // ---- baris 2: kartu grup polar ----
  const card2 = slot(t, cue(2) + 0.2, cue(3));
  const chips = ramp(t, wordOf(2, 'atau') - 0.2, wordOf(2, 'atau') + 0.6);

  // ---- baris 3: tiga molekul nonpolar ----
  const partC = ramp(t, cue(3) - 0.2, cue(3) + 0.7) * (1 - ramp(t, cue(4) - 0.3, cue(4) + 0.4, EASE_IN_OUT));
  const tMen = wordOf(3, 'meniadakan');
  const tNon = wordOf(3, 'nonpolar');
  const gather = (k: number) => ramp(t, tMen - 0.6 + k * 0.18, tMen + 0.6 + k * 0.18, EASE_IN_OUT);
  const shrink = ramp(t, tNon - 0.5, tNon + 0.5, EASE_IN_OUT);
  const mols: {m: Mol; x: number; name: [string, ('sub' | 'sup')?][]; grp: [string, ('sub' | 'sup')?][]; cam: Cam; t0: number}[] = [
    {m: co2(), x: 400, name: [['CO'], ['2', 'sub']], grp: [['D'], ['∞h', 'sub']], cam: {cx: 400, cy: 380, s: 118, yaw: 0.25 * Math.sin(t * 0.4), pitch: -0.25, persp: 1000}, t0: wordOf(3, 'Karbon')},
    {m: bf3(), x: 960, name: [['BF'], ['3', 'sub']], grp: [['D'], ['3h', 'sub']], cam: {cx: 960, cy: 380, s: 112, yaw: t * 0.3, pitch: -0.75, persp: 1000}, t0: wordOf(3, 'boron')},
    {m: ch4(), x: 1520, name: [['CH'], ['4', 'sub']], grp: [['T'], ['d', 'sub']], cam: {cx: 1520, cy: 395, s: 112, yaw: t * 0.35, pitch: -0.3, persp: 1000}, t0: wordOf(3, 'metana')},
  ];

  // ---- baris 4: air polar + garam + kapiler ----
  const partD = ramp(t, cue(4) - 0.1, cue(4) + 0.7);
  const camD: Cam = {cx: 960, cy: 440, s: 185, yaw: 0.3 + 0.25 * Math.sin(t * 0.4), pitch: -0.12, persp: 9};
  const resP = ramp(t, wordOf(4, 'polar') - 0.3, wordOf(4, 'polar') + 0.8, BACK);
  const salt = ramp(t, wordOf(4, 'garam') - 0.5, wordOf(4, 'garam') + 0.4);
  const cap = ramp(t, wordOf(4, 'kapiler') - 0.5, wordOf(4, 'kapiler') + 0.4);
  const rise = ramp(t, wordOf(4, 'kapiler') - 0.2, wordOf(4, 'kapiler') + 2.6);

  const lbl = (cam: Cam, p: V3, dx: number, dy: number, txt: string, col: string, op: number) => {
    const q = proj(p, cam);
    return (
      <Label x={q.X + dx} y={q.Y + dy} size={40} color={col} font="serif" italic weight={600} opacity={op}>
        {txt}
      </Label>
    );
  };

  return (
    <AbsoluteFill style={{opacity: out}}>
      <Stage>
        <VbDefs />
        <Glow x={960} y={480} r={760} color="gold" opacity={0.05 + 0.02 * Math.sin(t * 0.8)} />

        {/* ===== air & BF₃ ===== */}
        <g opacity={partA}>
          <Glow x={camW.cx} y={camW.cy} r={300} color="red" opacity={0.12} />
          <Render3D
            items={[
              plane3(camW, {c: [0, 0, 0.15], u: [1, 0, 0], v: [0, 0, 1], w: 1.35, h: 1.25, opacity: pl}),
              plane3(camW, {c: [0, 0, 0.15], u: [0, 1, 0], v: [0, 0, 1], w: 1.1, h: 1.25, opacity: pl}),
              axis3(camW, {a: [0, 0, -1.25], b: [0, 0, 1.55], opacity: ax, t, label: 'C2'}),
              ...molItems3(camW, w0),
              arrow3(camW, {a: w0.atoms[0].pos, b: muEnd, color: DIP, width: 9, head: 30, opacity: Math.min(1, muGrow * 12), depth: -60}),
            ]}
          />
          {lbl(camW, w0.atoms[0].pos, -86, 46, 'δ−', C.red, delta)}
          {lbl(camW, w0.atoms[1].pos, -62, -52, 'δ+', C.blue, delta)}
          {lbl(camW, w0.atoms[2].pos, 62, -52, 'δ+', C.blue, delta)}
          <Label x={proj(muEnd, camW).X + 44} y={proj(muEnd, camW).Y + 10} size={40} color={DIP} font="serif" italic weight={600} opacity={muGrow}>
            μ
          </Label>
          <g opacity={ax}>
            <Tick x={camW.cx - 150} y={796} ok p={ramp(t, tAx + 0.3, tAx + 0.9)} />
            <Label x={camW.cx - 116} y={796} size={30} anchor="start" color={C.gold}>
              μ terletak pada sumbu C₂
            </Label>
          </g>
          <g opacity={pl}>
            <Tick x={camW.cx - 150} y={850} ok p={ramp(t, tPl + 0.3, tPl + 0.9)} />
            <Label x={camW.cx - 116} y={850} size={30} anchor="start" color={C.cyan}>
              …dan di kedua bidang σv
            </Label>
          </g>

          <g opacity={bfIn}>
            <Glow x={camB.cx} y={camB.cy} r={300} color="mint" opacity={0.1} />
            <Render3D
              items={[
                plane3(camB, {c: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0], w: 1.85, h: 1.85, opacity: pl, depth: 1.5}),
                axis3(camB, {a: [0, 0, -1.4], b: [0, 0, 1.6], opacity: ax, t, label: 'C3'}),
                ...molItems3(camB, bf3()),
                arrow3(camB, {a: [0, 0, 0.05], b: [0, 0, 0.05 + muB], color: DIP, width: 8, head: 26, opacity: Math.min(1, trial * 12), depth: -60}),
                arrow3(camB, {a: [0, 0, -0.05], b: [0, 0, -0.05 - muB * refl], color: C.red, width: 6, head: 22, opacity: refl * 0.85, depth: -59}),
              ]}
            />
            <Label x={camB.cx} y={170} size={34} weight={700} color={C.ink}>
              BF₃ (D₃h)
            </Label>
            <g opacity={ax * (1 - collapse)}>
              <Tick x={camB.cx - 190} y={796} ok p={ramp(t, tAx + 0.4, tAx + 1)} />
              <Label x={camB.cx - 156} y={796} size={30} anchor="start" color={C.gold}>
                pada C₃: μ harus tegak
              </Label>
            </g>
            <g opacity={refl * (1 - collapse)}>
              <Tick x={camB.cx - 190} y={850} ok={false} p={ramp(t, tPl + 0.8, tPl + 1.6)} />
              <Label x={camB.cx - 156} y={850} size={30} anchor="start" color={C.cyan}>
                σh membaliknya → bertentangan
              </Label>
            </g>
            <g opacity={collapse}>
              <Ring x={camB.cx} y={camB.cy} p={ramp(t, tSk + 0.8, tSk + 1.8)} color={C.red} r={120} />
              <Label x={camB.cx} y={738} size={44} weight={700} color={C.red}>
                satu-satunya jalan: μ = 0
              </Label>
            </g>
          </g>
        </g>

        {/* ===== tiga molekul nonpolar ===== */}
        <g opacity={partC}>
          {mols.map((M, mi) => {
            const appear = ramp(t, M.t0 - 0.4, M.t0 + 0.5);
            const mm = moments(M.m);
            const tr = 0.2;
            // vektor layar setiap momen ikatan
            const vecs = mm.map(([a, b]) => {
              const A = proj(a, M.cam);
              const B = proj(b, M.cam);
              const dx = B.X - A.X;
              const dy = B.Y - A.Y;
              return {x1: A.X + dx * tr, y1: A.Y + dy * tr, vx: dx * (1 - 2 * tr), vy: dy * (1 - 2 * tr)};
            });
            // rantai ujung-ke-pangkal, dipusatkan di bawah molekul
            const verts: [number, number][] = [[0, 0]];
            vecs.forEach((v) => verts.push([verts[verts.length - 1][0] + v.vx, verts[verts.length - 1][1] + v.vy]));
            const cxv = verts.slice(0, -1).reduce((s, p) => s + p[0], 0) / vecs.length;
            const cyv = verts.slice(0, -1).reduce((s, p) => s + p[1], 0) / vecs.length;
            const ox = M.x;
            const oy = 700;
            const k = 1 - shrink;
            return (
              <g key={mi} opacity={appear}>
                <Glow x={M.x} y={M.cam.cy} r={230} color="cyan" opacity={0.1} />
                <Render3D items={[...molItems3(M.cam, M.m), ...mm.map(([a, b]) => bondMoment(M.cam, {from: a, to: b, offset: 28, trim: tr, opacity: 0.35 + 0.65 * (1 - gather(0)), width: 6}))]} />
                <SvgChem x={M.x - 50} y={548} parts={M.name} size={40} />
                <SvgChem x={M.x + 50} y={548} parts={M.grp} size={36} font="serif" color={C.gold} weight={600} />
                <line x1={M.x - 150} y1={604} x2={M.x + 150} y2={604} stroke={C.faint} strokeWidth={1.5} opacity={gather(0)} />
                {vecs.map((v, i) => {
                  const g = gather(i);
                  if (g <= 0.001) return null;
                  const sx = ox + (verts[i][0] - cxv) * k + (i % 2) * 6 * (vecs.length === 2 ? 1 : 0);
                  const sy = oy + (verts[i][1] - cyv) * k + (i % 2) * 6 * (vecs.length === 2 ? 1 : 0);
                  const x1 = v.x1 + (sx - v.x1) * g;
                  const y1 = v.y1 + (sy - v.y1) * g;
                  return <Vec key={i} x1={x1} y1={y1} x2={x1 + v.vx * (g * k + (1 - g))} y2={y1 + v.vy * (g * k + (1 - g))} color={C.amber} width={5} head={18} opacity={Math.min(1, g * 3)} />;
                })}
                <Ring x={ox} y={oy} p={ramp(t, tNon + 0.3, tNon + 1.3)} color={C.mint} r={90} />
                <g opacity={shrink}>
                  <circle cx={ox} cy={oy} r={7} fill={C.mint} />
                  <Label x={ox} y={oy + 52} size={34} weight={700} color={C.mint}>
                    Σμ = 0
                  </Label>
                </g>
              </g>
            );
          })}
        </g>

        {/* ===== air polar ===== */}
        <g opacity={partD}>
          <Glow x={camD.cx} y={camD.cy} r={300} color="red" opacity={0.12} />
          {(() => {
            const items = [
              ...molItems3(camD, w0),
              ...moments(w0).map(([a, b]) => bondMoment(camD, {from: a, to: b, offset: 34, trim: 0.15, opacity: 0.9})),
              arrow3(camD, {a: w0.atoms[0].pos, b: [0, 0, w0.atoms[0].pos[2] + mu[2] * 3 * resP], color: DIP, width: 9, head: 30, opacity: Math.min(1, resP * 12), depth: -60}),
            ];
            return <Render3D items={items} />;
          })()}
          <Salt x={380} y={420} t={t} p={salt} />
          <Capillary x={1540} y={420} t={t} p={cap} rise={rise} />
        </g>
      </Stage>

      {/* kartu baris 0 */}
      <Formula x={1380} y={430} p={card0} accent={DIP} caption="momen dipol permanen">
        <V color={DIP}>μ</V> ≠ 0 ⇒ polar
      </Formula>
      <div style={{position: 'absolute', left: 1380, top: 600, transform: 'translateX(-50%)', opacity: noCalc * card0, fontFamily: FONT.sans, fontSize: 32, color: C.gold, whiteSpace: 'nowrap'}}>
        cukup lihat simetrinya — tanpa hitungan
      </div>

      {/* kartu baris 2 */}
      <Formula x={960} y={380} p={card2} accent={C.mint} size={72} caption="grup lain apa pun → μ = 0">
        polar hanya: <V color={C.mint}>C</V>
        <Sub color={C.mint}>
          <i>n</i>
        </Sub>
        {'  ·  '}
        <V color={C.mint}>C</V>
        <Sub color={C.mint}>
          <i>n</i>v
        </Sub>
        {'  ·  '}
        <V color={C.mint}>C</V>
        <Sub color={C.mint}>s</Sub>
      </Formula>
      <div style={{position: 'absolute', left: 960, top: 600, transform: 'translateX(-50%)', display: 'flex', gap: 28, opacity: chips * card2}}>
        {[
          {g: <>C<Sub>2v</Sub></>, m: <>H<Sub>2</Sub>O</>, ok: true},
          {g: <>C<Sub>3v</Sub></>, m: <>NH<Sub>3</Sub></>, ok: true},
          {g: <>C<Sub>1</Sub></>, m: <>CHFClBr</>, ok: true},
          {g: <>D<Sub>3h</Sub> · T<Sub>d</Sub> · D<Sub>∞h</Sub></>, m: <>nonpolar</>, ok: false},
        ].map((c, i) => (
          <Card key={i} x={0} y={0} accent={c.ok ? C.mint : C.red} style={{position: 'relative', left: 0, top: 0, transform: `translateY(${(1 - ramp(chips, i * 0.15, i * 0.15 + 0.5)) * 20}px)`, padding: '14px 26px', fontSize: 38}}>
            <span style={{fontFamily: FONT.serif, fontStyle: 'italic', color: c.ok ? C.mint : C.red}}>{c.g}</span>
            <span style={{color: C.muted}}> · </span>
            {c.m}
          </Card>
        ))}
      </div>

      <Stamp x={960} y={760} p={resP * partD} text="POLAR" color={C.gold} rot={-6} size={44} sub={<>C<Sub>2v</Sub> · μ di sumbu C<Sub>2</Sub></>} />
    </AbsoluteFill>
  );
};

