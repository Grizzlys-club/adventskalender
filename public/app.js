import { mountActivity } from './activities.js';

const grid = document.querySelector('#doors');
const count = document.querySelector('#count');
const countdown = document.querySelector('#countdown');
const dialog = document.querySelector('#door-dialog');
const content = document.querySelector('#activity');
const date = new Intl.DateTimeFormat('de-CH', { day: 'numeric', month: 'long', timeZone: 'Europe/Zurich' });
let calendar;
let syncedAt = 0;
let refreshing = false;
let active;
let lastTrigger;

const doors = Array.from({ length: 24 }, (_, index) => {
  const day = index + 1;
  const button = document.createElement('button');
  button.className = 'door';
  button.disabled = true;
  const number = document.createElement('b');
  number.textContent = String(day).padStart(2, '0');
  const label = document.createElement('span');
  label.textContent = 'Geschlossen';
  button.append(number, label);
  button.addEventListener('click', () => openDoor(day, button));
  grid.append(button);
  return { button, label };
});

async function refresh() {
  if (refreshing) return;
  refreshing = true;
  try {
    const response = await fetch('/api/calendar');
    if (!response.ok) throw new Error();
    calendar = await response.json();
    syncedAt = performance.now();
    count.textContent = `${calendar.unlocked} / 24 offen`;
    doors.forEach(({ button, label }, index) => {
      const open = index < calendar.unlocked;
      button.disabled = !open;
      button.dataset.open = open;
      label.textContent = open ? 'Türchen öffnen' : 'Geschlossen';
      button.setAttribute('aria-label', `Türchen ${index + 1}, ${open ? 'öffnen' : 'geschlossen'}`);
    });
    updateCountdown();
  } catch {
    countdown.textContent = 'Kalenderzeit nicht erreichbar. Neuer Versuch folgt.';
  } finally {
    refreshing = false;
  }
}

function updateCountdown() {
  if (!calendar) return;
  if (calendar.next === null) {
    countdown.textContent = 'Alle Türchen bleiben offen.';
    return;
  }
  const remaining = calendar.next - calendar.now - (performance.now() - syncedAt);
  if (remaining <= 0) {
    countdown.textContent = 'Nächstes Türchen wird freigeschaltet …';
    return;
  }
  const minutes = Math.ceil(remaining / 60000);
  const duration = minutes >= 1440 ? `${Math.floor(minutes / 1440)} T ${Math.floor(minutes % 1440 / 60)} Std`
    : minutes >= 60 ? `${Math.floor(minutes / 60)} Std ${minutes % 60} Min`
      : `${minutes} Min`;
  const message = `${date.format(calendar.next)} · in ${duration}`;
  if (countdown.textContent !== message) countdown.textContent = message;
}

async function openDoor(day, trigger) {
  if (dialog.open) return;
  lastTrigger = trigger;
  active = new AbortController();
  const { signal } = active;
  document.querySelector('#door-tag').textContent = `${day}. Dezember`;
  document.querySelector('#door-title').textContent = 'Türchen wird geladen';
  document.querySelector('#door-intro').textContent = '';
  content.replaceChildren();
  dialog.showModal();
  try {
    const response = await fetch(`/api/doors/${day}`, { signal });
    const door = await response.json();
    if (signal.aborted) return;
    if (!response.ok) throw new Error(door.error);
    document.querySelector('#door-tag').textContent = `${day}. Dezember · ${door.type}`;
    document.querySelector('#door-title').textContent = door.title;
    document.querySelector('#door-intro').textContent = door.intro;
    mountActivity(content, door, signal, next => {
      dialog.close();
      // Wait for the previous activity's close event before opening another door.
      dialog.addEventListener('close', () => openDoor(next, doors[next - 1].button), { once: true });
    });
  } catch (error) {
    if (!signal.aborted) content.textContent = error.message || 'Das Türchen konnte nicht geladen werden.';
  }
}
dialog.addEventListener('close', () => {
  active?.abort();
  content.replaceChildren();
  lastTrigger?.focus();
});

void refresh();
setInterval(() => {
  if (!calendar || performance.now() - syncedAt >= 30000 ||
      (calendar.next !== null && calendar.now + performance.now() - syncedAt >= calendar.next)) {
    void refresh();
  }
  updateCountdown();
}, 1000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) void refresh();
});
