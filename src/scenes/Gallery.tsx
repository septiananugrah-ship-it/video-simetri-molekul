import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, ramp} from '../anim';
import {Glow, Label, Stage} from '../components/primitives';
import {Render3D, VbDefs} from '../components/vbC';
import {FAMILY_COL, GALLERY, GroupBadge, galleryItems, SyDefs, SyText} from '../components/syC';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Bab 08: galeri grup titik. H₂O & H₂CO C₂v; NH₃ C₃v; C₂H₄ & naftalena D₂h; benzena D₆h; CH₄ Td; SF₆ Oh; C₆₀ Ih; CHFClBr C₁.

const XS = [256, 608, 960, 1312, 1664];
const ROW = [
  {mol: 296, name: 420, badge: 472},
  {mol: 624, name: 748, badge: 802},
];

export const Gallery: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();
  const out = 1 - ramp(t, dur - 0.9, dur - 0.1, EASE_IN_OUT);

  // nama disebut → sorot; simbol disebut → lencana
  const named = [
    wordOf(1, 'Air'),
    wordOf(1, 'formaldehida'),
    wordOf(1, 'Amonia'),
    wordOf(1, 'Etilena'),
    wordOf(1, 'naftalena'),
    wordOf(2, 'Benzena'),
    wordOf(2, 'Metana'),
    wordOf(2, 'Belerang'),
    wordOf(2, 'Fulerena'),
    wordOf(3, 'CHFClBr'),
  ];
  const badgeAt = [
    wordOf(1, 'dua', 0),
    wordOf(1, 'dua', 0) + 0.2,
    wordOf(1, 'tiga'),
    wordOf(1, 'dua', 1),
    wordOf(1, 'dua', 1) + 0.2,
    wordOf(2, 'enam'),
    wordOf(2, 'd.'),
    wordOf(2, 'h.', 1),
    wordOf(2, 'h.', 2),
    wordOf(3, 'satu'),
  ];
  const legend = ramp(t, cue(3) + 0.6, cue(3) + 1.6) * (1 - ramp(t, dur - 1.6, dur - 1.0));

  return (
    <AbsoluteFill style={{opacity: out}}>
      <Stage>
        <VbDefs />
        <SyDefs />
        <Glow x={960} y={500} r={700} color="gold" opacity={0.04 + 0.02 * Math.sin(t * 0.6)} />
        {GALLERY.map((e, i) => {
          const col = i % 5;
          const row = ROW[Math.floor(i / 5)];
          const x = XS[col];
          const appear = ramp(t, wordOf(0, 'galeri') - 0.6 + i * 0.16, wordOf(0, 'galeri') + 0.4 + i * 0.16, BACK);
          const hi = ramp(t, named[i] - 0.3, named[i] + 0.4);
          const pulse = Math.sin(Math.PI * ramp(t, named[i] - 0.3, named[i] + 1.4, (u) => u));
          const bp = ramp(t, badgeAt[i] - 0.2, badgeAt[i] + 0.6, BACK);
          const fcol = FAMILY_COL[e.family];
          const yaw = 0.4 * t + i * 0.9;
          const bob = 6 * Math.sin(t * 1.1 + i * 1.3);
          return (
            <g key={e.key}>
              {/* alas sel */}
              <ellipse cx={x} cy={row.mol + 88} rx={105} ry={18} fill={fcol} opacity={appear * (0.05 + 0.12 * bp)} />
              <circle cx={x} cy={row.mol + bob} r={112} fill={fcol} opacity={appear * (0.03 + 0.07 * pulse + 0.03 * bp)} />
              <Render3D items={galleryItems(e, {cx: x, cy: row.mol + bob, yaw, scale: 0.92 + 0.08 * appear + 0.05 * pulse, opacity: appear * (0.7 + 0.3 * Math.max(hi, bp))})} />
              <SyText x={x} y={row.name} parts={e.name} size={28} color={C.muted} opacity={appear} weight={500} />
              <GroupBadge x={x} y={row.badge} parts={e.group} color={fcol} p={bp} size={40} w={128} t={t} />
            </g>
          );
        })}
        {/* legenda keluarga */}
        <g opacity={legend}>
          {(
            [
              ['Cv', 'Cₙv'],
              ['Dh', 'Dₙh'],
              ['cubic', 'kubik'],
              ['C1', 'tanpa simetri'],
            ] as const
          ).map(([k, s], j) => (
            <g key={k}>
              <circle cx={560 + j * 230} cy={180} r={9} fill={FAMILY_COL[k]} />
              <Label x={578 + j * 230} y={180} size={24} color={C.muted} anchor="start">
                {s}
              </Label>
            </g>
          ))}
        </g>
      </Stage>
    </AbsoluteFill>
  );
};
