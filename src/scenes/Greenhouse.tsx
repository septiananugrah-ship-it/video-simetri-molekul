import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, ramp, rand} from '../anim';
import {Glow, Label, Stage} from '../components/primitives';
import {PhotonPacket} from '../components/viz';
import {type Cam, type V3, Render3D, SvgChem, VbDefs, mul, proj} from '../components/vbC';
import {type CO2Mode, CmInv, Tick, Vec, arrow3, co2, co2Mode, diatomic, dipole, molItems3, vibrate, water} from '../components/syD';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Bab 13: mengapa CO₂ gas rumah kaca. ν₁ ≈ 1388 (Raman saja), ν₃ 2349 & ν₂ 667 (×2) aktif IR (NIST).
const DIP = '#ffb066';
const IRC = '#ff6a3d';
const PANELS: {mode: CO2Mode; name: string; nu: string; ir: boolean; f: number; amp: number}[] = [
  {mode: 'sym', name: 'regangan simetris', nu: '≈ 1388', ir: false, f: 0.8, amp: 0.13},
  {mode: 'asym', name: 'regangan asimetris', nu: '2349', ir: true, f: 0.9, amp: 0.07},
  {mode: 'bendZ', name: 'tekukan', nu: '667', ir: true, f: 0.5, amp: 0.06},
  {mode: 'bendY', name: 'tekukan', nu: '667', ir: true, f: 0.5, amp: 0.06},
];
const PX = [290, 723, 1157, 1590];

// pancaran termal Bumi (Planck, ≈ 288 K) per bilangan gelombang, dinormalisasi
const planck = (nu: number) => (nu <= 0 ? 0 : nu ** 3 / (Math.exp((1.4388 * nu) / 288) - 1));
const PMAX = planck(565);

/** Atmosfer skematis: molekul melayang. */
const AIR: {el: 'N2' | 'O2' | 'CO2' | 'H2O'; x: number; y: number}[] = [
  {el: 'N2', x: 170, y: 330},
  {el: 'O2', x: 340, y: 470},
  {el: 'N2', x: 470, y: 300},
  {el: 'CO2', x: 300, y: 610},
  {el: 'N2', x: 610, y: 430},
  {el: 'O2', x: 770, y: 320},
  {el: 'H2O', x: 880, y: 500},
  {el: 'N2', x: 170, y: 560},
  {el: 'CO2', x: 640, y: 590},
  {el: 'O2', x: 500, y: 700},
  {el: 'N2', x: 900, y: 680},
  {el: 'O2', x: 330, y: 270},
];
const LANES = [150, 240, 300, 400, 500, 560, 640, 730, 830, 880, 950];

export const Greenhouse: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();
  const out = 1 - ramp(t, dur - 0.9, dur - 0.1, EASE_IN_OUT);

  // ---- bagian A: empat mode CO₂ ----
  const partA = 1 - ramp(t, cue(3) - 0.4, cue(3) + 0.4, EASE_IN_OUT);
  const tIn = [wordOf(0, 'simetris', 0), wordOf(0, 'asimetris'), wordOf(0, 'dua'), wordOf(0, 'dua') + 0.5];
  const focus1 = ramp(t, cue(1) - 0.2, cue(1) + 0.5) * (1 - ramp(t, cue(2) - 0.3, cue(2) + 0.3));
  const focus2 = ramp(t, cue(2) - 0.2, cue(2) + 0.5);
  const tRaman = wordOf(1, 'Raman');
  const tAbs = wordOf(2, 'menyerap');
  const badge = (i: number) => (i === 0 ? ramp(t, tRaman - 0.3, tRaman + 0.5) : ramp(t, tAbs - 0.3 + (i - 1) * 0.2, tAbs + 0.4 + (i - 1) * 0.2));
  const noDip = ramp(t, wordOf(1, 'dipol') - 0.2, wordOf(1, 'dipol') + 0.5);
  const yesDip = ramp(t, wordOf(2, 'dipol') - 0.2, wordOf(2, 'dipol') + 0.5);

  // ---- bagian B: Bumi & atmosfer ----
  const partB = ramp(t, cue(3) - 0.1, cue(3) + 0.8);
  const spec = ramp(t, cue(3) + 0.2, cue(3) + 2.2, EASE_IN_OUT);
  const band = ramp(t, wordOf(3, 'memancarkan') - 0.3, wordOf(3, 'memancarkan') + 0.6);
  const n2 = ramp(t, wordOf(4, 'Nitrogen') - 0.4, wordOf(4, 'Nitrogen') + 0.5);
  const n2tag = ramp(t, wordOf(4, 'hingga') - 0.3, wordOf(4, 'hingga') + 0.5);
  const ghg = ramp(t, wordOf(4, 'karbon') - 0.4, wordOf(4, 'karbon') + 0.5);
  const h2o = ramp(t, wordOf(4, 'uap') - 0.4, wordOf(4, 'uap') + 0.5);
  const hold = ramp(t, wordOf(4, 'menahan') - 0.3, wordOf(4, 'menahan') + 0.6, BACK);
  const absorbOn = ghg;

  const absorbers = AIR.filter((a) => a.el === 'CO2' || a.el === 'H2O');

  return (
    <AbsoluteFill style={{opacity: out}}>
      <Stage>
        <VbDefs />
        <Glow x={960} y={470} r={780} color="red" opacity={0.05 + 0.02 * Math.sin(t * 0.7)} />

        {/* ===== empat mode ===== */}
        <g opacity={partA}>
          {PANELS.map((P, i) => {
            const appear = ramp(t, tIn[i] - 0.5, tIn[i] + 0.4);
            const dim = i === 0 ? 1 - 0.55 * focus2 : 1 - 0.55 * focus1;
            const hot = i === 0 ? focus1 : focus2;
            const cx = PX[i];
            const cam: Cam = {cx, cy: 360, s: 100, yaw: 0.42 + 0.1 * Math.sin(t * 0.3 + i), pitch: -0.32, persp: 9};
            const ph = t * 2 * Math.PI * P.f;
            const m = vibrate(co2(), co2Mode(P.mode), P.amp, ph);
            const mu = dipole(m);
            const k = 4.2;
            const c0: V3 = [0, 0, 0];
            return (
              <g key={i} opacity={appear * dim}>
                <rect x={cx - 200} y={170} width={400} height={450} rx={22} fill="rgba(12,16,34,0.62)" stroke={P.ir ? IRC : C.violet} strokeOpacity={0.3 + 0.5 * hot} strokeWidth={2.5} />
                <Label x={cx - 182} y={198} size={20} anchor="start" color={C.muted} font="mono">
                  gerak lambat
                </Label>
                {P.mode === 'bendY' ? (
                  <Label x={cx + 182} y={198} size={20} anchor="end" color={C.muted} font="mono">
                    ⊥ bidang layar
                  </Label>
                ) : null}
                <Render3D items={[...molItems3(cam, m), arrow3(cam, {a: c0, b: mul(mu, k), color: DIP, width: 7, head: 22, depth: -60})]} />
                {P.ir ? null : (
                  <g>
                    <circle cx={proj(c0, cam).X} cy={proj(c0, cam).Y} r={8} fill={DIP} opacity={0.9} />
                  </g>
                )}
                <g opacity={P.ir ? yesDip : noDip}>
                  <Label x={cx} y={460} size={26} color={DIP} weight={600}>
                    {P.ir ? 'μ berosilasi' : 'μ = 0 (tetap)'}
                  </Label>
                </g>
                <Label x={cx} y={520} size={30} color={C.ink} weight={700}>
                  {P.name}
                </Label>
                <text x={cx} y={562} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.mono} fontSize={28} fill={C.muted}>
                  {P.nu} <CmInv size={28} />
                </text>
                <g opacity={badge(i)}>
                  <Tick x={cx - 120} y={668} ok={P.ir} s={28} p={badge(i)} />
                  <Label x={cx - 88} y={668} size={28} anchor="start" color={P.ir ? IRC : C.violet} weight={700}>
                    {P.ir ? 'menyerap IR' : 'hanya Raman'}
                  </Label>
                </g>
              </g>
            );
          })}
          <g opacity={ramp(t, wordOf(0, 'empat') - 0.2, wordOf(0, 'empat') + 0.6) * (1 - ramp(t, cue(1) - 0.4, cue(1) + 0.2, EASE_IN_OUT))}>
            <Label x={960} y={790} size={40} color={C.ink} font="mono">
              linear: 3N − 5 = 3·3 − 5 = 4 getaran
            </Label>
          </g>
          <g opacity={focus1}>
            <Label x={960} y={790} size={34} color={C.violet} weight={600}>
              kedua O bergerak berlawanan → dipol tetap nol → tak menyerap inframerah
            </Label>
          </g>
          <g opacity={focus2}>
            <Label x={960} y={790} size={34} color={IRC} weight={600}>
              C bergeser terhadap kedua O → dipol berubah → menyerap inframerah
            </Label>
          </g>
        </g>

        {/* ===== Bumi & atmosfer ===== */}
        <g opacity={partB}>
          {/* Bumi */}
          <defs>
            <clipPath id="gh-earth">
              <rect x={0} y={0} width={1920} height={896} />
            </clipPath>
          </defs>
          <g clipPath="url(#gh-earth)">
            <circle cx={540} cy={1900} r={1130} fill="url(#soft-red)" opacity={0.5} />
            <circle cx={540} cy={1900} r={1100} fill="#14294d" stroke="#3f7ad6" strokeWidth={4} />
            <circle cx={540} cy={1900} r={1100} fill="none" stroke={IRC} strokeWidth={10} opacity={0.25 + 0.1 * Math.sin(t * 2)} />
          </g>
          <Label x={540} y={850} size={30} color="#9cc1ff" weight={600}>
            Bumi
          </Label>
          {/* paket inframerah naik */}
          {LANES.map((x, k) => {
            const per = 2.8 + 0.6 * rand(k);
            const ph = (((t / per + rand(k * 3.3)) % 1) + 1) % 1;
            const hit = absorbers.find((a) => Math.abs(a.x - x) < 30);
            const y0 = 790;
            const yy = y0 - ph * (y0 - 220);
            const blocked = hit ? absorbOn * Math.max(0, Math.min(1, (hit.y + 70 - yy) / 45)) : 0;
            const op = cyc(ph) * (1 - blocked) * spec;
            return <PhotonPacket key={k} x={x} y={yy} wavelength={26} color={IRC} amp={11} len={90} angle={90} opacity={op * 0.9} phase={-t * 8} />;
          })}
          {/* molekul udara */}
          {AIR.map((a, k) => {
            const isG = a.el === 'CO2' || a.el === 'H2O';
            const op = isG ? (a.el === 'CO2' ? ghg : h2o) : n2;
            if (op <= 0.003) return null;
            const bob = 8 * Math.sin(t * 0.8 + k);
            const cam: Cam = {cx: a.x, cy: a.y + bob, s: isG ? 52 : 44, yaw: t * (0.3 + 0.2 * rand(k)) + k, pitch: -0.4 + 0.3 * Math.sin(t * 0.3 + k), persp: 9};
            const m = a.el === 'N2' ? diatomic('N') : a.el === 'O2' ? diatomic('O') : a.el === 'CO2' ? vibrate(co2(), co2Mode('bendZ'), 0.08, t * 6) : water();
            // serap → menyala, lalu pancarkan kembali (sebagian ke bawah)
            const per = 2.6;
            const ph = (((t / per + rand(k * 1.7)) % 1) + 1) % 1;
            const lit = isG ? absorbOn * cyc(ph) : 0;
            return (
              <g key={k} opacity={op}>
                {isG ? <circle cx={a.x} cy={a.y + bob} r={60 + 20 * lit} fill="url(#soft-gold)" opacity={0.25 + 0.6 * lit} /> : null}
                <Render3D items={molItems3(cam, m, {labels: false})} />
                {isG
                  ? [0, 1].map((j) => {
                      const ang = j === 0 ? 90 + 40 * (rand(k + 5) - 0.5) : -90 + 70 * (rand(k + 9) - 0.5) + (j === 1 && k % 2 ? 150 : 0);
                      const q = (ph + j * 0.5) % 1;
                      const d = 40 + q * 170;
                      const rad = (ang * Math.PI) / 180;
                      return (
                        <PhotonPacket key={j} x={a.x + d * Math.cos(rad)} y={a.y + bob + d * Math.sin(rad)} wavelength={24} color={IRC} amp={9} len={70} angle={ang} opacity={absorbOn * cyc(q) * 0.85} phase={-t * 8} />
                      );
                    })
                  : null}
              </g>
            );
          })}
          <g opacity={n2tag}>
            <rect x={150} y={176} width={560} height={52} rx={26} fill="rgba(10,14,30,0.85)" stroke={C.muted} strokeWidth={2} />
            <SvgChem x={430} y={202} parts={[['N'], ['2', 'sub'], [', O'], ['2', 'sub'], [' (D'], ['∞h', 'sub'], [') — IR lewat begitu saja']]} size={28} color={C.ink} />
          </g>
          <g opacity={ghg}>
            <SvgChem x={300} y={678} parts={[['CO'], ['2', 'sub']]} size={26} color={C.gold} />
            <SvgChem x={640} y={658} parts={[['CO'], ['2', 'sub']]} size={26} color={C.gold} />
          </g>
          <g opacity={h2o}>
            <SvgChem x={880} y={568} parts={[['H'], ['2', 'sub'], ['O']]} size={26} color={C.gold} />
          </g>
          {/* panah "kembali ke bawah" */}
          <g opacity={hold}>
            <Vec x1={1030} y1={300} x2={1030} y2={780} color={IRC} width={6} head={24} />
            <Label x={1470} y={815} size={42} color={C.gold} weight={700}>
              menahan panas Bumi
            </Label>
          </g>

          {/* spektrum pancaran termal Bumi */}
          {(() => {
            const bx = 1130;
            const by = 220;
            const bw = 680;
            const bh = 400;
            const X = (nu: number) => bx + (nu / 2000) * bw;
            const Y = (v: number) => by + bh - v * (bh - 40);
            const N = 200;
            const nShow = Math.round(N * spec);
            const bite = (nu: number) => 1 - 0.62 * hold * Math.exp(-(((nu - 667) / 70) ** 2));
            const pts: string[] = [];
            for (let i = 0; i <= nShow; i++) {
              const nu = (2000 * i) / N;
              pts.push(`${i ? 'L' : 'M'}${X(nu).toFixed(1)},${Y((planck(nu) / PMAX) * bite(nu)).toFixed(1)}`);
            }
            const area = pts.length > 1 ? `${pts.join(' ')} L${X((2000 * nShow) / N).toFixed(1)},${by + bh} L${bx},${by + bh} Z` : '';
            const camB: Cam = {cx: X(667), cy: by + 70, s: 34, yaw: 0, pitch: 0, persp: 60};
            return (
              <g>
                <rect x={bx - 30} y={by - 40} width={bw + 60} height={bh + 110} rx={18} fill="rgba(8,12,28,0.75)" stroke={C.faint} strokeWidth={1.5} />
                <Label x={bx} y={by - 12} size={24} anchor="start" color={C.muted} font="mono">
                  pancaran inframerah Bumi (skematis)
                </Label>
                <rect x={X(667) - 26} y={by + 10} width={52} height={bh - 10} fill={C.gold} opacity={0.14 * band + 0.06 * band * Math.sin(t * 3)} />
                {area ? <path d={area} fill={IRC} opacity={0.22} /> : null}
                {pts.length > 1 ? <path d={pts.join(' ')} fill="none" stroke={IRC} strokeWidth={3.5} strokeLinejoin="round" /> : null}
                <line x1={bx} y1={by + bh} x2={bx + bw} y2={by + bh} stroke={C.muted} strokeWidth={2} />
                {[0, 500, 1000, 1500, 2000].map((v) => (
                  <g key={v}>
                    <line x1={X(v)} y1={by + bh} x2={X(v)} y2={by + bh + 8} stroke={C.muted} strokeWidth={2} />
                    <text x={X(v)} y={by + bh + 30} textAnchor="middle" fontFamily={FONT.mono} fontSize={19} fill={C.muted}>
                      {v}
                    </text>
                  </g>
                ))}
                <text x={bx + bw} y={by + bh + 58} textAnchor="end" fontFamily={FONT.mono} fontSize={20} fill={C.muted}>
                  <tspan fontFamily={FONT.serif} fontStyle="italic">
                    ν̃
                  </tspan>{' '}
                  / <CmInv size={20} />
                </text>
                <g opacity={band}>
                  <Render3D items={molItems3(camB, vibrate(co2(), co2Mode('bendZ'), 0.1, t * 5), {labels: false})} />
                  <text x={X(667) + 60} y={by + 64} fontFamily={FONT.mono} fontSize={24} fill={C.gold}>
                    667 <CmInv size={24} />
                  </text>
                  <text x={X(667) + 60} y={by + 96} fontFamily={FONT.mono} fontSize={24} fill={C.gold}>
                    ≈ 15 µm
                  </text>
                </g>
                <g opacity={hold}>
                  <Label x={X(667) + 60} y={by + 150} size={24} anchor="start" color={C.gold} weight={600}>
                    diserap CO₂
                  </Label>
                </g>
              </g>
            );
          })()}
        </g>
      </Stage>
    </AbsoluteFill>
  );
};

