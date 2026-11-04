import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Glow, Stage} from './components/primitives';
import {C, FONT, H, W} from './theme';

/** Gambar sampul video (2560×1440 lewat skala 4/3, lihat Root.tsx). */
const Cover: React.FC = () => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 70% at 70% 45%, #4a2f0a 0%, ${C.bg2} 45%, ${C.bg} 100%)`}}>
    <Stage>
      <Glow x={1420} y={460} r={560} color="gold" opacity={0.22} />
      <line x1={1420} y1={160} x2={1420} y2={640} stroke={C.cyan} strokeWidth={4} strokeDasharray="14 10" opacity={0.8} />
      {[90, 210, 330].map((a) => {
        const x = 1420 + 170 * Math.cos((a * Math.PI) / 180);
        const y = 410 - 170 * Math.sin((a * Math.PI) / 180);
        return (
          <g key={a}>
            <line x1={1420} y1={410} x2={x} y2={y} stroke={C.muted} strokeWidth={10} />
            <circle cx={x} cy={y} r={44} fill="#7be37b" stroke="#0b1a0b" strokeWidth={3} />
          </g>
        );
      })}
      <circle cx={1420} cy={410} r={54} fill="#ff9db5" stroke="#2a0b14" strokeWidth={3} />
      <path d="M1250,560 A230,80 0 1,0 1590,560" fill="none" stroke={C.gold} strokeWidth={6} />
      <path d="M1590,560 l-34,-6 m34,6 l-10,30" fill="none" stroke={C.gold} strokeWidth={6} strokeLinecap="round" />
      <text x={1420} y={760} textAnchor="middle" fontFamily={FONT.mono} fontSize={30} fill={C.muted}>
        C₂v · D₆h · T<tspan baselineShift="sub" fontSize={22}>d</tspan>
      </text>
    </Stage>
    <div style={{position: 'absolute', left: 110, top: 220, width: 900}}>
      <div style={{fontFamily: FONT.mono, fontSize: 30, letterSpacing: 8, color: C.gold}}>KIMIA KUANTUM · SIMETRI MOLEKUL</div>
      <div style={{fontFamily: FONT.sans, fontSize: 70, fontWeight: 800, color: C.ink, lineHeight: 1.05, marginTop: 10}}>Simetri Molekul &amp; Grup Titik</div>
      <div style={{fontFamily: FONT.sans, fontSize: 140, fontWeight: 800, color: C.gold, lineHeight: 1, marginTop: 24, textShadow: '0 0 50px rgba(255,194,74,0.45)'}}>
        Bahasa
        <br />
        Simetri
      </div>
      <div style={{display: 'flex', gap: 14, marginTop: 44}}>
        {[
          ['grup titik', C.cyan],
          ['kiralitas', C.violet],
          ['inframerah', C.amber],
        ].map(([t, col]) => (
          <div key={t} style={{padding: '10px 22px', borderRadius: 999, border: `2px solid ${col}`, color: col, fontFamily: FONT.sans, fontWeight: 600, fontSize: 30}}>
            {t}
          </div>
        ))}
      </div>
    </div>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 90% 80% at 50% 50%, transparent 60%, rgba(0,0,0,0.6) 100%)'}} />
  </AbsoluteFill>
);

export const Thumbnail: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.bg}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `scale(${2560 / W})`, transformOrigin: '0 0'}}>
      <Cover />
    </div>
  </AbsoluteFill>
);
