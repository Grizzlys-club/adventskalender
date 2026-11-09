import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarServer, openCount } from './server.mjs';
import { doors } from './doors.mjs';

test('every Zurich midnight unlocks exactly one door', () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Zurich', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  assert.equal(doors.length, 24);
  for (let day = 1; day <= 24; day++) {
    const midnight = Date.UTC(2026, 11, day - 1, 23);
    const parts = Object.fromEntries(formatter.formatToParts(midnight).map(({ type, value }) => [type, value]));
    assert.equal(Number(parts.day), day);
    assert.equal(parts.hour + parts.minute, '0000');
    assert.equal(openCount(midnight - 1), day - 1);
    assert.equal(openCount(midnight), day);
  }
  assert.equal(openCount(Date.UTC(2027, 0, 1)), 24);
});

test('HTTP gates content and persists one vote per anonymous cookie', async t => {
  const candidates = [{ id: 'a', title: 'Tor A' }, { id: 'b', title: 'Tor B' }];
  let now = Date.parse('2026-12-01T00:00:00+01:00') - 1;
  const server = calendarServer({ clock: () => now, database: ':memory:', candidates });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const fetchPath = (path, options) => fetch(`http://127.0.0.1:${server.address().port}${path}`, options);
  assert.match(await (await fetchPath('/')).text(), /Grizzlys Adventskalender 2026/);
  assert.equal((await (await fetchPath('/api/calendar')).json()).unlocked, 0);
  assert.equal((await fetchPath('/api/doors/1')).status, 423);
  assert.equal((await fetchPath('/api/doors/0')).status, 404);
  assert.equal((await fetchPath('/api/votes')).status, 423);
  now++;
  assert.equal((await fetchPath('/api/doors/1')).status, 200);
  assert.equal((await fetchPath('/api/doors/2')).status, 423);
  now = Date.parse('2026-12-24T00:00:00+01:00');
  for (let day = 1; day <= 24; day++) {
    const response = await fetchPath(`/api/doors/${day}`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal((await response.json()).title, doors[day - 1].title);
  }
  const cast = (goal, cookie) => fetchPath('/api/votes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify({ goal }),
  });
  assert.equal((await cast('unknown')).status, 400);
  const first = await cast('a');
  const cookie = first.headers.get('set-cookie').split(';')[0];
  assert.equal((await first.json()).selected, 'a');
  const repeat = await cast('b', cookie);
  assert.deepEqual(await repeat.json(), { selected: 'a', totals: [{ goal: 'a', total: 1 }] });
  const second = await cast('b');
  assert.equal((await second.json()).totals.length, 2);
});

test('word clues and the maze have solutions', () => {
  const word = doors[10];
  assert.equal(word.clues.map(([, answers], index) => answers[0][word.letters[index]]).join(''), word.secret[0]);
  const { maze } = doors[16];
  const y = maze.findIndex(row => row.includes('B'));
  const queue = [[maze[y].indexOf('B'), y]];
  const seen = new Set();
  let solved = false;
  while (queue.length) {
    const [x, y] = queue.shift();
    if (maze[y][x] === 'G') {
      solved = true;
      break;
    }
    for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (maze[ny]?.[nx] && maze[ny][nx] !== '#' && !seen.has(key)) {
        seen.add(key);
        queue.push([nx, ny]);
      }
    }
  }
  assert.ok(solved);
});
