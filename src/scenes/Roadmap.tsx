import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, ramp} from '../anim';
import {Glow, Stage} from '../components/primitives';
import {Render3D, VbDefs, type Cam} from '../components/vbC';
import {H2O, axis3D, rotArrow3D, symMol} from '../components/syA';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Peta video: tiga bagian (prinsip dasar → implementasi dalam kimia → penerapan).
const sub = (v: string) => (
  <tspan baselineShift="sub" fontSize={17}>
    {v}
  </tspan>
);
const CARDS: {n: string; title: string; items: React.ReactNode[]; words: string[]; color: string; glow: 'cyan' | 'violet' | 'gold' | 'mint'; x: number}[] = [
  {
    n: '1',
    title: 'Prinsip dasar',
    items: [
      'unsur & operasi simetri',
      <>sumbu putar C{sub('n')}</>,
      'bidang cermin σ',
      'pusat inversi i',
      <>putaran tak wajar S{sub('n')}</>,
    ],
    words: ['unsur', 'sumbu', 'bidang', 'inversi', 'tak'],
    color: C.gold,
    glow: 'gold',
    x: 420,
  },
  {
    n: '2',
    title: 'Implementasi dalam kimia',
    items: ['grup titik', 'diagram alir penentuan', 'tabel karakter'],
    words: ['grup', 'cara', 'tabel'],
    color: C.cyan,
    glow: 'cyan',
    x: 960,
  },
  {
    n: '3',
    title: 'Penerapan',
    items: ['kepolaran', 'kiralitas', 'getaran aktif inframerah', 'gas rumah kaca'],
    words: ['kepolaran', 'kiralitas', 'getaran', 'gas'],
    color: C.mint,
    glow: 'mint',
    x: 1500,
  },
];
const Y = 570;
const CW = 480;
const CH = 420;

const H2OI = H2O();

const Icon: React.FC<{i: number; x: number; y: number; t: number}> = ({i, x, y, t}) => {
  if (i === 0) {
    // air dengan sumbu C₂ emas: putar 180° berulang
    const ph = (Math.max(0, t) / 3) % 1;
    const p = EASE_IN_OUT(Math.min(1, ph / 0.45));
    const k = Math.floor(Math.max(0, t) / 3);
    const cam: Cam = {cx: x, cy: y + 8, s: 42, yaw: 0.45, pitch: -0.35};
    return (
      <Render3D
        items={[
          ...axis3D(cam, {dir: [0, 0, 1], len: 1.45, width: 3}),
          ...rotArrow3D(cam, {at: [0, 0, 1.0], dir: [0, 0, 1], r: 0.45, from: (k + p) * Math.PI, sweep: 4.2, width: 3}),
          ...symMol(cam, H2OI, {op: {kind: 'C', axis: [0, 0, 1], deg: 180 * (k + p)}, p: 1, labels: false}),
        ]}
      />
    );
  }
  if (i === 1) {
    // potongan tabel karakter: sel ±1 yang menyala bergiliran
    const vals = [
      [1, 1, 1, 1],
      [1, 1, -1, -1],
      [1, -1, 1, -1],
    ];
    return (
      <g>
        {vals.map((row, r) =>
          row.map((v, c) => {
            const lit = 0.5 + 0.5 * Math.sin(t * 2 - r * 0.9 - c * 0.6);
            const col = v > 0 ? C.mint : C.red;
            return (
              <g key={`${r}${c}`}>
                <rect x={x - 66 + c * 34} y={y - 44 + r * 30} width={30} height={26} rx={5} fill={col} fillOpacity={0.12 + 0.25 * lit} stroke={col} strokeOpacity={0.6} strokeWidth={1.5} />
                <text x={x - 51 + c * 34} y={y - 31 + r * 30} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.mono} fontSize={15} fontWeight={600} fill={col}>
                  {v > 0 ? '1' : '−1'}
                </text>
              </g>
            );
          }),
        )}
      </g>
    );
  }
  // getaran IR: CO₂ yang meregang tak simetris + gelombang
  const a = 6 * Math.sin(t * 5);
  const wave = Array.from({length: 30}, (_, k) => `${k ? 'L' : 'M'}${(x - 70 + k * 4.8).toFixed(1)},${(y + 40 + 8 * Math.sin(k * 0.7 - t * 6)).toFixed(1)}`).join(' ');
  return (
    <g>
      <path d={wave} fill="none" stroke={C.red} strokeWidth={2.5} opacity={0.75} />
      <line x1={x - 44 + a} y1={y - 10} x2={x + 44 + a} y2={y - 10} stroke="#9aa6c6" strokeWidth={5} />
      <circle cx={x - 46 + a} cy={y - 10} r={13} fill="#ff4d63" />
      <circle cx={x - a * 0.6} cy={y - 10} r={12} fill="#59627a" stroke="#9aa6c4" strokeWidth={1.5} />
      <circle cx={x + 46 + a} cy={y - 10} r={13} fill="#ff4d63" />
    </g>
  );
};

export const Roadmap: React.FC = () => {
  const {t, cue, wordOf} = useScene();
  const head = ramp(t, -0.2, 0.9);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center', opacity: head, translate: `0px ${(1 - head) * 20}px`}}>
        <div style={{fontFamily: FONT.mono, fontSize: 22, letterSpacing: 6, color: C.gold}}>PETA PERJALANAN · PERTEMUAN 12–13</div>
        <div style={{fontFamily: FONT.sans, fontSize: 60, fontWeight: 700, color: C.ink, marginTop: 6}}>Simetri Molekul &amp; Grup Titik</div>
      </div>
      <Stage>
        <VbDefs />
        {/* benang penghubung antarkartu */}
        {[0, 1].map((k) => {
          const p = ramp(t, cue(k + 2) - 0.5, cue(k + 2) + 0.4, EASE_IN_OUT);
          const x1 = CARDS[k].x + CW / 2 + 6;
          const x2 = CARDS[k + 1].x - CW / 2 - 6;
          return (
            <g key={k} opacity={ramp(t, cue(0) + 0.6, cue(0) + 1.4)}>
              <line x1={x1} y1={Y} x2={x2} y2={Y} stroke={C.faint} strokeWidth={3} strokeDasharray="5 6" strokeDashoffset={-t * 16} />
              <circle cx={x1 + (x2 - x1) * p} cy={Y} r={6} fill={C.gold} opacity={p * (1 - ramp(t, cue(k + 2) + 0.6, cue(k + 2) + 1.2))} />
            </g>
          );
        })}
        {CARDS.map((c, i) => {
          const p = ramp(t, cue(0) + 0.2 + i * 0.25, cue(0) + 1.0 + i * 0.25, BACK);
          const on = ramp(t, cue(i + 1) - 0.1, cue(i + 1) + 0.5);
          const off = i < 2 ? ramp(t, cue(i + 2) - 0.1, cue(i + 2) + 0.5, EASE_IN_OUT) : 0;
          const lit = on * (1 - off);
          const dim = 0.55 + 0.45 * Math.max(lit, 1 - ramp(t, cue(1) - 0.2, cue(1) + 0.4));
          const top = Y - CH / 2;
          const left = c.x - CW / 2;
          const float = 4 * Math.sin(t * 0.9 + i * 1.3);
          return (
            <g key={i} opacity={p * dim} transform={`translate(0 ${(1 - p) * 40 - 10 * lit + float})`}>
              <Glow x={c.x} y={Y} r={280} color={c.glow} opacity={0.2 * lit} />
              <rect x={left} y={top} width={CW} height={CH} rx={28} fill="rgba(12,18,40,0.85)" stroke={c.color} strokeOpacity={0.3 + 0.6 * lit} strokeWidth={2.5} />
              <text x={left + 36} y={top + 66} fontFamily={FONT.mono} fontSize={64} fontWeight={600} fill={c.color} dominantBaseline="central">
                {c.n}
              </text>
              <Icon i={i} x={left + CW - 100} y={top + 84} t={t} />
              <text x={left + 36} y={top + 160} fontFamily={FONT.sans} fontSize={31} fontWeight={700} fill={C.ink}>
                {c.title}
              </text>
              <rect x={left + 36} y={top + 182} width={(CW - 72) * on} height={2} fill={c.color} opacity={0.6} />
              {c.items.map((it, k) => {
                const w = ramp(t, wordOf(i + 1, c.words[k]) - 0.25, wordOf(i + 1, c.words[k]) + 0.35);
                const yy = top + 222 + k * 42;
                return (
                  <g key={k} opacity={0.35 + 0.65 * w}>
                    <circle cx={left + 46} cy={yy} r={5 + 2 * w} fill={c.color} />
                    <text x={left + 66} y={yy} dominantBaseline="central" fontFamily={FONT.sans} fontSize={25} fill={C.ink}>
                      {it}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </Stage>
    </AbsoluteFill>
  );
};
