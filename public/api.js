// Spricht mit dem Node-Server, wenn es einen gibt. Auf einem reinen Webspace
// (zum Beispiel GitHub Pages) liegt stattdessen data/doors.json bereit, und
// dieselben Antworten werden direkt im Browser nachgebildet.
const base = new URL('./', import.meta.url);
const timeZone = 'Europe/Zurich';
// Im Dezember gilt in Zürich MEZ, also UTC+01:00.
const opening = Array.from({ length: 24 }, (_, index) =>
  Date.parse(`2026-12-${String(index + 1).padStart(2, '0')}T00:00:00+01:00`));

const json = (status, data) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8' },
});

let mode;
async function detect() {
  try {
    await loadDoors();
    return 'static';
  } catch { /* keine statischen Daten, also gibt es einen Server */ }
  return 'server';
}

let doorData;
function loadDoors() {
  doorData ??= fetch(new URL('data/doors.json', base)).then(async response => {
    // Den Inhalt immer ganz lesen, sonst bleibt die Anfrage offen.
    const text = await response.text();
    if (!response.ok) throw new Error('Die Türchen-Daten fehlen.');
    return JSON.parse(text);
  }).catch(error => {
    doorData = undefined;
    throw error;
  });
  return doorData;
}

// ?vorschau=24 öffnet im statischen Betrieb alle Türchen bis zu dieser Nummer.
function previewDays() {
  const days = Number(new URLSearchParams(location.search).get('vorschau'));
  return Number.isInteger(days) && days >= 1 && days <= 24 ? days : 0;
}

async function staticApi(path) {
  const now = Date.now();
  const preview = previewDays();
  const unlocked = preview || opening.filter(time => time <= now).length;
  if (path === 'api/calendar') {
    return json(200, { unlocked, now, next: preview ? null : opening[unlocked] ?? null, timeZone, preview: Boolean(preview) });
  }
  const match = path.match(/^api\/doors\/(\d{1,2})$/);
  if (match) {
    const day = Number(match[1]);
    if (day < 1 || day > 24) return json(404, { error: 'Türchen nicht gefunden.' });
    if (day > unlocked) return json(423, { error: 'Dieses Türchen ist noch geschlossen.' });
    try {
      return json(200, (await loadDoors())[day - 1]);
    } catch (error) {
      return json(500, { error: error.message });
    }
  }
  if (path === 'api/votes') {
    if (unlocked < 18) return json(423, { error: 'Die Abstimmung beginnt am 18. Dezember.' });
    try {
      if (((await loadDoors())[17].candidates ?? []).length < 2) {
        return json(409, { error: 'Die Abstimmung ist noch nicht eingerichtet.' });
      }
    } catch (error) {
      return json(500, { error: error.message });
    }
    return json(409, { error: 'Die gemeinsame Abstimmung braucht den Vereinsserver und läuft auf dieser Seite nicht.' });
  }
  return json(404, { error: 'Nicht gefunden.' });
}

export async function apiFetch(path, init) {
  mode ??= detect();
  if (await mode === 'server') return fetch(new URL(path, base), init);
  return staticApi(path);
}
