import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

const FILES = ['index.html', 'admin.html', 'styles.css', 'app.js', 'admin.js', 'data.json', 'mawaqit-data.json'];

fs.mkdirSync(publicDir, { recursive: true });
for (const f of FILES) {
  fs.copyFileSync(path.join(rootDir, f), path.join(publicDir, f));
}

const assetsSrc = path.join(rootDir, 'assets');
const assetsDest = path.join(publicDir, 'assets');
if (fs.existsSync(assetsSrc)) {
  fs.cpSync(assetsSrc, assetsDest, { recursive: true });
}

console.log('✅ [Build] Dossier public/ de la Mosquée de la Paix prêt.');
