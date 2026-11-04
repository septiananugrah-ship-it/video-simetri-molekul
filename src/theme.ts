import '@fontsource/outfit/300.css';
import '@fontsource/outfit/400.css';
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';
import '@fontsource/outfit/800.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/source-serif-4/400-italic.css';
import '@fontsource/source-serif-4/600-italic.css';
import '@fontsource/source-serif-4/400.css';

export const W = 1920;
export const H = 1080;

export const C = {
  bg: '#04060c',
  bg2: '#0a1124',
  ink: '#eef2ff',
  muted: '#8c96bb',
  faint: '#3a4466',
  gold: '#ffc24a',
  amber: '#ff8f3a',
  cyan: '#4fd6ff',
  blue: '#5b8cff',
  violet: '#a083ff',
  mint: '#5ef0b0',
  red: '#ff5470',
  pink: '#ff7ad9',
};

export const FONT = {
  sans: 'Outfit, system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
  serif: '"Source Serif 4", Georgia, serif',
};

// Warna atom (konvensi CPK, disesuaikan untuk latar gelap)
export const ATOM: Record<string, {fill: string; glow: string; r: number}> = {
  H: {fill: '#f2f5ff', glow: '#bcd0ff', r: 30},
  D: {fill: '#c9b8ff', glow: '#a083ff', r: 34},
  C: {fill: '#4a5266', glow: '#8ea0c8', r: 42},
  O: {fill: '#ff4d63', glow: '#ff8a9a', r: 42},
  N: {fill: '#4f7dff', glow: '#9fb8ff', r: 42},
  Cl: {fill: '#4fdc7a', glow: '#9cffb9', r: 52},
};

export const MOOD_TINT: Record<string, string> = {
  mystery: '#1d2a5a',
  title: '#4a2f0a',
  wonder: '#0e3a52',
  build: '#16264f',
  quantum: '#2c1a5a',
  tension: '#3d1430',
  bright: '#3a2408',
  resolve: '#103a35',
  outro: '#1a1f3a',
};
