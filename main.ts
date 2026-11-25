// Hearthside Kitchen — the entrypoint (Node 22, standard library only).
// It hands the game in: game/ and screenshots/ are copied from beside this file to
// /output (or MAKEFUN_OUTPUT_DIR outside the grader), and dossier.json is written
// with the vendored make.fun library, exactly as the gate rebuilds it.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const gameDir = join(repoRoot, 'game');
const shotsDir = join(repoRoot, 'screenshots');

if (existsSync(outputDir)) rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });

cpSync(gameDir, join(outputDir, 'game'), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

// The gate's caps, so a run that would fail the gate fails here first:
// at most 4 screenshots of 256 KiB, game/ within 993 entries and 48 MiB.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
const gameFiles = countFiles(gameDir);
const shotFiles = existsSync(shotsDir) ? countFiles(shotsDir) : 0;
console.log(`wrote ${join(outputDir, 'dossier.json')} (${dossier.length} bytes) from ${gameFiles} game files and ${shotFiles} screenshots`);

function countFiles(dir) {
  let count = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    count += entry.isDirectory() ? countFiles(join(dir, entry.name)) : 1;
  }
  return count;
}
