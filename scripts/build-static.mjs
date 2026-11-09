// Baut eine Kopie der Seite für reinen Webspace (zum Beispiel GitHub Pages) nach dist/.
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { doors } from '../doors.mjs';
import { goals } from '../media.mjs';

const out = new URL('../dist/', import.meta.url);
await rm(out, { recursive: true, force: true });
await cp(new URL('../public/', import.meta.url), out, { recursive: true });
await mkdir(new URL('data/', out), { recursive: true });
// Türchen 18 bringt die nominierten Tore mit, wie die Server-Antwort auch.
const data = doors.map((door, index) => (index === 17 ? { ...door, candidates: goals } : door));
await writeFile(new URL('data/doors.json', out), JSON.stringify(data));
// Ohne diese Datei würde GitHub Pages die Dateien durch Jekyll schicken.
await writeFile(new URL('.nojekyll', out), '');
console.log(`dist/ ist fertig: ${data.length} Türchen.`);
