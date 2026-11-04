import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, mix, ramp, smoothPath} from '../anim';
import {Glow, Label, Stage} from '../components/primitives';
import {Render3D, SvgChem, VbDefs, type Cam} from '../components/vbC';
import {CARVONE_R, CARVONE_S, OpSym, symMol} from '../components/syA';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Pembuka: (R)-karvon (mint) dan (S)-karvon (jintan) berhadapan di kedua sisi cermin;
// tangan kiri & kanan tak bisa ditumpuk → "Simetri" → "bahasa simetri".

const MIR = 960;

/** Daun mint: dua helai bergerigi halus dengan tulang daun, bergoyang pelan. */
const MintLeaf: React.FC<{x: number; y: number; t: number; p: number}> = ({x, y, t, p}) => {
  const leaf = (rot: number, k: number, sc: number) => (
    <g key={k} transform={`rotate(${rot + 4 * Math.sin(t * 1.3 + k)}) scale(${sc})`}>
      <path d="M0,0 C26,-14 40,-48 0,-92 C-40,-48 -26,-14 0,0 Z" fill="#3fbf6a" stroke="#9cf0b4" strokeWidth={2} />
      <path d="M0,-4 L0,-84" stroke="#c9ffd8" strokeWidth={2} opacity={0.8} />
      {[-1, 1].map((s) => [20, 38, 56].map((yy, j) => <path key={`${s}${j}`} d={`M0,${-yy} Q${s * 12},${-yy - 8} ${s * 20},${-yy - 16}`} fill="none" stroke="#c9ffd8" strokeWidth={1.4} opacity={0.65} />))}
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${(0.6 + 0.4 * p) * 1.35})`} opacity={p}>
      <path d="M0,0 Q4,22 -2,40" stroke="#2f9a52" strokeWidth={4} fill="none" />
      {leaf(-32, 0, 0.82)}
      {leaf(28, 1, 0.9)}
    </g>
  );
};

/** Biji jintan (caraway): butir melengkung cokelat berusuk. */
const Caraway: React.FC<{x: number; y: number; t: number; p: number}> = ({x, y, t, p}) => (
  <g transform={`translate(${x} ${y}) scale(${(0.6 + 0.4 * p) * 1.3})`} opacity={p}>
    {[
      [-24, -26, -30],
      [20, -34, 18],
      [-10, 2, 8],
      [30, -2, -22],
      [4, 26, 40],
    ].map(([dx, dy, r], k) => (
      <g key={k} transform={`translate(${dx} ${dy + 2 * Math.sin(t * 1.5 + k)}) rotate(${r})`}>
        <path d="M-30,5 C-18,-17 18,-17 30,5 C16,-3 -16,-3 -30,5 Z" fill="#9a6634" stroke="#e0b07a" strokeWidth={1.6} />
        <path d="M-24,1 C-12,-11 12,-11 24,1" fill="none" stroke="#f0cf9c" strokeWidth={1.3} opacity={0.75} />
        <path d="M-20,3 C-10,-6 10,-6 20,3" fill="none" stroke="#6a4220" strokeWidth={1.2} opacity={0.7} />
      </g>
    ))}
  </g>
);

/** Siluet telapak tangan (tanpa wajah/sosok). side = 1: kanan (ibu jari di kanan layar), −1: kiri. */
const Hand: React.FC<{x: number; y: number; s: number; side: 1 | -1; opacity: number; tint?: string}> = ({x, y, s, side, opacity, tint = '#d8b596'}) => {
  const fingers: [number, number][] = [
    [-45, 78],
    [-15, 104],
    [15, 114],
    [45, 98],
  ];
  const shapes = (stroke: boolean) => (
    <g fill={stroke ? 'none' : tint} stroke={stroke ? '#6e4c35' : 'none'} strokeWidth={stroke ? 7 : 0}>
      <rect x={-62} y={-24} width={124} height={118} rx={34} />
      {fingers.map(([fx, h], k) => (
        <rect key={k} x={fx - 14} y={-24 - h} width={28} height={h + 30} rx={14} />
      ))}
      <rect x={-16} y={-62} width={30} height={84} rx={15} transform="translate(64 40) rotate(42)" />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${side * s} ${s})`} opacity={opacity}>
      {shapes(true)}
      {shapes(false)}
      <path d="M-44,30 Q-6,46 40,22" fill="none" stroke="#a87e61" strokeWidth={3} opacity={0.7} />
      <path d="M-40,54 Q0,62 30,46" fill="none" stroke="#a87e61" strokeWidth={3} opacity={0.6} />
      <path d="M20,88 Q24,50 52,26" fill="none" stroke="#a87e61" strokeWidth={3} opacity={0.6} />
    </g>
  );
};

/** Asap aroma yang naik bergelombang (siklus cyc agar tidak muncul mendadak). */
const Wisps: React.FC<{x: number; y: number; t: number; p: number; color: string; seed: number}> = ({x, y, t, p, color, seed}) => (
  <g opacity={p}>
    {[0, 1, 2].map((k) => {
      const ph = (((t * 0.35 + k / 3 + seed) % 1) + 1) % 1;
      const pts = Array.from({length: 12}, (_, i) => {
        const u = i / 11;
        return [x + (k - 1) * 26 + 16 * Math.sin(u * 6 + t * 1.8 + k + seed * 5), y - 30 - u * 120 - ph * 60] as [number, number];
      });
      return <path key={k} d={smoothPath(pts)} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" opacity={0.55 * cyc(ph)} />;
    })}
  </g>
);

export const Hook: React.FC = () => {
  const {t, cue, cueEnd, wordOf, dur} = useScene();
  const out = 1 - ramp(t, dur - 0.9, dur - 0.1, EASE_IN_OUT);

  // ---------- molekul ----------
  const inL = ramp(t, -0.2, 1.4, BACK);
  const inR = ramp(t, 0.5, 2.1, BACK);
  const formula = ramp(t, wordOf(0, 'atom') - 0.3, wordOf(0, 'atom') + 0.5) * (1 - ramp(t, cue(3) - 0.4, cue(3) + 0.4, EASE_IN_OUT));
  const same = ramp(t, wordOf(0, 'sama', 1) - 0.2, wordOf(0, 'persis') + 0.3) * (1 - ramp(t, cue(1) - 0.2, cue(1) + 0.6, EASE_IN_OUT));
  const mint = ramp(t, wordOf(1, 'mint') - 0.3, wordOf(1, 'mint') + 0.5);
  const jin = ramp(t, wordOf(1, 'jintan') - 0.3, wordOf(1, 'jintan') + 0.5);
  const mirror = ramp(t, wordOf(2, 'bayangan') - 0.4, wordOf(2, 'cermin') + 0.4, EASE_IN_OUT);

  // tangan
  const tKiri = wordOf(2, 'kiri');
  const tKanan = wordOf(2, 'kanan');
  const handL = ramp(t, tKiri - 0.4, tKiri + 0.4, BACK);
  const handR = ramp(t, tKanan - 0.4, tKanan + 0.4, BACK);
  const slide = ramp(t, cueEnd(2) - 0.2, cueEnd(2) + 1.2, EASE_IN_OUT);
  const nope = ramp(t, cueEnd(2) + 1.0, cueEnd(2) + 1.5, BACK);
  const handOut = 1 - ramp(t, cue(3) + 1.4, cue(3) + 2.2, EASE_IN_OUT);
  const handsOn = Math.max(handL, handR) * handOut;
  const molDim = 1 - 0.8 * handsOn;

  // aroma, kata kunci
  const smell = ramp(t, cue(3) + 0.6, cue(3) + 1.6) * (1 - ramp(t, cue(4) - 0.2, cue(4) + 0.6, EASE_IN_OUT));
  const wSim = ramp(t, wordOf(3, 'Simetri') - 0.3, wordOf(3, 'Simetri') + 0.6, BACK);
  const toB = ramp(t, wordOf(4, 'bahasa') - 0.4, wordOf(4, 'bahasa') + 0.6, EASE_IN_OUT);
  const wBahasa = ramp(t, wordOf(4, 'bahasa') - 0.2, wordOf(4, 'simetri') + 0.5, BACK);
  const syms = ramp(t, wordOf(4, 'cara') - 0.3, wordOf(4, 'cara') + 1.2);
  const arrowP = ramp(t, wordOf(4, 'meramal') - 0.3, wordOf(4, 'sifatnya') + 0.5);

  // kamera: dua kamera yaw berlawanan → layar kanan tepat cermin layar kiri
  const spread = ramp(t, cue(3) + 1.6, cue(3) + 3.0, EASE_IN_OUT);
  const spread2 = ramp(t, cue(4) - 0.4, cue(4) + 1.0, EASE_IN_OUT);
  const dx = mix(mix(460, 520, spread), 590, spread2);
  const s = mix(mix(92, 84, spread), 72, spread2);
  const yaw = -0.5 + t * 0.11;
  const cy = 455 + 6 * Math.sin(t * 0.8);
  const camL: Cam = {cx: MIR - dx, cy, s, yaw, pitch: -0.55};
  const camR: Cam = {cx: MIR + dx, cy, s, yaw: -yaw, pitch: -0.55};

  const glowPulse = 0.85 + 0.15 * Math.sin(t * 1.2);

  return (
    <AbsoluteFill style={{opacity: out}}>
      <Stage>
        <VbDefs />
        <Glow x={MIR - dx} y={cy} r={340} color="mint" opacity={0.14 * inL * glowPulse + 0.1 * mint} />
        <Glow x={MIR + dx} y={cy} r={340} color="gold" opacity={0.12 * inR * glowPulse + 0.1 * jin} />

        {/* cermin vertikal */}
        <g opacity={mirror * (1 - 0.55 * toB)}>
          <defs>
            <linearGradient id="hk-mirror" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={C.cyan} stopOpacity="0.02" />
              <stop offset="50%" stopColor={C.cyan} stopOpacity="0.2" />
              <stop offset="100%" stopColor={C.cyan} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={`M${MIR - 26},${150 + (1 - mirror) * 330} L${MIR + 26},${180 + (1 - mirror) * 330} L${MIR + 26},${860 - (1 - mirror) * 330} L${MIR - 26},${830 - (1 - mirror) * 330} Z`} fill="url(#hk-mirror)" stroke={C.cyan} strokeOpacity={0.7} strokeWidth={2.5} />
          {[0, 1].map((k) => {
            const ph = (((t * 0.22 + k * 0.5) % 1) + 1) % 1;
            const yy = 200 + ph * 600;
            return <path key={k} d={`M${MIR - 20},${yy} L${MIR + 20},${yy + 20} L${MIR + 20},${yy + 70} L${MIR - 20},${yy + 50} Z`} fill="#fff" opacity={0.12 * cyc(ph) * mirror} />;
          })}
          <Label x={MIR} y={120} size={26} color={C.cyan} weight={600} opacity={mirror * (1 - toB)} spacing={3}>
            CERMIN
          </Label>
        </g>

        {/* dua karvon */}
        <Render3D items={symMol(camL, CARVONE_R, {opacity: inL})} opacity={molDim} />
        <Render3D items={symMol(camR, CARVONE_S, {opacity: inR})} opacity={molDim} />

        {/* rumus molekul sama */}
        {[-1, 1].map((sd) => (
          <g key={sd} opacity={formula * molDim}>
            <SvgChem x={MIR + sd * dx} y={168} size={44 + 4 * same} color={C.ink} opacity={1 - same} parts={[['C'], ['10', 'sub'], ['H'], ['14', 'sub'], ['O']]} />
            <SvgChem x={MIR + sd * dx} y={168} size={44 + 4 * same} color={C.gold} opacity={same} parts={[['C'], ['10', 'sub'], ['H'], ['14', 'sub'], ['O']]} />
          </g>
        ))}
        <Label x={MIR} y={168} size={50} color={C.gold} weight={700} opacity={same}>
          =
        </Label>

        {/* ikon aroma */}
        <g opacity={molDim}>
          <MintLeaf x={MIR - dx - 150} y={830} t={t} p={mint} />
          <Label x={MIR - dx - 62} y={790} size={32} color={C.mint} weight={700} anchor="start" opacity={mint}>
            (R)-karvon
          </Label>
          <Label x={MIR - dx - 62} y={832} size={26} color={C.muted} anchor="start" opacity={mint}>
            bau daun mint
          </Label>
          <Caraway x={MIR + dx + 150} y={808} t={t} p={jin} />
          <Label x={MIR + dx + 62} y={790} size={32} color="#e2a868" weight={700} anchor="end" opacity={jin}>
            (S)-karvon
          </Label>
          <Label x={MIR + dx + 62} y={832} size={26} color={C.muted} anchor="end" opacity={jin}>
            bau jintan
          </Label>
        </g>
        <Wisps x={MIR - dx - 150} y={760} t={t} p={smell * mint} color={C.mint} seed={0.1} />
        <Wisps x={MIR + dx + 150} y={770} t={t} p={smell * jin} color="#e2a868" seed={0.6} />

        {/* tangan kiri & kanan */}
        <g opacity={handOut}>
          <Hand x={mix(MIR - 460, MIR - 8, slide)} y={500 + (1 - handL) * 40} s={1.55} side={-1} opacity={handL * (1 - 0.35 * slide)} />
          <Hand x={mix(MIR + 460, MIR + 8, slide)} y={500 + (1 - handR) * 40} s={1.55} side={1} opacity={handR * (1 - 0.35 * slide)} tint="#e3c2a3" />
          <Label x={MIR - 460} y={735} size={34} color={C.ink} weight={600} opacity={handL * (1 - slide)}>
            tangan kiri
          </Label>
          <Label x={MIR + 460} y={735} size={34} color={C.ink} weight={600} opacity={handR * (1 - slide)}>
            tangan kanan
          </Label>
          <g opacity={nope}>
            <circle cx={MIR - 128} cy={540} r={34} fill="none" stroke={C.red} strokeWidth={4} />
            <circle cx={MIR + 128} cy={540} r={34} fill="none" stroke={C.red} strokeWidth={4} />
            <Label x={MIR} y={770} size={40} color={C.red} weight={700}>
              ✕ tidak bisa ditumpuk
            </Label>
          </g>
        </g>

        {/* simbol simetri melayang di sekitar judul */}
        {(
          [
            ['C', '2', -330, -150],
            ['sigma', undefined, 320, -160],
            ['i', undefined, -300, 150],
            ['S', '4', 330, 140],
          ] as const
        ).map(([k, n, ox, oy], j) => (
          <OpSym key={j} kind={k} n={n} x={MIR + ox + 8 * Math.sin(t * 0.7 + j)} y={470 + oy + 6 * Math.cos(t * 0.9 + j * 2)} size={56} opacity={0.75 * ramp(t, wordOf(4, 'cara') - 0.3 + j * 0.25, wordOf(4, 'cara') + 0.5 + j * 0.25) * syms} />
        ))}
      </Stage>

      {/* kata kunci */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 410, textAlign: 'center'}}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            fontFamily: FONT.sans,
            fontWeight: 800,
            fontSize: 112,
            color: C.gold,
            letterSpacing: 3,
            opacity: wSim * (1 - toB),
            transform: `scale(${0.85 + 0.15 * wSim})`,
            textShadow: '0 0 50px rgba(255,194,74,0.45), 0 4px 18px rgba(0,0,0,0.8)',
          }}
        >
          Simetri
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            fontFamily: FONT.sans,
            fontWeight: 800,
            fontSize: 100,
            color: C.gold,
            letterSpacing: 2,
            opacity: wBahasa,
            transform: `scale(${0.85 + 0.15 * wBahasa})`,
            textShadow: '0 0 50px rgba(255,194,74,0.45), 0 4px 18px rgba(0,0,0,0.8)',
          }}
        >
          <span style={{color: C.ink}}>bahasa </span>simetri
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 150, fontFamily: FONT.sans, fontSize: 40, color: C.muted, opacity: arrowP}}>
          bentuk <span style={{color: C.gold, margin: '0 18px'}}>→</span> <span style={{color: C.ink}}>sifat</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
