import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, ramp, slot} from '../anim';
import {Formula, Glow, Label, Stage, V} from '../components/primitives';
import {Stamp} from '../components/grupD';
import {type Cam, type V3, Render3D, SvgChem, VbDefs, add, mul, proj, sub} from '../components/vbC';
import {CmInv, IRSpectrum, Tick, type WaterMode, arrow3, co2, co2Mode, dipole, molItems3, vibrate, water, waterMode} from '../components/syD';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Bab 12: getaran yang aktif inframerah. H₂O: ν₁ 3657, ν₂ 1595, ν₃ 3756 cm⁻¹ (gas, NIST).
const DIP = '#ffb066';
const MODES: {kind: WaterMode; name: string; nu: number; sym: string; dir: string; col: string; f: number; amp: number; depth: number; idx: string}[] = [
  {kind: 'sym', name: 'regangan simetris', nu: 3657, sym: 'A₁', dir: 'z', col: C.cyan, f: 0.85, amp: 0.13, depth: 0.32, idx: '1'},
  {kind: 'bend', name: 'tekukan', nu: 1595, sym: 'A₁', dir: 'z', col: C.mint, f: 0.5, amp: 0.13, depth: 0.62, idx: '2'},
  {kind: 'asym', name: 'regangan asimetris', nu: 3756, sym: 'B₂', dir: 'y', col: C.blue, f: 0.9, amp: 0.13, depth: 0.78, idx: '3'},
];
const PX = [380, 960, 1540];
const PY = 375;

export const Infrared: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();
  const out = 1 - ramp(t, dur - 0.9, dur - 0.1, EASE_IN_OUT);

  // baris 0: rumus jumlah getaran
  const card0 = slot(t, cue(0) - 0.2, cue(1) - 0.1);
  const lin = ramp(t, wordOf(0, 'linear', 1) - 0.3, wordOf(0, 'linear', 1) + 0.5);
  const ex0 = ramp(t, wordOf(0, 'enam') - 0.2, wordOf(0, 'enam') + 0.6) * (1 - ramp(t, cue(1) - 0.5, cue(1) + 0.1, EASE_IN_OUT));

  // baris 1–3a: tiga panel getaran air + spektrum
  const tMode = [wordOf(1, 'simetris', 0), wordOf(1, 'tekukan'), wordOf(1, 'asimetris')];
  const panelsOut = 1 - ramp(t, wordOf(3, 'inversi') - 0.6, wordOf(3, 'inversi') + 0.2, EASE_IN_OUT);
  const panel = tMode.map((a) => ramp(t, a - 0.5, a + 0.4) * panelsOut);
  const specIn = ramp(t, cue(1) - 0.2, cue(1) + 0.5) * panelsOut;
  const draw = ramp(t, cue(1), cue(1) + 2.6, EASE_IN_OUT);
  const tDip = wordOf(2, 'dipol');
  const pulse = ramp(t, tDip - 0.2, tDip + 0.5) * (1 - ramp(t, cue(3), cue(3) + 0.8));
  const tSym = wordOf(2, 'simetri');
  const symTag = ramp(t, tSym - 0.2, tSym + 0.6);
  const card2 = slot(t, wordOf(2, 'baris') - 0.3, cue(3));
  const active = ramp(t, wordOf(3, 'Ketiga') - 0.1, wordOf(3, 'Ketiga') + 0.6);

  // baris 3b: CO₂ berpusat inversi, IR | Raman
  const tInv = wordOf(3, 'inversi');
  const partB = ramp(t, tInv - 0.1, tInv + 0.7);
  const rowAt = (k: number) => ramp(t, tInv + 0.6 + k * 0.35, tInv + 1.2 + k * 0.35);
  const stamp = ramp(t, wordOf(3, 'meniadakan') - 0.4, wordOf(3, 'meniadakan') + 0.3, BACK);

  const w0 = water();
  const mu0 = dipole(w0);

  return (
    <AbsoluteFill style={{opacity: out}}>
      <Stage>
        <VbDefs />
        <Glow x={960} y={460} r={780} color="cyan" opacity={0.05 + 0.02 * Math.sin(t * 0.7)} />

        {/* contoh baris 0: H₂O → 3, CO₂ → 4 */}
        <g opacity={ex0}>
          {(() => {
            const camA: Cam = {cx: 640, cy: 640, s: 120, yaw: 0.3 + 0.4 * Math.sin(t * 0.4), pitch: -0.15, persp: 9};
            const camB: Cam = {cx: 1280, cy: 640, s: 110, yaw: 0.4 * Math.sin(t * 0.35) + 0.3, pitch: -0.3, persp: 9};
            return (
              <>
                <Render3D items={molItems3(camA, vibrate(w0, waterMode('sym'), 0.06, t * 2 * Math.PI * 0.6))} />
                <Render3D items={molItems3(camB, vibrate(co2(), co2Mode('asym'), 0.08, t * 2 * Math.PI * 0.6))} opacity={lin} />
                <Label x={640} y={800} size={36} font="mono" color={C.ink}>
                  3·3 − 6 = 3
                </Label>
                <Label x={1280} y={800} size={36} font="mono" color={C.ink} opacity={lin}>
                  3·3 − 5 = 4
                </Label>
                <SvgChem x={640} y={500} parts={[['H'], ['2', 'sub'], ['O  · tak linear']]} size={32} color={C.muted} />
                <SvgChem x={1280} y={500} parts={[['CO'], ['2', 'sub'], ['  · linear']]} size={32} color={C.muted} opacity={lin} />
              </>
            );
          })()}
        </g>

        {/* tiga panel mode getaran air */}
        {MODES.map((M, i) => {
          const op = panel[i];
          if (op <= 0.003) return null;
          const cx = PX[i];
          const cam: Cam = {cx, cy: PY, s: 150, yaw: 0.28 + 0.12 * Math.sin(t * 0.3 + i), pitch: -0.1, persp: 9};
          const ph = t * 2 * Math.PI * M.f;
          const m = vibrate(w0, waterMode(M.kind), M.amp, ph);
          const mu = dipole(m);
          // tampilan dipol: perubahan diperbesar 2,5× agar terlihat (skematis)
          const show: V3 = add(mu0, mul(sub(mu, mu0), 2.5));
          const base = w0.atoms[0].pos;
          const k = 2.4;
          const glow = 0.5 + 0.5 * Math.sin(ph);
          return (
            <g key={i} opacity={op}>
              <rect x={cx - 270} y={170} width={540} height={430} rx={22} fill="rgba(10,15,34,0.6)" stroke={M.col} strokeOpacity={0.35 + 0.35 * pulse * glow} strokeWidth={2.5} />
              <Glow x={cx} y={PY} r={190} color="cyan" opacity={0.08 + 0.08 * pulse * glow} />
              <Render3D
                items={[
                  arrow3(cam, {a: base, b: add(base, mul(mu0, k)), color: DIP, width: 3, head: 14, opacity: 0.3, depth: -55}),
                  ...molItems3(cam, m),
                  arrow3(cam, {a: base, b: add(base, mul(show, k)), color: DIP, width: 7 + 3 * pulse, head: 24, depth: -60}),
                ]}
              />
              <Label x={cx - 250} y={200} size={22} anchor="start" color={C.muted} font="mono">
                gerak lambat
              </Label>
              <g opacity={symTag}>
                <rect x={cx + 120} y={184} width={136} height={38} rx={19} fill={`${M.col}22`} stroke={M.col} strokeWidth={2} />
                <Label x={cx + 188} y={203} size={24} color={M.col} weight={700}>
                  {M.sym} ∼ {M.dir}
                </Label>
              </g>
              <Label x={cx} y={515} size={32} color={M.col} weight={700}>
                {M.name}
              </Label>
              <text x={cx} y={560} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.mono} fontSize={30} fill={C.ink}>
                <tspan fontFamily={FONT.serif} fontStyle="italic">
                  ν
                </tspan>
                <tspan baselineShift="sub" fontSize={20}>
                  {M.idx}
                </tspan>
                {`  ${M.nu} `}
                <CmInv size={30} />
              </text>
              <g opacity={active}>
                <Tick x={cx + 210} y={455} ok p={ramp(t, wordOf(3, 'Ketiga') + i * 0.25, wordOf(3, 'Ketiga') + 0.6 + i * 0.25)} />
                <Label x={cx + 210} y={415} size={22} color={C.mint} weight={700}>
                  aktif IR
                </Label>
              </g>
            </g>
          );
        })}

        {/* spektrum IR air (gas) */}
        <g opacity={specIn * (1 - 0.85 * card2)}>
          <IRSpectrum
            x={260}
            y={650}
            w={1400}
            h={180}
            t={t}
            draw={draw}
            peaks={MODES.map((M, i) => ({nu: M.nu, depth: M.depth, width: 34, p: ramp(t, tMode[i] - 0.1, tMode[i] + 0.9)}))}
          />
          {MODES.map((M, i) => {
            const X = 260 + ((4000 - M.nu) / 3000) * 1400;
            const p = ramp(t, tMode[i] + 0.3, tMode[i] + 1.0);
            const yb = 650 + 14 + 152 * M.depth;
            return (
              <text key={i} x={X + (i === 0 ? 30 : i === 2 ? -30 : 0)} y={yb + 30} textAnchor="middle" fontFamily={FONT.serif} fontStyle="italic" fontSize={28} fill={M.col} opacity={p}>
                ν
                <tspan baselineShift="sub" fontSize={18}>
                  {M.idx}
                </tspan>
              </text>
            );
          })}
          <text x={1700} y={850} fontFamily={FONT.mono} fontSize={20} fill={C.muted}>
            <tspan fontFamily={FONT.serif} fontStyle="italic">
              ν̃
            </tspan>{' '}
            / <CmInv size={20} />
          </text>
          <Label x={250} y={628} size={22} anchor="start" color={C.muted} font="mono">
            spektrum IR uap air (serapan ke bawah)
          </Label>
        </g>

        {/* CO₂: IR | Raman */}
        <g opacity={partB}>
          {(() => {
            const cam: Cam = {cx: 470, cy: 430, s: 150, yaw: 0.35 * Math.sin(t * 0.35) + 0.25, pitch: -0.35, persp: 9};
            const m = co2();
            const c = proj([0, 0, 0], cam);
            const L1 = proj([-1.9, 0, 0], cam);
            const L2 = proj([1.9, 0, 0], cam);
            return (
              <>
                <Glow x={470} y={430} r={280} color="red" opacity={0.1} />
                <line x1={L1.X} y1={L1.Y} x2={L2.X} y2={L2.Y} stroke={C.pink} strokeWidth={2.5} strokeDasharray="8 8" opacity={0.7} />
                <Render3D items={molItems3(cam, m)} />
                <circle cx={c.X} cy={c.Y} r={9 + 2 * Math.sin(t * 3)} fill={C.pink} />
                <circle cx={c.X} cy={c.Y} r={26 + 6 * Math.sin(t * 3)} fill="none" stroke={C.pink} strokeWidth={2} opacity={0.5} />
                <text x={c.X + 24} y={c.Y - 70} fontFamily={FONT.serif} fontStyle="italic" fontWeight={600} fontSize={40} fill={C.pink}>
                  i
                </text>
                <SvgChem x={470} y={640} parts={[['CO'], ['2', 'sub'], ['  (D'], ['∞h', 'sub'], [')']]} size={38} />
                <Label x={470} y={690} size={28} color={C.pink}>
                  berpusat inversi
                </Label>
              </>
            );
          })()}
          {/* tabel */}
          <g>
            <Label x={1300} y={250} size={34} weight={700} color={C.amber}>
              IR
            </Label>
            <Label x={1540} y={250} size={34} weight={700} color={C.violet}>
              Raman
            </Label>
            <line x1={830} y1={282} x2={1660} y2={282} stroke={C.faint} strokeWidth={2} />
            <line x1={1420} y1={225} x2={1420} y2={720} stroke={C.faint} strokeWidth={2} />
            {[
              {name: 'regangan simetris', nu: '1388', ir: false, ra: true, mode: 'sym' as const},
              {name: 'tekukan (×2)', nu: '667', ir: true, ra: false, mode: 'bendZ' as const},
              {name: 'regangan asimetris', nu: '2349', ir: true, ra: false, mode: 'asym' as const},
            ].map((r, k) => {
              const y = 360 + k * 130;
              const p = rowAt(k);
              const cam: Cam = {cx: 900, cy: y, s: 46, yaw: 0, pitch: 0, persp: 50};
              return (
                <g key={k} opacity={p} transform={`translate(${(1 - p) * 30} 0)`}>
                  <Render3D items={molItems3(cam, vibrate(co2(), co2Mode(r.mode), 0.22, t * 2 * Math.PI * 0.8), {labels: false})} />
                  <Label x={980} y={y - 16} size={28} anchor="start" color={C.ink}>
                    {r.name}
                  </Label>
                  <text x={980} y={y + 22} dominantBaseline="central" fontFamily={FONT.mono} fontSize={22} fill={C.muted}>
                    {r.nu === '1388' ? '≈ ' : ''}
                    {r.nu} <CmInv size={22} />
                  </text>
                  <Tick x={1300} y={y} ok={r.ir} s={30} p={ramp(t, wordOf(3, 'Raman') + k * 0.45, wordOf(3, 'Raman') + 0.6 + k * 0.45)} />
                  <Tick x={1540} y={y} ok={r.ra} s={30} p={ramp(t, wordOf(3, 'Raman') + 0.2 + k * 0.45, wordOf(3, 'Raman') + 0.8 + k * 0.45)} />
                </g>
              );
            })}
          </g>
        </g>
      </Stage>

      <Formula x={960} y={300} p={card0} size={66} accent={C.gold} caption="jumlah getaran molekul dengan N atom">
        3<V>N</V> − 6 <span style={{fontSize: '0.5em', color: C.muted, fontFamily: FONT.sans}}>(tak linear)</span>
        <span style={{opacity: lin}}>
          {'   ·   '}3<V>N</V> − 5 <span style={{fontSize: '0.5em', color: C.muted, fontFamily: FONT.sans}}>(linear)</span>
        </span>
      </Formula>

      <Formula x={960} y={745} p={card2} size={56} accent={C.mint} caption="getaran ikut baris x, y, atau z → mengubah dipol → menyerap IR">
        aktif IR ⇔ simetri sama dengan <V color={C.mint}>x</V>, <V color={C.mint}>y</V>, <V color={C.mint}>z</V>
      </Formula>

      <Stamp x={1245} y={800} p={stamp * partB} text="SALING MENIADAKAN" color={C.pink} rot={-4} size={38} sub={<>berpusat inversi: aktif IR ⇒ tak aktif Raman</>} />
    </AbsoluteFill>
  );
};
