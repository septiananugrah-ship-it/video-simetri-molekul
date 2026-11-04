// Render frame contoh dari setiap scene untuk pemeriksaan visual cepat.
// Pemakaian: node scripts/qa-stills.mjs [sceneId ...]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {mkdirSync} from 'node:fs';
import path from 'node:path';

const only = process.argv.slice(2);
const out = path.resolve('out/qa');
mkdirSync(out, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = process.env.CHROME_PATH ?? null;
const inputProps = {showCaptions: true, musicVolume: 0, voiceover: false};
const comp = await selectComposition({serveUrl, id: 'SimetriMolekul', inputProps, browserExecutable});
const {TIMELINE, FPS} = await import('../src/timeline.ts');
for (const s of TIMELINE.scenes) {
  if (only.length && !only.includes(s.id)) continue;
  const times = s.lineTimes.length
    ? s.lineTimes.map((l) => s.start + l.end - 0.2)
    : [s.start + s.duration * 0.3, s.start + s.duration * 0.7];
  for (const [i, sec] of times.entries()) {
    const frame = Math.min(comp.durationInFrames - 1, Math.round(sec * FPS));
    const file = path.join(out, `${String(s.index).padStart(2, '0')}-${s.id}-${String(i).padStart(2, '0')}.jpg`);
    await renderStill({serveUrl, composition: comp, frame, output: file, inputProps, imageFormat: 'jpeg', jpegQuality: 80, browserExecutable, scale: 0.5});
    console.log(file);
  }
}
