import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';
import { doors } from './doors.mjs';
import { goals } from './media.mjs';

const timeZone = 'Europe/Zurich';
// In December Zurich is on CET, UTC+01:00.
const openingTimes = doors.map((_, index) =>
  Date.parse(`2026-12-${String(index + 1).padStart(2, '0')}T00:00:00+01:00`)
);
export const openCount = now => openingTimes.filter(time => time <= now).length;

const assets = new Map([
  ['/', ['index.html', 'text/html']],
  ['/style.css', ['style.css', 'text/css']],
  ['/app.js', ['app.js', 'text/javascript']],
  ['/api.js', ['api.js', 'text/javascript']],
  ['/effects.js', ['effects.js', 'text/javascript']],
  ['/activities.js', ['activities.js', 'text/javascript']],
  ['/winter.svg', ['winter.svg', 'image/svg+xml']],
]);
const cookieName = 'grizzlys_vote';
const ballotId = request => (request.headers.cookie ?? '')
  .match(/(?:^|;\s*)grizzlys_vote=([a-f0-9-]{36})(?:;|$)/)?.[1];

export function calendarServer({ clock = Date.now, database = 'votes.sqlite', candidates = goals } = {}) {
  let db;
  function votes() {
    if (!db) {
      db = new DatabaseSync(database);
      db.exec('CREATE TABLE IF NOT EXISTS votes (voter TEXT PRIMARY KEY, goal TEXT NOT NULL)');
    }
    return db;
  }

  const server = createServer(async (request, response) => {
    const json = (status, data) => {
      response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      response.end(JSON.stringify(data));
    };
    try {
      const path = new URL(request.url, 'http://calendar.local').pathname;
      const now = clock();
      const unlocked = openCount(now);
      if (request.method === 'GET' && path === '/api/calendar') {
        return json(200, { unlocked, now, next: openingTimes[unlocked] ?? null, timeZone });
      }
      const match = path.match(/^\/api\/doors\/(\d{1,2})$/);
      if (request.method === 'GET' && match) {
        const day = Number(match[1]);
        if (day < 1 || day > doors.length) return json(404, { error: 'Türchen nicht gefunden.' });
        if (day > unlocked) return json(423, { error: 'Dieses Türchen ist noch geschlossen.' });
        if (day === 18) return json(200, { ...doors[17], candidates });
        return json(200, doors[day - 1]);
      }
      if (path === '/api/votes' && ['GET', 'POST'].includes(request.method)) {
        if (unlocked < 18) return json(423, { error: 'Die Abstimmung beginnt am 18. Dezember.' });
        if (candidates.length < 2) return json(409, { error: 'Die Abstimmung ist noch nicht eingerichtet.' });
        let voter = ballotId(request);
        if (request.method === 'POST') {
          if (request.headers['sec-fetch-site'] === 'cross-site' ||
              request.headers['content-type']?.split(';')[0] !== 'application/json') {
            return json(415, { error: 'Ungültige Anfrage.' });
          }
          let body = '';
          for await (const chunk of request) {
            body += chunk;
            if (body.length > 512) return json(413, { error: 'Anfrage zu gross.' });
          }
          let goal;
          try { goal = JSON.parse(body)?.goal; } catch { return json(400, { error: 'Ungültige Stimme.' }); }
          if (!candidates.some(item => item.id === goal)) return json(400, { error: 'Tor nicht gefunden.' });
          voter ??= randomUUID();
          votes().prepare('INSERT OR IGNORE INTO votes (voter, goal) VALUES (?, ?)').run(voter, goal);
          const secure = request.socket.encrypted || request.headers['x-forwarded-proto'] === 'https';
          response.setHeader('Set-Cookie', `${cookieName}=${voter}; HttpOnly; SameSite=Strict; Path=/api/votes; Max-Age=2592000${secure ? '; Secure' : ''}`);
        }
        const selected = voter ? votes().prepare('SELECT goal FROM votes WHERE voter = ?').get(voter)?.goal : null;
        const totals = selected ? votes().prepare('SELECT goal, COUNT(*) AS total FROM votes GROUP BY goal').all() : [];
        return json(200, { selected: selected ?? null, totals });
      }
      if (request.method !== 'GET' || !assets.has(path)) return json(404, { error: 'Seite nicht gefunden.' });
      const [file, type] = assets.get(path);
      const data = await readFile(new URL(`./public/${file}`, import.meta.url));
      response.writeHead(200, {
        'Content-Type': `${type}; charset=utf-8`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache',
      });
      response.end(data);
    } catch (error) {
      console.error(error);
      if (!response.headersSent) json(500, { error: 'Der Kalender ist gerade nicht erreichbar.' });
      else response.end();
    }
  });
  server.on('close', () => db?.close());
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 3000);
  calendarServer({ database: process.env.VOTES_DB ?? 'votes.sqlite' }).listen(port, '0.0.0.0', () =>
    console.log(`Grizzlys Adventskalender läuft auf Port ${port}.`)
  );
}
