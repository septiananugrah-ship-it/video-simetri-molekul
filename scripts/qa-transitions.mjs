// Render frame di sekitar setiap pergantian scene (−0.4 dtk, batas, +0.4 dtk) untuk memeriksa transisi.
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {mkdirSync} from 'node:fs';
import path from 'node:path';

const out = path.resolve('out/qa-trans');
mkdirSync(out, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = process.env.CHROME_PATH ?? null;
const inputProps = {showCaptions: true, musicVolume: 0, voiceover: false};
const comp = await selectComposition({serveUrl, id: 'SimetriMolekul', inputProps, browserExecutable});
const {TIMELINE, FPS} = await import('../src/timeline.ts');
for (const s of TIMELINE.scenes.slice(1)) {
  for (const [k, dt] of [-0.3, 0, 0.3].entries()) {
    const frame = Math.max(0, Math.min(comp.durationInFrames - 1, Math.round((s.start + dt) * FPS)));
    const file = path.join(out, `${String(s.index).padStart(2, '0')}-${s.id}-${k}.jpg`);
    await renderStill({serveUrl, composition: comp, frame, output: file, inputProps, imageFormat: 'jpeg', jpegQuality: 75, browserExecutable, scale: 0.4});
  }
}
console.log('done');
