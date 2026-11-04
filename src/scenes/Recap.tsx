import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, ramp} from '../anim';
import {Glow, Stage, Sub, Sup} from '../components/primitives';
import {type Cam, Render3D, VbDefs} from '../components/vbC';
import {PhotonPacket, wlColor} from '../components/viz';
import {PGBadge, Vec, co2, co2Mode, molItems3, nh3, vibrate, water} from '../components/syD';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Bab 14: tujuh poin rangkuman dengan ikon bergerak; poin terakhir (kartu besar) = teaser spektroskopi molekul.
const COLX = [80, 990];
const CW = 850;
const ROWY = [272, 436, 600, 764];
const CH = 150;
const box = (i: number) =>
  i < 4 ? {x: COLX[0], y: ROWY[i], h: CH} : i < 6 ? {x: COLX[1], y: ROWY[i - 4], h: CH} : {x: COLX[1], y: (ROWY[2] + ROWY[3]) / 2, h: CH * 2 + 14};

const I: React.FC<{children: React.ReactNode}> = ({children}) => <i style={{fontFamily: FONT.serif}}>{children}</i>;

const ROWS: {title: React.ReactNode; detail: React.ReactNode; col: string}[] = [
  {
    title: 'Lima unsur simetri',
    detail: (
      <>
        <I>E</I>, <I>C</I>
        <Sub>
          <I>n</I>
        </Sub>
        , <I>σ</I>, <I>i</I>, <I>S</I>
        <Sub>
          <I>n</I>
        </Sub>{' '}
        — identitas, sumbu, cermin, inversi, putaran tak wajar
      </>
    ),
    col: C.gold,
  },
  {
    title: (
      <>
        Kiral = tanpa <I>S</I>
        <Sub>
          <I>n</I>
        </Sub>
      </>
    ),
    detail: 'karvon mint & karvon jintan: bayangan cermin yang tak bisa ditumpuk',
    col: C.cyan,
  },
  {title: 'Grup titik', detail: 'himpunan semua operasi molekul, ditentukan lewat diagram alir', col: C.violet},
  {title: 'Tabel karakter', detail: 'label simetri (±1) → tumpang tindih orbital & transisi', col: C.mint},
  {
    title: 'Kepolaran dari simetri',
    detail: (
      <>
        polar hanya <I>C</I>
        <Sub>
          <I>n</I>
        </Sub>
        , <I>C</I>
        <Sub>
          <I>n</I>v
        </Sub>
        , <I>C</I>
        <Sub>s</Sub> — H<Sub>2</Sub>O polar, CO<Sub>2</Sub> nonpolar
      </>
    ),
    col: C.amber,
  },
  {
    title: (
      <>
        CO<Sub>2</Sub> menahan panas
      </>
    ),
    detail: (
      <>
        tekukan 667 cm<Sup>−1</Sup> mengubah dipol → menyerap inframerah Bumi
      </>
    ),
    col: C.red,
  },
  {title: 'Berikutnya: spektroskopi molekul', detail: 'rotasi, getaran, dan transisi elektron — semuanya dibaca lewat bahasa simetri', col: C.pink},
];

const Icon: React.FC<{i: number; x: number; y: number; t: number}> = ({i, x, y, t}) => {
  if (i === 0) {
    // lima simbol bergiliran menyala + segitiga berputar dengan sumbu & cermin
    const k = Math.floor(((t * 0.8) % 5 + 5) % 5);
    const R = 34;
    const rot = t * 0.9;
    return (
      <g>
        <line x1={x} y1={y - 52} x2={x} y2={y + 52} stroke={C.gold} strokeWidth={2.5} strokeDasharray="6 5" />
        <line x1={x - 50 * Math.cos(rot * 0.3)} y1={y - 50 * Math.sin(rot * 0.3)} x2={x + 50 * Math.cos(rot * 0.3)} y2={y + 50 * Math.sin(rot * 0.3)} stroke={C.cyan} strokeWidth={2} opacity={0.6} />
        {[0, 1, 2].map((j) => {
          const a = rot + (j * 2 * Math.PI) / 3;
          return <circle key={j} cx={x + R * Math.cos(a)} cy={y + R * 0.5 * Math.sin(a)} r={9} fill="#f2f5ff" />;
        })}
        <circle cx={x} cy={y} r={7} fill={C.pink} />
        {['E', 'C', 'σ', 'i', 'S'].map((s, j) => {
          const ang = -Math.PI / 2 + (j * 2 * Math.PI) / 5;
          const on = 0.35 + 0.65 * Math.max(0, 1 - Math.abs(((t * 0.8) % 5) - j - 0.5) * 1.2) * (j === k ? 1 : 1);
          return (
            <text key={j} x={x + 60 * Math.cos(ang)} y={y + 60 * Math.sin(ang)} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.serif} fontStyle="italic" fontWeight={600} fontSize={20} fill={C.gold} opacity={on}>
              {s}
            </text>
          );
        })}
      </g>
    );
  }
  if (i === 1) {
    // dua pusat kiral yang saling bayangan cermin
    const sway = 0.25 * Math.sin(t * 1.2);
    const arm = (sx: number, cols: string[]) =>
      [0, 1, 2].map((j) => {
        const a = -Math.PI / 2 + (j * 2 * Math.PI) / 3 + sway * sx;
        const ex = x + sx * 30 + sx * 22 * Math.cos(a);
        const ey = y + 26 * Math.sin(a);
        return (
          <g key={j}>
            <line x1={x + sx * 30} y1={y} x2={ex} y2={ey} stroke="#c9d3f2" strokeWidth={3} />
            <circle cx={ex} cy={ey} r={8} fill={cols[j]} />
          </g>
        );
      });
    return (
      <g>
        <line x1={x} y1={y - 50} x2={x} y2={y + 50} stroke={C.cyan} strokeWidth={3} opacity={0.6 + 0.3 * Math.sin(t * 2)} />
        {arm(-1, [C.mint, C.gold, C.red])}
        {arm(1, [C.mint, C.red, C.gold])}
        <circle cx={x - 30} cy={y} r={9} fill="#59627a" />
        <circle cx={x + 30} cy={y} r={9} fill="#59627a" />
      </g>
    );
  }
  if (i === 2) {
    // diagram alir mini: titik turun melewati kotak → lencana C₂v
    const ph = ((t * 0.35) % 1 + 1) % 1;
    const nodes: [number, number][] = [
      [x - 30, y - 38],
      [x - 30, y],
      [x + 10, y + 34],
    ];
    const seg = Math.min(2, Math.floor(ph * 3));
    const u = ph * 3 - seg;
    const a = nodes[seg];
    const b = nodes[Math.min(2, seg + 1)];
    return (
      <g>
        <path d={`M${nodes[0][0]},${nodes[0][1]} L${nodes[1][0]},${nodes[1][1]} L${nodes[2][0]},${nodes[2][1]}`} fill="none" stroke={C.muted} strokeWidth={2} />
        {nodes.slice(0, 2).map((n, k) => (
          <rect key={k} x={n[0] - 12} y={n[1] - 9} width={24} height={18} rx={4} fill="rgba(160,131,255,0.25)" stroke={C.violet} strokeWidth={2} transform={`rotate(45 ${n[0]} ${n[1]})`} />
        ))}
        <circle cx={a[0] + (b[0] - a[0]) * u} cy={a[1] + (b[1] - a[1]) * u} r={6} fill={C.gold} opacity={cyc(ph)} />
        <PGBadge x={x + 26} y={y + 30} main="C" sub="2v" r={26} color={C.violet} rot={6 * Math.sin(t)} />
      </g>
    );
  }
  if (i === 3) {
    // tabel karakter mini ±1 dengan sorotan baris
    const row = Math.floor(((t * 0.7) % 4 + 4) % 4);
    const vals = [
      [1, 1, 1, 1],
      [1, 1, -1, -1],
      [1, -1, 1, -1],
      [1, -1, -1, 1],
    ];
    return (
      <g>
        {vals.map((r, ri) =>
          r.map((v, ci) => {
            const cx = x - 36 + ci * 24;
            const cy = y - 36 + ri * 24;
            const hot = 0.3 + 0.7 * Math.max(0, 1 - Math.abs(((t * 0.7) % 4) - ri - 0.5) * 1.5);
            return (
              <g key={`${ri}${ci}`} opacity={0.45 + 0.55 * hot * (ri === row ? 1 : 1)}>
                <rect x={cx - 10} y={cy - 10} width={20} height={20} rx={4} fill={v > 0 ? C.mint : C.red} opacity={0.3} />
                <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.mono} fontSize={14} fill={v > 0 ? C.mint : C.red}>
                  {v > 0 ? '+' : '−'}
                </text>
              </g>
            );
          }),
        )}
      </g>
    );
  }
  if (i === 4) {
    // H₂O dengan panah dipol vs CO₂ tanpa dipol
    const camW: Cam = {cx: x - 2, cy: y - 18, s: 34, yaw: 0.3 * Math.sin(t * 0.8), pitch: -0.1, persp: 20};
    const camC: Cam = {cx: x, cy: y + 34, s: 22, yaw: 0.3 * Math.sin(t * 0.7), pitch: -0.2, persp: 20};
    const g = 0.6 + 0.4 * Math.sin(t * 2.5);
    return (
      <g>
        <Render3D items={molItems3(camW, water(), {labels: false})} />
        <Vec x1={x + 34} y1={y - 8} x2={x + 34} y2={y - 8 - 34 * g} color="#ffb066" width={4} head={12} halo={false} />
        <Render3D items={molItems3(camC, co2(), {labels: false})} />
      </g>
    );
  }
  if (i === 5) {
    // CO₂ menekuk + paket inframerah
    const camC: Cam = {cx: x, cy: y + 6, s: 30, yaw: 0.2, pitch: -0.25, persp: 20};
    const ph = ((t * 0.5) % 1 + 1) % 1;
    return (
      <g>
        <circle cx={x} cy={y} r={50} fill="url(#soft-red)" opacity={0.3 + 0.2 * Math.sin(t * 3)} />
        <PhotonPacket x={x - 10} y={y + 50 - ph * 80} wavelength={14} color="#ff6a3d" amp={6} len={46} angle={90} opacity={cyc(ph)} phase={-t * 8} />
        <Render3D items={molItems3(camC, vibrate(co2(), co2Mode('bendZ'), 0.12, t * 6), {labels: false})} />
      </g>
    );
  }
  // i === 6: teaser spektroskopi — NH₃ berputar + garis spektrum menyala
  const cam: Cam = {cx: x, cy: y - 30, s: 70, yaw: t * 0.6, pitch: -0.35, persp: 9};
  return (
    <g>
      <circle cx={x} cy={y - 20} r={120} fill="url(#soft-violet)" opacity={0.35 + 0.1 * Math.sin(t * 2)} />
      <Render3D items={molItems3(cam, nh3(), {labels: false})} />
      <rect x={x - 110} y={y + 70} width={220} height={34} rx={6} fill="#070a14" stroke={C.faint} />
      {[420, 470, 520, 575, 610, 650].map((nm, k) => (
        <rect key={nm} x={x - 100 + k * 38} y={y + 72} width={5} height={30} fill={wlColor(nm)} opacity={0.35 + 0.65 * Math.max(0, Math.sin(t * 2 - k * 0.8))} />
      ))}
    </g>
  );
};

export const Recap: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();
  const intro = ramp(t, cue(0) - 0.4, cue(0) + 0.6);
  const at = [cue(1), cue(2), cue(3), cue(4), wordOf(5, 'kepolaran'), wordOf(5, 'karbon'), cue(6)];
  const next = [...at.slice(1), dur + 9];
  const lit = at.map((a) => ramp(t, a - 0.3, a + 0.5, BACK));
  const cur = (i: number) => Math.min(1, ramp(t, at[i] - 0.3, at[i] + 0.4)) * (1 - 0.35 * ramp(t, next[i] - 0.3, next[i] + 0.4));
  const finale = ramp(t, at[6] - 0.3, at[6] + 0.6);
  const out = 1 - ramp(t, dur - 0.9, dur - 0.1, EASE_IN_OUT);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <Stage>
        <VbDefs />
        <Glow x={960} y={540} r={760} color="mint" opacity={0.05 + 0.03 * Math.sin(t)} />
        {ROWS.map((r, i) => {
          const b = box(i);
          const hot = cur(i);
          const big = i === 6;
          const ix = b.x + (big ? 160 : 100);
          return (
            <g key={i} opacity={intro * (0.12 + 0.88 * lit[i])}>
              <rect
                x={b.x}
                y={b.y - b.h / 2}
                width={CW}
                height={b.h}
                rx={22}
                fill="rgba(12,18,40,0.72)"
                stroke={r.col}
                strokeWidth={2.5}
                strokeOpacity={0.25 + 0.6 * hot + (big ? 0.3 * finale * (0.6 + 0.4 * Math.sin(t * 4)) : 0)}
              />
              <rect x={b.x} y={b.y - b.h / 2 + 22} width={6} height={b.h - 44} rx={3} fill={r.col} opacity={0.4 + 0.6 * hot} />
              {!big ? <circle cx={ix} cy={b.y} r={64} fill="rgba(6,10,24,0.8)" stroke={r.col} strokeOpacity={0.3 + 0.4 * hot} strokeWidth={2} /> : null}
              <g opacity={lit[i]}>
                <Icon i={i} x={ix} y={b.y} t={t} />
              </g>
            </g>
          );
        })}
      </Stage>
      {ROWS.map((r, i) => {
        const b = box(i);
        const big = i === 6;
        const left = b.x + (big ? 330 : 190);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left,
              top: b.y,
              width: CW - (left - b.x) - 26,
              transform: `translate(${(1 - lit[i]) * -24}px, -50%)`,
              opacity: lit[i] * intro * (0.6 + 0.4 * cur(i)),
            }}
          >
            <div style={{fontFamily: FONT.sans, fontSize: big ? 44 : 36, fontWeight: 700, color: r.col, lineHeight: 1.15}}>{r.title}</div>
            <div style={{fontFamily: FONT.sans, fontSize: big ? 32 : 28, color: C.ink, lineHeight: 1.28, marginTop: 6}}>{r.detail}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
