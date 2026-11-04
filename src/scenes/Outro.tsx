import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, cyc, rand, ramp} from '../anim';
import {Glow, Stage} from '../components/primitives';
import {type Cam, Render3D, VbDefs} from '../components/vbC';
import {PGBadge, axis3, bf3, molItems3, plane3, water} from '../components/syD';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

const PGS: [string, string][] = [
  ['C', '2v'],
  ['D', '3h'],
  ['T', 'd'],
  ['O', 'h'],
  ['C', '3v'],
  ['D', '6h'],
  ['I', 'h'],
  ['D', '∞h'],
];

const REFS = [
  'RPS Kimia Kuantum S1 Kimia UNESA — pertemuan 12–13: simetri molekul & grup titik',
  'P. Atkins & J. de Paula, Physical Chemistry — simetri molekul, tabel karakter',
  'F. A. Cotton, Chemical Applications of Group Theory, ed. 3',
  'C. E. Housecroft & A. G. Sharpe, Inorganic Chemistry — diagram alir grup titik',
  'Karvon: (R)-(−) berbau mint, (S)-(+) berbau jintan (caraway)',
  'Getaran H₂O (gas): 3657, 1595, 3756 cm⁻¹ · CO₂: 1388 (Raman), 667, 2349 cm⁻¹ (NIST)',
  'Aturan saling meniadakan IR–Raman untuk molekul berpusat inversi',
  'IPCC AR6 — CO₂ menyerap di pita ≈ 15 µm (667 cm⁻¹), N₂/O₂ tidak aktif IR',
];

export const Outro: React.FC = () => {
  const {t, dur} = useScene();
  const a = ramp(t, 0, 1.6);
  const waves = ramp(t, 0, 4, EASE_IN_OUT);
  const refs = ramp(t, 2.4, 3.4);
  const out = 1 - ramp(t, dur - 1.6, dur - 0.1, EASE_IN_OUT);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <Stage>
        <Glow x={960} y={300} r={500} color="violet" opacity={0.15} />
        <VbDefs />
        {/* hiasan simetri: H₂O dengan C₂ & σv, BF₃ dengan C₃ & σh, lencana grup titik melayang */}
        <g opacity={waves}>
          {(() => {
            const camW: Cam = {cx: 230, cy: 290, s: 112, yaw: 0.3 + 0.6 * Math.sin(t * 0.3), pitch: -0.15, persp: 9};
            const camB: Cam = {cx: 1680, cy: 290, s: 92, yaw: t * 0.35, pitch: -0.55, persp: 9};
            return (
              <>
                <Glow x={230} y={290} r={220} color="red" opacity={0.12} />
                <Glow x={1690} y={290} r={220} color="mint" opacity={0.1} />
                <Render3D
                  items={[
                    plane3(camW, {c: [0, 0, 0.15], u: [1, 0, 0], v: [0, 0, 1], w: 1.3, h: 1.2, opacity: 0.8}),
                    plane3(camW, {c: [0, 0, 0.15], u: [0, 1, 0], v: [0, 0, 1], w: 1.0, h: 1.2, opacity: 0.6}),
                    axis3(camW, {a: [0, 0, -1.2], b: [0, 0, 1.45], t, label: 'C2'}),
                    ...molItems3(camW, water(), {labels: false}),
                  ]}
                />
                <Render3D
                  items={[
                    plane3(camB, {c: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0], w: 1.55, h: 1.55, opacity: 0.8, depth: 1.5}),
                    axis3(camB, {a: [0, 0, -1.3], b: [0, 0, 1.5], t, label: 'C3'}),
                    ...molItems3(camB, bf3(), {labels: false}),
                  ]}
                />
              </>
            );
          })()}
          {Array.from({length: 10}, (_, k) => {
            const ph = ((t * (0.035 + 0.02 * rand(k)) + rand(k * 3.1)) % 1 + 1) % 1;
            const x = 140 + ph * 1640 + 40 * rand(k * 5.1);
            const y = 740 + 130 * rand(k * 7.3) + 12 * Math.sin(t * 0.7 + k);
            const op = 0.7 * cyc(ph);
            const pg = PGS[k % PGS.length];
            return <PGBadge key={k} x={x} y={y} main={pg[0]} sub={pg[1]} r={34} color={k % 2 ? C.gold : C.cyan} opacity={op} rot={10 * Math.sin(t * 0.5 + k)} />;
          })}
        </g>
      </Stage>
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 150}}>
        <div style={{fontFamily: FONT.sans, fontSize: 30, letterSpacing: 18, color: C.ink, fontWeight: 300, opacity: a}}>KIMIA KUANTUM · SIMETRI MOLEKUL</div>
        <div style={{fontFamily: FONT.sans, fontSize: 100, fontWeight: 800, color: C.gold, lineHeight: 1.05, opacity: a, textShadow: '0 0 50px rgba(255,194,74,0.4)'}}>BAHASA SIMETRI</div>
        <div style={{marginTop: 22, fontFamily: FONT.sans, fontSize: 34, color: C.ink, opacity: ramp(t, 1.2, 2.2)}}>Terima kasih telah menonton</div>
        <div style={{marginTop: 46, textAlign: 'center', opacity: refs}}>
          <div style={{fontFamily: FONT.mono, fontSize: 20, letterSpacing: 4, color: C.muted, marginBottom: 14}}>RUJUKAN</div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 56, rowGap: 6, width: 1720, textAlign: 'left'}}>
            {REFS.map((r, i) => (
              <div key={r} style={{fontFamily: FONT.sans, fontSize: 22, color: C.muted, lineHeight: 1.4, opacity: ramp(t, 2.4 + i * 0.08, 3.2 + i * 0.08)}}>
                {r}
              </div>
            ))}
          </div>
          <div style={{marginTop: 20, fontFamily: FONT.sans, fontSize: 22, color: C.muted, opacity: 0.8}}>
            Angka dari buku teks & NIST · model molekul skematis; grup titik mengikuti notasi Schoenflies · nilai ukur ditandai “≈” · ilustrasi orbital skematis
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
