import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {EASE, EASE_IN_OUT, ramp} from './anim';
import {Background, Vignette} from './components/Background';
import {Captions} from './components/Captions';
import {ChapterHeading} from './components/ChapterHeading';
import {POST, PRE, SceneProvider, useScene} from './SceneContext';
import {SCENES} from './scenes';
import {type VideoProps, defaultVideoProps} from './defaults.ts';
import {FPS, TIMELINE, lineKey, type TScene} from './timeline.ts';

export {defaultVideoProps, type VideoProps};


/**
 * Pergantian adegan: adegan lama naik sedikit & memudar habis tepat sebelum batas,
 * adegan baru turun masuk sesudahnya (tidak ada dua adegan bertumpuk).
 * Sengaja tanpa blur CSS (Chrome menerapkannya mendadak); hanya translate + skala pelan + opacity.
 */
const SceneShell: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {t, dur} = useScene();
  const enter = ramp(t, 0, 0.8, EASE);
  const exit = ramp(t, dur - 0.7, dur + 0.05, EASE_IN_OUT);
  const swayX = 4 * Math.sin(t * 0.31 + 1.3);
  const swayY = 3 * Math.sin(t * 0.23) + 22 * (1 - enter) - 18 * exit;
  return (
    <AbsoluteFill style={{opacity: enter * (1 - exit), willChange: 'transform', translate: `${swayX.toFixed(2)}px ${swayY.toFixed(2)}px`}}>
      {children}
    </AbsoluteFill>
  );
};

const SceneSlot: React.FC<{scene: TScene}> = ({scene}) => {
  const Comp = SCENES[scene.id];
  const pre = scene.index === 0 ? 0 : PRE;
  const from = Math.round((scene.start - pre) * FPS);
  const isLast = scene.index === TIMELINE.scenes.length - 1;
  const duration = Math.round((scene.duration + pre + (isLast ? 0 : POST)) * FPS);
  if (!Comp) return null;
  return (
    <Sequence name={`${scene.chapter ? scene.chapter + ' · ' : ''}${scene.title}`} from={from} durationInFrames={duration}>
      <SceneProvider scene={scene} pre={pre}>
        <SceneShell>
          <Comp />
        </SceneShell>
      </SceneProvider>
    </Sequence>
  );
};

/** Kilatan cahaya tipis di setiap pergantian bab (selaras dengan whoosh di musik). */
const TransitionFlash: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const b = TIMELINE.scenes.slice(1).find((s) => Math.abs(t - s.start) < 0.45);
  if (!b) return null;
  const p = (t - (b.start - 0.45)) / 0.9;
  const k = Math.sin(Math.PI * Math.min(1, Math.max(0, p)));
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen'}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 45% 30% at 50% 47%, rgba(255,214,140,${0.22 * k}), transparent 70%)`}} />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '47%',
          width: 1700,
          height: 3,
          marginLeft: -850,
          scale: `${0.15 + 0.95 * p} 1`,
          opacity: k,
          background: 'linear-gradient(90deg, transparent, rgba(255,194,74,0.9) 30%, #fff 50%, rgba(79,214,255,0.9) 70%, transparent)',
          boxShadow: '0 0 24px rgba(255,214,140,0.8)',
          borderRadius: 2,
        }}
      />
    </AbsoluteFill>
  );
};

const MusicFade: React.FC<{volume: number}> = ({volume}) => {
  const {durationInFrames} = useVideoConfig();
  useCurrentFrame();
  return (
    <Audio
      src={staticFile('music.mp3')}
      volume={(f) => volume * Math.min(1, f / 30) * Math.min(1, (durationInFrames - f) / 60)}
    />
  );
};

export const SimetriMolekul: React.FC<VideoProps> = ({showCaptions, musicVolume, voiceover}) => {
  return (
    <AbsoluteFill style={{backgroundColor: '#04060c'}}>
      <Background />
      {TIMELINE.scenes.map((s) => (
        <SceneSlot key={s.id} scene={s} />
      ))}
      <TransitionFlash />
      <ChapterHeading />
      {showCaptions ? <Captions /> : null}
      <Vignette />
      {musicVolume > 0 ? <MusicFade volume={musicVolume} /> : null}
      {voiceover
        ? TIMELINE.scenes.flatMap((s) =>
            s.tLines.map((l) => (
              <Sequence key={lineKey(s.id, l.index)} name={`VO ${lineKey(s.id, l.index)}`} from={Math.round(l.start * FPS)} layout="none">
                <Audio src={staticFile(`voiceover/${lineKey(s.id, l.index)}.mp3`)} />
              </Sequence>
            )),
          )
        : null}
    </AbsoluteFill>
  );
};

/** Versi 2K (2560×1440): seluruh film 1920×1080 diperbesar sebagai vektor, jadi tetap tajam. */
export const SimetriMolekul2K: React.FC<VideoProps> = (props) => (
  <AbsoluteFill style={{backgroundColor: '#04060c'}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${2560 / 1920})`, transformOrigin: '0 0'}}>
      <SimetriMolekul {...props} />
    </div>
  </AbsoluteFill>
);

/** Pratinjau satu scene saja (folder "Adegan" di Studio). */
export const SingleScene: React.FC<{sceneId: string}> = ({sceneId}) => {
  const scene = TIMELINE.scenes.find((s) => s.id === sceneId)!;
  return (
    <AbsoluteFill style={{backgroundColor: '#04060c'}}>
      <Sequence from={-Math.round(scene.start * FPS)} layout="absolute-fill">
        <Background />
        <SceneSlot scene={scene} />
        <ChapterHeading />
        <Captions />
        <Vignette />
      </Sequence>
    </AbsoluteFill>
  );
};
